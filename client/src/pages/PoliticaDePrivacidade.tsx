import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const sections = [
  {
    title: '1. Dados que Coletamos',
    content: `Ao acessar nosso site, coletamos automaticamente informações técnicas que não identificam pessoalmente o usuário, incluindo: endereço IP (anonimizado), tipo de navegador e sistema operacional, páginas visitadas e tempo de permanência, origem do acesso (busca orgânica, redes sociais, acesso direto) e resolução de tela e dispositivo utilizado.\n\nO Mestre da Rodada não exige cadastro e não coleta nome, e-mail, CPF, dados bancários ou qualquer informação pessoal identificável de forma direta.`,
  },
  {
    title: '2. Como Usamos os Dados',
    content: `Os dados coletados automaticamente são utilizados exclusivamente para: analisar o desempenho e uso do site, melhorar a experiência do usuário, identificar e corrigir erros técnicos e gerar estatísticas agregadas e anônimas de acesso.`,
  },
  {
    title: '3. Cookies',
    content: `Utilizamos cookies técnicos essenciais para o funcionamento do site (preferência de tema, por exemplo) e cookies de análise para entender como os usuários interagem com o conteúdo. Você pode desativar os cookies nas configurações do seu navegador, embora isso possa afetar algumas funcionalidades do site.`,
  },
  {
    title: '4. Ferramentas de Análise',
    content: `Podemos utilizar ferramentas de análise de tráfego para monitorar o desempenho do site. Essas ferramentas coletam dados de forma anonimizada e não rastreiam usuários individualmente entre sessões.`,
  },
  {
    title: '5. Compartilhamento de Dados',
    content: `Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Os dados técnicos anonimizados podem ser compartilhados com provedores de serviço que nos auxiliam na operação do site (como servidores de hospedagem), sempre sob obrigação de confidencialidade.`,
  },
  {
    title: '6. Links para Terceiros',
    content: `Nosso site contém links para sites de terceiros, incluindo casas de apostas esportivas. Não somos responsáveis pelas práticas de privacidade desses sites. Recomendamos que você leia as políticas de privacidade de qualquer site externo que visitar.`,
  },
  {
    title: '7. Segurança',
    content: `Adotamos medidas técnicas e organizacionais adequadas para proteger as informações coletadas contra acesso não autorizado, alteração, divulgação ou destruição. O site utiliza protocolo HTTPS para criptografar todas as comunicações.`,
  },
  {
    title: '8. Seus Direitos (LGPD)',
    content: `Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a: confirmar a existência de tratamento de dados, acessar os dados coletados, solicitar a correção de dados incompletos ou inexatos, solicitar a eliminação dos dados e revogar o consentimento a qualquer momento.\n\nPara exercer qualquer um desses direitos, entre em contato pelo e-mail: mestremestrerodada@gmail.com`,
  },
  {
    title: '9. Alterações nesta Política',
    content: `Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas publicando a nova versão nesta página com a data de atualização.`,
  },
  {
    title: '10. Contato e Encarregado de Dados (DPO)',
    content: `Para questões relacionadas à privacidade e proteção de dados:\n\nE-mail: mestremestrerodada@gmail.com\nSite: www.mestredarodada.com.br`,
  },
];

export default function PoliticaDePrivacidade() {
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Lock size={16} className="text-white" />
            </div>
            <span className="font-poppins font-black text-white text-sm">Política de Privacidade</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Lock size={28} className="text-violet-400" />
            <h1 className="font-poppins font-black text-2xl text-white">Política de Privacidade</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Última atualização: <strong className="text-slate-300">Março de 2026</strong>
          </p>
          <p className="text-slate-300 leading-relaxed mt-3 text-sm">
            O <strong className="text-white">Mestre da Rodada</strong> está comprometido com a proteção da sua privacidade
            e com o cumprimento da <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            Esta Política descreve como coletamos, usamos e protegemos suas informações.
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
            {section.content.split('\n\n').map((para, j) => (
              <p key={j} className="text-slate-300 leading-relaxed text-sm">{para}</p>
            ))}
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
