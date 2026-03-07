import { generateAllPredictions } from './services/predictions.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('--- INICIANDO GERAÇÃO AUTOMÁTICA DE PALPITES ---');
  
  if (!process.env.GROQ_API_KEY) {
    console.warn('--- GROQ_API_KEY não configurada. Pulando geração de palpites. ---');
    process.exit(0);
  }

  try {
    const result = await generateAllPredictions();
    console.log(`--- GERAÇÃO CONCLUÍDA: ${result.generated} gerados, ${result.errors} erros ---`);
    process.exit(0);
  } catch (error) {
    console.error('--- ERRO NA GERAÇÃO AUTOMÁTICA (não fatal) ---');
    console.error(error instanceof Error ? error.message : error);
    // Sai com código 0 para não bloquear o start do servidor
    process.exit(0);
  }
}

run();
