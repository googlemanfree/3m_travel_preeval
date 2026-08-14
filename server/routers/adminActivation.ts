import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { candidates, emailDeliveryLogs } from "../../drizzle/schema";
import { requireValidAdminSession } from "./adminAuth";
import { issueVerificationToken } from "./candidate";
import { sendVerificationLink } from "../emailService";

const activationSubject = "%Confirmez votre email%";

const listInput = z.object({
  sessionToken: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(25),
  status: z.enum(["all", "pending", "failed", "expired"]).default("all"),
  search: z.string().trim().max(120).default(""),
});

export function classifyEmailError(errorDetails: string | null | undefined) {
  const value = String(errorDetails || "").toLowerCase();
  if (!value) return null;
  if (value.includes("recipient") || value.includes("invalid email") || value.includes("invalid `to`")) return "destinataire_invalide";
  if (value.includes("domain") || value.includes("verify") || value.includes("verified")) return "domaine_non_verifie";
  if (value.includes("rate limit") || value.includes("too many")) return "limite_envoi";
  if (value.includes("authentication") || value.includes("unauthorized") || value.includes("api key")) return "configuration";
  return "erreur_envoi";
}

export function getActivationStatus(candidate: { emailVerified: boolean; verificationExpiresAt: Date | null }, log?: { status: string }) {
  if (log?.status === "failed") return "failed" as const;
  if (!candidate.verificationExpiresAt || candidate.verificationExpiresAt.getTime() <= Date.now()) return "expired" as const;
  return "pending" as const;
}

