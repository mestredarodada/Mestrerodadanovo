import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq } from 'drizzle-orm';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const FOOTBALL_BASE = 'https://api.football-data.org/v4';

// Intervalo entre geração de cada jogo (2 minutos)
const INTERVAL_BETWEEN_MATCHES_MS = 2 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFootballHeaders() {
  const key = process.env.FOOTBALL_DATA_API_KEY || '';
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY não configurada');
  return { 'X-Auth-Token': key };
}

function buildFormString(matches: any[], teamId: number): string {
  const sorted = [...matches]
    .filter(m => m.status === 'FINISHED' &&
      (m.homeTeam.id === teamId || m.awayTeam.id === teamId))
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 5);

  if (sorted.length === 0) return 'N/D';

  return sorted.map(m => {
    const isHome = m.homeTeam.id === teamId;
    const hg = m.score?.fullTime?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? 0;
    if (isHome) return hg > ag ? 'V' : hg === ag ? 'E' : 'D';
    return ag > hg ? 'V' : ag === hg ? 'E' : 'D';
  }).join('');
}

function calcGoalAverages(matches: any[], teamId: number, last = 5) {
  const finished = [...matches]
    .filter(m => m.status === 'FINISHED' &&
      (m.homeTeam.id === teamId || m.awayTeam.id === teamId))
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, last);

  if (finished.length === 0) return { scored: 0, conceded: 0, btts: 0, games: 0 };

  let scored = 0, conceded = 0, bttsCount = 0;
  for (const m of finished) {
    const isHome = m.homeTeam.id === teamId;
    const goalsFor = isHome ? (m.score?.fullTime?.home ?? 0) : (m.score?.fullTime?.away ?? 0);
    const goalsAgainst = isHome ? (m.score?.fullTime?.away ?? 0) : (m.score?.fullTime?.home ?? 0);
    scored += goalsFor;
    conceded += goalsAgainst;
    if (goalsFor > 0 && goalsAgainst > 0) bttsCount++;
  }

  return {
    scored: +(scored / finished.length).toFixed(1),
    conceded: +(conceded / finished.length).toFixed(1),
    btts: Math.round((bttsCount / finished.length) * 100),
    games: finished.length,
  };
}

// ─── Buscar dados base do Brasileirão (2 requisições) ─────────────────────────

async function fetchBaseData() {
  const headers = getFootballHeaders();

  console.log('[Mestre] Buscando dados base do Brasileirão...');

  const standingsRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/standings`,
    { headers, timeout: 15000 }
  );

  // Aguarda 7s para respeitar o rate limit antes da próxima requisição
  await sleep(7000);

  const finishedRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/matches?status=FINISHED&limit=100`,
    { headers, timeout: 15000 }
  );

  const standings: any[] = standingsRes.data.standings[0]?.table || [];
  const finishedMatches: any[] = finishedRes.data.matches || [];

  console.log(`[Mestre] ${standings.length} times na tabela, ${finishedMatches.length} jogos finalizados carregados`);

  return { standings, finishedMatches };
}

// ─── Buscar próximo jogo sem palpite ─────────────────────────────────────────

async function fetchNextMatchWithoutPrediction(): Promise<any | null> {
  const headers = getFootballHeaders();

  const res = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/matches?status=SCHEDULED`,
    { headers, timeout: 15000 }
  );

  const scheduledMatches: any[] = res.data.matches || [];

  if (scheduledMatches.length === 0) {
    console.log('[Mestre] Nenhum jogo agendado encontrado.');
    return null;
  }

  // Verifica quais jogos já têm palpite no banco
  for (const match of scheduledMatches) {
    const existing = await db
      .select({ id: predictionsSimple.id, createdAt: predictionsSimple.createdAt })
      .from(predictionsSimple)
      .where(eq(predictionsSimple.matchId, String(match.id)));

    if (existing.length === 0) {
      console.log(`[Mestre] Próximo jogo sem palpite: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      return match;
    }

    // Verifica se o palpite é recente (menos de 20h)
    const createdAt = new Date(existing[0].createdAt);
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      console.log(`[Mestre] ⏭️  Já tem palpite (${hoursSince.toFixed(1)}h): ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      continue;
    }

    // Palpite antigo (>20h) — pode atualizar
    console.log(`[Mestre] Palpite desatualizado (${hoursSince.toFixed(1)}h): ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    return match;
  }

  console.log('[Mestre] Todos os jogos agendados já têm palpites recentes.');
  return null;
}

// ─── Montar prompt rico para a IA ─────────────────────────────────────────────

