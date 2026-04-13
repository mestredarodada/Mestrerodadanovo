import { useEffect, useState } from 'react';
import { analytics } from '@/hooks/useAnalytics';
import { useIsAppWebView, isAppWebView } from '@/hooks/useIsAppWebView';
import { useParams, Link } from 'wouter';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Target,
  TrendingUp,
  Shield,
  Star,
  Share2,
  ExternalLink,
  Brain,
  Trophy,
  Zap,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Prediction {
  id: number;
  matchId: string;
  slug: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCrest?: string;
  awayTeamCrest?: string;
  matchDate: string;
  mainPrediction: string;
  mainConfidence: string;
  mainProbability?: number;
  homeProbability?: number;
  drawProbability?: number;
  awayProbability?: number;
  goalsPrediction: string;
  goalsConfidence: string;
  goalsProbability?: number;
  bothTeamsToScore?: string;
  bothTeamsToScoreConfidence?: string;
  btsProbability?: number;
  cornersPrediction?: string;
  cornersConfidence?: string;
  cardsPrediction?: string;
  cardsConfidence?: string;
  doubleChance?: string;
  doubleChanceConfidence?: string;
  halfTimePrediction?: string;
  halfTimeConfidence?: string;
  likelyScore?: string;
  bestBet?: string;
  bestBetConfidence?: string;
  extraTip?: string;
  extraConfidence?: string;
  justification: string;
  matchday?: number;
  createdAt: string;
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function translatePrediction(pred: string): string {
  const map: Record<string, string> = {
    HOME: 'Vitória do Mandante',
    DRAW: 'Empate',
    AWAY: 'Vitória do Visitante',
    OVER_2_5: 'Mais de 2.5 Gols',
    UNDER_2_5: 'Menos de 2.5 Gols',
    OVER_1_5: 'Mais de 1.5 Gols',
    UNDER_1_5: 'Menos de 1.5 Gols',
    OVER_3_5: 'Mais de 3.5 Gols',
    YES: 'Sim',
    NO: 'Não',
    OVER_9: 'Mais de 9 Escanteios',
    UNDER_9: 'Menos de 9 Escanteios',
    OVER_4_5: 'Mais de 4.5 Cartões',
    UNDER_4_5: 'Menos de 4.5 Cartões',
    HIGH: 'Alta',
    MEDIUM: 'Média',
    LOW: 'Baixa',
  };
  return map[pred] || pred;
}

function confidenceColor(conf: string): string {
  if (conf === 'HIGH') return 'text-emerald-400';
  if (conf === 'MEDIUM') return 'text-amber-400';
  return 'text-red-400';
}

function confidenceBg(conf: string): string {
  if (conf === 'HIGH') return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  if (conf === 'MEDIUM') return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
  return 'bg-red-500/20 border-red-500/30 text-red-300';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Componente de Barra de Probabilidade ─────────────────────────────────────
function ProbBar({ label, value, color }: { label: string; value?: number; color: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-bold text-white">{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PalpitePage() {
  const { slug } = useParams<{ slug: string }>();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isApp = useIsAppWebView();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/predictions/by-slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setPrediction(data);
        setLoading(false);
        // Atualiza meta tags dinamicamente
        updateMetaTags(data);
        // Injeta Schema.org
        injectSchema(data);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  function updateMetaTags(p: Prediction) {
    const title = `Palpite IA: ${p.homeTeamName} x ${p.awayTeamName} — Mestre da Rodada`;
    const desc = `Palpite gerado por Inteligência Artificial para ${p.homeTeamName} x ${p.awayTeamName}. Previsão: ${translatePrediction(p.mainPrediction)}. ${p.likelyScore ? `Placar provável: ${p.likelyScore}.` : ''} Acesse grátis em mestredarodada.com.br`;
    const url = `https://www.mestredarodada.com.br/palpite/${slug}`;
    const image = 'https://www.mestredarodada.com.br/og-image.png';

    document.title = title;
    setMeta('description', desc);
    setMeta('og:title', title, true);
    setMeta('og:description', desc, true);
    setMeta('og:url', url, true);
    setMeta('og:image', image, true);
    setMeta('twitter:title', title, true);
    setMeta('twitter:description', desc, true);
    setMeta('twitter:image', image, true);
    setCanonical(url);
  }

  function setMeta(name: string, content: string, isProperty = false) {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setCanonical(url: string) {
    let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', url);
  }

  function injectSchema(p: Prediction) {
    const existing = document.getElementById('schema-prediction');
    if (existing) existing.remove();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Palpite IA: ${p.homeTeamName} x ${p.awayTeamName}`,
      description: `Palpite gerado por Inteligência Artificial para ${p.homeTeamName} x ${p.awayTeamName}. Previsão: ${translatePrediction(p.mainPrediction)}.`,
      url: `https://www.mestredarodada.com.br/palpite/${slug}`,
      image: 'https://www.mestredarodada.com.br/og-image.png',
      datePublished: p.createdAt,
      dateModified: p.createdAt,
      author: { '@type': 'Organization', name: 'Mestre da Rodada', url: 'https://www.mestredarodada.com.br' },
      publisher: {
        '@type': 'Organization',
        name: 'Mestre da Rodada',
        logo: { '@type': 'ImageObject', url: 'https://www.mestredarodada.com.br/logo.png' },
      },
      about: {
        '@type': 'SportsEvent',
        name: `${p.homeTeamName} x ${p.awayTeamName}`,
        startDate: p.matchDate,
        sport: 'Soccer',
        homeTeam: { '@type': 'SportsTeam', name: p.homeTeamName },
        awayTeam: { '@type': 'SportsTeam', name: p.awayTeamName },
        location: { '@type': 'Place', name: 'Brasil', addressCountry: 'BR' },
      },
    };

    const script = document.createElement('script');
    script.id = 'schema-prediction';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // Texto de compartilhamento
  function getShareText(p: Prediction): string {
    const affiliateBlock = `\n\n🏆 Casa recomendada para apostar com as melhores Odds:\nhttps://go.aff.br4-partners.com/hxfcxr0x`;
    return `🤖 *Palpite do Mestre da Rodada*\n\n⚽ ${p.homeTeamName} x ${p.awayTeamName}\n📊 Resultado: *${translatePrediction(p.mainPrediction)}*${p.likelyScore ? ` (${p.likelyScore})` : ''}\n⚽ Gols: ${translatePrediction(p.goalsPrediction)}\n🎯 Ambas marcam: ${p.bothTeamsToScore === 'YES' ? 'SIM' : 'NÃO'}${p.bestBet ? `\n⭐ Melhor aposta: ${p.bestBet}` : ''}${affiliateBlock}\n\n🔗 Mais palpites grátis por IA:\nwww.mestredarodada.com.br — Palpites feitos por inteligência artificial 100% grátis para você.`;
  }

  function shareWhatsApp(p: Prediction) {
    analytics.trackWhatsAppShare(window.location.pathname, `${p.homeTeamName} x ${p.awayTeamName}`);
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText(p))}`, '_blank');
  }

  function shareTelegram(p: Prediction) {
    analytics.trackTelegramShare(window.location.pathname, `${p.homeTeamName} x ${p.awayTeamName}`);
    const url = `https://www.mestredarodada.com.br/palpite/${slug}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(getShareText(p))}`, '_blank');
  }

  function shareFacebook() {
    analytics.trackFacebookShare(window.location.pathname);
    const url = `https://www.mestredarodada.com.br/palpite/${slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }

  // ─── Estados de Loading / Erro ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400">Carregando palpite da IA...</p>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-400 text-lg">Palpite não encontrado.</p>
          <Link href="/">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold">
              Ver todos os palpites
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const p = prediction;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Palpites
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mestre da Rodada" className="w-7 h-7 object-contain" />
            <span className="text-sm font-bold text-white hidden sm:block">Mestre da Rodada</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Badge Brasileirão ── */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full px-3 py-1 text-xs font-semibold text-purple-300">
            <Trophy className="w-3 h-3" />
            Brasileirão Série A 2026{p.matchday ? ` — Rodada ${p.matchday}` : ''}
          </div>
          <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-semibold text-emerald-400">
            <Brain className="w-3 h-3" />
            Gerado por IA
          </div>
        </div>

        {/* ── Card Principal do Jogo ── */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-600 to-pink-600" />
          <div className="p-6">
            {/* Times */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Mandante */}
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                {p.homeTeamCrest ? (
                  <img src={p.homeTeamCrest} alt={p.homeTeamName} className="w-16 h-16 object-contain drop-shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black">
                    {p.homeTeamName[0]}
                  </div>
                )}
                <span className="font-bold text-sm text-white leading-tight">{p.homeTeamName}</span>
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Mandante</span>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-white/20">VS</span>
                {p.likelyScore && (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-4 py-2 text-center">
                    <p className="text-[10px] text-white/70 font-medium">Placar Provável</p>
                    <p className="text-xl font-black text-white">{p.likelyScore}</p>
                  </div>
                )}
              </div>

              {/* Visitante */}
              <div className="flex flex-col items-center gap-2 flex-1 text-center">
                {p.awayTeamCrest ? (
                  <img src={p.awayTeamCrest} alt={p.awayTeamName} className="w-16 h-16 object-contain drop-shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-2xl font-black">
                    {p.awayTeamName[0]}
                  </div>
                )}
                <span className="font-bold text-sm text-white leading-tight">{p.awayTeamName}</span>
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Visitante</span>
              </div>
            </div>

            {/* Data */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6 pb-6 border-b border-white/10">
              <Calendar className="w-3 h-3" />
              {formatDate(p.matchDate)}
            </div>

            {/* Probabilidades */}
            {(p.homeProbability || p.drawProbability || p.awayProbability) && (
              <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Probabilidades da IA</p>
                <ProbBar label={p.homeTeamName} value={p.homeProbability} color="bg-gradient-to-r from-purple-500 to-purple-600" />
                <ProbBar label="Empate" value={p.drawProbability} color="bg-gradient-to-r from-slate-500 to-slate-600" />
                <ProbBar label={p.awayTeamName} value={p.awayProbability} color="bg-gradient-to-r from-blue-500 to-blue-600" />
              </div>
            )}

            {/* Palpite Principal */}
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Resultado Previsto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">{translatePrediction(p.mainPrediction)}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${confidenceBg(p.mainConfidence)}`}>
                  Confiança {translatePrediction(p.mainConfidence)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grid de Mercados ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Gols */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gols</span>
            </div>
            <p className="font-bold text-white text-sm">{translatePrediction(p.goalsPrediction)}</p>
            <p className={`text-[10px] mt-1 font-semibold ${confidenceColor(p.goalsConfidence)}`}>
              {translatePrediction(p.goalsConfidence)} confiança
            </p>
          </div>

          {/* Ambas Marcam */}
          {p.bothTeamsToScore && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ambas Marcam</span>
              </div>
              <p className="font-bold text-white text-sm">{translatePrediction(p.bothTeamsToScore)}</p>
              {p.bothTeamsToScoreConfidence && (
                <p className={`text-[10px] mt-1 font-semibold ${confidenceColor(p.bothTeamsToScoreConfidence)}`}>
                  {translatePrediction(p.bothTeamsToScoreConfidence)} confiança
                </p>
              )}
            </div>
          )}

          {/* Escanteios */}
          {p.cornersPrediction && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Escanteios</span>
              </div>
              <p className="font-bold text-white text-sm">{translatePrediction(p.cornersPrediction)}</p>
              {p.cornersConfidence && (
                <p className={`text-[10px] mt-1 font-semibold ${confidenceColor(p.cornersConfidence)}`}>
                  {translatePrediction(p.cornersConfidence)} confiança
                </p>
              )}
            </div>
          )}

          {/* Cartões */}
          {p.cardsPrediction && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cartões</span>
              </div>
              <p className="font-bold text-white text-sm">{translatePrediction(p.cardsPrediction)}</p>
              {p.cardsConfidence && (
                <p className={`text-[10px] mt-1 font-semibold ${confidenceColor(p.cardsConfidence)}`}>
                  {translatePrediction(p.cardsConfidence)} confiança
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Melhor Aposta ── */}
        {p.bestBet && (
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-black text-amber-300 uppercase tracking-wider">Melhor Aposta do Jogo</span>
            </div>
            <p className="text-white font-bold text-lg leading-tight">{p.bestBet}</p>
            {p.bestBetConfidence && (
              <p className={`text-sm mt-2 font-semibold ${confidenceColor(p.bestBetConfidence)}`}>
                Confiança {translatePrediction(p.bestBetConfidence)}
              </p>
            )}
          </div>
        )}

        {/* ── Justificativa ── */}
        {p.justification && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-slate-300">Análise da IA</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{p.justification}</p>
          </div>
        )}

        {/* ── Casa de Apostas ── */}
        <a
          href="https://go.aff.br4-partners.com/hxfcxr0x"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => analytics.trackAffiliateClick(window.location.pathname, `${p.homeTeamName} x ${p.awayTeamName}`)}
          className="block bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-5 hover:border-green-500/60 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-400 font-semibold mb-1">🏆 Casa Recomendada</p>
              <p className="text-white font-bold">Aposte com as melhores Odds</p>
              <p className="text-slate-400 text-xs mt-1">Cadastre-se e aproveite os bônus de boas-vindas</p>
            </div>
            <ExternalLink className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
          </div>
        </a>

        {/* ── Botões de Compartilhar ── */}
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-300">Compartilhar este palpite</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => shareWhatsApp(p)}
              className="flex items-center justify-center gap-2 bg-[#25D366]/20 border border-[#25D366]/30 hover:bg-[#25D366]/30 text-[#25D366] font-bold py-3 rounded-xl text-sm transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={() => shareTelegram(p)}
              className="flex items-center justify-center gap-2 bg-[#229ED9]/20 border border-[#229ED9]/30 hover:bg-[#229ED9]/30 text-[#229ED9] font-bold py-3 rounded-xl text-sm transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </button>
            <button
              onClick={shareFacebook}
              className="flex items-center justify-center gap-2 bg-[#1877F2]/20 border border-[#1877F2]/30 hover:bg-[#1877F2]/30 text-[#1877F2] font-bold py-3 rounded-xl text-sm transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
        </div>

        {/* ── CTA Ver Mais Palpites ── */}
        <div className="text-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-6">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <h2 className="text-lg font-black mb-2">Quer mais palpites grátis?</h2>
          <p className="text-slate-400 text-sm mb-4">Todos os jogos do Brasileirão 2026 com análise completa da IA.</p>
          <Link href="/">
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4" />
              Ver todos os palpites
            </button>
          </Link>
        </div>

        {/* ── Aviso Legal ── */}
        <p className="text-center text-[10px] text-slate-600 pb-4">
          Os palpites são gerados por Inteligência Artificial e têm caráter exclusivamente informativo. Aposte com responsabilidade. +18.{' '}
          <Link href="/jogue-com-responsabilidade"><span className="underline cursor-pointer">Saiba mais</span></Link>
        </p>
      </div>
    </div>
  );
}
