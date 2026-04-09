import { Router } from 'express';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// ─── Middleware para verificar senha do admin ──────────────────────────────
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'mestrefelipe2026';
  return password === adminPassword;
}

// ─── Garantir que a tabela existe ─────────────────────────────────────────
async function ensureAnalyticsTable() {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      page VARCHAR(500) NOT NULL,
      label VARCHAR(255),
      session_id VARCHAR(100),
      referrer TEXT,
      device_type VARCHAR(20),
      country VARCHAR(10),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
}

// ─── POST /api/analytics/event — Registrar evento ─────────────────────────
router.post('/event', async (req, res) => {
  // Responde imediatamente para não travar o frontend
  res.json({ ok: true });

  // Processa o registro em background
  (async () => {
    try {
      const { eventType, page, label, sessionId, referrer } = req.body;
      if (!eventType || !page) return;

      const db = getDb();
      
      // Detectar tipo de dispositivo pelo User-Agent
      const ua = req.headers['user-agent'] || '';
      let deviceType = 'desktop';
      if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
        deviceType = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
      }

      await db.execute(sql`
        INSERT INTO analytics_events (event_type, page, label, session_id, referrer, device_type, created_at)
        VALUES (${eventType}, ${page}, ${label || null}, ${sessionId || null}, ${referrer || null}, ${deviceType}, NOW())
      `);
    } catch (error) {
      // Erro silencioso em background para não afetar o servidor
      console.error('[Analytics] Erro ao registrar evento em background:', error instanceof Error ? error.message : error);
    }
  })();
});

// ─── GET /api/analytics/dashboard — Dashboard com métricas ────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const { password, days = '7' } = req.query;
    
    if (!verifyAdminPassword(String(password))) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    await ensureAnalyticsTable();
    const db = getDb();
    const daysNum = parseInt(String(days), 10) || 7;

    // 1. Total de pageviews nos últimos N dias
    const totalPageviews = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
    `);

    // 2. Visitantes únicos (sessões únicas) nos últimos N dias
    const uniqueVisitors = await db.execute(sql`
      SELECT COUNT(DISTINCT session_id) as count
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
        AND session_id IS NOT NULL
    `);

    // 3. Cliques em afiliado nos últimos N dias
    const affiliateClicks = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'click_affiliate'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
    `);

    // 4. Cliques de compartilhamento por tipo
    const shareClicks = await db.execute(sql`
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE event_type IN ('click_whatsapp', 'click_telegram', 'click_facebook')
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
      GROUP BY event_type
    `);

    // 5. Páginas mais visitadas
    const topPages = await db.execute(sql`
      SELECT page, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_views
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
      GROUP BY page
      ORDER BY views DESC
      LIMIT 20
    `);

    // 6. Pageviews por dia (últimos N dias)
    const pageviewsByDay = await db.execute(sql`
      SELECT 
        DATE(created_at AT TIME ZONE 'America/Sao_Paulo') as day,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
      GROUP BY DATE(created_at AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY day ASC
    `);

    // 7. Distribuição por dispositivo
    const deviceStats = await db.execute(sql`
      SELECT device_type, COUNT(DISTINCT session_id) as count
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 day' * ${daysNum}
        AND device_type IS NOT NULL
      GROUP BY device_type
    `);

    // 8. Eventos em tempo real (últimas 2 horas)
    const realtimeEvents = await db.execute(sql`
      SELECT event_type, page, label, device_type, created_at
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '2 hours'
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // 9. Pageviews hoje
    const todayViews = await db.execute(sql`
      SELECT COUNT(*) as count, COUNT(DISTINCT session_id) as unique_count
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo'
    `);

    // 10. Cliques afiliado hoje
    const todayAffiliateClicks = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'click_affiliate'
        AND DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo'
    `);

    const getCount = (result: any) => {
      const rows = result.rows || result;
      return parseInt(rows[0]?.count || '0', 10);
    };

    return res.json({
      period: `${daysNum} dias`,
      summary: {
        totalPageviews: getCount(totalPageviews),
        uniqueVisitors: getCount(uniqueVisitors),
        affiliateClicks: getCount(affiliateClicks),
        todayViews: getCount(todayViews),
        todayUniqueVisitors: parseInt((todayViews.rows || todayViews as any[])[0]?.unique_count || '0', 10),
        todayAffiliateClicks: getCount(todayAffiliateClicks),
      },
      shareClicks: (shareClicks.rows || shareClicks as any[]).reduce((acc: any, row: any) => {
        acc[row.event_type] = parseInt(row.count, 10);
        return acc;
      }, {}),
      topPages: (topPages.rows || topPages as any[]).map((row: any) => ({
        page: row.page,
        views: parseInt(row.views, 10),
        uniqueViews: parseInt(row.unique_views, 10),
      })),
      pageviewsByDay: (pageviewsByDay.rows || pageviewsByDay as any[]).map((row: any) => ({
        day: row.day,
        views: parseInt(row.views, 10),
        uniqueVisitors: parseInt(row.unique_visitors, 10),
      })),
      deviceStats: (deviceStats.rows || deviceStats as any[]).map((row: any) => ({
        deviceType: row.device_type,
        count: parseInt(row.count, 10),
      })),
      realtimeEvents: (realtimeEvents.rows || realtimeEvents as any[]).map((row: any) => ({
        eventType: row.event_type,
        page: row.page,
        label: row.label,
        deviceType: row.device_type,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('[Analytics] Erro ao buscar dashboard:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ─── GET /api/analytics/realtime — Eventos em tempo real (polling) ─────────
router.get('/realtime', async (req, res) => {
  try {
    const { password } = req.query;
    
    if (!verifyAdminPassword(String(password))) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    await ensureAnalyticsTable();
    const db = getDb();

    // Últimos 30 minutos
    const recentEvents = await db.execute(sql`
      SELECT event_type, page, label, device_type, created_at
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
      LIMIT 30
    `);

    // Visitantes ativos (últimos 5 minutos)
    const activeVisitors = await db.execute(sql`
      SELECT COUNT(DISTINCT session_id) as count
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
        AND session_id IS NOT NULL
    `);

    // Pageviews última hora
    const lastHourViews = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'pageview'
        AND created_at >= NOW() - INTERVAL '1 hour'
    `);

    const rows = recentEvents.rows || recentEvents as any[];
    const activeRows = activeVisitors.rows || activeVisitors as any[];
    const hourRows = lastHourViews.rows || lastHourViews as any[];

    return res.json({
      activeVisitors: parseInt(activeRows[0]?.count || '0', 10),
      lastHourViews: parseInt(hourRows[0]?.count || '0', 10),
      recentEvents: rows.map((row: any) => ({
        eventType: row.event_type,
        page: row.page,
        label: row.label,
        deviceType: row.device_type,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('[Analytics] Erro ao buscar realtime:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
