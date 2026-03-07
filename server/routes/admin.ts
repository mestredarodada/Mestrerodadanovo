import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { predictions, predictionsSimple } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { sendPredictionToTelegram } from '../services/telegram.service';

// Middleware para verificar senha do admin
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'mestrefelipe2026';
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
        console.log('--- BUSCANDO TODOS OS PALPITES PARA O ADMIN ---');
        const db = getDb();
        const allPredictions = await db
          .select()
          .from(predictionsSimple)
          .orderBy(predictionsSimple.matchDate);
        
        console.log(`Encontrados ${allPredictions.length} palpites no banco.`);
        return allPredictions;
      } catch (error) {
        console.error('Erro ao carregar palpites no admin:', error);
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
          .from(predictionsSimple)
          .where(eq(predictionsSimple.id, input.predictionId))
          .limit(1);

        if (prediction.length === 0) {
          throw new Error('Palpite não encontrado');
        }

        const pred = prediction[0];

        // Atualizar para publicado
        await db
          .update(predictionsSimple)
          .set({
            isPublished: true,
            publishedAt: new Date(),
          })
          .where(eq(predictionsSimple.id, input.predictionId));

        // Enviar para Telegram (não bloqueia se falhar)
        try {
          await sendPredictionToTelegram({
            homeTeamName: pred.homeTeamName,
            awayTeamName: pred.awayTeamName,
            mainPrediction: pred.mainPrediction,
            mainConfidence: pred.mainConfidence,
            goalsPrediction: pred.goalsPrediction,
            goalsConfidence: pred.goalsConfidence,
            cornersPrediction: pred.cornersPrediction || undefined,
            cornersConfidence: pred.cornersConfidence || undefined,
            cardsPrediction: pred.cardsPrediction || undefined,
            cardsConfidence: pred.cardsConfidence || undefined,
            bothTeamsToScore: pred.bothTeamsToScore || undefined,
            bothTeamsToScoreConfidence: pred.bothTeamsToScoreConfidence || undefined,
            justification: pred.justification,
            matchDate: pred.matchDate,
          });
        } catch (telegramErr) {
          console.warn('Telegram não configurado ou erro ao enviar:', telegramErr);
        }

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
          .update(predictionsSimple)
          .set({
            isPublished: false,
            publishedAt: null,
          })
          .where(eq(predictionsSimple.id, input.predictionId));

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
          .delete(predictionsSimple)
          .where(eq(predictionsSimple.id, input.predictionId));

        return { success: true };
      } catch (error) {
        console.error('Erro ao deletar palpite:', error);
        throw new Error('Falha ao deletar palpite');
      }
    }),

  // Gerar novos palpites
  generateNewPredictions: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input }) => {
      if (!verifyAdminPassword(input.password)) {
        throw new Error('Unauthorized');
      }

      try {
        console.log('--- INICIANDO GERAÇÃO DE PALPITES VIA ADMIN ---');
        // Importar o serviço de palpites
        const { generateAllPredictions } = await import('../services/predictions.service');
        
        // Gerar os palpites
        const result = await generateAllPredictions();
        console.log('--- GERAÇÃO CONCLUÍDA COM SUCESSO ---');
        
        return {
          success: true,
          message: 'Palpites gerados com sucesso!',
          created: result,
        };
      } catch (error) {
        console.error('--- ERRO NA GERAÇÃO DE PALPITES ---');
        console.error('Erro detalhado:', error);
        if (error instanceof Error) {
          console.error('Mensagem:', error.message);
          console.error('Stack:', error.stack);
        }
        throw new Error('Falha ao gerar palpites: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
    }),
});
