/**
 * Hook para detectar se o site está sendo acessado pelo app Android (WebView).
 * 
 * O app Android envia um User-Agent customizado contendo "MestreDaRodadaApp".
 * Quando detectado, elementos relacionados a casas de apostas são ocultados
 * para conformidade com as políticas da Google Play Store.
 * 
 * Para reverter: basta remover as verificações de isAppWebView nos componentes,
 * ou remover este hook completamente.
 */

import { useMemo } from 'react';

export function useIsAppWebView(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return navigator.userAgent.includes('MestreDaRodadaApp');
  }, []);
}

/**
 * Versão não-hook para uso fora de componentes React (ex: funções utilitárias).
 */
export function isAppWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('MestreDaRodadaApp');
}
