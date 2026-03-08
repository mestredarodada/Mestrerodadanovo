import axios from 'axios';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

// ─── Tipos de artigo por dia da semana ────────────────────────────────────────
const ARTICLE_TYPES = [
  {
    type: 'analise-rodada',
    title: (round: number) => `Palpites Rodada ${round} do Brasileirão 2026 — Análise Completa da IA`,
    description: (round: number) => `Análise completa dos jogos da rodada ${round} do Brasileirão Série A 2026 com palpites gerados por inteligência artificial.`,
    slug: (round: number) => `palpites-rodada-${round}-brasileirao-2026`,
  },
  {
    type: 'guia-apostas',
    title: () => 'Como Usar Palpites de IA para Apostar no Brasileirão — Guia Completo',
    description: () => 'Aprenda como usar palpites gerados por inteligência artificial para apostar com mais segurança no Brasileirão Série A.',
    slug: () => 'como-usar-palpites-ia-apostar-brasileirao-guia-completo',
  },
  {
    type: 'como-funciona-ia',
    title: () => 'Como a Inteligência Artificial Gera Palpites de Futebol — Mestre da Rodada',
    description: () => 'Entenda como a IA do Mestre da Rodada analisa estatísticas, histórico e dados para gerar palpites precisos do Brasileirão.',
    slug: () => 'como-inteligencia-artificial-gera-palpites-futebol',
  },
  {
    type: 'mercados-apostas',
    title: () => 'Os Melhores Mercados para Apostar no Brasileirão 2026',
    description: () => 'Descubra quais mercados de apostas têm maior valor no Brasileirão Série A e como a IA identifica as melhores oportunidades.',
    slug: () => 'melhores-mercados-apostar-brasileirao-2026',
  },
  {
    type: 'dicas-responsabilidade',
    title: () => 'Apostas Esportivas com Responsabilidade — O Que Você Precisa Saber',
    description: () => 'Guia completo sobre como apostar com responsabilidade, definir limites e usar palpites de IA como ferramenta de análise.',
    slug: () => 'apostas-esportivas-responsabilidade-guia-completo',
  },
  {
    type: 'analise-times',
    title: () => 'Os Times Mais Previsíveis do Brasileirão 2026 — Análise da IA',
    description: () => 'A inteligência artificial analisou os padrões dos times do Brasileirão 2026 e identificou os mais consistentes para apostar.',
    slug: () => 'times-mais-previsiveis-brasileirao-2026-analise-ia',
  },
  {
    type: 'resumo-semanal',
    title: () => 'Resumo Semanal — Acertos e Erros da IA no Brasileirão 2026',
    description: () => 'Confira o resumo semanal dos palpites da IA do Mestre da Rodada, com análise dos acertos, erros e o que aprendemos.',
    slug: () => `resumo-semanal-ia-brasileirao-${new Date().toISOString().split('T')[0]}`,
  },
];

