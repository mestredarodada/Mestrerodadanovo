import 'dotenv/config';
import { getDb } from './server/db';
import { predictions } from './server/db/schema';
import { eq } from 'drizzle-orm';

async function checkDatabase() {
  try {
    const db = getDb();
    
    console.log('\n=== VERIFICANDO BANCO DE DADOS ===\n');
    
    // Buscar todos os palpites
    const allPredictions = await db.select().from(predictions);
    console.log(`Total de palpites no banco: ${allPredictions.length}`);
    
    // Buscar apenas os publicados
    const publishedPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.isPublished, true));
    
    console.log(`Palpites publicados: ${publishedPredictions.length}`);
    
    // Listar todos os palpites com seus status
    console.log('\n--- LISTA DE PALPITES ---');
    allPredictions.forEach((pred, index) => {
      console.log(`${index + 1}. ${pred.homeTeamName} vs ${pred.awayTeamName}`);
      console.log(`   ID: ${pred.id}`);
      console.log(`   Publicado: ${pred.isPublished}`);
      console.log(`   Data: ${pred.matchDate}`);
    });
    
    // Verificar o tipo do campo isPublished
    if (allPredictions.length > 0) {
      const firstPred = allPredictions[0];
      console.log(`\n--- TIPO DE DADOS ---`);
      console.log(`isPublished type: ${typeof firstPred.isPublished}`);
      console.log(`isPublished value: ${firstPred.isPublished}`);
    }
    
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
  }
  
  process.exit(0);
}

checkDatabase();
