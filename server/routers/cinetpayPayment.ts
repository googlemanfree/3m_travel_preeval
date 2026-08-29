import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const DEFAULT_PAYMENT_AMOUNT = 65000;
const PAYMENT_CURRENCY = "XAF";

async function verifyWithCinetPay(transactionId: string) {
  const siteId = process.env.CINETPAY_SITE_ID;
  const apiKey = process.env.CINETPAY_API_KEY;
  if (!siteId || !apiKey) return { configured: false, accepted: false, paymentMethod: "", amount: undefined as number | undefined };

  try {
    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
    });
    const data = await response.json() as { code?: string; data?: { status?: string; payment_method?: string; amount?: number | string } };
    return {
      configured: true,
      accepted: data.code === "00" && data.data?.status === "ACCEPTED",
      paymentMethod: data.data?.payment_method ?? "",
      amount: data.data?.amount === undefined ? undefined : Number(data.data.amount),
    };
  } catch {
    return { configured: true, accepted: false, paymentMethod: "", amount: undefined as number | undefined };
  }
}

function ensureApplicationOwnership(application: typeof applications.$inferSelect, userId: number) {
  if (application.candidateId !== userId) {
    throw new Error("Accès non autorisé");
  }
}

export const cinetpayPaymentRouter = router({
  initiateDossierPayment: protectedProcedure
    .input(z.object({ dossierNumber: z.string().min(3) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [application] = await db.select().from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
      if (!application) return { success: false, error: "Dossier non trouvé" };
      try {
        ensureApplicationOwnership(application, ctx.user.id);
      } catch {
        return { success: false, error: "Accès non autorisé" };
      }
      if (application.paymentStatus === "SUCCESS") return { success: false, error: "Ce dossier a déjà été payé" };

      const transactionId = `3M-${application.dossierNumber}-${randomBytes(16).toString("hex")}`;
      const amount = application.paymentAmount ?? DEFAULT_PAYMENT_AMOUNT;
      await db.update(applications).set({
        paymentStatus: "PENDING",
        paymentTransactionId: transactionId,
        paymentAmount: amount,
        paymentCurrency: application.paymentCurrency ?? PAYMENT_CURRENCY,
        paymentMethod: null,
      }).where(eq(applications.id, application.id));

      return {
        success: true,
        transactionId,
        amount,
        currency: application.paymentCurrency ?? PAYMENT_CURRENCY,
        candidateName: application.fullName,
        email: application.email,
        dossierNumber: application.dossierNumber,
      };
    }),

  getDossierPaymentInfo: protectedProcedure
    .input(z.object({ dossierNumber: z.string().min(3) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [application] = await db.select().from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber)).limit(1);
      if (!application) return { success: false, error: "Dossier non trouvé" };
      try {
        ensureApplicationOwnership(application, ctx.user.id);
      } catch {
        return { success: false, error: "Accès non autorisé" };
      }
      return {
        success: true,
        dossierNumber: application.dossierNumber,
        candidateName: application.fullName,
        email: application.email,
        amount: application.paymentAmount ?? DEFAULT_PAYMENT_AMOUNT,
        currency: application.paymentCurrency ?? PAYMENT_CURRENCY,
        paymentStatus: application.paymentStatus,
      };
    }),

  verifyPaymentStatus: protectedProcedure
    .input(z.object({ transactionId: z.string().min(12) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [application] = await db.select().from(applications)
        .where(eq(applications.paymentTransactionId, input.transactionId)).limit(1);
      if (!application) return { success: false, error: "Transaction introuvable" };
      try {
        ensureApplicationOwnership(application, ctx.user.id);
      } catch {
        return { success: false, error: "Accès non autorisé" };
      }
      if (application.paymentStatus === "SUCCESS") return { success: true, status: "SUCCESS" as const };

      const verification = await verifyWithCinetPay(input.transactionId);
      if (!verification.configured) return { success: false, error: "Vérification CinetPay non configurée" };
      const amountMatches = verification.amount === undefined || verification.amount === (application.paymentAmount ?? DEFAULT_PAYMENT_AMOUNT);
      if (verification.accepted && amountMatches) {
        await db.update(applications).set({
          paymentStatus: "SUCCESS",
          paymentDate: new Date(),
          paymentMethod: verification.paymentMethod || null,
          dossierStatus: application.agreementSigned ? "paye" : application.dossierStatus,
        }).where(and(eq(applications.id, application.id), eq(applications.paymentStatus, "PENDING")));
        return { success: true, status: "SUCCESS" as const };
      }
      return { success: true, status: "PENDING" as const };
    }),

  getPaymentHistory: protectedProcedure
    .input(z.object({ dossierNumber: z.string().optional(), limit: z.number().int().min(1).max(50).default(10), offset: z.number().int().min(0).default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(applications)
        .where(eq(applications.candidateId, ctx.user.id))
        .orderBy(desc(applications.updatedAt))
        .limit(input.limit)
        .offset(input.offset);
      const filtered = input.dossierNumber ? rows.filter((row) => row.dossierNumber === input.dossierNumber) : rows;
      return {
        success: true,
        transactions: filtered.map((row) => ({
          transactionId: row.paymentTransactionId,
          dossierNumber: row.dossierNumber,
          status: row.paymentStatus,
          amount: row.paymentAmount ?? DEFAULT_PAYMENT_AMOUNT,
          currency: row.paymentCurrency ?? PAYMENT_CURRENCY,
          paymentDate: row.paymentDate,
        })),
        count: filtered.length,
      };
    }),

  getPaymentStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select().from(applications).where(eq(applications.candidateId, ctx.user.id));
    const successful = rows.filter((row) => row.paymentStatus === "SUCCESS");
    return {
      success: true,
      stats: {
        totalTransactions: rows.length,
        successfulPayments: successful.length,
        totalAmountPaid: successful.reduce((sum, row) => sum + (row.paymentAmount ?? DEFAULT_PAYMENT_AMOUNT), 0),
        pendingPayments: rows.filter((row) => row.paymentStatus === "PENDING").length,
        failedPayments: rows.filter((row) => row.paymentStatus === "FAILED").length,
      },
    };
  }),
});
