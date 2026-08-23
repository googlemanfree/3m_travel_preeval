/**
 * Routeur tRPC — Dossiers d'immigration & Paiement CinetPay
 */

import { getDb } from "../db";
import { applications, aiReportHistory, candidateFiles, paymentAuditLogs } from "../../drizzle/schema";
import type { Application } from "../../drizzle/schema";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, desc, inArray, or, like, ilike } from "drizzle-orm";
import { sendClientDossierConfirmationEmail, sendAdminNewDossierAlertEmail, sendVerificationOtp, sendEvisaStatusUpdateEmail } from "../emailService";
import { sendEmail as sendGenericEmail } from "../_core/email";
import { generateEvaluationReportHTML } from "../evaluationService";
import { extractTextFromPDF, generateAIEvaluationReport } from "../aiEvaluationService";
import { randomBytes, randomInt } from "node:crypto";
import { candidateProcedure } from "./candidate";
import { caseApplicants, caseStatusHistory, cases, clientNotifications, documentRequirements } from "../../drizzle/caseTrackingSchema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateEvaluationDraftReference(): string {
  const year = new Date().getFullYear();
  const rand = randomInt(100000, 1000000);
  return `EVAL-DRAFT-${year}-${rand}`;
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
  createApplication: candidateProcedure
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
      // État civil complet
      dateOfBirth: z.string().optional(),
      placeOfBirth: z.string().optional(),
      gender: z.enum(["homme", "femme", "autre"]).optional(),
      maritalStatus: z.enum(["celibataire", "marie", "divorce", "veuf", "union_libre"]).optional(),
      currentAddress: z.string().optional(),
      currentCity: z.string().optional(),
      currentCountry: z.string().optional(),
      // Études & Diplômes
      diplomaTitle: z.string().optional(),
      diplomaInstitution: z.string().optional(),
      diplomaYear: z.number().int().optional(),
      fieldOfStudy: z.string().optional(),
      // Situation professionnelle
      currentEmployer: z.string().optional(),
      currentJobTitle: z.string().optional(),
      monthlyIncome: z.number().int().optional(),
      bankBalance: z.number().int().optional(),
      // Ressources financières
      hasSponsorship: z.boolean().optional(),
      sponsorName: z.string().optional(),
      sponsorRelation: z.string().optional(),
      // Situation familiale
      numberOfChildren: z.number().int().min(0).optional(),
      spouseFullName: z.string().optional(),
      spouseNationality: z.string().optional(),
      familyMemberInDestination: z.boolean().optional(),
      familyMemberRelation: z.string().optional(),
      familyMemberStatus: z.string().optional(),
      // Type de visa
      visaType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      if (input.email.trim().toLowerCase() !== ctx.candidate.email.trim().toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Le dossier doit être créé avec l’adresse e-mail de votre compte." });
      }
      const siteId = process.env.CINETPAY_SITE_ID ?? "";
      const apiKey = process.env.CINETPAY_API_KEY ?? "";
      const baseUrl = process.env.APP_BASE_URL ?? "https://3mtravelagency.click";

      // La demande reçoit une référence interne. Le numéro de dossier client est attribué uniquement après validation humaine du bilan.
      let dossierNumber = generateEvaluationDraftReference();
      let existing = await db.select().from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1);
      while (existing.length > 0) {
        dossierNumber = generateEvaluationDraftReference();
        existing = await db.select().from(applications).where(eq(applications.dossierNumber, dossierNumber)).limit(1);
      }

      const transactionId = `${dossierNumber.replace(/-/g, "")}${Date.now()}`.slice(0, 50);

      // Générer un OTP à 6 chiffres pour la vérification email
      const emailOtp = randomInt(100000, 1000000).toString();
      const emailOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 minutes

      const [insertResult] = await db.insert(applications).values({
        dossierNumber,
        candidateId: ctx.candidate.id,
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
        // Vérification email
        emailVerified: false,
        emailOtp,
        emailOtpExpiresAt,
        // État civil complet
        dateOfBirth: input.dateOfBirth ?? null,
        placeOfBirth: input.placeOfBirth ?? null,
        gender: input.gender ?? null,
        maritalStatus: input.maritalStatus ?? null,
        currentAddress: input.currentAddress ?? null,
        currentCity: input.currentCity ?? null,
        currentCountry: input.currentCountry ?? null,
        // Études & Diplômes
        diplomaTitle: input.diplomaTitle ?? null,
        diplomaInstitution: input.diplomaInstitution ?? null,
        diplomaYear: input.diplomaYear ?? null,
        fieldOfStudy: input.fieldOfStudy ?? null,
        // Situation professionnelle
        currentEmployer: input.currentEmployer ?? null,
        currentJobTitle: input.currentJobTitle ?? null,
        monthlyIncome: input.monthlyIncome ?? null,
        bankBalance: input.bankBalance ?? null,
        // Ressources financières
        hasSponsorship: input.hasSponsorship ?? false,
        sponsorName: input.sponsorName ?? null,
        sponsorRelation: input.sponsorRelation ?? null,
        // Situation familiale
        numberOfChildren: input.numberOfChildren ?? 0,
        spouseFullName: input.spouseFullName ?? null,
        spouseNationality: input.spouseNationality ?? null,
        familyMemberInDestination: input.familyMemberInDestination ?? false,
        familyMemberRelation: input.familyMemberRelation ?? null,
        familyMemberStatus: input.familyMemberStatus ?? null,
        // Type de visa
        visaType: input.visaType ?? null,
      });

      // Envoyer l'OTP au candidat
      Promise.resolve().then(() => sendVerificationOtp(input.email, input.fullName, emailOtp))
        .catch(err => console.error("[Email] OTP send error:", err));

      // Envoyer l'email de confirmation au candidat
      Promise.resolve().then(() => sendClientDossierConfirmationEmail(
        input.email,
        input.fullName,
        dossierNumber,
        input.destination,
        65000, // Montant en FCFA
        "XAF"
      )).catch(err => console.error("[Email] Dossier confirmation error:", err));

      // Envoyer l'alerte admin
      Promise.resolve().then(() => sendAdminNewDossierAlertEmail(
        dossierNumber,
        input.fullName,
        input.destination,
        65000,
        "XAF"
      )).catch(err => console.error("[Email] Admin alert error:", err));

      // Récupérer l'ID de l'application insérée
      const [newApp] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.dossierNumber, dossierNumber))
        .limit(1);

      if (newApp) {
        const [caseInsert] = await db.insert(cases).values({
          caseNumber: dossierNumber,
          candidateId: ctx.candidate.id,
          legacyApplicationId: newApp.id,
          sourceChannel: "online",
          countryTarget: input.destination,
          caseType: input.formulaChosen,
          visaType: input.visaType ?? null,
          currentStatus: "nouveau",
          openedAt: new Date(),
        });
        const caseId = Number(caseInsert.insertId);
        await Promise.all([
          db.insert(caseApplicants).values({ caseId, relationshipType: "principal", fullName: input.fullName, nationality: input.nationality ?? null }),
          db.insert(caseStatusHistory).values({ caseId, newStatus: "nouveau", changedByRole: "candidate", changedById: ctx.candidate.id, comment: "Dossier créé depuis l’espace candidat." }),
          db.insert(clientNotifications).values({ candidateId: ctx.candidate.id, caseId, type: "case_created", title: "Votre dossier est ouvert", body: `Votre dossier ${dossierNumber} a été créé. La vérification de votre e-mail est la prochaine étape.`, actionUrl: "/suivi-client" }),
        ]);
      }

      return {
        applicationId: newApp?.id ?? 0,
        dossierNumber,
        transactionId,
        requiresEmailVerification: true,
        paymentUrl: null, // Sera généré après vérification OTP
        message: "Dossier créé — vérification email requise avant paiement",
      };
    }),

  /** Renvoyer l'OTP si expiré */
  resendApplicationOtp: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (app.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "Email déjà vérifié" });

      // Générer un nouvel OTP
      const emailOtp = randomInt(100000, 1000000).toString();
      const emailOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 minutes

      await db.update(applications)
        .set({ emailOtp, emailOtpExpiresAt })
        .where(eq(applications.dossierNumber, input.dossierNumber));

      // Envoyer le nouvel OTP
      Promise.resolve().then(() => sendVerificationOtp(app.email, app.fullName, emailOtp))
        .catch(err => console.error("[Email] OTP resend error:", err));

      return {
        dossierNumber: input.dossierNumber,
        message: "Nouveau code OTP envoyé par email",
      };
    }),

  /** Vérifier l'OTP et initialiser le paiement CinetPay */
  verifyApplicationOtp: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
      otp: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const siteId = process.env.CINETPAY_SITE_ID ?? "";
      const apiKey = process.env.CINETPAY_API_KEY ?? "";
      const baseUrl = process.env.APP_BASE_URL ?? "https://3mtravelagency.click";

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (app.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "Email déjà vérifié" });
      if (app.emailOtp !== input.otp) throw new TRPCError({ code: "BAD_REQUEST", message: "Code OTP invalide" });
      if (!app.emailOtpExpiresAt || app.emailOtpExpiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code OTP expiré (15 minutes)" });
      }

      // Marquer l'email comme vérifié
      await db.update(applications)
        .set({ emailVerified: true, emailOtp: null, emailOtpExpiresAt: null })
        .where(eq(applications.dossierNumber, input.dossierNumber));

      // Initialiser le paiement CinetPay
      if (!siteId || !apiKey) {
        return {
          dossierNumber: input.dossierNumber,
          paymentUrl: null as string | null,
          demoMode: true,
          message: "Email vérifié (mode démo — CinetPay non configuré)",
        };
      }

      try {
        const result = await initCinetPayTransaction({
          transactionId: app.paymentTransactionId ?? "",
          amount: 65000,
          currency: "XAF",
          description: `Ouverture dossier immigration 3M Travel — ${input.dossierNumber}`,
          customerName: app.fullName,
          customerEmail: app.email,
          customerPhone: app.whatsappNumber,
          returnUrl: `${baseUrl}/payment-success?dossier=${input.dossierNumber}`,
          notifyUrl: `${baseUrl}/api/cinetpay/webhook`,
          siteId,
          apiKey,
        });

        return {
          dossierNumber: input.dossierNumber,
          paymentUrl: result.paymentUrl as string | null,
          demoMode: false,
          message: "Email vérifié — redirection vers le paiement",
        };
      } catch (err) {
        console.error("[CinetPay] Init error:", err);
        return {
          dossierNumber: input.dossierNumber,
          paymentUrl: null as string | null,
          demoMode: true,
          message: "Email vérifié — paiement à effectuer manuellement",
        };
      }
    }),

  /** Initier un paiement CinetPay direct depuis la progression */
  initiateCinetPayPayment: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
      email: z.string().email(),
      paymentMethod: z.enum(["mtn", "orange", "card"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const siteId = process.env.CINETPAY_SITE_ID ?? "";
      const apiKey = process.env.CINETPAY_API_KEY ?? "";
      const baseUrl = process.env.APP_BASE_URL ?? "https://3mtravelagency.click";

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (app.paymentStatus === "SUCCESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Paiement déjà effectué" });
      if (app.email.toLowerCase() !== input.email.trim().toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Les informations de dossier ne correspondent pas." });
      }

      // Initialiser le paiement CinetPay
      if (!siteId || !apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le paiement en ligne est temporairement indisponible." });
      }

      try {
        const transactionId = app.paymentTransactionId ?? `3M-${app.dossierNumber}-${randomBytes(16).toString("hex")}`;
        const amount = app.paymentAmount ?? 65000;
        const result = await initCinetPayTransaction({
          transactionId,
          amount,
          currency: "XAF",
          description: `Paiement dossier immigration 3M Travel — ${input.dossierNumber}`,
          customerName: app.fullName,
          customerEmail: input.email,
          customerPhone: app.whatsappNumber,
          returnUrl: `${baseUrl}/payment-success?dossier=${input.dossierNumber}`,
          notifyUrl: `${baseUrl}/api/cinetpay/webhook`,
          siteId,
          apiKey,
        });

        await db.update(applications).set({
          paymentStatus: "PENDING",
          paymentTransactionId: transactionId,
          paymentAmount: amount,
          paymentCurrency: "XAF",
          paymentMethod: null,
        }).where(eq(applications.id, app.id));

        return {
          dossierNumber: input.dossierNumber,
          paymentUrl: result.paymentUrl as string | null,
          message: "Paiement initié",
        };
      } catch (err) {
        console.error("[CinetPay] Init error:", err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Impossible d’initialiser le paiement sécurisé." });
      }
    }),

  /** Initier le paiement du dossier courant sans exposer l’e-mail ni le numéro à un endpoint public */
  initiateMyCinetPayPayment: candidateProcedure
    .input(z.object({ paymentMethod: z.enum(["mtn", "orange", "card"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const siteId = process.env.CINETPAY_SITE_ID ?? "";
      const apiKey = process.env.CINETPAY_API_KEY ?? "";
      const baseUrl = process.env.APP_BASE_URL ?? "https://www.3mtravelagency.com";
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, ctx.candidate.id))
        .orderBy(desc(applications.createdAt))
        .limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun dossier en ligne trouvé pour votre compte." });
      if (app.paymentStatus === "SUCCESS") throw new TRPCError({ code: "BAD_REQUEST", message: "Les frais d’ouverture ont déjà été réglés." });
      if (!siteId || !apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le paiement en ligne est temporairement indisponible. Contactez votre conseiller." });

      const transactionId = app.paymentTransactionId ?? `3M-${app.dossierNumber}-${randomBytes(16).toString("hex")}`;
      const amount = app.paymentAmount ?? 65000;
      const result = await initCinetPayTransaction({
        transactionId,
        amount,
        currency: "XAF",
        description: `Frais d’ouverture de dossier Prime Travel Service — ${app.dossierNumber}`,
        customerName: app.fullName,
        customerEmail: app.email,
        customerPhone: app.whatsappNumber,
        returnUrl: `${baseUrl}/payment-success?dossier=${app.dossierNumber}`,
        notifyUrl: `${baseUrl}/api/cinetpay/webhook`,
        siteId,
        apiKey,
      });

      await db.update(applications).set({
        paymentStatus: "PENDING",
        paymentTransactionId: transactionId,
        paymentAmount: amount,
        paymentCurrency: "XAF",
        paymentMethod: input.paymentMethod ?? null,
      }).where(eq(applications.id, app.id));

      return { dossierNumber: app.dossierNumber, paymentUrl: result.paymentUrl, amount, currency: "XAF" as const };
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
      const candidateIds = filtered.map((application) => application.candidateId).filter((id): id is number => Boolean(id));
      const receipts = candidateIds.length
        ? await db
          .select()
          .from(candidateFiles)
          .where(and(inArray(candidateFiles.candidateId, candidateIds), eq(candidateFiles.fileType, "justificatif_paiement")))
          .orderBy(desc(candidateFiles.uploadedAt))
        : [];
      const receiptByCandidateId = new Map<number, typeof receipts[number]>();
      for (const receipt of receipts) {
        if (!receiptByCandidateId.has(receipt.candidateId)) receiptByCandidateId.set(receipt.candidateId, receipt);
      }
      return filtered.map((application) => ({
        ...application,
        paymentReceipt: application.candidateId ? receiptByCandidateId.get(application.candidateId) ?? null : null,
      }));
    }),

  /** Valider ou annuler un paiement depuis le tableau de bord administrateur. */
  adminUpdatePaymentStatus: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      paymentStatus: z.enum(["SUCCESS", "FAILED", "CANCELLED"]),
      adminNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const application = (await db.select().from(applications).where(eq(applications.id, input.id)).limit(1))[0];
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      const isValidated = input.paymentStatus === "SUCCESS";
      await db.update(applications)
        .set({
          paymentStatus: input.paymentStatus,
          paymentDate: isValidated ? new Date() : application.paymentDate,
          paymentMethod: isValidated ? (application.paymentMethod || "VALIDATION_AGENCE") : application.paymentMethod,
          dossierStatus: isValidated ? "paye" : application.dossierStatus,
          ...(input.adminNotes !== undefined ? { adminNote: input.adminNotes } : {}),
        })
        .where(eq(applications.id, input.id));

      await db.insert(paymentAuditLogs).values({
        adminName: ctx.user.name || "Administrateur",
        adminEmail: ctx.user.email || "",
        action: input.paymentStatus === "SUCCESS" ? "confirmed" : input.paymentStatus.toLowerCase(),
        paymentId: application.id,
        candidateEmail: application.email,
        amount: `${application.paymentAmount ?? 65000} ${application.paymentCurrency ?? "XAF"}`,
        details: input.adminNotes || `Statut de paiement défini sur ${input.paymentStatus} pour le dossier ${application.dossierNumber}`,
      });

      // Notification visible dans l’espace client : confirmation ou demande de correction.
      if (application.candidateId) {
        const caseRow = (await db.select({ id: cases.id }).from(cases).where(eq(cases.legacyApplicationId, application.id)).limit(1))[0];
        const isValidated = input.paymentStatus === "SUCCESS";
        const isRejected = input.paymentStatus === "CANCELLED" || input.paymentStatus === "FAILED";
        await db.insert(clientNotifications).values({
          candidateId: application.candidateId,
          caseId: caseRow?.id,
          type: isValidated ? "payment_validated" : "payment_action_required",
          title: isValidated ? "Paiement validé — quittance disponible" : "Votre paiement nécessite une correction",
          body: isValidated
            ? `Votre versement de ${application.paymentAmount ?? 65000} ${application.paymentCurrency ?? "XAF"} pour le dossier ${application.dossierNumber} a été validé. Votre quittance PDF est maintenant disponible dans l’espace client.`
            : `Le justificatif de paiement du dossier ${application.dossierNumber} n’a pas pu être validé. Motif : ${input.adminNotes || "Veuillez contacter l’administration ou déposer un nouveau reçu."}`,
          actionUrl: "/mon-espace",
        });
      }

      return { success: true, dossierNumber: application.dossierNumber, paymentStatus: input.paymentStatus };
    }),

  /** Envoie une confirmation de paiement uniquement après validation manuelle et journalise le résultat. */
  adminSendPaymentReceipt: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const application = (await db.select().from(applications).where(eq(applications.id, input.id)).limit(1))[0];
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      if (application.paymentStatus !== "SUCCESS") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le reçu ne peut être envoyé qu’après validation du paiement" });
      }
      if (!application.email) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier" });
      }

      try {
        await sendGenericEmail({
          to: application.email,
          subject: `Confirmation de paiement — Dossier ${application.dossierNumber}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1e293b"><h2 style="color:#123a7a">Paiement validé</h2><p>Bonjour ${application.fullName},</p><p>Votre paiement de <strong>${Number(application.paymentAmount ?? 65000).toLocaleString("fr-FR")} ${application.paymentCurrency ?? "XAF"}</strong> a été validé pour le dossier <strong>${application.dossierNumber}</strong>.</p><p>La suite du dossier reste pilotée par un conseiller 3M Travel & Services. Consultez votre espace client pour les prochaines étapes et les documents disponibles.</p><p><a href="https://www.3mtravelagency.com/mon-espace" style="display:inline-block;background:#123a7a;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">Accéder à mon espace</a></p><p style="font-size:12px;color:#64748b">Cet e-mail confirme une validation administrative ; il ne constitue pas une émission de billet, de visa ou de réservation fournisseur.</p></div>`,
        });
      } catch (error) {
        console.error("payment receipt delivery failed", { applicationId: application.id, error });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "L’e-mail de confirmation n’a pas pu être envoyé. Réessayez après vérification du service e-mail." });
      }

      await db.insert(paymentAuditLogs).values({
        adminName: ctx.user.name || "Administrateur",
        adminEmail: ctx.user.email || "",
        action: "receipt_sent",
        paymentId: application.id,
        candidateEmail: application.email,
        amount: `${application.paymentAmount ?? 65000} ${application.paymentCurrency ?? "XAF"}`,
        details: `Confirmation de paiement envoyée après validation manuelle du dossier ${application.dossierNumber}`,
      });

      return { success: true, dossierNumber: application.dossierNumber };
    }),

  /** Changer le statut d'un dossier (admin) */
  updateApplicationStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      dossierStatus: z.enum(["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve", "refuse"]),
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

  /** Envoyer le rapport d'évaluation automatique par email */
  sendEvaluationReport: protectedProcedure
    .input(z.object({
      applicationId: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);
      
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });
      
      // Générer le rapport HTML
      const reportHtml = generateEvaluationReportHTML(app);
      
      // Envoyer par email
      try {
        await sendEvisaStatusUpdateEmail(app.email, app.fullName, app.dossierNumber, app.destination, "processing", reportHtml);
        return { success: true, message: "Rapport d'évaluation envoyé avec succès" };
      } catch (err) {
        console.error("[Evaluation Report] Send error:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'envoi du rapport" });
      }
    }),

  /** Envoyer les rapports d'évaluation à tous les dossiers non évalués */
  sendBulkEvaluationReports: protectedProcedure
    .input(z.object({
      dossierStatus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      
      // Récupérer les dossiers non évalués (status = "nouveau")
      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierStatus, "nouveau"))
        .limit(100);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const app of apps) {
        try {
          const reportHtml = generateEvaluationReportHTML(app);
          await sendEvisaStatusUpdateEmail(app.email, app.fullName, app.dossierNumber, app.destination, "processing", reportHtml);
          
          // Marquer comme "en_cours" après envoi
          await db.update(applications)
            .set({ dossierStatus: "en_attente_paiement" })
            .where(eq(applications.id, app.id));
          
          successCount++;
        } catch (err) {
          console.error(`[Evaluation Report] Error for ${app.dossierNumber}:`, err);
          errorCount++;
        }
      }
      
      return {
        success: true,
        message: `${successCount} rapports envoyés, ${errorCount} erreurs`,
        successCount,
        errorCount,
        totalProcessed: apps.length,
      };
    }),

  evaluateCVWithAI: publicProcedure
    .input(z.object({
      cvBase64: z.string(),
      candidateName: z.string(),
      destination: z.string(),
      email: z.string().email(),
      applicationId: z.number().int().optional(),
      candidateId: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const reportId = `3M-AI-${Date.now()}`;
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });
      
      try {
        // Créer l'enregistrement d'historique avec statut pending
        await db.insert(aiReportHistory).values({
          applicationId: input.applicationId,
          candidateId: input.candidateId,
          candidateName: input.candidateName,
          candidateEmail: input.email,
          destination: input.destination,
          reportId,
          sendStatus: 'pending',
          sendAttempts: 0,
        });
        
        const cvBuffer = Buffer.from(input.cvBase64, 'base64');
        const cvText = await extractTextFromPDF(cvBuffer);
        const openaiKey = process.env.OPENAI_API_KEY;
        const report = await generateAIEvaluationReport(
          cvText,
          input.candidateName,
          input.destination,
          openaiKey
        );
        
        // Mettre à jour l'enregistrement avec le contenu du rapport
        await db
          .update(aiReportHistory)
          .set({ reportContent: report })
          .where(eq(aiReportHistory.reportId, reportId));
        
        let emailSendSuccess = false;
        try {
          await sendEvisaStatusUpdateEmail(
            input.email,
            input.candidateName,
            reportId,
            "autre",
            "processing",
            `<pre style="font-family: monospace; white-space: pre-wrap;">${report}</pre>`
          );
          emailSendSuccess = true;
          
          // Mettre à jour l'historique avec le statut sent
          await db
            .update(aiReportHistory)
            .set({ sendStatus: 'sent', sentAt: new Date() })
            .where(eq(aiReportHistory.reportId, reportId));
        } catch (emailErr) {
          console.error('[AI Evaluation] Email send error:', emailErr);
          
          // Mettre à jour l'historique avec le statut failed
          await db
            .update(aiReportHistory)
            .set({
              sendStatus: 'failed',
              lastSendError: emailErr instanceof Error ? emailErr.message : 'Erreur d\'envoi inconnue',
              sendAttempts: 1,
            })
            .where(eq(aiReportHistory.reportId, reportId));
        }
        
        return {
          success: true,
          report,
          reportId,
          emailSent: emailSendSuccess,
          message: emailSendSuccess
            ? 'Rapport d\'évaluation généré et envoyé avec succès'
            : 'Rapport généré mais l\'envoi par email a échoué',
        };
      } catch (err) {
        console.error('[AI Evaluation] Error:', err);
        
        // Mettre à jour l'historique avec l'erreur
        try {
          await db
            .update(aiReportHistory)
            .set({
              sendStatus: 'failed',
              lastSendError: err instanceof Error ? err.message : 'Erreur inconnue',
            })
            .where(eq(aiReportHistory.reportId, reportId));
        } catch (updateErr) {
          console.error('[AI Evaluation] Failed to update history:', updateErr);
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la préparation de l\'évaluation du CV',
        });
      }
    }),

  // ─── Signature du Protocole d'Accord ─────────────────────────────────────────
  signAgreement: publicProcedure
    .input(z.object({
      applicationId: z.number(),
      signatureName: z.string().min(2).max(255),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Dossier introuvable' });
      }
      if (app.agreementSigned) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ce protocole a déjà été signé' });
      }
      // Récupérer l'IP du candidat
      const ipAddress =
        (ctx as any)?.req?.headers?.['x-forwarded-for'] as string ||
        (ctx as any)?.req?.socket?.remoteAddress ||
        'unknown';
      const signedAt = Math.floor(Date.now() / 1000);
      await db
        .update(applications)
        .set({
          agreementSigned: true,
          agreementSignedAt: signedAt,
          agreementSignatureName: input.signatureName,
          agreementIpAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : 'unknown',
        })
        .where(eq(applications.id, input.applicationId));
      console.log(`[Agreement] Signed by ${input.signatureName} for dossier ${app.dossierNumber} at ${new Date(signedAt * 1000).toISOString()}`);
      return {
        success: true,
        signedAt,
        dossierNumber: app.dossierNumber,
        message: 'Protocole d\'accord signé avec succès',
      };
    }),

  // ─── Suivi de dossier candidat (sans compte) ────────────────────────────────

  /**
   * Récupère le statut d'un dossier par numéro + email (accès public sécurisé)
   */
  getDossierStatus: publicProcedure
    .input(z.object({
      dossierNumber: z.string().min(5),
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });
      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Dossier introuvable. Vérifiez le numéro et l\'email.' });
      }
      // Vérification email pour sécuriser l'accès
      if (app.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Email incorrect pour ce dossier.' });
      }
      const [caseRecord] = await db
        .select({
          id: cases.id,
          countryTarget: cases.countryTarget,
          caseType: cases.caseType,
          visaType: cases.visaType,
          currentStatus: cases.currentStatus,
          dueAt: cases.dueAt,
        })
        .from(cases)
        .where(eq(cases.legacyApplicationId, app.id))
        .limit(1);

      const procedureTracking = caseRecord
        ? await (async () => {
          const requirements = await db
            .select({
              documentType: documentRequirements.documentType,
              status: documentRequirements.status,
              dueAt: documentRequirements.dueAt,
            })
            .from(documentRequirements)
            .where(eq(documentRequirements.caseId, caseRecord.id));
          const required = requirements.filter((requirement) => requirement.status !== "waived");
          const completed = required.filter((requirement) => requirement.status === "approved").length;
          const nextRequirement = required.find((requirement) => ["pending", "rejected"].includes(requirement.status));
          return {
            destination: caseRecord.countryTarget ?? app.destination,
            procedure: caseRecord.visaType ?? caseRecord.caseType ?? app.visaType ?? null,
            status: caseRecord.currentStatus,
            dueAt: caseRecord.dueAt,
            documents: requirements,
            summary: { required: required.length, completed },
            nextAction: nextRequirement
              ? {
                title: nextRequirement.status === "rejected" ? "Document à corriger" : "Document attendu",
                description: `Votre conseiller attend : ${nextRequirement.documentType}.`,
              }
              : {
                title: "Suivi par votre conseiller",
                description: "Votre dossier est suivi selon les étapes de votre procédure. Nous vous informerons lorsqu’une action sera requise.",
              },
          };
        })()
        : null;
      // Retourner les infos sans données sensibles (OTP, etc.)
      return {
        id: app.id,
        dossierNumber: app.dossierNumber,
        fullName: app.fullName,
        email: app.email,
        destination: app.destination,
        visaType: app.visaType,
        formulaChosen: app.formulaChosen,
        dossierStatus: app.dossierStatus,
        paymentStatus: app.paymentStatus,
        paymentDate: app.paymentDate,
        emailVerified: app.emailVerified,
        agreementSigned: app.agreementSigned,
        agreementSignedAt: app.agreementSignedAt,
        adminNote: app.adminNote,
        passportUrl: app.passportUrl,
        cvUrl: app.cvUrl,
        diplomaUrl: app.diplomaUrl,
        documentsUrls: app.documentsUrls,
        scoringTotal: app.scoringTotal,
        scoringBadge: app.scoringBadge,
        procedureTracking,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      };
    }),

  /**
   * Envoyer un message au conseiller depuis le tableau de bord candidat
   */
  sendCandidateMessage: publicProcedure
    .input(z.object({
      dossierNumber: z.string().min(5),
      email: z.string().email(),
      message: z.string().min(5).max(2000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });
      // Vérifier que le dossier existe et que l'email correspond
      const [app] = await db
        .select({ id: applications.id, email: applications.email, dossierNumber: applications.dossierNumber })
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);
      if (!app || app.email.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès non autorisé.' });
      }
      // Stocker le message dans adminNote (append)
      const [current] = await db
        .select({ adminNote: applications.adminNote })
        .from(applications)
        .where(eq(applications.id, app.id))
        .limit(1);
      const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
      const newNote = `[MSG CANDIDAT — ${timestamp}]\n${input.message}`;
      const updatedNote = current?.adminNote
        ? `${current.adminNote}\n\n${newNote}`
        : newNote;
      await db
        .update(applications)
        .set({ adminNote: updatedNote })
        .where(eq(applications.id, app.id));
      return { success: true, message: 'Message envoyé à votre conseiller.' };
    }),

  /**
   * Admin : répondre à un candidat (ajoute une note admin)
   */
  replyToCandidate: protectedProcedure
    .input(z.object({
      applicationId: z.number(),
      reply: z.string().min(5).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs.' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });
      const [current] = await db
        .select({ adminNote: applications.adminNote })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);
      const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });
      const newReply = `[RÉPONSE CONSEILLER — ${timestamp}]\n${input.reply}`;
      const updatedNote = current?.adminNote
        ? `${current.adminNote}\n\n${newReply}`
        : newReply;
      await db
        .update(applications)
        .set({ adminNote: updatedNote })
        .where(eq(applications.id, input.applicationId));
      return { success: true };
    }),

  // ─── Historique des rapports IA ──────────────────────────────────────────

  /**
   * Récupérer l'historique des rapports IA envoyés
   */
  getAIReportHistory: publicProcedure
    .input(z.object({
      applicationId: z.number().int().optional(),
      candidateId: z.number().int().optional(),
      email: z.string().email().optional(),
      limit: z.number().int().default(50),
      offset: z.number().int().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });

      try {
        let whereCondition: any = undefined;

        if (input.applicationId) {
          whereCondition = eq(aiReportHistory.applicationId, input.applicationId);
        } else if (input.candidateId) {
          whereCondition = eq(aiReportHistory.candidateId, input.candidateId);
        } else if (input.email) {
          whereCondition = eq(aiReportHistory.candidateEmail, input.email);
        }

        const query = db.select().from(aiReportHistory);
        const baseQuery = whereCondition ? query.where(whereCondition) : query;

        const reports = await baseQuery
          .orderBy(desc(aiReportHistory.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          reports,
          count: reports.length,
        };
      } catch (err) {
        console.error('[AI Report History] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de l\'historique',
        });
      }
    }),

  /**
   * Récupérer un rapport IA spécifique par son ID
   */
  getAIReport: publicProcedure
    .input(z.object({
      reportId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });

      try {
        const [report] = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.reportId, input.reportId))
          .limit(1);

        if (!report) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Rapport non trouvé' });
        }

        return {
          success: true,
          report,
        };
      } catch (err) {
        console.error('[AI Report] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du rapport',
        });
      }
    }),

  /**
   * Retenter l'envoi d'un rapport IA qui a échoué
   */
  retryAIReportSend: publicProcedure
    .input(z.object({
      reportId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB non disponible' });

      try {
        const [report] = await db
          .select()
          .from(aiReportHistory)
          .where(eq(aiReportHistory.reportId, input.reportId))
          .limit(1);

        if (!report) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Rapport non trouvé' });
        }

        if (!report.reportContent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Le contenu du rapport est vide',
          });
        }

        let emailSendSuccess = false;
        try {
          await sendEvisaStatusUpdateEmail(
            report.candidateEmail,
            report.candidateName,
            report.reportId,
            "autre",
            "processing",
            `<pre style="font-family: monospace; white-space: pre-wrap;">${report.reportContent}</pre>`
          );
          emailSendSuccess = true;

          // Mettre à jour l'historique
          await db
            .update(aiReportHistory)
            .set({
              sendStatus: 'sent',
              sentAt: new Date(),
              sendAttempts: (report.sendAttempts || 0) + 1,
              lastSendError: null,
            })
            .where(eq(aiReportHistory.reportId, input.reportId));
        } catch (emailErr) {
          console.error('[AI Report Retry] Email send error:', emailErr);

          // Mettre à jour l'historique avec l'erreur
          await db
            .update(aiReportHistory)
            .set({
              sendStatus: 'failed',
              sendAttempts: (report.sendAttempts || 0) + 1,
              lastSendError: emailErr instanceof Error ? emailErr.message : 'Erreur d\'envoi inconnue',
            })
            .where(eq(aiReportHistory.reportId, input.reportId));
        }

        return {
          success: emailSendSuccess,
          message: emailSendSuccess
            ? 'Rapport renvoyé avec succès'
            : 'Erreur lors de l\'envoi du rapport',
        };
      } catch (err) {
        console.error('[AI Report Retry] Error:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du renvoi du rapport',
        });
      }
    }),
});
