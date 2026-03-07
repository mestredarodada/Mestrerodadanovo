import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq } from 'drizzle-orm';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const FOOTBALL_BASE = 'https://api.football-data.org/v4';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFootballHeaders() {
  const key = process.env.FOOTBALL_DATA_API_KEY || '';
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY não configurada');
  return { 'X-Auth-Token': key };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Converte resultados de partidas em string de forma (ex: "VVEEV")
function buildFormString(matches: any[], teamId: number): string {
  const sorted = [...matches]
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 5);

  return sorted.map(m => {
    const isHome = m.homeTeam.id === teamId;
    const homeGoals = m.score.fullTime.home ?? 0;
    const awayGoals = m.score.fullTime.away ?? 0;
    if (isHome) {
      if (homeGoals > awayGoals) return 'V';
      if (homeGoals === awayGoals) return 'E';
      return 'D';
    } else {
      if (awayGoals > homeGoals) return 'V';
      if (awayGoals === homeGoals) return 'E';
      return 'D';
    }
  }).join('') || 'N/D';
}

// Calcula médias de gols dos últimos N jogos
function calcGoalAverages(matches: any[], teamId: number, last = 5) {
  const finished = matches
    .filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, last);

  if (finished.length === 0) return { scored: 0, conceded: 0, btts: 0 };

  let scored = 0, conceded = 0, bttsCount = 0;
  for (const m of finished) {
    const isHome = m.homeTeam.id === teamId;
    const goalsFor = isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0);
    const goalsAgainst = isHome ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0);
    scored += goalsFor;
    conceded += goalsAgainst;
    if (goalsFor > 0 && goalsAgainst > 0) bttsCount++;
  }

  return {
    scored: +(scored / finished.length).toFixed(1),
    conceded: +(conceded / finished.length).toFixed(1),
    btts: Math.round((bttsCount / finished.length) * 100),
  };
}

// ─── Buscar dados ricos do Brasileirão ────────────────────────────────────────

async function fetchRichMatchData(match: any, standings: any[]) {
  const headers = getFootballHeaders();
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;

  // Buscar últimos 10 jogos de cada time em paralelo
  const [homeMatchesRes, awayMatchesRes] = await Promise.allSettled([
    axios.get(`${FOOTBALL_BASE}/teams/${homeId}/matches?limit=10&status=FINISHED`, { headers, timeout: 10000 }),
    axios.get(`${FOOTBALL_BASE}/teams/${awayId}/matches?limit=10&status=FINISHED`, { headers, timeout: 10000 }),
  ]);

  const homeMatches = homeMatchesRes.status === 'fulfilled'
    ? (homeMatchesRes.value.data.matches || [])
    : [];
  const awayMatches = awayMatchesRes.status === 'fulfilled'
    ? (awayMatchesRes.value.data.matches || [])
    : [];

  // Confronto direto (H2H) — filtra jogos entre os dois times
  const h2hMatches = homeMatches
    .filter((m: any) =>
      m.status === 'FINISHED' &&
      ((m.homeTeam.id === homeId && m.awayTeam.id === awayId) ||
       (m.homeTeam.id === awayId && m.awayTeam.id === homeId))
    )
    .slice(0, 5);

  const homeForm = buildFormString(homeMatches, homeId);
  const awayForm = buildFormString(awayMatches, awayId);
  const homeAvg = calcGoalAverages(homeMatches, homeId);
  const awayAvg = calcGoalAverages(awayMatches, awayId);

  // Dados de classificação
  const homeStanding = standings.find((s: any) => s.team.id === homeId);
  const awayStanding = standings.find((s: any) => s.team.id === awayId);

  // Resumo do H2H
  let h2hSummary = 'Sem dados de confronto direto disponíveis';
  if (h2hMatches.length > 0) {
    let homeWins = 0, draws = 0, awayWins = 0;
    for (const m of h2hMatches) {
      const hg = m.score.fullTime.home ?? 0;
      const ag = m.score.fullTime.away ?? 0;
      const homeIsHome = m.homeTeam.id === homeId;
      if (hg === ag) draws++;
      else if ((hg > ag && homeIsHome) || (ag > hg && !homeIsHome)) homeWins++;
      else awayWins++;
    }
    h2hSummary = `Últimos ${h2hMatches.length} confrontos: ${match.homeTeam.name} venceu ${homeWins}x, Empates ${draws}x, ${match.awayTeam.name} venceu ${awayWins}x`;
  }

  return {
    homeForm,
    awayForm,
    homeAvg,
    awayAvg,
    homeStanding,
    awayStanding,
    h2hSummary,
  };
}

