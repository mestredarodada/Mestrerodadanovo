import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, BookOpen, Calendar, Clock, ChevronRight, Sparkles, Tag } from 'lucide-react';

// ─── Artigos do Blog ──────────────────────────────────────────────────────────
const articles = [
  {
    id: 'como-ia-gera-palpites',
    title: 'Como a Inteligência Artificial Gera Palpites para o Brasileirão 2026',
    excerpt: 'Descubra como o Mestre da Rodada usa IA avançada para analisar dados e gerar palpites precisos para todos os jogos do Campeonato Brasileiro.',
    category: 'Tecnologia',
    readTime: '5 min',
    date: '08 de março de 2026',
    gradient: 'from-purple-600 to-pink-600',
    content: `## Como a Inteligência Artificial Gera Palpites para o Brasileirão 2026

O futebol brasileiro sempre foi marcado por análises apaixonadas, debates acalorados e palpites baseados na intuição dos torcedores. Mas e se existisse uma forma mais científica e precisa de prever os resultados dos jogos? É exatamente isso que o **Mestre da Rodada** oferece: palpites gratuitos para o Brasileirão Série A 2026, gerados por inteligência artificial.

### O que é Inteligência Artificial no Futebol?

A inteligência artificial (IA) aplicada ao futebol é um conjunto de algoritmos capazes de processar grandes volumes de dados históricos e identificar padrões que seriam impossíveis de analisar manualmente. No caso do Mestre da Rodada, a IA analisa dezenas de variáveis para cada jogo antes de gerar um palpite.

Diferente de um analista humano, que pode analisar alguns jogos por dia com profundidade, a IA processa informações de todas as partidas simultaneamente, sem cansaço e sem viés emocional. Ela não tem time favorito e não é influenciada pelas narrativas da mídia esportiva.

### Quais Dados a IA Analisa?

Para cada jogo do Brasileirão 2026, o Mestre da Rodada analisa:

**Histórico de confrontos diretos:** Os últimos encontros entre os dois times, incluindo resultados, placares e onde os jogos foram disputados.

**Forma recente:** O desempenho de cada equipe nas últimas 5 a 10 partidas, considerando vitórias, empates, derrotas, gols marcados e sofridos.

**Fator mando de campo:** Estatísticas separadas de desempenho em casa e fora de casa, já que muitos times têm rendimentos completamente diferentes dependendo do local do jogo.

**Médias estatísticas:** Média de gols por jogo, escanteios, cartões, posse de bola e outros indicadores que ajudam a prever como será o andamento da partida.

### Como os Palpites São Gerados?

Após processar todos esses dados, a IA utiliza um modelo de linguagem avançado (LLM) para interpretar os padrões identificados e gerar palpites em linguagem natural. O resultado é uma análise completa que inclui:

- **Resultado provável** (vitória do mandante, empate ou vitória do visitante)
- **Placar esperado** com base nas médias de gols
- **Mercado de gols** (mais ou menos de 2.5 gols)
- **Ambas as equipes marcam** (sim ou não)
- **Escanteios e cartões** esperados
- **Melhor aposta do jogo** — a oportunidade que a IA considera mais promissora

### A Precisão dos Palpites de IA

É importante ser transparente: nenhum sistema consegue prever o resultado de jogos de futebol com 100% de certeza. O esporte tem sua imprevisibilidade natural — lesões de última hora, expulsões, gols de pênalti controversos e outros fatores que nenhum algoritmo consegue antecipar completamente.

No entanto, palpites baseados em dados tendem a ter uma taxa de acerto superior a longo prazo em comparação com palpites baseados apenas na intuição. Especialmente em mercados como gols e ambas as equipes marcam, que são mais previsíveis do que o resultado exato da partida.

### Transparência Total

O Mestre da Rodada acredita na transparência. Por isso, o site possui uma seção de **Resultados da IA**, onde você pode conferir os palpites anteriores e comparar com o que realmente aconteceu em campo. Isso permite que você avalie por conta própria a qualidade das análises.

### Comece a Usar Agora

Acesse **www.mestredarodada.com.br** e confira os palpites gerados por IA para todos os jogos do Brasileirão Série A 2026. É completamente gratuito, sem cadastro e sem pegadinhas. A inteligência artificial trabalha para você ter as melhores análises na palma da mão.

Lembre-se sempre: aposte com responsabilidade, apenas valores que você pode perder sem comprometer suas finanças. O Mestre da Rodada é uma ferramenta de análise, não uma garantia de resultado.`
  },
  {
    id: 'guia-apostas-brasileirao',
    title: 'Guia Completo: Como Usar Palpites de IA para Apostar no Brasileirão',
    excerpt: 'Aprenda o que são odds, os principais mercados de apostas e como usar os palpites de inteligência artificial do Mestre da Rodada para tomar decisões mais informadas.',
    category: 'Guia',
    readTime: '7 min',
    date: '08 de março de 2026',
    gradient: 'from-blue-600 to-cyan-600',
    content: `## Guia Completo: Como Usar Palpites de IA para Apostar no Brasileirão

O mercado de apostas esportivas cresceu muito no Brasil nos últimos anos, e o Campeonato Brasileiro Série A é um dos campeonatos mais apostados do país. Com a chegada de ferramentas como o **Mestre da Rodada**, que oferece palpites gratuitos gerados por inteligência artificial, ficou mais fácil tomar decisões baseadas em dados. Mas antes de começar, é fundamental entender como funcionam as apostas esportivas.

### O que São Odds?

As odds (ou cotações) são números que representam a probabilidade de um evento acontecer, segundo a casa de apostas. Quanto maior a odd, menor a probabilidade esperada e maior o retorno potencial. Por exemplo:

- Odd 1.50 para o Flamengo vencer significa que a casa considera alta probabilidade de vitória
- Odd 3.20 para empate indica que é menos provável
- Odd 5.00 para o adversário vencer indica que é o resultado menos esperado

Para calcular o retorno potencial, basta multiplicar o valor apostado pela odd. Uma aposta de R$100 com odd 2.00 retorna R$200 (lucro de R$100).

### Principais Mercados de Apostas no Futebol

O Mestre da Rodada analisa os seguintes mercados para cada jogo do Brasileirão:

**Resultado Final (1X2):** O mercado mais popular. Você aposta em vitória do mandante (1), empate (X) ou vitória do visitante (2).

**Mais/Menos de 2.5 Gols:** Você aposta se o jogo terá mais ou menos de 2.5 gols no total. É um dos mercados mais analisados pela IA, pois depende das médias de gols das equipes.

**Ambas as Equipes Marcam (BTTS):** Você aposta se ambos os times vão marcar pelo menos um gol. A IA analisa o poder ofensivo e defensivo de cada equipe para fazer essa previsão.

**Escanteios:** Mercado crescente no Brasil. Você aposta no total de escanteios da partida. Times que jogam com pressão alta tendem a gerar mais escanteios.

**Cartões:** Apostas no número de cartões amarelos e vermelhos. Jogos de rivalidade ou com árbitros mais rigorosos tendem a ter mais cartões.

### Como Usar os Palpites do Mestre da Rodada

O Mestre da Rodada foi criado para ser uma ferramenta de análise, não um oráculo. Veja como usar os palpites de forma inteligente:

**1. Consulte os palpites antes de cada rodada:** Acesse www.mestredarodada.com.br e veja as análises para todos os jogos da rodada. A IA já processou os dados e identificou as melhores oportunidades.

**2. Foque na "Melhor Aposta do Jogo":** Cada palpite tem uma seção especial com a melhor aposta identificada pela IA. Essa é a oportunidade que o modelo considera com maior probabilidade de acerto.

**3. Compare com as odds disponíveis:** Após identificar o palpite da IA, compare com as odds oferecidas pelas casas de apostas. Às vezes, a odd disponível não compensa o risco.

**4. Combine com seu conhecimento:** A IA analisa dados históricos, mas você pode ter informações qualitativas importantes — como um jogador-chave lesionado ou um time em crise interna — que ainda não estão nos dados.

### Estratégias de Gestão de Banca

Independente da qualidade dos palpites, a gestão de banca é fundamental para qualquer apostador:

- **Nunca aposte mais de 5% da sua banca em um único jogo**
- **Estabeleça um limite diário/semanal de perdas**
- **Não tente recuperar perdas apostando mais**
- **Mantenha registros de todas as suas apostas**

### Jogue com Responsabilidade

As apostas esportivas devem ser uma forma de entretenimento, não uma fonte de renda principal. O Mestre da Rodada oferece palpites gratuitos para tornar o acompanhamento do Brasileirão mais interessante, mas sempre com responsabilidade.

Se você sentir que as apostas estão afetando negativamente sua vida financeira ou emocional, procure ajuda. O site disponibiliza uma página completa sobre como jogar com responsabilidade e onde buscar apoio.

Acesse **www.mestredarodada.com.br** e comece a usar os palpites de IA para o Brasileirão 2026 de forma inteligente e responsável!`
  },
  {
    id: 'palpites-rodada-5-brasileirao-2026',
    title: 'Palpites da Rodada 5 do Brasileirão Série A 2026 — Análise Completa da IA',
    excerpt: 'Confira a análise completa da inteligência artificial para todos os jogos da 5ª rodada do Campeonato Brasileiro Série A 2026, com palpites, mercados e a melhor aposta de cada partida.',
    category: 'Rodada',
    readTime: '8 min',
    date: '08 de março de 2026',
    gradient: 'from-emerald-600 to-teal-600',
    content: `## Palpites da Rodada 5 do Brasileirão Série A 2026 — Análise Completa da IA

A 5ª rodada do Campeonato Brasileiro Série A 2026 promete grandes emoções, com confrontos diretos entre times que brigam pela liderança e duelos de sobrevivência na parte de baixo da tabela. O **Mestre da Rodada** analisou todos os jogos com inteligência artificial e preparou os palpites completos para você.

### Mirassol x Santos — 11/03 às 00:30

O Santos chega a Mirassol em busca de recuperação após um início de campeonato irregular. O Mirassol, jogando em casa, tem aproveitado bem o fator mando de campo nesta temporada.

**Palpite da IA:** Mirassol vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Mirassol vence e ambas as equipes marcam

### Atlético Mineiro x Internacional — 11/03 às 22:00

Clássico entre dois gigantes do futebol brasileiro. O Atlético Mineiro, jogando no Mineirão, parte como favorito, mas o Internacional tem mostrado solidez defensiva nesta temporada.

**Palpite da IA:** Atlético Mineiro vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Atlético Mineiro vence com mais de 2.5 gols no jogo

### Bahia x Vitória — 11/03 às 23:00

O clássico Ba-Vi sempre é especial, mas o Bahia tem levado vantagem nos confrontos recentes. Jogando em casa, o Bahia é favorito, mas o Vitória tem qualidade para surpreender.

**Palpite da IA:** Bahia vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Bahia vence aproveitando o fator mandante

### Corinthians x Coritiba — 12/03 às 00:30

O Corinthians recebe o Coritiba na Neo Química Arena. O time paulista tem histórico positivo como mandante e deve controlar o jogo com posse de bola.

**Palpite da IA:** Corinthians vence | Menos de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Corinthians vence com menos de 2.5 gols

### Flamengo x Cruzeiro — 12/03 às 00:30

Grande duelo entre dois dos times mais populares do Brasil. O Flamengo, no Maracanã, é favorito, mas o Cruzeiro tem mostrado evolução e pode surpreender.

**Palpite da IA:** Flamengo vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Flamengo vence e ambas as equipes marcam

### Clube do Remo x Fluminense — 12/03 às 22:00

O Fluminense visita o Clube do Remo em Belém. Apesar do fator campo do adversário, o Fluminense tem qualidade técnica superior e deve levar os três pontos.

**Palpite da IA:** Fluminense vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Fluminense vence com mais de 1.5 gols

### Vasco x Palmeiras — 12/03 às 22:30

O Palmeiras chega a São Januário como grande favorito. O time alviverde tem sido dominante nesta temporada e deve impor seu jogo mesmo fora de casa.

**Palpite da IA:** Palmeiras vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Palmeiras vence com mais de 2.5 gols no jogo

### São Paulo x Chapecoense — 12/03 às 23:00

O São Paulo recebe a Chapecoense no Morumbi. A diferença de qualidade entre os times é grande, e o São Paulo deve vencer com tranquilidade.

**Palpite da IA:** São Paulo vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** São Paulo vence com mais de 2.5 gols

### Grêmio x RB Bragantino — 13/03 às 00:30

O Grêmio recebe o Bragantino na Arena do Grêmio. Os dois times têm estilos ofensivos e o jogo promete ser movimentado.

**Palpite da IA:** Grêmio vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Grêmio vence com ambas as equipes marcando

### CA Paranaense x Botafogo FR — 29/03 às 21:30

Confronto entre dois times que brigam pela parte de cima da tabela. O Paranaense, jogando em casa, tem vantagem, mas o Botafogo tem mostrado consistência nesta temporada.

**Palpite da IA:** CA Paranaense vence | Mais de 2.5 gols | Ambas marcam: SIM
**Melhor aposta:** Vitória do CA Paranaense com mais de 2.5 gols

---

### Resumo da Rodada 5

A 5ª rodada do Brasileirão 2026 tem jogos equilibrados e promete muitos gols. A IA identificou que a maioria dos jogos deve ter mais de 2.5 gols, com ambas as equipes marcando — o que indica uma rodada ofensiva.

Para conferir os palpites completos com todos os mercados e a análise detalhada de cada jogo, acesse **www.mestredarodada.com.br**. Os palpites são gerados automaticamente pela inteligência artificial e atualizados antes de cada rodada, sempre de forma gratuita.

**Lembre-se:** aposte com responsabilidade e apenas valores que você pode perder. Os palpites são análises baseadas em dados e não garantem resultados.`
  }
];

