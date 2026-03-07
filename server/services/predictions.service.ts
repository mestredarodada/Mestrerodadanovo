import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const FOOTBALL_BASE = 'https://api.football-data.org/v4';

// ─── Cache em memória dos dados base ─────────────────────────────────────────
// Evita requisições repetidas à API do football-data entre execuções do job.
// Cache válido por 4 horas.

interface BaseDataCache {
  standings: any[];
  finishedMatches: any[];
  fetchedAt: number;
}

let baseDataCache: BaseDataCache | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

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

// ─── Buscar dados base com cache ──────────────────────────────────────────────

async function getBaseData(): Promise<{ standings: any[]; finishedMatches: any[] }> {
  const now = Date.now();

  // Retorna do cache se ainda válido
  if (baseDataCache && (now - baseDataCache.fetchedAt) < CACHE_TTL_MS) {
    const ageMin = Math.round((now - baseDataCache.fetchedAt) / 60000);
    console.log(`[Mestre] Usando cache de dados base (${ageMin} min atrás)`);
    return { standings: baseDataCache.standings, finishedMatches: baseDataCache.finishedMatches };
  }

  const headers = getFootballHeaders();
  console.log('[Mestre] Buscando dados base do Brasileirão (cache expirado)...');

  const standingsRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/standings`,
    { headers, timeout: 15000 }
  );

  // Aguarda 8s entre requisições para respeitar rate limit
  await sleep(8000);

  const finishedRes = await axios.get(
    `${FOOTBALL_BASE}/competitions/BSA/matches?status=FINISHED&limit=100`,
    { headers, timeout: 15000 }
  );

  const standings: any[] = standingsRes.data.standings[0]?.table || [];
  const finishedMatches: any[] = finishedRes.data.matches || [];

  // Atualiza cache
  baseDataCache = { standings, finishedMatches, fetchedAt: now };
  console.log(`[Mestre] Cache atualizado: ${standings.length} times, ${finishedMatches.length} jogos finalizados`);

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

  for (const match of scheduledMatches) {
    const existing = await db
      .select({ id: predictionsSimple.id, createdAt: predictionsSimple.createdAt })
      .from(predictionsSimple)
      .where(eq(predictionsSimple.matchId, String(match.id)));

    if (existing.length === 0) {
      console.log(`[Mestre] Próximo jogo sem palpite: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      return match;
    }

    // Palpite com menos de 20h → pula
    const createdAt = new Date(existing[0].createdAt);
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      console.log(`[Mestre] ⏭️  Palpite recente (${hoursSince.toFixed(1)}h): ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      continue;
    }

    console.log(`[Mestre] Palpite desatualizado (${hoursSince.toFixed(1)}h): ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    return match;
  }

  console.log('[Mestre] Todos os jogos agendados já têm palpites recentes.');
  return null;
}

// ─── Montar prompt rico ───────────────────────────────────────────────────────

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
    ? `${homeStanding.won}V/${homeStanding.draw}E/${homeStanding.lost}D — ${homeStanding.goalsFor} gols marcados, ${homeStanding.goalsAgainst} sofridos (saldo ${homeStanding.goalDifference >= 0 ? '+' : ''}${homeStanding.goalDifference})`
    : 'N/D';
  const awayRecord = awayStanding
    ? `${awayStanding.won}V/${awayStanding.draw}E/${awayStanding.lost}D — ${awayStanding.goalsFor} gols marcados, ${awayStanding.goalsAgainst} sofridos (saldo ${awayStanding.goalDifference >= 0 ? '+' : ''}${awayStanding.goalDifference})`
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

━━━ FORMA RECENTE (últimos 5 jogos, mais recente primeiro) ━━━
🏠 ${home}: ${homeForm}
✈️  ${away}: ${awayForm}

