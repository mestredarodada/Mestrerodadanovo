import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Shield, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useState } from 'react';

type DayFilter = 'today' | 'yesterday';

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ResultCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
        </div>
        <div className="h-10 w-20 bg-muted rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
        </div>
      </div>
      <div className="h-5 bg-muted rounded w-1/4" />
    </div>
  );
}

// ─── Seletor Ontem / Hoje ──────────────────────────────────────────────────────

function DaySelector({ selected, onSelect, todayCount, yesterdayCount }: {
  selected: DayFilter;
  onSelect: (day: DayFilter) => void;
  todayCount: number;
  yesterdayCount: number;
}) {
  return (
    <div className="flex gap-2 mb-5">
      <button
        onClick={() => onSelect('today')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
          selected === 'today'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Hoje
        {todayCount > 0 && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            selected === 'today' ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'
          }`}>
            {todayCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onSelect('yesterday')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
          selected === 'yesterday'
            ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Ontem
        {yesterdayCount > 0 && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            selected === 'yesterday' ? 'bg-white/20' : 'bg-slate-500/10 text-slate-500'
          }`}>
            {yesterdayCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RecentResults() {
  const { data: results, isLoading, error } = trpc.football.aiResults.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  const [selectedDay, setSelectedDay] = useState<DayFilter>('today');

  const { todayResults, yesterdayResults } = useMemo(() => {
    if (!results || results.length === 0) return { todayResults: [], yesterdayResults: [] };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const todayResults = results
      .filter((r: any) => {
        const matchDate = new Date(r.matchDate);
        return matchDate >= todayStart;
      })
      .sort((a: any, b: any) => {
        // Ordenação por taxa de acerto (hitCount/totalChecked)
        const rateA = a.totalChecked > 0 ? a.hitCount / a.totalChecked : 0;
        const rateB = b.totalChecked > 0 ? b.hitCount / b.totalChecked : 0;
        
        if (rateB !== rateA) return rateB - rateA;
        // Se a taxa for igual, ordena por total de acertos absoluto
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        // Por fim, ordena por data (mais recentes primeiro)
        return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      });

    const yesterdayResults = results
      .filter((r: any) => {
        const matchDate = new Date(r.matchDate);
        return matchDate >= yesterdayStart && matchDate < todayStart;
      })
      .sort((a: any, b: any) => {
        // Ordenação por taxa de acerto (hitCount/totalChecked)
        const rateA = a.totalChecked > 0 ? a.hitCount / a.totalChecked : 0;
        const rateB = b.totalChecked > 0 ? b.hitCount / b.totalChecked : 0;
        
        if (rateB !== rateA) return rateB - rateA;
        // Se a taxa for igual, ordena por total de acertos absoluto
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        // Por fim, ordena por data (mais recentes primeiro)
        return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      });

    return { todayResults, yesterdayResults };
  }, [results]);

  const currentResults = selectedDay === 'today' ? todayResults : yesterdayResults;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ResultCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Trophy className="text-red-400" size={40} />
        <p className="text-red-600 font-medium">Erro ao carregar resultados</p>
      </div>
    );
  }

  return (
    <div>
      {/* Seletor Ontem / Hoje */}
      <DaySelector
        selected={selectedDay}
        onSelect={setSelectedDay}
        todayCount={todayResults.length}
        yesterdayCount={yesterdayResults.length}
      />

      <AnimatePresence mode="wait">
        {currentResults.length > 0 ? (
          <motion.div
            key={`results-${selectedDay}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {currentResults.map((r: any, index: number) => {
              const homeScore = r.actualHomeGoals;
              const awayScore = r.actualAwayGoals;
              const isHomeWin = homeScore !== null && awayScore !== null && homeScore > awayScore;
              const isAwayWin = homeScore !== null && awayScore !== null && awayScore > homeScore;
              const isDraw = homeScore !== null && awayScore !== null && homeScore === awayScore;

              const matchDate = new Date(r.matchDate);
              const dateStr = format(matchDate, "dd 'de' MMM", { locale: ptBR });
              const timeStr = format(matchDate, 'HH:mm', { locale: ptBR });
              const dayLabel = isToday(matchDate) ? 'Hoje' : 'Ontem';
              const competitionName = r.competitionName || '';

              const scoreGradient = isDraw
                ? 'from-yellow-500 to-yellow-600'
                : 'from-[#1E40AF] to-[#1e3a8a]';

              const hitRate = r.totalChecked > 0 ? Math.round((r.hitCount / r.totalChecked) * 100) : 0;
              const hitColor = hitRate >= 60 ? 'text-emerald-500' : hitRate >= 40 ? 'text-amber-500' : 'text-red-400';
              const hitBg = hitRate >= 60 ? 'bg-emerald-500/10' : hitRate >= 40 ? 'bg-amber-500/10' : 'bg-red-400/10';

              return (
                <motion.div
                  key={r.matchId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  {/* Cabeçalho */}
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                      <Calendar size={12} />
                      <span>{dayLabel} · {dateStr} · {timeStr}</span>
                    </div>
                    {competitionName ? (
                      <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full truncate max-w-[140px]">
                        {competitionName}
                      </span>
                    ) : null}
                  </div>

                  {/* Corpo */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      {/* Time da casa */}
                      <div className={`flex-1 flex flex-col items-center gap-2 text-center ${isHomeWin ? 'opacity-100' : isAwayWin ? 'opacity-50' : 'opacity-100'}`}>
                        {r.homeTeamCrest ? (
                          <img
                            src={r.homeTeamCrest}
                            alt={r.homeTeamName}
                            className={`w-12 h-12 object-contain drop-shadow-sm transition-transform duration-300 ${isHomeWin ? 'group-hover:scale-110' : ''}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Shield size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <p className={`font-poppins font-bold text-xs leading-tight ${isHomeWin ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          {r.homeTeamName}
                        </p>
                        {isHomeWin && (
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                            Vencedor
                          </span>
                        )}
                      </div>

                      {/* Placar central */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${scoreGradient} shadow-md`}>
                          <span className="text-white font-poppins font-black text-xl tracking-widest">
                            {homeScore !== null && awayScore !== null
                              ? `${homeScore} - ${awayScore}`
                              : '- -'}
                          </span>
                        </div>
                        {isDraw && (
                          <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                            Empate
                          </span>
                        )}
                      </div>

                      {/* Time visitante */}
                      <div className={`flex-1 flex flex-col items-center gap-2 text-center ${isAwayWin ? 'opacity-100' : isHomeWin ? 'opacity-50' : 'opacity-100'}`}>
                        {r.awayTeamCrest ? (
                          <img
                            src={r.awayTeamCrest}
                            alt={r.awayTeamName}
                            className={`w-12 h-12 object-contain drop-shadow-sm transition-transform duration-300 ${isAwayWin ? 'group-hover:scale-110' : ''}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Shield size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        <p className={`font-poppins font-bold text-xs leading-tight ${isAwayWin ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          {r.awayTeamName}
                        </p>
                        {isAwayWin && (
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                            Vencedor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer com taxa de acerto do Mestre */}
                  <div className={`px-4 py-2.5 border-t border-border/40 ${hitBg} flex items-center justify-between`}>
                    <div className="flex items-center gap-1.5">
                      {hitRate >= 60 ? (
                        <CheckCircle2 size={14} className={hitColor} />
                      ) : (
                        <XCircle size={14} className={hitColor} />
                      )}
                      <span className={`text-xs font-bold ${hitColor}`}>
                        {r.hitCount}/{r.totalChecked} acertos
                      </span>
                    </div>
                    <span className={`text-xs font-black ${hitColor}`}>
                      {hitRate}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key={`empty-${selectedDay}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"
          >
            <Trophy size={40} className="opacity-30" />
            <p className="font-poppins font-bold text-foreground">
              {selectedDay === 'today' ? 'Nenhum resultado hoje' : 'Nenhum resultado ontem'}
            </p>
            <p className="text-sm">
              {selectedDay === 'today'
                ? 'Quando os jogos de hoje com palpites do Mestre forem finalizados, os resultados aparecerão aqui.'
                : 'Não houve jogos finalizados com palpites do Mestre ontem.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
