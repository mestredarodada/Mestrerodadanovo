import { useMatches } from '@/hooks/useFootballData';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, Swords } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Skeleton loader
function MatchCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
        </div>
        <div className="h-8 w-16 bg-muted rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
        </div>
      </div>
      <div className="h-5 bg-muted rounded w-1/4" />
    </div>
  );
}

export default function UpcomingMatches() {
  const { data: matches, loading, error } = useMatches('SCHEDULED');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Swords className="text-red-400" size={40} />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
        <Calendar size={40} className="opacity-30" />
        <p>Nenhum jogo agendado no momento</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.slice(0, 12).map((match, index) => {
        const matchDate = parseISO(match.utcDate);
        const timeUntil = formatDistanceToNow(matchDate, {
          addSuffix: true,
          locale: ptBR,
        });
        const dateStr = format(matchDate, "dd 'de' MMM", { locale: ptBR });
        const timeStr = format(matchDate, 'HH:mm', { locale: ptBR });

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden"
          >
            {/* Cabeçalho do card */}
            <div className="bg-gradient-to-r from-[#1E40AF] to-[#1e3a8a] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-100 text-xs">
                <Calendar size={12} />
                <span>{dateStr}</span>
                <Clock size={12} className="ml-1" />
                <span>{timeStr}</span>
              </div>
              {match.matchday && (
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Rodada {match.matchday}
                </span>
              )}
            </div>

            {/* Corpo do card */}
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                {/* Time da casa */}
                <div className="flex-1 flex flex-col items-center gap-2 text-center">
                  {match.homeTeam.crest ? (
                    <img
                      src={match.homeTeam.crest}
                      alt={match.homeTeam.name}
                      className="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Shield size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-poppins font-bold text-foreground text-xs leading-tight">
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </p>
                </div>

                {/* VS central */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF8C00] to-orange-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-poppins font-black text-sm">VS</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[80px]">
                    {timeUntil}
                  </span>
                </div>

                {/* Time visitante */}
                <div className="flex-1 flex flex-col items-center gap-2 text-center">
                  {match.awayTeam.crest ? (
                    <img
                      src={match.awayTeam.crest}
                      alt={match.awayTeam.name}
                      className="w-12 h-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Shield size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-poppins font-bold text-foreground text-xs leading-tight">
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
