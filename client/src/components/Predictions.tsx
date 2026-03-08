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
  Share2,
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

// ─── Botões de compartilhamento ──────────────────────────────────────────────

const SITE_URL = 'https://www.mestredarodada.com.br';

function ShareButtons({ prediction }: { prediction: any }) {
  const home = prediction.homeTeamName || 'Time A';
  const away = prediction.awayTeamName || 'Time B';
  const main = mainLabel(prediction.mainPrediction, home, away);
  const score = prediction.likelyScore ? ` (${prediction.likelyScore})` : '';
  const goals = prediction.goalsPrediction ? `\n⚽ Gols: ${goalsLabel(prediction.goalsPrediction)}` : '';
  const bts = prediction.bothTeamsToScore === 'YES' ? '\n🎯 Ambas marcam: SIM' : prediction.bothTeamsToScore === 'NO' ? '\n🎯 Ambas marcam: NÃO' : '';
  const extra = prediction.extraTip ? `\n⭐ Melhor aposta: ${prediction.extraTip}` : '';

  const text = `🤖 *Palpite do Mestre da Rodada*\n\n⚽ ${home} x ${away}\n📊 Resultado: *${main.text}*${score}${goals}${bts}${extra}\n\n🏆 Casa recomendada para apostar com as melhores Odds:\n${AFFILIATE_LINK}\n\n🔗 Mais palpites grátis por IA:\n${SITE_URL} \u2014 Palpites feitos por intelig\u00eancia artificial 100% gr\u00e1tis para voc\u00ea.`;

  const encoded = encodeURIComponent(text);
  const urlEncoded = encodeURIComponent(SITE_URL);

  const whatsappUrl = `https://wa.me/?text=${encoded}`;
  const telegramUrl = `https://t.me/share/url?url=${urlEncoded}&text=${encoded}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`;

  return (
    <div className="px-4 pb-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <Share2 size={10} />
        Compartilhar palpite
      </p>
      <div className="flex gap-2">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
          title="Compartilhar no WhatsApp"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>

        {/* Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#229ED9' }}
          title="Compartilhar no Telegram"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1877F2' }}
          title="Compartilhar no Facebook"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </a>
      </div>
    </div>
  );
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

      {/* Botões de compartilhamento */}
      <ShareButtons prediction={prediction} />

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
    // Ordena em ordem CRESCENTE: rodada menor (em andamento) primeiro
    return Array.from(map.entries()).sort(([a], [b]) => Number(a) - Number(b));
  }, [predictions]);

  // Rodada mais baixa = rodada em andamento (menor número = mais próxima)
  // grouped já está ordenado crescente, então o primeiro item é a rodada mais próxima
  const firstRoundKey = grouped[0]?.[0] ?? 0;
  const rounds = grouped.map(([r]) => Number(r)).filter(r => r > 0).sort((a, b) => a - b);
  const minRound = rounds[0] ?? 0;
  const [selectedRound, setSelectedRound] = useState<number | string>(firstRoundKey);

  // Sincroniza a seleção quando os dados carregam (caso o estado inicial seja 0)
  const effectiveRound = grouped.find(([r]) => r === selectedRound) ? selectedRound : firstRoundKey;

  const currentPredictions = useMemo(() => {
    return grouped.find(([r]) => r === effectiveRound)?.[1] ?? [];
  }, [grouped, effectiveRound]);

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
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {grouped.map(([round, preds]) => {
          const roundNum = Number(round);
          const isMin = roundNum === minRound && minRound > 0;
          const label = roundNum === 0
            ? 'Sem rodada'
            : isMin
              ? '🟢 Rodada em Andamento'
              : `📅 Próximas Rodadas`;
          const isSelected = effectiveRound === round;
          return (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                isSelected
                  ? isMin
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30'
                    : 'bg-primary text-primary-foreground border-primary shadow-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
              }`}
            >
              {label}
              <span className={`ml-2 text-xs font-normal ${
                isSelected ? 'opacity-80' : 'opacity-50'
              }`}>({preds.length})</span>
            </button>
          );
        })}
      </div>

      {/* Cards da rodada selecionada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(effectiveRound)}
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
