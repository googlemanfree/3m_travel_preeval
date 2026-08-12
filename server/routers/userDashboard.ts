/**
 * Routeur tRPC — Tableau de Bord Utilisateur
 * Récupère l'historique des paiements, le statut des documents et les infos du dossier
 */

import { getDb } from "../db";
import { applications, candidateFiles } from "../../drizzle/schema";
// import { clientDocuments } from "../../drizzle/schema"; // Table supprimée
import { publicProcedure, router } from "../_core/trpc";
import { candidateProcedure } from "./candidate";
import { getDocumentStatusCounts, toDisplayDocumentStatus } from "../services/documentStatus";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, or, desc } from "drizzle-orm";

export const userDashboardRouter = router({
  /**
   * Récupérer l'historique des paiements pour un dossier
   */
  getPaymentHistory: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      // Construire l'historique des paiements
      const paymentHistory = [
        {
          id: 1,
          date: app.createdAt || new Date(),
          type: "OUVERTURE_DOSSIER",
          amount: app.paymentAmount || 65000,
          currency: app.paymentCurrency || "XAF",
          status: app.paymentStatus || "PENDING",
          transactionId: app.paymentTransactionId || null,
          description: "Frais d'ouverture de dossier immigration",
          method: app.paymentMethod || null,
        },
      ];

      return {
        dossierNumber: input.dossierNumber,
        totalAmount: app.paymentAmount || 65000,
        totalPaid: app.paymentStatus === "SUCCESS" ? (app.paymentAmount || 65000) : 0,
        paymentStatus: app.paymentStatus || "PENDING",
        paymentHistory,
      };
    }),

  /**
   * Récupérer le statut des documents soumis
   */
  getDocumentsStatus: candidateProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [app] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(and(
          eq(applications.dossierNumber, input.dossierNumber),
          or(eq(applications.candidateId, ctx.candidate.id), eq(applications.email, ctx.candidate.email)),
        ))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable ou non autorisé" });

      const documents = await db
        .select()
        .from(candidateFiles)
        .where(eq(candidateFiles.candidateId, ctx.candidate.id))
        .orderBy(desc(candidateFiles.uploadedAt));

      const statusCounts = getDocumentStatusCounts(documents);

      return {
        dossierNumber: input.dossierNumber,
        ...statusCounts,
        documents: documents.map(d => ({
          id: d.id,
          type: d.fileType,
          name: d.fileName,
          status: toDisplayDocumentStatus(d.status),
          submittedAt: d.uploadedAt,
          verifiedAt: d.status === "verified" ? d.uploadedAt : null,
          rejectionReason: d.rejectionReason || null,
          url: d.fileUrl,
        })),
      };
    }),

  /**
   * Récupérer les infos synthétiques du dossier
   */
  getDossierOverview: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      // Récupérer les documents pour calculer la progression (stub pour maintenant)
      const documents: any[] = [];

      const verifiedCount = documents.filter(d => d.status === "verified").length;

      // Déterminer l'étape actuelle du dossier
      let currentStep = "Création";
      let stepProgress = 0;

      if (app.paymentStatus === "SUCCESS") {
        currentStep = "Paiement confirmé";
        stepProgress = 25;
      }
      if (documents.length > 0) {
        currentStep = "Documents en cours";
        stepProgress = 50;
      }
      if (verifiedCount === documents.length && documents.length > 0) {
        currentStep = "Documents validés";
        stepProgress = 75;
      }
      if (app.dossierStatus === "en_evaluation") {
        currentStep = "En évaluation";
        stepProgress = 85;
      }
      if (app.dossierStatus === "bilan_envoye") {
        currentStep = "Bilan disponible";
        stepProgress = 100;
      }

      return {
        dossierNumber: input.dossierNumber,
        fullName: app.fullName,
        email: app.email,
        destination: app.destination,
        formulaChosen: app.formulaChosen,
        createdAt: app.createdAt,
        paymentStatus: app.paymentStatus,
        dossierStatus: app.dossierStatus,
        currentStep,
        stepProgress,
        scoringBadge: app.scoringBadge,
        scoringTotal: app.scoringTotal,
      };
    }),
});
