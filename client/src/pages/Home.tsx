import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Calendar,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Activity,
  Radio,
  Brain,
} from 'lucide-react';
import Standings from '@/components/Standings';
import UpcomingMatches from '@/components/UpcomingMatches';
import RecentResults from '@/components/RecentResults';
import { Predictions } from '@/components/Predictions';
import { LiveMatches } from '@/components/LiveMatches';
import { AIResults } from '@/components/AIResults';
import PlayStoreBanner from '@/components/PlayStoreBanner';


// ─── Tipos ────────────────────────────────────────────────────────────────────
type Section = 'predictions' | 'live' | 'ai-results' | 'standings' | 'upcoming' | 'results';

interface NavItem {
  id: Section;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  gradient: string;
  description: string;
  badge?: string;
}

// ─── Config de navegação ──────────────────────────────────────────────────────
const navItems: NavItem[] = [
  {
    id: 'predictions',
    label: 'Palpites do Mestre',
    shortLabel: 'Palpites',
    icon: Sparkles,
    gradient: 'from-purple-600 to-pink-600',
    description: 'Análises com IA para os próximos jogos',
  },
  {
    id: 'live',
    label: 'Ao Vivo',
    shortLabel: 'Ao Vivo',
    icon: Radio,
    gradient: 'from-red-600 to-red-700',
    description: 'Jogos ao vivo de todas as ligas',
    badge: 'LIVE',
  },
  {
    id: 'ai-results',
    label: 'Resultados da IA',
    shortLabel: 'Result. IA',
    icon: Brain,
    gradient: 'from-violet-600 to-indigo-600',
    description: 'O que a IA acertou nos jogos finalizados',
  },
  {
    id: 'standings',
    label: 'Classificação',
    shortLabel: 'Classif.',
    icon: BarChart3,
    gradient: 'from-blue-600 to-blue-700',
    description: 'Tabela de classificação',
  },
  {
    id: 'upcoming',
    label: 'Próximos Jogos',
    shortLabel: 'Próximos',
    icon: Calendar,
    gradient: 'from-orange-500 to-orange-600',
    description: 'Próximos jogos de todas as ligas',
  },
  {
    id: 'results',
    label: 'Resultados',
    shortLabel: 'Result.',
    icon: Activity,
    gradient: 'from-emerald-500 to-emerald-600',
    description: 'Últimos resultados de todas as ligas',
  },
];

