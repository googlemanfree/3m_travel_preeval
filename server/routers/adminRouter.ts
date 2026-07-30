import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { applications, candidateFiles, candidateMessages, dossierProgress } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";

export const adminRouter = router({
  /**
   * Récupérer tous les dossiers (admin seulement)
   */
  getAllApplications: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not connected");

    const allApps = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return allApps;
  }),

  /**
   * Récupérer les détails d'un dossier spécifique
   */
  getApplicationDetails: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const app = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .then((rows) => rows[0]);

      if (!app) throw new Error("Application not found");

      // Récupérer les documents
      const documents = await db
        .select()
        .from(candidateFiles)
        .where(eq(candidateFiles.candidateId, app.candidateId || 0));

      // Récupérer les messages
      const messages = await db
        .select()
        .from(candidateMessages)
        .where(eq(candidateMessages.candidateId, app.candidateId || 0))
        .orderBy(desc(candidateMessages.createdAt));

      // Récupérer la progression
      const progress = await db
        .select()
        .from(dossierProgress)
        .where(eq(dossierProgress.applicationId, input.applicationId))
        .then((rows) => rows[0]);

      return {
        ...app,
        documents,
        messages,
        progress,
      };
    }),

  /**
   * Mettre à jour le statut d'un dossier
   */
  updateApplicationStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        newStatus: z.enum([
          "nouveau",
          "en_evaluation",
          "bilan_envoye",
          "en_attente_paiement",
          "paye",
          "en_attente_documents",
          "documents_recus",
          "soumis_agences",
          "en_cours_recrutement",
          "contrat_obtenu",
          "visa_approuve",
          "refuse",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      await db
        .update(applications)
        .set({
          dossierStatus: input.newStatus as any,
          lastStatusUpdateAt: new Date(),
          lastStatusUpdatedBy: ctx.user?.name || "admin",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, input.applicationId));

      // Mettre à jour la progression
      const progress = await db
        .select()
        .from(dossierProgress)
        .where(eq(dossierProgress.applicationId, input.applicationId))
        .then((rows) => rows[0]);

      if (progress) {
        const stepMap: Record<string, number> = {
          nouveau: 1,
          en_evaluation: 2,
          bilan_envoye: 3,
          en_attente_paiement: 4,
          paye: 5,
          en_attente_documents: 6,
          documents_recus: 7,
          soumis_agences: 8,
          en_cours_recrutement: 9,
          contrat_obtenu: 9,
          visa_approuve: 10,
          refuse: 0,
        };

        await db
          .update(dossierProgress)
          .set({
            currentStep: stepMap[input.newStatus] || 0,
            updatedAt: new Date(),
          })
          .where(eq(dossierProgress.id, progress.id));
      }

      return { success: true };
    }),

  /**
   * Envoyer une notification au candidat
   */
  sendNotification: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      // Récupérer l'application et les infos du candidat
      const app = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .then((rows) => rows[0]);

      if (!app) throw new Error("Application not found");

      // TODO: Ajouter le message à la base de données
      // TODO: Envoyer l'email au candidat
      // TODO: Envoyer le message WhatsApp au candidat

      return { success: true };
    }),

  /**
   * Récupérer les statistiques du dashboard
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not connected");

    const allApps = await db.select().from(applications);

    const stats = {
      total: allApps.length,
      nouveau: allApps.filter((a) => a.dossierStatus === "nouveau").length,
      en_evaluation: allApps.filter((a) => a.dossierStatus === "en_evaluation").length,
      paye: allApps.filter((a) => a.dossierStatus === "paye").length,
      visa_approuve: allApps.filter((a) => a.dossierStatus === "visa_approuve").length,
      refuse: allApps.filter((a) => a.dossierStatus === "refuse").length,
    };

    return { stats };
  }),
});
