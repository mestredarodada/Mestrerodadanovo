import { getDb } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Executa migrações automáticas no banco de dados.
 * Cria tabelas que não existem sem apagar dados existentes.
 */
export async function runMigrations() {
  console.log('[Migrate] Iniciando migrações automáticas...');

  try {
    const db = getDb();

    // Cria a tabela predictions_simple se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS predictions_simple (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(100) NOT NULL UNIQUE,
        home_team_name VARCHAR(255) NOT NULL,
        away_team_name VARCHAR(255) NOT NULL,
        home_team_crest TEXT,
        away_team_crest TEXT,
        match_date TIMESTAMP NOT NULL,
        main_prediction VARCHAR(50) NOT NULL,
        main_confidence VARCHAR(20) NOT NULL,
        goals_prediction VARCHAR(50) NOT NULL,
        goals_confidence VARCHAR(20) NOT NULL,
        both_teams_to_score VARCHAR(50),
        both_teams_to_score_confidence VARCHAR(20),
        corners_prediction VARCHAR(50),
        corners_confidence VARCHAR(20),
        cards_prediction VARCHAR(50),
        cards_confidence VARCHAR(20),
        extra_tip TEXT,
        extra_confidence VARCHAR(20),
        justification TEXT NOT NULL DEFAULT '',
        is_published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('[Migrate] Tabela predictions_simple: OK');

    // Adiciona colunas novas se não existirem (para upgrades futuros)
    const newColumns = [
      { name: 'home_form', type: 'TEXT' },
      { name: 'away_form', type: 'TEXT' },
      { name: 'home_avg_goals_scored', type: 'NUMERIC(5,2)' },
      { name: 'home_avg_goals_conceded', type: 'NUMERIC(5,2)' },
      { name: 'away_avg_goals_scored', type: 'NUMERIC(5,2)' },
      { name: 'away_avg_goals_conceded', type: 'NUMERIC(5,2)' },
      { name: 'home_position', type: 'INTEGER' },
      { name: 'away_position', type: 'INTEGER' },
      { name: 'main_probability', type: 'INTEGER' },
      { name: 'goals_probability', type: 'INTEGER' },
      { name: 'bts_probability', type: 'INTEGER' },
    ];

    for (const col of newColumns) {
      try {
        await db.execute(sql.raw(
          `ALTER TABLE predictions_simple ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        ));
      } catch {
        // Ignora se a coluna já existir
      }
    }

    console.log('[Migrate] Colunas extras: OK');
    console.log('[Migrate] Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('[Migrate] Erro nas migrações:', error instanceof Error ? error.message : error);
    // Não lança o erro — o servidor deve iniciar mesmo se a migração falhar
  }
}
