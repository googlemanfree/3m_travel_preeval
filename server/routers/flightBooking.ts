import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  flightBookingRequestHistory,
  flightBookingRequests,
  flightLoyaltyAccounts,
  flightLoyaltyTransactions,
  flightPartnerQuotes,
  passportScanRequests,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure, findCandidateFromAuthorizationHeader, getOrCreateCandidateForPlatformUser } from "./candidate";
import { getDb } from "../db";
import { sendEmail } from "../_core/email";
import { storageGetSignedUrl, storagePut } from "../storage";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import { analyzeDocumentReadability } from "../documentReadabilityService";

const MAX_SCAN_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const requestStatus = [
  "pending_review",
  "assigned",
  "needs_info",
  "revalidated",
  "awaiting_payment",
  "issued",
  "cancelled",
] as const;
const requestPriority = ["low", "normal", "high", "urgent"] as const;
const issuanceCheckKeys = ["identity_verified", "passport_valid", "fare_revalidated", "payment_verified", "pnr_document_ready"] as const;
const customerStatusLabels: Record<(typeof requestStatus)[number], string> = {
  pending_review: "En cours de vérification",
  assigned: "Prise en charge par un conseiller",
  needs_info: "Informations complémentaires requises",
  revalidated: "Réservation revalidée",
  awaiting_payment: "En attente de paiement",
  issued: "Document de voyage disponible",
  cancelled: "Réservation annulée",
};

type FlightPassengerData = Record<string, unknown>;

function extractCandidatePhone(passengers: FlightPassengerData[]) {
  const value = passengers[0]?.phone ?? passengers[0]?.phoneNumber ?? passengers[0]?.telephone;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 32) : null;
}

export function resolveBookingRequester(
  passenger: FlightPassengerData,
  candidate: { id: number; email: string } | null,
) {
  const email = typeof passenger.email === "string" ? passenger.email.trim().toLowerCase() : "";
  const fullName = typeof passenger.fullName === "string" ? passenger.fullName.trim() : "";
  if (!z.string().email().safeParse(email).success || fullName.length < 2) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le nom complet et une adresse e-mail valide du passager sont requis." });
  }
  return {
    candidateId: candidate?.id ?? null,
    email: candidate?.email ?? email,
    fullName,
    isGuest: !candidate,
  };
}

const passportExtractedDataSchema = z.object({
  surname: z.string().nullable(),
  givenNames: z.string().nullable(),
  passportNumber: z.string().nullable(),
  nationality: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  expiryDate: z.string().nullable(),
  sex: z.string().nullable(),
  validForPrefill: z.boolean(),
});

type PassportExtractedData = z.infer<typeof passportExtractedDataSchema>;

function safeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-");
  return normalized.slice(-120) || "passport-scan.jpg";
}

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

function buildRequestRef() {
  return `3M-FL-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`.slice(0, 32);
}

type FlightTimingData = Record<string, unknown>;

export function getAutomaticFlightPriority(flightData: FlightTimingData) {
  const departureDate = typeof flightData.departureDate === "string" ? flightData.departureDate : "";
  const departureTime = typeof flightData.departureTime === "string" ? flightData.departureTime : "23:59";
  const departureAt = new Date(`${departureDate}T${departureTime.length >= 5 ? departureTime : "23:59"}`);
  if (Number.isNaN(departureAt.getTime())) return "normal" as const;

  const hoursUntilDeparture = (departureAt.getTime() - Date.now()) / 3_600_000;
  if (hoursUntilDeparture <= 48) return "urgent" as const;
  if (hoursUntilDeparture <= 7 * 24) return "high" as const;
  if (hoursUntilDeparture >= 45 * 24) return "low" as const;
  return "normal" as const;
}

function getFlightEmailSummary(flightData: FlightTimingData) {
  const airline = typeof flightData.airline === "object" && flightData.airline && typeof (flightData.airline as Record<string, unknown>).name === "string"
    ? (flightData.airline as Record<string, unknown>).name as string
    : "Compagnie à confirmer";
  const origin = typeof flightData.originCity === "string" ? flightData.originCity : typeof flightData.origin === "string" ? flightData.origin : "Départ";
  const destination = typeof flightData.destinationCity === "string" ? flightData.destinationCity : typeof flightData.destination === "string" ? flightData.destination : "Destination";
  const departure = typeof flightData.departureDate === "string" ? flightData.departureDate : "À confirmer";
  return { airline, origin, destination, departure };
}

const LOYALTY_POINTS_PER_ISSUED_BOOKING = 100;

export function resolveLoyaltyTier(lifetimePoints: number) {
  if (lifetimePoints >= 3000) return "platinum" as const;
  if (lifetimePoints >= 1500) return "gold" as const;
  if (lifetimePoints >= 500) return "silver" as const;
  return "explorer" as const;
}

