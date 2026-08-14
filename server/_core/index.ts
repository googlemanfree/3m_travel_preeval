import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerCandidateUploadRoute, registerPublicUploadRoute } from "../routers/candidateUpload";
import { registerAgencyDossierUploadRoute } from "../routers/agencyDossierUpload";
import { registerCinetPayWebhook } from "../routers/cinetpayWebhook";
import { setupDocumentsRoutes } from "../documentsRoutes";
import { handleEvaluationJob } from "../scheduled/evaluationJob";
import { handleEvaluationBilanJob } from "../scheduled/evaluationBilanJob";
import { handleComplianceMonthlyReportJob } from "../scheduled/complianceMonthlyReportJob";
import { handlePassportPendingWeeklyAlertJob } from "../scheduled/passportPendingWeeklyAlertJob";
import { initEvaluationCron } from "../cron/evaluationCron";
import { requireCronSecret } from "./scheduledAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerCandidateUploadRoute(app);
  registerPublicUploadRoute(app);
  registerAgencyDossierUploadRoute(app);
  registerCinetPayWebhook(app);
  setupDocumentsRoutes(app);
  // Scheduled jobs
  app.post("/api/scheduled/evaluation-job", (req, res) => {
    if (!requireCronSecret(req, res)) return;
    void handleEvaluationJob(req, res);
  });
  app.post("/api/scheduled/evaluation-bilan-job", (req, res) => {
    if (!requireCronSecret(req, res)) return;
    void handleEvaluationBilanJob(req, res);
  });
  app.post("/api/scheduled/compliance-monthly-report", (req, res) => {
    if (!requireCronSecret(req, res)) return;
    void handleComplianceMonthlyReportJob(req, res);
  });
  app.post("/api/scheduled/passport-pending-weekly-alert", (req, res) => {
    if (!requireCronSecret(req, res)) return;
    void handlePassportPendingWeeklyAlertJob(req, res);
  });
  // Initialize Cron Jobs
  try {
    await initEvaluationCron();
  } catch (error) {
    console.error("[Server] Erreur lors de l'initialisation du Cron Job:", error);
  }
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
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
  });
}

startServer().catch(console.error);
