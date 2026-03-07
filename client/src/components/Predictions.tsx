import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Clock,
  ExternalLink,
  Star,
  Shield,
  Zap,
  BarChart3,
  Flag,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AFFILIATE_LINK = 'https://1wrlst.com/?open=register&p=c2f3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confBadge(c: string | null | undefined) {
  if (c === 'HIGH') return 'bg-emerald-500 text-white';
  if (c === 'MEDIUM') return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
}
function confLabel(c: string | null | undefined) {
  if (c === 'HIGH') return 'Alta';
  if (c === 'MEDIUM') return 'Média';
  return 'Baixa';
}
function confBar(c: string | null | undefined) {
  if (c === 'HIGH') return 'bg-emerald-500';
  if (c === 'MEDIUM') return 'bg-yellow-500';
  return 'bg-red-500';
}
function confBarWidth(c: string | null | undefined) {
  if (c === 'HIGH') return 'w-[85%]';
  if (c === 'MEDIUM') return 'w-[55%]';
  return 'w-[30%]';
}

function mainLabel(pred: string | null | undefined, home: string, away: string) {
  if (pred === 'HOME') return { text: `${home} vence`, short: '1', color: 'from-emerald-500 to-emerald-600' };
  if (pred === 'DRAW') return { text: 'Empate', short: 'X', color: 'from-yellow-500 to-yellow-600' };
  if (pred === 'AWAY') return { text: `${away} vence`, short: '2', color: 'from-blue-500 to-blue-600' };
  return { text: 'N/D', short: '?', color: 'from-gray-400 to-gray-500' };
}

function goalsLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  return pred
    .replace('OVER_', 'Over ')
    .replace('UNDER_', 'Under ')
    .replace(/_/g, '.')
    .replace(/(\d)\.(\d)$/, '$1.$2');
}

function cornersLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  return pred
    .replace('OVER_', 'Over ')
    .replace('UNDER_', 'Under ')
    .replace(/_/g, '.');
}

function cardsLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  return pred
    .replace('OVER_', 'Over ')
    .replace('UNDER_', 'Under ')
    .replace(/_/g, '.');
}

function doubleChanceLabel(dc: string | null | undefined, home: string, away: string) {
  if (dc === '1X') return `${home} ou Empate`;
  if (dc === 'X2') return `Empate ou ${away}`;
  if (dc === '12') return `${home} ou ${away}`;
  return 'N/D';
}

function halfTimeLabel(ht: string | null | undefined, home: string, away: string) {
  if (ht === 'HOME') return `${home} vence 1ºT`;
  if (ht === 'DRAW') return 'Empate no 1ºT';
  if (ht === 'AWAY') return `${away} vence 1ºT`;
  return 'N/D';
}

// ─── Componente de barra de probabilidade ─────────────────────────────────────

function ProbBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-bold text-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Card de palpite ──────────────────────────────────────────────────────────

