import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import axios from "axios";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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
              params: {
                status: input.status,
              },
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
        const { predictions: predictionsTable } = await import('./db/schema');
        const { desc } = await import('drizzle-orm');
        
        const database = getDb();
        const allPredictions = await database
          .select()
          .from(predictionsTable)
          .orderBy(desc(predictionsTable.matchDate));
        
        return allPredictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
