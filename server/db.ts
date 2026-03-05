import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./db/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn("[Database] DATABASE_URL not set, database operations will fail");
      throw new Error("DATABASE_URL environment variable is not set");
    }

    try {
      _pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      _db = drizzle(_pool, { schema });
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      throw error;
    }
  }
  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _db = null;
    _pool = null;
  }
}

// Para compatibilidade com código que usa import { db } from './db'
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    return getDb()[prop as any];
  },
});
