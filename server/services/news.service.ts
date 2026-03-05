import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchLatestFootballNews() {
  try {
    // Buscar notícias do Globo Esporte (Brasileirão)
    const response = await axios.get('https://ge.globo.com/futebol/brasileirao-serie-a/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const news: string[] = [];
    
    $('.feed-post-body-title').each((i, el) => {
      if (i < 5) {
        news.push($(el).text().trim());
      }
    });
    
    return news.join(' | ');
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return 'Não foi possível carregar as notícias recentes.';
  }
}
