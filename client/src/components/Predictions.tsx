import { trpc } from '@/lib/trpc';

import { analytics } from '@/hooks/useAnalytics';
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
  Copy,
  CheckCircle,
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AFFILIATE_LINK = 'https://go.aff.br4-partners.com/hxfcxr0x'; // Updated to BR4BET - Force Cache Clear



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

  const PLAYSTORE_LINK = 'https://play.google.com/store/apps/details?id=br.com.mestredarodada.app';

  const affiliateBlock = `\n\n🎰 Odds incríveis — Cadastre-se:\n${AFFILIATE_LINK}`;
  const text = `⚽ *${home} x ${away}*\n\n🤖 Palpite do Mestre da Rodada\n📊 *${main.text}*${score}${goals}${bts}${extra}${affiliateBlock}\n\n📲 Baixe o app oficial:\n${PLAYSTORE_LINK}\n\n🌐 ${SITE_URL}`;

  const [copied, setCopied] = useState(false);

  // No app, copia texto para área de transferência
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Palpite: ${home} x ${away}`,
          text: text,
          url: SITE_URL
        });
        analytics.trackShare(window.location.pathname, `${home} x ${away}`, 'native');
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
        handleCopyShare();
      }
    } else {
      handleCopyShare();
    }
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="px-4 pb-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <Share2 size={10} />
        Compartilhar palpite
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:scale-95 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-200 shadow-md"
        >
          <Share2 size={14} />
          <span>{copied ? 'Copiado!' : 'Compartilhar Palpite'}</span>
        </button>
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
    ? matchDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
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
            {prediction.competitionName || (prediction.matchday ? `Rodada ${prediction.matchday}` : 'Liga')}
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

      {/* Botão expandir/recolher detalhes */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all active:scale-[0.98] border-t border-border/40 hover:bg-muted/50"
      >
        <span className={expanded ? 'text-purple-500' : 'text-muted-foreground'}>
          {expanded ? 'Recolher detalhes' : 'Ver todos os mercados'}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${expanded ? 'rotate-180 text-purple-500' : 'text-muted-foreground'}`}
        />
      </button>

      {/* Conteúdo expansível */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40">
              {/* Grid de mercados */}
              <div className="px-4 pt-3 mb-3">
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
                  onClick={() => analytics.trackAffiliateClick(window.location.pathname, `${prediction.homeTeamName} x ${prediction.awayTeamName}`)}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl py-3 px-4 transition-all duration-200 shadow-md hover:shadow-orange-300/40 dark:hover:shadow-orange-900/40"
                >
                  <ExternalLink size={15} />
                  <span>Faça sua aposta aqui</span>
                  <span className="text-orange-200 text-xs font-normal hidden sm:inline">(casa recomendada)</span>
                </a>
              </div>


              {/* Botões de compartilhamento */}
              <ShareButtons prediction={prediction} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Predictions() {
  const { data: predictions, isLoading, error, refetch } = trpc.football.predictions.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');

  // Filtra e ordena palpites por Hoje, Amanhã ou Próximos
  const todayPredictions = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    return [...predictions]
      .filter((p: any) => p.matchDate && isToday(new Date(p.matchDate)))
      .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [predictions]);

  const tomorrowPredictions = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    return [...predictions]
      .filter((p: any) => p.matchDate && isTomorrow(new Date(p.matchDate)))
      .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [predictions]);

  const upcomingPredictions = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    return [...predictions]
      .filter((p: any) => p.matchDate && !isToday(new Date(p.matchDate)) && !isTomorrow(new Date(p.matchDate)) && new Date(p.matchDate) > new Date())
      .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [predictions]);

  const activePredictions = 
    activeTab === 'today' ? todayPredictions : 
    activeTab === 'tomorrow' ? tomorrowPredictions : 
    upcomingPredictions;

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
          <p className="font-bold text-lg text-foreground">Aguardando Próximos Jogos</p>
          <p className="text-sm text-muted-foreground mt-2">
            O Mestre está monitorando as principais ligas (Brasileirão, Premier League, La Liga, Champions e mais). 
            Assim que a próxima rodada começar, os palpites aparecerão aqui automaticamente!
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

      {/* Sub-menu Hoje / Amanhã */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'today'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
          }`}
        >
          <Clock size={14} />
          Hoje
          {todayPredictions.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {todayPredictions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'tomorrow'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
          }`}
        >
          <Star size={14} />
          Amanhã
          {tomorrowPredictions.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'tomorrow' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {tomorrowPredictions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
          }`}
        >
          <TrendingUp size={14} />
          Próximos
          {upcomingPredictions.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {upcomingPredictions.length}
            </span>
          )}
        </button>
      </div>

      {/* Cards de palpites filtrados */}
      {activePredictions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {activePredictions.map((prediction: any) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Clock size={36} className="text-muted-foreground/50" />
          <div className="text-center">
            <p className="font-semibold text-foreground text-sm">
              {activeTab === 'today' ? 'Sem jogos de elite hoje' : activeTab === 'tomorrow' ? 'Sem jogos de elite amanhã' : 'Sem jogos futuros agendados'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'today'
                ? 'Não há jogos das principais ligas agendados para hoje. O Mestre volta na próxima rodada!'
                : activeTab === 'tomorrow'
                ? 'Aguardando a confirmação dos jogos das principais ligas para amanhã.'
                : 'O Mestre está monitorando o calendário para as próximas rodadas.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
