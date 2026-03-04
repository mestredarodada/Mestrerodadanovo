import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, database operations will fail');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    db = null;
    pool = null;
  }
}

// Para compatibilidade com código existente
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    return getDb()[prop as keyof ReturnType<typeof getDb>];
  },
});

export type Database = ReturnType<typeof getDb>;