// ─── Gera o prompt para cada tipo de artigo ───────────────────────────────────
function buildPrompt(articleType: typeof ARTICLE_TYPES[0], round: number, recentPredictions: any[]): string {
  const predictionsText = recentPredictions.slice(0, 5).map(p =>
    `- ${p.home_team_name} x ${p.away_team_name}: Palpite ${p.main_prediction} (confiança ${p.main_confidence}), ${p.goals_prediction}, ${p.justification?.slice(0, 100)}`
  ).join('\n');

  const prompts: Record<string, string> = {
    'analise-rodada': `
Você é um especialista em futebol brasileiro e análise esportiva. Escreva um artigo de blog completo, rico e envolvente sobre os palpites da rodada ${round} do Brasileirão Série A 2026.

Dados dos palpites recentes da IA:
${predictionsText}

O artigo deve:
- Ter um título chamativo e otimizado para SEO
- Começar com uma introdução envolvente de 2-3 parágrafos
- Ter seções bem definidas com subtítulos (use ## para subtítulos)
- Analisar os principais jogos da rodada com contexto real
- Explicar como a IA chegou aos palpites
- Incluir dicas sobre os mercados mais interessantes
- Terminar com um CTA para acessar www.mestredarodada.com.br
- Usar linguagem acessível, empolgante e profissional
- Ter entre 800-1200 palavras
- Incluir parágrafos curtos para facilitar a leitura mobile
- NÃO usar emojis em excesso
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'guia-apostas': `
Você é um especialista em apostas esportivas e futebol brasileiro. Escreva um guia completo e educativo sobre como usar palpites de inteligência artificial para apostar no Brasileirão 2026.

O artigo deve:
- Ter uma introdução que explique o que são palpites de IA
- Explicar os principais mercados de apostas (resultado, gols, escanteios, cartões)
- Dar dicas práticas de como interpretar os palpites do Mestre da Rodada
- Explicar o conceito de odds e valor esperado
- Incluir alertas sobre apostas responsáveis
- Mencionar o site www.mestredarodada.com.br como ferramenta gratuita
- Usar subtítulos claros com ##
- Ter entre 900-1300 palavras
- Escrever em português brasileiro
- Ser informativo e não incentivar apostas irresponsáveis

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'como-funciona-ia': `
Você é um especialista em inteligência artificial e futebol. Escreva um artigo explicando de forma clara e acessível como a IA do Mestre da Rodada gera palpites para o Brasileirão 2026.

O artigo deve:
- Explicar que a IA analisa estatísticas históricas dos times
- Descrever os dados usados: posição na tabela, gols marcados/sofridos, forma recente, confrontos diretos
- Explicar os mercados analisados: resultado, gols, escanteios, cartões, ambas marcam
- Falar sobre o nível de confiança (ALTA, MÉDIA, BAIXA)
- Ser transparente sobre as limitações da IA
- Mencionar que os palpites são gratuitos em www.mestredarodada.com.br
- Usar subtítulos com ## e parágrafos curtos
- Ter entre 800-1100 palavras
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'mercados-apostas': `
Você é um analista esportivo especializado no Brasileirão. Escreva um artigo sobre os melhores mercados de apostas para o Brasileirão Série A 2026.

O artigo deve:
- Explicar os principais mercados: 1X2, Over/Under gols, Ambas Marcam, Escanteios, Cartões
- Analisar quais mercados têm mais valor no futebol brasileiro
- Dar exemplos práticos com times do Brasileirão
- Explicar como a IA do Mestre da Rodada analisa cada mercado
- Incluir dicas sobre quando apostar em cada mercado
- Mencionar www.mestredarodada.com.br para palpites gratuitos
- Usar subtítulos com ## e listas quando apropriado
- Ter entre 850-1200 palavras
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'dicas-responsabilidade': `
Você é um especialista em bem-estar e apostas responsáveis. Escreva um artigo educativo sobre como apostar com responsabilidade no Brasileirão 2026.

O artigo deve:
- Explicar o conceito de bankroll e gestão de banca
- Dar dicas práticas para definir limites de apostas
- Explicar como usar palpites de IA como ferramenta de análise, não garantia
- Alertar sobre os riscos do jogo compulsivo
- Mencionar recursos de ajuda (CVV, Jogadores Anônimos)
- Falar sobre como o Mestre da Rodada oferece palpites gratuitos sem incentivar apostas
- Usar subtítulos com ## e tom empático
- Ter entre 800-1100 palavras
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'analise-times': `
Você é um analista de futebol especializado no Brasileirão. Escreva um artigo analisando os padrões dos times do Brasileirão Série A 2026 do ponto de vista de apostas e palpites.

O artigo deve:
- Analisar os times mais consistentes em resultados
- Identificar padrões de gols (times que marcam/sofrem muito)
- Falar sobre times com mais escanteios e cartões
- Explicar como a IA usa esses padrões para gerar palpites
- Mencionar que os palpites são gratuitos em www.mestredarodada.com.br
- Usar subtítulos com ## e dados concretos
- Ter entre 850-1200 palavras
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
    'resumo-semanal': `
Você é um analista esportivo do Mestre da Rodada. Escreva um resumo semanal dos palpites de IA para o Brasileirão 2026.

Palpites recentes da IA:
${predictionsText}

O artigo deve:
- Resumir os principais palpites da semana
- Analisar os jogos mais importantes
- Destacar as apostas com maior confiança da IA
- Comentar sobre os mercados mais interessantes
- Convidar o leitor a acompanhar os próximos palpites em www.mestredarodada.com.br
- Usar subtítulos com ## e linguagem empolgante
- Ter entre 700-1000 palavras
- Escrever em português brasileiro

Retorne APENAS o conteúdo do artigo em Markdown, sem explicações adicionais.
    `,
  };

  return prompts[articleType.type] || prompts['analise-rodada'];
}

