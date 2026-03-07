import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq } from 'drizzle-orm';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const FOOTBALL_BASE = 'https://api.football-data.org/v4';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFootballHeaders() {
  const key = process.env.FOOTBALL_DATA_API_KEY || '';
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY não configurada');
  return { 'X-Auth-Token': key };
}

// Converte resultados de partidas em string de forma (ex: "VVEEV")
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

// Calcula médias de gols a partir dos jogos recentes disponíveis
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

// ─── Buscar TODOS os dados do Brasileirão em 3 chamadas ───────────────────────
// Estratégia: fazer apenas 3 requisições para toda a rodada, não por jogo

async function fetchAllBrazileiraoData() {
  const headers = getFootballHeaders();

  console.log('[Mestre] Buscando dados do Brasileirão (3 requisições)...');

  // 1ª requisição: classificação
  const standingsRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/standings`,
    { headers, timeout: 15000 }
  );
  await sleep(6500); // Respeita rate limit: 10 req/min = 1 req a cada 6s

  // 2ª requisição: próximos jogos agendados
  const scheduledRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/matches?status=SCHEDULED`,
    { headers, timeout: 15000 }
  );
  await sleep(6500);

  // 3ª requisição: jogos finalizados recentes (para calcular forma e médias)
  const finishedRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/matches?status=FINISHED&limit=100`,
    { headers, timeout: 15000 }
  );

  const standings: any[] = standingsRes.data.standings[0]?.table || [];
  const scheduledMatches: any[] = scheduledRes.data.matches || [];
  const finishedMatches: any[] = finishedRes.data.matches || [];

  console.log(`[Mestre] ${scheduledMatches.length} jogos agendados, ${finishedMatches.length} jogos finalizados, ${standings.length} times`);

  return { standings, scheduledMatches, finishedMatches };
}

// ─── Montar prompt rico para a IA ─────────────────────────────────────────────

function buildRichPrompt(
  match: any,
  standings: any[],
  finishedMatches: any[]
): string {
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;

  // Dados de classificação
  const homeStanding = standings.find((s: any) => s.team.id === homeId);
  const awayStanding = standings.find((s: any) => s.team.id === awayId);

  const homePos = homeStanding ? `${homeStanding.position}º lugar, ${homeStanding.points} pts` : 'Posição não disponível';
  const awayPos = awayStanding ? `${awayStanding.position}º lugar, ${awayStanding.points} pts` : 'Posição não disponível';

  const homeRecord = homeStanding
    ? `${homeStanding.won}V / ${homeStanding.draw}E / ${homeStanding.lost}D — Gols: ${homeStanding.goalsFor} marcados, ${homeStanding.goalsAgainst} sofridos (saldo: ${homeStanding.goalDifference})`
    : 'Dados não disponíveis';
  const awayRecord = awayStanding
    ? `${awayStanding.won}V / ${awayStanding.draw}E / ${awayStanding.lost}D — Gols: ${awayStanding.goalsFor} marcados, ${awayStanding.goalsAgainst} sofridos (saldo: ${awayStanding.goalDifference})`
    : 'Dados não disponíveis';

  // Forma recente (usando jogos finalizados disponíveis)
  const homeForm = buildFormString(finishedMatches, homeId);
  const awayForm = buildFormString(finishedMatches, awayId);

  // Médias de gols
  const homeAvg = calcGoalAverages(finishedMatches, homeId);
  const awayAvg = calcGoalAverages(finishedMatches, awayId);

  // Confronto direto H2H
  const h2hMatches = finishedMatches
    .filter(m =>
      (m.homeTeam.id === homeId && m.awayTeam.id === awayId) ||
      (m.homeTeam.id === awayId && m.awayTeam.id === homeId)
    )
    .slice(0, 5);

  let h2hSummary = 'Sem confrontos diretos recentes disponíveis';
  if (h2hMatches.length > 0) {
    let homeWins = 0, draws = 0, awayWins = 0;
    const h2hDetails: string[] = [];
    for (const m of h2hMatches) {
      const hg = m.score?.fullTime?.home ?? 0;
      const ag = m.score?.fullTime?.away ?? 0;
      const homeIsHome = m.homeTeam.id === homeId;
      const homeGoals = homeIsHome ? hg : ag;
      const awayGoals = homeIsHome ? ag : hg;
      h2hDetails.push(`${homeGoals}x${awayGoals}`);
      if (homeGoals === awayGoals) draws++;
      else if (homeGoals > awayGoals) homeWins++;
      else awayWins++;
    }
    h2hSummary = `Últimos ${h2hMatches.length} confrontos: ${home} venceu ${homeWins}x, Empates ${draws}x, ${away} venceu ${awayWins}x (placares: ${h2hDetails.join(', ')})`;
  }

  // Probabilidade estimada de gols
  const expectedGoals = +(homeAvg.scored + awayAvg.scored).toFixed(1);
  const btsPct = Math.round((homeAvg.btts + awayAvg.btts) / 2);

  const matchDateStr = new Date(match.utcDate).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return `=== JOGO: ${home} x ${away} ===
