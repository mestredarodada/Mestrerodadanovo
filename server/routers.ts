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
        const { sql } = await import('drizzle-orm');

        const database = getDb();

        // Busca todos os campos incluindo os novos (home_probability, likely_score, etc.)
        const result = await database.execute(sql`
          SELECT *
          FROM predictions_simple
          WHERE is_published = true
          ORDER BY match_date DESC
        `);

        // Normaliza os campos snake_case para camelCase
        const predictions = (result.rows || result as any[]).map((row: any) => ({
          id: row.id,
          matchId: row.match_id,
          homeTeamName: row.home_team_name,
          awayTeamName: row.away_team_name,
          homeTeamCrest: row.home_team_crest,
          awayTeamCrest: row.away_team_crest,
          matchDate: row.match_date,
          mainPrediction: row.main_prediction,
          mainConfidence: row.main_confidence,
          mainProbability: row.main_probability ? Number(row.main_probability) : null,
          homeProbability: row.home_probability ? Number(row.home_probability) : null,
          drawProbability: row.draw_probability ? Number(row.draw_probability) : null,
          awayProbability: row.away_probability ? Number(row.away_probability) : null,
          goalsPrediction: row.goals_prediction,
          goalsConfidence: row.goals_confidence,
          goalsProbability: row.goals_probability ? Number(row.goals_probability) : null,
          bothTeamsToScore: row.both_teams_to_score,
          bothTeamsToScoreConfidence: row.both_teams_to_score_confidence,
          btsProbability: row.bts_probability ? Number(row.bts_probability) : null,
          cornersPrediction: row.corners_prediction,
          cornersConfidence: row.corners_confidence,
          cardsPrediction: row.cards_prediction,
          cardsConfidence: row.cards_confidence,
          doubleChance: row.double_chance,
          doubleChanceConfidence: row.double_chance_confidence,
          doubleChanceProbability: row.double_chance_probability ? Number(row.double_chance_probability) : null,
          halfTimePrediction: row.half_time_prediction,
          halfTimeConfidence: row.half_time_confidence,
          likelyScore: row.likely_score,
          bestBet: row.best_bet,
          bestBetConfidence: row.best_bet_confidence,
          extraTip: row.extra_tip,
          extraConfidence: row.extra_confidence,
          justification: row.justification,
          isPublished: row.is_published,
          createdAt: row.created_at,
        }));

        console.log(`[PREDICTIONS] Retornando ${predictions.length} palpites`);
        return predictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