// ─── Montar prompt rico para a IA ─────────────────────────────────────────────

function buildRichPrompt(match: any, data: ReturnType<typeof fetchRichMatchData> extends Promise<infer T> ? T : never): string {
  const { homeForm, awayForm, homeAvg, awayAvg, homeStanding, awayStanding, h2hSummary } = data;
  const home = match.homeTeam.name;
  const away = match.awayTeam.name;

  const homePos = homeStanding ? `${homeStanding.position}º lugar, ${homeStanding.points} pts` : 'Posição desconhecida';
  const awayPos = awayStanding ? `${awayStanding.position}º lugar, ${awayStanding.points} pts` : 'Posição desconhecida';

  const homeRecord = homeStanding
    ? `${homeStanding.won}V/${homeStanding.draw}E/${homeStanding.lost}D — Gols: ${homeStanding.goalsFor} marcados, ${homeStanding.goalsAgainst} sofridos`
    : 'Dados não disponíveis';
  const awayRecord = awayStanding
    ? `${awayStanding.won}V/${awayStanding.draw}E/${awayStanding.lost}D — Gols: ${awayStanding.goalsFor} marcados, ${awayStanding.goalsAgainst} sofridos`
    : 'Dados não disponíveis';

  return `=== ANÁLISE DO JOGO: ${home} x ${away} ===

📅 Data: ${new Date(match.utcDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
🏆 Rodada ${match.matchday || 'N/D'} — Brasileirão Série A

--- CLASSIFICAÇÃO ATUAL ---
🏠 ${home} (Mandante): ${homePos}
   Campeonato: ${homeRecord}

✈️  ${away} (Visitante): ${awayPos}
   Campeonato: ${awayRecord}

--- FORMA RECENTE (últimos 5 jogos) ---
🏠 ${home}: ${homeForm} (V=Vitória, E=Empate, D=Derrota)
✈️  ${away}: ${awayForm}

--- MÉDIAS DOS ÚLTIMOS 5 JOGOS ---
🏠 ${home}: ${homeAvg.scored} gols marcados/jogo, ${homeAvg.conceded} sofridos/jogo, ${homeAvg.btts}% dos jogos com ambas marcando
✈️  ${away}: ${awayAvg.scored} gols marcados/jogo, ${awayAvg.conceded} sofridos/jogo, ${awayAvg.btts}% dos jogos com ambas marcando

--- CONFRONTO DIRETO (H2H) ---
${h2hSummary}

--- CONTEXTO ---
- Fator mandante: ${home} joga em casa, o que historicamente favorece o time da casa no Brasileirão
- Média de gols esperada no jogo: ${+(homeAvg.scored + awayAvg.conceded).toFixed(1)} (pela perspectiva do mandante) / ${+(awayAvg.scored + homeAvg.conceded).toFixed(1)} (pela perspectiva do visitante)
- Probabilidade estimada de ambas marcarem: ${Math.round((homeAvg.btts + awayAvg.btts) / 2)}%

Com base em todos esses dados reais, forneça uma análise profunda e diferenciada para este jogo específico.`;
}

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────

