import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Trophy, TrendingUp, Brain, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SITE_URL = 'https://www.mestredarodada.com.br';
const PLAYSTORE_LINK = 'https://play.google.com/store/apps/details?id=br.com.mestredarodada.app';
const AFFILIATE_LINK = 'https://1wrlst.com/?open=register&p=c2f3';

function isAppWebView() {
  return typeof navigator !== 'undefined' && /MestreDaRodadaApp/i.test(navigator.userAgent);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrediction(val: string | null | undefined, home: string, away: string): string {
  if (!val) return 'N/D';
  if (val === 'HOME') return `Vitória ${home}`;
  if (val === 'AWAY') return `Vitória ${away}`;
  if (val === 'DRAW') return 'Empate';
  return val
    .replace('OVER_', 'Mais de ')
    .replace('UNDER_', 'Menos de ')
    .replace(/_/g, '.');
}

function HitBadge({ hit }: { hit: boolean | null }) {
  if (hit === null) return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <MinusCircle size={13} /> N/D
    </span>
  );
  return hit ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
      <CheckCircle2 size={13} /> Acertou
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
      <XCircle size={13} /> Errou
    </span>
  );
}

// ─── Botões de Compartilhar ──────────────────────────────────────────────────

function AIShareButtons({ r, hitRate }: { r: any; hitRate: number }) {
  const home = r.homeTeamName;
  const away = r.awayTeamName;
  const ratingEmoji = hitRate >= 67 ? '🟢' : hitRate >= 34 ? '🟡' : '🔴';
  const resultText = r.resultHit ? '✅ Acertou' : '❌ Errou';

  const text = `⚽ *${home} ${r.actualHomeGoals} x ${r.actualAwayGoals} ${away}*\n\n🤖 O que a IA previu:\n📊 Resultado: ${formatPrediction(r.mainPrediction, home, away)} ${resultText}\n${ratingEmoji} Desempenho: *${hitRate}%* de acerto\n\n🎰 Odds incríveis — Cadastre-se:\n${AFFILIATE_LINK}\n\n📲 Baixe o app oficial:\n${PLAYSTORE_LINK}\n\n🌐 ${SITE_URL}`;

  const isApp = isAppWebView();

  // No app, usa Web Share API nativa do Android
  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resultado: ${home} x ${away}`,
          text: text,
          url: SITE_URL,
        });
      }
    } catch (e) {
      // Usuário cancelou ou erro - ignora
    }
  };

  // No app, mostra botão único de compartilhar nativo
  if (isApp) {
    return (
      <div className="px-4 pb-4 pt-2 border-t border-border/40">
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90 bg-gradient-to-r from-emerald-500 to-teal-500"
        >
          <Share2 size={14} />
          Compartilhar resultado
        </button>
      </div>
    );
  }

  // No navegador, mostra botões individuais
  const encoded = encodeURIComponent(text);
  const urlEncoded = encodeURIComponent(SITE_URL);

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/40">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <Share2 size={10} />
        Compartilhar resultado
      </p>
      <div className="flex gap-2">
        <a
          href={`https://wa.me/?text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${urlEncoded}&text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#229ED9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1877F2' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
      </div>
    </div>
  );
}

// ─── Card de Resultado ────────────────────────────────────────────────────────

