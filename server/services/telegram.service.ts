import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface TelegramMessage {
  homeTeamName: string;
  awayTeamName: string;
  mainPrediction: string;
  mainConfidence: string;
  goalsPrediction: string;
  goalsConfidence: string;
  cornersPrediction?: string;
  cardsPrediction?: string;
  bothTeamsToScore?: string;
  justification: string;
  matchDate: Date;
}

export async function sendPredictionToTelegram(prediction: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const confidenceEmoji = {
      'HIGH': '🟢',
      'MEDIUM': '🟡',
      'LOW': '🔴',
    };

    const predictionEmoji = {
      'HOME': '🏠',
      'DRAW': '🤝',
      'AWAY': '✈️',
	      'OVER_2_5': '⬆️',
	      'UNDER_2_5': '⬇️',
      'YES': '✅',
      'NO': '❌',
	      'OVER_9': '⬆️',
	      'UNDER_9': '⬇️',
	      'OVER_4_5': '⬆️',
	      'UNDER_4_5': '⬇️',
    };

    const matchDateFormatted = new Date(prediction.matchDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `
🏆 *PALPITE DO MESTRE DA RODADA* 🏆

⚽ *${prediction.homeTeamName} vs ${prediction.awayTeamName}*
📅 ${matchDateFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *VENCEDOR*
${confidenceEmoji[prediction.mainConfidence as keyof typeof confidenceEmoji] || '⭐'} ${prediction.mainPrediction === 'HOME' ? prediction.homeTeamName : prediction.mainPrediction === 'AWAY' ? prediction.awayTeamName : 'Empate'} (${prediction.mainConfidence})

⚽ *GOLS*
${confidenceEmoji[prediction.goalsConfidence as keyof typeof confidenceEmoji] || '⭐'} ${prediction.goalsPrediction} (${prediction.goalsConfidence})

${prediction.cornersPrediction ? `🚩 *ESCANTEIOS*\n${confidenceEmoji[prediction.cornersConfidence as keyof typeof confidenceEmoji] || '⭐'} ${prediction.cornersPrediction} (${prediction.cornersConfidence})\n\n` : ''}${prediction.cardsPrediction ? `🟨 *CARTÕES*\n${confidenceEmoji[prediction.cardsConfidence as keyof typeof confidenceEmoji] || '⭐'} ${prediction.cardsPrediction} (${prediction.cardsConfidence})\n\n` : ''}${prediction.bothTeamsToScore ? `🎯 *AMBAS MARCAM*\n${confidenceEmoji[prediction.bothTeamsToScoreConfidence as keyof typeof confidenceEmoji] || '⭐'} ${prediction.bothTeamsToScore} (${prediction.bothTeamsToScoreConfidence})\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 *ANÁLISE*
${prediction.justification}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Boa sorte com seus palpites! 🍀
    `;

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }
    );

    console.log('✅ Mensagem enviada para Telegram com sucesso');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para Telegram:', error);
    return false;
  }
}
