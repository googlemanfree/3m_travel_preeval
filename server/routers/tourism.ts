import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { adminNotifications, tourismServiceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
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
    try {
      const ai = await invokeLLM({
        messages: [
          { role: "system", content: "Tu es un assistant de voyage prudent. Réponds en français en 3 phrases maximum, sans inventer de tarifs ni garantir de disponibilité." },
          { role: "user", content: `Présente ${input.destination} à partir de ces suggestions Google : ${places.map(p => p.name).join(", ") || "aucune"}.` }
        ]
      });
      const rawContent = ai.choices[0]?.message?.content;
      if (typeof rawContent === "string") {
        briefing = rawContent;
      } else if (Array.isArray(rawContent)) {
        briefing = rawContent.map(part => ('text' in part ? part.text : '')).join(' ');
      }
    } catch { /* repli transparent */ }
    return { places, briefing, sourceNote: "Suggestions Google et aperçu IA à titre informatif. Tarifs et disponibilités à confirmer par l’agence." };
  }),
  create: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const reference = `TRM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
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

  exportIcal: publicProcedure.query(async ({ ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select().from(tourismServiceRequests);
    const confirmed = rows.filter(r => r.status === "confirmed" || r.status === "completed");
    
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//3M Travel & Services//Admin Calendar//FR\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    for (const r of confirmed) {
      const start = r.departureDate ? new Date(r.departureDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : new Date(r.createdAt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const end = r.returnDate ? new Date(r.returnDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : start;
      ics += "BEGIN:VEVENT\n";
      ics += `UID:tourism-${r.id}@3mtravelagency.com\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}\n`;
      ics += `DTSTART:${start}\n`;
      ics += `DTEND:${end}\n`;
      ics += `SUMMARY:Réservation ${r.destination} (${r.fullName})\n`;
      ics += `DESCRIPTION:Référence: ${r.reference}\\nClient: ${r.fullName} (${r.email})\\nType: Tourisme\\nStatut: ${r.status}\n`;
      ics += "END:VEVENT\n";
    }
    ics += "END:VCALENDAR";

    return {
      fileName: `3m_travel_reservations_${new Date().toISOString().split("T")[0]}.ics`,
      icsContent: ics,
    };
  }),
});
