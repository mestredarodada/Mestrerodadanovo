import { pgTable, serial, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Tabela de eventos de analytics
export const analyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  
  // Tipo do evento: 'pageview' | 'click_affiliate' | 'click_share' | 'click_telegram' | 'click_whatsapp' | 'click_facebook'
  eventType: varchar('event_type', { length: 50 }).notNull(),
  
  // Página onde o evento ocorreu (ex: '/', '/palpite/flamengo-x-palmeiras-2026-03-08')
  page: varchar('page', { length: 500 }).notNull(),
  
  // Informações adicionais (ex: nome do time, slug do palpite)
  label: varchar('label', { length: 255 }),
  
  // Sessão anônima do visitante (UUID gerado no cliente)
  sessionId: varchar('session_id', { length: 100 }),
  
  // Referrer (de onde veio)
  referrer: text('referrer'),
  
  // User agent simplificado (mobile/desktop)
  deviceType: varchar('device_type', { length: 20 }), // 'mobile' | 'desktop' | 'tablet'
  
  // País/região (simplificado)
  country: varchar('country', { length: 10 }),
  
  // Timestamp do evento
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
