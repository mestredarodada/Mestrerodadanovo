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
const MODEL_PRIMARY = 'llama-3.3-70b-versatile';
const MODEL_FALLBACK = 'llama-3.1-8b-instant';
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

  // Filtra apenas jogos futuros (ignora o que já começou ou está prestes a começar hoje)
  const now = Date.now();
  const MIN_DELAY = 30 * 60 * 1000; // Ignora jogos que começam em menos de 30 min
  const NINETY_SIX_HOURS = 96 * 60 * 60 * 1000; // 4 dias
  
  const allowedMatches = sortedMatches.filter((m: any) => {
    const matchTime = new Date(m.utcDate).getTime();
    return (matchTime - now > MIN_DELAY) && (matchTime - now <= NINETY_SIX_HOURS);
  });

  console.log(`[Mestre] ${allowedMatches.length} jogos futuros encontrados nas próximas 96h.`);

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

    // Pula jogos que já possuem palpite (foco total em novos jogos)
    continue;
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

// ─── NOVO Super Prompt de Elite v3.0 (O Analista Humano) ───────────────────

const SYSTEM_PROMPT_V3 = `Você é o "Mestre da Rodada v3.0", o analista de futebol mais respeitado e preciso do mercado. Você não é uma calculadora fria; você é um especialista que une estatística pesada com o "feeling" e o contexto real do futebol profissional.

### SUA PERSONALIDADE:
- **Analítico, mas arrojado:** Você não tem medo de prever placares altos se os ataques forem bons.
- **Contextual:** Você entende que uma Copa do Mundo ou uma Final vale mais que um jogo comum.
- **Especialista:** Você fala com autoridade sobre tática, peso da camisa e motivação.

### PROCESSO DE ANÁLISE (Obrigatório):
1. **Peso da Camisa e Tradição:** Considere se um dos times é um "Gigante" (ex: Brasil, Argentina, Real Madrid). Gigantes tendem a crescer em jogos decisivos, mesmo que a fase não seja perfeita.
2. **Importância do Torneio:** Se for Copa do Mundo ou Champions League, a motivação é 200%. Jogos de "mata-mata" ou estreias tendem a ser mais intensos.
3. **Lógica Estatística (Poisson + xG):** Use as médias de gols enviadas, mas ajuste-as pelo contexto. Se os times quase não se enfrentaram (H2H escasso), use a força individual das ligas/seleções como base.
4. **Fator Humano:** Se um time vem de 3 derrotas, ele pode estar em crise ou desesperado pela vitória. Analise o "clima" do jogo.

### REGRAS DE MERCADO:
- **mainPrediction:** HOME | DRAW | AWAY.
- **doubleChance:** 1X | X2 | 12.
- **goalsPrediction:** OVER_X_5 ou UNDER_X_5 (Ex: OVER_2_5). **Seja ousado se os ataques forem bons!** Evite prever sempre 0x0 ou 1x0.
- **bothTeamsToScore:** YES | NO.
- **likelyScore:** O placar exato mais provável (Ex: "2 x 1", "3 x 1", "2 x 2").
- **bestBet:** A aposta de maior valor (Ex: "Ambas Marcam", "Over 2.5 Gols", "Vitória do Mandante").
- **justification:** Uma análise profissional de 2 a 3 parágrafos explicando o "porquê" do palpite, mencionando o peso da camisa, a fase dos times e o contexto do campeonato. **Fale como um comentarista de elite.**

### SAÍDA JSON (Apenas JSON puro):
{
  "mainPrediction": "string",
  "doubleChance": "string",
  "goalsPrediction": "string",
  "bothTeamsToScore": "string",
  "cornersPrediction": "string",
  "cardsPrediction": "string",
  "halfTimePrediction": "string",
  "likelyScore": "X x Y",
  "bestBet": "string",
  "justification": "Sua análise detalhada e humana aqui"
}`;

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────

