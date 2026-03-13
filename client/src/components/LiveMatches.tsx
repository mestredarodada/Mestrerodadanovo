import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { Radio, Clock, XCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Card de jogo ao vivo ─────────────────────────────────────────────────────

function getMatchPeriod(match: any): { label: string; color: string } {
  const status = match.status;
  const minute = match.minute ?? null;

  if (status === 'PAUSED') {
    return { label: 'INTERVALO', color: 'text-amber-500' };
  }
  if (status === 'IN_PLAY' && minute !== null) {
    if (minute <= 45) {
      return { label: '1º TEMPO', color: 'text-red-500' };
    } else {
      return { label: '2º TEMPO', color: 'text-red-500' };
    }
  }
  return { label: 'EM ANDAMENTO', color: 'text-red-500' };
}

function LiveMatchCard({ match, index, onViewPrediction }: { match: any; index: number; onViewPrediction?: () => void }) {
  const homeGoals = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const awayGoals = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minute = match.minute ?? null;
  const period = getMatchPeriod(match);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-red-500/20 overflow-hidden"
    >
      {/* Header ao vivo */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-widest">Ao Vivo</span>
        </div>
        {minute !== null && (
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <Clock size={11} />
            <span>{minute}'</span>
          </div>
        )}
        {match.matchday && (
          <span className="text-white/60 text-[10px]">Rodada {match.matchday}</span>
        )}
      </div>

      {/* Placar */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          {/* Time da casa */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.homeTeam?.crest ? (
              <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-black text-foreground">
                {match.homeTeam?.name?.[0] ?? '?'}
              </div>
            )}
            <p className="text-xs font-bold text-center text-foreground leading-tight max-w-[80px]">
              {match.homeTeam?.shortName || match.homeTeam?.name || 'Casa'}
            </p>
          </div>

          {/* Placar central */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span className="font-black text-4xl text-foreground">{homeGoals}</span>
              <span className="text-muted-foreground text-2xl font-light">-</span>
              <span className="font-black text-4xl text-foreground">{awayGoals}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${period.label === 'INTERVALO' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-full px-2.5 py-0.5`}>
              <Radio size={10} className={`${period.color} ${period.label !== 'INTERVALO' ? 'animate-pulse' : ''}`} />
              <span className={`${period.color} text-[10px] font-bold`}>{period.label}</span>
            </div>
          </div>

          {/* Time visitante */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.awayTeam?.crest ? (
              <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-black text-foreground">
                {match.awayTeam?.name?.[0] ?? '?'}
              </div>
            )}
            <p className="text-xs font-bold text-center text-foreground leading-tight max-w-[80px]">
              {match.awayTeam?.shortName || match.awayTeam?.name || 'Visitante'}
            </p>
          </div>
        </div>
      </div>

      {/* Botão Veja o palpite */}
      {onViewPrediction && (
        <div className="px-4 py-2 border-t border-border/40">
          <button
            onClick={onViewPrediction}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90 bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Sparkles size={13} />
            Veja o palpite desta partida
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/40 bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          {match.competition?.name || 'Liga'} · {format(new Date(match.utcDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function LiveMatches({ onViewPrediction }: { onViewPrediction?: () => void } = {}) {
  const { data: matches, isLoading, error } = trpc.football.live.useQuery(undefined, {
    refetchInterval: 60 * 1000, // atualiza a cada 60 segundos
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin" />
        <p className="text-muted-foreground text-sm">Verificando jogos ao vivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <XCircle size={40} className="text-red-400" />
        <p className="text-muted-foreground text-sm">Erro ao verificar jogos ao vivo.</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-xl"
        >
          <Radio size={36} className="text-slate-400" />
        </motion.div>
        <div className="text-center">
          <p className="font-poppins font-black text-xl text-foreground">Nenhum jogo ao vivo</p>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-xs">
            Não há jogos ao vivo no momento.
            <br />
            Esta página atualiza automaticamente a cada minuto.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 mt-2">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">Monitorando em tempo real</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-4 mb-6 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Radio size={20} className="text-white animate-pulse" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Agora</p>
            <p className="text-white font-black text-lg leading-none">
              {matches.length} jogo{matches.length > 1 ? 's' : ''} ao vivo
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/60 text-[10px]">Atualiza a cada 60s</p>
          </div>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match: any, i: number) => (
          <LiveMatchCard key={match.id} match={match} index={i} onViewPrediction={onViewPrediction} />
        ))}
      </div>
    </div>
  );
}
