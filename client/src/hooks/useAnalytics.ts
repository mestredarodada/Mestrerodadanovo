import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

// Gerar ou recuperar session ID anônimo
function getSessionId(): string {
  const key = 'mestre_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Enviar evento para o backend
async function trackEvent(
  eventType: string,
  page: string,
  label?: string
): Promise<void> {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        page,
        label: label || null,
        sessionId: getSessionId(),
        referrer: document.referrer || null,
      }),
    });
  } catch {
    // Silenciosamente falha - analytics não deve quebrar a UX
  }
}

// Hook para rastrear pageviews automaticamente
export function usePageTracking() {
  const [location] = useLocation();
  const lastTracked = useRef<string>('');

  useEffect(() => {
    if (location !== lastTracked.current) {
      lastTracked.current = location;
      trackEvent('pageview', location);
    }
  }, [location]);
}

// Funções de rastreamento de cliques (exportadas para uso direto)
export const analytics = {
  trackAffiliateClick: (page: string, label?: string) =>
    trackEvent('click_affiliate', page, label),

  trackWhatsAppShare: (page: string, label?: string) =>
    trackEvent('click_whatsapp', page, label),

  trackTelegramShare: (page: string, label?: string) =>
    trackEvent('click_telegram', page, label),

  trackFacebookShare: (page: string, label?: string) =>
    trackEvent('click_facebook', page, label),

  trackPageview: (page: string) =>
    trackEvent('pageview', page),
};

export default analytics;
