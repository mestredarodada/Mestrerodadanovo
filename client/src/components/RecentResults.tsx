import { useMatches } from '@/hooks/useFootballData';
import { motion } from 'framer-motion';
import { Calendar, Shield, Trophy } from 'lucide-react';
import { parseISO, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

// Skeleton loader
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

export default function RecentResults() {
  const { data: matches, loading, error } = useMatches('FINISHED');

  // Filtra apenas jogos de ontem e hoje, ordena do mais recente para o mais antigo
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches
      .filter((match) => {
        const matchDate = parseISO(match.utcDate);
        return isToday(matchDate) || isYesterday(matchDate);
      })
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  }, [matches]);

  if (loading) {
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
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!filteredMatches || filteredMatches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
        <Trophy size={40} className="opacity-30" />
        <p>Nenhum resultado de ontem ou hoje disponível</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredMatches.map((match, index) => {
        const homeScore = match.score.fullTime.home;
        const awayScore = match.score.fullTime.away;
        const isHomeWin = homeScore !== null && awayScore !== null && homeScore > awayScore;
        const isAwayWin = homeScore !== null && awayScore !== null && awayScore > homeScore;
        const isDraw = homeScore !== null && awayScore !== null && homeScore === awayScore;

        const matchDate = parseISO(match.utcDate);
        const dateStr = format(matchDate, "dd 'de' MMM", { locale: ptBR });
        const timeStr = format(matchDate, 'HH:mm', { locale: ptBR });
        const dayLabel = isToday(matchDate) ? 'Hoje' : 'Ontem';
        const competitionName = match.competition?.name || '';

        // Cor do placar
        const scoreGradient = isDraw
          ? 'from-yellow-500 to-yellow-600'
          : 'from-[#1E40AF] to-[#1e3a8a]';

        return (
          <motion.div
            key={match.id}
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
              ) : match.matchday ? (
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Rodada {match.matchday}
                </span>
              ) : null}
            </div>

            {/* Corpo */}
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                {/* Time da casa */}
                <div className={`flex-1 flex flex-col items-center gap-2 text-center ${isHomeWin ? 'opacity-100' : isAwayWin ? 'opacity-50' : 'opacity-100'}`}>
                  {match.homeTeam.crest ? (
                    <img
                      src={match.homeTeam.crest}
                      alt={match.homeTeam.name}
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
                    {match.homeTeam.shortName || match.homeTeam.name}
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
                  {match.awayTeam.crest ? (
                    <img
                      src={match.awayTeam.crest}
                      alt={match.awayTeam.name}
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
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </p>
                  {isAwayWin && (
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                      Vencedor
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
