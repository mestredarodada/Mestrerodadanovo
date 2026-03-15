import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Trophy, TrendingUp, Brain, Share2, Copy, CheckCircle, Target, Zap, Shield, Timer, CornerDownRight, CreditCard, Star, ChevronDown } from 'lucide-react';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SITE_URL = 'https://www.mestredarodada.com.br';
const PLAYSTORE_LINK = 'https://play.google.com/store/apps/details?id=br.com.mestredarodada.app';
const AFFILIATE_LINK = 'https://lkxw.cc/b648211f';

function isAppWebView() {
  return typeof navigator !== 'undefined' && /MestreDaRodadaApp/i.test(navigator.userAgent);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrediction(val: string | null | undefined, home: string, away: string): string {
  if (!val) return 'N/D';
  if (val === 'HOME') return `Vitória ${home}`;
  if (val === 'AWAY') return `Vitória ${away}`;
  if (val === 'DRAW') return 'Empate';
  return val
    .replace('OVER_', 'Mais de ')
    .replace('UNDER_', 'Menos de ')
    .replace(/_/g, '.');
}

function formatCorners(val: string | null | undefined): string {
  if (!val) return 'N/D';
  return val
    .replace('OVER_', 'Mais de ')
    .replace('UNDER_', 'Menos de ')
    .replace(/_/g, '.')
    .replace(/escanteios?/i, '')
    .trim() + ' escanteios';
}

function formatCards(val: string | null | undefined): string {
  if (!val) return 'N/D';
  return val
    .replace('OVER_', 'Mais de ')
    .replace('UNDER_', 'Menos de ')
    .replace(/_/g, '.')
    .replace(/cart(ões|oes)/i, '')
    .trim() + ' cartões';
}

// ─── Badge de Acerto/Erro ───────────────────────────────────────────────────

function HitBadge({ hit, compact = false }: { hit: boolean | null; compact?: boolean }) {
  if (hit === null) return null;
  return hit ? (
    <span className={`inline-flex items-center gap-1 font-bold text-emerald-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      <CheckCircle2 size={compact ? 11 : 13} /> Acertou
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 font-medium text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      <XCircle size={compact ? 11 : 13} /> Errou
    </span>
  );
}

// ─── Linha de Mercado Verificável ───────────────────────────────────────────

function MarketRow({ icon, label, prediction, actual, hit }: {
  icon: React.ReactNode;
  label: string;
  prediction: string;
  actual?: string;
  hit: boolean | null;
}) {
  if (hit === null) return null;
  const isHit = hit === true;
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg mb-1.5 transition-all ${
      isHit 
        ? 'bg-emerald-500/10 border border-emerald-500/20' 
        : 'bg-slate-500/5 border border-transparent'
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={isHit ? 'text-emerald-500' : 'text-slate-400'}>{icon}</span>
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-wide ${isHit ? 'text-emerald-500/70' : 'text-muted-foreground/60'}`}>{label}</p>
          <p className={`text-sm font-semibold truncate ${isHit ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
            {prediction}
            {actual && <span className="text-[10px] text-muted-foreground/60 ml-1.5">({actual})</span>}
          </p>
        </div>
      </div>
      <HitBadge hit={hit} compact />
    </div>
  );
}

// ─── Linha de Mercado Informativo (sem verificação) ─────────────────────────

function InfoMarketRow({ icon, label, prediction }: {
  icon: React.ReactNode;
  label: string;
  prediction: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-500/5 mb-1.5">
      <span className="text-blue-400">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-blue-400/60">{label}</p>
        <p className="text-sm font-medium text-muted-foreground">{prediction}</p>
      </div>
    </div>
  );
}

// ─── Barra de Progresso de Acertos ──────────────────────────────────────────

function HitProgressBar({ hitCount, totalChecked }: { hitCount: number; totalChecked: number }) {
  const rate = totalChecked > 0 ? (hitCount / totalChecked) * 100 : 0;
  const color = rate >= 60 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-red-400';
  const bgColor = rate >= 60 ? 'bg-emerald-500/10' : rate >= 40 ? 'bg-amber-500/10' : 'bg-red-400/10';
  const textColor = rate >= 60 ? 'text-emerald-500' : rate >= 40 ? 'text-amber-500' : 'text-red-400';
  const label = rate >= 60 ? 'Boa análise' : rate >= 40 ? 'Análise parcial' : 'Pode melhorar';

  return (
    <div className={`rounded-xl px-3 py-2.5 mb-4 ${bgColor} border ${rate >= 60 ? 'border-emerald-500/20' : rate >= 40 ? 'border-amber-500/20' : 'border-red-400/20'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Brain size={14} className={textColor} />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <span className={`text-sm font-black ${textColor}`}>
          {hitCount} de {totalChecked} acertos
        </span>
      </div>
      <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ${color}`} 
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

// ─── Botões de Compartilhar ──────────────────────────────────────────────────

function AIShareButtons({ r, hitCount, totalChecked }: { r: any; hitCount: number; totalChecked: number }) {
  const home = r.homeTeamName;
  const away = r.awayTeamName;
  const compName = r.competitionName || '';

  const text = `⚽ *${home} ${r.actualHomeGoals} x ${r.actualAwayGoals} ${away}*${compName ? `\n🏆 ${compName}` : ''}\n\n🤖 Análise do Mestre da Rodada:\n📊 Resultado: ${formatPrediction(r.mainPrediction, home, away)} ${r.resultHit ? '✅' : '❌'}\n⚽ Gols: ${formatPrediction(r.goalsPrediction, home, away)} ${r.goalsHit === true ? '✅' : r.goalsHit === false ? '❌' : ''}\n🎯 Ambas marcam: ${r.bothTeamsToScore === 'YES' ? 'SIM' : 'NÃO'} ${r.bttsHit === true ? '✅' : r.bttsHit === false ? '❌' : ''}\n${r.doubleChance ? `🛡️ Dupla chance: ${r.doubleChance} ${r.doubleChanceHit === true ? '✅' : r.doubleChanceHit === false ? '❌' : ''}\n` : ''}${r.halfTimePrediction ? `⏱️ 1º Tempo: ${r.halfTimePrediction} ${r.halfTimeHit === true ? '✅' : r.halfTimeHit === false ? '❌' : ''}\n` : ''}${r.scoreHit ? `🎯 PLACAR EXATO: ${r.likelyScore} ✅🔥\n` : ''}\n📈 *${hitCount} de ${totalChecked} acertos*\n\n🎰 Odds incríveis — Cadastre-se:\n${AFFILIATE_LINK}\n\n📲 Baixe o app oficial:\n${PLAYSTORE_LINK}\n\n🌐 ${SITE_URL}`;

  const isApp = isAppWebView();
  const [copied, setCopied] = useState(false);

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

  if (isApp) {
    return (
      <div className="pt-3 mt-3 border-t border-border/40">
        <button
          onClick={handleCopyShare}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 ${
            copied
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle size={14} />
              Copiado! Cole no WhatsApp ou Telegram
            </>
          ) : (
            <>
              <Copy size={14} />
              Copiar resultado para compartilhar
            </>
          )}
        </button>
      </div>
    );
  }

  const encoded = encodeURIComponent(text);
  const urlEncoded = encodeURIComponent(SITE_URL);

  return (
    <div className="pt-3 mt-3 border-t border-border/40">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <Share2 size={10} />
        Compartilhar resultado
      </p>
      <div className="flex gap-2">
        <a
          href={`https://wa.me/?text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#25D366' }}
        >
          WhatsApp
        </a>
        <a
          href={`https://t.me/share/url?url=${urlEncoded}&text=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#229ED9' }}
        >
          Telegram
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${urlEncoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ backgroundColor: '#1877F2' }}
        >
          Facebook
        </a>
      </div>
    </div>
  );
}

// ─── Card de Resultado ────────────────────────────────────────────────────────

function AIResultCard({ r, index }: { r: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const rate = r.totalChecked > 0 ? (r.hitCount / r.totalChecked) * 100 : 0;
  const statusColor = rate >= 60 ? 'text-emerald-500' : rate >= 40 ? 'text-amber-500' : 'text-red-400';
  const statusLabel = rate >= 60 ? 'Boa análise' : rate >= 40 ? 'Análise parcial' : 'Pode melhorar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-border/60 overflow-hidden"
    >
      {/* Nome do campeonato no topo */}
      {r.competitionName && (
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-4 py-1.5 border-b border-border/30">
          <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
            {r.competitionName}
          </p>
        </div>
      )}

      {/* Header com placar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {r.homeTeamCrest ? (
              <img src={r.homeTeamCrest} alt={r.homeTeamName} className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold">
                {r.homeTeamName[0]}
              </div>
            )}
            <span className="text-white/40 text-sm font-bold">×</span>
            {r.awayTeamCrest ? (
              <img src={r.awayTeamCrest} alt={r.awayTeamName} className="w-7 h-7 object-contain" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold">
                {r.awayTeamName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">
              {r.homeTeamName} <span className="text-white/40">×</span> {r.awayTeamName}
            </p>
            <p className="text-white/50 text-[10px]">
              {format(new Date(r.matchDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="text-white font-black text-xl leading-none">
            {r.actualHomeGoals} <span className="text-white/40">-</span> {r.actualAwayGoals}
          </div>
          <p className="text-white/40 text-[9px] mt-0.5">Final</p>
        </div>
      </div>

      {/* Resumo compacto (sempre visível) */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={14} className={statusColor} />
            <span className="text-xs font-semibold text-foreground">{statusLabel}</span>
          </div>
          <span className={`text-sm font-black ${statusColor}`}>
            {r.hitCount} de {r.totalChecked} acertos
          </span>
        </div>

        {r.scoreHit && (
          <div className="mt-2 flex items-center gap-1.5 text-amber-500">
            <span className="text-sm">🎯</span>
            <span className="text-xs font-bold">Placar Exato! {r.likelyScore}</span>
          </div>
        )}

        {/* Melhor aposta (sempre visível) */}
        {r.bestBet && (
          <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">⭐ Melhor Aposta</p>
            <p className="text-xs text-foreground font-medium">{r.bestBet}</p>
          </div>
        )}
      </div>

      {/* Botão expandir/recolher */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all active:scale-[0.98] border-t border-border/40 hover:bg-muted/50"
      >
        <span className={expanded ? 'text-purple-500' : 'text-muted-foreground'}>
          {expanded ? 'Recolher análise' : 'Ver análise completa'}
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
            <div className="p-4 pt-2 border-t border-border/40">
              <HitProgressBar hitCount={r.hitCount} totalChecked={r.totalChecked} />

              {r.scoreHit && (
                <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 px-3 py-2.5 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">Placar Exato!</p>
                    <p className="text-sm text-foreground font-bold">{r.likelyScore} — Acertou em cheio!</p>
                  </div>
                </div>
              )}

              <div className="mb-2">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">Mercados analisados</p>
                
                <MarketRow
                  icon={<Target size={13} />}
                  label="Resultado"
                  prediction={formatPrediction(r.mainPrediction, r.homeTeamName, r.awayTeamName)}
                  actual={`${r.actualHomeGoals} x ${r.actualAwayGoals}`}
                  hit={r.resultHit}
                />

                {r.goalsPrediction && (
                  <MarketRow
                    icon={<TrendingUp size={13} />}
                    label="Gols"
                    prediction={formatPrediction(r.goalsPrediction, r.homeTeamName, r.awayTeamName) + ' gols'}
                    actual={`total: ${r.actualHomeGoals + r.actualAwayGoals}`}
                    hit={r.goalsHit}
                  />
                )}

                {r.bothTeamsToScore && (
                  <MarketRow
                    icon={<Zap size={13} />}
                    label="Ambas marcam"
                    prediction={r.bothTeamsToScore === 'YES' ? 'SIM' : 'NÃO'}
                    actual={r.actualHomeGoals > 0 && r.actualAwayGoals > 0 ? 'SIM' : 'NÃO'}
                    hit={r.bttsHit}
                  />
                )}

                {r.doubleChance && (
                  <MarketRow
                    icon={<Shield size={13} />}
                    label="Dupla chance"
                    prediction={r.doubleChance}
                    hit={r.doubleChanceHit}
                  />
                )}

                {r.halfTimePrediction && (
                  <MarketRow
                    icon={<Timer size={13} />}
                    label="1º Tempo"
                    prediction={r.halfTimePrediction}
                    actual={r.actualHalfTimeHome !== null ? `${r.actualHalfTimeHome} x ${r.actualHalfTimeAway}` : undefined}
                    hit={r.halfTimeHit}
                  />
                )}

                {r.likelyScore && !r.scoreHit && (
                  <MarketRow
                    icon={<Star size={13} />}
                    label="Placar previsto"
                    prediction={r.likelyScore}
                    actual={`${r.actualHomeGoals} x ${r.actualAwayGoals}`}
                    hit={r.scoreHit}
                  />
                )}
              </div>

              {(r.cornersPrediction || r.cardsPrediction) && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-blue-400/50 uppercase tracking-wider mb-2 mt-3">Previsões adicionais</p>
                  
                  {r.cornersPrediction && (
                    <InfoMarketRow
                      icon={<CornerDownRight size={13} />}
                      label="Escanteios"
                      prediction={formatCorners(r.cornersPrediction)}
                    />
                  )}

                  {r.cardsPrediction && (
                    <InfoMarketRow
                      icon={<CreditCard size={13} />}
                      label="Cartões"
                      prediction={formatCards(r.cardsPrediction)}
                    />
                  )}
                </div>
              )}

              <AIShareButtons r={r} hitCount={r.hitCount} totalChecked={r.totalChecked} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Resumo do Dia ──────────────────────────────────────────────────────────

function DaySummary({ results }: { results: any[] }) {
  const totalHits = results.reduce((acc: number, r: any) => acc + r.hitCount, 0);
  const totalChecked = results.reduce((acc: number, r: any) => acc + r.totalChecked, 0);
  const rate = totalChecked > 0 ? Math.round((totalHits / totalChecked) * 100) : 0;
  const totalGames = results.length;
  
  const resultHits = results.filter((r: any) => r.resultHit).length;
  const scoreHits = results.filter((r: any) => r.scoreHit === true).length;

  const color = rate >= 55 ? 'from-emerald-600 to-teal-600' : rate >= 40 ? 'from-amber-600 to-orange-600' : 'from-slate-600 to-slate-700';

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${color} p-4 mb-5 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={18} />
          <span className="font-bold text-sm">Desempenho da IA</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black">{totalHits}/{totalChecked}</span>
          <p className="text-[10px] text-white/70">acertos no período</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <p className="text-lg font-black">{totalGames}</p>
          <p className="text-[9px] text-white/70">Jogos</p>
        </div>
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <p className="text-lg font-black">{resultHits}</p>
          <p className="text-[9px] text-white/70">Resultados</p>
        </div>
        <div className="bg-white/10 rounded-lg py-1.5 px-2">
          <p className="text-lg font-black">{scoreHits}</p>
          <p className="text-[9px] text-white/70">Placares exatos</p>
        </div>
      </div>
    </div>
  );
}

// ─── Navegação Ontem / Hoje ─────────────────────────────────────────────────

type DayFilter = 'today' | 'yesterday';

function DaySelector({ selected, onSelect, todayCount, yesterdayCount }: {
  selected: DayFilter;
  onSelect: (day: DayFilter) => void;
  todayCount: number;
  yesterdayCount: number;
}) {
  return (
    <div className="flex gap-2 mb-5">
      <button
        onClick={() => onSelect('today')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
          selected === 'today'
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Resultados da IA hoje
        {todayCount > 0 && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            selected === 'today' ? 'bg-white/20' : 'bg-purple-500/10 text-purple-500'
          }`}>
            {todayCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onSelect('yesterday')}
        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
          selected === 'yesterday'
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Resultados da IA ontem
        {yesterdayCount > 0 && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            selected === 'yesterday' ? 'bg-white/20' : 'bg-violet-500/10 text-violet-500'
          }`}>
            {yesterdayCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Mensagem Sem Resultados ────────────────────────────────────────────────

function NoResultsMessage({ day }: { day: DayFilter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
        <Trophy size={28} className="text-white" />
      </div>
      <div className="text-center">
        <p className="font-poppins font-black text-lg text-foreground">
          {day === 'today' ? 'Sem resultados hoje' : 'Sem resultados ontem'}
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          {day === 'today'
            ? 'Quando os jogos de hoje com palpites do Mestre forem finalizados, os resultados aparecerão aqui.'
            : 'Não houve jogos finalizados com palpites do Mestre ontem.'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function AIResults() {
  const { data: results, isLoading, error } = trpc.football.aiResults.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  const [selectedDay, setSelectedDay] = useState<DayFilter>('today');

  // Filtrar resultados por dia (Hoje / Ontem)
  const { todayResults, yesterdayResults } = useMemo(() => {
    if (!results || results.length === 0) return { todayResults: [], yesterdayResults: [] };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const todayResults = results
      .filter((r: any) => {
        const matchDate = new Date(r.matchDate);
        return matchDate >= todayStart;
      })
      .sort((a: any, b: any) => {
        const rateA = a.totalChecked > 0 ? a.hitCount / a.totalChecked : 0;
        const rateB = b.totalChecked > 0 ? b.hitCount / b.totalChecked : 0;
        if (rateB !== rateA) return rateB - rateA;
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      });

    const yesterdayResults = results
      .filter((r: any) => {
        const matchDate = new Date(r.matchDate);
        return matchDate >= yesterdayStart && matchDate < todayStart;
      })
      .sort((a: any, b: any) => {
        const rateA = a.totalChecked > 0 ? a.hitCount / a.totalChecked : 0;
        const rateB = b.totalChecked > 0 ? b.hitCount / b.totalChecked : 0;
        if (rateB !== rateA) return rateB - rateA;
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
      });

    return { todayResults, yesterdayResults };
  }, [results]);

  const currentResults = selectedDay === 'today' ? todayResults : yesterdayResults;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando resultados da IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <XCircle size={40} className="text-red-400" />
        <p className="text-muted-foreground text-sm">Erro ao carregar resultados.</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
          <Trophy size={28} className="text-white" />
        </div>
        <div className="text-center">
          <p className="font-poppins font-black text-lg text-foreground">Aguardando jogos finalizados</p>
          <p className="text-muted-foreground text-sm mt-1">
            Quando os jogos com palpites do Mestre forem finalizados,<br />
            o resultado da análise aparecerá aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Seletor Ontem / Hoje */}
      <DaySelector
        selected={selectedDay}
        onSelect={setSelectedDay}
        todayCount={todayResults.length}
        yesterdayCount={yesterdayResults.length}
      />

      {/* Conteúdo do dia selecionado */}
      <AnimatePresence mode="wait">
        {currentResults.length > 0 ? (
          <motion.div
            key={`day-${selectedDay}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* DaySummary removido a pedido do usuário para focar nos resultados individuais */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentResults.map((r: any, i: number) => (
                <AIResultCard key={r.matchId} r={r} index={i} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`empty-${selectedDay}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <NoResultsMessage day={selectedDay} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