function PredictionCard({ prediction }: { prediction: any }) {
  const [expanded, setExpanded] = useState(false);

  const home = prediction.homeTeamName || 'Time A';
  const away = prediction.awayTeamName || 'Time B';
  const main = mainLabel(prediction.mainPrediction, home, away);

  const matchDate = prediction.matchDate ? new Date(prediction.matchDate) : null;
  const dateStr = matchDate
    ? format(matchDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : 'Data não disponível';

  // Probabilidades (podem vir como campos extras ou estimadas pela confiança)
  const homePct = prediction.homeProbability ?? (prediction.mainPrediction === 'HOME' ? 55 : 25);
  const drawPct = prediction.drawProbability ?? 25;
  const awayPct = prediction.awayProbability ?? (prediction.mainPrediction === 'AWAY' ? 55 : 20);
  const goalsPct = prediction.goalsProbability ?? (prediction.goalsConfidence === 'HIGH' ? 75 : prediction.goalsConfidence === 'MEDIUM' ? 55 : 35);
  const btsPct = prediction.btsProbability ?? (prediction.bothTeamsToScoreConfidence === 'HIGH' ? 70 : 45);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header do card — times */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />
            {dateStr}
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Brasileirão
          </span>
        </div>

        {/* Times */}
        <div className="flex items-center justify-between gap-3">
          {/* Time da casa */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {prediction.homeTeamCrest ? (
              <img src={prediction.homeTeamCrest} alt={home} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Shield size={18} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-xs font-semibold text-center leading-tight">{home}</span>
          </div>

          {/* Placar provável */}
          <div className="flex flex-col items-center gap-1">
            <div className={`bg-gradient-to-br ${main.color} text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm`}>
              {prediction.likelyScore || 'VS'}
            </div>
            <span className="text-[10px] text-muted-foreground">placar provável</span>
          </div>

          {/* Time visitante */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            {prediction.awayTeamCrest ? (
              <img src={prediction.awayTeamCrest} alt={away} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Shield size={18} className="text-muted-foreground" />
              </div>
            )}
            <span className="text-xs font-semibold text-center leading-tight">{away}</span>
          </div>
        </div>
      </div>

      {/* Palpite principal */}
      <div className={`mx-4 mb-3 bg-gradient-to-r ${main.color} rounded-xl p-3 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Resultado</p>
            <p className="text-sm font-bold">{main.text}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xl font-black opacity-90">{main.short}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              prediction.mainConfidence === 'HIGH' ? 'bg-white/30' :
              prediction.mainConfidence === 'MEDIUM' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {confLabel(prediction.mainConfidence)} confiança
            </span>
          </div>
        </div>
      </div>

      {/* Barras de probabilidade 1X2 */}
      <div className="px-4 mb-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Probabilidades</p>
        <ProbBar label={home} pct={homePct} color="bg-emerald-500" />
        <ProbBar label="Empate" pct={drawPct} color="bg-yellow-500" />
        <ProbBar label={away} pct={awayPct} color="bg-blue-500" />
      </div>

      {/* Mercados em grid */}
      <div className="px-4 mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mercados</p>
        <div className="grid grid-cols-2 gap-2">

          {/* Gols */}
          <div className="bg-muted/60 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Gols</span>
            </div>
            <p className="text-xs font-bold text-foreground">{goalsLabel(prediction.goalsPrediction)}</p>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${confBar(prediction.goalsConfidence)} ${confBarWidth(prediction.goalsConfidence)}`} />
              </div>
              <span className="text-[10px] text-muted-foreground ml-2">{goalsPct}%</span>
            </div>
          </div>

          {/* Ambas marcam */}
          <div className="bg-muted/60 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={12} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Ambas marcam</span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {prediction.bothTeamsToScore === 'YES' ? 'BTTS Sim' : prediction.bothTeamsToScore === 'NO' ? 'BTTS Não' : 'N/D'}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${confBar(prediction.bothTeamsToScoreConfidence)} ${confBarWidth(prediction.bothTeamsToScoreConfidence)}`} />
              </div>
              <span className="text-[10px] text-muted-foreground ml-2">{btsPct}%</span>
            </div>
          </div>

          {/* Escanteios */}
          {prediction.cornersPrediction && (
            <div className="bg-muted/60 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Flag size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Escanteios</span>
              </div>
              <p className="text-xs font-bold text-foreground">{cornersLabel(prediction.cornersPrediction)}</p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${confBar(prediction.cornersConfidence)} ${confBarWidth(prediction.cornersConfidence)}`} />
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-2 ${confBadge(prediction.cornersConfidence)}`}>
                  {confLabel(prediction.cornersConfidence)}
                </span>
              </div>
            </div>
          )}

          {/* Cartões */}
          {prediction.cardsPrediction && (
            <div className="bg-muted/60 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Cartões</span>
              </div>
              <p className="text-xs font-bold text-foreground">{cardsLabel(prediction.cardsPrediction)}</p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${confBar(prediction.cardsConfidence)} ${confBarWidth(prediction.cardsConfidence)}`} />
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-2 ${confBadge(prediction.cardsConfidence)}`}>
                  {confLabel(prediction.cardsConfidence)}
                </span>
              </div>
            </div>
          )}

          {/* Dupla Chance */}
          {prediction.doubleChance && (
            <div className="bg-muted/60 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart3 size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">Dupla Chance</span>
              </div>
              <p className="text-xs font-bold text-foreground">{doubleChanceLabel(prediction.doubleChance, home, away)}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${confBadge(prediction.doubleChanceConfidence)}`}>
                {confLabel(prediction.doubleChanceConfidence)}
              </span>
            </div>
          )}

          {/* 1º Tempo */}
          {prediction.halfTimePrediction && (
            <div className="bg-muted/60 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">1º Tempo</span>
              </div>
              <p className="text-xs font-bold text-foreground">{halfTimeLabel(prediction.halfTimePrediction, home, away)}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${confBadge(prediction.halfTimeConfidence)}`}>
                {confLabel(prediction.halfTimeConfidence)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Melhor aposta do jogo */}
      {prediction.extraTip && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Melhor aposta do jogo</span>
          </div>
          <p className="text-xs font-semibold text-foreground">{prediction.extraTip}</p>
        </div>
      )}

      {/* Botão de afiliado */}
      <div className="px-4 mb-3">
        <a
          href={AFFILIATE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl py-3 px-4 transition-all duration-200 shadow-md hover:shadow-orange-300/40 dark:hover:shadow-orange-900/40"
        >
          <ExternalLink size={15} />
          <span>Faça sua aposta aqui</span>
          <span className="text-orange-200 text-xs font-normal hidden sm:inline">(casa recomendada)</span>
        </a>
      </div>

      {/* Análise expansível */}
      {prediction.justification && (
        <div className="border-t border-border/60">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-2.5 px-4"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} />
              Análise completa do Mestre
            </span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-muted-foreground leading-relaxed px-4 pb-4">
                  {prediction.justification}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Predictions() {
  const { data: predictions, isLoading, error, refetch } = trpc.football.predictions.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={32} className="text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="font-semibold text-foreground">IA analisando dados reais...</p>
          <p className="text-sm text-muted-foreground mt-1">Buscando palpites do Mestre</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={40} className="text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-foreground">Erro ao carregar palpites</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles size={48} className="text-primary" />
        </motion.div>
        <div className="text-center max-w-xs">
          <p className="font-bold text-lg text-foreground">Palpites em Breve</p>
          <p className="text-sm text-muted-foreground mt-2">
            O Mestre está analisando os próximos jogos do Brasileirão com dados reais.
            Os palpites são gerados automaticamente antes de cada rodada.
          </p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <RefreshCw size={11} />
            IA analisando dados reais...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Palpites do Mestre
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {predictions.length} palpite{predictions.length !== 1 ? 's' : ''} gerado{predictions.length !== 1 ? 's' : ''} com IA
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        {predictions.map((prediction: any) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}
