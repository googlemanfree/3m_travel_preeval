import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { candidateFiles, candidates } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireValidAdminSession } from "./adminAuth";
import {
  buildPassportIdentity,
  comparePassportWithCandidate,
  parsePassportIdentity,
  passportExpiryStatus,
  validatePassportIdentityInput,
  type PassportIdentity,
} from "../../shared/passportIdentity";

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ");

/**
 * Identité du passeport saisie par un agent : contrôle de validité et de cohérence avec la fiche candidat.
 * Aucune donnée n'est « lue » automatiquement : le résultat est une aide à la décision, jamais un rejet automatique.
 */
export const adminPassportIdentityRouter = router({
  get: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512), candidateId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const [candidate] = await db
        .select({ id: candidates.id, fullName: candidates.fullName, dateOfBirth: candidates.dateOfBirth })
        .from(candidates)
        .where(and(eq(candidates.id, input.candidateId), isNull(candidates.deletedAt)))
        .limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidat introuvable" });

      const files = await db
        .select({ id: candidateFiles.id, fileName: candidateFiles.fileName, status: candidateFiles.status, extractedData: candidateFiles.extractedData, uploadedAt: candidateFiles.uploadedAt })
        .from(candidateFiles)
        .where(and(eq(candidateFiles.candidateId, input.candidateId), eq(candidateFiles.fileType, "passeport")))
        .orderBy(desc(candidateFiles.uploadedAt))
        .limit(10);
      // Le passeport à contrôler est le plus récent qui n'est pas rejeté.
      const file = files.find((item) => item.status !== "rejected") ?? null;
      const identity = file ? parsePassportIdentity(file.extractedData) : null;

      return {
        candidate: { fullName: candidate.fullName, dateOfBirth: candidate.dateOfBirth ?? null },
        file: file ? { id: file.id, fileName: file.fileName, status: file.status } : null,
        identity,
        expiry: identity ? passportExpiryStatus(identity.expiryDate, new Date(), identity.plannedTravelDate) : null,
        discrepancies: identity ? comparePassportWithCandidate(candidate, identity) : [],
      };
    }),

  save: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1).max(512),
      candidateId: z.number().int().positive(),
      fileId: z.number().int().positive(),
      surname: z.string().trim().min(1).max(100),
      givenNames: z.string().trim().min(1).max(150),
      dateOfBirth: isoDate,
      passportNumber: z.string().trim().min(5).max(20),
      expiryDate: isoDate,
      plannedTravelDate: isoDate.nullish(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const now = new Date();
      const problem = validatePassportIdentityInput(
        { surname: input.surname, givenNames: input.givenNames, dateOfBirth: input.dateOfBirth, passportNumber: input.passportNumber, expiryDate: input.expiryDate, plannedTravelDate: input.plannedTravelDate ?? null },
        now,
      );
      if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });

      const [file] = await db
        .select({ id: candidateFiles.id, candidateId: candidateFiles.candidateId, fileType: candidateFiles.fileType })
        .from(candidateFiles)
        .where(eq(candidateFiles.id, input.fileId))
        .limit(1);
      if (!file || file.candidateId !== input.candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Passeport introuvable pour ce candidat" });
      if (file.fileType !== "passeport") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette pièce n'est pas un passeport." });

      const identity: PassportIdentity = buildPassportIdentity(
        { surname: input.surname, givenNames: input.givenNames, dateOfBirth: input.dateOfBirth, passportNumber: input.passportNumber, expiryDate: input.expiryDate, plannedTravelDate: input.plannedTravelDate ?? null },
        admin.email,
        now,
      );
      await db.update(candidateFiles).set({ extractedData: JSON.stringify(identity) }).where(eq(candidateFiles.id, input.fileId));
      return { success: true as const, identity, expiry: passportExpiryStatus(identity.expiryDate, now, identity.plannedTravelDate) };
    }),

  /** Passeports saisis dont la validité est insuffisante (expirés ou trop courts) : file d'alertes. */
  alerts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const rows = await db
        .select({ id: candidateFiles.id, candidateId: candidateFiles.candidateId, status: candidateFiles.status, extractedData: candidateFiles.extractedData, uploadedAt: candidateFiles.uploadedAt })
        .from(candidateFiles)
        .where(and(eq(candidateFiles.fileType, "passeport"), inArray(candidateFiles.status, ["uploaded", "verified"])))
        .orderBy(desc(candidateFiles.uploadedAt))
        .limit(2000);

      const now = new Date();
      const latestPerCandidate = new Map<number, (typeof rows)[number]>();
      for (const row of rows) if (!latestPerCandidate.has(row.candidateId)) latestPerCandidate.set(row.candidateId, row);

      const alerts: Array<{ candidateId: number; fileId: number; status: "expired" | "too_short"; daysLeft: number | null; expiryDate: string; message: string }> = [];
      for (const row of Array.from(latestPerCandidate.values())) {
        const identity = parsePassportIdentity(row.extractedData);
        if (!identity) continue;
        const expiry = passportExpiryStatus(identity.expiryDate, now, identity.plannedTravelDate);
        if (expiry.status === "expired" || expiry.status === "too_short") {
          alerts.push({ candidateId: row.candidateId, fileId: row.id, status: expiry.status, daysLeft: expiry.daysLeft, expiryDate: identity.expiryDate, message: expiry.message });
        }
      }
      alerts.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
      return { alerts: alerts.slice(0, 200), total: alerts.length };
    }),
});