━━━ MÉDIAS DE GOLS (últimos 5 jogos) ━━━
🏠 ${home}: ${homeAvg.scored} marcados/jogo, ${homeAvg.conceded} sofridos/jogo, ${homeAvg.btts}% com ambas marcando
✈️  ${away}: ${awayAvg.scored} marcados/jogo, ${awayAvg.conceded} sofridos/jogo, ${awayAvg.btts}% com ambas marcando

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

  const systemPrompt = `Você é o Mestre da Rodada, o mais respeitado analista de futebol brasileiro. Você analisa dados reais e fornece palpites ESPECÍFICOS e DIFERENCIADOS para cada jogo — nunca genéricos ou repetitivos.

REGRAS OBRIGATÓRIAS:
1. Use os dados fornecidos. Cada jogo é único — palpites diferentes para jogos diferentes.
2. Para cada mercado, escolha a LINHA MAIS ADEQUADA com base nos dados reais do jogo.
3. Mencione dados específicos na justificativa (forma recente, médias, H2H, posição na tabela).
4. O campo "bestBet" deve descrever o palpite mais seguro em português claro e direto.
5. Retorne APENAS JSON válido, sem texto adicional, sem markdown, sem explicações fora do JSON.

JSON obrigatório (todos os campos):
{
  "mainPrediction": "HOME" | "DRAW" | "AWAY",

  "doubleChance": "1X" | "X2" | "12",

  "goalsPrediction": escolha a linha mais adequada entre: "OVER_0_5" | "OVER_1_5" | "OVER_2_5" | "OVER_3_5" | "UNDER_0_5" | "UNDER_1_5" | "UNDER_2_5" | "UNDER_3_5",

  "bothTeamsToScore": "YES" | "NO",

  "cornersPrediction": escolha a linha mais adequada entre: "OVER_6_5" | "OVER_7_5" | "OVER_8_5" | "OVER_9_5" | "UNDER_6_5" | "UNDER_7_5" | "UNDER_8_5" | "UNDER_9_5",

  "cardsPrediction": escolha a linha mais adequada entre: "OVER_2_5" | "OVER_3_5" | "OVER_4_5" | "OVER_5_5" | "UNDER_2_5" | "UNDER_3_5" | "UNDER_4_5" | "UNDER_5_5",

  "halfTimePrediction": "HOME" | "DRAW" | "AWAY",

  "likelyScore": "placar mais provável, ex: 1x0 ou 2x1",

  "bestBet": "palpite mais seguro do jogo em português direto, ex: Vitória do Flamengo + Mais de 1.5 gols",

  "justification": "análise detalhada em português com mínimo 4 frases, citando dados específicos do jogo (forma recente, médias de gols, H2H, posição na tabela)"
}`;

  // Retry com backoff exponencial para lidar com 429 do Groq
  const MAX_RETRIES = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        GROQ_URL,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.35,
          max_tokens: 1500,
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

    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 429) {
        const waitSec = attempt * 30; // 30s, 60s, 90s
        console.log(`[Groq] ⚠️ Rate limit (429) — tentativa ${attempt}/${MAX_RETRIES}. Aguardando ${waitSec}s...`);
        await sleep(waitSec * 1000);
      } else {
        throw err; // Outros erros: falha imediata
      }
    }
  }

  throw lastError;
}

// ─── Enviar palpite ao Telegram ───────────────────────────────────────────────

