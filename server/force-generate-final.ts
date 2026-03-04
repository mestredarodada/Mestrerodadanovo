import { generateAllPredictions } from './services/predictions.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('--- INICIANDO GERAÇÃO FORÇADA DE PALPITES ---');
  try {
    await generateAllPredictions();
    console.log('--- GERAÇÃO CONCLUÍDA COM SUCESSO! ---');
    process.exit(0);
  } catch (error) {
    console.error('--- ERRO NA GERAÇÃO FORÇADA ---');
    console.error(error);
    process.exit(1);
  }
}

run();