📅 ${matchDateStr} | Rodada ${match.matchday || 'N/D'} — Brasileirão Série A

━━━ CLASSIFICAÇÃO ATUAL ━━━
🏠 ${home} (Mandante): ${homePos}
   ${homeRecord}

✈️  ${away} (Visitante): ${awayPos}
   ${awayRecord}

━━━ FORMA RECENTE (últimos jogos) ━━━
🏠 ${home}: ${homeForm} (V=Vitória, E=Empate, D=Derrota)
✈️  ${away}: ${awayForm}

━━━ MÉDIAS DOS ÚLTIMOS JOGOS ━━━
🏠 ${home}: ${homeAvg.scored} gols marcados/jogo, ${homeAvg.conceded} sofridos/jogo${homeAvg.games > 0 ? ` (${homeAvg.btts}% dos jogos com ambas marcando)` : ''}
✈️  ${away}: ${awayAvg.scored} gols marcados/jogo, ${awayAvg.conceded} sofridos/jogo${awayAvg.games > 0 ? ` (${awayAvg.btts}% dos jogos com ambas marcando)` : ''}

━━━ CONFRONTO DIRETO (H2H) ━━━
${h2hSummary}

━━━ CONTEXTO CALCULADO ━━━
• Média de gols esperada no jogo: ${expectedGoals} gols
• Probabilidade estimada de ambas marcarem: ${btsPct}%
• Fator mandante: ${home} joga em casa

Analise este jogo com base nos dados acima e forneça palpites diferenciados e fundamentados.`;
}

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────

async function generatePredictionWithAI(prompt: string): Promise<any> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');

  const systemPrompt = `Você é o Mestre da Rodada, o mais respeitado analista de futebol brasileiro. Você analisa dados reais e fornece palpites ESPECÍFICOS para cada jogo — nunca genéricos.

REGRAS:
1. Use os dados fornecidos. Cada jogo é único — não repita os mesmos palpites.
2. Mencione dados específicos na justificativa (ex: "O Flamengo marcou em 4 dos últimos 5 jogos").
3. Considere forma recente, médias de gols, H2H e posição na tabela.
4. Retorne APENAS JSON válido, sem texto adicional.

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
  "justification": "análise detalhada em português (mínimo 4 frases) citando dados específicos do jogo"
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

async function savePrediction(match: any, aiPrediction: any): Promise<'saved' | 'updated' | 'skipped'> {
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
    .select()
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, predictionData.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(predictionData);
    console.log(`✅ Criado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    return 'saved';
  }

  const createdAt = new Date(existing[0].createdAt);
  const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince < 20) {
    console.log(`⏭️  Recente (${hoursSince.toFixed(1)}h), pulando: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    return 'skipped';
  }

  await db
    .update(predictionsSimple)
    .set({ ...predictionData, isPublished: true })
    .where(eq(predictionsSimple.matchId, predictionData.matchId));
  console.log(`🔄 Atualizado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
  return 'updated';
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
  console.log('\n🚀 [Mestre] Iniciando geração de palpites com dados reais...');

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Configure no Render > Environment.');
  }
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY não configurada. Configure no Render > Environment.');
  }

  let generated = 0;
  let errors = 0;
  let skipped = 0;

  try {
    // Busca todos os dados em apenas 3 requisições (respeita rate limit)
    const { standings, scheduledMatches, finishedMatches } = await fetchAllBrazileiraoData();

    if (scheduledMatches.length === 0) {
      console.log('ℹ️  [Mestre] Nenhum jogo agendado encontrado.');
      return { generated: 0, errors: 0, skipped: 0 };
    }

    // Processar os próximos 8 jogos
    const matchesToProcess = scheduledMatches.slice(0, 8);
    console.log(`\n[Mestre] Processando ${matchesToProcess.length} jogos...\n`);

    for (const match of matchesToProcess) {
      try {
        console.log(`🔍 Analisando: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

        // Monta prompt rico usando dados já carregados (sem requisições extras)
        const prompt = buildRichPrompt(match, standings, finishedMatches);

        // Gera palpite com IA
        const aiPrediction = await generatePredictionWithAI(prompt);

        // Salva no banco
        const result = await savePrediction(match, aiPrediction);
        if (result === 'skipped') skipped++;
        else generated++;

        // Pausa entre jogos para não sobrecarregar a Groq
        await sleep(800);

      } catch (matchError) {
        const msg = matchError instanceof Error ? matchError.message : String(matchError);
        console.error(`❌ Erro em ${match.homeTeam?.name} vs ${match.awayTeam?.name}: ${msg}`);
        errors++;
        await sleep(500);
      }
    }

    console.log(`\n✅ [Mestre] Concluído: ${generated} gerados, ${skipped} pulados, ${errors} erros\n`);
    return { generated, errors, skipped };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Mestre] Erro geral: ${msg}`);
    throw error;
  }
}
