import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const sections = [
  {
    title: '1. Sobre o Serviço',
    content: `O Mestre da Rodada é uma plataforma digital que disponibiliza palpites esportivos gerados por Inteligência Artificial para o Campeonato Brasileiro de Futebol (Brasileirão Série A). O serviço é oferecido gratuitamente, sem necessidade de cadastro.`,
  },
  {
    title: '2. Finalidade Exclusivamente Informativa',
    content: `Os palpites, análises e informações disponibilizados neste site têm caráter exclusivamente informativo e de entretenimento. O Mestre da Rodada não é uma casa de apostas, não oferece serviços de apostas e não tem qualquer responsabilidade sobre decisões financeiras tomadas com base nas informações aqui disponibilizadas. Nenhuma informação contida neste site deve ser interpretada como conselho financeiro, de investimento ou de apostas.`,
  },
  {
    title: '3. Isenção de Responsabilidade',
    content: `O Mestre da Rodada não garante a precisão, completude ou atualidade das informações disponibilizadas. Os palpites são gerados por algoritmos de Inteligência Artificial e podem conter erros. O usuário assume integralmente os riscos decorrentes do uso das informações deste site. Não nos responsabilizamos por quaisquer perdas financeiras, danos diretos ou indiretos resultantes do uso das informações disponibilizadas.`,
  },
  {
    title: '4. Restrição de Idade',
    content: `O acesso a conteúdos relacionados a apostas esportivas é destinado exclusivamente a pessoas com 18 anos ou mais. Ao utilizar este site, você declara ter atingido a maioridade legal.`,
  },
  {
    title: '5. Links para Terceiros',
    content: `Este site pode conter links para sites de terceiros, incluindo casas de apostas esportivas. O Mestre da Rodada não se responsabiliza pelo conteúdo, políticas ou práticas desses sites. A inclusão de links não implica endosso ou parceria formal. Alguns links podem ser links de afiliados, por meio dos quais podemos receber uma comissão caso o usuário realize um cadastro ou depósito. Isso não implica custo adicional para o usuário.`,
  },
  {
    title: '6. Propriedade Intelectual',
    content: `Todo o conteúdo deste site — incluindo textos, análises, código-fonte, logotipos e design — é de propriedade exclusiva do Mestre da Rodada e está protegido pelas leis de propriedade intelectual brasileiras. É proibida a reprodução, distribuição ou uso comercial sem autorização prévia por escrito.`,
  },
  {
    title: '7. Modificações',
    content: `Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após a publicação nesta página. O uso continuado do site após as modificações implica aceitação dos novos termos.`,
  },
  {
    title: '8. Lei Aplicável',
    content: `Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias.`,
  },
  {
    title: '9. Contato',
    content: `Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: mestremestrerodada@gmail.com`,
  },
];

export default function TermosDeUso() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-poppins font-black text-white text-sm">Termos de Uso</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <FileText size={28} className="text-blue-400" />
            <h1 className="font-poppins font-black text-2xl text-white">Termos de Uso</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Última atualização: <strong className="text-slate-300">Março de 2026</strong>
          </p>
          <p className="text-slate-300 leading-relaxed mt-3 text-sm">
            Bem-vindo ao <strong className="text-white">Mestre da Rodada</strong> (www.mestredarodada.com.br).
            Ao acessar e utilizar este site, você concorda com os presentes Termos de Uso. Leia atentamente antes de continuar.
          </p>
        </motion.div>

        {/* Seções */}
        {sections.map((section, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="rounded-2xl bg-slate-800/50 border border-white/10 p-6 space-y-3"
          >
            <h2 className="font-poppins font-bold text-base text-white">{section.title}</h2>
            <p className="text-slate-300 leading-relaxed text-sm">{section.content}</p>
          </motion.section>
        ))}

        {/* Footer da página */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8">
          <p>Mestre da Rodada © 2026 — mestremestrerodada@gmail.com</p>
        </div>
      </main>
    </div>
  );
}
