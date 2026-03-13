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
  cornersConfidence?: string;
  cardsPrediction?: string;
  cardsConfidence?: string;
  bothTeamsToScore?: string;
  bothTeamsToScoreConfidence?: string;
  justification: string;
  matchDate: Date;
}

export async function sendPredictionToTelegram(prediction: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured — skipping Telegram notification');
    return false;
  }

  try {
    const confidenceEmoji: Record<string, string> = {
      'HIGH': '🟢',
      'MEDIUM': '🟡',
      'LOW': '🔴',
    };

    const matchDateFormatted = new Date(prediction.matchDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const escapeMarkdown = (text: string) => {
      return text
        .replace(/_/g, '\\_').replace(/\*/g, '\\*').replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
        .replace(/~/g, '\\~').replace(/`/g, '\\`').replace(/>/g, '\\>')
        .replace(/#/g, '\\#').replace(/\+/g, '\\+').replace(/-/g, '\\-')
        .replace(/=/g, '\\=').replace(/\|/g, '\\|').replace(/{/g, '\\{')
        .replace(/}/g, '\\}').replace(/\./g, '\\.').replace(/!/g, '\\!');
    };

    const vencedor = prediction.mainPrediction === 'HOME'
      ? prediction.homeTeamName
      : prediction.mainPrediction === 'AWAY'
        ? prediction.awayTeamName
        : 'Empate';

    const cornersSection = prediction.cornersPrediction
      ? `🚩 *ESCANTEIOS*\n${confidenceEmoji[prediction.cornersConfidence || ''] || '⭐'} ${escapeMarkdown(prediction.cornersPrediction)} (${prediction.cornersConfidence || 'N/A'})\n\n`
      : '';

    const cardsSection = prediction.cardsPrediction
      ? `🟨 *CARTÕES*\n${confidenceEmoji[prediction.cardsConfidence || ''] || '⭐'} ${escapeMarkdown(prediction.cardsPrediction)} (${prediction.cardsConfidence || 'N/A'})\n\n`
      : '';

    const btsSection = prediction.bothTeamsToScore
      ? `🎯 *AMBAS MARCAM*\n${confidenceEmoji[prediction.bothTeamsToScoreConfidence || ''] || '⭐'} ${escapeMarkdown(prediction.bothTeamsToScore)} (${prediction.bothTeamsToScoreConfidence || 'N/A'})\n\n`
      : '';

    const message = `
🏆 *PALPITE DO MESTRE DA RODADA* 🏆

⚽ *${escapeMarkdown(prediction.homeTeamName)} vs ${escapeMarkdown(prediction.awayTeamName)}*
📅 ${matchDateFormatted}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *VENCEDOR*
${confidenceEmoji[prediction.mainConfidence] || '⭐'} ${escapeMarkdown(vencedor)} (${prediction.mainConfidence})

⚽ *GOLS*
${confidenceEmoji[prediction.goalsConfidence] || '⭐'} ${escapeMarkdown(prediction.goalsPrediction)} (${prediction.goalsConfidence})

${cornersSection}${cardsSection}${btsSection}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Boa sorte com seus palpites! 🍀
    `.trim();

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎲 Apostar Agora — Casa Recomendada',
                url: 'https://1wrlst.com/?open=register&p=c2f3',
              },
            ],
            [
              {
                text: '⚽ Ver Todos os Palpites — mestredarodada.com.br',
                url: 'https://www.mestredarodada.com.br',
              },
            ],
            [
              {
                text: '📱 Baixar App — Google Play Store',
                url: 'https://play.google.com/store/apps/details?id=br.com.mestredarodada.app',
              },
            ],
          ],
        },
      }
    );

    console.log('✅ Mensagem enviada para Telegram com sucesso');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para Telegram:', error);
    return false;
  }
}
