import { pgTable, serial, text, varchar, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  
  // Informações do Jogo
  matchId: varchar('match_id', { length: 100 }).notNull().unique(),
  homeTeamId: varchar('home_team_id', { length: 100 }).notNull(),
  homeTeamName: varchar('home_team_name', { length: 255 }).notNull(),
  homeTeamCrest: text('home_team_crest'),
  awayTeamId: varchar('away_team_id', { length: 100 }).notNull(),
  awayTeamName: varchar('away_team_name', { length: 255 }).notNull(),
  awayTeamCrest: text('away_team_crest'),
  matchDate: timestamp('match_date').notNull(),
  matchday: numeric('matchday').notNull(),
  venue: varchar('venue', { length: 255 }),
  
  // Estatísticas do Time da Casa
  homeTeamPosition: numeric('home_team_position'),
  homeTeamPoints: numeric('home_team_points'),
  homeTeamPlayedGames: numeric('home_team_played_games'),
  homeTeamWon: numeric('home_team_won'),
  homeTeamDraw: numeric('home_team_draw'),
  homeTeamLost: numeric('home_team_lost'),
  homeTeamGoalsFor: numeric('home_team_goals_for'),
  homeTeamGoalsAgainst: numeric('home_team_goals_against'),
  homeTeamGoalDifference: numeric('home_team_goal_difference'),
  homeTeamAvgCorners: numeric('home_team_avg_corners', { precision: 5, scale: 2 }),
  homeTeamAvgCards: numeric('home_team_avg_cards', { precision: 5, scale: 2 }),
  homeTeamAvgShotsOnTarget: numeric('home_team_avg_shots_on_target', { precision: 5, scale: 2 }),
  homeTeamAvgPossession: numeric('home_team_avg_possession', { precision: 5, scale: 2 }),
  
  // Estatísticas do Time Visitante
  awayTeamPosition: numeric('away_team_position'),
  awayTeamPoints: numeric('away_team_points'),
  awayTeamPlayedGames: numeric('away_team_played_games'),
  awayTeamWon: numeric('away_team_won'),
  awayTeamDraw: numeric('away_team_draw'),
  awayTeamLost: numeric('away_team_lost'),
  awayTeamGoalsFor: numeric('away_team_goals_for'),
  awayTeamGoalsAgainst: numeric('away_team_goals_against'),
  awayTeamGoalDifference: numeric('away_team_goal_difference'),
  awayTeamAvgCorners: numeric('away_team_avg_corners', { precision: 5, scale: 2 }),
  awayTeamAvgCards: numeric('away_team_avg_cards', { precision: 5, scale: 2 }),
  awayTeamAvgShotsOnTarget: numeric('away_team_avg_shots_on_target', { precision: 5, scale: 2 }),
  awayTeamAvgPossession: numeric('away_team_avg_possession', { precision: 5, scale: 2 }),
  
  // Palpites Principais
  mainPrediction: varchar('main_prediction', { length: 50 }).notNull(), // 'HOME' | 'DRAW' | 'AWAY'
  mainConfidence: varchar('main_confidence', { length: 20 }).notNull(), // 'HIGH' | 'MEDIUM' | 'LOW'
  
  // Previsão de Gols
  goalsPrediction: varchar('goals_prediction', { length: 50 }).notNull(), // 'OVER_2_5' | 'UNDER_2_5'
  goalsConfidence: varchar('goals_confidence', { length: 20 }).notNull(),
  
  // Dica Extra
  extraTip: text('extra_tip').notNull(), // Ex: 'Ambas Marcam SIM', 'Mais de 9 Escanteios'
  extraConfidence: varchar('extra_confidence', { length: 20 }).notNull(),
  
  // Previsões Específicas
  cornersPrediction: varchar('corners_prediction', { length: 50 }), // 'OVER_9' | 'UNDER_9'
  cornersConfidence: varchar('corners_confidence', { length: 20 }),
  
  cardsPrediction: varchar('cards_prediction', { length: 50 }), // 'OVER_4_5' | 'UNDER_4_5'
  cardsConfidence: varchar('cards_confidence', { length: 20 }),
  
  shotsOnTargetPrediction: varchar('shots_on_target_prediction', { length: 50 }),
  shotsOnTargetConfidence: varchar('shots_on_target_confidence', { length: 20 }),
  
  bothTeamsToScore: varchar('both_teams_to_score', { length: 50 }), // 'YES' | 'NO'
  bothTeamsToScoreConfidence: varchar('both_teams_to_score_confidence', { length: 20 }),
  
  // Justificativa
  justification: text('justification').notNull(),
  
  // Metadados
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
});

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

// Tabela simples para palpites (alternativa)
export const predictionsSimple = pgTable('predictions_simple', {
  id: serial('id').primaryKey(),
  matchId: varchar('match_id', { length: 100 }).notNull().unique(),
  homeTeamName: varchar('home_team_name', { length: 255 }).notNull(),
  awayTeamName: varchar('away_team_name', { length: 255 }).notNull(),
  homeTeamCrest: text('home_team_crest'),
  awayTeamCrest: text('away_team_crest'),
  matchDate: timestamp('match_date').notNull(),
  
  // Palpites
  mainPrediction: varchar('main_prediction', { length: 50 }).notNull(),
  mainConfidence: varchar('main_confidence', { length: 20 }).notNull(),
  goalsPrediction: varchar('goals_prediction', { length: 50 }).notNull(),
  goalsConfidence: varchar('goals_confidence', { length: 20 }).notNull(),
  bothTeamsToScore: varchar('both_teams_to_score', { length: 50 }),
  bothTeamsToScoreConfidence: varchar('both_teams_to_score_confidence', { length: 20 }),
  cornersPrediction: varchar('corners_prediction', { length: 50 }),
  cornersConfidence: varchar('corners_confidence', { length: 20 }),
  cardsPrediction: varchar('cards_prediction', { length: 50 }),
  cardsConfidence: varchar('cards_confidence', { length: 20 }),
  extraTip: text('extra_tip'),
  extraConfidence: varchar('extra_confidence', { length: 20 }),
  justification: text('justification').notNull(),
  
  // Status
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PredictionSimple = typeof predictionsSimple.$inferSelect;
export type NewPredictionSimple = typeof predictionsSimple.$inferInsert;
