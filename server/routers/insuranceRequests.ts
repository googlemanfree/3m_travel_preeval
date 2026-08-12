import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { adminNotifications, insuranceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { notifyInsuranceRequest } from "../services/insuranceRequestNotification";
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
    return { reference, whatsappMessage: whatsappSummary(input, reference) };
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
});
