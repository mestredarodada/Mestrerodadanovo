import axios from 'axios';

// ─── Lista de competições suportadas (Free Tier Football-Data.org) ───────────

export const SUPPORTED_COMPETITIONS = [
  { code: 'CL', name: 'UEFA Champions League', country: 'Europa' },
  { code: 'PL', name: 'Premier League', country: 'Inglaterra' },
  { code: 'ELC', name: 'Championship', country: 'Inglaterra' },
  { code: 'PD', name: 'La Liga', country: 'Espanha' },
  { code: 'SA', name: 'Serie A', country: 'Itália' },
  { code: 'BL1', name: 'Bundesliga', country: 'Alemanha' },
  { code: 'FL1', name: 'Ligue 1', country: 'França' },
  { code: 'DED', name: 'Eredivisie', country: 'Holanda' },
  { code: 'PPL', name: 'Primeira Liga', country: 'Portugal' },
  { code: 'BSA', name: 'Campeonato Brasileiro Série A', country: 'Brasil' },
  { code: 'WC', name: 'FIFA World Cup', country: 'Mundo' },
  { code: 'EC', name: 'European Championship', country: 'Europa' },
] as const;

export type CompetitionCode = typeof SUPPORTED_COMPETITIONS[number]['code'];

const COMPETITION_CODES = SUPPORTED_COMPETITIONS.map(c => c.code);

export function getCompetitionName(code: string): string {
  const comp = SUPPORTED_COMPETITIONS.find(c => c.code === code);
  return comp ? comp.name : code;
}

// ─── Sistema de múltiplas chaves com fallback ─────────────────────────────────

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.FOOTBALL_DATA_API_KEY) keys.push(process.env.FOOTBALL_DATA_API_KEY);
  if (process.env.FOOTBALL_DATA_API_KEY_2) keys.push(process.env.FOOTBALL_DATA_API_KEY_2);
  if (process.env.FOOTBALL_DATA_API_KEY_3) keys.push(process.env.FOOTBALL_DATA_API_KEY_3);
  return keys;
}

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
  MATCHES_SCHEDULED: 5 * 60 * 1000,   // 5 minutos - próximos jogos
  MATCHES_LIVE: 30 * 1000,            // 30 segundos - jogos ao vivo
  MATCHES_FINISHED: 2 * 60 * 1000,    // 2 minutos - resultados (reduzido para pegar jogos recém-finalizados)
  MATCHES_ALL: 2 * 60 * 1000,         // 2 minutos - todos os jogos
  MATCHES_BATCH: 10 * 60 * 1000,      // 10 minutos - batch de jogos do dia
  PREDICTIONS: 2 * 60 * 1000,         // 2 minutos - palpites
  AI_RESULTS: 2 * 60 * 1000,          // 2 minutos - resultados da IA
  STATIC_DATA: 24 * 60 * 60 * 1000,   // 24 horas - dados estáticos (nomes, calendários)
  H2H: 12 * 60 * 60 * 1000,           // 12 horas - confrontos diretos
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

  for (let i = 0; i < keys.length; i++) {
    const keyIndex = (currentKeyIndex + i) % keys.length;
    const apiKey = keys[keyIndex];

    try {
      const response = await axios.get(url, {
        params,
        headers: { 'X-Auth-Token': apiKey },
        timeout: 15000,
      });

      const data = response.data;
      setCache(cacheKey, data, cacheTtl);
      currentKeyIndex = keyIndex + 1;
      
      console.log(`[FOOTBALL-API] Cache MISS, buscou da API (chave ${keyIndex + 1}/${keys.length}): ${cacheKey}`);
      return data;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      console.warn(`[FOOTBALL-API] Chave ${keyIndex + 1}/${keys.length} falhou (status: ${status}): ${cacheKey}`);
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

// ─── Funções dinâmicas para múltiplas ligas ──────────────────────────────────

const BASE_URL = 'https://api.football-data.org/v4';

/**
 * Busca jogos de uma competição específica por status
 */
export async function getMatchesByCompetition(competitionCode: string, status: string) {
  const data = await footballApiGet(
    `${BASE_URL}/competitions/${competitionCode}/matches`,
    { status },
    `matches_${competitionCode}_${status.toLowerCase()}`,
    status === 'IN_PLAY' ? CACHE_TTL.MATCHES_LIVE :
    status === 'FINISHED' ? CACHE_TTL.MATCHES_FINISHED :
    CACHE_TTL.MATCHES_SCHEDULED
  );
  return (data.matches || []).map((m: any) => ({
    ...m,
    competitionCode,
    competitionName: getCompetitionName(competitionCode),
  }));
}

/**
 * Busca TODOS os jogos do dia de TODAS as ligas suportadas (Batch por data)
 * Usa o endpoint /matches com dateFrom e dateTo para economizar requisições
 */
export async function getAllMatchesByDate(dateFrom: string, dateTo: string) {
  const competitionCodes = COMPETITION_CODES.join(',');
  const data = await footballApiGet(
    `${BASE_URL}/matches`,
    { 
      competitions: competitionCodes,
      dateFrom,
      dateTo,
    },
    `matches_batch_${dateFrom}_${dateTo}`,
    CACHE_TTL.MATCHES_BATCH
  );
  
  const matches = (data.matches || []).map((m: any) => {
    const compCode = SUPPORTED_COMPETITIONS.find(
      c => c.name === m.competition?.name || c.code === m.competition?.code
    )?.code || m.competition?.code || 'UNKNOWN';
    
    return {
      ...m,
      competitionCode: compCode,
      competitionName: m.competition?.name || getCompetitionName(compCode),
    };
  });
  
  return matches;
}

/**
 * Busca jogos agendados de TODAS as ligas (próximos jogos)
 */
export async function getAllScheduledMatches() {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 7); // Próximos 7 dias
  
  const dateFrom = today.toISOString().split('T')[0];
  const dateTo = futureDate.toISOString().split('T')[0];
  
  return getAllMatchesByDate(dateFrom, dateTo);
}

/**
 * Busca jogos finalizados de TODAS as ligas (últimos dias)
 */
export async function getAllFinishedMatches(daysBack = 3) {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - daysBack);
  
  const dateFrom = pastDate.toISOString().split('T')[0];
  const dateTo = today.toISOString().split('T')[0];
  
  const competitionCodes = COMPETITION_CODES.join(',');
  const data = await footballApiGet(
    `${BASE_URL}/matches`,
    {
      competitions: competitionCodes,
      dateFrom,
      dateTo,
      status: 'FINISHED',
    },
    `matches_finished_all_${dateFrom}_${dateTo}`,
    CACHE_TTL.MATCHES_FINISHED
  );
  
  return (data.matches || []).map((m: any) => {
    const compCode = SUPPORTED_COMPETITIONS.find(
      c => c.name === m.competition?.name || c.code === m.competition?.code
    )?.code || m.competition?.code || 'UNKNOWN';
    
    return {
      ...m,
      competitionCode: compCode,
      competitionName: m.competition?.name || getCompetitionName(compCode),
    };
  });
}