export const adminActivationRouter = router({
  exportCsv: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), status: z.enum(["all", "pending", "failed", "expired"]).default("all") }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [candidateRows, activationLogs] = await Promise.all([
        db.select({
          id: candidates.id,
          fullName: candidates.fullName,
          email: candidates.email,
          emailVerified: candidates.emailVerified,
          createdAt: candidates.createdAt,
          updatedAt: candidates.updatedAt,
          verificationExpiresAt: candidates.verificationExpiresAt,
        }).from(candidates).where(eq(candidates.emailVerified, false)).orderBy(desc(candidates.updatedAt)).limit(10000),
        db.select({
          recipientEmail: emailDeliveryLogs.recipientEmail,
          status: emailDeliveryLogs.status,
          errorDetails: emailDeliveryLogs.errorDetails,
          providerMessageId: emailDeliveryLogs.providerMessageId,
          createdAt: emailDeliveryLogs.createdAt,
        }).from(emailDeliveryLogs).where(like(emailDeliveryLogs.subject, activationSubject)).orderBy(desc(emailDeliveryLogs.createdAt)).limit(10000),
      ]);

      const latestLogByEmail = new Map<string, (typeof activationLogs)[number]>();
      for (const log of activationLogs) {
        const key = log.recipientEmail.toLowerCase();
        if (!latestLogByEmail.has(key)) latestLogByEmail.set(key, log);
      }

      const rows = candidateRows.map((candidate) => {
        const latestLog = latestLogByEmail.get(candidate.email.toLowerCase());
        const activationStatus = getActivationStatus(candidate, latestLog);
        return {
          fullName: candidate.fullName,
          email: candidate.email,
          activationStatus,
          lastEmailStatus: latestLog?.status ?? "not_sent",
          lastEmailError: latestLog?.errorDetails ? classifyEmailError(latestLog.errorDetails) : "aucun",
          createdAt: candidate.createdAt ? new Date(candidate.createdAt).toISOString() : "",
          expiresAt: candidate.verificationExpiresAt ? new Date(candidate.verificationExpiresAt).toISOString() : "",
        };
      }).filter((row) => input.status === "all" || row.activationStatus === input.status);

      const header = ["Nom complet", "Email", "Statut", "Dernier statut email", "Erreur", "Création", "Expiration"];
      const csvLines = [
        header.join(";"),
        ...rows.map((r) => [
          `"${r.fullName.replace(/"/g, '""')}"`,
          `"${r.email.replace(/"/g, '""')}"`,
          r.activationStatus,
          r.lastEmailStatus,
          r.lastEmailError,
          r.createdAt,
          r.expiresAt,
        ].join(";")),
      ];

      return { csvContent: csvLines.join("\n"), total: rows.length, exportedBy: admin.email };
    }),

  list: publicProcedure.input(listInput).query(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    const candidateFilters = [
      eq(candidates.emailVerified, false),
      input.search
        ? or(
            like(candidates.fullName, `%${input.search}%`),
            like(candidates.email, `%${input.search}%`),
          )
        : undefined,
    ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[];

    const [candidateRows, activationLogs] = await Promise.all([
      db.select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        emailVerified: candidates.emailVerified,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
        verificationExpiresAt: candidates.verificationExpiresAt,
      }).from(candidates).where(and(...candidateFilters)).orderBy(desc(candidates.updatedAt)).limit(5000),
      db.select({
        recipientEmail: emailDeliveryLogs.recipientEmail,
        status: emailDeliveryLogs.status,
        errorDetails: emailDeliveryLogs.errorDetails,
        providerMessageId: emailDeliveryLogs.providerMessageId,
        createdAt: emailDeliveryLogs.createdAt,
      }).from(emailDeliveryLogs).where(like(emailDeliveryLogs.subject, activationSubject)).orderBy(desc(emailDeliveryLogs.createdAt)).limit(10000),
    ]);

    const latestLogByEmail = new Map<string, (typeof activationLogs)[number]>();
    for (const log of activationLogs) {
      const key = log.recipientEmail.toLowerCase();
      if (!latestLogByEmail.has(key)) latestLogByEmail.set(key, log);
    }

    const rows = candidateRows.map((candidate) => {
      const latestLog = latestLogByEmail.get(candidate.email.toLowerCase());
      const activationStatus = getActivationStatus(candidate, latestLog);
      return {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        verificationExpiresAt: candidate.verificationExpiresAt,
        activationStatus,
        lastEmailStatus: latestLog?.status ?? "not_sent",
        lastEmailAt: latestLog?.createdAt ?? null,
        lastEmailErrorType: classifyEmailError(latestLog?.errorDetails),
        hasProviderMessageId: Boolean(latestLog?.providerMessageId),
      };
    }).filter((row) => input.status === "all" || row.activationStatus === input.status);

    const offset = (input.page - 1) * input.pageSize;
    return {
      rows: rows.slice(offset, offset + input.pageSize),
      total: rows.length,
      page: input.page,
      pageSize: input.pageSize,
      pages: Math.max(1, Math.ceil(rows.length / input.pageSize)),
      counts: {
        pending: rows.filter((row) => row.activationStatus === "pending").length,
        failed: rows.filter((row) => row.activationStatus === "failed").length,
        expired: rows.filter((row) => row.activationStatus === "expired").length,
      },
      viewer: { id: admin.id, email: admin.email },
    };
  }),

  resend: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), candidateId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [candidate] = await db.select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: candidates.email,
        emailVerified: candidates.emailVerified,
        verificationExpiresAt: candidates.verificationExpiresAt,
      }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
      if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidat introuvable." });
      if (candidate.emailVerified) throw new TRPCError({ code: "CONFLICT", message: "Ce compte est déjà activé." });

      const recentLogs = await db.select({
        createdAt: emailDeliveryLogs.createdAt,
      }).from(emailDeliveryLogs).where(
        and(
          like(emailDeliveryLogs.subject, activationSubject),
          like(emailDeliveryLogs.recipientEmail, candidate.email)
        )
      ).orderBy(desc(emailDeliveryLogs.createdAt)).limit(1);

      if (recentLogs.length > 0) {
        const lastSent = new Date(recentLogs[0].createdAt).getTime();
        const cooldownMs = 60 * 1000;
        if (Date.now() - lastSent < cooldownMs) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Veuillez patienter 60 secondes entre chaque renvoi pour éviter le spam e-mail.",
          });
        }
      }

      const { rawToken, tokenHash } = issueVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.update(candidates).set({ verificationToken: tokenHash, verificationExpiresAt: expiresAt }).where(eq(candidates.id, candidate.id));

      try {
        await sendVerificationLink(candidate.email, candidate.fullName, rawToken);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le renvoi du lien a échoué. Consultez le statut d’envoi avant de réessayer." });
      }

      return { success: true, candidateId: candidate.id, expiresAt };
    }),

  checkAlerts: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const failedLogs = await db.select({
        recipientEmail: emailDeliveryLogs.recipientEmail,
        errorDetails: emailDeliveryLogs.errorDetails,
      }).from(emailDeliveryLogs).where(
        and(
          like(emailDeliveryLogs.subject, activationSubject),
          eq(emailDeliveryLogs.status, "failed")
        )
      ).orderBy(desc(emailDeliveryLogs.createdAt)).limit(100);

      const failureCountByEmail = new Map<string, number>();
      for (const log of failedLogs) {
        const key = log.recipientEmail.toLowerCase();
        failureCountByEmail.set(key, (failureCountByEmail.get(key) || 0) + 1);
      }

      const repeatedFailures = Array.from(failureCountByEmail.entries())
        .filter(([_, count]) => count >= 2)
        .map(([email, count]) => ({ email, count }));

      return {
        hasAlerts: repeatedFailures.length > 0,
        repeatedFailures,
      };
    }),
});
