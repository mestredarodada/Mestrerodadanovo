import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  getAllScheduledMatches,
  getAllFinishedMatches,
  getCompetitionName,
  SUPPORTED_COMPETITIONS,
  CACHE_TTL,
  footballApiGet,
} from '../footballApi';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const FOOTBALL_BASE = 'https://api.football-data.org/v4';

// ─── Cache em memória dos dados base (por competição) ────────────────────────

interface BaseDataCache {
  finishedMatches: any[];
  fetchedAt: number;
}

const baseDataCacheMap = new Map<string, BaseDataCache>();
const BASE_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFootballHeaders() {
  const keys = [
    process.env.FOOTBALL_DATA_API_KEY,
    process.env.FOOTBALL_DATA_API_KEY_2,
    process.env.FOOTBALL_DATA_API_KEY_3,
  ].filter(Boolean) as string[];
  if (keys.length === 0) throw new Error('FOOTBALL_DATA_API_KEY não configurada');
  // Rotação simples
  const idx = Math.floor(Math.random() * keys.length);
  return { 'X-Auth-Token': keys[idx] };
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

function buildLast5Details(matches: any[], teamId: number): string {
  const sorted = [...matches]
    .filter(m => m.status === 'FINISHED' &&
      (m.homeTeam.id === teamId || m.awayTeam.id === teamId))
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 5);

  if (sorted.length === 0) return 'Sem dados recentes';

  return sorted.map(m => {
    const isHome = m.homeTeam.id === teamId;
    const hg = m.score?.fullTime?.home ?? 0;
    const ag = m.score?.fullTime?.away ?? 0;
    const opponent = isHome ? m.awayTeam.name : m.homeTeam.name;
    const score = isHome ? `${hg}x${ag}` : `${ag}x${hg}`;
    const result = isHome ? (hg > ag ? 'V' : hg === ag ? 'E' : 'D') : (ag > hg ? 'V' : ag === hg ? 'E' : 'D');
    const local = isHome ? '(casa)' : '(fora)';
    return `${result} ${score} vs ${opponent} ${local}`;
  }).join(' | ');
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
    scored: +(scored / finished.length).toFixed(2),
    conceded: +(conceded / finished.length).toFixed(2),
    btts: Math.round((bttsCount / finished.length) * 100),
    games: finished.length,
  };
}

// ─── Buscar dados base por competição (com cache) ────────────────────────────

async function getBaseDataForCompetition(competitionCode: string): Promise<{ finishedMatches: any[] }> {
  const now = Date.now();
  const cached = baseDataCacheMap.get(competitionCode);

  if (cached && (now - cached.fetchedAt) < BASE_CACHE_TTL_MS) {
    const ageMin = Math.round((now - cached.fetchedAt) / 60000);
    console.log(`[Mestre] Usando cache de dados base ${competitionCode} (${ageMin} min atrás)`);
    return { finishedMatches: cached.finishedMatches };
  }

  console.log(`[Mestre] Buscando dados base de ${competitionCode} (cache expirado)...`);

  const finishedMatches = await footballApiGet(
    `${FOOTBALL_BASE}/competitions/${competitionCode}/matches`,
    { status: 'FINISHED', limit: 100 },
    `base_finished_${competitionCode}`,
    BASE_CACHE_TTL_MS
  );

  const matches = finishedMatches.matches || [];
  baseDataCacheMap.set(competitionCode, { finishedMatches: matches, fetchedAt: now });
  console.log(`[Mestre] Cache ${competitionCode} atualizado: ${matches.length} jogos finalizados`);

  return { finishedMatches: matches };
}

// ─── Buscar próximo jogo sem palpite (MULTI-LIGA) ───────────────────────────