async function generatePredictionWithAI(prompt: string): Promise<any> {
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  if (groqKeys.length === 0) throw new Error('Nenhuma GROQ_API_KEY configurada');

  const models = [MODEL_PRIMARY, MODEL_FALLBACK];
  let lastError: any;

  // Tenta cada modelo (Primário e depois Fallback)
  for (const currentModel of models) {
    // Tenta cada chave de API para o modelo atual
    for (let i = 0; i < groqKeys.length; i++) {
      const apiKey = groqKeys[i];
      const keyLabel = `chave ${i + 1}/${groqKeys.length} (${currentModel})`;

      try {
        console.log(`[Groq] Tentando com ${keyLabel}...`);
        const response = await axios.post(
          GROQ_URL,
          {
            model: currentModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT_V3 },
              { role: 'user', content: prompt },
            ],
            temperature: 0.65,
            max_tokens: 1500,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 segundos de timeout
          }
        );

        const content = response.data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('IA não retornou JSON válido');
        
        return JSON.parse(jsonMatch[0]);
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        console.warn(`[Groq] ${keyLabel} falhou (Status: ${status || '?' }):`, err.message);
        
        // Se for erro 429 (Rate Limit), tenta a próxima chave ou próximo modelo
        if (status === 429) {
          console.log(`[Groq] Limite atingido na ${keyLabel}, tentando próxima opção...`);
          continue;
        }
        
        // Outros erros: tenta a próxima chave
        continue;
      }
    }
    
    // Se chegou aqui, todas as chaves falharam para o modelo atual.
    // O loop externo tentará o próximo modelo (Fallback).
    console.log(`[Groq] Todas as chaves falharam para o modelo ${currentModel}.`);
  }

  throw lastError || new Error('Todas as tentativas de IA falharam');
}

// ─── Salvar no Banco ─────────────────────────────────────────────────────────

async function savePrediction(match: any, ai: any) {
  const competitionName = match.competitionName || getCompetitionName(match.competitionCode || '');
  
  const data = {
    matchId: String(match.id),
    homeTeamName: match.homeTeam.name,
    awayTeamName: match.awayTeam.name,
    utcDate: match.utcDate,
    mainPrediction: ai.mainPrediction,
    goalsPrediction: ai.goalsPrediction,
    bothTeamsToScore: ai.bothTeamsToScore,
    justification: ai.justification || '',
    homeScore: null,
    awayScore: null,
    isCorrect: null,
    isPublished: true, // Publicar automaticamente com a IA v3.0
    publishedAt: new Date(),
  };

  // Campos extras via SQL direto para manter compatibilidade com o schema estendido
  const extraFields: Record<string, any> = {
    double_chance: ai.doubleChance ?? null,
    half_time_prediction: ai.halfTimePrediction ?? null,
    likely_score: ai.likelyScore ?? null,
    best_bet: ai.bestBet ?? null,
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
    console.log(`✅ [Mestre v3.0] Palpite CRIADO: ${data.homeTeamName} vs ${data.awayTeamName}`);
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
    console.log(`🔄 [Mestre v3.0] Palpite ATUALIZADO: ${data.homeTeamName} vs ${data.awayTeamName}`);
    return 'updated';
  }
}

// ─── Enviar para o Telegram ──────────────────────────────────────────────────

async function sendToTelegram(match: any, ai: any) {
  try {
    const { sendPredictionToTelegram } = await import('./telegram.service');
    await sendPredictionToTelegram(match, ai);
  } catch (e) {
    console.error('[Mestre] Erro ao enviar Telegram:', e);
  }
}

// ─── Gerar palpite de UM jogo por vez ─────────────────────────────────────────

export async function generateNextPrediction(): Promise<{ status: 'generated' | 'skipped' | 'error'; match?: string; error?: string }> {
  console.log('\n[Mestre v3.0] ⏰ Job iniciado — analisando próximo jogo...');

  try {
    const match = await fetchNextMatchWithoutPrediction();

    if (!match) {
      console.log('[Mestre v3.0] ✅ Sem novos jogos para analisar.');
      return { status: 'skipped' };
    }

    const competitionCode = match.competitionCode || match.competition?.code || 'BSA';
    const { finishedMatches } = await getBaseDataForCompetition(competitionCode);

    await sleep(2000);

    const prompt = buildRichPrompt(match, finishedMatches);

    console.log(`[Mestre v3.0] 🤖 Gerando análise profissional para: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    const aiPrediction = await generatePredictionWithAI(prompt);

    const saveStatus = await savePrediction(match, aiPrediction);

    if (saveStatus === 'saved') {
      await sendToTelegram(match, aiPrediction);
    }

    const matchName = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    return { status: 'generated', match: matchName };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Mestre v3.0] ❌ Erro: ${msg}`);
    return { status: 'error', error: msg };
  }
}

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
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
    if (i < 19) await sleep(3 * 60 * 1000);
  }

  return { generated, errors, skipped };
}