// ─── Verifica se já existe artigo com esse slug ───────────────────────────────
async function articleSlugExists(slug: string): Promise<boolean> {
  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1
    `);
    const rows = result.rows || result as any[];
    return rows.length > 0;
  } catch {
    return false;
  }
}

// ─── Busca palpites recentes para contexto ────────────────────────────────────
async function getRecentPredictions(): Promise<any[]> {
  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT home_team_name, away_team_name, main_prediction, main_confidence, goals_prediction, justification
      FROM predictions_simple
      WHERE is_published = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    return result.rows || result as any[];
  } catch {
    return [];
  }
}

// ─── Calcula o número da rodada atual ─────────────────────────────────────────
async function getCurrentRound(): Promise<number> {
  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT matchday FROM predictions_simple
      WHERE matchday IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const rows = result.rows || result as any[];
    if (rows.length > 0 && rows[0].matchday) {
      return parseInt(rows[0].matchday);
    }
  } catch {}
  // Calcula baseado na data (Brasileirão começa em março, ~1 rodada por semana)
  const startDate = new Date('2026-03-29');
  const now = new Date();
  const weeksDiff = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(38, weeksDiff + 1));
}

// ─── Gera um artigo de blog ────────────────────────────────────────────────────
export async function generateBlogPost(): Promise<void> {
  const GROQ_API_KEY_BLOG = process.env.GROQ_API_KEY_BLOG;
  if (!GROQ_API_KEY_BLOG) {
    console.warn('[BlogJob] GROQ_API_KEY_BLOG não configurada. Job desativado.');
    return;
  }

  try {
    const db = getDb();

    // Escolhe o tipo de artigo baseado no dia da semana
    const dayOfWeek = new Date().getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
    const articleType = ARTICLE_TYPES[dayOfWeek % ARTICLE_TYPES.length];

    // Busca dados de contexto
    const [recentPredictions, currentRound] = await Promise.all([
      getRecentPredictions(),
      getCurrentRound(),
    ]);

    // Gera o slug e verifica se já existe
    const slug = articleType.slug(currentRound);
    const exists = await articleSlugExists(slug);
    if (exists) {
      console.log(`[BlogJob] Artigo com slug "${slug}" já existe. Pulando.`);
      return;
    }

    console.log(`[BlogJob] 📝 Gerando artigo: "${articleType.title(currentRound)}"...`);

    // Chama a IA para gerar o conteúdo via axios (OpenAI-compatible)
    const prompt = buildPrompt(articleType, currentRound, recentPredictions);

    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um jornalista esportivo especializado em futebol brasileiro e apostas esportivas. Escreva artigos ricos, bem formatados, com parágrafos curtos, subtítulos claros e linguagem acessível. Use Markdown para formatação.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY_BLOG}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const content = groqResponse.data?.choices?.[0]?.message?.content;
    if (!content || content.length < 200) {
      console.warn('[BlogJob] Conteúdo gerado muito curto ou vazio. Abortando.');
      return;
    }

    // Extrai o título do conteúdo (primeira linha # Título)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : articleType.title(currentRound);
    const description = articleType.description(currentRound);

    // Calcula tempo de leitura (média 200 palavras/min)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    // Salva no banco
    await db.execute(sql`
      INSERT INTO blog_posts (title, slug, description, content, reading_time, category, is_published, published_at, created_at)
      VALUES (
        ${title},
        ${slug},
        ${description},
        ${content},
        ${readingTime},
        ${articleType.type},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `);

    console.log(`[BlogJob] ✅ Artigo publicado: "${title}" (${wordCount} palavras, ~${readingTime} min leitura)`);

  } catch (err: any) {
    console.error('[BlogJob] ❌ Erro ao gerar artigo:', err.message);
  }
}

// ─── Job diário de geração de blog ────────────────────────────────────────────
export function startBlogJob(): void {
  if (!process.env.GROQ_API_KEY_BLOG) {
    console.warn('[BlogJob] GROQ_API_KEY_BLOG não configurada. Job desativado.');
    return;
  }

  console.log('[BlogJob] ✅ Job iniciado — gerará 1 artigo por dia.');

  // Primeira execução após 5 minutos do boot (para não sobrecarregar o início)
  setTimeout(async () => {
    console.log('[BlogJob] 🚀 Primeira execução...');
    await generateBlogPost().catch(err =>
      console.error('[BlogJob] Erro na primeira execução:', err.message)
    );
  }, 5 * 60 * 1000);

  // Executa a cada 24 horas
  const BLOG_JOB_INTERVAL_MS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    await generateBlogPost().catch(err =>
      console.error('[BlogJob] Erro no job diário:', err.message)
    );
  }, BLOG_JOB_INTERVAL_MS);
}
