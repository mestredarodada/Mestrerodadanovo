import axios from 'axios';
import { getDb } from '../db';
import { predictions, predictionsSimple } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendPredictionToTelegram } from './telegram.service';
import { fetchLatestFootballNews } from './news.service';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

interface MatchData {
  id: number;
  homeTeam: { id: number; name: string; shortName: string; crest: string };
  awayTeam: { id: number; name: string; shortName: string; crest: string };
  utcDate: string;
  matchday: number;
  venue: string;
  status: string;
}

interface StandingTeam {
  position: number;
  team: { id: number; name: string; shortName: string; crest: string };
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export async function fetchBrazileiraoData() {
  try {
    const standingsResponse = await axios.get(
      'https://api.football-data.org/v4/competitions/BSA/standings',
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const matchesResponse = await axios.get(
      'https://api.football-data.org/v4/competitions/BSA/matches',
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const allMatches = matchesResponse.data.matches || [];
    let matches = allMatches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED');

    if (matches.length === 0) {
      console.log('⚠️ Nenhum jogo futuro encontrado. Pegando últimos jogos para análise...');
      matches = allMatches.slice(-10);
    } else {
      matches = matches.slice(0, 10);
    }

    const standings: StandingTeam[] = standingsResponse.data.standings[0]?.table || [];

    return { standings, matches };
  } catch (error) {
    console.error('Erro ao buscar dados do Brasileirão:', error);
    throw error;
  }
}

export async function generatePredictionWithAI(
  standings: StandingTeam[],
  match: MatchData
) {
  const homeTeam = standings.find((t) => t.team.id === match.homeTeam.id);
  const awayTeam = standings.find((t) => t.team.id === match.awayTeam.id);
  const latestNews = await fetchLatestFootballNews();

  const prompt = `Você é o "Mestre da Rodada", um analista de futebol especializado em palpites para o Brasileirão Série A 2026.
Sua tarefa é analisar o próximo jogo e gerar um palpite bem fundamentado com análises detalhadas.

## NOTÍCIAS RECENTES:
${latestNews}

## DADOS DO JOGO:
- **Data**: ${new Date(match.utcDate).toLocaleDateString('pt-BR')}
- **Rodada**: ${match.matchday}
- **Estádio**: ${match.venue || 'Não informado'}

## TIME DA CASA:
- **Nome**: ${homeTeam?.team.name || match.homeTeam.name}
- **Posição**: ${homeTeam?.position}º lugar
- **Pontos**: ${homeTeam?.points}
- **Jogos**: ${homeTeam?.playedGames}
- **Vitórias**: ${homeTeam?.won} | **Empates**: ${homeTeam?.draw} | **Derrotas**: ${homeTeam?.lost}
- **Gols Pró**: ${homeTeam?.goalsFor} | **Gols Contra**: ${homeTeam?.goalsAgainst} | **Saldo**: ${homeTeam?.goalDifference}

## TIME VISITANTE:
- **Nome**: ${awayTeam?.team.name || match.awayTeam.name}
- **Posição**: ${awayTeam?.position}º lugar
- **Pontos**: ${awayTeam?.points}
- **Jogos**: ${awayTeam?.playedGames}
- **Vitórias**: ${awayTeam?.won} | **Empates**: ${awayTeam?.draw} | **Derrotas**: ${awayTeam?.lost}
- **Gols Pró**: ${awayTeam?.goalsFor} | **Gols Contra**: ${awayTeam?.goalsAgainst} | **Saldo**: ${awayTeam?.goalDifference}

## INSTRUÇÕES:
1. Analise os dados estatísticos de ambos os times.
2. Considere o fator mando de campo (time da casa tem vantagem).
3. Avalie a forma atual (pontos recentes, saldo de gols).
4. Gere um palpite estruturado com:
   - **Vencedor Provável**: Qual time tem mais chances de vencer
   - **Confiança**: Alta/Média/Baixa
   - **Previsão de Gols**: Over/Under 2.5 gols
   - **Dica Extra**: Ambas Marcam, Escanteios, Cartões, etc
   - **Justificativa**: Um parágrafo explicando seu raciocínio

Responda APENAS em JSON válido com a seguinte estrutura exata (sem markdown, sem explicações adicionais):
{
  "mainPrediction": "HOME|DRAW|AWAY",
  "mainConfidence": "HIGH|MEDIUM|LOW",
  "goalsPrediction": "OVER_2_5|UNDER_2_5",
  "goalsConfidence": "HIGH|MEDIUM|LOW",
  "extraTip": "Descrição da dica (ex: Ambas Marcam SIM, Over 9 Escanteios)",
  "extraConfidence": "HIGH|MEDIUM|LOW",
  "cornersPrediction": "OVER_9|UNDER_9",
  "cornersConfidence": "HIGH|MEDIUM|LOW",
  "cardsPrediction": "OVER_4_5|UNDER_4_5",
  "cardsConfidence": "HIGH|MEDIUM|LOW",
  "bothTeamsToScore": "YES|NO",
  "bothTeamsToScoreConfidence": "HIGH|MEDIUM|LOW",
  "justification": "Parágrafo explicativo detalhado"
}`;

  try {
    console.log(`🤖 Chamando Groq (Llama 3.3 70B) para ${homeTeam?.team.name || match.homeTeam.name} vs ${awayTeam?.team.name || match.awayTeam.name}...`);
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Resposta recebida do Groq');
    const responseText = response.data.choices[0].message.content || '{}';
    
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const prediction = JSON.parse(cleanedJson);

    return {
      mainPrediction: prediction.mainPrediction || 'DRAW',
      mainConfidence: prediction.mainConfidence || 'LOW',
      goalsPrediction: prediction.goalsPrediction || 'UNDER_2_5',
      goalsConfidence: prediction.goalsConfidence || 'LOW',
      extraTip: prediction.extraTip || 'Análise em andamento',
      extraConfidence: prediction.extraConfidence || 'LOW',
      cornersPrediction: prediction.cornersPrediction || 'UNDER_9',
      cornersConfidence: prediction.cornersConfidence || 'LOW',
      cardsPrediction: prediction.cardsPrediction || 'UNDER_4_5',
      cardsConfidence: prediction.cardsConfidence || 'LOW',
      bothTeamsToScore: prediction.bothTeamsToScore || 'NO',
      bothTeamsToScoreConfidence: prediction.bothTeamsToScoreConfidence || 'LOW',
      justification: prediction.justification || 'Justificativa não gerada.',
    };
  } catch (error) {
    console.error('❌ Erro ao gerar palpite com Groq:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function savePredictionToDatabase(
  match: MatchData,
  homeTeam: StandingTeam,
  awayTeam: StandingTeam,
  aiPrediction: any
) {
  const database = getDb();
  
  console.log(`💾 Verificando existência de palpite para jogo ID: ${match.id}`);
  
  const existing = await database
    .select()
    .from(predictionsSimple)
    .where(eq(predictionsSimple.matchId, String(match.id)))
    .limit(1);

  const predictionData: any = {
    matchId: String(match.id),
    homeTeamName: homeTeam.team.name || match.homeTeam.name,
    homeTeamCrest: homeTeam.team.crest || match.homeTeam.crest,
    awayTeamName: awayTeam.team.name || match.awayTeam.name,
    awayTeamCrest: awayTeam.team.crest || match.awayTeam.crest,
    matchDate: new Date(match.utcDate),
    
    // Palpites
    mainPrediction: aiPrediction.mainPrediction,
    mainConfidence: aiPrediction.mainConfidence,
    goalsPrediction: aiPrediction.goalsPrediction,
    goalsConfidence: aiPrediction.goalsConfidence,
    extraTip: aiPrediction.extraTip,
    extraConfidence: aiPrediction.extraConfidence,
    cornersPrediction: aiPrediction.cornersPrediction,
    cornersConfidence: aiPrediction.cornersConfidence,
    cardsPrediction: aiPrediction.cardsPrediction,
    cardsConfidence: aiPrediction.cardsConfidence,
    bothTeamsToScore: aiPrediction.bothTeamsToScore,
    bothTeamsToScoreConfidence: aiPrediction.bothTeamsToScoreConfidence,
    justification: aiPrediction.justification,
    isPublished: false,
  };

  if (existing.length === 0) {
    console.log(`➕ Inserindo novo palpite para ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    await database.insert(predictionsSimple).values(predictionData);
  } else {
    console.log(`🔄 Atualizando palpite existente para ${predictionData.homeTeamName} vs ${predictionData.awayTeamName}`);
    await database
      .update(predictionsSimple)
      .set(predictionData)
      .where(eq(predictionsSimple.matchId, String(match.id)));
  }
}

export async function generateAllPredictions() {
  console.log('🚀 Iniciando geração de palpites...');

  try {
    const { standings, matches } = await fetchBrazileiraoData();
    console.log(`✅ Dados recebidos: ${matches.length} jogos, ${standings.length} times`);

    if (matches.length === 0) {
      console.log('❌ Nenhum jogo agendado encontrado.');
      return { generated: 0, errors: 0 };
    }

    let generated = 0;
    let errors = 0;

    for (const match of matches) {
      try {
        const homeTeam = standings.find((t) => t.team.id === match.homeTeam.id);
        const awayTeam = standings.find((t) => t.team.id === match.awayTeam.id);

        if (!homeTeam || !awayTeam) {
          console.log(`⚠️  Equipes não encontradas para ${match.homeTeam.name} vs ${match.awayTeam.name}`);
          errors++;
          continue;
        }

        const aiPrediction = await generatePredictionWithAI(standings, match);
        await savePredictionToDatabase(match, homeTeam, awayTeam, aiPrediction);
        generated++;

        console.log(`✅ Palpite salvo: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

        try {
          await sendPredictionToTelegram({
            homeTeamName: homeTeam.team.name,
            awayTeamName: awayTeam.team.name,
            mainPrediction: aiPrediction.mainPrediction,
            mainConfidence: aiPrediction.mainConfidence,
            goalsPrediction: aiPrediction.goalsPrediction,
            goalsConfidence: aiPrediction.goalsConfidence,
            cornersPrediction: aiPrediction.cornersPrediction || undefined,
            cardsPrediction: aiPrediction.cardsPrediction || undefined,
            bothTeamsToScore: aiPrediction.bothTeamsToScore || undefined,
            justification: aiPrediction.justification,
            matchDate: new Date(match.utcDate),
          });
        } catch (telegramError) {
          console.error(`❌ Erro Telegram:`, telegramError);
        }
      } catch (error) {
        console.error(`❌ Erro no jogo ${match.homeTeam.name}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log(`✨ Concluído! Gerados: ${generated}, Erros: ${errors}`);
    return { generated, errors };
  } catch (error) {
    console.error('❌ Erro geral:', error instanceof Error ? error.message : error);
    throw error;
  }
}
