import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import axios from "axios";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  football: router({
    standings: publicProcedure.query(async () => {
      try {
        const response = await axios.get(
          'https://api.football-data.org/v4/competitions/BSA/standings',
          {
            headers: {
              'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
            },
          }
        );
        return response.data.standings[0]?.table || [];
      } catch (error) {
        console.error('Erro ao carregar classificação:', error);
        throw new Error('Falha ao carregar classificação');
      }
    }),

    matches: publicProcedure
      .input(z.object({ status: z.enum(['SCHEDULED', 'FINISHED', 'IN_PLAY']).default('SCHEDULED') }))
      .query(async ({ input }) => {
        try {
          const response = await axios.get(
            'https://api.football-data.org/v4/competitions/BSA/matches',
            {
              params: { status: input.status },
              headers: {
                'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
              },
            }
          );
          return response.data.matches || [];
        } catch (error) {
          console.error(`Erro ao carregar jogos (${input.status}):`, error);
          throw new Error(`Falha ao carregar jogos`);
        }
      }),

    predictions: publicProcedure.query(async () => {
      try {
        const { getDb } = await import('./db');
        const { predictionsSimple } = await import('./db/schema');
        const { desc, eq } = await import('drizzle-orm');

        const database = getDb();

        const publishedPredictions = await database
          .select()
          .from(predictionsSimple)
          .where(eq(predictionsSimple.isPublished, true))
          .orderBy(desc(predictionsSimple.matchDate));

        console.log(`[PREDICTIONS] Retornando ${publishedPredictions.length} palpites`);

        return publishedPredictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
