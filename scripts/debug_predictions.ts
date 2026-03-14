
import { getDb } from '../server/db';
import { predictionsSimple } from '../server/db/schema';
import { sql, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function debug() {
  console.log('--- DEBUG: ESTADO ATUAL DOS PALPITES ---');
  try {
    const db = getDb();
    
    // 1. Listar os últimos 10 palpites criados
    const recent = await db
      .select()
      .from(predictionsSimple)
      .orderBy(desc(predictionsSimple.createdAt))
      .limit(10);

    console.log(`\nÚltimos ${recent.length} palpites no banco (por data de criação):`);
    recent.forEach(p => {
      console.log(`- [ID: ${p.id}] ${p.homeTeamName} vs ${p.awayTeamName} | Criado em: ${p.createdAt} | Jogo em: ${p.matchDate} | Publicado: ${p.isPublished}`);
    });

    // 2. Verificar se há erros nos logs (simulado via consulta de status se houvesse tabela de logs, mas vamos focar no banco)
    
    // 3. Contar total de palpites
    const total = await db.execute(sql`SELECT COUNT(*) as count FROM predictions_simple`);
    console.log(`\nTotal de palpites no banco: ${(total.rows || total as any[])[0].count}`);

    // 4. Verificar palpites para as próximas 24h
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcoming = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM predictions_simple 
      WHERE match_date BETWEEN ${now.toISOString()} AND ${tomorrow.toISOString()}
    `);
    console.log(`Palpites já existentes para as próximas 24h: ${(upcoming.rows || upcoming as any[])[0].count}`);

  } catch (error) {
    console.error('Erro no debug:', error);
  }
  process.exit(0);
}

debug();
