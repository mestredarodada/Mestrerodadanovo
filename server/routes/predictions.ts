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

    res.json(allPredictions);
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    res.status(500).json([]);
  }
});

// ─── GET /api/predictions/by-slug/:slug — Palpite por slug (legado, páginas antigas) ───
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const allPredictions = await db
      .select()
      .from(predictionsSimple)
      .where(eq(predictionsSimple.isPublished, true));

    const match = allPredictions.find(
      (p: any) => generateSlug(p.homeTeamName, p.awayTeamName, p.matchDate) === slug
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

// ─── DELETE /api/predictions/cleanup — Limpar palpites com mais de 2 dias ────
router.delete('/cleanup', async (req, res) => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const deleted = await db
      .delete(predictionsSimple)
      .where(lt(predictionsSimple.createdAt, twoDaysAgo));

    console.log(`[CLEANUP v2.0] Palpites com mais de 2 dias removidos.`);
    res.json({ success: true, message: 'Palpites antigos removidos com sucesso (> 2 dias)' });
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
    res.json(p);
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