async function generatePredictionWithAI(prompt: string): Promise<any> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');

  const systemPrompt = `Você é o Mestre da Rodada, o mais respeitado analista de futebol brasileiro. Você tem acesso a dados reais e estatísticas detalhadas de cada jogo. Sua análise é SEMPRE específica para cada partida — nunca genérica.

REGRAS IMPORTANTES:
1. Analise os dados fornecidos com cuidado. Cada jogo é único.
2. Considere forma recente, médias de gols, confronto direto e posição na tabela.
3. Não repita os mesmos palpites para todos os jogos — use os dados para diferenciar.
4. A justificativa deve mencionar dados específicos do jogo (ex: "O Flamengo marcou em 4 dos últimos 5 jogos em casa").
5. Retorne APENAS JSON válido, sem texto adicional.

Estrutura obrigatória do JSON:
{
  "mainPrediction": "HOME" | "DRAW" | "AWAY",
  "mainConfidence": "HIGH" | "MEDIUM" | "LOW",
  "mainProbability": número de 0 a 100 (probabilidade estimada em %),
  "goalsPrediction": "OVER_2_5" | "UNDER_2_5",
  "goalsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "goalsProbability": número de 0 a 100,
  "bothTeamsToScore": "YES" | "NO",
  "bothTeamsToScoreConfidence": "HIGH" | "MEDIUM" | "LOW",
  "btsProbability": número de 0 a 100,
  "cornersPrediction": "OVER_9" | "UNDER_9",
  "cornersConfidence": "HIGH" | "MEDIUM" | "LOW",
  "cardsPrediction": "OVER_4_5" | "UNDER_4_5",
  "cardsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "extraTip": "dica extra específica para este jogo em português (ex: 'Flamengo marcou primeiro em 4 dos últimos 5 jogos em casa')",
  "extraConfidence": "HIGH" | "MEDIUM" | "LOW",
  "justification": "análise detalhada em português com pelo menos 4 frases, citando dados específicos do jogo como forma recente, médias de gols e confronto direto"
}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4, // Mais determinístico para usar os dados reais
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

  // Extrair JSON da resposta
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

  return JSON.parse(jsonMatch[0]);
}

// ─── Salvar palpite no banco ──────────────────────────────────────────────────

async function savePrediction(match: any, aiPrediction: any) {
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
    isPublished: true, // Sempre publicado automaticamente
  };

  const existing = await db
    .select()
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, predictionData.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(predictionData);
    console.log(`✅ Palpite criado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
  } else {
    const createdAt = new Date(existing[0].createdAt);
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 20) {
      console.log(`⏭️ Palpite recente (${hoursSince.toFixed(1)}h), pulando: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
      return 'skipped';
    }
    await db
      .update(predictionsSimple)
      .set({ ...predictionData, isPublished: true })
      .where(eq(predictionsSimple.matchId, predictionData.matchId));
    console.log(`🔄 Palpite atualizado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
  }
  return 'saved';
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function generateAllPredictions(): Promise<{ generated: number; errors: number; skipped: number }> {
  console.log('🚀 [Mestre] Iniciando geração de palpites com dados reais...');

  const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
  const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada. Configure no Render > Environment.');
  }
  if (!FOOTBALL_API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY não configurada. Configure no Render > Environment.');
  }

  let generated = 0;
  let errors = 0;
  let skipped = 0;

  try {
    const headers = getFootballHeaders();

    // Buscar classificação e próximos jogos em paralelo
    const [standingsRes, matchesRes] = await Promise.all([
      axios.get(`${FOOTBALL_BASE}/competitions/BSA/standings`, { headers, timeout: 15000 }),
      axios.get(`${FOOTBALL_BASE}/competitions/BSA/matches?status=SCHEDULED`, { headers, timeout: 15000 }),
    ]);

    const standings: any[] = standingsRes.data.standings[0]?.table || [];
    const allMatches: any[] = matchesRes.data.matches || [];

    console.log(`📊 [Mestre] ${allMatches.length} jogos agendados, ${standings.length} times na tabela`);

    if (allMatches.length === 0) {
      console.log('ℹ️ [Mestre] Nenhum jogo agendado. Tentando buscar jogos da próxima rodada...');
      return { generated: 0, errors: 0, skipped: 0 };
    }

    // Pegar os próximos 8 jogos
    const matchesToProcess = allMatches.slice(0, 8);

    for (const match of matchesToProcess) {
      try {
        console.log(`\n🔍 [Mestre] Analisando: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

        // Buscar dados ricos (forma recente, médias, H2H)
        const richData = await fetchRichMatchData(match, standings);

        // Montar prompt rico
        const prompt = buildRichPrompt(match, richData);

        // Gerar palpite com IA
        const aiPrediction = await generatePredictionWithAI(prompt);

        // Salvar no banco
        const result = await savePrediction(match, aiPrediction);
        if (result === 'skipped') {
          skipped++;
        } else {
          generated++;
        }

        // Pausa entre requisições para respeitar rate limits
        await sleep(1500);

      } catch (matchError) {
        const errMsg = matchError instanceof Error ? matchError.message : String(matchError);
        console.error(`❌ [Mestre] Erro em ${match.homeTeam?.name} vs ${match.awayTeam?.name}: ${errMsg}`);
        errors++;
        await sleep(1000);
      }
    }

    console.log(`\n✅ [Mestre] Concluído: ${generated} gerados, ${skipped} pulados, ${errors} erros`);
    return { generated, errors, skipped };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Mestre] Erro geral: ${errMsg}`);
    throw error;
  }
}