function AIResultCard({ r, index }: { r: any; index: number }) {
  const hitRate = r.totalChecked > 0 ? Math.round((r.hitCount / r.totalChecked) * 100) : 0;

  const ratingColor = hitRate >= 67 ? 'text-emerald-400' :
    hitRate >= 34 ? 'text-amber-400' : 'text-red-400';

  const ratingBg = hitRate >= 67 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' :
    hitRate >= 34 ? 'from-amber-500/20 to-amber-600/10 border-amber-500/30' :
    'from-red-500/20 to-red-600/10 border-red-500/30';

  const ratingLabel = hitRate >= 67 ? '🟢 Boa análise' :
    hitRate >= 34 ? '🟡 Parcial' : '🔴 Não acertou';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-border/60 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Escudos */}
          <div className="flex items-center gap-1.5">
            {r.homeTeamCrest ? (
              <img src={r.homeTeamCrest} alt={r.homeTeamName} className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold">
                {r.homeTeamName[0]}
              </div>
            )}
            <span className="text-white/40 text-sm font-bold">×</span>
            {r.awayTeamCrest ? (
              <img src={r.awayTeamCrest} alt={r.awayTeamName} className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold">
                {r.awayTeamName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">
              {r.homeTeamName} <span className="text-white/40">×</span> {r.awayTeamName}
            </p>
            <p className="text-white/50 text-[10px]">
              {r.matchday ? `Rodada ${r.matchday} · ` : ''}
              {format(new Date(r.matchDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Placar real */}
        <div className="text-center">
          <div className="text-white font-black text-xl leading-none">
            {r.actualHomeGoals} <span className="text-white/40">-</span> {r.actualAwayGoals}
          </div>
          <p className="text-white/40 text-[9px] mt-0.5">Resultado Final</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Rating geral */}
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 mb-4 bg-gradient-to-r border ${ratingBg}`}>
          <div className="flex items-center gap-2">
            <Brain size={14} className={ratingColor} />
            <span className="text-sm font-semibold text-foreground">Desempenho da IA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${ratingColor}`}>{hitRate}%</span>
            <span className="text-xs text-muted-foreground">{ratingLabel}</span>
          </div>
        </div>

        {/* Mercados */}
        <div className="space-y-2">
          {/* Resultado */}
          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <div>
              <p className="text-xs text-muted-foreground">Resultado previsto</p>
              <p className="text-sm font-semibold text-foreground">
                {formatPrediction(r.mainPrediction, r.homeTeamName, r.awayTeamName)}
              </p>
            </div>
            <HitBadge hit={r.resultHit} />
          </div>

          {/* Gols */}
          {r.goalsPrediction && (
            <div className="flex items-center justify-between py-1.5 border-b border-border/40">
              <div>
                <p className="text-xs text-muted-foreground">Gols previstos</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatPrediction(r.goalsPrediction, r.homeTeamName, r.awayTeamName)} gols
                  <span className="text-xs text-muted-foreground ml-1">(total: {r.actualHomeGoals + r.actualAwayGoals})</span>
                </p>
              </div>
              <HitBadge hit={r.goalsHit} />
            </div>
          )}

          {/* BTTS */}
          {r.bothTeamsToScore && (
            <div className="flex items-center justify-between py-1.5 border-b border-border/40">
              <div>
                <p className="text-xs text-muted-foreground">Ambas marcam</p>
                <p className="text-sm font-semibold text-foreground">
                  {r.bothTeamsToScore === 'YES' ? 'SIM' : 'NÃO'}
                  <span className="text-xs text-muted-foreground ml-1">
                    (real: {r.actualHomeGoals > 0 && r.actualAwayGoals > 0 ? 'SIM' : 'NÃO'})
                  </span>
                </p>
              </div>
              <HitBadge hit={r.bttsHit} />
            </div>
          )}

          {/* Melhor aposta */}
          {r.bestBet && (
            <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mb-0.5">⭐ Melhor Aposta Prevista</p>
              <p className="text-sm text-foreground font-medium">{r.bestBet}</p>
            </div>
          )}
        </div>

        {/* Botões de compartilhar */}
        {!isAppWebView() && <AIShareButtons r={r} hitRate={hitRate} />}
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function AIResults() {
  const { data: results, isLoading, error } = trpc.football.aiResults.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  // Hooks DEVEM vir antes de qualquer return condicional
  const grouped = useMemo(() => {
    if (!results || results.length === 0) return [];
    const map = new Map<number | string, any[]>();
    for (const r of results) {
      const key = r.matchday ?? 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => Number(b) - Number(a));
  }, [results]);

  const latestRound = grouped[0]?.[0] ?? 0;
  const [selectedRound, setSelectedRound] = useState<number | string>(latestRound);

  // Sincroniza selectedRound quando latestRound muda (quando os dados carregam)
  useEffect(() => {
    if (latestRound !== 0 && selectedRound === 0) {
      setSelectedRound(latestRound);
    }
  }, [latestRound, selectedRound]);

  const currentResults = useMemo(() => {
    const results = grouped.find(([r]) => r === selectedRound)?.[1] ?? [];
    return results;
  }, [grouped, selectedRound]);

  const totalHits = useMemo(() => (results || []).reduce((acc: number, r: any) => acc + r.hitCount, 0), [results]);
  const totalChecked = useMemo(() => (results || []).reduce((acc: number, r: any) => acc + r.totalChecked, 0), [results]);
  const globalRate = totalChecked > 0 ? Math.round((totalHits / totalChecked) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando resultados da IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <XCircle size={40} className="text-red-400" />
        <p className="text-muted-foreground text-sm">Erro ao carregar resultados.</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
          <Trophy size={28} className="text-white" />
        </div>
        <div className="text-center">
          <p className="font-poppins font-black text-lg text-foreground">Aguardando jogos finalizados</p>
          <p className="text-muted-foreground text-sm mt-1">
            Quando os jogos com palpites do Mestre forem finalizados,<br />
            o resultado da análise aparecerá aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Submenu de rodadas */}
      {grouped.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {grouped.map(([round, rds]) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedRound === round
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {Number(round) > 0 ? `Rodada ${round}` : 'Sem rodada'}
              <span className="ml-1.5 opacity-70">({rds.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Cards da rodada selecionada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(selectedRound)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {currentResults.map((r: any, i: number) => (
            <AIResultCard key={r.matchId} r={r} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