async function awardLoyaltyPointsForIssuedBooking(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  booking: typeof flightBookingRequests.$inferSelect,
  requestId: number,
) {
  if (!booking.candidateId) return { awarded: false, points: 0 };

  const [existingTransaction] = await db.select()
    .from(flightLoyaltyTransactions)
    .where(eq(flightLoyaltyTransactions.requestId, requestId))
    .limit(1);
  if (existingTransaction) return { awarded: false, points: 0 };

  await db.insert(flightLoyaltyTransactions).values({
    candidateId: booking.candidateId,
    requestId,
    points: LOYALTY_POINTS_PER_ISSUED_BOOKING,
    reason: `Billet émis et validé — ${booking.requestRef}`,
  });

  const [account] = await db.select()
    .from(flightLoyaltyAccounts)
    .where(eq(flightLoyaltyAccounts.candidateId, booking.candidateId))
    .limit(1);
  const lifetimePoints = (account?.lifetimePoints ?? 0) + LOYALTY_POINTS_PER_ISSUED_BOOKING;
  const tier = resolveLoyaltyTier(lifetimePoints);

  if (account) {
    await db.update(flightLoyaltyAccounts).set({
      availablePoints: account.availablePoints + LOYALTY_POINTS_PER_ISSUED_BOOKING,
      lifetimePoints,
      issuedBookings: account.issuedBookings + 1,
      tier,
    }).where(eq(flightLoyaltyAccounts.id, account.id));
  } else {
    await db.insert(flightLoyaltyAccounts).values({
      candidateId: booking.candidateId,
      availablePoints: LOYALTY_POINTS_PER_ISSUED_BOOKING,
      lifetimePoints,
      issuedBookings: 1,
      tier,
    });
  }

  return { awarded: true, points: LOYALTY_POINTS_PER_ISSUED_BOOKING, tier };
}

function assertAdminSession(sessionToken: string) {
  if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur requise." });
  return requireValidAdminSession(sessionToken);
}

async function extractPassportData(imageUrl: string): Promise<PassportExtractedData> {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content:
          "You extract passport identity data conservatively. Read the machine readable zone and visible biographic page only. Never guess or complete missing values. Use null for anything unclear. Dates must be YYYY-MM-DD when confidently readable. This output is only a draft for user confirmation, never an official identity verification.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract surname, given names, passport number, nationality, date of birth, expiry date and sex. Set validForPrefill true only when the core fields are readable and internally consistent.",
          },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        ] as any,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "passport_prefill",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            surname: { type: ["string", "null"] },
            givenNames: { type: ["string", "null"] },
            passportNumber: { type: ["string", "null"] },
            nationality: { type: ["string", "null"] },
            dateOfBirth: { type: ["string", "null"] },
            expiryDate: { type: ["string", "null"] },
            sex: { type: ["string", "null"] },
            validForPrefill: { type: "boolean" },
          },
          required: ["surname", "givenNames", "passportNumber", "nationality", "dateOfBirth", "expiryDate", "sex", "validForPrefill"],
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Réponse OCR invalide.");
  return passportExtractedDataSchema.parse(JSON.parse(content));
}

