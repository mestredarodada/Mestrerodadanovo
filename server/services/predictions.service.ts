import axios from 'axios';
import { getDb } from '../db';
import { predictions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendPredictionToTelegram } from './telegram.service';
import { fetchLatestFootballNews } from './news.service';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';

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

    // Buscar jogos exatamente como o site faz
    const matchesResponse = await axios.get(
      'https://api.football-data.org/v4/competitions/BSA/matches',
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const allMatches = matchesResponse.data.matches || [];
    
    // Filtrar jogos que estão SCHEDULED ou TIMED (exatamente o que o site mostra como próximos)
    let matches = allMatches.filter((m: any) => m.status === 'SCHEDULED' || m.status === 'TIMED');

    // Se não houver jogos futuros (ex: fim de temporada), pegar os últimos 10 para ter o que analisar
    if (matches.length === 0) {
      console.log('⚠️ Nenhum jogo futuro encontrado. Pegando últimos jogos para análise...');
      matches = allMatches.slice(-10);
    } else {
      // Pegar apenas os próximos 10 jogos para não sobrecarregar a API
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

  const prompt = `Você é o "Mestre da Rodada", um analista de futebol especializado em palpites para o Brasileirão Série A 2026.\nSua tarefa é analisar o próximo jogo e gerar um palpite bem fundamentado com análises detalhadas.\n\n## NOTÍCIAS RECENTES:\n${latestNews}\n\n## DADOS DO JOGO:\n- **Data**: ${new Date(match.utcDate).toLocaleDateString('pt-BR')}\n- **Rodada**: ${match.matchday}\n- **Estádio**: ${match.venue || 'Não informado'}\n\n## TIME DA CASA:\n- **Nome**: ${homeTeam?.team.name || match.homeTeam.name}\n- **Posição**: ${homeTeam?.position}º lugar\n- **Pontos**: ${homeTeam?.points}\n- **Jogos**: ${homeTeam?.playedGames}\n- **Vitórias**: ${homeTeam?.won} | **Empates**: ${homeTeam?.draw} | **Derrotas**: ${homeTeam?.lost}\n- **Gols Pró**: ${homeTeam?.goalsFor} | **Gols Contra**: ${homeTeam?.goalsAgainst} | **Saldo**: ${homeTeam?.goalDifference}\n\n## TIME VISITANTE:\n- **Nome**: ${awayTeam?.team.name || match.awayTeam.name}\n- **Posição**: ${awayTeam?.position}º lugar\n- **Pontos**: ${awayTeam?.points}\n- **Jogos**: ${awayTeam?.playedGames}\n- **Vitórias**: ${awayTeam?.won} | **Empates**: ${awayTeam?.draw} | **Derrotas**: ${awayTeam?.lost}\n- **Gols Pró**: ${awayTeam?.goalsFor} | **Gols Contra**: ${awayTeam?.goalsAgainst} | **Saldo**: ${awayTeam?.goalDifference}\n\n## INSTRUÇÕES:\n1. Analise os dados estatísticos de ambos os times.\n2. Considere o fator mando de campo (time da casa tem vantagem).\n3. Avalie a forma atual (pontos recentes, saldo de gols).\n4. Gere um palpite estruturado com:\n   - **Vencedor Provável**: Qual time tem mais chances de vencer\n   - **Confiança**: Alta/Média/Baixa\n   - **Previsão de Gols**: Over/Under 2.5 gols\n   - **Dica Extra**: Ambas Marcam, Escanteios, Cartões, etc\n   - **Justificativa**: Um parágrafo explicando seu raciocínio\n\nResponda APENAS em JSON válido com a seguinte estrutura exata (sem markdown, sem explicações adicionais):\n{\n  "mainPrediction": "HOME|DRAW|AWAY",\n  "mainConfidence": "HIGH|MEDIUM|LOW",\n  "goalsPrediction": "OVER_2_5|UNDER_2_5",\n  "goalsConfidence": "HIGH|MEDIUM|LOW",\n  "extraTip": "Descrição da dica (ex: Ambas Marcam SIM, Over 9 Escanteios)",\n  "extraConfidence": "HIGH|MEDIUM|LOW",\n  "cornersPrediction": "OVER_9|UNDER_9",\n  "cornersConfidence": "HIGH|MEDIUM|LOW",\n  "cardsPrediction": "OVER_4_5|UNDER_4_5",\n  "cardsConfidence": "HIGH|MEDIUM|LOW",\n  "bothTeamsToScore": "YES|NO",\n  "bothTeamsToScoreConfidence": "HIGH|MEDIUM|LOW",\n  "justification": "Parágrafo explicativo detalhado"\n}`;

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://mestredarodada.onrender.com',
          'X-Title': 'Mestre da Rodada',
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = response.data.choices[0].message.content || '{}';
    // Limpar markdown se a IA retornar
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const prediction = JSON.parse(cleanedJson);

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
  } catch (error) {
    console.error('Erro ao gerar palpite com OpenRouter:', error);
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
  
  // Verificar se já existe uma previsão para este jogo
  const existing = await database
    .select()
    .from(predictions)
    .where(eq(predictions.matchId, String(match.id)))
    .limit(1);

  const predictionData = {
    matchId: String(match.id),
    homeTeamId: String(match.homeTeam.id),
    homeTeamName: match.homeTeam.name,
    homeTeamCrest: match.homeTeam.crest,
    awayTeamId: String(match.awayTeam.id),
    awayTeamName: match.awayTeam.name,
    awayTeamCrest: match.awayTeam.crest,
    matchDate: new Date(match.utcDate),
    matchday: String(match.matchday),
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
    mainPrediction: aiPrediction.mainPrediction || 'DRAW',
    mainConfidence: aiPrediction.mainConfidence || 'MEDIUM',
    goalsPrediction: aiPrediction.goalsPrediction || 'UNDER_2_5',
    goalsConfidence: aiPrediction.goalsConfidence || 'MEDIUM',
    extraTip: aiPrediction.extraTip || 'Análise em processamento',
    extraConfidence: aiPrediction.extraConfidence || 'MEDIUM',
    cornersPrediction: aiPrediction.cornersPrediction || null,
    cornersConfidence: aiPrediction.cornersConfidence || null,
    cardsPrediction: aiPrediction.cardsPrediction || null,
    cardsConfidence: aiPrediction.cardsConfidence || null,
    bothTeamsToScore: aiPrediction.bothTeamsToScore || null,
    bothTeamsToScoreConfidence: aiPrediction.bothTeamsToScoreConfidence || null,
    justification: aiPrediction.justification || 'Justificativa não gerada.',
    isPublished: false, // Por padrão, não publica automaticamente
  };

  if (existing.length > 0) {
    // Atualizar previsão existente
    await database
      .update(predictions)
      .set(predictionData)
      .where(eq(predictions.matchId, String(match.id)));
  } else {
    // Inserir nova previsão
    await database.insert(predictions).values(predictionData);
  }
}

export async function generateAllPredictions() {
  console.log('🚀 Iniciando geração de palpites...');

  try {
    console.log('📡 Buscando dados do Brasileirão...');
    const { standings, matches } = await fetchBrazileiraoData();
    console.log(`✅ Dados recebidos: ${matches.length} jogos, ${standings.length} times`);

    if (matches.length === 0) {
      console.log('❌ Nenhum jogo agendado encontrado.');
      return { generated: 0, errors: 0 };
    }

    console.log(`📊 ${matches.length} jogos encontrados. Gerando palpites...`);
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

        console.log(`🤖 Gerando palpite para ${match.homeTeam.name} vs ${match.awayTeam.name}...`);
        const aiPrediction = await generatePredictionWithAI(standings, match);
        console.log(`✅ IA retornou palpite para ${match.homeTeam.name}`);

        await savePredictionToDatabase(match, homeTeam, awayTeam, aiPrediction);
        generated++;

        console.log(`✅ Palpite salvo para ${match.homeTeam.name} vs ${match.awayTeam.name}`);

        // Enviar para o Telegram
        try {
          await sendPredictionToTelegram({
            homeTeamName: match.homeTeam.name,
            awayTeamName: match.awayTeam.name,
            mainPrediction: aiPrediction.mainPrediction,
            mainConfidence: aiPrediction.mainConfidence,
            goalsPrediction: aiPrediction.goalsPrediction,
            goalsConfidence: aiPrediction.goalsConfidence,
            cornersPrediction: aiPrediction.cornersPrediction,
            cornersConfidence: aiPrediction.cornersConfidence,
            cardsPrediction: aiPrediction.cardsPrediction,
            cardsConfidence: aiPrediction.cardsConfidence,
            bothTeamsToScore: aiPrediction.bothTeamsToScore,
            bothTeamsToScoreConfidence: aiPrediction.bothTeamsToScoreConfidence,
            justification: aiPrediction.justification,
            matchDate: new Date(match.utcDate),
          });
          console.log(`📤 Palpite enviado para o Telegram: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        } catch (telegramError) {
          console.error(`❌ Erro ao enviar para o Telegram (${match.homeTeam.name} vs ${match.awayTeam.name}):`, telegramError);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar jogo ${match.homeTeam.name} vs ${match.awayTeam.name}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log(`✨ Geração de palpites concluída! Gerados: ${generated}, Erros: ${errors}`);
    return { generated, errors };
  } catch (error) {
    console.error('❌ Erro durante a geração de palpites:', error instanceof Error ? error.message : error);
    throw error;
  }
}
