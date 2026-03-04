import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Standings from '@/components/Standings';
import UpcomingMatches from '@/components/UpcomingMatches';
import RecentResults from '@/components/RecentResults';
import {
  Trophy,
  Calendar,
  BarChart3,
  Zap,
  Star,
  Activity,
  Github,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useStandings, useMatches } from '@/hooks/useFootballData';

/**
 * Design Philosophy: Minimalismo Esportivo Moderno
 * - Cores: Azul Profundo (#1E40AF), Laranja (#FF8C00), Verde Esmeralda (#10B981)
 * - Tipografia: Poppins (títulos) + Inter (corpo)
 * - Layout: Cards flutuantes, grid responsivo, navegação limpa
 * - Estilo: Minimalista, moderno, com foco em dados e clareza
 */

// Componente de estatísticas rápidas
function QuickStats() {
  const { data: standings } = useStandings();
  const { data: upcoming } = useMatches('SCHEDULED');
  const { data: finished } = useMatches('FINISHED');

  const leader = standings?.[0];
  const nextMatch = upcoming?.[0];
  const lastMatch = finished?.[0];

  const stats = [
    {
      icon: Trophy,
      label: 'Líder',
      value: leader?.team?.shortName || leader?.team?.name || '—',
      sub: leader ? `${leader.points} pts` : '',
      color: 'from-blue-600 to-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Calendar,
      label: 'Próximo Jogo',
      value: nextMatch
        ? `${nextMatch.homeTeam.shortName || nextMatch.homeTeam.name} x ${nextMatch.awayTeam.shortName || nextMatch.awayTeam.name}`
        : '—',
      sub: nextMatch ? `Rodada ${nextMatch.matchday}` : '',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: Activity,
      label: 'Último Resultado',
      value: lastMatch
        ? `${lastMatch.score.fullTime.home} - ${lastMatch.score.fullTime.away}`
        : '—',
      sub: lastMatch
        ? `${lastMatch.homeTeam.shortName || lastMatch.homeTeam.name} x ${lastMatch.awayTeam.shortName || lastMatch.awayTeam.name}`
        : '',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Star,
      label: 'Times na Série A',
      value: standings ? `${standings.length}` : '20',
      sub: 'Temporada 2025',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
              <stat.icon size={18} className={stat.iconColor} />
            </div>
            <ChevronRight size={14} className="text-muted-foreground mt-1" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
          <p className="font-poppins font-bold text-foreground text-sm leading-tight truncate">
            {stat.value}
          </p>
          {stat.sub && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{stat.sub}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

const tabItems = [
  { value: 'standings', icon: BarChart3, label: 'Classificação', short: 'Classif.' },
  { value: 'upcoming', icon: Calendar, label: 'Próximos Jogos', short: 'Próximos' },
  { value: 'results', icon: Trophy, label: 'Resultados', short: 'Result.' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('standings');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Logo + Título */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Mestre da Rodada"
                  className="w-14 h-14 object-contain drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="font-poppins font-black text-lg md:text-xl text-foreground leading-none">
                  Mestre da Rodada
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Zap size={10} className="text-[#FF8C00]" />
                  Brasileirão Série A 2025
                </p>
              </div>
            </motion.div>

            {/* Badge ao vivo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Dados em tempo real
              </span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="container mx-auto px-4 py-6 md:py-10">

        {/* Hero Section */}
        <motion.div
          className="mb-8 md:mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            {/* Imagem de fundo */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031272454/KQQfAkhjN4gcfPPvcd5j9u/hero-football-data-R3ZyXPhske92JaHgTrZS6c.webp"
              alt="Brasileirão Série A"
              className="w-full h-44 md:h-64 object-cover"
            />
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/90 via-[#1E40AF]/60 to-transparent" />
            {/* Conteúdo sobre a imagem */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
              <motion.p
                className="text-blue-200 text-xs md:text-sm font-semibold uppercase tracking-widest mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Temporada 2025
              </motion.p>
              <motion.h2
                className="font-poppins font-black text-white text-2xl md:text-4xl leading-tight mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Brasileirão
                <br />
                <span className="text-[#FF8C00]">Série A</span>
              </motion.h2>
              <motion.p
                className="text-blue-100 text-xs md:text-sm max-w-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Classificação, próximos jogos e resultados atualizados em tempo real.
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas Rápidas */}
        <QuickStats />

        {/* Abas de conteúdo */}
        <motion.div
          className="bg-card rounded-2xl shadow-md border border-border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab list */}
            <TabsList className="w-full justify-start bg-muted/50 border-b border-border rounded-none p-0 h-auto">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1E40AF] data-[state=active]:bg-card px-4 md:px-6 py-3.5 md:py-4 font-poppins font-semibold text-sm transition-all duration-200"
                >
                  <tab.icon size={17} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Conteúdo das abas */}
            <div className="p-4 md:p-6">
              <AnimatePresence mode="wait">
                <TabsContent value="standings" className="mt-0">
                  <motion.div
                    key="standings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Standings />
                  </motion.div>
                </TabsContent>

                <TabsContent value="upcoming" className="mt-0">
                  <motion.div
                    key="upcoming"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <UpcomingMatches />
                  </motion.div>
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <RecentResults />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>

        {/* ── RODAPÉ ── */}
        <motion.footer
          className="mt-12 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white p-6 md:p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Mestre da Rodada"
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
              <div>
                <p className="font-poppins font-black text-lg leading-none">Mestre da Rodada</p>
                <p className="text-blue-200 text-xs mt-0.5">Brasileirão Série A 2025</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-4">
              <a
                href="https://www.football-data.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm font-medium"
              >
                <ExternalLink size={14} />
                football-data.org
              </a>
              <a
                href="https://github.com/mestredarodada/Mestrerodadanovo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm font-medium"
              >
                <Github size={14} />
                GitHub
              </a>
              <a
                href="https://mestredarodada.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm font-medium"
              >
                <ExternalLink size={14} />
                Site ao Vivo
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-200">
            <p>© 2025 Mestre da Rodada — Análise e Palpites do Brasileirão</p>
            <p>Dados fornecidos por football-data.org</p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
