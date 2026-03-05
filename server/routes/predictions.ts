import { Router } from 'express';
import { db } from '../db';
import { predictions } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { generateAllPredictions } from '../services/predictions.service';

const router = Router();

// GET /api/predictions - Buscar todos os palpites
router.get('/', async (req, res) => {
  try {
    const allPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.isPublished, true))
      .orderBy(desc(predictions.matchDate));

    res.json(allPredictions);
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    res.status(500).json({ error: 'Erro ao buscar palpites' });
  }
});

// GET /api/predictions/:matchId - Buscar palpite de um jogo específico
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const prediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.matchId, matchId))
      .limit(1);

    if (prediction.length === 0) {
      return res.status(404).json({ error: 'Palpite não encontrado' });
    }

    res.json(prediction[0]);
  } catch (error) {
    console.error('Erro ao buscar palpite:', error);
    res.status(500).json({ error: 'Erro ao buscar palpite' });
  }
});

// GET /api/predictions/generate/all - Gerar palpites para todos os jogos agendados
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