async function sendToTelegram(match: any, ai: any): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || '';

  if (!botToken || !chatId) {
    console.log('[Telegram] Variáveis não configuradas — pulando envio.');
    return;
  }

  const home = match.homeTeam.name;
  const away = match.awayTeam.name;

  const confEmoji = (c: string) => c === 'HIGH' ? '🟢' : c === 'MEDIUM' ? '🟡' : '🔴';
  const confLabel = (c: string) => c === 'HIGH' ? 'Alta' : c === 'MEDIUM' ? 'Média' : 'Baixa';

  const mainLabel = ai.mainPrediction === 'HOME' ? `Vitória ${home}` :
    ai.mainPrediction === 'DRAW' ? 'Empate' : `Vitória ${away}`;

  const goalsLabel = ai.goalsPrediction?.replace('OVER_', 'Mais de ').replace('UNDER_', 'Menos de ').replace('_', '.') || 'N/D';
  const btsLabel = ai.bothTeamsToScore === 'YES' ? 'Ambas marcam: SIM' : 'Ambas marcam: NÃO';
  const htLabel = ai.halfTimePrediction === 'HOME' ? `${home} vence 1ºT` :
    ai.halfTimePrediction === 'DRAW' ? 'Empate no 1ºT' : `${away} vence 1ºT`;

  const matchDateStr = new Date(match.utcDate).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const message = `🏆 *MESTRE DA RODADA — PALPITE*

⚽ *${home} x ${away}*
📅 ${matchDateStr} | Brasileirão Série A

━━━━━━━━━━━━━━━━━━━━
🎯 *PALPITE PRINCIPAL*
${confEmoji(ai.mainConfidence)} ${mainLabel} (${ai.mainProbability || '?'}% de probabilidade)
Confiança: ${confLabel(ai.mainConfidence)}

━━━━━━━━━━━━━━━━━━━━
📊 *PROBABILIDADES*
🏠 ${home} vence: ${ai.homeProbability || '?'}%
🤝 Empate: ${ai.drawProbability || '?'}%
✈️ ${away} vence: ${ai.awayProbability || '?'}%

━━━━━━━━━━━━━━━━━━━━
📋 *MERCADOS*
${confEmoji(ai.goalsConfidence)} Gols: ${goalsLabel} gols (${ai.goalsProbability || '?'}%)
${confEmoji(ai.bothTeamsToScoreConfidence)} ${btsLabel} (${ai.btsProbability || '?'}%)
${confEmoji(ai.halfTimeConfidence)} ${htLabel}
${confEmoji(ai.cornersConfidence)} Escanteios: ${ai.cornersPrediction?.replace('OVER_', 'Mais de ').replace('UNDER_', 'Menos de ').replace('_', '.') || 'N/D'}
${confEmoji(ai.cardsConfidence)} Cartões: ${ai.cardsPrediction?.replace('OVER_', 'Mais de ').replace('UNDER_', 'Menos de ').replace('_', '.') || 'N/D'}

━━━━━━━━━━━━━━━━━━━━
⭐ *MELHOR APOSTA DO JOGO*
${ai.bestBet || 'N/D'} ${confEmoji(ai.bestBetConfidence || 'MEDIUM')}
Placar mais provável: *${ai.likelyScore || 'N/D'}*

━━━━━━━━━━━━━━━━━━━━
🧠 *ANÁLISE DO MESTRE*
${ai.justification || 'N/D'}

━━━━━━━━━━━━━━━━━━━━
🔗 [Faça sua aposta aqui](https://1wrlst.com/?open=register&p=c2f3)`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      },
      { timeout: 10000 }
    );
    console.log(`[Telegram] ✅ Palpite enviado: ${home} vs ${away}`);
  } catch (err: any) {
    console.error(`[Telegram] ❌ Erro ao enviar: ${err.message}`);
  }
}

// ─── Salvar palpite no banco ──────────────────────────────────────────────────