// ─── Sidebar Component ────────────────────────────────────────────────────────
function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggle,
}: {
  active: Section;
  onSelect: (s: Section) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-[#0f172a] border-r border-white/10 shadow-2xl z-40 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="relative shrink-0">
          <img
            src="/logo.png"
            alt="Mestre da Rodada"
            className="w-10 h-10 object-contain drop-shadow-lg"
          />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f172a] animate-pulse" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-poppins font-black text-white text-sm leading-tight whitespace-nowrap">
                Mestre da Rodada
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold whitespace-nowrap">
                Palpites da Rodada
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-black/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <div className="relative shrink-0">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black px-1 rounded-full leading-tight animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden text-left flex-1"
                  >
                    <p className="text-sm font-semibold leading-tight whitespace-nowrap">
                      {item.label}
                    </p>
                    {isActive && (
                      <p className="text-[10px] text-white/70 whitespace-nowrap leading-tight mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Tooltip quando collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>



      {/* Toggle button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <AnimatePresence>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium"
                >
                  Recolher
                </motion.span>
              </AnimatePresence>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileNav({ active, onSelect }: { active: Section; onSelect: (s: Section) => void }) {
  // No mobile, mostra apenas as 5 abas principais (as mais importantes)
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around px-1 pt-3 pb-10">
        {mobileItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200
                ${isActive ? 'text-white' : 'text-slate-500'}`}
            >
              <div className={`relative p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-gradient-to-br ' + item.gradient + ' shadow-lg' : ''}`}>
                <Icon size={17} />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[9px] font-semibold leading-none">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-poppins font-black text-xl text-foreground leading-tight">
            {item.label}
          </h2>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        {item.badge && (
          <span className="ml-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
            {item.badge}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ onSelect }: { onSelect: (s: Section) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden shadow-xl mb-8 cursor-pointer group"
      onClick={() => onSelect('predictions')}
    >
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031272454/KQQfAkhjN4gcfPPvcd5j9u/hero-football-data-R3ZyXPhske92JaHgTrZS6c.webp"
        alt="Palpites da Rodada"
        className="w-full h-44 md:h-56 object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#1E40AF]/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
        <motion.p
          className="text-blue-300 text-xs md:text-sm font-bold uppercase tracking-widest mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Futebol Internacional
        </motion.p>
        <motion.h2
          className="font-poppins font-black text-white text-2xl md:text-4xl leading-tight mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Palpites da
          <br />
          <span className="text-[#FF8C00]">Rodada</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 bg-purple-600/80 backdrop-blur-sm border border-purple-400/30 rounded-full px-3 py-1.5">
            <Sparkles size={12} className="text-white" />
            <span className="text-white text-xs font-bold">Ver Palpites do Mestre</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Quick Stats Cards ────────────────────────────────────────────────────────
function QuickStats({ onSelect }: { onSelect: (s: Section) => void }) {
  const cards = [
    {
      id: 'predictions' as Section,
      icon: Sparkles,
      label: 'Palpites do Mestre',
      gradient: 'from-purple-600 to-pink-600',
      description: 'Análise com IA',
      mascote: true,
    },
    {
      id: 'live' as Section,
      icon: Radio,
      label: 'Ao Vivo',
      gradient: 'from-red-600 to-red-700',
      description: 'Jogos agora',
      mascote: false,
    },
    {
      id: 'ai-results' as Section,
      icon: Brain,
      label: 'Result. da IA',
      gradient: 'from-violet-600 to-indigo-600',
      description: 'Acertos do Mestre',
      mascote: false,
    },
    {
      id: 'standings' as Section,
      icon: BarChart3,
      label: 'Classificação',
      gradient: 'from-blue-600 to-blue-700',
      description: 'Tabela atualizada',
      mascote: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            onClick={() => onSelect(card.id)}
            className={`relative rounded-2xl overflow-hidden p-4 text-left group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-md bg-gradient-to-br ${card.gradient}`}
          >
            {card.mascote ? (
              <div className="flex flex-col items-center justify-center py-1">
                <img
                  src="/mascote.png"
                  alt="Mestre"
                  className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300 mb-2"
                />
                <p className="text-xs text-white/80 font-semibold text-center">{card.label}</p>
                <p className="text-[10px] text-white/60 text-center">{card.description}</p>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-xs text-white/70 font-medium">{card.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{card.description}</p>
              </>
            )}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-2xl" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('predictions');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentNav = navItems.find((n) => n.id === activeSection)!;

  const handleSelect = (section: Section) => {
    setActiveSection(section);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">

      {/* ── Banner Play Store (topo) ── */}
      <PlayStoreBanner />

      <div className="flex flex-1">

      {/* ── Sidebar (desktop) ── */}
      <Sidebar
        active={activeSection}
        onSelect={handleSelect}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Bar (mobile) ── */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-border/60 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Mestre da Rodada" className="w-9 h-9 object-contain" />
              <div>
                <p className="font-poppins font-black text-sm text-foreground leading-none">Mestre da Rodada</p>
                <p className="text-[10px] text-muted-foreground">Palpites da Rodada</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Ao vivo</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Desktop Top Bar ── */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/60 shadow-sm items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentNav.gradient} flex items-center justify-center shadow-md`}>
              <currentNav.icon size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-poppins font-black text-base text-foreground leading-none">{currentNav.label}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{currentNav.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Dados em tempo real</span>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeSection === 'predictions' ? (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
              <div className="mt-4">
                <HeroBanner onSelect={handleSelect} />
              </div>
                <SectionHeader item={currentNav} />
                <Predictions />
              </motion.div>
            ) : activeSection === 'live' ? (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader item={currentNav} />
                <LiveMatches onViewPrediction={() => handleSelect('predictions')} />
              </motion.div>
            ) : activeSection === 'ai-results' ? (
              <motion.div
                key="ai-results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader item={currentNav} />
                <AIResults />
              </motion.div>
            ) : activeSection === 'standings' ? (
              <motion.div
                key="standings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <QuickStats onSelect={handleSelect} />
                <SectionHeader item={currentNav} />
                <Standings />
              </motion.div>
            ) : activeSection === 'upcoming' ? (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader item={currentNav} />
                <UpcomingMatches />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader item={currentNav} />
                <RecentResults />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border/60 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Mestre da Rodada" className="w-5 h-5 object-contain opacity-60" />
              <span>Mestre da Rodada © 2026 — Palpites por IA, 100% grátis</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <a href="/faq" className="hover:text-foreground transition-colors hover:underline">
                FAQ
              </a>
              <span className="hidden md:inline opacity-30">|</span>
              <a href="/blog" className="hover:text-foreground transition-colors hover:underline">
                Blog
              </a>
              <span className="hidden md:inline opacity-30">|</span>
              <a href="/jogue-com-responsabilidade" className="hover:text-foreground transition-colors hover:underline">
                Jogue com Responsabilidade
              </a>
              <span className="hidden md:inline opacity-30">|</span>
              <a href="/termos-de-uso" className="hover:text-foreground transition-colors hover:underline">
                Termos de Uso
              </a>
              <span className="hidden md:inline opacity-30">|</span>
              <a href="/politica-de-privacidade" className="hover:text-foreground transition-colors hover:underline">
                Política de Privacidade
              </a>
              <span className="hidden md:inline opacity-30">|</span>
              <span className="hidden md:inline">Dados: football-data.org</span>
              <span className="hidden md:inline opacity-30">|</span>
              <span className="hidden md:inline">IA: Groq Llama 3.3</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-3">
            Os palpites são gerados por Inteligência Artificial e têm caráter exclusivamente informativo. Aposte com responsabilidade. +18.
          </p>
        </footer>
      </div>

      </div>

      {/* ── Mobile Bottom Nav ── */}
      <MobileNav active={activeSection} onSelect={handleSelect} />
    </div>
  );
}
