import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, Swords, Sparkles } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

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
  // Usa a rota predictions que retorna apenas jogos com palpite do Mestre
  const { data: predictions, isLoading, error } = trpc.football.predictions.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  // Filtra apenas jogos futuros (agendados), ordena do mais próximo para o mais distante
  const upcomingPredictions = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    const now = new Date().getTime();
    return predictions
      .filter((p: any) => new Date(p.matchDate).getTime() > now)
      .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [predictions]);

  if (isLoading) {
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
        <p className="text-red-600 font-medium">Erro ao carregar próximos jogos</p>
      </div>
    );
  }

  if (!upcomingPredictions || upcomingPredictions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
        <Calendar size={40} className="opacity-30" />
        <p className="font-poppins font-bold text-foreground">Nenhum jogo agendado com palpite</p>
        <p className="text-sm">Quando o Mestre gerar palpites para os próximos jogos, eles aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {upcomingPredictions.map((pred: any, index: number) => {
        const matchDate = new Date(pred.matchDate);
        const timeUntil = formatDistanceToNow(matchDate, {
          addSuffix: true,
          locale: ptBR,
        });
        const dateStr = format(matchDate, "dd 'de' MMM", { locale: ptBR });
        const timeStr = format(matchDate, 'HH:mm', { locale: ptBR });
        const competitionName = pred.competitionName || '';

        return (
          <motion.div
            key={pred.matchId}
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
              {competitionName ? (
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {competitionName}
                </span>
              ) : pred.matchday ? (
                <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Rodada {pred.matchday}
                </span>
              ) : null}
            </div>

            {/* Corpo do card */}
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                {/* Time da casa */}
                <div className="flex-1 flex flex-col items-center gap-2 text-center">
                  {pred.homeTeamCrest ? (
                    <img
                      src={pred.homeTeamCrest}
                      alt={pred.homeTeamName}
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
                    {pred.homeTeamName}
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
                  {pred.awayTeamCrest ? (
                    <img
                      src={pred.awayTeamCrest}
                      alt={pred.awayTeamName}
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
                    {pred.awayTeamName}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer com indicação de palpite do Mestre */}
            <div className="px-4 py-2 border-t border-border/40 bg-purple-500/5 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-purple-500" />
              <span className="text-[11px] font-bold text-purple-500">
                Palpite do Mestre disponível
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
