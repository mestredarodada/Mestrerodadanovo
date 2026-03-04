import { useStandings } from '@/hooks/useFootballData';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Standings() {
  const { data: standings, loading, error } = useStandings();

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

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-border bg-muted">
            <th className="text-left p-3 font-poppins font-bold text-foreground">Pos</th>
            <th className="text-left p-3 font-poppins font-bold text-foreground">Time</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">J</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">V</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">E</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">D</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">SG</th>
            <th className="text-center p-3 font-poppins font-bold text-foreground">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr
              key={standing.team.id}
              className={`border-b border-border transition-colors hover:bg-muted/50 ${
                index < 4 ? 'bg-green-50' : index >= standings.length - 4 ? 'bg-red-50' : ''
              }`}
            >
              <td className="p-3 font-poppins font-bold text-foreground">{standing.position}</td>
              <td className="p-3 text-foreground font-medium">{standing.team.name}</td>
              <td className="text-center p-3 text-foreground">{standing.playedGames}</td>
              <td className="text-center p-3 text-green-600 font-semibold">{standing.won}</td>
              <td className="text-center p-3 text-yellow-600 font-semibold">{standing.draw}</td>
              <td className="text-center p-3 text-red-600 font-semibold">{standing.lost}</td>
              <td className="text-center p-3 text-foreground">
                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
              </td>
              <td className="text-center p-3 font-poppins font-bold text-primary text-lg">
                {standing.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
