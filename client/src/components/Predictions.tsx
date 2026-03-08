import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
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
  Flag,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AFFILIATE_LINK = 'https://1wrlst.com/?open=register&p=c2f3';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mainLabel(pred: string | null | undefined, home: string, away: string) {
  if (pred === 'HOME') return { text: `${home} vence`, short: '1', color: 'from-emerald-500 to-emerald-600' };
  if (pred === 'DRAW') return { text: 'Empate', short: 'X', color: 'from-yellow-500 to-yellow-600' };
  if (pred === 'AWAY') return { text: `${away} vence`, short: '2', color: 'from-blue-500 to-blue-600' };
  return { text: 'N/D', short: '?', color: 'from-gray-400 to-gray-500' };
}

function translateLine(pred: string | null | undefined): string {
  if (!pred) return 'N/D';
  const num = pred.replace('OVER_', '').replace('UNDER_', '').replace(/_/g, '.');
  if (pred.startsWith('OVER_')) return `Mais de ${num}`;
  if (pred.startsWith('UNDER_')) return `Menos de ${num}`;
  return pred;
}

function goalsLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  const num = pred.replace('OVER_', '').replace('UNDER_', '').replace(/_/g, '.');
  if (pred.startsWith('OVER_')) return `Mais de ${num} gols`;
  if (pred.startsWith('UNDER_')) return `Menos de ${num} gols`;
  return pred;
}

function cornersLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  const num = pred.replace('OVER_', '').replace('UNDER_', '').replace(/_/g, '.');
  if (pred.startsWith('OVER_')) return `Mais de ${num} escanteios`;
  if (pred.startsWith('UNDER_')) return `Menos de ${num} escanteios`;
  return pred;
}

function cardsLabel(pred: string | null | undefined) {
  if (!pred) return 'N/D';
  const num = pred.replace('OVER_', '').replace('UNDER_', '').replace(/_/g, '.');
  if (pred.startsWith('OVER_')) return `Mais de ${num} cartões`;
  if (pred.startsWith('UNDER_')) return `Menos de ${num} cartões`;
  return pred;
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

// ─── Item de mercado ──────────────────────────────────────────────────────────

function MarketItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xs font-bold text-foreground leading-snug">{value}</p>
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

  const btsValue = prediction.bothTeamsToScore === 'YES'
    ? 'Ambas marcam: SIM'
    : prediction.bothTeamsToScore === 'NO'
    ? 'Ambas marcam: NÃO'
    : 'N/D';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header — data e competição */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />
            {dateStr}
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {prediction.matchday ? `Rodada ${prediction.matchday}` : 'Brasileirão'}
          </span>
        </div>

        {/* Times */}
        <div className="flex items-center justify-between gap-3">
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

          {/* Placar provável no centro */}
          <div className="flex flex-col items-center gap-1">
            <div className={`bg-gradient-to-br ${main.color} text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-sm min-w-[52px] text-center`}>
              {prediction.likelyScore || 'VS'}
            </div>
            <span className="text-[10px] text-muted-foreground">placar provável</span>
          </div>

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

      {/* Palpite principal — banner colorido */}
      <div className={`mx-4 mb-3 bg-gradient-to-r ${main.color} rounded-xl p-3 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Resultado</p>
            <p className="text-sm font-bold">{main.text}</p>
          </div>
          <span className="text-2xl font-black opacity-90">{main.short}</span>
        </div>
      </div>

      {/* Grid de mercados — sem % e sem termômetros */}
      <div className="px-4 mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mercados</p>
        <div className="grid grid-cols-2 gap-2">

          <MarketItem
            icon={<TrendingUp size={12} />}
            label="Gols"
            value={goalsLabel(prediction.goalsPrediction)}
          />

          <MarketItem
            icon={<Target size={12} />}
            label="Ambas marcam"
            value={btsValue}
          />

          {prediction.cornersPrediction && (
            <MarketItem
              icon={<Flag size={12} />}
              label="Escanteios"
              value={cornersLabel(prediction.cornersPrediction)}
            />
          )}

          {prediction.cardsPrediction && (
            <MarketItem
              icon={<CreditCard size={12} />}
              label="Cartões"
              value={cardsLabel(prediction.cardsPrediction)}
            />
          )}

          {prediction.doubleChance && (
            <MarketItem
              icon={<BarChart3 size={12} />}
              label="Dupla Chance"
              value={doubleChanceLabel(prediction.doubleChance, home, away)}
            />
          )}

          {prediction.halfTimePrediction && (
            <MarketItem
              icon={<Zap size={12} />}
              label="1º Tempo"
              value={halfTimeLabel(prediction.halfTimePrediction, home, away)}
            />
          )}

        </div>
      </div>

      {/* Melhor aposta do jogo */}
      {prediction.extraTip && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Melhor aposta do jogo
            </span>
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
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  // Hooks DEVEM vir antes de qualquer return condicional (regra dos Hooks do React)
  const grouped = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    const map = new Map<number | string, any[]>();
    for (const p of predictions) {
      const key = p.matchday ?? 0;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => Number(b) - Number(a));
  }, [predictions]);

  const latestRound = grouped[0]?.[0] ?? 0;
  const [selectedRound, setSelectedRound] = useState<number | string>(latestRound);

  const currentPredictions = useMemo(() => {
    return grouped.find(([r]) => r === selectedRound)?.[1] ?? [];
  }, [grouped, selectedRound]);

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

      {/* Submenu de rodadas */}
      {grouped.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {grouped.map(([round, preds]) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedRound === round
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {Number(round) > 0 ? `Rodada ${round}` : 'Sem rodada'}
              <span className="ml-1.5 opacity-70">({preds.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Cards da rodada selecionada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(selectedRound)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-4"
        >
          {currentPredictions.map((prediction: any) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
