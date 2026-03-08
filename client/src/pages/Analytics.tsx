import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Eye, Users, MousePointerClick, TrendingUp, Smartphone, Monitor, Tablet, Clock, RefreshCw, Lock, Activity } from 'lucide-react';

interface DashboardData {
  period: string;
  summary: {
    totalPageviews: number;
    uniqueVisitors: number;
    affiliateClicks: number;
    todayViews: number;
    todayUniqueVisitors: number;
    todayAffiliateClicks: number;
  };
  shareClicks: Record<string, number>;
  topPages: Array<{ page: string; views: number; uniqueViews: number }>;
  pageviewsByDay: Array<{ day: string; views: number; uniqueVisitors: number }>;
  deviceStats: Array<{ deviceType: string; count: number }>;
  realtimeEvents: Array<{ eventType: string; page: string; label: string; deviceType: string; createdAt: string }>;
}

interface RealtimeData {
  activeVisitors: number;
  lastHourViews: number;
  recentEvents: Array<{ eventType: string; page: string; label: string; deviceType: string; createdAt: string }>;
}

const DEVICE_COLORS = { mobile: '#a855f7', desktop: '#3b82f6', tablet: '#10b981' };
const EVENT_LABELS: Record<string, string> = {
  pageview: '📄 Pageview',
  click_affiliate: '💰 Afiliado',
  click_whatsapp: '💬 WhatsApp',
  click_telegram: '✈️ Telegram',
  click_facebook: '👍 Facebook',
};

