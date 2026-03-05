import { getDb } from './db';
import { predictions } from './db/schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkPredictions() {
  console.log('--- Verificando palpites no banco de dados ---');
  try {
    const database = getDb();
    const allPredictions = await database.select().from(predictions);

    if (allPredictions.length === 0) {
      console.log('Nenhum palpite encontrado no banco de dados.');
      return;
    }

    console.log(`Total de palpites encontrados: ${allPredictions.length}`);
    allPredictions.forEach((prediction) => {
      console.log(`ID: ${prediction.id}, Jogo: ${prediction.homeTeamName} vs ${prediction.awayTeamName}, Publicado: ${prediction.isPublished}, Data do Jogo: ${prediction.matchDate}`);
    });

  } catch (error) {
    console.error('Erro ao verificar palpites:', error);
  } finally {
    // Não fechar a conexão do banco de dados aqui, pois getDb pode ser chamado várias vezes
    // e o pool de conexões é gerenciado internamente.
  }
}

checkPredictions();
