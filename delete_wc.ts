import { getDb } from './server/db';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function run() {
  const db = getDb();
  try {
    const result = await db.execute(sql`DELETE FROM predictions_simple WHERE competition_code = 'WC'`);
    console.log('✅ Palpites da Copa do Mundo removidos com sucesso!');
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  }
  process.exit(0);
}
run();
