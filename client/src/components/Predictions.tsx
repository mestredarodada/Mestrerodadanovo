import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shield,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Minus,
  Flag,
  CreditCard,
  Users,
  ExternalLink,
} from 'lucide-react';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Link de afiliado da casa de apostas parceira
const AFFILIATE_LINK = 'https://1wrlst.com/?open=register&p=c2f3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confColor(c: string | null | undefined) {
  if (c === 'HIGH') return 'text-emerald-600 dark:text-emerald-400';
  if (c === 'MEDIUM') return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}
function confBg(c: string | null | undefined) {
  if (c === 'HIGH') return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800';
  if (c === 'MEDIUM') return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800';
  return 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800';
}
function confLabel(c: string | null | undefined) {
  if (c === 'HIGH') return 'Alta confiança';
  if (c === 'MEDIUM') return 'Média confiança';
  return 'Baixa confiança';
}

function mainPredInfo(pred: string | null | undefined, homeName: string, awayName: string) {
  if (pred === 'HOME') return {
    label: `Vitória ${homeName}`,
    short: 'Vitória Mandante',
    Icon: CheckCircle2,
    gradient: 'from-emerald-500 to-emerald-600',
    barColor: 'bg-emerald-500',
  };
  if (pred === 'AWAY') return {
    label: `Vitória ${awayName}`,
    short: 'Vitória Visitante',
    Icon: TrendingUp,
    gradient: 'from-blue-500 to-blue-600',
    barColor: 'bg-blue-500',
  };
  return {
    label: 'Empate',
    short: 'Empate',
    Icon: Minus,
    gradient: 'from-yellow-500 to-yellow-600',
    barColor: 'bg-yellow-500',
  };
}

// Traduz os valores dos palpites para português
function translateGoals(pred: string | null | undefined) {
  if (pred === 'OVER_2_5') return 'Jogo Movimentado (acima de 2 gols)';
  if (pred === 'UNDER_2_5') return 'Jogo Fechado (até 2 gols)';
  return null;
}
function translateBts(pred: string | null | undefined) {
  if (pred === 'YES') return 'Ambas as equipes marcam';
  if (pred === 'NO') return 'Nem todas marcam';
  return null;
}
function translateCorners(pred: string | null | undefined) {
  if (pred === 'OVER_9') return 'Muitos escanteios (acima de 9)';
  if (pred === 'UNDER_9') return 'Poucos escanteios (até 9)';
  return null;
}
function translateCards(pred: string | null | undefined) {
  if (pred === 'OVER_4_5') return 'Jogo disputado (acima de 4 cartões)';
  if (pred === 'UNDER_4_5') return 'Jogo tranquilo (até 4 cartões)';
  return null;
}