export const flightBookingRouter = router({
  scanPassport: candidateProcedure
    .input(z.object({
      fileName: z.string().min(1).max(255),
      mimeType: z.enum(ALLOWED_MIME_TYPES),
      fileBase64: z.string().min(1000).max(9_000_000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length < 20_000 || buffer.length > MAX_SCAN_BYTES || !hasValidImageSignature(buffer, input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image de passeport invalide ou trop volumineuse. Utilisez JPG, PNG ou WebP (6 Mo maximum)." });
      }

      const fileName = safeFileName(input.fileName);
      const storage = await storagePut(`private/candidates/${ctx.candidate.id}/passport-scans/${fileName}`, buffer, input.mimeType);
      const inserted = await db.insert(passportScanRequests).values({
        candidateId: ctx.candidate.id,
        fileKey: storage.key,
        fileUrl: storage.url,
        fileName,
        mimeType: input.mimeType,
        scanStatus: "pending",
      });
      const scanId = Number((inserted as any)[0]?.insertId ?? 0);

      try {
        const signedUrl = await storageGetSignedUrl(storage.key);
        const readability = await analyzeDocumentReadability(signedUrl, "passport");
        if (readability.readabilityScore < 55) {
          await db.update(passportScanRequests).set({
            scanStatus: "failed",
            confidence: readability.confidence,
            issues: readability.issues,
          }).where(eq(passportScanRequests.id, scanId));
          return { success: false, scanId, message: "Le scan est trop flou ou incomplet. Veuillez reprendre la photo avec les quatre coins visibles.", readability, extractedData: null };
        }

        const extractedData = await extractPassportData(signedUrl);
        await db.update(passportScanRequests).set({
          scanStatus: "completed",
          confidence: Math.min(readability.confidence, extractedData.validForPrefill ? 96 : 60),
          issues: readability.issues,
          extractedData,
        }).where(eq(passportScanRequests.id, scanId));
        return { success: true, scanId, message: "Données extraites. Vérifiez chaque champ avant de continuer.", readability, extractedData };
      } catch (error) {
        console.error("[FlightBooking] passport scan failed", error);
        await db.update(passportScanRequests).set({
          scanStatus: "failed",
          confidence: 0,
          issues: ["Analyse temporairement indisponible. Aucun champ n'a été prérempli automatiquement."],
        }).where(eq(passportScanRequests.id, scanId));
        return { success: false, scanId, message: "Le scan n'a pas pu être analysé. Vous pouvez saisir les informations manuellement.", readability: null, extractedData: null };
      }
    }),

  getScan: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), scanId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [scan] = await db.select().from(passportScanRequests).where(eq(passportScanRequests.id, input.scanId)).limit(1);
      if (!scan) throw new TRPCError({ code: "NOT_FOUND", message: "Scan de passeport introuvable." });
      const signedUrl = await storageGetSignedUrl(scan.fileKey);
      return { id: scan.id, signedUrl, fileName: scan.fileName, scanStatus: scan.scanStatus, confidence: scan.confidence, extractedData: scan.extractedData, issues: scan.issues };
    }),

  createRequest: publicProcedure
    .input(z.object({
      flightId: z.string().min(1).max(255),
      flightData: z.record(z.string(), z.unknown()),
      passengerData: z.array(z.record(z.string(), z.unknown())).min(1).max(9),
    }).superRefine((value, ctx) => {
      if (JSON.stringify(value).length > 120_000) ctx.addIssue({ code: "custom", message: "Données de réservation trop volumineuses." });
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const candidate = ctx.user
        ? await getOrCreateCandidateForPlatformUser(ctx.user)
        : await findCandidateFromAuthorizationHeader((ctx.req as any)?.headers?.authorization as string | undefined);
      const requester = resolveBookingRequester(input.passengerData[0] ?? {}, candidate ? { id: candidate.id, email: candidate.email } : null);
      const requestRef = buildRequestRef();
      const priority = getAutomaticFlightPriority(input.flightData);
      const flightSummary = getFlightEmailSummary(input.flightData);
      const inserted = await db.insert(flightBookingRequests).values({
        requestRef,
        candidateId: requester.candidateId,
        candidateEmail: requester.email,
        flightId: input.flightId,
        flightData: input.flightData,
        passengerData: input.passengerData,
        candidatePhone: extractCandidatePhone(input.passengerData),
        priority,
        status: "pending_review",
      });
      const requestId = Number((inserted as any)[0]?.insertId ?? 0);
      await db.insert(flightBookingRequestHistory).values({
        requestId,
        action: "created",
        changedBy: requester.email,
        oldValue: null,
        newValue: "pending_review",
        details: `${requester.isGuest ? "Demande de réservation invitée créée depuis le checkout en ligne." : "Demande de réservation créée depuis le checkout candidat."} Priorité automatique : ${priority}.`,
      });
      let notificationEmailSent = false;
      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `[3M Travel] Nouvelle réservation ${requestRef} — ${flightSummary.origin} → ${flightSummary.destination}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#172554"><h2 style="margin-top:0;color:#1d4ed8">Nouvelle demande de réservation de vol</h2><p>Une demande est prête à être traitée dans le tableau de bord administrateur.</p><p><strong>Référence :</strong> ${requestRef}<br/><strong>Client :</strong> ${requester.fullName} · ${requester.email}<br/><strong>Trajet :</strong> ${flightSummary.origin} → ${flightSummary.destination}<br/><strong>Compagnie :</strong> ${flightSummary.airline}<br/><strong>Départ :</strong> ${flightSummary.departure}<br/><strong>Priorité :</strong> ${priority}</p><p>Ouvrez l’onglet <strong>Réservations vols</strong> pour affecter un conseiller et traiter la demande.</p></div>`,
        });
        notificationEmailSent = true;
      } catch (error) {
        console.error("[FlightBooking] advisor notification failed", error);
      }
      return { success: true, requestId, requestRef, status: "pending_review" as const, priority, notificationEmailSent, requiresAccountActivation: requester.isGuest };
    }),

  getMyRequests: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select({
      id: flightBookingRequests.id,
      requestRef: flightBookingRequests.requestRef,
      flightId: flightBookingRequests.flightId,
      flightData: flightBookingRequests.flightData,
      status: flightBookingRequests.status,
      assignedAgentEmail: flightBookingRequests.assignedAgentEmail,
      agentNotes: flightBookingRequests.agentNotes,
      pnrReference: flightBookingRequests.pnrReference,
      issuedPdfUrl: flightBookingRequests.issuedPdfUrl,
      pnrViewedAt: flightBookingRequests.pnrViewedAt,
      pnrDownloadedAt: flightBookingRequests.pnrDownloadedAt,
      createdAt: flightBookingRequests.createdAt,
      updatedAt: flightBookingRequests.updatedAt,
    }).from(flightBookingRequests)
      .where(eq(flightBookingRequests.candidateId, ctx.candidate.id))
      .orderBy(desc(flightBookingRequests.createdAt));
  }),

  getMyLoyalty: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const [account] = await db.select().from(flightLoyaltyAccounts)
      .where(eq(flightLoyaltyAccounts.candidateId, ctx.candidate.id)).limit(1);
    const transactions = await db.select().from(flightLoyaltyTransactions)
      .where(eq(flightLoyaltyTransactions.candidateId, ctx.candidate.id))
      .orderBy(desc(flightLoyaltyTransactions.createdAt)).limit(6);
    return {
      account: account ?? {
        availablePoints: 0,
        lifetimePoints: 0,
        issuedBookings: 0,
        tier: "explorer" as const,
      },
      transactions,
      nextTier: account?.tier === "explorer" ? "silver" : account?.tier === "silver" ? "gold" : account?.tier === "gold" ? "platinum" : null,
      nextTierAt: account?.tier === "explorer" ? 500 : account?.tier === "silver" ? 1500 : account?.tier === "gold" ? 3000 : null,
    };
  }),

  getMyPartnerQuotes: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [booking] = await db.select().from(flightBookingRequests)
        .where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id)))
        .limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      return db.select().from(flightPartnerQuotes)
        .where(and(eq(flightPartnerQuotes.requestId, input.requestId), eq(flightPartnerQuotes.isActive, true)))
        .orderBy(flightPartnerQuotes.quotedAmountXaf);
    }),

  getQueueSummary: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select({ status: flightBookingRequests.status, total: count() }).from(flightBookingRequests).groupBy(flightBookingRequests.status);
      return rows.reduce<Record<string, number>>((acc, row) => { acc[row.status] = Number(row.total); return acc; }, {});
    }),

  getQueue: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      status: z.enum(["ALL", ...requestStatus]).default("ALL"),
      priority: z.enum(["ALL", ...requestPriority]).default("ALL"),
      limit: z.number().int().min(1).max(100).default(25),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const conditions = [
        input.status === "ALL" ? undefined : eq(flightBookingRequests.status, input.status),
        input.priority === "ALL" ? undefined : eq(flightBookingRequests.priority, input.priority),
      ].filter(Boolean) as ReturnType<typeof eq>[];
      const condition = conditions.length ? and(...conditions) : undefined;
      const requests = await db.select().from(flightBookingRequests).where(condition).orderBy(desc(flightBookingRequests.createdAt)).limit(input.limit).offset(input.offset);
      const [{ total }] = await db.select({ total: count() }).from(flightBookingRequests).where(condition);
      return { requests, total: Number(total), limit: input.limit, offset: input.offset };
    }),

  getRequest: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [request] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      const history = await db.select().from(flightBookingRequestHistory).where(eq(flightBookingRequestHistory.requestId, input.requestId)).orderBy(desc(flightBookingRequestHistory.createdAt));
      return { request, history };
    }),

  listPartnerQuotes: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      return db.select().from(flightPartnerQuotes)
        .where(eq(flightPartnerQuotes.requestId, input.requestId))
        .orderBy(desc(flightPartnerQuotes.verifiedAt));
    }),

  addPartnerQuote: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      requestId: z.number().int().positive(),
      partnerName: z.string().trim().min(2).max(160),
      quotedAmountXaf: z.number().int().positive(),
      currency: z.string().trim().min(3).max(8).default("XAF"),
      fareDetails: z.string().trim().max(2000).optional(),
      baggageDetails: z.string().trim().max(1000).optional(),
      terms: z.string().trim().max(2000).optional(),
      sourceReference: z.string().trim().min(2).max(255),
    }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [booking] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const [created] = await db.insert(flightPartnerQuotes).values({
        requestId: input.requestId,
        partnerName: input.partnerName,
        quotedAmountXaf: input.quotedAmountXaf,
        currency: input.currency.toUpperCase(),
        fareDetails: input.fareDetails || null,
        baggageDetails: input.baggageDetails || null,
        terms: input.terms || null,
        sourceReference: input.sourceReference,
        verifiedBy: admin.email,
      });
      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "partner_quote_verified",
        changedBy: admin.email,
        oldValue: null,
        newValue: String((created as any).insertId ?? ""),
        details: `Devis partenaire vérifié : ${input.partnerName} — ${input.quotedAmountXaf.toLocaleString("fr-FR")} ${input.currency.toUpperCase()} — Source: ${input.sourceReference}`,
      });
      return { success: true };
    }),

  assignRequest: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), assignedAgentEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      await db.update(flightBookingRequests).set({ assignedAgentEmail: input.assignedAgentEmail, status: "assigned" }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "assigned", changedBy: admin.email, oldValue: existing.assignedAgentEmail, newValue: input.assignedAgentEmail, details: "Demande affectée à un agent." });
      let notificationEmailSent = false;
      try {
        const flightSummary = getFlightEmailSummary((existing.flightData ?? {}) as FlightTimingData);
        await sendEmail({
          to: input.assignedAgentEmail,
          subject: `[3M Travel] Réservation ${existing.requestRef} affectée à votre file`,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#172554"><h2 style="margin-top:0;color:#1d4ed8">Nouvelle réservation affectée</h2><p>La demande <strong>${existing.requestRef}</strong> vous a été affectée.</p><p><strong>Client :</strong> ${existing.candidateEmail}<br/><strong>Trajet :</strong> ${flightSummary.origin} → ${flightSummary.destination}<br/><strong>Compagnie :</strong> ${flightSummary.airline}<br/><strong>Départ :</strong> ${flightSummary.departure}<br/><strong>Priorité :</strong> ${existing.priority}</p><p>Connectez-vous au tableau de bord pour mettre à jour le statut et ajouter vos notes internes.</p></div>`,
        });
        notificationEmailSent = true;
      } catch (error) {
        console.error("[FlightBooking] assigned advisor notification failed", error);
      }
      return { success: true, notificationEmailSent };
    }),

  updateStatus: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), status: z.enum(requestStatus), details: z.string().max(4000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      if (existing.status === input.status) return { success: true, unchanged: true, notificationEmailSent: false };
      await db.update(flightBookingRequests).set({ status: input.status, agentNotes: input.details ?? existing.agentNotes }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "status_changed", changedBy: admin.email, oldValue: existing.status, newValue: input.status, details: input.details ?? null });
      let notificationEmailSent = false;
      try {
        const flightSummary = getFlightEmailSummary((existing.flightData ?? {}) as FlightTimingData);
        await sendEmail({
          to: existing.candidateEmail,
          subject: `[3M Travel] Mise à jour de votre réservation ${existing.requestRef}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#172554"><h2 style="margin-top:0;color:#1d4ed8">Votre réservation a été mise à jour</h2><p>Bonjour,</p><p>Le statut de votre réservation <strong>${existing.requestRef}</strong> a évolué.</p><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px"><p style="margin:0 0 8px"><strong>Nouveau statut :</strong> ${customerStatusLabels[input.status]}</p><p style="margin:0"><strong>Trajet :</strong> ${flightSummary.origin} → ${flightSummary.destination}<br/><strong>Départ :</strong> ${flightSummary.departure}</p></div>${input.details ? `<p style="margin-top:18px"><strong>Information de l’agence :</strong><br/>${input.details.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}<p style="margin-top:18px">Vous pouvez consulter le suivi de votre dossier dans votre espace client ou répondre à l’agence si une information complémentaire est nécessaire.</p><p>Cordialement,<br/><strong>3M Travel & Services</strong></p></div>`,
        });
        notificationEmailSent = true;
      } catch (error) {
        console.error("[FlightBooking] customer status notification failed", error);
      }
      return { success: true, notificationEmailSent };
    }),

  listReservationPayments: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select().from(flightBookingRequests).orderBy(desc(flightBookingRequests.createdAt));
      return rows;
    }),

  sendPaymentReceiptEmail: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });

      await sendEmail({
        to: existing.candidateEmail,
        subject: `[3M Travel] Reçu de paiement et quittance - Dossier ${existing.requestRef}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Quittance de Paiement Validée</h2>
            <p>Bonjour,</p>
            <p>Nous vous confirmons la validation de votre règlement pour la réservation <strong>${existing.requestRef}</strong>.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0;"><strong>Mode de paiement :</strong> ${existing.paymentMethod === 'orange_money' ? 'Orange Money' : 'Guichet Agence'}</p>
              <p style="margin: 0 0 8px 0;"><strong>ID de transaction :</strong> <span style="font-family: monospace; font-weight: bold;">${existing.paymentTransactionId || 'N/A'}</span></p>
              <p style="margin: 0;"><strong>Statut :</strong> Paiement validé et vérifié par l'agence</p>
            </div>
            <p>Cordialement,<br/><strong>L'équipe 3M Travel & Services</strong></p>
          </div>
        `,
      });

      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "payment_receipt_emailed",
        changedBy: admin.email,
        oldValue: existing.status,
        newValue: existing.status,
        details: "Reçu de paiement et quittance envoyés par e-mail au client.",
      });

      return { success: true };
    }),

  updatePriority: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), priority: z.enum(requestPriority) }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      await db.update(flightBookingRequests).set({ priority: input.priority }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "priority_changed", changedBy: admin.email, oldValue: existing.priority, newValue: input.priority, details: "Priorité opérationnelle modifiée par un agent." });
      return { success: true, priority: input.priority };
    }),

  addNote: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), note: z.string().min(1).max(4000) }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      await db.update(flightBookingRequests).set({ agentNotes: input.note }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "note_added", changedBy: admin.email, oldValue: existing.agentNotes, newValue: input.note, details: "Note interne ajoutée par un agent." });
      return { success: true };
    }),

  updateIssuanceChecklist: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), key: z.enum(issuanceCheckKeys), checked: z.boolean() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const current = existing.issuanceChecklist && typeof existing.issuanceChecklist === "object" ? existing.issuanceChecklist as Record<string, boolean> : {};
      const issuanceChecklist = { ...current, [input.key]: input.checked };
      await db.update(flightBookingRequests).set({ issuanceChecklist }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "issuance_check_updated", changedBy: admin.email, oldValue: String(Boolean(current[input.key])), newValue: String(input.checked), details: `Contrôle d'émission ${input.key} ${input.checked ? "validé" : "retiré"}.` });
      return { success: true, issuanceChecklist };
    }),

  clientValidate: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive(), paymentMethod: z.enum(["agency", "orange_money"]), paymentTransactionId: z.string().trim().min(3).max(120) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id))).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      await db.update(flightBookingRequests).set({
        clientValidated: true,
        paymentMethod: input.paymentMethod,
        paymentTransactionId: input.paymentTransactionId,
        status: "awaiting_payment",
      }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "client_validated",
        changedBy: ctx.candidate.email,
        oldValue: existing.status,
        newValue: "awaiting_payment",
        details: `Client a validé la réservation. Mode: ${input.paymentMethod}, ID Transaction: ${input.paymentTransactionId}`,
      });
      return { success: true };
    }),

  adminValidatePayment: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), approved: z.boolean() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const newStatus = input.approved ? "revalidated" : "pending_review";
      await db.update(flightBookingRequests).set({
        clientValidated: input.approved,
        status: newStatus,
      }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: input.approved ? "payment_approved" : "payment_rejected",
        changedBy: admin.email,
        oldValue: existing.status,
        newValue: newStatus,
        details: input.approved ? "Paiement validé par l'administrateur." : "Paiement rejeté par l'administrateur.",
      });
      return { success: true };
    }),

  updatePnrAndIssuedPdf: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), pnrReference: z.string().trim().min(2).max(120), issuedPdfUrl: z.string().url().optional(), advisorInitials: z.string().trim().min(1).max(10) }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const checklist = existing.issuanceChecklist && typeof existing.issuanceChecklist === "object" ? existing.issuanceChecklist as Record<string, boolean> : {};
      const allChecked = issuanceCheckKeys.every((key) => checklist[key] === true);
      if (!allChecked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Émission impossible : tous les points de la checklist de contrôle avant émission doivent être validés." });
      }
      await db.update(flightBookingRequests).set({
        pnrReference: input.pnrReference,
        issuedPdfUrl: input.issuedPdfUrl || existing.issuedPdfUrl,
        status: "issued",
      }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "pnr_issued",
        changedBy: admin.email,
        oldValue: existing.status,
        newValue: "issued",
        details: `PNR / référence GDS émis par l'agent ${admin.email} (Initiales conseiller: ${input.advisorInitials.toUpperCase()}): ${input.pnrReference}`,
      });
      const loyalty = await awardLoyaltyPointsForIssuedBooking(db, existing, input.requestId);

      // Envoi automatique de la confirmation PDF par e-mail au client
      try {
        const clientEmail = existing.candidateEmail;
        const pdfLink = input.issuedPdfUrl || existing.issuedPdfUrl;
        if (clientEmail) {
          await sendEmail({
            to: clientEmail,
            subject: `[3M Travel] Confirmation de votre billet et reçu PNR - ${existing.requestRef}`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
                <div style="background: #1E3A8A; color: #ffffff; padding: 16px 20px; border-radius: 6px 6px 0 0; text-align: center;">
                  <h2 style="margin: 0; font-size: 20px;">3M Travel & Services</h2>
                  <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Confirmation Officielle de Réservation & PNR</p>
                </div>
                <div style="padding: 24px 20px;">
                  <p>Bonjour,</p>
                  <p>Votre réservation de vol a été validée et émise par notre service de billetterie. Vous trouverez ci-dessous votre référence de réservation officielle :</p>
                  <div style="background: #F8FAFC; border-left: 4px solid #10B981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px;"><strong>Référence Dossier :</strong> ${existing.requestRef}</p>
                    <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Référence PNR / GDS :</strong> <span style="font-family: monospace; color: #059669; font-weight: bold; font-size: 16px;">${input.pnrReference}</span></p>
                    <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Vol ID :</strong> ${existing.flightId}</p>
                  </div>
                  ${pdfLink ? `<p style="text-align: center; margin: 24px 0;"><a href="${pdfLink}" style="background: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">📥 Télécharger votre Billet / Confirmation PDF</a></p>` : ''}
                  <p>Vous pouvez également retrouver ce document et gérer vos options de voyage à tout moment depuis votre <a href="https://www.3mtravelagency.com/mon-espace" style="color: #2563EB; text-decoration: underline;">Espace Client 3M</a>.</p>
                  <p style="margin-top: 24px; font-size: 13px; color: #64748B;">Cordialement,<br><strong>L'équipe Billetterie & Mobilité - 3M Travel & Services</strong><br><a href="mailto:hello@3mtravelagency.com" style="color: #2563EB;">hello@3mtravelagency.com</a></p>
                </div>
                <div style="background: #F1F5F9; padding: 12px 20px; text-align: center; font-size: 11px; color: #64748B; border-radius: 0 0 6px 6px;">
                  Ceci est un message automatisé officiel. Merci de ne pas y répondre directement.
                </div>
              </div>
            `,
          });
        }
      } catch (err) {
        console.error("[Email Notification Error] Échec de l'envoi de la confirmation PNR par e-mail:", err);
      }

      return { success: true, loyalty };
    }),

  generatePaymentReceiptPdf: publicProcedure
    .input(z.object({ requestId: z.number().int().positive(), candidateEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      if (existing.candidateEmail.toLowerCase() !== input.candidateEmail.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé à ce reçu." });
      }

      // Génération d'une quittance au format texte / HTML stockée en S3 ou renvoyée en URL data/signed
      const receiptContent = `QUITTANCE DE PAIEMENT - 3M TRAVEL & SERVICES\nRéférence: ${existing.requestRef}\nClient: ${existing.candidateEmail}\nMode de Paiement: ${existing.paymentMethod === 'orange_money' ? 'Orange Money' : 'Guichet Agence'}\nID de Transaction: ${existing.paymentTransactionId || 'N/A'}\nStatut: ${existing.clientValidated ? 'Validé' : 'En attente'}\nDate: ${existing.createdAt.toISOString()}`;
      const buffer = Buffer.from(receiptContent, "utf-8");
      const { url } = await storagePut(`receipts/${existing.requestRef}-${Date.now()}.txt`, buffer, "text/plain");

      return { success: true, receiptUrl: url, reference: existing.requestRef };
    }),

  adminUploadPnrDocument: publicProcedure
    .input(z.object({
      sessionToken: z.string().min(1),
      requestId: z.number().int().positive(),
      pnrReference: z.string().trim().min(1),
      fileBase64: z.string().min(1),
      fileName: z.string().min(1),
      advisorInitials: z.string().trim().min(1).max(10),
    }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });

      const checklist = existing.issuanceChecklist && typeof existing.issuanceChecklist === "object" ? existing.issuanceChecklist as Record<string, boolean> : {};
      const allChecked = issuanceCheckKeys.every((key) => checklist[key] === true);
      if (!allChecked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Émission impossible : tous les points de la checklist de contrôle avant émission doivent être validés." });
      }

      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length > 8 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier PNR dépasse la taille maximale autorisée (8 Mo)." });
      }
      if (!input.fileName.toLowerCase().endsWith(".pdf")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le document PNR final doit être au format PDF." });
      }

      const { url } = await storagePut(`pnr-documents/${existing.requestRef}-${Date.now()}-${input.fileName}`, buffer, "application/pdf");

      await db.update(flightBookingRequests).set({
        pnrReference: input.pnrReference,
        issuedPdfUrl: url,
        status: "issued",
      }).where(eq(flightBookingRequests.id, input.requestId));

      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "pnr_document_uploaded",
        changedBy: admin.email,
        oldValue: existing.status,
        newValue: "issued",
        details: `Document PNR final téléversé et émis par l'agent ${admin.email} (Initiales conseiller: ${input.advisorInitials.toUpperCase()}): ${input.fileName} (Ref: ${input.pnrReference})`,
      });

      const loyalty = await awardLoyaltyPointsForIssuedBooking(db, existing, input.requestId);

      // Envoi synchrone de l'e-mail de notification au client avec le lien du PNR
      try {
        await sendEmail({
          to: existing.candidateEmail,
          subject: `[3M Travel] Votre document PNR final est disponible - Dossier ${existing.requestRef}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Votre réservation de voyage est confirmée !</h2>
              <p>Bonjour,</p>
              <p>Votre document PNR final pour la référence de dossier <strong>${existing.requestRef}</strong> vient d'être émis et validé par notre agence.</p>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Référence PNR / GDS :</strong> <span style="font-family: monospace; color: #059669; font-weight: bold;">${input.pnrReference}</span></p>
                <p style="margin: 0;">Le document officiel de réservation est désormais accessible et téléchargeable depuis votre espace personnel.</p>
              </div>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${url}" target="_blank" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Télécharger mon billet PNR (PDF)</a>
              </p>
              <p>Merci de faire confiance à <strong>3M Travel & Services</strong> pour votre mobilité internationale.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #64748b; text-align: center;">Ceci est un message automatique, veuillez ne pas y répondre directement.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[Email Notification Error] Impossible d'envoyer l'e-mail PNR:", err);
      }

      return { success: true, issuedPdfUrl: url, loyalty };
    }),

  exportAuditHistoryPdf: publicProcedure
    .input(z.object({ 
      sessionToken: z.string().min(1), 
      requestId: z.number().int().positive(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      
      let historyEntries = await db.select().from(flightBookingRequestHistory).where(eq(flightBookingRequestHistory.requestId, input.requestId)).orderBy(desc(flightBookingRequestHistory.createdAt));

      if (input.startDate) {
        const startTimestamp = new Date(input.startDate).getTime();
        if (!isNaN(startTimestamp)) {
          historyEntries = historyEntries.filter(h => new Date(h.createdAt).getTime() >= startTimestamp);
        }
      }
      if (input.endDate) {
        const endTimestamp = new Date(input.endDate).setHours(23, 59, 59, 999);
        if (!isNaN(endTimestamp)) {
          historyEntries = historyEntries.filter(h => new Date(h.createdAt).getTime() <= endTimestamp);
        }
      }

      const rowsHtml = historyEntries.map(h => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">${new Date(h.createdAt).toLocaleString("fr-FR")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">${h.action}</td>
          <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">${h.changedBy}</td>
          <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 11px; color: #475569;">${h.details || "—"}</td>
        </tr>
      `).join("");

      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>Rapport d'Audit - Dossier ${existing.requestRef}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 30px; background: #ffffff; }
            .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
            h1 { margin: 0; font-size: 22px; }
            p { margin: 5px 0; font-size: 13px; color: #cbd5e1; }
            .meta { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .meta p { color: #334155; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; color: #1e293b; text-align: left; padding: 10px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>3M Travel & Services — Rapport d’Audit & Initiales</h1>
            <p>Historique infalsifiable des validations, contrôles et émissions PNR</p>
          </div>
          <div class="meta">
            <p><strong>Référence Dossier :</strong> ${existing.requestRef}</p>
            <p><strong>Client :</strong> ${existing.candidateEmail}</p>
            <p><strong>Référence PNR / GDS :</strong> ${existing.pnrReference || "Non émis"}</p>
            <p><strong>Statut Actuel :</strong> ${existing.status}</p>
            <p><strong>Généré par :</strong> ${admin.email} le ${new Date().toLocaleString("fr-FR")}</p>
          </div>
          <h3>Journal complet des événements et initiales</h3>
          <table>
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Action</th>
                <th>Auteur / Agent</th>
                <th>Détails & Initiales</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <p>Document officiel certifié généré par le système sécurisé de 3M Travel & Services SARL — Tous droits réservés.</p>
          </div>
        </body>
        </html>
      `;

      // Génération d'un véritable PDF avec jsPDF
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text("3M Travel & Services - Rapport d'Audit & Initiales", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Historique infalsifiable des validations, contrôles et émissions PNR", 15, 27);

      doc.setDrawColor(203, 213, 225);
      doc.line(15, 32, 195, 32);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Référence Dossier : ${existing.requestRef}`, 15, 42);
      doc.text(`Client : ${existing.candidateEmail}`, 15, 49);
      doc.text(`Référence PNR / GDS : ${existing.pnrReference || "Non émis"}`, 15, 56);
      doc.text(`Statut Actuel : ${existing.status}`, 115, 42);
      doc.text(`Généré par : ${admin.email}`, 115, 49);
      doc.text(`Date : ${new Date().toLocaleString("fr-FR")}`, 115, 56);

      // Génération du QR code d'authenticité
      try {
        const qrDataUrl = await QRCode.toDataURL(`https://3mtravelagency.com/verify?ref=${existing.requestRef}&t=${Date.now()}`);
        doc.addImage(qrDataUrl, "PNG", 165, 38, 25, 25);
      } catch (err) {
        console.error("[QR Code Error]:", err);
      }

      const tableRows = historyEntries.map(h => [
        new Date(h.createdAt).toLocaleString("fr-FR"),
        h.action,
        h.changedBy,
        h.details || "—"
      ]);

      (doc as any).autoTable({
        startY: 68,
        head: [["Date / Heure", "Action", "Auteur / Agent", "Détails & Initiales"]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 3, fillColor: [255, 255, 255] },
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 35 }, 2: { cellWidth: 40 }, 3: { cellWidth: 60 } },
        didDrawPage: () => {
          // Filigrane de sécurité officiel
          doc.saveGraphicsState();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(48);
          doc.setTextColor(230, 235, 245);
          doc.setGState(new (doc as any).GState({ opacity: 0.22 }));
          doc.text("3M TRAVEL & SERVICES - CERTIFIÉ", 25, 150, { angle: 45 });
          doc.restoreGraphicsState();
        }
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      const { url } = await storagePut(`audit-reports/${existing.requestRef}-audit-${Date.now()}.pdf`, pdfBuffer, "application/pdf");
      return { success: true, auditReportUrl: url, reference: existing.requestRef };
    }),

  exportAuditHistoryCsv: publicProcedure
    .input(z.object({ 
      sessionToken: z.string().min(1), 
      requestId: z.number().int().positive(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      
      let historyEntries = await db.select().from(flightBookingRequestHistory).where(eq(flightBookingRequestHistory.requestId, input.requestId)).orderBy(desc(flightBookingRequestHistory.createdAt));

      if (input.startDate) {
        const startTimestamp = new Date(input.startDate).getTime();
        if (!isNaN(startTimestamp)) {
          historyEntries = historyEntries.filter(h => new Date(h.createdAt).getTime() >= startTimestamp);
        }
      }
      if (input.endDate) {
        const endTimestamp = new Date(input.endDate).setHours(23, 59, 59, 999);
        if (!isNaN(endTimestamp)) {
          historyEntries = historyEntries.filter(h => new Date(h.createdAt).getTime() <= endTimestamp);
        }
      }

      const header = ["Date / Heure", "Action", "Auteur / Agent", "Détails & Initiales"];
      const rows = historyEntries.map(h => [
        new Date(h.createdAt).toLocaleString("fr-FR"),
        h.action,
        h.changedBy,
        h.details || ""
      ]);

      const csvContent = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const buffer = Buffer.from("\uFEFF" + csvContent, "utf-8");
      const { url } = await storagePut(`audit-reports/${existing.requestRef}-audit-${Date.now()}.csv`, buffer, "text/csv;charset=utf-8");
      return { success: true, csvUrl: url, reference: existing.requestRef };
    }),

  markPnrAsViewed: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id))).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      if (!existing.pnrViewedAt) {
        await db.update(flightBookingRequests).set({ pnrViewedAt: new Date() }).where(eq(flightBookingRequests.id, input.requestId));
      }
      return { success: true };
    }),

  markPnrAsDownloaded: candidateProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(and(eq(flightBookingRequests.id, input.requestId), eq(flightBookingRequests.candidateId, ctx.candidate.id))).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      const now = new Date();
      await db.update(flightBookingRequests).set({
        pnrViewedAt: existing.pnrViewedAt || now,
        pnrDownloadedAt: now,
      }).where(eq(flightBookingRequests.id, input.requestId));
      return { success: true };
    }),

  sendPnrReminderEmail: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable." });
      if (!existing.issuedPdfUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun PNR n'a encore été émis pour cette réservation." });

      await sendEmail({
        to: existing.candidateEmail,
        subject: `[Rappel 3M Travel] Téléchargement de votre billet PNR en attente - Dossier ${existing.requestRef}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Rappel : Votre billet PNR est disponible</h2>
            <p>Bonjour,</p>
            <p>Sauf erreur de notre part, vous n'avez pas encore consulté ou téléchargé votre document PNR final pour la référence de dossier <strong>${existing.requestRef}</strong>.</p>
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f59e0b;">
              <p style="margin: 0 0 10px 0; color: #b45309;"><strong>Référence PNR / GDS :</strong> <span style="font-family: monospace; font-weight: bold;">${existing.pnrReference || 'N/A'}</span></p>
              <p style="margin: 0; color: #92400e;">Veuillez vous rendre dans votre espace personnel pour le récupérer dès que possible.</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${existing.issuedPdfUrl}" target="_blank" style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Télécharger mon billet PNR</a>
            </p>
            <p>Cordialement,<br/><strong>L'équipe 3M Travel & Services</strong></p>
          </div>
        `,
      });

      await db.insert(flightBookingRequestHistory).values({
        requestId: input.requestId,
        action: "pnr_reminder_sent",
        changedBy: admin.email,
        oldValue: existing.status,
        newValue: existing.status,
        details: "Relance manuelle PNR non consulté envoyée par e-mail au client.",
      });

      return { success: true };
    }),

  exportPnrAuditCsv: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select().from(flightBookingRequests).orderBy(desc(flightBookingRequests.createdAt));
      const headers = ["ID", "Reference", "Client", "Statut", "PNR", "Date Creation", "Date Vue PNR", "Date Telechargement PNR"];
      const csvLines = [headers.join(",")];
      for (const r of rows) {
        const viewed = r.pnrViewedAt ? new Date(r.pnrViewedAt).toISOString() : "Non consulté";
        const downloaded = r.pnrDownloadedAt ? new Date(r.pnrDownloadedAt).toISOString() : "Non téléchargé";
        csvLines.push([r.id, `"${r.requestRef}"`, `"${r.candidateEmail}"`, r.status, `"${r.pnrReference || ''}"`, new Date(r.createdAt).toISOString(), `"${viewed}"`, `"${downloaded}"`].join(","));
      }
      return { success: true, csvContent: csvLines.join("\n") };
    }),
});
