import { useState } from 'react';

/**
 * Banner fino para o topo do site anunciando o app na Play Store.
 * 
 * COMO USAR:
 * 1. Copie este arquivo para client/src/components/PlayStoreBanner.tsx
 * 2. No seu App.tsx ou layout principal, importe e adicione no topo:
 *    import PlayStoreBanner from '@/components/PlayStoreBanner';
 *    E coloque <PlayStoreBanner /> antes do conteúdo principal
 * 3. Substitua o LINK_PLAYSTORE pelo link real do app na Play Store
 * 
 * O banner NÃO aparece quando acessado pelo app (detecta User-Agent).
 */

const LINK_PLAYSTORE = 'https://play.google.com/store/apps/details?id=br.com.mestredarodada.app';

export default function PlayStoreBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#0a0e1a] via-[#0f1a2e] to-[#0a0e1a] border-b border-blue-900/30 relative overflow-hidden">
      {/* Linhas decorativas de circuito */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-0 w-32 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        <div className="absolute top-1/2 right-0 w-32 h-px bg-gradient-to-l from-transparent via-orange-500 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3 relative z-10">
        {/* Ícone Play Store */}
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
          <path d="M17.556 8.236L5.178.734 14.87 10.922l2.686-2.686z" fill="#EA4335"/>
          <path d="M17.556 15.764L14.87 13.078 5.178 23.266l12.378-7.502z" fill="#34A853"/>
          <path d="M21.395 10.678l-3.84-2.442-2.686 2.686 2.686 2.686 3.84-2.442c.77-.466.77-1.022 0-1.488z" fill="#FBBC04"/>
        </svg>

        {/* Texto */}
        <span className="text-white text-xs sm:text-sm font-medium">
          📱 Aplicativo oficial disponível na <span className="text-green-400 font-bold">Play Store</span>
        </span>

        {/* Botão Baixar */}
        <a
          href={LINK_PLAYSTORE}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full transition-colors flex-shrink-0"
        >
          BAIXAR
        </a>

        {/* Botão Fechar */}
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-white text-lg leading-none ml-1 flex-shrink-0"
          aria-label="Fechar banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
