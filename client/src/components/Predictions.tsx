import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Trophy, TrendingUp, AlertCircle, Zap } from 'lucide-react';

export default function Predictions() {
  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      const response = await axios.get('/api/predictions');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl border border-border p-6 animate-pulse"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="h-40 bg-muted rounded-lg" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-card rounded-2xl border border-border p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertCircle size={48} className="mx-auto text-destructive mb-4" />
        <p className="text-foreground font-bold">Erro ao carregar palpites.</p>
        <p className="text-sm text-muted-foreground mt-2">Por favor, tente novamente mais tarde.</p>
      </motion.div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <motion.div
        className="bg-card rounded-2xl border border-border p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum palpite disponível no momento.</p>
        <p className="text-sm text-muted-foreground mt-2">Os palpites serão gerados quando houver jogos agendados e publicados pelo Mestre.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {predictions.map((prediction, index) => (
        <motion.div
          key={prediction.matchId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-blue-600/10 to-orange-600/10 p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {prediction.homeTeamCrest ? (
                  <img
                    src={prediction.homeTeamCrest}
                    alt={prediction.homeTeamName}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Trophy size={20} className="text-muted-foreground" />
                )}
                <div>
                  <p className="font-poppins font-bold text-sm">{prediction.homeTeamName}</p>
                  <p className="text-xs text-muted-foreground">Pos. {prediction.homeTeamPosition}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {new Date(prediction.matchDate).toLocaleDateString('pt-BR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-poppins font-bold text-sm">{prediction.awayTeamName}</p>
                  <p className="text-xs text-muted-foreground">Pos. {prediction.awayTeamPosition}</p>
                </div>
                {prediction.awayTeamCrest ? (
                  <img
                    src={prediction.awayTeamCrest}
                    alt={prediction.awayTeamName}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Trophy size={20} className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Palpites Principais */}
          <div className="p-4 space-y-4">
            {/* Vencedor */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-sm">Vencedor</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    prediction.mainConfidence === 'HIGH'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : prediction.mainConfidence === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  }`}
                >
                  {prediction.mainConfidence === 'HIGH'
                    ? 'ALTA'
                    : prediction.mainConfidence === 'MEDIUM'
                      ? 'MÉDIA'
                      : 'BAIXA'}
                </span>
              </div>
              <p className="font-poppins font-black text-lg">
                {prediction.mainPrediction === 'HOME'
                  ? prediction.homeTeamName
                  : prediction.mainPrediction === 'AWAY'
                    ? prediction.awayTeamName
                    : 'Empate'}
              </p>
            </div>

            {/* Grid de Análises */}
            <div className="grid grid-cols-2 gap-3">
              {/* Gols */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-muted-foreground mb-1">⚽ Gols</p>
                <p className="font-bold text-sm">
                  {prediction.goalsPrediction === 'OVER_2_5' ? 'Over 2.5' : 'Under 2.5'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prediction.goalsConfidence === 'HIGH'
                    ? '🟢 Alta'
                    : prediction.goalsConfidence === 'MEDIUM'
                      ? '🟡 Média'
                      : '🔴 Baixa'}
                </p>
              </div>

              {/* Ambas Marcam */}
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-muted-foreground mb-1">🎯 Ambas Marcam</p>
                <p className="font-bold text-sm">{prediction.bothTeamsToScore === 'YES' ? 'SIM' : 'NÃO'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prediction.bothTeamsToScoreConfidence === 'HIGH'
                    ? '🟢 Alta'
                    : prediction.bothTeamsToScoreConfidence === 'MEDIUM'
                      ? '🟡 Média'
                      : '🔴 Baixa'}
                </p>
              </div>

              {/* Escanteios */}
              {prediction.cornersPrediction && (
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <p className="text-xs text-muted-foreground mb-1">🚩 Escanteios</p>
                  <p className="font-bold text-sm">
                    {prediction.cornersPrediction === 'OVER_9' ? 'Over 9' : 'Under 9'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prediction.cornersConfidence === 'HIGH'
                      ? '🟢 Alta'
                      : prediction.cornersConfidence === 'MEDIUM'
                        ? '🟡 Média'
                        : '🔴 Baixa'}
                  </p>
                </div>
              )}

              {/* Cartões */}
              {prediction.cardsPrediction && (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-muted-foreground mb-1">🟨 Cartões</p>
                  <p className="font-bold text-sm">
                    {prediction.cardsPrediction === 'OVER_4_5' ? 'Over 4.5' : 'Under 4.5'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prediction.cardsConfidence === 'HIGH'
                      ? '🟢 Alta'
                      : prediction.cardsConfidence === 'MEDIUM'
                        ? '🟡 Média'
                        : '🔴 Baixa'}
                  </p>
                </div>
              )}
            </div>

            {/* Dica Extra */}
            {prediction.extraTip && (
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-2">
                  <Zap size={16} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Dica Extra</p>
                    <p className="text-sm font-medium">{prediction.extraTip}</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                      Confiança:{' '}
                      {prediction.extraConfidence === 'HIGH'
                        ? 'Alta'
                        : prediction.extraConfidence === 'MEDIUM'
                          ? 'Média'
                          : 'Baixa'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Justificativa */}
            {prediction.justification && (
              <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Análise do Mestre
                </p>
                <p className="text-sm leading-relaxed text-foreground">{prediction.justification}</p>
              </div>
            )}

            {/* Estatísticas dos Times */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">{prediction.homeTeamName}</p>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-semibold">{prediction.homeTeamGoalsFor}</span> gols /
                    <span className="font-semibold"> {prediction.homeTeamGoalsAgainst}</span> sofridos
                  </p>
                  <p className="text-muted-foreground">
                    {prediction.homeTeamWon}V {prediction.homeTeamDraw}E {prediction.homeTeamLost}D
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">{prediction.awayTeamName}</p>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-semibold">{prediction.awayTeamGoalsFor}</span> gols /
                    <span className="font-semibold"> {prediction.awayTeamGoalsAgainst}</span> sofridos
                  </p>
                  <p className="text-muted-foreground">
                    {prediction.awayTeamWon}V {prediction.awayTeamDraw}E {prediction.awayTeamLost}D
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