async function savePrediction(match: any, ai: any): Promise<'saved' | 'updated'> {
  const data: Record<string, any> = {
    matchId: String(match.id),
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    homeTeamCrest: match.homeTeam.crest || null,
    awayTeamCrest: match.awayTeam.crest || null,
    matchDate: new Date(match.utcDate),
    mainPrediction: ai.mainPrediction,
    mainConfidence: ai.mainConfidence,
    goalsPrediction: ai.goalsPrediction,
    goalsConfidence: ai.goalsConfidence,
    bothTeamsToScore: ai.bothTeamsToScore || null,
    bothTeamsToScoreConfidence: ai.bothTeamsToScoreConfidence || null,
    cornersPrediction: ai.cornersPrediction || null,
    cornersConfidence: ai.cornersConfidence || null,
    cardsPrediction: ai.cardsPrediction || null,
    cardsConfidence: ai.cardsConfidence || null,
    extraTip: ai.bestBet || null,
    extraConfidence: ai.bestBetConfidence || null,
    justification: ai.justification || '',
    isPublished: true,
  };

  // Salva campos extras via SQL direto (evita erro de coluna não mapeada no schema Drizzle)
  const extraFields: Record<string, any> = {
    home_probability: ai.homeProbability ?? null,
    draw_probability: ai.drawProbability ?? null,
    away_probability: ai.awayProbability ?? null,
    main_probability: ai.mainProbability ?? null,
    goals_probability: ai.goalsProbability ?? null,
    bts_probability: ai.btsProbability ?? null,
    double_chance: ai.doubleChance ?? null,
    double_chance_confidence: ai.doubleChanceConfidence ?? null,
    double_chance_probability: ai.doubleChanceProbability ?? null,
    half_time_prediction: ai.halfTimePrediction ?? null,
    half_time_confidence: ai.halfTimeConfidence ?? null,
    likely_score: ai.likelyScore ?? null,
    best_bet: ai.bestBet ?? null,
    best_bet_confidence: ai.bestBetConfidence ?? null,
  };

  const existing = await db
    .select({ id: predictionsSimple.id })
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, data.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(data as any);
    // Atualiza campos extras via SQL raw
    const setClauses = Object.entries(extraFields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
      .join(', ');
    if (setClauses) {
      await db.execute(sql.raw(`UPDATE predictions_simple SET ${setClauses} WHERE match_id = '${data.matchId}'`));
    }
    console.log(`✅ [Mestre] Palpite CRIADO: ${data.homeTeamName} vs ${data.awayTeamName}`);
    return 'saved';
  } else {
    await db.update(predictionsSimple).set(data as any).where(eq(predictionsSimple.matchId, data.matchId));
    // Atualiza campos extras via SQL raw
    const setClauses = Object.entries(extraFields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
      .join(', ');
    if (setClauses) {
      await db.execute(sql.raw(`UPDATE predictions_simple SET ${setClauses} WHERE match_id = '${data.matchId}'`));
    }
    console.log(`🔄 [Mestre] Palpite ATUALIZADO: ${data.homeTeamName} vs ${data.awayTeamName}`);
    return 'updated';
  }
}

// ─── Gerar palpite de UM jogo por vez ─────────────────────────────────────────

export async function generateNextPrediction(): Promise<{ status: 'generated' | 'skipped' | 'error'; match?: string; error?: string }> {
  console.log('\n[Mestre] ⏰ Job iniciado — verificando próximo jogo sem palpite...');

  try {
    // 1. Busca próximo jogo sem palpite (1 requisição)
    const match = await fetchNextMatchWithoutPrediction();

    if (!match) {
      console.log('[Mestre] ✅ Todos os jogos já têm palpites. Nada a fazer.');
      return { status: 'skipped' };
    }

    // 2. Busca dados base (com cache — evita 429)
    const { standings, finishedMatches } = await getBaseData();

    // 3. Monta prompt rico
    const prompt = buildRichPrompt(match, standings, finishedMatches);

    // 4. Gera palpite com IA
    console.log(`[Mestre] 🤖 Gerando palpite para: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    const aiPrediction = await generatePredictionWithAI(prompt);

    // 5. Salva no banco
    const saveStatus = await savePrediction(match, aiPrediction);

    // 6. Envia ao Telegram apenas se for palpite novo (não atualização)
    if (saveStatus === 'saved') {
      await sendToTelegram(match, aiPrediction);
    }

    const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    return { status: 'generated', match: matchName };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Mestre] ❌ Erro ao gerar palpite: ${msg}`);
    return { status: 'error', error: msg };
  }
}

// ─── Compatibilidade legada ───────────────────────────────────────────────────

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');
  if (!process.env.FOOTBALL_DATA_API_KEY) throw new Error('FOOTBALL_DATA_API_KEY não configurada');

  let generated = 0, errors = 0, skipped = 0;

  for (let i = 0; i < 8; i++) {
    const result = await generateNextPrediction();
    if (result.status === 'generated') generated++;
    else if (result.status === 'skipped') { skipped++; break; }
    else errors++;

    if (i < 7 && result.status !== 'skipped') {
      await sleep(5 * 60 * 1000); // 5 minutos entre cada jogo
    }
  }

  return { generated, errors, skipped };
}
