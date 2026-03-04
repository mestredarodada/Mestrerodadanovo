import { useStandings } from '@/hooks/useFootballData';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';

// Skeleton loader para a tabela
function StandingsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-muted rounded mb-1" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted/60 rounded mb-1" />
      ))}
    </div>
  );
}

// Determina a zona do time e retorna a classe de cor
function getZoneInfo(position: number, total: number) {
  if (position <= 4) {
    return {
      label: 'Libertadores',
      color: 'bg-blue-500',
      rowClass: 'border-l-4 border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    };
  }
  if (position <= 6) {
    return {
      label: 'Sul-Americana',
      color: 'bg-emerald-500',
      rowClass: 'border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    };
  }
  if (position > total - 4) {
    return {
      label: 'Rebaixamento',
      color: 'bg-red-500',
      rowClass: 'border-l-4 border-l-red-500 bg-red-50/60 dark:bg-red-950/20',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
  }
  return {
    label: '',
    color: 'bg-transparent',
    rowClass: 'border-l-4 border-l-transparent',
    badge: '',
  };
}

export default function Standings() {
  const { data: standings, loading, error } = useStandings();

  if (loading) return <StandingsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Shield className="text-red-400" size={40} />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
        <Trophy size={40} className="opacity-30" />
        <p>Nenhum dado disponível no momento</p>
      </div>
    );
  }

  const total = standings.length;

  return (
    <div className="w-full space-y-3">
      {/* Legenda das zonas */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span className="text-muted-foreground">Libertadores (G4)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span className="text-muted-foreground">Sul-Americana (G6)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
          <span className="text-muted-foreground">Rebaixamento (Z4)</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gradient-to-r from-[#1E40AF] to-[#1e3a8a] text-white">
              <th className="text-center p-3 font-poppins font-bold w-10">#</th>
              <th className="text-left p-3 font-poppins font-bold">Time</th>
              <th className="text-center p-3 font-poppins font-bold w-10 hidden sm:table-cell">J</th>
              <th className="text-center p-3 font-poppins font-bold w-10">V</th>
              <th className="text-center p-3 font-poppins font-bold w-10 hidden sm:table-cell">E</th>
              <th className="text-center p-3 font-poppins font-bold w-10">D</th>
              <th className="text-center p-3 font-poppins font-bold w-12 hidden md:table-cell">GP</th>
              <th className="text-center p-3 font-poppins font-bold w-12 hidden md:table-cell">GC</th>
              <th className="text-center p-3 font-poppins font-bold w-12">SG</th>
              <th className="text-center p-3 font-poppins font-bold w-14">Pts</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {standings.map((standing, index) => {
                const zone = getZoneInfo(standing.position, total);
                return (
                  <motion.tr
                    key={standing.team.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className={`border-b border-border transition-all duration-200 hover:brightness-95 cursor-default ${zone.rowClass}`}
                  >
                    {/* Posição */}
                    <td className="p-3 text-center">
                      <span className="font-poppins font-bold text-foreground text-sm">
                        {standing.position}
                      </span>
                    </td>

                    {/* Time com logo */}
                    <td className="p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {standing.team.crest ? (
                          <img
                            src={standing.team.crest}
                            alt={standing.team.name}
                            className="w-7 h-7 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Shield size={14} className="text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium text-foreground truncate text-sm">
                          {standing.team.shortName || standing.team.name}
                        </span>
                      </div>
                    </td>

                    {/* Jogos */}
                    <td className="text-center p-3 text-muted-foreground hidden sm:table-cell">
                      {standing.playedGames}
                    </td>

                    {/* Vitórias */}
                    <td className="text-center p-3 text-green-600 dark:text-green-400 font-semibold">
                      {standing.won}
                    </td>

                    {/* Empates */}
                    <td className="text-center p-3 text-yellow-600 dark:text-yellow-400 font-semibold hidden sm:table-cell">
                      {standing.draw}
                    </td>

                    {/* Derrotas */}
                    <td className="text-center p-3 text-red-600 dark:text-red-400 font-semibold">
                      {standing.lost}
                    </td>

                    {/* Gols Pró */}
                    <td className="text-center p-3 text-foreground hidden md:table-cell">
                      {standing.goalsFor}
                    </td>

                    {/* Gols Contra */}
                    <td className="text-center p-3 text-foreground hidden md:table-cell">
                      {standing.goalsAgainst}
                    </td>

                    {/* Saldo de Gols */}
                    <td className="text-center p-3">
                      <span className={`font-semibold text-sm ${standing.goalDifference > 0 ? 'text-green-600 dark:text-green-400' : standing.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </span>
                    </td>

                    {/* Pontos */}
                    <td className="text-center p-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1E40AF] text-white font-poppins font-bold text-sm shadow-sm">
                        {standing.points}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
