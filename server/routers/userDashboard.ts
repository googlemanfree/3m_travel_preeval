/**
 * Routeur tRPC — Tableau de Bord Utilisateur
 * Récupère l'historique des paiements, le statut des documents et les infos du dossier
 */

import { getDb } from "../db";
import { applications, candidateFiles } from "../../drizzle/schema";
// import { clientDocuments } from "../../drizzle/schema"; // Table supprimée
import { router } from "../_core/trpc";
import { candidateProcedure } from "./candidate";
import { getDocumentStatusCounts, toDisplayDocumentStatus } from "../services/documentStatus";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, or, desc } from "drizzle-orm";

export const userDashboardRouter = router({
  // `getPaymentHistory` et `getDossierOverview` ont été RETIRÉES (la seconde avec son composant orphelin
  // `DossierOverview`) : publiques, elles livraient nom, e-mail, transaction et statut de paiement à partir du
  // seul numéro de dossier `3M-AAAA-NNNN`, énumérable. Le candidat utilise `candidate.*`.

  /**
   * Récupérer le statut des documents soumis
   */
  getDocumentsStatus: candidateProcedure
    .input(z.object({
      dossierNumber: z.string().max(50),
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
        .orderBy(desc(candidateFiles.uploadedAt))
        .limit(200);

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
});
