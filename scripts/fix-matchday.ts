/**
 * Script para atualizar o campo matchday nos palpites existentes no banco.
 * Busca os jogos do Brasileirão na API e cruza com os match_ids salvos.
 * 
 * Executar: npx tsx scripts/fix-matchday.ts
 */

import axios from 'axios';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!FOOTBALL_API_KEY || !DATABASE_URL) {
  console.error('❌ FOOTBALL_DATA_API_KEY e DATABASE_URL são necessários');
  process.exit(1);
}

async function main() {
  console.log('🔍 Buscando jogos do Brasileirão na API...');

  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Busca todos os jogos do Brasileirão (scheduled + finished + in_play)
    const [scheduledRes, finishedRes] = await Promise.all([
      axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
        params: { status: 'SCHEDULED' },
        headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
      }),
      axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
        params: { status: 'FINISHED' },
        headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
      }),
    ]);

    const allMatches = [
      ...(scheduledRes.data.matches || []),
      ...(finishedRes.data.matches || []),
    ];

    console.log(`✅ ${allMatches.length} jogos encontrados na API`);

    // Busca todos os palpites do banco
    const result = await db.execute(sql`SELECT id, match_id, matchday FROM predictions_simple`);
    const predictions = result.rows as any[];
    console.log(`📋 ${predictions.length} palpites no banco`);

    let updated = 0;
    let notFound = 0;

    for (const pred of predictions) {
      const match = allMatches.find((m: any) => String(m.id) === String(pred.match_id));
      if (match && match.matchday) {
        await db.execute(sql.raw(
          `UPDATE predictions_simple SET matchday = ${match.matchday} WHERE match_id = '${pred.match_id}'`
        ));
        console.log(`  ✅ match_id ${pred.match_id} → Rodada ${match.matchday}`);
        updated++;
      } else {
        console.log(`  ⚠️  match_id ${pred.match_id} não encontrado na API`);
        notFound++;
      }
    }

    console.log(`\n🎉 Concluído! ${updated} atualizados, ${notFound} não encontrados.`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
