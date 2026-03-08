import { motion } from 'framer-motion';
import { Shield, Heart, AlertTriangle, Phone, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function JogueComResponsabilidade() {
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-poppins font-black text-white text-sm">Jogue com Responsabilidade</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Shield size={28} className="text-emerald-400" />
            <h1 className="font-poppins font-black text-2xl text-white">Jogue com Responsabilidade</h1>
          </div>
          <p className="text-slate-300 leading-relaxed">
            O Mestre da Rodada acredita que o entretenimento esportivo deve ser uma experiência positiva e segura.
            Por isso, levamos muito a sério a promoção do jogo responsável.
          </p>
        </motion.div>

        {/* Seções */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-slate-800/50 border border-white/10 p-6 space-y-3"
        >
          <h2 className="font-poppins font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black">1</span>
            O que são apostas esportivas?
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            Apostas esportivas são uma forma de entretenimento que envolve risco financeiro real. Os resultados são imprevisíveis
            e nenhum sistema de palpites — incluindo os gerados por Inteligência Artificial — pode garantir lucro ou prever com
            certeza o resultado de uma partida.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-slate-800/50 border border-white/10 p-6 space-y-3"
        >
          <h2 className="font-poppins font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-black">2</span>
            Nossos palpites são para entretenimento
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            Todos os palpites disponibilizados no Mestre da Rodada são gerados por Inteligência Artificial com base em dados
            históricos e estatísticas públicas. Eles têm finalidade exclusivamente <strong className="text-white">informativa e de entretenimento</strong>.
            O Mestre da Rodada <strong className="text-white">não é uma casa de apostas</strong> e não tem qualquer responsabilidade
            sobre decisões financeiras tomadas com base nas informações aqui disponibilizadas.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6 space-y-4"
        >
          <h2 className="font-poppins font-bold text-lg text-amber-400 flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-400" />
            Sinais de que você pode precisar de ajuda
          </h2>
          <p className="text-slate-300 text-sm">Fique atento se você:</p>
          <ul className="space-y-2">
            {[
              'Aposta mais dinheiro do que pode perder',
              'Pensa constantemente em apostas',
              'Aposta para recuperar perdas anteriores',
              'Esconde suas apostas de familiares ou amigos',
              'Aposta com dinheiro destinado a despesas essenciais (aluguel, alimentação, saúde)',
              'Sente ansiedade, irritação ou depressão relacionadas às apostas',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 space-y-4"
        >
          <h2 className="font-poppins font-bold text-lg text-red-400 flex items-center gap-2">
            <Phone size={20} className="text-red-400" />
            Onde buscar ajuda
          </h2>
          <p className="text-slate-300 text-sm">Se você ou alguém que você conhece apresenta sinais de dependência em jogos, procure ajuda:</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
              <p className="font-bold text-white text-sm">CVV — Centro de Valorização da Vida</p>
              <p className="text-emerald-400 font-black text-xl mt-1">188</p>
              <p className="text-slate-400 text-xs mt-0.5">Disponível 24 horas por dia, 7 dias por semana</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
              <p className="font-bold text-white text-sm">CAPS — Centro de Atenção Psicossocial</p>
              <p className="text-slate-300 text-xs mt-1">Procure a unidade mais próxima da sua cidade</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 border border-white/10 p-4">
              <p className="font-bold text-white text-sm">Gamblers Anonymous Brasil</p>
              <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-xs hover:underline mt-1 block">
                www.gamblersanonymous.org
              </a>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-slate-800/50 border border-white/10 p-6 space-y-3"
        >
          <h2 className="font-poppins font-bold text-lg text-white flex items-center gap-2">
            <Heart size={20} className="text-pink-400" />
            Dicas para jogar com responsabilidade
          </h2>
          <ul className="space-y-2">
            {[
              'Estabeleça um limite de quanto está disposto a gastar antes de apostar e nunca ultrapasse esse valor',
              'Trate as apostas como entretenimento, não como fonte de renda',
              'Nunca aposte sob influência de álcool ou em momentos de estresse emocional',
              'Faça pausas regulares e mantenha as apostas como uma atividade secundária em sua vida',
              'Nunca tente recuperar perdas apostando mais',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-slate-800/50 border border-white/10 p-6 space-y-3"
        >
          <h2 className="font-poppins font-bold text-lg text-white">Proteção de menores</h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            O Mestre da Rodada é destinado exclusivamente a maiores de <strong className="text-white">18 anos</strong>.
            Se você é menor de idade, por favor, não utilize este site para fins relacionados a apostas esportivas.
          </p>
        </motion.section>

        {/* Footer da página */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8">
          <p>Mestre da Rodada © 2026 — mestremestrerodada@gmail.com</p>
        </div>
      </main>
    </div>
  );
}
