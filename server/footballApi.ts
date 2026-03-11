import axios from 'axios';

// ─── Sistema de múltiplas chaves com fallback ─────────────────────────────────

function getApiKeys(): string[] {
  const keys: string[] = [];
  
  // Chave principal
  if (process.env.FOOTBALL_DATA_API_KEY) {
    keys.push(process.env.FOOTBALL_DATA_API_KEY);
  }
  // Chaves de backup
  if (process.env.FOOTBALL_DATA_API_KEY_2) {
    keys.push(process.env.FOOTBALL_DATA_API_KEY_2);
  }
  if (process.env.FOOTBALL_DATA_API_KEY_3) {
    keys.push(process.env.FOOTBALL_DATA_API_KEY_3);
  }
  
  return keys;
}

// Índice rotativo para distribuir carga entre as chaves
let currentKeyIndex = 0;

function getNextKey(): string {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error('Nenhuma FOOTBALL_DATA_API_KEY configurada');
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex++;
  return key;
}

// ─── Cache em memória ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// ─── Tempos de cache por tipo de dados ────────────────────────────────────────

export const CACHE_TTL = {
  STANDINGS: 5 * 60 * 1000,       // 5 minutos - classificação muda pouco
  MATCHES_SCHEDULED: 2 * 60 * 1000, // 2 minutos - próximos jogos
  MATCHES_LIVE: 30 * 1000,         // 30 segundos - jogos ao vivo
  MATCHES_FINISHED: 5 * 60 * 1000, // 5 minutos - resultados
  MATCHES_ALL: 60 * 1000,          // 1 minuto - todos os jogos
  PREDICTIONS: 2 * 60 * 1000,      // 2 minutos - palpites
  AI_RESULTS: 5 * 60 * 1000,       // 5 minutos - resultados da IA
};

// ─── Função principal: busca com cache + fallback ─────────────────────────────

export async function footballApiGet(
  url: string,
  params: Record<string, any> = {},
  cacheKey: string,
  cacheTtl: number
): Promise<any> {
  // 1. Verifica cache
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[FOOTBALL-API] Cache HIT: ${cacheKey}`);
    return cached;
  }

  // 2. Tenta com cada chave (fallback)
  const keys = getApiKeys();
  let lastError: any = null;

  // Começa pela próxima chave no rodízio
  for (let i = 0; i < keys.length; i++) {
    const keyIndex = (currentKeyIndex + i) % keys.length;
    const apiKey = keys[keyIndex];

    try {
      const response = await axios.get(url, {
        params,
        headers: { 'X-Auth-Token': apiKey },
        timeout: 10000,
      });

      const data = response.data;

      // Salva no cache
      setCache(cacheKey, data, cacheTtl);
      
      // Avança o índice para distribuir carga
      currentKeyIndex = keyIndex + 1;
      
      console.log(`[FOOTBALL-API] Cache MISS, buscou da API (chave ${keyIndex + 1}/${keys.length}): ${cacheKey}`);
      return data;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      console.warn(`[FOOTBALL-API] Chave ${keyIndex + 1}/${keys.length} falhou (status: ${status}): ${cacheKey}`);
      
      // Se for rate limit (429) ou erro de autenticação (403), tenta próxima chave
      if (status === 429 || status === 403) {
        continue;
      }
      
      // Para outros erros (500, timeout, etc), também tenta próxima chave
      continue;
    }
  }

  // 3. Todas as chaves falharam - tenta retornar cache expirado como fallback
  const expiredEntry = cache.get(cacheKey);
  if (expiredEntry) {
    console.warn(`[FOOTBALL-API] Todas as chaves falharam, usando cache expirado: ${cacheKey}`);
    return expiredEntry.data;
  }

  // 4. Sem cache, lança erro
  console.error(`[FOOTBALL-API] Todas as ${keys.length} chaves falharam e sem cache: ${cacheKey}`);
  throw lastError || new Error('Todas as chaves da API falharam');
}

// ─── Funções de conveniência ──────────────────────────────────────────────────

const BSA_URL = 'https://api.football-data.org/v4/competitions/BSA';

export async function getStandings() {
  const data = await footballApiGet(
    `${BSA_URL}/standings`,
    {},
    'standings',
    CACHE_TTL.STANDINGS
  );
  return data.standings?.[0]?.table || [];
}

export async function getMatches(status: string) {
  const data = await footballApiGet(
    `${BSA_URL}/matches`,
    { status },
    `matches_${status.toLowerCase()}`,
    status === 'IN_PLAY' ? CACHE_TTL.MATCHES_LIVE : 
    status === 'FINISHED' ? CACHE_TTL.MATCHES_FINISHED : 
    CACHE_TTL.MATCHES_SCHEDULED
  );
  return data.matches || [];
}

export async function getLiveMatches() {
  const data = await footballApiGet(
    `${BSA_URL}/matches`,
    { status: 'IN_PLAY,PAUSED' },
    'matches_live',
    CACHE_TTL.MATCHES_LIVE
  );
  return data.matches || [];
}

export async function getAllMatches() {
  const data = await footballApiGet(
    `${BSA_URL}/matches`,
    {},
    'matches_all',
    CACHE_TTL.MATCHES_ALL
  );
  return data.matches || [];
}

export async function getFinishedMatches(limit = 100) {
  const data = await footballApiGet(
    `${BSA_URL}/matches`,
    { status: 'FINISHED', limit },
    `matches_finished_${limit}`,
    CACHE_TTL.MATCHES_FINISHED
  );
  return data.matches || [];
}
