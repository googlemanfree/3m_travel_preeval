/**
 * Routeur tRPC — Dossiers d'immigration & Paiement CinetPay
 */

import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import type { Application } from "../../drizzle/schema";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, or, like, ilike } from "drizzle-orm";
import { sendDossierConfirmationEmail, sendAdminNewDossierAlert } from "../emailService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDossierNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `3M-${year}-${rand}`;
}

async function initCinetPayTransaction(params: {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
  siteId: string;
  apiKey: string;
}): Promise<{ paymentUrl: string }> {
  const payload = {
    apikey: params.apiKey,
    site_id: params.siteId,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: params.currency,
    alternative_currency: "",
    description: params.description,
    customer_id: params.customerEmail,
    customer_name: params.customerName,
    customer_surname: "",
    customer_email: params.customerEmail,
    customer_phone_number: params.customerPhone,
    customer_address: "Cameroun",
    customer_city: "Yaoundé",
    customer_country: "CM",
    customer_state: "CM",
    customer_zip_code: "00000",
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    channels: "ALL",
    metadata: "",
    lang: "fr",
    invoice_data: {},
  };

  const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as { code: string; message: string; data?: { payment_url: string } };

  if (data.code !== "201") {
    throw new Error(`CinetPay error: ${data.message}`);
  }

  return { paymentUrl: data.data?.payment_url ?? "" };
}

// ─── Routeur ──────────────────────────────────────────────────────────────────

