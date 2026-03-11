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

    live: publicProcedure.query(async () => {
      try {
        const response = await axios.get(
          'https://api.football-data.org/v4/competitions/BSA/matches',
          {
            params: { status: 'IN_PLAY' },
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
          }
        );
        return response.data.matches || [];
      } catch (error) {
        console.error('Erro ao carregar jogos ao vivo:', error);
        return [];
      }
    }),

    aiResults: publicProcedure.query(async () => {
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const database = getDb();

        // Busca jogos finalizados da API
        const footballRes = await axios.get(
          'https://api.football-data.org/v4/competitions/BSA/matches',
          {
            params: { status: 'FINISHED', limit: 50 },
            headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
          }
        );
        const finishedMatches: any[] = footballRes.data.matches || [];

        // Busca palpites do banco
        const result = await database.execute(sql`
          SELECT * FROM predictions_simple
          WHERE is_published = true
          ORDER BY match_date DESC
        `);
        const predictions = (result.rows || result as any[]);

        // Cruza palpites com resultados reais
        const aiResults = predictions
          .map((pred: any) => {
            const match = finishedMatches.find((m: any) => String(m.id) === String(pred.match_id));
            if (!match) return null;

            const homeGoals = match.score?.fullTime?.home ?? null;
            const awayGoals = match.score?.fullTime?.away ?? null;
            if (homeGoals === null || awayGoals === null) return null;

            const totalGoals = homeGoals + awayGoals;
            const actualResult = homeGoals > awayGoals ? 'HOME' : homeGoals < awayGoals ? 'AWAY' : 'DRAW';

            // Verifica acertos
            const resultHit = pred.main_prediction === actualResult;

            const goalsHit = (() => {
              const g = pred.goals_prediction || '';
              if (g.startsWith('OVER_')) {
                const line = parseFloat(g.replace('OVER_', '').replace(/_/g, '.'));
                return totalGoals > line;
              } else if (g.startsWith('UNDER_')) {
                const line = parseFloat(g.replace('UNDER_', '').replace(/_/g, '.'));
                return totalGoals < line;
              }
              return null;
            })();

            const bttsHit = (() => {
              if (!pred.both_teams_to_score) return null;
              const actualBtts = homeGoals > 0 && awayGoals > 0;
              return (pred.both_teams_to_score === 'YES') === actualBtts;
            })();

            const hits = [resultHit, goalsHit, bttsHit].filter(v => v !== null);
            const hitCount = hits.filter(Boolean).length;
            const totalChecked = hits.length;

            return {
              matchId: pred.match_id,
              homeTeamName: pred.home_team_name,
              awayTeamName: pred.away_team_name,
              homeTeamCrest: pred.home_team_crest,
              awayTeamCrest: pred.away_team_crest,
              matchDate: pred.match_date,
              matchday: match.matchday,
              // Resultado real
              actualHomeGoals: homeGoals,
              actualAwayGoals: awayGoals,
              actualResult,
              // Palpites da IA
              mainPrediction: pred.main_prediction,
              goalsPrediction: pred.goals_prediction,
              bothTeamsToScore: pred.both_teams_to_score,
              cornersPrediction: pred.corners_prediction,
              cardsPrediction: pred.cards_prediction,
              bestBet: pred.best_bet,
              likelyScore: pred.likely_score,
              // Acertos
              resultHit,
              goalsHit,
              bttsHit,
              hitCount,
              totalChecked,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

        return aiResults;
      } catch (error) {
        console.error('Erro ao carregar resultados da IA:', error);
        return [];
      }
    }),

    predictions: publicProcedure.query(async () => {
      try {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');

        const database = getDb();

        // Busca jogos agendados e em andamento da API para obter datas corretas
        // e identificar quais jogos já foram finalizados
        let scheduledMatches: any[] = [];
        let finishedMatchIds: Set<string> = new Set();
        try {
          const [scheduledRes, finishedRes] = await Promise.all([
            axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
              params: { status: 'SCHEDULED' },
              headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
              timeout: 10000,
            }),
            axios.get('https://api.football-data.org/v4/competitions/BSA/matches', {
              params: { status: 'FINISHED', limit: 100 },
              headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY },
              timeout: 10000,
            }),
          ]);
          scheduledMatches = scheduledRes.data.matches || [];
          const finished = finishedRes.data.matches || [];
          finishedMatchIds = new Set(finished.map((m: any) => String(m.id)));
          console.log(`[PREDICTIONS] API: ${scheduledMatches.length} agendados, ${finishedMatchIds.size} finalizados`);
        } catch (apiErr) {
          console.warn('[PREDICTIONS] Erro ao buscar API football-data, usando dados do banco:', apiErr);
        }

        // Mapa de match_id -> dados da API (para corrigir datas e matchday)
        const apiMatchMap = new Map<string, any>();
        for (const m of scheduledMatches) {
          apiMatchMap.set(String(m.id), m);
        }

        // Busca todos os palpites publicados
        const result = await database.execute(sql`
          SELECT *
          FROM predictions_simple
          WHERE is_published = true
          ORDER BY match_date ASC
        `);

        // Atualiza datas erradas no banco em background (não bloqueia a resposta)
        const rowsToUpdate: { matchId: string; utcDate: string; matchday: number }[] = [];
        for (const row of (result.rows || result as any[])) {
          const apiMatch = apiMatchMap.get(String(row.match_id));
          if (apiMatch) {
            const dbDate = new Date(row.match_date).getTime();
            const apiDate = new Date(apiMatch.utcDate).getTime();
            // Se a data difere em mais de 1 minuto, atualiza
            if (Math.abs(dbDate - apiDate) > 60000) {
              rowsToUpdate.push({
                matchId: String(row.match_id),
                utcDate: apiMatch.utcDate,
                matchday: apiMatch.matchday,
              });
            }
          }
        }

        // Atualiza datas em background
        if (rowsToUpdate.length > 0) {
          console.log(`[PREDICTIONS] Corrigindo ${rowsToUpdate.length} datas no banco...`);
          for (const upd of rowsToUpdate) {
            try {
              await database.execute(
                sql.raw(`UPDATE predictions_simple SET match_date = '${upd.utcDate}', matchday = ${upd.matchday || 'NULL'} WHERE match_id = '${upd.matchId}'`)
              );
            } catch (e) {
              console.warn(`[PREDICTIONS] Erro ao atualizar data do match ${upd.matchId}:`, e);
            }
          }
        }

        // Normaliza os campos e filtra jogos já finalizados
        const predictions = (result.rows || result as any[])
          .filter((row: any) => !finishedMatchIds.has(String(row.match_id)))
          .map((row: any) => {
            // Usa a data da API se disponível (mais confiável)
            const apiMatch = apiMatchMap.get(String(row.match_id));
            const matchDate = apiMatch ? apiMatch.utcDate : row.match_date;
            const matchday = apiMatch?.matchday ? Number(apiMatch.matchday) : (row.matchday ? Number(row.matchday) : null);

            return {
              id: row.id,
              matchId: row.match_id,
              homeTeamName: row.home_team_name,
              awayTeamName: row.away_team_name,
              homeTeamCrest: row.home_team_crest,
              awayTeamCrest: row.away_team_crest,
              matchDate,
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
              matchday,
              likelyScore: row.likely_score,
              bestBet: row.best_bet,
              bestBetConfidence: row.best_bet_confidence,
              extraTip: row.extra_tip,
              extraConfidence: row.extra_confidence,
              justification: row.justification,
              isPublished: row.is_published,
              createdAt: row.created_at,
            };
          })
          // Ordena por data ASC (próximo jogo primeiro)
          .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

        console.log(`[PREDICTIONS] Retornando ${predictions.length} palpites (filtrados)`);
        return predictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
