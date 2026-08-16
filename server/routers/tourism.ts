import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { adminNotifications, tourismServiceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { makeRequest, type PlacesSearchResult } from "../_core/map";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { requireAdminSessionFromCookie } from "./adminAuth";

const serviceType = z.enum(["hotel", "vehicle", "pack"]);
export type TourismServiceType = z.infer<typeof serviceType>;
export function buildTourismServiceTypes(pack: string | undefined, selected: TourismServiceType[]) {
  const required: Record<string, TourismServiceType[]> = { escapade: ["hotel", "pack"], explorer: ["hotel", "vehicle", "pack"], business: ["hotel", "vehicle", "pack"] };
  return Array.from(new Set([...(selected || []), ...(pack ? required[pack] || ["pack"] : [])]));
}
const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(255), email: z.string().email().max(320), phone: z.string().trim().min(6).max(50), destination: z.string().trim().min(2).max(160),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), travelersCount: z.number().int().min(1).max(12),
  serviceTypes: z.array(serviceType).min(1), packType: z.string().trim().max(80).optional(), hotelCategory: z.string().trim().max(80).optional(), vehicleCategory: z.string().trim().max(80).optional(), pickupLocation: z.string().trim().max(255).optional(), budgetXaf: z.number().int().positive().max(20_000_000).optional(), notes: z.string().trim().max(1500).optional(), enrichment: z.any().optional(),
}).refine(v => !v.returnDate || !v.departureDate || v.returnDate >= v.departureDate, { message: "La date de retour doit être postérieure à la date de départ." });

const statusSchema = z.enum(["new", "contacted", "quote_sent", "confirmed", "completed", "cancelled"]);

export const tourismRouter = router({
  discover: publicProcedure.input(z.object({ destination: z.string().trim().min(2).max(160) })).mutation(async ({ input }) => {
    let places: Array<{ name: string; address: string; rating?: number }> = [];
    try { const google = await makeRequest<PlacesSearchResult>("/maps/api/place/textsearch/json", { query: `attractions touristiques et hôtels à ${input.destination}` }); places = (google.results || []).slice(0, 5).map(p => ({ name: p.name, address: p.formatted_address, rating: p.rating })); } catch { /* suggestions facultatives */ }
    let briefing = "Les disponibilités, tarifs et conditions sont confirmés par 3M Travel avant toute réservation.";
    try { const ai = await invokeLLM({ messages: [{ role: "system", content: "Tu es un assistant de voyage prudent. Réponds en français en 3 phrases maximum, sans inventer de tarifs ni garantir de disponibilité." }, { role: "user", content: `Présente ${input.destination} à partir de ces suggestions Google : ${places.map(p => p.name).join(", ") || "aucune"}.` }] }); briefing = ai.choices[0]?.message?.content || briefing; } catch { /* repli transparent */ }
    return { places, briefing, sourceNote: "Suggestions Google et aperçu IA à titre informatif. Tarifs et disponibilités à confirmer par l’agence." };
  }),
  create: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const reference = `TRM-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
    await db.insert(tourismServiceRequests).values({ reference, fullName: input.fullName, email: input.email, phone: input.phone, destination: input.destination, departureDate: input.departureDate ? new Date(`${input.departureDate}T00:00:00Z`) : null, returnDate: input.returnDate ? new Date(`${input.returnDate}T00:00:00Z`) : null, travelersCount: input.travelersCount, serviceTypesJson: JSON.stringify(buildTourismServiceTypes(input.packType, input.serviceTypes)), packType: input.packType || null, hotelCategory: input.hotelCategory || null, vehicleCategory: input.vehicleCategory || null, pickupLocation: input.pickupLocation || null, budgetXaf: input.budgetXaf ?? null, notes: input.notes || null, enrichmentJson: input.enrichment ? JSON.stringify(input.enrichment) : null });
    await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Nouvelle demande Tourisme", message: `${input.fullName} — ${input.destination} — ${reference}`, relatedId: reference, targetAdminType: "accompagnement" });
    return { reference };
  }),

  adminList: publicProcedure.query(async ({ ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select().from(tourismServiceRequests).orderBy(desc(tourismServiceRequests.createdAt));
  }),

  updateStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(tourismServiceRequests).set({ status: input.status }).where(eq(tourismServiceRequests.id, input.id));
    return { success: true };
  }),

  updateDetails: publicProcedure.input(z.object({ id: z.number().int().positive(), quotedPriceXaf: z.number().int().positive().optional(), adminNotes: z.string().max(1500).optional() })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const updateData: Record<string, any> = {};
    if (input.quotedPriceXaf !== undefined) updateData.quotedPriceXaf = input.quotedPriceXaf;
    if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;
    if (Object.keys(updateData).length > 0) {
      await db.update(tourismServiceRequests).set(updateData).where(eq(tourismServiceRequests.id, input.id));
    }
    return { success: true };
  }),

  updatePnrAndVoucher: publicProcedure.input(z.object({ id: z.number().int().positive(), pnrReference: z.string().trim().min(2).max(120), voucherPdfUrl: z.string().url().optional() })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(tourismServiceRequests).set({ pnrReference: input.pnrReference, voucherPdfUrl: input.voucherPdfUrl || null, status: "confirmed" }).where(eq(tourismServiceRequests.id, input.id));
    return { success: true };
  }),

  uploadVoucherPdf: publicProcedure.input(z.object({
    id: z.number().int().positive(),
    fileName: z.string().trim().min(5).max(255),
    mimeType: z.literal("application/pdf"),
    dataBase64: z.string().min(20).max(7_000_000),
  })).mutation(async ({ input, ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const requests = await db.select().from(tourismServiceRequests).where(eq(tourismServiceRequests.id, input.id)).limit(1);
    const req = requests[0];
    if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
    const bytes = Buffer.from(input.dataBase64, "base64");
    if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier PDF doit peser au maximum 5 Mo." });
    if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier doit être un PDF valide." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = await storagePut(`tourism-vouchers/${req.reference}/${safeName}`, bytes, input.mimeType);
    await db.update(tourismServiceRequests).set({ voucherPdfUrl: stored.url, status: "confirmed" }).where(eq(tourismServiceRequests.id, req.id));
    return { success: true, url: stored.url };
  }),

  exportIcal: publicProcedure.query(async ({ ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    const rows = await db.select().from(tourismServiceRequests).where(eq(tourismServiceRequests.status, "confirmed"));
    const formatDate = (dateVal: Date | null) => {
      if (!dateVal) return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      return new Date(dateVal).toISOString().replace(/[-:]/g, "").split("T")[0];
    };

    let icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//3M Travel & Services//Admin Calendar//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    for (const r of rows) {
      const start = formatDate(r.departureDate);
      const end = formatDate(r.returnDate || r.departureDate);
      icsLines.push(
        "BEGIN:VEVENT",
        `UID:tourism-${r.id}@3mtravelagency.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:Réservation 3M: ${r.destination} (${r.fullName})`,
        `DESCRIPTION:Client: ${r.fullName} - Ref: ${r.reference} - Voyageurs: ${r.travelersCount} - Statut: Confirmé`,
        `LOCATION:${r.destination}`,
        "END:VEVENT"
      );
    }

    icsLines.push("END:VCALENDAR");
    return { icsContent: icsLines.join("\r\n"), fileName: "3m_travel_reservations.ics" };
  }),
});