// Barra de probabilidade visual
function ProbBar({ value, color }: { value?: number | null; color: string }) {
  const pct = Math.min(Math.max(value ?? 0, 0), 100);
  if (!pct) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PredictionSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-purple-400 to-pink-400" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-5 bg-muted rounded-full w-16" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-muted rounded-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
          <div className="w-16 h-16 bg-muted rounded-2xl" />
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-muted rounded-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        </div>
        <div className="h-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────

function PredictionCard({ prediction, index }: { prediction: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const mainPred = mainPredInfo(prediction.mainPrediction, prediction.homeTeamName, prediction.awayTeamName);
  const { Icon: MainIcon } = mainPred;

  let matchDate = '';
  try {
    if (prediction.matchDate) {
      matchDate = format(new Date(prediction.matchDate), "EEEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR });
      matchDate = matchDate.charAt(0).toUpperCase() + matchDate.slice(1);
    }
  } catch { matchDate = ''; }

  const secondaryTips = [
    translateGoals(prediction.goalsPrediction) && {
      label: translateGoals(prediction.goalsPrediction)!,
      confidence: prediction.goalsConfidence,
      probability: prediction.goalsProbability,
      icon: Target,
      barColor: 'bg-emerald-500',
    },
    translateBts(prediction.bothTeamsToScore) && {
      label: translateBts(prediction.bothTeamsToScore)!,
      confidence: prediction.bothTeamsToScoreConfidence,
      probability: prediction.btsProbability,
      icon: Users,
      barColor: 'bg-purple-500',
    },
    translateCorners(prediction.cornersPrediction) && {
      label: translateCorners(prediction.cornersPrediction)!,
      confidence: prediction.cornersConfidence,
      probability: null,
      icon: Flag,
      barColor: 'bg-orange-500',
    },
    translateCards(prediction.cardsPrediction) && {
      label: translateCards(prediction.cardsPrediction)!,
      confidence: prediction.cardsConfidence,
      probability: null,
      icon: CreditCard,
      barColor: 'bg-red-500',
    },
  ].filter(Boolean) as Array<{
    label: string;
    confidence: string | null;
    probability: number | null;
    icon: any;
    barColor: string;
  }>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Barra de cor no topo */}
      <div className={`h-1.5 bg-gradient-to-r ${mainPred.gradient}`} />

      <div className="p-5">
        {/* Header: data + badge IA */}
        <div className="flex items-center justify-between mb-4">
          {matchDate ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={11} />
              <span className="capitalize">{matchDate}</span>
            </div>
          ) : <div />}
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-full px-2.5 py-1">
            <Sparkles size={10} className="text-purple-500" />
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Análise IA</span>
          </div>
        </div>

        {/* Times + Palpite Principal */}
        <div className="flex items-center justify-between gap-3 mb-5">
          {/* Time da Casa */}
          <div className="flex-1 flex flex-col items-center gap-2 text-center">
            {prediction.homeTeamCrest ? (
              <img
                src={prediction.homeTeamCrest}
                alt={prediction.homeTeamName}
                className="w-14 h-14 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Shield size={22} className="text-muted-foreground" />
              </div>
            )}
            <p className="font-poppins font-bold text-xs text-foreground leading-tight max-w-[80px]">
              {prediction.homeTeamName}
            </p>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">Mandante</span>
          </div>

          {/* Palpite central */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mainPred.gradient} flex items-center justify-center shadow-lg`}>
              <MainIcon size={22} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-foreground leading-tight whitespace-nowrap">
                {mainPred.short}
              </p>
              <p className={`text-[9px] font-bold mt-0.5 ${confColor(prediction.mainConfidence)}`}>
                {confLabel(prediction.mainConfidence)}
              </p>
            </div>
          </div>

          {/* Time Visitante */}
          <div className="flex-1 flex flex-col items-center gap-2 text-center">
            {prediction.awayTeamCrest ? (
              <img
                src={prediction.awayTeamCrest}
                alt={prediction.awayTeamName}
                className="w-14 h-14 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Shield size={22} className="text-muted-foreground" />
              </div>
            )}
            <p className="font-poppins font-bold text-xs text-foreground leading-tight max-w-[80px]">
              {prediction.awayTeamName}
            </p>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">Visitante</span>
          </div>
        </div>

        {/* Palpite principal em destaque */}
        <div className={`rounded-xl border px-4 py-3 mb-4 ${confBg(prediction.mainConfidence)}`}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Palpite Principal</p>
          <p className="font-poppins font-black text-sm text-foreground">{mainPred.label}</p>
          {prediction.mainProbability && (
            <ProbBar value={prediction.mainProbability} color={mainPred.barColor} />
          )}
        </div>

        {/* Grid de dicas secundárias */}
        {secondaryTips.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {secondaryTips.map((tip, i) => {
              const TipIcon = tip.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5 border border-border/60"
                >
                  <div className="flex items-center gap-1.5">
                    <TipIcon size={12} className="text-muted-foreground shrink-0" />
                    <p className="text-[10px] font-semibold text-foreground leading-tight">{tip.label}</p>
                  </div>
                  <p className={`text-[9px] font-bold ${confColor(tip.confidence)}`}>
                    {confLabel(tip.confidence)}
                  </p>
                  {tip.probability && (
                    <ProbBar value={tip.probability} color={tip.barColor} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dica extra */}
        {prediction.extraTip && (
          <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 rounded-xl px-3 py-2.5 mb-4">
            <Zap size={13} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 mb-0.5">Dica do Mestre</p>
              <p className="text-[11px] text-orange-800 dark:text-orange-300 leading-snug">{prediction.extraTip}</p>
            </div>
          </div>
        )}

        {/* Botão de afiliado */}
        <a
          href={AFFILIATE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl py-3 px-4 transition-all duration-200 shadow-md hover:shadow-orange-300/40 dark:hover:shadow-orange-900/40 mb-3"
        >
          <ExternalLink size={15} />
          <span>Faça sua aposta aqui</span>
          <span className="text-orange-200 text-xs font-normal">(casa recomendada pelo Mestre)</span>
        </a>

        {/* Análise expansível */}
        {prediction.justification && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 border-t border-border/60 mt-1"
            >
              <span className="font-semibold flex items-center gap-1.5">
                <TrendingUp size={12} />
                Análise Completa
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 pb-1">
                    {prediction.justification}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/40 flex items-center justify-center">
          <Sparkles size={40} className="text-purple-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Clock size={14} className="text-white" />
        </div>
      </div>
      <h3 className="font-poppins font-black text-xl text-foreground mb-2">
        Palpites em Breve
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        O Mestre está analisando os próximos jogos do Brasileirão com dados reais. Os palpites são gerados automaticamente antes de cada rodada.
      </p>
      <div className="mt-6 flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">IA analisando dados reais...</span>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Predictions() {
  const { data: predictions, isLoading, error, refetch, isFetching } = trpc.football.predictions.useQuery(
    undefined,
    { retry: 2, staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <PredictionSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Erro ao carregar palpites</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Tentar novamente
        </button>
      </motion.div>
    );
  }

  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Contador + Atualizar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-semibold text-muted-foreground">
          {predictions.length} palpite{predictions.length !== 1 ? 's' : ''} disponível{predictions.length !== 1 ? 'is' : ''}
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {predictions.map((prediction: any, index: number) => (
            <PredictionCard
              key={prediction.id ?? prediction.matchId ?? index}
              prediction={prediction}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <Sparkles size={12} className="text-purple-400" />
        <span>Palpites gerados por IA com dados reais do Brasileirão Série A</span>
      </motion.div>
    </div>
  );
}
