import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  flightBookingRequestHistory,
  flightBookingRequests,
  passportScanRequests,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure, findCandidateFromAuthorizationHeader, getOrCreateCandidateForPlatformUser } from "./candidate";
import { getDb } from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
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
      const inserted = await db.insert(flightBookingRequests).values({
        requestRef,
        candidateId: requester.candidateId,
        candidateEmail: requester.email,
        flightId: input.flightId,
        flightData: input.flightData,
        passengerData: input.passengerData,
        candidatePhone: extractCandidatePhone(input.passengerData),
        priority: "normal",
        status: "pending_review",
      });
      const requestId = Number((inserted as any)[0]?.insertId ?? 0);
      await db.insert(flightBookingRequestHistory).values({
        requestId,
        action: "created",
        changedBy: requester.email,
        oldValue: null,
        newValue: "pending_review",
        details: requester.isGuest ? "Demande de réservation invitée créée depuis le checkout en ligne." : "Demande de réservation créée depuis le checkout candidat.",
      });
      return { success: true, requestId, requestRef, status: "pending_review" as const, requiresAccountActivation: requester.isGuest };
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
      createdAt: flightBookingRequests.createdAt,
      updatedAt: flightBookingRequests.updatedAt,
    }).from(flightBookingRequests)
      .where(eq(flightBookingRequests.candidateId, ctx.candidate.id))
      .orderBy(desc(flightBookingRequests.createdAt));
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
      return { success: true };
    }),

  updateStatus: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), requestId: z.number().int().positive(), status: z.enum(requestStatus), details: z.string().max(4000).optional() }))
    .mutation(async ({ input }) => {
      const admin = await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const [existing] = await db.select().from(flightBookingRequests).where(eq(flightBookingRequests.id, input.requestId)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Demande de vol introuvable." });
      await db.update(flightBookingRequests).set({ status: input.status, agentNotes: input.details ?? existing.agentNotes }).where(eq(flightBookingRequests.id, input.requestId));
      await db.insert(flightBookingRequestHistory).values({ requestId: input.requestId, action: "status_changed", changedBy: admin.email, oldValue: existing.status, newValue: input.status, details: input.details ?? null });
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

  listReservationPayments: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .query(async ({ input }) => {
      await assertAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const rows = await db.select({
        id: flightBookingRequests.id,
        requestRef: flightBookingRequests.requestRef,
        candidateEmail: flightBookingRequests.candidateEmail,
        flightData: flightBookingRequests.flightData,
        status: flightBookingRequests.status,
        paymentMethod: flightBookingRequests.paymentMethod,
        paymentTransactionId: flightBookingRequests.paymentTransactionId,
        clientValidated: flightBookingRequests.clientValidated,
        createdAt: flightBookingRequests.createdAt,
      }).from(flightBookingRequests).orderBy(desc(flightBookingRequests.createdAt));
      return rows;
    }),
});
