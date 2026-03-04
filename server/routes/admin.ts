import { publicProcedure, router } from '../trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { predictions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { sendPredictionToTelegram } from '../services/telegram.service';

// Middleware para verificar senha do admin
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'mestre2026';
  return password === adminPassword;
}

export const adminRouter = router({
  // Verificar autenticação
  authenticate: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(({ input }) => {
      const isValid = verifyAdminPassword(input.password);
      return { isValid };
    }),

  // Listar todos os palpites (publicados e não publicados)
  getAllPredictions: publicProcedure
    .input(z.object({ password: z.string() }))
    .query(async ({ input }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new Error('Unauthorized');
      }

      try {
        const db = getDb();
        const allPredictions = await db
          .select()
          .from(predictions)
          .orderBy(predictions.matchDate);

        return allPredictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),

  // Publicar um palpite
  publishPrediction: publicProcedure
    .input(z.object({
      password: z.string(),
      predictionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new Error('Unauthorized');
      }

      try {
        const db = getDb();
        
        // Buscar o palpite
        const prediction = await db
          .select()
          .from(predictions)
          .where(eq(predictions.id, input.predictionId))
          .limit(1);

        if (prediction.length === 0) {
          throw new Error('Palpite não encontrado');
        }

        const pred = prediction[0];

        // Atualizar para publicado
        await db
          .update(predictions)
          .set({
            isPublished: true,
            publishedAt: new Date(),
          })
          .where(eq(predictions.id, input.predictionId));

        // Enviar para Telegram
        await sendPredictionToTelegram({
          homeTeamName: pred.homeTeamName,
          awayTeamName: pred.awayTeamName,
          mainPrediction: pred.mainPrediction,
          mainConfidence: pred.mainConfidence,
          goalsPrediction: pred.goalsPrediction,
          goalsConfidence: pred.goalsConfidence,
          cornersPrediction: pred.cornersPrediction || undefined,
          cardsPrediction: pred.cardsPrediction || undefined,
          bothTeamsToScore: pred.bothTeamsToScore || undefined,
          justification: pred.justification,
          matchDate: pred.matchDate,
        });

        return { success: true };
      } catch (error) {
        console.error('Erro ao publicar palpite:', error);
        throw new Error('Falha ao publicar palpite');
      }
    }),

  // Despublicar um palpite
  unpublishPrediction: publicProcedure
    .input(z.object({
      password: z.string(),
      predictionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new Error('Unauthorized');
      }

      try {
        const db = getDb();
        
        await db
          .update(predictions)
          .set({
            isPublished: false,
            publishedAt: null,
          })
          .where(eq(predictions.id, input.predictionId));

        return { success: true };
      } catch (error) {
        console.error('Erro ao despublicar palpite:', error);
        throw new Error('Falha ao despublicar palpite');
      }
    }),

  // Deletar um palpite
  deletePrediction: publicProcedure
    .input(z.object({
      password: z.string(),
      predictionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new Error('Unauthorized');
      }

      try {
        const db = getDb();
        
        await db
          .delete(predictions)
          .where(eq(predictions.id, input.predictionId));

        return { success: true };
      } catch (error) {
        console.error('Erro ao deletar palpite:', error);
        throw new Error('Falha ao deletar palpite');
      }
    }),
});
