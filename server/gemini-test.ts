import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function fetchBrazileiraoData() {
  try {
    const standingsResponse = await axios.get(
      "https://api.football-data.org/v4/competitions/BSA/standings",
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const matchesResponse = await axios.get(
      "https://api.football-data.org/v4/competitions/BSA/matches?status=SCHEDULED",
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
        },
      }
    );

    const standings = standingsResponse.data.standings[0]?.table || [];
    const matches = matchesResponse.data.matches || [];

    return { standings, matches };
  } catch (error) {
    console.error("Erro ao buscar dados do Brasileirão:", error);
    throw error;
  }
}

async function generatePredictionWithGemini(
  standings: any[],
  match: any
) {
  const homeTeam = standings.find((t) => t.team.id === match.homeTeam.id);
  const awayTeam = standings.find((t) => t.team.id === match.awayTeam.id);

  const prompt = `
Você é o "Mestre da Rodada", um analista de futebol especializado em palpites para o Brasileirão Série A. 
Sua tarefa é analisar o próximo jogo e gerar um palpite bem fundamentado.

## DADOS DO JOGO:
- **Data**: ${new Date(match.utcDate).toLocaleDateString("pt-BR")}
- **Rodada**: ${match.matchday}
- **Estádio**: ${match.venue || "Não informado"}

## TIME DA CASA:
- **Nome**: ${homeTeam?.team.name || match.homeTeam.name}
- **Posição**: ${homeTeam?.position}º lugar
- **Pontos**: ${homeTeam?.points}
- **Jogos**: ${homeTeam?.playedGames}
- **Vitórias**: ${homeTeam?.won}
- **Empates**: ${homeTeam?.draw}
- **Derrotas**: ${homeTeam?.lost}
- **Gols Pró**: ${homeTeam?.goalsFor}
- **Gols Contra**: ${homeTeam?.goalsAgainst}
- **Saldo de Gols**: ${homeTeam?.goalDifference}

## TIME VISITANTE:
- **Nome**: ${awayTeam?.team.name || match.awayTeam.name}
- **Posição**: ${awayTeam?.position}º lugar
- **Pontos**: ${awayTeam?.points}
- **Jogos**: ${awayTeam?.playedGames}
- **Vitórias**: ${awayTeam?.won}
- **Empates**: ${awayTeam?.draw}
- **Derrotas**: ${awayTeam?.lost}
- **Gols Pró**: ${awayTeam?.goalsFor}
- **Gols Contra**: ${awayTeam?.goalsAgainst}
- **Saldo de Gols**: ${awayTeam?.goalDifference}

## INSTRUÇÕES:
1. Analise os dados estatísticos de ambos os times.
2. Considere o fator mando de campo (time da casa tem vantagem).
3. Avalie a forma atual (pontos recentes, saldo de gols).
4. Gere um palpite estruturado com:
   - **Vencedor Provável**: Qual time tem mais chances de vencer (Casa/Empate/Fora)
   - **Confiança**: Alta/Média/Baixa
   - **Previsão de Gols**: Over/Under 2.5 gols
   - **Dica Extra**: Ambas Marcam (Sim/Não) ou outra observação relevante
   - **Justificativa**: Um parágrafo explicando seu raciocínio

Responda em JSON com a seguinte estrutura:
{
  "match": "Time Casa vs Time Fora",
  "mainPrediction": {
    "value": "Casa/Empate/Fora",
    "confidence": "Alta/Média/Baixa"
  },
  "goalsPrediction": {
    "value": "Over/Under 2.5",
    "confidence": "Alta/Média/Baixa"
  },
  "extraTip": {
    "value": "Descrição da dica",
    "confidence": "Alta/Média/Baixa"
  },
  "justification": "Parágrafo explicativo"
}
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extrair JSON da resposta
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Não foi possível extrair o JSON da resposta do Gemini");
  }

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log("🚀 Iniciando teste do Gemini para palpites do Mestre...\n");

  try {
    console.log("📊 Buscando dados do Brasileirão...");
    const { standings, matches } = await fetchBrazileiraoData();

    if (matches.length === 0) {
      console.log("❌ Nenhum jogo agendado encontrado.");
      return;
    }

    const nextMatch = matches[0];
    console.log(
      `✅ Próximo jogo encontrado: ${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}\n`
    );

    console.log("🤖 Gerando palpite com Gemini...");
    const prediction = await generatePredictionWithGemini(standings, nextMatch);

    console.log("\n✨ PALPITE DO MESTRE GERADO COM SUCESSO!\n");
    console.log(JSON.stringify(prediction, null, 2));

    console.log("\n✅ Teste concluído! O Gemini está funcionando perfeitamente.");
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
    process.exit(1);
  }
}

main();
