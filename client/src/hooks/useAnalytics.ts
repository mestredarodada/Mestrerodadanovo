/**
 * Analytics desativado para melhor performance e estabilidade.
 * Este arquivo mantém as assinaturas das funções para evitar erros de compilação,
 * mas não realiza nenhuma operação de rede.
 */

export function usePageTracking() {
  // No-op
}

export const analytics = {
  trackAffiliateClick: () => {},
  trackWhatsAppShare: () => {},
  trackTelegramShare: () => {},
  trackFacebookShare: () => {},
  trackPageview: () => {},
};

export default analytics;
