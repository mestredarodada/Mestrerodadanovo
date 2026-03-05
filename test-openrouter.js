import axios from 'axios';

async function testOpenRouter() {
  const apiKey = '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';
  
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [{ role: 'user', content: 'Diga "Olá, Mestre!" em português.' }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://mestredarodada.onrender.com',
          'X-Title': 'Mestre da Rodada',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Resposta do OpenRouter:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('Erro ao testar OpenRouter:', error.response ? error.response.data : error.message);
  }
}

testOpenRouter();