function formatPage(page: string): string {
  if (page === '/') return '🏠 Início';
  if (page.startsWith('/palpite/')) return '⚽ ' + page.replace('/palpite/', '').replace(/-/g, ' ').substring(0, 40);
  if (page === '/blog') return '📝 Blog';
  if (page === '/faq') return '❓ FAQ';
  return page.substring(0, 40);
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Analytics() {
  const [password, setPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('7');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (pwd: string, days: string) => {
    try {
      const res = await fetch(`/api/analytics/dashboard?password=${encodeURIComponent(pwd)}&days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (e) {
      console.error('Erro ao buscar dashboard:', e);
    }
  }, []);

  const fetchRealtime = useCallback(async (pwd: string) => {
    try {
      const res = await fetch(`/api/analytics/realtime?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const data = await res.json();
        setRealtime(data);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('Erro ao buscar realtime:', e);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`/api/analytics/dashboard?password=${encodeURIComponent(inputPassword)}&days=7`);
      if (res.ok) {
        const data = await res.json();
        setPassword(inputPassword);
        setDashboard(data);
        setIsAuthenticated(true);
        fetchRealtime(inputPassword);
      } else {
        setAuthError('Senha incorreta. Tente novamente.');
      }
    } catch {
      setAuthError('Erro de conexão. Tente novamente.');
    }
    setLoading(false);
  };

  // Auto-refresh realtime a cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated || !password) return;
    const interval = setInterval(() => {
      fetchRealtime(password);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, password, fetchRealtime]);

  // Recarregar dashboard quando período muda
  useEffect(() => {
    if (isAuthenticated && password) {
      fetchDashboard(password, period);
    }
  }, [period, isAuthenticated, password, fetchDashboard]);

  const handleRefresh = () => {
    fetchDashboard(password, period);
    fetchRealtime(password);
  };

  // ── Tela de Login ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 mb-4">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Mestre da Rodada — Painel de Rastreamento</p>
          </div>
          <form onSubmit={handleLogin} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Senha de Administrador</label>
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                placeholder="Digite a senha..."
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{authError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acessar Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard Principal ────────────────────────────────────────────────────
  const deviceData = dashboard?.deviceStats.map(d => ({
    name: d.deviceType === 'mobile' ? 'Mobile' : d.deviceType === 'desktop' ? 'Desktop' : 'Tablet',
    value: d.count,
    color: DEVICE_COLORS[d.deviceType as keyof typeof DEVICE_COLORS] || '#6b7280',
  })) || [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-400" />
            <div>
              <h1 className="text-lg font-bold text-white">Analytics</h1>
              <p className="text-xs text-slate-400">Mestre da Rodada</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-slate-500">
                Atualizado às {formatTime(lastUpdate.toISOString())}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="1">Hoje</option>
              <option value="7">7 dias</option>
              <option value="14">14 dias</option>
              <option value="30">30 dias</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Tempo Real ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-700/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{realtime?.activeVisitors ?? '—'}</p>
              <p className="text-xs text-slate-400">Online agora</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{realtime?.lastHourViews ?? '—'}</p>
              <p className="text-xs text-slate-400">Views última hora</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <Eye className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{dashboard?.summary.todayViews ?? '—'}</p>
              <p className="text-xs text-slate-400">Views hoje</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <MousePointerClick className="w-8 h-8 text-pink-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">{dashboard?.summary.todayAffiliateClicks ?? '—'}</p>
              <p className="text-xs text-slate-400">Cliques afiliado hoje</p>
            </div>
          </div>
        </div>

        {/* ── Cards de Resumo ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-slate-400">Total Pageviews</span>
            </div>
            <p className="text-3xl font-bold text-white">{dashboard?.summary.totalPageviews.toLocaleString('pt-BR') ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">Últimos {period} dias</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">Visitantes Únicos</span>
            </div>
            <p className="text-3xl font-bold text-white">{dashboard?.summary.uniqueVisitors.toLocaleString('pt-BR') ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">Sessões distintas</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-slate-400">Cliques Afiliado</span>
            </div>
            <p className="text-3xl font-bold text-white">{dashboard?.summary.affiliateClicks.toLocaleString('pt-BR') ?? '—'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {dashboard && dashboard.summary.totalPageviews > 0
                ? `${((dashboard.summary.affiliateClicks / dashboard.summary.totalPageviews) * 100).toFixed(1)}% CTR`
                : 'Taxa de cliques'}
            </p>
          </div>
        </div>

        {/* ── Gráfico de Pageviews por Dia ─────────────────────────────────── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Pageviews por Dia
          </h2>
          {dashboard?.pageviewsByDay && dashboard.pageviewsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dashboard.pageviewsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('pt-BR')}
                />
                <Line type="monotone" dataKey="views" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} name="Pageviews" />
                <Line type="monotone" dataKey="uniqueVisitors" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="Únicos" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
              Sem dados suficientes ainda. As visitas aparecerão aqui em breve.
            </div>
          )}
        </div>

        {/* ── Páginas Mais Visitadas + Dispositivos ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Páginas Mais Visitadas
            </h2>
            {dashboard?.topPages && dashboard.topPages.length > 0 ? (
              <div className="space-y-2">
                {dashboard.topPages.slice(0, 10).map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{formatPage(p.page)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-white">{p.views}</span>
                      <span className="text-xs text-slate-500 ml-1">views</span>
                    </div>
                    <div className="w-20 bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (p.views / (dashboard.topPages[0]?.views || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Sem dados ainda.</p>
            )}
          </div>

          {/* Dispositivos + Compartilhamentos */}
          <div className="space-y-4">
            {/* Dispositivos */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                Dispositivos
              </h2>
              {deviceData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={100} height={100}>
                    <Pie data={deviceData} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {deviceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-2 flex-1">
                    {deviceData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm text-slate-300 flex-1">{d.name}</span>
                        <span className="text-sm font-semibold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Sem dados ainda.</p>
              )}
            </div>

            {/* Compartilhamentos */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-green-400" />
                Compartilhamentos
              </h2>
              <div className="space-y-2">
                {[
                  { key: 'click_whatsapp', label: 'WhatsApp', color: '#25d366' },
                  { key: 'click_telegram', label: 'Telegram', color: '#229ed9' },
                  { key: 'click_facebook', label: 'Facebook', color: '#1877f2' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-semibold text-white">
                      {dashboard?.shareClicks?.[key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feed de Eventos em Tempo Real ────────────────────────────────── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Atividade Recente (últimos 30 min)
            </h2>
            <span className="text-xs text-slate-500">Atualiza a cada 30s</span>
          </div>
          {realtime?.recentEvents && realtime.recentEvents.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {realtime.recentEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-700/50 last:border-0">
                  <span className="text-xs text-slate-500 shrink-0 w-16">{formatTime(event.createdAt)}</span>
                  <span className="text-xs font-medium text-slate-300 shrink-0 w-28">
                    {EVENT_LABELS[event.eventType] || event.eventType}
                  </span>
                  <span className="text-xs text-slate-400 truncate flex-1">{formatPage(event.page)}</span>
                  <span className="text-xs text-slate-600 shrink-0">
                    {event.deviceType === 'mobile' ? '📱' : event.deviceType === 'tablet' ? '📟' : '💻'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Nenhuma atividade nos últimos 30 minutos.</p>
          )}
        </div>

      </div>
    </div>
  );
}