export const applicationRouter = router({

  /** Créer un dossier et initialiser le paiement CinetPay */
  createApplication: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsappNumber: z.string().min(8),
      age: z.number().int().min(18).max(65).optional(),
      nationality: z.string().optional(),
      academicLevel: z.string().optional(),
      experienceYears: z.number().int().min(0).max(50).optional(),
      languageSkills: z.string().optional(),
      jobSector: z.string().optional(),
      destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]),
      formulaChosen: z.enum(["integral", "echelonne", "garanti"]).default("integral"),
      candidateId: z.number().int().optional(),
      // Documents uploadés
      passportUrl: z.string().url().optional(),
      cvUrl: z.string().url().optional(),
      diplomaUrl: z.string().url().optional(),
      // Scoring automatique
      scoringTotal: z.number().int().min(0).max(100).optional(),
      scoringDetails: z.string().optional(),  // JSON string
      scoringBadge: z.enum(["eligible", "admissible", "faible"]).optional(),
      // Informations complémentaires
      procedureId: z.string().optional(),
      procedureTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const siteId = process.env.CINETPAY_SITE_ID ?? "";
      const apiKey = process.env.CINETPAY_API_KEY ?? "";
      const baseUrl = process.env.APP_BASE_URL ?? "https://3mtravelagency.click";

      // Générer un numéro de dossier unique
      let dossierNumber = generateDossierNumber();
      let existing = await db.select().from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1);
      while (existing.length > 0) {
        dossierNumber = generateDossierNumber();
        existing = await db.select().from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1);
      }

      const transactionId = `${dossierNumber.replace(/-/g, "")}${Date.now()}`.slice(0, 50);

      await db.insert(applications).values({
        dossierNumber,
        candidateId: input.candidateId ?? null,
        fullName: input.fullName,
        email: input.email,
        whatsappNumber: input.whatsappNumber,
        age: input.age ?? null,
        nationality: input.nationality ?? null,
        academicLevel: input.academicLevel ?? null,
        experienceYears: input.experienceYears ?? null,
        languageSkills: input.languageSkills ?? null,
        jobSector: input.jobSector ?? null,
        destination: input.destination,
        formulaChosen: input.formulaChosen,
        paymentStatus: "PENDING",
        paymentTransactionId: transactionId,
        paymentAmount: 65000,
        paymentCurrency: "XAF",
        dossierStatus: "nouveau",
        // Documents uploadés
        passportUrl: input.passportUrl ?? null,
        cvUrl: input.cvUrl ?? null,
        diplomaUrl: input.diplomaUrl ?? null,
        // Scoring
        scoringTotal: input.scoringTotal ?? null,
        scoringDetails: input.scoringDetails ?? null,
        scoringBadge: input.scoringBadge ?? null,
      });

      // Envoyer les emails de confirmation (en arrière-plan, sans bloquer la réponse)
      const formulaLabels: Record<string, string> = {
        integral: "Paiement Intégral (65 000 FCFA)",
        echelonne: "Paiement Échelonné (3×25 000 FCFA)",
        garanti: "Permis Garanti (130 000 FCFA)",
      };
      const formulaLabel = formulaLabels[input.formulaChosen] ?? input.formulaChosen;
      Promise.all([
        sendDossierConfirmationEmail(input.email, input.fullName, dossierNumber, input.destination, formulaLabel, 65000),
        sendAdminNewDossierAlert(input.fullName, dossierNumber, input.email, input.whatsappNumber, input.destination, formulaLabel, "PENDING"),
      ]).catch(err => console.error("[Email] Notification error:", err));

      // Mode démo si pas de credentials CinetPay
      if (!siteId || !apiKey) {
        return {
          dossierNumber,
          transactionId,
          paymentUrl: null as string | null,
          demoMode: true,
          message: "Dossier créé (mode démo — CinetPay non configuré)",
        };
      }

      try {
        const result = await initCinetPayTransaction({
          transactionId,
          amount: 65000,
          currency: "XAF",
          description: `Ouverture dossier immigration 3M Travel — ${dossierNumber}`,
          customerName: input.fullName,
          customerEmail: input.email,
          customerPhone: input.whatsappNumber,
          returnUrl: `${baseUrl}/payment-success?dossier=${dossierNumber}`,
          notifyUrl: `${baseUrl}/api/cinetpay/webhook`,
          siteId,
          apiKey,
        });

        return {
          dossierNumber,
          transactionId,
          paymentUrl: result.paymentUrl as string | null,
          demoMode: false,
          message: "Dossier créé — redirection vers le paiement",
        };
      } catch (err) {
        console.error("[CinetPay] Init error:", err);
        return {
          dossierNumber,
          transactionId,
          paymentUrl: null as string | null,
          demoMode: true,
          message: "Dossier créé — paiement à effectuer manuellement",
        };
      }
    }),

  /** Récupérer un dossier par son numéro */
  getApplicationByDossierNumber: publicProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      return app;
    }),

  /** Récupérer les dossiers d'un candidat */
  getMyApplications: publicProcedure
    .input(z.object({ candidateId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      return db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, input.candidateId))
        .orderBy(desc(applications.createdAt));
    }),

  /** Lister tous les dossiers (admin) */
  listApplications: protectedProcedure
    .input(z.object({
      paymentStatus: z.enum(["ALL", "PENDING", "SUCCESS", "FAILED", "CANCELLED"]).default("ALL"),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const results: Application[] = await db
        .select()
        .from(applications)
        .orderBy(desc(applications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      let filtered = results;
      if (input.paymentStatus !== "ALL") {
        filtered = filtered.filter((a: Application) => a.paymentStatus === input.paymentStatus);
      }
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter((a: Application) =>
          a.fullName.toLowerCase().includes(s) ||
          a.email.toLowerCase().includes(s) ||
          a.dossierNumber.toLowerCase().includes(s) ||
          (a.whatsappNumber ?? "").includes(s)
        );
      }
      return filtered;
    }),

  /** Changer le statut d'un dossier (admin) */
  updateApplicationStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      dossierStatus: z.enum(["nouveau", "paye", "en_cours", "documents_requis", "soumis", "approuve", "refuse"]),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      await db.update(applications)
        .set({
          dossierStatus: input.dossierStatus,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        })
        .where(eq(applications.id, input.id));
      return { success: true };
    }),
});
