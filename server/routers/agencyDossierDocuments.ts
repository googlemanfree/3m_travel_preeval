import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { agencyDossierDocuments, agencyDossierHistory, agencyDossiers } from "../../drizzle/schema";
import { getDb } from "../db";
import { storageGetSignedUrl } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const adminOnly = (role: string | null | undefined): void => {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès administrateur requis" });
  }
};

export const agencyDossierDocumentsRouter = router({
  listForAdmin: protectedProcedure
    .input(z.object({
      dossierId: z.number().int().positive(),
      verificationStatus: z.enum(["pending", "verified", "rejected"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const where = input.verificationStatus
        ? and(eq(agencyDossierDocuments.dossierId, input.dossierId), eq(agencyDossierDocuments.verificationStatus, input.verificationStatus))
        : eq(agencyDossierDocuments.dossierId, input.dossierId);
      const documents = await db.select().from(agencyDossierDocuments).where(where).orderBy(desc(agencyDossierDocuments.createdAt));
      const documentsWithPrivateUrls = await Promise.all(documents.map(async document => ({
        ...document,
        documentUrl: await storageGetSignedUrl(document.documentUrl.replace(/^\/manus-storage\//, "")),
      })));
      return { documents: documentsWithPrivateUrls };
    }),

  updateVerificationStatus: protectedProcedure
    .input(z.object({
      documentId: z.number().int().positive(),
      verificationStatus: z.enum(["pending", "verified", "rejected"]),
      verificationComment: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const [document] = await db.select().from(agencyDossierDocuments).where(eq(agencyDossierDocuments.id, input.documentId)).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
      const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, document.dossierId)).limit(1);
      if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      await db.update(agencyDossierDocuments).set({
        verificationStatus: input.verificationStatus,
        verificationComment: input.verificationComment || null,
      }).where(eq(agencyDossierDocuments.id, input.documentId));

      await db.insert(agencyDossierHistory).values({
        dossierId: document.dossierId,
        action: "document_status_changed",
        changedBy: ctx.user?.email || "admin",
        oldValue: document.verificationStatus,
        newValue: input.verificationStatus,
        details: input.verificationComment || `Document ${document.documentName} : statut mis à jour`,
      });

      return { success: true };
    }),
});