async function fetchNextMatchWithoutPrediction(): Promise<any | null> {
  console.log('[Mestre] Buscando jogos agendados de TODAS as ligas...');
  
  const scheduledMatches = await getAllScheduledMatches();

  if (scheduledMatches.length === 0) {
    console.log('[Mestre] Nenhum jogo agendado encontrado em nenhuma liga.');
    return null;
  }

  // Ordena por data (mais próximo primeiro)
  const sortedMatches = scheduledMatches.sort(
    (a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );

  // Filtra apenas jogos nas próximas 24h
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const allowedMatches = sortedMatches.filter(
    (m: any) => new Date(m.utcDate).getTime() - now <= FORTY_EIGHT_HOURS
  );

  console.log(`[Mestre] ${allowedMatches.length} jogos nas próximas 48h (de ${scheduledMatches.length} total)`);

  // ─── OTIMIZAÇÃO: Busca todos os palpites existentes de uma vez ───
  const matchIds = allowedMatches.map(m => String(m.id));
  const existingPredictions = await db
    .select({ matchId: predictionsSimple.matchId, createdAt: predictionsSimple.createdAt })
    .from(predictionsSimple)
    .where(sql`match_id IN (${sql.join(matchIds.map(id => sql`${id}`), sql`, `)})`);

  const existingMap = new Map(existingPredictions.map(p => [p.matchId, p.createdAt]));

  for (const match of allowedMatches) {
    const createdAt = existingMap.get(String(match.id));

    if (!createdAt) {
      const compName = match.competitionName || getCompetitionName(match.competitionCode || '');
      console.log(`[Mestre] Próximo jogo sem palpite: ${match.homeTeam.name} vs ${match.awayTeam.name} (${compName})`);
      return match;
    }

    // Palpite com menos de 20h → pula (cache inteligente)
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      continue; // Palpite recente, pula instantaneamente
    }

    const compName = match.competitionName || getCompetitionName(match.competitionCode || '');
    console.log(`[Mestre] Palpite desatualizado (${hoursSince.toFixed(1)}h): ${match.homeTeam.name} vs ${match.awayTeam.name} (${compName})`);
    return match;
  }

  console.log('[Mestre] Todos os jogos agendados já têm palpites recentes.');
  return null;
}

// ─── Montar prompt rico (MULTI-LIGA) ─────────────────────────────────────────

function buildRichPrompt(match: any, finishedMatches: any[]): string {
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;
  const competitionName = match.competitionName || match.competition?.name || 'Liga Internacional';

  const homeForm = buildFormString(finishedMatches, homeId);
  const awayForm = buildFormString(finishedMatches, awayId);
  const homeLast5 = buildLast5Details(finishedMatches, homeId);
  const awayLast5 = buildLast5Details(finishedMatches, awayId);
  const homeAvg = calcGoalAverages(finishedMatches, homeId, 10);
  const awayAvg = calcGoalAverages(finishedMatches, awayId, 10);

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

  const expectedGoals = +(homeAvg.scored + awayAvg.scored).toFixed(2);
  const btsPct = Math.round((homeAvg.btts + awayAvg.btts) / 2);

  const matchDateStr = new Date(match.utcDate).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return `=== JOGO: ${home} x ${away} ===
🏆 ${competitionName}
📅 ${matchDateStr} | ${match.matchday ? `Rodada ${match.matchday}` : 'Fase de grupos/eliminatórias'}

━━━ ÚLTIMOS 5 JOGOS (detalhado) ━━━
🏠 ${home} (forma: ${homeForm}):
${homeLast5}

✈️  ${away} (forma: ${awayForm}):
${awayLast5}

━━━ MÉDIAS DE GOLS (últimos 10 jogos) ━━━
🏠 ${home}: ${homeAvg.scored} marcados/jogo, ${homeAvg.conceded} sofridos/jogo, ${homeAvg.btts}% com ambas marcando (${homeAvg.games} jogos analisados)
✈️  ${away}: ${awayAvg.scored} marcados/jogo, ${awayAvg.conceded} sofridos/jogo, ${awayAvg.btts}% com ambas marcando (${awayAvg.games} jogos analisados)

━━━ CONFRONTO DIRETO (H2H) ━━━
${h2hSummary}

━━━ CONTEXTO ESTATÍSTICO ━━━
• Gols esperados no jogo (soma das médias): ~${expectedGoals}
• Probabilidade estimada de ambas marcarem: ${btsPct}%
• ${home} joga em casa (fator mandante)
• Campeonato: ${competitionName}

Analise com base nesses dados reais e forneça palpites específicos e fundamentados para este jogo.`;
}

// ─── NOVO Super Prompt de Elite v2.0 ─────────────────────────────────────────

