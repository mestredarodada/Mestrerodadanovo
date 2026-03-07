import axios from 'axios';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { eq } from 'drizzle-orm';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
if (!GROQ_API_KEY) {
  console.warn('[predictions.service] GROQ_API_KEY não configurada. Geração de palpites desabilitada.');
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ─── Buscar dados do Brasileirão ──────────────────────────────────────────────
async function fetchBrazileiraoData() {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';
  const headers = { 'X-Auth-Token': FOOTBALL_API_KEY };

  const [standingsRes, matchesRes] = await Promise.all([
    axios.get('https://api.football-data.org/v4/competitions/BSA/standings', { headers }),
    axios.get('https://api.football-data.org/v4/competitions/BSA/matches?status=SCHEDULED', { headers }),
  ]);

  const standings = standingsRes.data.standings[0]?.table || [];
  const matches = matchesRes.data.matches || [];

  return { standings, matches };
}

// ─── Gerar palpite via Groq ───────────────────────────────────────────────────
async function generatePredictionWithAI(matchInfo: string): Promise<any> {
  const systemPrompt = `Você é o Mestre da Rodada, um especialista em análise de futebol brasileiro com décadas de experiência no Brasileirão Série A. Você analisa dados estatísticos e fornece palpites precisos e fundamentados.

Retorne APENAS um JSON válido, sem texto adicional, com esta estrutura exata:
{
  "mainPrediction": "HOME" | "DRAW" | "AWAY",
  "mainConfidence": "HIGH" | "MEDIUM" | "LOW",
  "goalsPrediction": "OVER_2_5" | "UNDER_2_5",
  "goalsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "bothTeamsToScore": "YES" | "NO",
  "bothTeamsToScoreConfidence": "HIGH" | "MEDIUM" | "LOW",
  "cornersPrediction": "OVER_9" | "UNDER_9",
  "cornersConfidence": "HIGH" | "MEDIUM" | "LOW",
  "cardsPrediction": "OVER_4_5" | "UNDER_4_5",
  "cardsConfidence": "HIGH" | "MEDIUM" | "LOW",
  "extraTip": "string com dica extra relevante",
  "extraConfidence": "HIGH" | "MEDIUM" | "LOW",
  "justification": "string com análise detalhada em português (mínimo 3 frases)"
}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: matchInfo },
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }

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
    justification: aiPrediction.justification,
    isPublished: true, // Publicado automaticamente sempre
  };

  const existing = await db
    .select()
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, predictionData.matchId));

  if (existing.length === 0) {
    await db.insert(predictionsSimple).values(predictionData);
    console.log(`✅ Palpite criado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
  } else {
    await db
      .update(predictionsSimple)
      .set({ ...predictionData, isPublished: true })
      .where(eq(predictionsSimple.matchId, predictionData.matchId));
    console.log(`🔄 Palpite atualizado: ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
  }
}

// ─── Função principal ─────────────────────────────────────────────────────────
export async function generateAllPredictions(): Promise<{ generated: number; errors: number }> {
  console.log('🚀 Iniciando geração de palpites...');

  if (!GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY não configurada. Impossível gerar palpites.');
    throw new Error('GROQ_API_KEY não configurada no servidor. Configure a variável de ambiente no Render.');
  }

  let generated = 0;
  let errors = 0;

  try {
    const { standings, matches } = await fetchBrazileiraoData();
    console.log(`✅ Dados: ${matches.length} jogos agendados, ${standings.length} times`);

    if (matches.length === 0) {
      console.log('ℹ️ Nenhum jogo agendado encontrado.');
      return { generated: 0, errors: 0 };
    }

    // Processar no máximo 10 jogos por vez para não estourar o timeout
    const matchesToProcess = matches.slice(0, 10);

    for (const match of matchesToProcess) {
      try {
        // Verificar se já existe palpite recente (menos de 24h)
        const existing = await db
          .select()
          .from(predictionsSimple)
          .where(eq(predictionsSimple.matchId, String(match.id)));

        if (existing.length > 0) {
          const createdAt = new Date(existing[0].createdAt);
          const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 24) {
            console.log(`⏭️ Palpite recente para ${match.homeTeam.name} vs ${match.awayTeam.name}, pulando...`);
            continue;
          }
        }

        // Buscar dados dos times na classificação
        const homeTeamData = standings.find((s: any) => s.team.id === match.homeTeam.id);
        const awayTeamData = standings.find((s: any) => s.team.id === match.awayTeam.id);

        const matchInfo = `
Jogo: ${match.homeTeam.name} (Casa) vs ${match.awayTeam.name} (Visitante)
Data: ${new Date(match.utcDate).toLocaleString('pt-BR')}
Rodada: ${match.matchday || 'N/A'}

${homeTeamData ? `${match.homeTeam.name} - Posição: ${homeTeamData.position}º, Pontos: ${homeTeamData.points}, Jogos: ${homeTeamData.playedGames}, V/E/D: ${homeTeamData.won}/${homeTeamData.draw}/${homeTeamData.lost}, Gols: ${homeTeamData.goalsFor}/${homeTeamData.goalsAgainst}` : `${match.homeTeam.name} - dados não disponíveis`}

${awayTeamData ? `${match.awayTeam.name} - Posição: ${awayTeamData.position}º, Pontos: ${awayTeamData.points}, Jogos: ${awayTeamData.playedGames}, V/E/D: ${awayTeamData.won}/${awayTeamData.draw}/${awayTeamData.lost}, Gols: ${awayTeamData.goalsFor}/${awayTeamData.goalsAgainst}` : `${match.awayTeam.name} - dados não disponíveis`}

Analise este jogo e forneça seus palpites.`;

        console.log(`🔍 Analisando: ${match.homeTeam.name} vs ${match.awayTeam.name}...`);
        const aiPrediction = await generatePredictionWithAI(matchInfo);
        await savePrediction(match, aiPrediction);
        generated++;

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (matchError) {
        console.error(`❌ Erro no jogo ${match.homeTeam?.name} vs ${match.awayTeam?.name}:`, matchError instanceof Error ? matchError.message : matchError);
        errors++;
      }
    }

    console.log(`✅ Geração concluída: ${generated} palpites gerados, ${errors} erros`);
    return { generated, errors };

  } catch (error) {
    console.error('❌ Erro geral na geração:', error);
    throw error;
  }
}
