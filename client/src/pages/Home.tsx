import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Standings from '@/components/Standings';
import UpcomingMatches from '@/components/UpcomingMatches';
import RecentResults from '@/components/RecentResults';
import { Trophy, Calendar, BarChart3 } from 'lucide-react';

/**
 * Design Philosophy: Minimalismo Esportivo Moderno
 * - Cores: Azul Profundo (#1E40AF), Laranja (#FF8C00), Verde Esmeralda (#10B981)
 * - Tipografia: Poppins (títulos) + Inter (corpo)
 * - Layout: Cards flutuantes, grid responsivo, navegação limpa
 * - Estilo: Minimalista, moderno, com foco em dados e clareza
 */

export default function Home() {
  const [activeTab, setActiveTab] = useState('standings');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <Trophy className="text-white" size={24} />
              </div>
              <div>
                <h1 className="font-poppins font-bold text-xl md:text-2xl text-foreground">
                  Mestre da Rodada
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Brasileirão Série A
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031272454/KQQfAkhjN4gcfPPvcd5j9u/hero-football-data-R3ZyXPhske92JaHgTrZS6c.webp"
              alt="Football Analytics"
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-muted border-b border-border rounded-none p-0 h-auto">
              <TabsTrigger
                value="standings"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 md:px-6 py-3 md:py-4 font-poppins font-semibold text-sm md:text-base"
              >
                <BarChart3 size={18} />
                <span className="hidden sm:inline">Classificação</span>
                <span className="sm:hidden">Classif.</span>
              </TabsTrigger>

              <TabsTrigger
                value="upcoming"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 md:px-6 py-3 md:py-4 font-poppins font-semibold text-sm md:text-base"
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">Próximos Jogos</span>
                <span className="sm:hidden">Próximos</span>
              </TabsTrigger>

              <TabsTrigger
                value="results"
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white px-4 md:px-6 py-3 md:py-4 font-poppins font-semibold text-sm md:text-base"
              >
                <Trophy size={18} />
                <span className="hidden sm:inline">Resultados</span>
                <span className="sm:hidden">Result.</span>
              </TabsTrigger>
            </TabsList>

            {/* Standings Tab */}
            <TabsContent value="standings" className="p-4 md:p-6">
              <Standings />
            </TabsContent>

            {/* Upcoming Matches Tab */}
            <TabsContent value="upcoming" className="p-4 md:p-6">
              <UpcomingMatches />
            </TabsContent>

            {/* Recent Results Tab */}
            <TabsContent value="results" className="p-4 md:p-6">
              <RecentResults />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Dados fornecidos por{' '}
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              football-data.org
            </a>
          </p>
          <p className="mt-2">
            Mestre da Rodada © 2026 - Análise e Palpites do Brasileirão
          </p>
        </div>
      </main>
    </div>
  );
}