function buildRichPrompt(match: any, standings: any[], finishedMatches: any[]): string {
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;

  const homeStanding = standings.find((s: any) => s.team.id === homeId);
  const awayStanding = standings.find((s: any) => s.team.id === awayId);

  const homePos = homeStanding ? `${homeStanding.position}º lugar, ${homeStanding.points} pts` : 'N/D';
  const awayPos = awayStanding ? `${awayStanding.position}º lugar, ${awayStanding.points} pts` : 'N/D';

  const homeRecord = homeStanding
    ? `${homeStanding.won}V/${homeStanding.draw}E/${homeStanding.lost}D — ${homeStanding.goalsFor} gols marcados, ${homeStanding.goalsAgainst} sofridos (saldo ${homeStanding.goalDifference > 0 ? '+' : ''}${homeStanding.goalDifference})`
    : 'N/D';
  const awayRecord = awayStanding
    ? `${awayStanding.won}V/${awayStanding.draw}E/${awayStanding.lost}D — ${awayStanding.goalsFor} gols marcados, ${awayStanding.goalsAgainst} sofridos (saldo ${awayStanding.goalDifference > 0 ? '+' : ''}${awayStanding.goalDifference})`
    : 'N/D';

  const homeForm = buildFormString(finishedMatches, homeId);
  const awayForm = buildFormString(finishedMatches, awayId);
  const homeAvg = calcGoalAverages(finishedMatches, homeId);
  const awayAvg = calcGoalAverages(finishedMatches, awayId);

  // H2H
  const h2hMatches = finishedMatches
    .filter(m =>
      (m.homeTeam.id === homeId && m.awayTeam.id === awayId) ||
      (m.homeTeam.id === awayId && m.awayTeam.id === homeId)
    )
    .slice(0, 5);

  let h2hSummary = 'Sem confrontos diretos recentes';
  if (h2hMatches.length > 0) {
    let homeWins = 0, draws = 0, awayWins = 0;
    const details: string[] = [];
    for (const m of h2hMatches) {
      const hg = m.score?.fullTime?.home ?? 0;
      const ag = m.score?.fullTime?.away ?? 0;
      const homeIsHome = m.homeTeam.id === homeId;
      const hGoals = homeIsHome ? hg : ag;
      const aGoals = homeIsHome ? ag : hg;
      details.push(`${hGoals}x${aGoals}`);
      if (hGoals === aGoals) draws++;
      else if (hGoals > aGoals) homeWins++;
      else awayWins++;
    }
    h2hSummary = `${h2hMatches.length} jogos: ${home} ${homeWins}V / ${draws}E / ${awayWins}V ${away} (placares: ${details.join(', ')})`;
  }

  const expectedGoals = +(homeAvg.scored + awayAvg.scored).toFixed(1);
  const btsPct = Math.round((homeAvg.btts + awayAvg.btts) / 2);

  const matchDateStr = new Date(match.utcDate).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return `=== JOGO: ${home} x ${away} ===
📅 ${matchDateStr} | Rodada ${match.matchday || 'N/D'} — Brasileirão Série A

━━━ CLASSIFICAÇÃO ━━━
🏠 ${home}: ${homePos} | ${homeRecord}
✈️  ${away}: ${awayPos} | ${awayRecord}

━━━ FORMA RECENTE (últimos 5 jogos) ━━━
🏠 ${home}: ${homeForm}
✈️  ${away}: ${awayForm}
(V=Vitória, E=Empate, D=Derrota — leitura da esquerda para direita: mais recente primeiro)

━━━ MÉDIAS DE GOLS ━━━
🏠 ${home}: ${homeAvg.scored} marcados/jogo, ${homeAvg.conceded} sofridos/jogo${homeAvg.games > 0 ? `, ${homeAvg.btts}% com ambas marcando` : ''}
✈️  ${away}: ${awayAvg.scored} marcados/jogo, ${awayAvg.conceded} sofridos/jogo${awayAvg.games > 0 ? `, ${awayAvg.btts}% com ambas marcando` : ''}

━━━ CONFRONTO DIRETO (H2H) ━━━
${h2hSummary}

━━━ CONTEXTO ━━━
• Gols esperados no jogo: ~${expectedGoals}
• Probabilidade estimada de ambas marcarem: ${btsPct}%
• ${home} joga em casa (fator mandante)

Analise com base nesses dados reais e forneça palpites específicos e fundamentados para este jogo.`;
}

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────

