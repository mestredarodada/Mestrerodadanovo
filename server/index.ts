import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/predictions"; // Importar as rotas da API
import analyticsRouter from "./routes/analytics"; // Rotas de analytics

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware para parsear JSON
  app.use(express.json());

  // tRPC API (usado pelo Admin)
  const { appRouter } = await import("./routers");
  const { createContext } = await import("./_core/context");
  const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
  
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // API REST Routes (DEVE estar ANTES do catch-all para não ser interceptado)
  app.use("/api/predictions", apiRouter);
  app.use("/api/analytics", analyticsRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
