import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import apiRouter from "../routes/predictions";
import { runMigrations } from "../db/migrate";
import { generateNextPrediction } from "../services/predictions.service";

// ─── Job de geração sequencial de palpites ────────────────────────────────────
// Gera 1 palpite a cada 2 minutos, respeitando o rate limit da API gratuita.
// Pula automaticamente jogos que já têm palpite recente (menos de 20h).

const PREDICTION_JOB_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

function startPredictionJob() {
  if (!process.env.GROQ_API_KEY || !process.env.FOOTBALL_DATA_API_KEY) {
    console.warn('[PredictionJob] Variáveis de ambiente não configuradas (GROQ_API_KEY ou FOOTBALL_DATA_API_KEY). Job desativado.');
    return;
  }

  console.log('[PredictionJob] ✅ Job iniciado — gerará 1 palpite a cada 2 minutos.');

  // Executa imediatamente ao iniciar o servidor (após 10s para o servidor estabilizar)
  setTimeout(async () => {
    console.log('[PredictionJob] 🚀 Primeira execução após inicialização do servidor...');
    await generateNextPrediction().catch(err =>
      console.error('[PredictionJob] Erro na primeira execução:', err.message)
    );
  }, 10 * 1000);

  // Depois executa a cada 2 minutos
  setInterval(async () => {
    await generateNextPrediction().catch(err =>
      console.error('[PredictionJob] Erro no job:', err.message)
    );
  }, PREDICTION_JOB_INTERVAL_MS);
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
  });
}

startServer().catch(console.error);
