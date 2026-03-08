import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Trophy, TrendingUp, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function AIResults() {
  const { data: results, isLoading, error } = trpc.football.aiResults.useQuery(undefined, {
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

  const currentResults = useMemo(() => {
    return grouped.find(([r]) => r === selectedRound)?.[1] ?? [];
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
      {/* Banner de estatísticas gerais */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-4 mb-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Taxa de Acerto Geral</p>
              <p className="text-white font-black text-2xl leading-none">{globalRate}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">{results.length} jogos analisados</p>
            <p className="text-white/70 text-xs">{totalHits} de {totalChecked} mercados acertados</p>
          </div>
        </div>
      </motion.div>

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
