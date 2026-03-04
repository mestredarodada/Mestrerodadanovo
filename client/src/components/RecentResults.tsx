import { useMatches } from '@/hooks/useFootballData';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar } from 'lucide-react';

export default function RecentResults() {
  const { data: matches, loading, error } = useMatches('FINISHED');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum resultado disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.slice(0, 12).map((match) => {
        const homeScore = match.score.fullTime.home;
        const awayScore = match.score.fullTime.away;
        const isHomeWin = homeScore !== null && awayScore !== null && homeScore > awayScore;
        const isAwayWin = homeScore !== null && awayScore !== null && awayScore > homeScore;
        const isDraw = homeScore === awayScore;

        return (
          <Card
            key={match.id}
            className="p-4 hover:shadow-lg transition-shadow border border-border"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Calendar size={14} />
              <span>{new Date(match.utcDate).toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className={`font-poppins font-bold text-sm ${isHomeWin ? 'text-green-600' : 'text-foreground'}`}>
                  {match.homeTeam.name}
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-poppins font-bold text-primary">
                  {homeScore !== null && awayScore !== null ? `${homeScore} - ${awayScore}` : '-'}
                </span>
              </div>

              <div className="flex-1 text-right">
                <p className={`font-poppins font-bold text-sm ${isAwayWin ? 'text-green-600' : 'text-foreground'}`}>
                  {match.awayTeam.name}
                </p>
              </div>
            </div>

            {match.matchday && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded font-medium">
                  Rodada {match.matchday}
                </span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
