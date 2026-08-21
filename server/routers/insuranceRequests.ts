import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { adminNotifications, insuranceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { notifyInsuranceRequest, sendInsuranceClientDelivery } from "../services/insuranceRequestNotification";
import { createInsuranceCouponPdf } from "../services/insuranceCoupon";
import { storageGetSignedUrl, storagePut } from "../storage";
import { requireAdminSessionFromCookie } from "./adminAuth";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const travelerSchema = z.object({
  fullName: z.string().trim().min(2).max(255),
  dateOfBirth: isoDate,
  nationality: z.string().trim().min(2).max(100),
  passportNumber: z.string().trim().min(4).max(64),
});
const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(255),
  email: z.string().email().max(320),
  phone: z.string().trim().min(6).max(50),
  dateOfBirth: isoDate,
  nationality: z.string().trim().min(2).max(100),
  passportNumber: z.string().trim().min(4).max(64),
  residenceCountry: z.string().trim().min(2).max(100),
  destinationCountry: z.string().trim().min(2).max(100),
  departureDate: isoDate,
  returnDate: isoDate,
  tripPurpose: z.string().trim().min(2).max(80),
  coveragePlan: z.string().trim().min(2).max(80),
  travelers: z.array(travelerSchema).min(1).max(8),
  emergencyContactName: z.string().trim().min(2).max(255),
  emergencyContactPhone: z.string().trim().min(6).max(50),
  notes: z.string().trim().max(1500).optional(),
  acceptedConsent: z.literal(true),
}).refine(input => input.returnDate >= input.departureDate, { message: "La date de retour doit être postérieure au départ.", path: ["returnDate"] });

