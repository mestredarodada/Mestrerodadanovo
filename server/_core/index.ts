import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import axios from "axios";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import apiRouter from "../routes/predictions";
import analyticsRouter from "../routes/analytics";
import { runMigrations } from "../db/migrate";
import { generateNextPrediction } from "../services/predictions.service";
import { startBlogJob } from "../services/blog.service";

// ─── Job de geração sequencial de palpites ────────────────────────────────────
// Gera 1 palpite a cada 10 minutos, respeitando o rate limit da API gratuita.
// Pula automaticamente jogos que já têm palpite recente (menos de 20h).

const PREDICTION_JOB_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

function startPredictionJob() {
  if (!process.env.GROQ_API_KEY || !process.env.FOOTBALL_DATA_API_KEY) {
    console.warn('[PredictionJob] Variáveis de ambiente não configuradas. Job desativado.');
    return;
  }

  console.log('[PredictionJob] ✅ Job iniciado — gerará 1 palpite a cada 10 minutos.');

  // Executa imediatamente ao iniciar o servidor (após 15s para estabilizar)
  setTimeout(async () => {
    console.log('[PredictionJob] 🚀 Primeira execução após inicialização...');
    await generateNextPrediction().catch(err =>
      console.error('[PredictionJob] Erro na primeira execução:', err.message)
    );
  }, 15 * 1000);

  // Executa a cada 10 minutos — nunca bloqueia, erro é apenas logado
  setInterval(async () => {
    await generateNextPrediction().catch(err =>
      console.error('[PredictionJob] Erro no job:', err.message)
    );
  }, PREDICTION_JOB_INTERVAL_MS);
}

// ─── Limpeza automática: limpa texto pesado mas preserva dados para Resultados da IA ───
// Estratégia:
//   1. Após 2 dias: limpa 'justification' (texto longo da análise) — os dados básicos
//      (palpites, times, acertos) ficam no banco para os cards de Resultados da IA.
//   2. NUNCA deleta o registro inteiro — os cards dependem desses dados para sempre.
function startCleanupJob() {
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
  console.log('[CleanupJob] ✅ Iniciado — limpeza diária de textos pesados (+2 dias).');
  const runCleanup = async () => {
    try {
      const { getDb } = await import('../db');
      const { sql } = await import('drizzle-orm');
      const database = getDb();

      // Limpa o campo 'justification' (texto pesado) de palpites com +2 dias
      // Mantém todos os outros campos intactos para os Resultados da IA
      const result = await database.execute(sql`
        UPDATE predictions_simple
        SET justification = ''
        WHERE created_at < NOW() - INTERVAL '2 days'
          AND justification IS NOT NULL
          AND justification != ''
      `);
      console.log('[CleanupJob] 🧹 Textos pesados limpos (justification) — dados dos cards preservados.');
    } catch (err: any) {
      console.error('[CleanupJob] Erro na limpeza:', err.message);
    }
  };
  // Executa após 1 hora do start (para não conflitar com o boot)
  setTimeout(runCleanup, 60 * 60 * 1000);
  // Repete a cada 24 horas
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}

// ─── Keep-alive: evita hibernação do Render no plano gratuito ─────────────────
// O Render hiberna serviços gratuitos após ~15 min de inatividade.
// Este loop faz uma requisição ao próprio servidor a cada 4 minutos,
// mantendo-o acordado e garantindo que o job de palpites continue rodando.

function startKeepAlive(port: number) {
  const SERVICE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutos

  console.log(`[KeepAlive] ✅ Iniciado — ping a cada 4 min em ${SERVICE_URL}/health`);

  setInterval(async () => {
    try {
      await axios.get(`${SERVICE_URL}/health`, { timeout: 10000 });
      console.log('[KeepAlive] 💓 Ping OK — servidor acordado');
    } catch (err: any) {
      console.warn('[KeepAlive] ⚠️ Ping falhou:', err.message);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

// ─── Servidor ─────────────────────────────────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // 1. Executa migrações automáticas (cria tabelas se não existirem)
  await runMigrations();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Endpoint de health check — usado pelo keep-alive e pelo Render
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC API (football data + predictions)
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // REST API pública de palpites
  app.use("/api/predictions", apiRouter);

  // REST API de analytics (rastreamento de visitas e cliques)
  app.use("/api/analytics", analyticsRouter);

  // REST API pública de blog
  app.get("/api/blog", async (_req, res) => {
    try {
      const { getDb } = await import('../db');
      const { sql } = await import('drizzle-orm');
      const database = getDb();
      const result = await database.execute(sql`
        SELECT id, title, slug, description, reading_time, category, published_at, created_at
        FROM blog_posts
        WHERE is_published = true
        ORDER BY created_at DESC
        LIMIT 50
      `);
      const rows = result.rows || result as any[];
      res.json({ posts: rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { getDb } = await import('../db');
      const { sql } = await import('drizzle-orm');
      const database = getDb();
      const result = await database.execute(sql`
        SELECT * FROM blog_posts
        WHERE slug = ${req.params.slug} AND is_published = true
        LIMIT 1
      `);
      const rows = result.rows || result as any[];
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Artigo não encontrado' });
      }
      res.json({ post: rows[0] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // 2. Inicia o job de geração sequencial de palpites
    startPredictionJob();
    // 3. Inicia a limpeza automática de textos pesados (+2 dias, preserva dados dos cards)
    startCleanupJob();
    // 4. Inicia o job de geração automática de artigos de blog
    startBlogJob();
    // 5. Inicia o keep-alive para evitar hibernação do Render
    startKeepAlive(port);
  });
}

startServer().catch(console.error);