// ─── Componente de Artigo Individual ─────────────────────────────────────────
function ArticleView({ article, onBack }: { article: typeof articles[0]; onBack: () => void }) {
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-black mt-8 mb-4 text-white">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold mt-6 mb-3 text-purple-300">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="text-slate-300 ml-4 mb-1 list-disc">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('**Palpite da IA:**')) {
        return (
          <div key={i} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-2 my-2 text-sm">
            <span className="text-purple-400 font-semibold">Palpite da IA: </span>
            <span className="text-white">{line.replace('**Palpite da IA:** ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('**Melhor aposta:**')) {
        return (
          <div key={i} className="bg-amber-900/30 border border-amber-500/30 rounded-lg px-4 py-2 my-2 text-sm">
            <span className="text-amber-400 font-semibold">⭐ Melhor aposta: </span>
            <span className="text-white">{line.replace('**Melhor aposta:** ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('---')) {
        return <hr key={i} className="border-white/10 my-6" />;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Processar bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-slate-300 leading-relaxed">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Blog
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors ml-2">
              / Home
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${article.gradient} bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold mb-4`}>
          <Tag className="w-3 h-3" />
          {article.category}
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">{article.title}</h1>
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-8 pb-6 border-b border-white/10">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} de leitura</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Mestre da Rodada</span>
        </div>
        <div className="prose prose-invert max-w-none space-y-1">
          {renderContent(article.content)}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-3">Confira os palpites agora!</h2>
          <p className="text-slate-400 mb-6">Palpites gratuitos gerados por IA para todos os jogos do Brasileirão 2026.</p>
          <Link href="/">
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4" />
              Ver Palpites do Mestre
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal do Blog ─────────────────────────────────────────────────
export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);

  if (selectedArticle) {
    return <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Blog</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 text-sm text-purple-400 mb-6">
            <BookOpen className="w-4 h-4" />
            Artigos e Análises
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Blog do Mestre da Rodada
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Artigos sobre inteligência artificial no futebol, guias de apostas esportivas e análises das rodadas do Brasileirão 2026.
          </p>
        </div>

        {/* Artigo em Destaque */}
        <div
          className="mb-8 cursor-pointer group"
          onClick={() => setSelectedArticle(articles[0])}
        >
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10">
            <div className={`h-2 bg-gradient-to-r ${articles[0].gradient}`} />
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${articles[0].gradient} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  <Tag className="w-3 h-3" />
                  {articles[0].category}
                </span>
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">Em Destaque</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-purple-300 transition-colors leading-tight">
                {articles[0].title}
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">{articles[0].excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{articles[0].date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{articles[0].readTime}</span>
                </div>
                <span className="flex items-center gap-1 text-purple-400 text-sm font-semibold group-hover:gap-2 transition-all">
                  Ler artigo <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Artigos */}
        <div className="grid md:grid-cols-2 gap-6">
          {articles.slice(1).map((article) => (
            <div
              key={article.id}
              className="cursor-pointer group"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 h-full flex flex-col">
                <div className={`h-1.5 bg-gradient-to-r ${article.gradient}`} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${article.gradient} text-white text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                      <Tag className="w-2.5 h-2.5" />
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors leading-snug flex-1">
                    {article.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
                    </div>
                    <span className="flex items-center gap-1 text-purple-400 text-xs font-semibold group-hover:gap-2 transition-all">
                      Ler <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-600">
          <p>Os palpites são gerados por Inteligência Artificial e têm caráter exclusivamente informativo. Aposte com responsabilidade. +18.</p>
        </div>
      </div>
    </div>
  );
}
