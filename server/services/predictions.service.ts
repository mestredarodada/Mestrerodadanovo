import axios from 'axios';
import { getDb } from '../db';
import { predictions } from '../db/schema';
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
    console.log(`🤖 Chamando Groq (Llama 3.3 70B) para ${homeTeam?.team.name} vs ${awayTeam?.team.name}...`);
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
    console.log(`📄 Resposta da IA (primeiros 200 caracteres): ${responseText.substring(0, 200)}`);
    
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
    console.error('❌ Erro ao gerar palpite com Groq:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.includes('401')) {
      console.error('❌ Erro de autenticacao: Verifique a chave da API do Groq');
    }
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
    homeTeamName: homeTeam.team.name,
    awayTeamName: awayTeam.team.name,
    homeTeamCrest: homeTeam.team.crest,
    awayTeamCrest: awayTeam.team.crest,
    matchDate: new Date(match.utcDate),
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
    publishedAt: null,
  };

  if (existing.length === 0) {
    console.log(`➕ Inserindo novo palpite para ${homeTeam.team.name} vs ${awayTeam.team.name}`);
    await database.insert(predictions).values(predictionData);
  } else {
    console.log(`🔄 Atualizando palpite existente para ${homeTeam.team.name} vs ${awayTeam.team.name}`);
    await database
      .update(predictions)
      .set(predictionData)
      .where(eq(predictions.matchId, String(match.id)));
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
