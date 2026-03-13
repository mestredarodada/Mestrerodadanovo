import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllLiveMatches, 
  getAllMatches, 
  getAllFinishedMatches,
  getMatchesByCompetition,
  getCompetitionName,
  SUPPORTED_COMPETITIONS,
} from "./footballApi";

export const appRouter = router({
  system: systemRouter,

  football: router({
    matches: publicProcedure
      .input(z.object({ status: z.enum(['SCHEDULED', 'FINISHED', 'IN_PLAY']).default('SCHEDULED') }))
      .query(async ({ input }) => {
        try {
          // Agora busca de todas as ligas
          const today = new Date();
          const pastDate = new Date();
          pastDate.setDate(today.getDate() - 2);
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + 7);
          
          const { getAllMatchesByDate } = await import("./footballApi");
          const dateFrom = pastDate.toISOString().split('T')[0];
          const dateTo = futureDate.toISOString().split('T')[0];
          
          const allMatches = await getAllMatchesByDate(dateFrom, dateTo);
          return allMatches.filter((m: any) => {
            if (input.status === 'IN_PLAY') return ['IN_PLAY', 'PAUSED'].includes(m.status);
            return m.status === input.status;
          });
        } catch (error) {
          console.error(`Erro ao carregar jogos (${input.status}):`, error);
          throw new Error(`Falha ao carregar jogos`);
        }
      }),

    live: publicProcedure.query(async () => {
      try {
        return await getAllLiveMatches();
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

        // Busca jogos finalizados de TODAS as ligas (últimos 3 dias)
        const finishedMatches: any[] = await getAllFinishedMatches(3);

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

            // ─── Verifica acertos em TODOS os mercados ───
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

            const doubleChanceHit = (() => {
              const dc = pred.double_chance;
              if (!dc) return null;
              if (dc === '1X') return actualResult === 'HOME' || actualResult === 'DRAW';
              if (dc === 'X2') return actualResult === 'DRAW' || actualResult === 'AWAY';
              if (dc === '12') return actualResult === 'HOME' || actualResult === 'AWAY';
              if (dc === 'HOME_DRAW') return actualResult === 'HOME' || actualResult === 'DRAW';
              if (dc === 'HOME_AWAY') return actualResult === 'HOME' || actualResult === 'AWAY';
              if (dc === 'DRAW_AWAY') return actualResult === 'DRAW' || actualResult === 'AWAY';
              const dcLower = dc.toLowerCase();
              if (dcLower.includes('empate')) {
                if (actualResult === 'DRAW') return true;
                if (actualResult === 'HOME' && dcLower.includes(pred.home_team_name?.toLowerCase()?.split(' ')[0])) return true;
                if (actualResult === 'AWAY' && dcLower.includes(pred.away_team_name?.toLowerCase()?.split(' ')[0])) return true;
              }
              return null;
            })();

            const halfTimeHit = (() => {
              if (!pred.half_time_prediction) return null;
              const htHome = match.score?.halfTime?.home;
              const htAway = match.score?.halfTime?.away;
              if (htHome === null || htHome === undefined || htAway === null || htAway === undefined) return null;
              const htResult = htHome > htAway ? 'HOME' : htHome < htAway ? 'AWAY' : 'DRAW';
              const htPred = pred.half_time_prediction;
              if (htPred === 'HOME' || htPred === 'AWAY' || htPred === 'DRAW') {
                return htPred === htResult;
              }
              const htLower = htPred.toLowerCase();
              if (htLower.includes('empate') && htResult === 'DRAW') return true;
              if (htResult === 'HOME' && htLower.includes(pred.home_team_name?.toLowerCase()?.split(' ')[0])) return true;
              if (htResult === 'AWAY' && htLower.includes(pred.away_team_name?.toLowerCase()?.split(' ')[0])) return true;
              if (htLower.includes('empate') && htResult !== 'DRAW') return false;
              return null;
            })();

            const scoreHit = (() => {
              if (!pred.likely_score) return null;
              const parts = pred.likely_score.match(/(\d+)\s*[x×-]\s*(\d+)/);
              if (!parts) return null;
              return parseInt(parts[1]) === homeGoals && parseInt(parts[2]) === awayGoals;
            })();

            const hits = [resultHit, goalsHit, bttsHit, doubleChanceHit, halfTimeHit, scoreHit].filter(v => v !== null);
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
              competitionCode: pred.competition_code || match.competition?.code || null,
              competitionName: pred.competition_name || match.competition?.name || null,
              actualHomeGoals: homeGoals,
              actualAwayGoals: awayGoals,
              actualResult,
              actualHalfTimeHome: match.score?.halfTime?.home ?? null,
              actualHalfTimeAway: match.score?.halfTime?.away ?? null,
              mainPrediction: pred.main_prediction,
              goalsPrediction: pred.goals_prediction,
              bothTeamsToScore: pred.both_teams_to_score,
              cornersPrediction: pred.corners_prediction,
              cardsPrediction: pred.cards_prediction,
              doubleChance: pred.double_chance,
              halfTimePrediction: pred.half_time_prediction,
              bestBet: pred.best_bet,
              likelyScore: pred.likely_score,
              resultHit,
              goalsHit,
              bttsHit,
              doubleChanceHit,
              halfTimeHit,
              scoreHit,
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

        // Busca TODOS os jogos de TODAS as ligas
        let allMatches: any[] = [];
        let oldFinishedIds: Set<string> = new Set();
        try {
          allMatches = await getAllMatches();
          
          const now = Date.now();
          const FIVE_HOURS = 5 * 60 * 60 * 1000;
          for (const m of allMatches) {
            if (m.status === 'FINISHED') {
              const finishTime = new Date(m.utcDate).getTime() + (105 * 60 * 1000);
              if (now - finishTime >= FIVE_HOURS) {
                oldFinishedIds.add(String(m.id));
              }
            }
          }
          
          const scheduled = allMatches.filter((m: any) => m.status === 'SCHEDULED').length;
          const inPlay = allMatches.filter((m: any) => ['IN_PLAY', 'PAUSED'].includes(m.status)).length;
          const finished = allMatches.filter((m: any) => m.status === 'FINISHED').length;
          console.log(`[PREDICTIONS v2.0] ${scheduled} agendados, ${inPlay} ao vivo, ${finished} finalizados, ${oldFinishedIds.size} antigos (> 5h)`);
        } catch (apiErr) {
          console.warn('[PREDICTIONS v2.0] Erro ao buscar API football-data, usando dados do banco:', apiErr);
        }

        const apiMatchMap = new Map<string, any>();
        for (const m of allMatches) {
          apiMatchMap.set(String(m.id), m);
        }

        const result = await database.execute(sql`
          SELECT *
          FROM predictions_simple
          WHERE is_published = true
          ORDER BY match_date ASC
        `);

        // Atualiza datas erradas no banco em background
        const rowsToUpdate: { matchId: string; utcDate: string; matchday: number | null }[] = [];
        for (const row of (result.rows || result as any[])) {
          const apiMatch = apiMatchMap.get(String(row.match_id));
          if (apiMatch) {
            const dbDate = new Date(row.match_date).getTime();
            const apiDate = new Date(apiMatch.utcDate).getTime();
            if (Math.abs(dbDate - apiDate) > 60000) {
              rowsToUpdate.push({
                matchId: String(row.match_id),
                utcDate: apiMatch.utcDate,
                matchday: apiMatch.matchday ?? null,
              });
            }
          }
        }

        if (rowsToUpdate.length > 0) {
          console.log(`[PREDICTIONS v2.0] Corrigindo ${rowsToUpdate.length} datas no banco...`);
          for (const upd of rowsToUpdate) {
            try {
              await database.execute(
                sql.raw(`UPDATE predictions_simple SET match_date = '${upd.utcDate}'${upd.matchday !== null ? `, matchday = ${upd.matchday}` : ''} WHERE match_id = '${upd.matchId}'`)
              );
            } catch (e) {
              console.warn(`[PREDICTIONS v2.0] Erro ao atualizar data do match ${upd.matchId}:`, e);
            }
          }
        }

        const predictions = (result.rows || result as any[])
          .filter((row: any) => !oldFinishedIds.has(String(row.match_id)))
          .map((row: any) => {
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
              competitionCode: row.competition_code || (apiMatch?.competitionCode) || null,
              competitionName: row.competition_name || (apiMatch?.competitionName) || null,
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
          .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

        console.log(`[PREDICTIONS v2.0] Retornando ${predictions.length} palpites (filtrados)`);
        return predictions;
      } catch (error) {
        console.error('Erro ao carregar palpites:', error);
        throw new Error('Falha ao carregar palpites');
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
