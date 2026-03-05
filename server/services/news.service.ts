import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchLatestFootballNews() {
  try {
    const response = await axios.get('https://ge.globo.com/futebol/brasileirao-serie-a/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    const news: string[] = [];
    
    $('.feed-post-body-title').each((i, el) => {
      if (i < 5) {
        const text = $(el).text().trim();
        if (text) news.push(text);
      }
    });
    
    return news.length > 0 ? news.join(' | ') : '';
  } catch (error) {
    console.warn('Aviso: Nao foi possivel carregar noticias recentes.');
    return '';
  }
}
