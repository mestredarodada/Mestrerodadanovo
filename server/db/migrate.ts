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
      // Novos campos v3
      { name: 'home_probability', type: 'INTEGER' },
      { name: 'draw_probability', type: 'INTEGER' },
      { name: 'away_probability', type: 'INTEGER' },
      { name: 'double_chance', type: 'VARCHAR(10)' },
      { name: 'double_chance_confidence', type: 'VARCHAR(20)' },
      { name: 'double_chance_probability', type: 'INTEGER' },
      { name: 'half_time_prediction', type: 'VARCHAR(20)' },
      { name: 'half_time_confidence', type: 'VARCHAR(20)' },
      { name: 'likely_score', type: 'VARCHAR(20)' },
      { name: 'best_bet', type: 'TEXT' },
      { name: 'best_bet_confidence', type: 'VARCHAR(20)' },
      { name: 'matchday', type: 'INTEGER' },
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

    // Atualiza matchday dos palpites que estão com NULL
    try {
      const nullCheck = await db.execute(sql`SELECT COUNT(*) as cnt FROM predictions_simple WHERE matchday IS NULL`);
      const nullCount = Number((nullCheck.rows[0] as any)?.cnt || 0);

      if (nullCount > 0) {
        console.log(`[Migrate] ${nullCount} palpites sem rodada — buscando na API...`);
        const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
        if (FOOTBALL_API_KEY) {
          const axios = await import('axios');
          const [scheduledRes, finishedRes] = await Promise.allSettled([
            axios.default.get('https://api.football-data.org/v4/competitions/BSA/matches', {
              params: { status: 'SCHEDULED' },
              headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
            }),
            axios.default.get('https://api.football-data.org/v4/competitions/BSA/matches', {
              params: { status: 'FINISHED' },
              headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
            }),
          ]);

          const allMatches: any[] = [
            ...(scheduledRes.status === 'fulfilled' ? scheduledRes.value.data.matches || [] : []),
            ...(finishedRes.status === 'fulfilled' ? finishedRes.value.data.matches || [] : []),
          ];

          const predsResult = await db.execute(sql`SELECT match_id FROM predictions_simple WHERE matchday IS NULL`);
          const preds = predsResult.rows as any[];

          let updatedCount = 0;
          for (const pred of preds) {
            const match = allMatches.find((m: any) => String(m.id) === String(pred.match_id));
            if (match?.matchday) {
              await db.execute(sql.raw(`UPDATE predictions_simple SET matchday = ${match.matchday} WHERE match_id = '${pred.match_id}'`));
              updatedCount++;
            }
          }
          console.log(`[Migrate] Rodadas atualizadas: ${updatedCount}/${preds.length}`);
        }
      } else {
        console.log('[Migrate] Todos os palpites já têm rodada definida.');
      }
    } catch (matchdayErr) {
      console.warn('[Migrate] Aviso ao atualizar matchday:', matchdayErr instanceof Error ? matchdayErr.message : matchdayErr);
    }

    // Cria a tabela blog_posts se não existir
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        reading_time INTEGER NOT NULL DEFAULT 5,
        category VARCHAR(100) NOT NULL DEFAULT 'geral',
        is_published BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('[Migrate] Tabela blog_posts: OK');

    console.log('[Migrate] Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('[Migrate] Erro nas migrações:', error instanceof Error ? error.message : error);
    // Não lança o erro — o servidor deve iniciar mesmo se a migração falhar
  }
}
