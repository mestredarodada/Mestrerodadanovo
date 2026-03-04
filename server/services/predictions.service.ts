import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { db } from '../db';
import { predictions } from '../db/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface MatchData {
  id: string;
  homeTeam: { id: string; name: string; shortName: string; crest: string };
  awayTeam: { id: string; name: string; shortName: string; crest: string };
  utcDate: string;
  matchday: number;
  venue: string;
  status: string;
}

interface StandingTeam {
  position: number;
  team: { id: string; name: string; shortName: string; crest: string };
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
      'https://api.football-data.org/v4/competitions/BSA/matches?status=SCHEDULED',
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const standings: StandingTeam[] = standingsResponse.data.standings[0]?.table || [];
    const matches: MatchData[] = matchesResponse.data.matches || [];

    return { standings, matches };
  } catch (error) {
    console.error('Erro ao buscar dados do Brasileirão:', error);
    throw error;
  }
}

export async function generatePredictionWithGemini(
  standings: StandingTeam[],
  match: MatchData
) {
  const homeTeam = standings.find((t) => t.team.id === match.homeTeam.id);
  const awayTeam = standings.find((t) => t.team.id === match.awayTeam.id);

  const prompt = `Você é o "Mestre da Rodada", um analista de futebol especializado em palpites para o Brasileirão Série A 2026.
Sua tarefa é analisar o próximo jogo e gerar um palpite bem fundamentado com análises detalhadas.

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

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extrair JSON da resposta
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Não foi possível extrair o JSON da resposta do Gemini');
  }

  const prediction = JSON.parse(jsonMatch[0]);

  return {
    mainPrediction: prediction.mainPrediction,
    mainConfidence: prediction.mainConfidence,
    goalsPrediction: prediction.goalsPrediction,
    goalsConfidence: prediction.goalsConfidence,
    extraTip: prediction.extraTip,
    extraConfidence: prediction.extraConfidence,
    cornersPrediction: prediction.cornersPrediction,
    cornersConfidence: prediction.cornersConfidence,
    cardsPrediction: prediction.cardsPrediction,
    cardsConfidence: prediction.cardsConfidence,
    bothTeamsToScore: prediction.bothTeamsToScore,
    bothTeamsToScoreConfidence: prediction.bothTeamsToScoreConfidence,
    justification: prediction.justification,
  };
}

export async function savePredictionToDatabase(
  match: MatchData,
  homeTeam: StandingTeam,
  awayTeam: StandingTeam,
  geminiPrediction: any
) {
  // Verificar se já existe uma previsão para este jogo
  const existing = await db
    .select()
    .from(predictions)
    .where(eq(predictions.matchId, match.id))
    .limit(1);

  const predictionData = {
    matchId: match.id,
    homeTeamId: match.homeTeam.id,
    homeTeamName: match.homeTeam.name,
    homeTeamCrest: match.homeTeam.crest,
    awayTeamId: match.awayTeam.id,
    awayTeamName: match.awayTeam.name,
    awayTeamCrest: match.awayTeam.crest,
    matchDate: new Date(match.utcDate),
    matchday: match.matchday,
    venue: match.venue,
    homeTeamPosition: homeTeam.position,
    homeTeamPoints: homeTeam.points,
    homeTeamPlayedGames: homeTeam.playedGames,
    homeTeamWon: homeTeam.won,
    homeTeamDraw: homeTeam.draw,
    homeTeamLost: homeTeam.lost,
    homeTeamGoalsFor: homeTeam.goalsFor,
    homeTeamGoalsAgainst: homeTeam.goalsAgainst,
    homeTeamGoalDifference: homeTeam.goalDifference,
    awayTeamPosition: awayTeam.position,
    awayTeamPoints: awayTeam.points,
    awayTeamPlayedGames: awayTeam.playedGames,
    awayTeamWon: awayTeam.won,
    awayTeamDraw: awayTeam.draw,
    awayTeamLost: awayTeam.lost,
    awayTeamGoalsFor: awayTeam.goalsFor,
    awayTeamGoalsAgainst: awayTeam.goalsAgainst,
    awayTeamGoalDifference: awayTeam.goalDifference,
    mainPrediction: geminiPrediction.mainPrediction,
    mainConfidence: geminiPrediction.mainConfidence,
    goalsPrediction: geminiPrediction.goalsPrediction,
    goalsConfidence: geminiPrediction.goalsConfidence,
    extraTip: geminiPrediction.extraTip,
    extraConfidence: geminiPrediction.extraConfidence,
    cornersPrediction: geminiPrediction.cornersPrediction,
    cornersConfidence: geminiPrediction.cornersConfidence,
    cardsPrediction: geminiPrediction.cardsPrediction,
    cardsConfidence: geminiPrediction.cardsConfidence,
    bothTeamsToScore: geminiPrediction.bothTeamsToScore,
    bothTeamsToScoreConfidence: geminiPrediction.bothTeamsToScoreConfidence,
    justification: geminiPrediction.justification,
  };

  if (existing.length > 0) {
    // Atualizar previsão existente
    await db
      .update(predictions)
      .set(predictionData)
      .where(eq(predictions.matchId, match.id));
  } else {
    // Inserir nova previsão
    await db.insert(predictions).values(predictionData);
  }
}

export async function generateAllPredictions() {
  console.log('🚀 Iniciando geração de palpites...');

  try {
    const { standings, matches } = await fetchBrazileiraoData();

    if (matches.length === 0) {
      console.log('❌ Nenhum jogo agendado encontrado.');
      return;
    }

    console.log(`📊 ${matches.length} jogos encontrados. Gerando palpites...`);

    for (const match of matches) {
      try {
        const homeTeam = standings.find((t) => t.team.id === match.homeTeam.id);
        const awayTeam = standings.find((t) => t.team.id === match.awayTeam.id);

        if (!homeTeam || !awayTeam) {
          console.log(`⚠️  Equipes não encontradas para ${match.homeTeam.name} vs ${match.awayTeam.name}`);
          continue;
        }

        console.log(`🤖 Gerando palpite para ${match.homeTeam.name} vs ${match.awayTeam.name}...`);
        const geminiPrediction = await generatePredictionWithGemini(standings, match);

        await savePredictionToDatabase(match, homeTeam, awayTeam, geminiPrediction);

        console.log(`✅ Palpite salvo para ${match.homeTeam.name} vs ${match.awayTeam.name}`);
      } catch (error) {
        console.error(`❌ Erro ao processar jogo ${match.homeTeam.name} vs ${match.awayTeam.name}:`, error);
      }
    }

    console.log('✨ Geração de palpites concluída!');
  } catch (error) {
    console.error('❌ Erro durante a geração de palpites:', error);
    throw error;
  }
}
