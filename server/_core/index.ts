import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { buildApiNotFoundPayload } from "./apiJsonContract";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleCandidateOAuthRoutes } from "../googleCandidateOAuth";
import { registerStorageProxy } from "./storageProxy";
import { registerCandidateUploadRoute, registerPublicUploadRoute } from "../routers/candidateUpload";
import { registerAgencyDossierUploadRoute } from "../routers/agencyDossierUpload";
import { registerCinetPayWebhook } from "../routers/cinetpayWebhook";
import { setupDocumentsRoutes } from "../documentsRoutes";
import { handleEvaluationJob } from "../scheduled/evaluationJob";
import { handleEvaluationBilanJob } from "../scheduled/evaluationBilanJob";
import { handleComplianceMonthlyReportJob } from "../scheduled/complianceMonthlyReportJob";
import { handlePassportPendingWeeklyAlertJob } from "../scheduled/passportPendingWeeklyAlertJob";
import { handleExternalLinkCheckJob } from "../scheduled/externalLinkCheckJob";
import { handleEvaluationReviewDeadlineAlertJob } from "../scheduled/evaluationReviewDeadlineAlertJob";
import { initEvaluationCron } from "../cron/evaluationCron";
import { requireCronSecret } from "./scheduledAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { applications, evaluationEmails } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { verifyEvaluationEmailTrackingToken } from "../services/evaluationEmailCommunication";

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
  registerGoogleCandidateOAuthRoutes(app);
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
  app.post("/api/scheduled/external-link-check", (req, res) => {
    void handleExternalLinkCheckJob(req, res);
  });
  app.post("/api/scheduled/evaluation-review-deadline-alerts", (req, res) => {
    void handleEvaluationReviewDeadlineAlertJob(req, res);
  });
  app.get("/api/evaluation-email/open/:token.gif", async (req, res) => {
    const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");
    const emailId = verifyEvaluationEmailTrackingToken(req.params.token);
    if (emailId) {
      try {
        const db = await getDb();
        if (db) {
          const tracked = (await db.select({ id: evaluationEmails.id, evaluationId: evaluationEmails.evaluationId }).from(evaluationEmails).where(eq(evaluationEmails.id, emailId)).limit(1))[0];
          if (tracked) {
            const openedAt = new Date();
            await db.update(evaluationEmails).set({ openedAt }).where(and(eq(evaluationEmails.id, emailId), isNull(evaluationEmails.openedAt)));
            await db.update(applications).set({ evaluationReportViewedAt: openedAt, updatedAt: openedAt }).where(and(eq(applications.id, tracked.evaluationId), isNull(applications.evaluationReportViewedAt)));
          }
        }
      } catch (error) {
        console.error("[Evaluation Email Tracking] Unable to record opening", error);
      }
    }
    res.status(200).set({ "Content-Type": "image/gif", "Cache-Control": "no-store, no-cache, must-revalidate, private", Pragma: "no-cache" }).end(transparentGif);
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
  // Ne jamais laisser un chemin tRPC non reconnu tomber dans le fallback SPA :
  // un document HTML commençant par <!doctype> ne peut pas être décodé par le client.
  // Ce garde-fou conserve un contrat JSON explicite pour les erreurs de routage.
  app.use("/api/trpc", (req, res) => {
    res.status(404).json(buildApiNotFoundPayload(req.path));
  });
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
