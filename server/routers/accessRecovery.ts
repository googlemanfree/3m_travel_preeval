import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { candidateAccessRecoveryEvents, candidateAccessRecoveryRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

const recoveryStatuses = ["pending", "reviewing", "identity_verified", "rejected", "closed"] as const;

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export const accessRecoveryRouter = router({
  /**
   * La demande ne confirme jamais l’existence d’un compte ou d’un dossier. Elle
   * rejoint une file humaine sans modifier une adresse, un mot de passe ou une session.
   */
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().trim().min(2).max(255),
      dossierNumber: z.string().trim().max(40).optional(),
      newEmail: z.string().trim().email().max(320),
      phone: z.string().trim().min(6).max(50),
      preferredContact: z.enum(["phone", "whatsapp", "email"]),
      details: z.string().trim().max(500).optional(),
      website: z.string().max(0).optional(), // champ leurre : aucune information ni appel externe
    }))
    .mutation(async ({ input }) => {
      if (input.website) return { accepted: true } as const;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service temporairement indisponible." });
      const newEmail = input.newEmail.toLowerCase();
      const phone = normalize(input.phone);
      const fullName = normalize(input.fullName);

      // Évite les demandes identiques répétées sans révéler l’état d’un compte.
      const [pending] = await db.select({ id: candidateAccessRecoveryRequests.id })
        .from(candidateAccessRecoveryRequests)
        .where(eq(candidateAccessRecoveryRequests.newEmail, newEmail))
        .orderBy(desc(candidateAccessRecoveryRequests.createdAt))
        .limit(1);
      if (!pending) {
        await db.insert(candidateAccessRecoveryRequests).values({
          fullName,
          dossierNumber: input.dossierNumber ? normalize(input.dossierNumber).toUpperCase() : null,
          newEmail,
          phone,
          preferredContact: input.preferredContact,
          details: input.details ? normalize(input.details) : null,
          status: "pending",
        });
      }
      return { accepted: true } as const;
    }),

  list: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), status: z.enum([...recoveryStatuses, "all"]).default("pending") }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const select = db.select({
        id: candidateAccessRecoveryRequests.id,
        fullName: candidateAccessRecoveryRequests.fullName,
        dossierNumber: candidateAccessRecoveryRequests.dossierNumber,
        newEmail: candidateAccessRecoveryRequests.newEmail,
        phone: candidateAccessRecoveryRequests.phone,
        preferredContact: candidateAccessRecoveryRequests.preferredContact,
        details: candidateAccessRecoveryRequests.details,
        status: candidateAccessRecoveryRequests.status,
        reviewedBy: candidateAccessRecoveryRequests.reviewedBy,
        reviewedAt: candidateAccessRecoveryRequests.reviewedAt,
        reviewNote: candidateAccessRecoveryRequests.reviewNote,
        createdAt: candidateAccessRecoveryRequests.createdAt,
      }).from(candidateAccessRecoveryRequests);
      return input.status === "all"
        ? select.orderBy(desc(candidateAccessRecoveryRequests.createdAt))
        : select.where(eq(candidateAccessRecoveryRequests.status, input.status)).orderBy(desc(candidateAccessRecoveryRequests.createdAt));
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return db.select({
        id: candidateAccessRecoveryEvents.id,
        action: candidateAccessRecoveryEvents.action,
        note: candidateAccessRecoveryEvents.note,
        adminEmail: candidateAccessRecoveryEvents.adminEmail,
        createdAt: candidateAccessRecoveryEvents.createdAt,
      }).from(candidateAccessRecoveryEvents)
        .where(eq(candidateAccessRecoveryEvents.requestId, input.requestId))
        .orderBy(desc(candidateAccessRecoveryEvents.createdAt));
    }),

  review: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      requestId: z.number().int().positive(),
      status: z.enum(["reviewing", "identity_verified", "rejected", "closed"]),
      reviewNote: z.string().trim().min(10).max(500),
      identityVerifiedInPerson: z.literal(true).optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      if (input.status === "identity_verified" && input.identityVerifiedInPerson !== true) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Confirmez la vérification humaine de l’identité avant d’enregistrer ce statut." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [request] = await db.select({ id: candidateAccessRecoveryRequests.id }).from(candidateAccessRecoveryRequests)
        .where(eq(candidateAccessRecoveryRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });

      const now = new Date();
      const note = normalize(input.reviewNote);
      await db.update(candidateAccessRecoveryRequests).set({
        status: input.status,
        reviewedBy: admin.email,
        reviewedAt: now,
        reviewNote: note,
      }).where(eq(candidateAccessRecoveryRequests.id, request.id));
      await db.insert(candidateAccessRecoveryEvents).values({
        requestId: request.id,
        adminEmail: admin.email,
        action: input.status,
        note,
      });
      return { success: true } as const;
    }),
});
