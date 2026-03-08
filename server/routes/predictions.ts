import { Router } from 'express';
import { db } from '../db';
import { predictionsSimple } from '../db/schema';
import { desc, eq, lt, and } from 'drizzle-orm';
import { generateAllPredictions } from '../services/predictions.service';

const router = Router();

// ─── Utilitário: gerar slug a partir dos nomes dos times e data ───────────────
function generateSlug(homeTeam: string, awayTeam: string, matchDate: Date | string): string {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const date = new Date(matchDate);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${normalize(homeTeam)}-x-${normalize(awayTeam)}-${dateStr}`;
}

// ─── GET /api/predictions — Todos os palpites publicados ─────────────────────
router.get('/', async (req, res) => {
  try {
    const allPredictions = await db
      .select()
      .from(predictionsSimple)
      .where(eq(predictionsSimple.isPublished, true))
      .orderBy(desc(predictionsSimple.matchDate));

    // Adiciona o slug em cada palpite
    const withSlug = allPredictions.map((p) => ({
      ...p,
      slug: generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate),
    }));

    res.json(withSlug);
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    res.status(500).json([]);
  }
});

// ─── GET /api/predictions/by-slug/:slug — Palpite por slug amigável ──────────
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Busca todos os palpites publicados e filtra pelo slug gerado
    const allPredictions = await db
      .select()
      .from(predictionsSimple)
      .where(eq(predictionsSimple.isPublished, true));

    const match = allPredictions.find(
      (p) => generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate) === slug
    );

    if (!match) {
      return res.status(404).json({ error: 'Palpite não encontrado' });
    }

    res.json({ ...match, slug });
  } catch (error) {
    console.error('Erro ao buscar palpite por slug:', error);
    res.status(500).json({ error: 'Erro ao buscar palpite' });
  }
});

// ─── GET /api/predictions/sitemap — Lista de slugs para sitemap dinâmico ─────
router.get('/sitemap', async (req, res) => {
  try {
    const allPredictions = await db
      .select({
        homeTeamName: predictionsSimple.homeTeamName,
        awayTeamName: predictionsSimple.awayTeamName,
        matchDate: predictionsSimple.matchDate,
        createdAt: predictionsSimple.createdAt,
      })
      .from(predictionsSimple)
      .where(eq(predictionsSimple.isPublished, true))
      .orderBy(desc(predictionsSimple.matchDate));

    const slugs = allPredictions.map((p) => ({
      slug: generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate),
      lastmod: new Date(p.createdAt).toISOString().split('T')[0],
    }));

    res.json(slugs);
  } catch (error) {
    console.error('Erro ao gerar sitemap de palpites:', error);
    res.status(500).json([]);
  }
});

// ─── GET /sitemap.xml — Sitemap XML dinâmico completo ────────────────────────
router.get('/sitemap-predictions.xml', async (req, res) => {
  try {
    const allPredictions = await db
      .select({
        homeTeamName: predictionsSimple.homeTeamName,
        awayTeamName: predictionsSimple.awayTeamName,
        matchDate: predictionsSimple.matchDate,
        createdAt: predictionsSimple.createdAt,
      })
      .from(predictionsSimple)
      .where(eq(predictionsSimple.isPublished, true))
      .orderBy(desc(predictionsSimple.matchDate));

    const baseUrl = 'https://www.mestredarodada.com.br';

    const urls = allPredictions
      .map((p) => {
        const slug = generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate);
        const lastmod = new Date(p.createdAt).toISOString().split('T')[0];
        return `  <url>\n    <loc>${baseUrl}/palpite/${slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Erro ao gerar sitemap XML:', error);
    res.status(500).send('Erro ao gerar sitemap');
  }
});

// ─── DELETE /api/predictions/cleanup — Limpar palpites com mais de 7 dias ────
router.delete('/cleanup', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deleted = await db
      .delete(predictionsSimple)
      .where(lt(predictionsSimple.createdAt, sevenDaysAgo));

    console.log(`[CLEANUP] Palpites com mais de 7 dias removidos.`);
    res.json({ success: true, message: 'Palpites antigos removidos com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar palpites:', error);
    res.status(500).json({ error: 'Erro ao limpar palpites' });
  }
});

// ─── GET /api/predictions/:matchId — Palpite por matchId ─────────────────────
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const prediction = await db
      .select()
      .from(predictionsSimple)
      .where(eq(predictionsSimple.matchId, matchId))
      .limit(1);

    if (prediction.length === 0) {
      return res.status(404).json({ error: 'Palpite não encontrado' });
    }

    const p = prediction[0];
    res.json({ ...p, slug: generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate) });
  } catch (error) {
    console.error('Erro ao buscar palpite:', error);
    res.status(500).json({ error: 'Erro ao buscar palpite' });
  }
});

// ─── POST /api/predictions/generate/all — Gerar palpites ─────────────────────
router.post('/generate/all', async (req, res) => {
  try {
    console.log('--- INICIANDO GERAÇÃO DE PALPITES VIA API REST ---');
    await generateAllPredictions();
    res.json({ success: true, message: 'Palpites gerados com sucesso' });
  } catch (error) {
    console.error('Erro ao gerar palpites:', error);
    res.status(500).json({ error: 'Erro ao gerar palpites' });
  }
});

export default router;