/**
 * Busca jogos ao vivo de TODAS as ligas
 */
export async function getAllLiveMatches() {
  const competitionCodes = COMPETITION_CODES.join(',');
  const data = await footballApiGet(
    `${BASE_URL}/matches`,
    {
      competitions: competitionCodes,
      status: 'IN_PLAY,PAUSED',
    },
    'matches_live_all',
    CACHE_TTL.MATCHES_LIVE
  );
  
  return (data.matches || []).map((m: any) => {
    const compCode = SUPPORTED_COMPETITIONS.find(
      c => c.name === m.competition?.name || c.code === m.competition?.code
    )?.code || m.competition?.code || 'UNKNOWN';
    
    return {
      ...m,
      competitionCode: compCode,
      competitionName: m.competition?.name || getCompetitionName(compCode),
    };
  });
}

/**
 * Busca confrontos diretos (H2H) entre dois times
 */
export async function getHeadToHead(matchId: number) {
  const data = await footballApiGet(
    `${BASE_URL}/matches/${matchId}`,
    {},
    `h2h_${matchId}`,
    CACHE_TTL.H2H
  );
  return data;
}

/**
 * Busca jogos finalizados de uma competição específica (para dados históricos)
 */
export async function getFinishedMatchesByCompetition(competitionCode: string, limit = 100) {
  const data = await footballApiGet(
    `${BASE_URL}/competitions/${competitionCode}/matches`,
    { status: 'FINISHED', limit },
    `matches_finished_${competitionCode}_${limit}`,
    CACHE_TTL.MATCHES_FINISHED
  );
  return (data.matches || []).map((m: any) => ({
    ...m,
    competitionCode,
    competitionName: getCompetitionName(competitionCode),
  }));
}

// ─── Funções de compatibilidade (mantém BSA como fallback) ───────────────────

export async function getMatches(status: string) {
  return getMatchesByCompetition('BSA', status);
}

export async function getLiveMatches() {
  return getAllLiveMatches();
}

export async function getAllMatches() {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 2);
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 7);
  
  const dateFrom = pastDate.toISOString().split('T')[0];
  const dateTo = futureDate.toISOString().split('T')[0];
  
  return getAllMatchesByDate(dateFrom, dateTo);
}

export async function getFinishedMatches(limit = 100) {
  return getAllFinishedMatches(3);
}