const SYSTEM_PROMPT_V2 = `Você é o "Mestre da Rodada v2.0", um Quant-Analyst de Elite especializado em modelos preditivos de futebol internacional. Sua missão é fornecer palpites com precisão cirúrgica, utilizando lógica estatística avançada.

### PROCESSO DE PENSAMENTO OBRIGATÓRIO (Chain-of-Thought):
Antes de gerar o JSON final, você deve realizar mentalmente (ou no campo de justificativa interna) a seguinte análise:
1. **Cálculo de Força Relativa:** Compare a média de gols marcados/sofridos (Attack/Defense Strength) de cada time nos últimos 10 jogos, ajustando pelo peso do mando de campo.
2. **Aplicação de Poisson:** Utilize a Distribuição de Poisson para estimar a probabilidade de cada equipe marcar 0, 1, 2, 3 ou 4+ gols. O placar exato deve ser a combinação de maior probabilidade estatística.
3. **Análise de xG (Gols Esperados):** Considere se os times estão sendo eficientes ou se estão "devendo" gols com base no volume de jogo.
4. **Contexto Tático:** Avalie se é um jogo de "under" (defesas sólidas, jogo truncado) ou "over" (ataques explosivos, defesas expostas).

### REGRAS DE MERCADO (Obrigatórias para todos os jogos):
1. **Quem vence (mainPrediction):** HOME | DRAW | AWAY.
2. **Dupla Chance (doubleChance):** 1X | X2 | 12.
3. **Gols (goalsPrediction):** Escolha a linha de maior valor (OVER/UNDER 0.5 a 3.5). Formato: OVER_X_5 ou UNDER_X_5 (ex: OVER_2_5, UNDER_1_5).
4. **Ambas Marcam (bothTeamsToScore):** YES | NO (Crucial: deve ser coerente com o likelyScore).
5. **Escanteios (cornersPrediction):** Baseie-se na média de cruzamentos e volume ofensivo. Formato: OVER_X_5 ou UNDER_X_5 (ex: OVER_8_5).
6. **Cartões (cardsPrediction):** Considere a agressividade das equipes e o peso do confronto (clássicos = mais cartões). Formato: OVER_X_5 ou UNDER_X_5 (ex: OVER_3_5).
7. **1º Tempo (halfTimePrediction):** HOME | DRAW | AWAY.
8. **Melhor Aposta (bestBet):** O mercado de maior confiança (ex: "Handicap +1.5 Time A" ou "Ambas Marcam").

### FORMATAÇÃO DO PLACAR EXATO (likelyScore):
- O placar deve ser o resultado direto da sua análise de Poisson. 
- **Auto-Correção:** Se você prever "Ambas Marcam: NO", o placar NÃO pode ser 1x1, 2x1, etc. Se prever "Over 2.5", a soma dos gols no placar deve ser >= 3.

### SAÍDA JSON (Apenas JSON puro, sem markdown, sem texto adicional):
{
  "mainPrediction": "string",
  "doubleChance": "string",
  "goalsPrediction": "string",
  "bothTeamsToScore": "string",
  "cornersPrediction": "string",
  "cardsPrediction": "string",
  "halfTimePrediction": "string",
  "likelyScore": "X x Y",
  "bestBet": "Descrição curta e direta da melhor aposta"
}

IMPORTANTE: NÃO inclua campo "justification" no JSON. Retorne APENAS os campos listados acima.`;

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────