const statusSchema = z.enum(["new", "contacted", "quote_sent", "completed", "cancelled"]);
const makeReference = () => `ASR-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
const whatsappSummary = (input: z.infer<typeof requestSchema>, reference: string) => [
  "Bonjour 3M Travel, une demande d’assurance voyage vient d’être créée.",
  `Référence : ${reference}`,
  `Client : ${input.fullName}`,
  `Destination : ${input.destinationCountry}`,
  `Séjour : ${input.departureDate} au ${input.returnDate}`,
  `Voyageurs : ${input.travelers.length}`,
  "Merci de me contacter pour finaliser le devis.",
].join("\n");

export const insuranceRequestsRouter = router({
  create: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const reference = makeReference();
    await db.insert(insuranceRequests).values({
      reference,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00.000Z`),
      nationality: input.nationality,
      passportNumber: input.passportNumber,
      residenceCountry: input.residenceCountry,
      destinationCountry: input.destinationCountry,
      departureDate: new Date(`${input.departureDate}T00:00:00.000Z`),
      returnDate: new Date(`${input.returnDate}T00:00:00.000Z`),
      tripPurpose: input.tripPurpose,
      coveragePlan: input.coveragePlan,
      travelersCount: input.travelers.length,
      travelersJson: JSON.stringify(input.travelers),
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      notes: input.notes || null,
      consentAt: new Date(),
    });
    const created = await db.select({ id: insuranceRequests.id }).from(insuranceRequests).where(eq(insuranceRequests.reference, reference)).limit(1);
    const requestId = created[0]?.id;
    if (!requestId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Référence d’assurance introuvable après création." });
    const couponFileName = `coupon-assurance-${reference}.pdf`;
    const coupon = createInsuranceCouponPdf({ reference, fullName: input.fullName, destinationCountry: input.destinationCountry, departureDate: input.departureDate, returnDate: input.returnDate, coveragePlan: input.coveragePlan, travelersCount: input.travelers.length });
    const storedCoupon = await storagePut(`insurance-coupons/${reference}/${couponFileName}`, coupon, "application/pdf");
    const couponGeneratedAt = new Date();
    await db.update(insuranceRequests).set({ couponFileKey: storedCoupon.key, couponFileName, couponGeneratedAt }).where(eq(insuranceRequests.id, requestId));
    await db.insert(adminNotifications).values({
      type: "new_contact_message",
      title: "Nouvelle demande d’assurance voyage",
      message: `${input.fullName} — ${input.destinationCountry} — ${reference}`,
      relatedId: reference,
      targetAdminType: "accompagnement",
    });
    void notifyInsuranceRequest({
      reference, fullName: input.fullName, email: input.email, phone: input.phone,
      destinationCountry: input.destinationCountry, departureDate: input.departureDate,
      returnDate: input.returnDate, travelersCount: input.travelers.length,
    }).catch(error => console.error("[InsuranceRequest] Alerte e-mail non envoyée", error));
    void (async () => {
      try {
        const couponUrl = await storageGetSignedUrl(storedCoupon.key);
        await sendInsuranceClientDelivery({ reference, fullName: input.fullName, email: input.email, phone: input.phone, destinationCountry: input.destinationCountry, departureDate: input.departureDate, returnDate: input.returnDate, travelersCount: input.travelers.length, documentUrl: couponUrl, documentLabel: couponFileName, documentKind: "coupon" });
        await db.update(insuranceRequests).set({ couponEmailSentAt: new Date() }).where(eq(insuranceRequests.id, requestId));
      } catch (error) { console.error("[InsuranceRequest] Coupon client non envoyé", error); }
    })();
    return { reference, requestId, couponReady: true };
  }),

  adminList: publicProcedure.query(async ({ ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select().from(insuranceRequests).orderBy(desc(insuranceRequests.createdAt));
  }),

  updateStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(insuranceRequests).set({ status: input.status }).where(eq(insuranceRequests.id, input.id));
    return { success: true };
  }),

  uploadAttestation: publicProcedure.input(z.object({
    id: z.number().int().positive(),
    fileName: z.string().trim().min(5).max(255),
    mimeType: z.literal("application/pdf"),
    dataBase64: z.string().min(20).max(7_000_000),
  })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const requests = await db.select().from(insuranceRequests).where(eq(insuranceRequests.id, input.id)).limit(1);
    const request = requests[0];
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande d’assurance introuvable." });
    const bytes = Buffer.from(input.dataBase64, "base64");
    if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "L’attestation PDF doit peser au maximum 5 Mo." });
    if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier doit être un PDF valide." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = await storagePut(`insurance-attestations/${request.reference}/${safeName}`, bytes, input.mimeType);
    await db.update(insuranceRequests).set({ attestationFileKey: stored.key, attestationFileName: input.fileName, status: "completed" }).where(eq(insuranceRequests.id, request.id));
    let emailSent = true;
    try {
      const attestationUrl = await storageGetSignedUrl(stored.key);
      await sendInsuranceClientDelivery({ reference: request.reference, fullName: request.fullName, email: request.email, phone: request.phone, destinationCountry: request.destinationCountry, departureDate: request.departureDate.toISOString().slice(0, 10), returnDate: request.returnDate.toISOString().slice(0, 10), travelersCount: request.travelersCount, documentUrl: attestationUrl, documentLabel: input.fileName, documentKind: "attestation" });
      await db.update(insuranceRequests).set({ attestationEmailSentAt: new Date() }).where(eq(insuranceRequests.id, request.id));
    } catch (error) { emailSent = false; console.error("[InsuranceRequest] Attestation client non envoyée", error); }
    return { success: true, fileName: input.fileName, emailSent };
  }),

  downloadAttestation: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const requests = await db.select().from(insuranceRequests).where(eq(insuranceRequests.id, input.id)).limit(1);
    const request = requests[0];
    if (!request?.attestationFileKey) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune attestation disponible." });
    return { url: await storageGetSignedUrl(request.attestationFileKey), fileName: request.attestationFileName };
  }),

  downloadCoupon: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const requests = await db.select().from(insuranceRequests).where(eq(insuranceRequests.id, input.id)).limit(1);
    const request = requests[0];
    if (!request?.couponFileKey) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun coupon disponible." });
    return { url: await storageGetSignedUrl(request.couponFileKey), fileName: request.couponFileName };
  }),
});