async function generatePredictionWithAI(prompt: string): Promise<any> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');

  const systemPrompt = `Você é o Mestre da Rodada, o mais respeitado analista de futebol brasileiro. Você analisa dados reais e fornece palpites ESPECÍFICOS para cada jogo — nunca genéricos ou repetitivos.

REGRAS:
1. Use os dados fornecidos. Cada jogo é único.
2. Mencione dados específicos na justificativa (forma recente, médias, H2H).
3. Não repita os mesmos palpites para todos os jogos — use os dados para diferenciar.
4. Retorne APENAS JSON válido, sem texto adicional, sem markdown.

JSON obrigatório:
{
  "mainPrediction": "HOME" | "DRAW" | "AWAY",
  "mainConfidence": "HIGH" | "MEDIUM" | "LOW",
  "mainProbability": número 0-100,
  "goalsPrediction": "OVER_2_5" | "UNDER_2_5",
  "goalsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "goalsProbability": número 0-100,
  "bothTeamsToScore": "YES" | "NO",
  "bothTeamsToScoreConfidence": "HIGH" | "MEDIUM" | "LOW",
  "btsProbability": número 0-100,
  "cornersPrediction": "OVER_9" | "UNDER_9",
  "cornersConfidence": "HIGH" | "MEDIUM" | "LOW",
  "cardsPrediction": "OVER_4_5" | "UNDER_4_5",
  "cardsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "extraTip": "dica extra específica em português para este jogo",
  "extraConfidence": "HIGH" | "MEDIUM" | "LOW",
  "justification": "análise detalhada em português com mínimo 4 frases citando dados específicos do jogo"
}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');
  return JSON.parse(jsonMatch[0]);
}

// ─── Salvar palpite no banco ──────────────────────────────────────────────────

async function savePrediction(match: any, aiPrediction: any): Promise<'saved' | 'updated'> {
  const predictionData = {
    matchId: String(match.id),
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    homeTeamCrest: match.homeTeam.crest || null,
    awayTeamCrest: match.awayTeam.crest || null,
    matchDate: new Date(match.utcDate),
    mainPrediction: aiPrediction.mainPrediction,
    mainConfidence: aiPrediction.mainConfidence,
    goalsPrediction: aiPrediction.goalsPrediction,
    goalsConfidence: aiPrediction.goalsConfidence,
    bothTeamsToScore: aiPrediction.bothTeamsToScore || null,
    bothTeamsToScoreConfidence: aiPrediction.bothTeamsToScoreConfidence || null,
    cornersPrediction: aiPrediction.cornersPrediction || null,
    cornersConfidence: aiPrediction.cornersConfidence || null,
    cardsPrediction: aiPrediction.cardsPrediction || null,
    cardsConfidence: aiPrediction.cardsConfidence || null,
    extraTip: aiPrediction.extraTip || null,
    extraConfidence: aiPrediction.extraConfidence || null,
    justification: aiPrediction.justification || '',
    isPublished: true,
  };

  const existing = await db
    .select({ id: predictionsSimple.id })
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, predictionData.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(predictionData);
    console.log(`✅ [Mestre] Palpite CRIADO: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    return 'saved';
  } else {
    await db
      .update(predictionsSimple)
      .set({ ...predictionData, isPublished: true })
      .where(eq(predictionsSimple.matchId, predictionData.matchId));
    console.log(`🔄 [Mestre] Palpite ATUALIZADO: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    return 'updated';
  }
}

// ─── Gerar palpite de UM jogo por vez ─────────────────────────────────────────
// Esta função é chamada pelo job agendado a cada 2 minutos.
// Ela busca o próximo jogo sem palpite, gera e salva.
// Se todos já tiverem palpite, não faz nada.

export async function generateNextPrediction(): Promise<{ status: 'generated' | 'skipped' | 'error'; match?: string; error?: string }> {
  console.log('\n[Mestre] ⏰ Job iniciado — verificando próximo jogo sem palpite...');

  try {
    // 1. Busca o próximo jogo sem palpite (1 requisição à API)
    const match = await fetchNextMatchWithoutPrediction();

    if (!match) {
      console.log('[Mestre] ✅ Todos os jogos já têm palpites. Nada a fazer.');
      return { status: 'skipped' };
    }

    // 2. Busca dados base (classificação + jogos finalizados) — 2 requisições com delay
    const { standings, finishedMatches } = await fetchBaseData();

    // 3. Monta prompt rico
    const prompt = buildRichPrompt(match, standings, finishedMatches);

    // 4. Gera palpite com IA
    console.log(`[Mestre] 🤖 Gerando palpite para: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    const aiPrediction = await generatePredictionWithAI(prompt);

    // 5. Salva no banco (publicado automaticamente)
    await savePrediction(match, aiPrediction);

    const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    console.log(`[Mestre] ✅ Palpite gerado com sucesso: ${matchName}`);
    return { status: 'generated', match: matchName };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Mestre] ❌ Erro ao gerar palpite: ${msg}`);
    return { status: 'error', error: msg };
  }
}

// ─── Função legada (compatibilidade) ─────────────────────────────────────────
// Mantida para não quebrar chamadas existentes. Agora usa o job sequencial.

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
  console.log('[Mestre] generateAllPredictions chamado — iniciando geração sequencial...');

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Configure no Render > Environment.');
  }
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY não configurada. Configure no Render > Environment.');
  }

  let generated = 0;
  let errors = 0;
  let skipped = 0;

  // Gera palpites um por um com intervalo de 2 minutos
  // (máximo 8 jogos = ~16 minutos no total)
  for (let i = 0; i < 8; i++) {
    const result = await generateNextPrediction();

    if (result.status === 'generated') generated++;
    else if (result.status === 'skipped') {
      skipped++;
      break; // Todos os jogos já têm palpite, para o loop
    } else {
      errors++;
    }

    // Aguarda 2 minutos antes do próximo jogo (exceto no último)
    if (i < 7 && result.status !== 'skipped') {
      console.log(`[Mestre] ⏳ Aguardando ${INTERVAL_BETWEEN_MATCHES_MS / 1000}s antes do próximo jogo...`);
      await sleep(INTERVAL_BETWEEN_MATCHES_MS);
    }
  }

  console.log(`[Mestre] Concluído: ${generated} gerados, ${skipped} pulados, ${errors} erros`);
  return { generated, errors, skipped };
}