async function generatePredictionWithAI(prompt: string): Promise<any> {
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  if (groqKeys.length === 0) throw new Error('Nenhuma GROQ_API_KEY configurada');

  let lastError: any;

  for (let i = 0; i < groqKeys.length; i++) {
    const apiKey = groqKeys[i];
    const keyLabel = `chave ${i + 1}/${groqKeys.length}`;

    try {
      console.log(`[Groq] Tentando com ${keyLabel}...`);
      const response = await axios.post(
        GROQ_URL,
        {
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_V2 },
            { role: 'user', content: prompt },
          ],
          temperature: 0.35,
          max_tokens: 1200,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');
      console.log(`[Groq] ✅ Sucesso com ${keyLabel}`);
      return JSON.parse(jsonMatch[0]);

    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 429) {
        console.log(`[Groq] ⚠️ Rate limit (429) na ${keyLabel} — tentando próxima chave...`);
        if (i < groqKeys.length - 1) await sleep(3000);
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Todas as ${groqKeys.length} chaves Groq retornaram 429. Tentando novamente no próximo ciclo.`);
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
  const competitionName = match.competitionName || match.competition?.name || 'Liga Internacional';

  const formatLine = (val: string | undefined, overPrefix = 'Mais de ', underPrefix = 'Menos de ') => {
    if (!val) return 'N/D';
    return val
      .replace('OVER_', overPrefix)
      .replace('UNDER_', underPrefix)
      .replace(/_/g, '.');
  };

  const mainLabel = ai.mainPrediction === 'HOME' ? `🏠 Vitória ${home}` :
    ai.mainPrediction === 'DRAW' ? '🤝 Empate' : `✈️ Vitória ${away}`;

  const btsLabel = ai.bothTeamsToScore === 'YES' ? '✅ Ambas marcam: SIM' : '❌ Ambas marcam: NÃO';

  const htLabel = ai.halfTimePrediction === 'HOME' ? `${home} vence no 1ºT` :
    ai.halfTimePrediction === 'DRAW' ? 'Empate no 1ºT' : `${away} vence no 1ºT`;

  const dcLabel = ai.doubleChance
    ? ai.doubleChance === '1X' ? `${home} ou Empate`
    : ai.doubleChance === 'X2' ? `Empate ou ${away}`
    : `${home} ou ${away}`
    : null;

  const matchDateStr = new Date(match.utcDate).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const message = `🏆 *MESTRE DA RODADA v2.0 — PALPITE*

⚽ *${home} x ${away}*
📅 ${matchDateStr} | ${competitionName}

━━━━━━━━━━━━━━━━━━━━
🎯 *RESULTADO*
${mainLabel}

━━━━━━━━━━━━━━━━━━━━
📋 *MERCADOS*
⚽ Gols: ${formatLine(ai.goalsPrediction)} gols
${btsLabel}
⏱️ 1º Tempo: ${htLabel}
🔲 Escanteios: ${formatLine(ai.cornersPrediction)} escanteios
🟨 Cartões: ${formatLine(ai.cardsPrediction)} cartões${dcLabel ? `
🔀 Dupla Chance: ${dcLabel}` : ''}

━━━━━━━━━━━━━━━━━━━━
⭐ *MELHOR APOSTA DO JOGO*
${ai.bestBet || 'N/D'}
🎯 Placar mais provável: *${ai.likelyScore || 'N/D'}*

━━━━━━━━━━━━━━━━━━━━`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎲 Apostar Agora — Casa Recomendada',
                url: 'https://1wfypv.com/?open=register&p=c2f3',
              },
            ],
            [
              {
                text: '⚽ Ver Todos os Palpites — mestredarodada.com.br',
                url: 'https://www.mestredarodada.com.br',
              },
            ],
          ],
        },
      },
      { timeout: 10000 }
    );
    console.log(`[Telegram] ✅ Palpite enviado: ${home} vs ${away} (${competitionName})`);
  } catch (err: any) {
    console.error(`[Telegram] ❌ Erro ao enviar: ${err.message}`);
  }
}

// ─── Salvar palpite no banco ──────────────────────────────────────────────────

async function savePrediction(match: any, ai: any): Promise<'saved' | 'updated'> {
  const competitionName = match.competitionName || match.competition?.name || '';
  
  const data: Record<string, any> = {
    matchId: String(match.id),
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    homeTeamCrest: match.homeTeam.crest || null,
    awayTeamCrest: match.awayTeam.crest || null,
    matchDate: new Date(match.utcDate),
    mainPrediction: ai.mainPrediction || 'DRAW',
    mainConfidence: ai.mainConfidence || 'MEDIUM',
    goalsPrediction: ai.goalsPrediction || 'OVER_2_5',
    goalsConfidence: ai.goalsConfidence || 'MEDIUM',
    bothTeamsToScore: ai.bothTeamsToScore || null,
    bothTeamsToScoreConfidence: ai.bothTeamsToScoreConfidence || null,
    cornersPrediction: ai.cornersPrediction || null,
    cornersConfidence: ai.cornersConfidence || null,
    cardsPrediction: ai.cardsPrediction || null,
    cardsConfidence: ai.cardsConfidence || null,
    extraTip: ai.bestBet || null,
    extraConfidence: ai.bestBetConfidence || null,
    justification: '',
    isPublished: true,
  };

  // Campos extras via SQL direto
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
    matchday: match.matchday ?? null,
    competition_code: match.competitionCode ?? null,
    competition_name: competitionName || null,
  };

  const existing = await db
    .select({ id: predictionsSimple.id })
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, data.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(data as any);
    const setClauses = Object.entries(extraFields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
      .join(', ');
    if (setClauses) {
      await db.execute(sql.raw(`UPDATE predictions_simple SET ${setClauses} WHERE match_id = '${data.matchId}'`));
    }
    console.log(`✅ [Mestre] Palpite CRIADO: ${data.homeTeamName} vs ${data.awayTeamName} (${competitionName})`);
    return 'saved';
  } else {
    await db.update(predictionsSimple).set(data as any).where(eq(predictionsSimple.matchId, data.matchId));
    const setClauses = Object.entries(extraFields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
      .join(', ');
    if (setClauses) {
      await db.execute(sql.raw(`UPDATE predictions_simple SET ${setClauses} WHERE match_id = '${data.matchId}'`));
    }
    console.log(`🔄 [Mestre] Palpite ATUALIZADO: ${data.homeTeamName} vs ${data.awayTeamName} (${competitionName})`);
    return 'updated';
  }
}

// ─── Gerar palpite de UM jogo por vez (MULTI-LIGA) ───────────────────────────

export async function generateNextPrediction(): Promise<{ status: 'generated' | 'skipped' | 'error'; match?: string; error?: string }> {
  console.log('\n[Mestre v2.0] ⏰ Job iniciado — verificando próximo jogo sem palpite (TODAS as ligas)...');

  try {
    // 1. Busca próximo jogo sem palpite (multi-liga)
    const match = await fetchNextMatchWithoutPrediction();

    if (!match) {
      console.log('[Mestre v2.0] ✅ Todos os jogos já têm palpites. Nada a fazer.');
      return { status: 'skipped' };
    }

    const competitionCode = match.competitionCode || match.competition?.code || 'BSA';
    const competitionName = match.competitionName || getCompetitionName(competitionCode);

    // 2. Busca dados base da competição (com cache)
    const { finishedMatches } = await getBaseDataForCompetition(competitionCode);

    // Pequeno delay para respeitar rate limit
    await sleep(2000);

    // 3. Monta prompt rico
    const prompt = buildRichPrompt(match, finishedMatches);

    // 4. Gera palpite com IA
    console.log(`[Mestre v2.0] 🤖 Gerando palpite para: ${match.homeTeam.name} vs ${match.awayTeam.name} (${competitionName})`);
    const aiPrediction = await generatePredictionWithAI(prompt);

    // 5. Salva no banco
    const saveStatus = await savePrediction(match, aiPrediction);

    // 6. Envia ao Telegram apenas se for palpite novo
    if (saveStatus === 'saved') {
      await sendToTelegram(match, aiPrediction);
    }

    const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name} (${competitionName})`;
    return { status: 'generated', match: matchName };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Mestre v2.0] ❌ Erro ao gerar palpite: ${msg}`);
    return { status: 'error', error: msg };
  }
}

// ─── Compatibilidade legada ───────────────────────────────────────────────────

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');
  if (!process.env.FOOTBALL_DATA_API_KEY) throw new Error('FOOTBALL_DATA_API_KEY não configurada');

  let generated = 0, errors = 0, skipped = 0;

  for (let i = 0; i < 20; i++) {
    const result = await generateNextPrediction();
    if (result.status === 'generated') {
      generated++;
    } else if (result.status === 'skipped') {
      skipped++;
      break;
    } else {
      errors++;
    }

    // Delay entre gerações (só se não foi o último)
    if (i < 11) {
      await sleep(3 * 60 * 1000); // 3 minutos entre cada jogo (otimizado)
    }
  }

  return { generated, errors, skipped };
}
