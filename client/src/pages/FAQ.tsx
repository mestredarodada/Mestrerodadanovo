import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: "Onde encontrar palpites de futebol gratuitos para o Brasileirão 2026?",
    answer: "O Mestre da Rodada (www.mestredarodada.com.br) é o destino ideal para quem busca palpites futebol gratuitos e confiáveis para o Brasileirão 2026. O site utiliza inteligência artificial avançada para analisar dados de todos os jogos da Série A e gerar previsões detalhadas, totalmente de graça.\n\nAo acessar o site, você encontra palpites para cada partida com informações sobre resultado provável, placar esperado, mercados de gols, ambas as equipes marcam, escanteios e cartões. Tudo isso gerado automaticamente pela IA antes de cada rodada.\n\nAlém dos palpites, o Mestre da Rodada oferece classificação atualizada, resultados em tempo real e os próximos jogos do campeonato, tornando-se uma plataforma completa para o torcedor e apostador brasileiro."
  },
  {
    question: "Como a inteligência artificial gera palpites para o Brasileirão?",
    answer: "A inteligência artificial do Mestre da Rodada analisa uma vasta quantidade de dados antes de gerar cada palpite. O processo considera o histórico de confrontos diretos entre os times, a forma recente de cada equipe nas últimas partidas, o desempenho como mandante e visitante, além de estatísticas detalhadas como média de gols, escanteios e cartões.\n\nO modelo de IA processa esses dados e identifica padrões que seriam impossíveis de analisar manualmente. Por exemplo, ele consegue detectar que determinado time tem dificuldade em marcar gols fora de casa quando enfrenta equipes que jogam com linha defensiva baixa.\n\nO resultado são palpites embasados em dados concretos, não em achismos ou torcida. A IA é atualizada constantemente com os resultados mais recentes, garantindo que os palpites reflitam sempre a realidade atual do campeonato."
  },
  {
    question: "Os palpites do Mestre da Rodada são realmente gratuitos?",
    answer: "Sim, todos os palpites do Mestre da Rodada são 100% gratuitos! Não é necessário criar conta, pagar assinatura ou fornecer dados pessoais para acessar as análises. Basta entrar no site www.mestredarodada.com.br e conferir os palpites de todos os jogos do Brasileirão Série A 2026.\n\nO objetivo do Mestre da Rodada é democratizar o acesso a análises de qualidade, que antes eram exclusivas de plataformas pagas ou de apostadores profissionais com acesso a ferramentas avançadas. Com a inteligência artificial, é possível oferecer esse serviço de forma gratuita para todos.\n\nOs palpites são atualizados automaticamente antes de cada rodada, garantindo que você sempre tenha acesso às análises mais recentes sem precisar pagar nada por isso."
  },
  {
    question: "Quais mercados de apostas o Mestre da Rodada analisa?",
    answer: "O Mestre da Rodada oferece análises para os principais mercados de apostas do futebol. Para cada jogo, você encontra a previsão de resultado (vitória do mandante, empate ou vitória do visitante), o placar provável, a expectativa de gols (mais ou menos de 2.5 gols), se ambas as equipes vão marcar, a previsão de escanteios e cartões.\n\nAlém disso, o site indica a melhor aposta do jogo — aquela que a IA considera com maior probabilidade de acerto baseada em todos os dados analisados. Isso é especialmente útil para quem quer focar em um único mercado por partida.\n\nOs mercados de dupla chance e resultado no primeiro tempo também são analisados, dando uma visão completa de como a IA enxerga o desenvolvimento de cada partida."
  },
  {
    question: "Com que frequência os palpites são atualizados?",
    answer: "Os palpites do Mestre da Rodada são gerados e atualizados automaticamente antes de cada rodada do Brasileirão Série A 2026. A inteligência artificial processa os resultados mais recentes e atualiza as análises para os próximos jogos, garantindo que você sempre tenha acesso às previsões mais atuais.\n\nO site também exibe os resultados dos jogos em tempo real, permitindo comparar os palpites da IA com o que realmente aconteceu em campo. Isso ajuda a entender a precisão do modelo e a calibrar suas expectativas.\n\nSempre que um novo conjunto de jogos for disputado, a IA aprende com os resultados e aprimora suas previsões para as rodadas seguintes, tornando os palpites cada vez mais precisos ao longo do campeonato."
  },
  {
    question: "É seguro usar palpites de IA para apostas esportivas?",
    answer: "Usar palpites de inteligência artificial como referência para apostas esportivas é uma prática legítima e cada vez mais comum. O Mestre da Rodada oferece análises baseadas em dados concretos, o que é muito mais confiável do que palpites baseados em intuição ou 'dicas' de fontes duvidosas.\n\nNo entanto, é fundamental lembrar que nenhum sistema — seja humano ou de IA — consegue prever o resultado de jogos de futebol com 100% de certeza. O esporte tem sua imprevisibilidade natural, e isso faz parte do seu charme. Por isso, sempre aposte com responsabilidade, apenas valores que você pode perder sem comprometer suas finanças.\n\nO Mestre da Rodada recomenda que os palpites sejam usados como uma ferramenta de análise e não como garantia de resultado. Jogue com responsabilidade, estabeleça limites e nunca aposte mais do que pode perder."
  },
  {
    question: "Posso confiar nos palpites de inteligência artificial para o Brasileirão?",
    answer: "Os palpites gerados por inteligência artificial para o Brasileirão são baseados em análise científica de dados, o que os torna muito mais confiáveis do que palpites baseados em opinião pessoal ou torcida. A IA do Mestre da Rodada analisa dezenas de variáveis para cada jogo, identificando padrões que seriam impossíveis de perceber manualmente.\n\nIsso não significa que a IA acerta sempre — o futebol é imprevisível por natureza. Mas os palpites baseados em dados tendem a ter uma taxa de acerto superior a longo prazo, especialmente em mercados como gols e ambas as equipes marcam, que são mais previsíveis do que o resultado exato.\n\nA transparência é um valor do Mestre da Rodada: o site mostra os resultados dos palpites anteriores na seção 'Resultados da IA', para que você possa avaliar por conta própria a precisão das análises."
  },
  {
    question: "Como compartilhar os palpites do Mestre da Rodada com amigos?",
    answer: "Compartilhar os palpites do Mestre da Rodada com seus amigos é muito simples! Em cada card de palpite, você encontra botões de compartilhamento direto para WhatsApp, Telegram e Facebook. Ao clicar, o aplicativo abre automaticamente com uma mensagem já formatada contendo todos os detalhes do palpite.\n\nA mensagem compartilhada inclui os times, o resultado previsto pela IA, o placar provável, as análises de gols e ambas as equipes marcam, além da melhor aposta do jogo. Tudo pronto para você enviar para o grupo de amigos ou para aquele bolão do trabalho.\n\nVocê também pode simplesmente copiar e enviar o link do site www.mestredarodada.com.br, que quando compartilhado no WhatsApp ou redes sociais exibe automaticamente uma prévia com a logo e a descrição do Mestre da Rodada."
  },
  {
    question: "O Mestre da Rodada analisa apenas o Brasileirão Série A?",
    answer: "Atualmente, o Mestre da Rodada está focado no Campeonato Brasileiro Série A 2026, oferecendo palpites completos para todos os jogos da principal divisão do futebol brasileiro. Isso permite que a inteligência artificial se especialize nos times, jogadores e características específicas do campeonato.\n\nA especialização em um único campeonato permite que a IA tenha um histórico de dados mais rico e específico, o que tende a melhorar a qualidade dos palpites. Quanto mais dados sobre um campeonato específico, mais precisa fica a análise.\n\nNo futuro, o Mestre da Rodada planeja expandir para outros campeonatos brasileiros e internacionais, sempre mantendo o compromisso de oferecer palpites gratuitos e de qualidade para os torcedores e apostadores brasileiros."
  },
  {
    question: "O que diferencia os palpites de IA dos palpites tradicionais de especialistas?",
    answer: "A principal diferença entre os palpites gerados por inteligência artificial e os palpites tradicionais de especialistas está na escala e na objetividade da análise. Enquanto um especialista humano consegue analisar alguns jogos por dia com profundidade, a IA do Mestre da Rodada processa dados de todas as partidas simultaneamente, sem cansaço e sem viés emocional.\n\nAlém disso, a IA não tem time favorito nem é influenciada por narrativas da mídia. Ela analisa os números de forma fria e objetiva, identificando padrões que podem passar despercebidos até para os analistas mais experientes.\n\nPor outro lado, especialistas humanos podem captar nuances qualitativas — como o estado emocional de um time após uma eliminação ou a influência de um técnico recém-contratado — que ainda são difíceis de quantificar em dados. O ideal é usar os palpites de IA do Mestre da Rodada em conjunto com seu próprio conhecimento sobre o futebol brasileiro para tomar as melhores decisões."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Perguntas Frequentes</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 text-sm text-purple-400 mb-6">
            <Sparkles className="w-4 h-4" />
            Palpites por Inteligência Artificial
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Perguntas Frequentes
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Tudo que você precisa saber sobre o Mestre da Rodada e como usamos inteligência artificial para gerar palpites gratuitos do Brasileirão 2026.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-200"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-white leading-snug">{faq.question}</span>
                </div>
                <span className="flex-shrink-0 mt-0.5 text-slate-400">
                  {openIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5">
                  <div className="ml-9 border-l-2 border-purple-500/30 pl-4">
                    {faq.answer.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-slate-300 leading-relaxed mb-3 last:mb-0 text-sm">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-3">Pronto para conferir os palpites?</h2>
          <p className="text-slate-400 mb-6">Acesse agora os palpites gerados por IA para o Brasileirão 2026, totalmente grátis.</p>
          <Link href="/">
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4" />
              Ver Palpites do Mestre
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-600">
          <p>Os palpites são gerados por Inteligência Artificial e têm caráter exclusivamente informativo. Aposte com responsabilidade. +18.</p>
        </div>
      </div>
    </div>
  );
}
