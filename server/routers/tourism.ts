import { randomInt } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, desc, eq, isNotNull, like, or } from "drizzle-orm";
import { adminNotifications, hotelCatalog, tourismServiceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { makeRequest, type PlacesSearchResult } from "../_core/map";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { requireAdminSessionFromCookie, requireValidAdminSession } from "./adminAuth";
import { candidateProcedure, findCandidateFromAuthorizationHeader } from "./candidate";

const serviceType = z.enum(["hotel", "vehicle", "pack"]);
export type TourismServiceType = z.infer<typeof serviceType>;
const hotelAmenity = z.enum(["pool", "wifi", "parking"]);
export type HotelAmenity = z.infer<typeof hotelAmenity>;
const hotelAmenitySearchTerms: Record<HotelAmenity, string> = { pool: "piscine", wifi: "Wi-Fi", parking: "parking" };
export const OSM_CATALOG_ATTRIBUTION = "© OpenStreetMap contributors, ODbL";

async function requireTourismAdminSession(ctx: { req: { headers: { cookie?: string } } }, sessionToken?: string) {
  if (ctx.req.headers.cookie?.includes("admin_session=")) {
    return requireAdminSessionFromCookie(ctx.req.headers.cookie);
  }
  if (sessionToken) return requireValidAdminSession(sessionToken);
  return requireAdminSessionFromCookie(ctx.req.headers.cookie);
}

const osmCityScopes = {
  douala: { city: "Douala", country: "Cameroun", bbox: "4.000,9.550,4.150,9.850" },
  yaounde: { city: "Yaoundé", country: "Cameroun", bbox: "3.750,11.400,3.980,11.650" },
  kribi: { city: "Kribi", country: "Cameroun", bbox: "2.850,9.860,2.990,9.970" },
  limbe: { city: "Limbe", country: "Cameroun", bbox: "4.000,9.150,4.080,9.280" },
  libreville: { city: "Libreville", country: "Gabon", bbox: "0.310,9.350,0.550,9.570" },
  brazzaville: { city: "Brazzaville", country: "République du Congo", bbox: "-4.360,15.150,-4.150,15.360" },
  ndjamena: { city: "N'Djamena", country: "Tchad", bbox: "12.000,15.000,12.200,15.200" },
  malabo: { city: "Malabo", country: "Guinée équatoriale", bbox: "3.700,8.690,3.820,8.860" },
  bangui: { city: "Bangui", country: "République centrafricaine", bbox: "4.280,18.480,4.480,18.700" },
} as const;
const osmCityKey = z.enum(["douala", "yaounde", "kribi", "limbe", "libreville", "brazzaville", "ndjamena", "malabo", "bangui"]);

type OSMHotelElement = { type: "node" | "way" | "relation"; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

function safeExternalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value.startsWith("www.") ? `https://${value}` : value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function mapOsmHotelElement(element: OSMHotelElement, scope: { city: string; country: string }) {
  const tags = element.tags ?? {};
  const amenities = [
    ...(tags.swimming_pool === "yes" || tags.pool === "yes" || tags.leisure === "swimming_pool" ? ["pool"] : []),
    ...(tags.internet_access === "wlan" || tags.internet_access === "wifi" || tags.wifi === "yes" ? ["wifi"] : []),
    ...(tags.parking === "yes" || tags.amenity === "parking" ? ["parking"] : []),
  ] as HotelAmenity[];
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ") || null;
  return {
    source: "openstreetmap" as const,
    sourceId: `osm:${element.type}:${element.id}`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    sourceAttribution: OSM_CATALOG_ATTRIBUTION,
    name: tags.name?.trim() || `Hôtel OpenStreetMap ${element.id}`,
    country: scope.country,
    city: scope.city,
    address,
    latitude: latitude === undefined ? null : String(latitude),
    longitude: longitude === undefined ? null : String(longitude),
    officialWebsiteUrl: safeExternalUrl(tags.website || tags["contact:website"]),
    officialBookingUrl: safeExternalUrl(tags["booking:website"] || tags["reservation:website"]),
    phone: tags.phone || tags["contact:phone"] || null,
    stars: Number.isInteger(Number(tags.stars)) ? Number(tags.stars) : null,
    amenitiesJson: JSON.stringify(amenities),
    rawSourceJson: JSON.stringify({ type: element.type, id: element.id, tags }),
  };
}

function parseCatalogAmenities(raw: string | null): HotelAmenity[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is HotelAmenity => item === "pool" || item === "wifi" || item === "parking") : [];
  } catch {
    return [];
  }
}

export function buildHotelTechnicalPrecheck(entry: {
  name: string;
  city: string;
  country: string;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  officialWebsiteUrl: string | null;
  officialBookingUrl: string | null;
  phone: string | null;
}) {
  const sourcePresent = Boolean(entry.sourceUrl && entry.sourceAttribution);
  const officialLinkPresent = Boolean(safeExternalUrl(entry.officialBookingUrl || entry.officialWebsiteUrl));
  const identityPresent = Boolean(entry.name.trim() && !entry.name.startsWith("Hôtel OpenStreetMap"));
  const locationPresent = Boolean(entry.city.trim() && entry.country.trim());
  const contactPresent = Boolean(entry.phone?.trim());
  const score = [sourcePresent, officialLinkPresent, identityPresent, locationPresent, contactPresent].filter(Boolean).length;
  return {
    sourcePresent,
    officialLinkPresent,
    identityPresent,
    locationPresent,
    contactPresent,
    score,
    maxScore: 5,
    readyForHumanConfirmation: sourcePresent && officialLinkPresent && identityPresent && locationPresent,
    requiresHumanValidation: true,
  };
}
export function buildTourismServiceTypes(pack: string | undefined, selected: TourismServiceType[]) {
  const required: Record<string, TourismServiceType[]> = { escapade: ["hotel", "pack"], explorer: ["hotel", "vehicle", "pack"], business: ["hotel", "vehicle", "pack"] };
  return Array.from(new Set([...(selected || []), ...(pack ? required[pack] || ["pack"] : [])]));
}
export function buildTourismPlace(place: { name: string; formatted_address: string; rating?: number; price_level?: number }) {
  return { name: place.name, address: place.formatted_address, rating: place.rating, priceLevel: place.price_level };
}
export function buildHotelDiscoveryQuery(destination: string, amenities: HotelAmenity[]) {
  const preferredAmenities = amenities.map((amenity) => hotelAmenitySearchTerms[amenity]).join(" ");
  return `hôtels ${preferredAmenities} à ${destination}`.replace(/\s+/g, " ").trim();
}
const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(255), email: z.string().email().max(320), phone: z.string().trim().min(6).max(50), destination: z.string().trim().min(2).max(160),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), travelersCount: z.number().int().min(1).max(12),
  serviceTypes: z.array(serviceType).min(1), packType: z.string().trim().max(80).optional(), hotelCategory: z.string().trim().max(80).optional(), vehicleCategory: z.string().trim().max(80).optional(), pickupLocation: z.string().trim().max(255).optional(), budgetXaf: z.number().int().positive().max(20_000_000).optional(), notes: z.string().trim().max(1500).optional(), enrichment: z.any().optional(),
}).refine(v => !v.returnDate || !v.departureDate || v.returnDate >= v.departureDate, { message: "La date de retour doit être postérieure à la date de départ." });

const statusSchema = z.enum(["new", "contacted", "quote_sent", "confirmed", "completed", "cancelled"]);

export const tourismTrackingMeta: Record<z.infer<typeof statusSchema>, { label: string; detail: string; tone: string; step: number }> = {
  new: { label: "Demande reçue", detail: "Votre demande a été transmise à l’équipe 3M.", tone: "amber", step: 1 },
  contacted: { label: "Prise en charge", detail: "Un conseiller vérifie les disponibilités avec vous.", tone: "blue", step: 2 },
  quote_sent: { label: "Devis disponible", detail: "Votre proposition est prête à être confirmée avec l’agence.", tone: "violet", step: 3 },
  confirmed: { label: "Séjour confirmé", detail: "Votre réservation est confirmée par l’agence.", tone: "emerald", step: 4 },
  completed: { label: "Séjour finalisé", detail: "Cette demande a été finalisée.", tone: "slate", step: 4 },
  cancelled: { label: "Demande annulée", detail: "Cette demande a été annulée. Contactez l’agence si nécessaire.", tone: "rose", step: 0 },
};

export function getTourismTrackingMeta(status: z.infer<typeof statusSchema>) {
  return tourismTrackingMeta[status];
}

export const tourismRouter = router({
  discover: publicProcedure.input(z.object({ destination: z.string().trim().min(2).max(160), amenities: z.array(hotelAmenity).max(3).default([]) })).mutation(async ({ input }) => {
    let places: Array<{ name: string; address: string; rating?: number; priceLevel?: number }> = [];
    let catalogPlaces: Array<{ id: number; name: string; address: string | null; city: string; country: string; stars: number | null; amenities: HotelAmenity[]; officialWebsiteUrl: string | null; officialBookingUrl: string | null; sourceUrl: string | null; sourceAttribution: string }> = [];
    const db = await getDb();
    if (db) {
      const query = `%${input.destination.trim()}%`;
      const rows = await db.select().from(hotelCatalog).where(and(eq(hotelCatalog.verificationStatus, "verified"), or(like(hotelCatalog.city, query), like(hotelCatalog.country, query), like(hotelCatalog.name, query)))).limit(36);
      catalogPlaces = rows.map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        stars: hotel.stars,
        amenities: parseCatalogAmenities(hotel.amenitiesJson),
        officialWebsiteUrl: hotel.officialWebsiteUrl,
        officialBookingUrl: hotel.officialBookingUrl,
        sourceUrl: hotel.sourceUrl,
        sourceAttribution: hotel.sourceAttribution,
      })).filter((hotel) => input.amenities.every((amenity) => hotel.amenities.includes(amenity))).slice(0, 12);
    }
    try { const google = await makeRequest<PlacesSearchResult>("/maps/api/place/textsearch/json", { query: buildHotelDiscoveryQuery(input.destination, input.amenities) }); places = (google.results || []).slice(0, 5).map(buildTourismPlace); } catch { /* suggestions facultatives */ }
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
    return { catalogPlaces, places, selectedAmenities: input.amenities, briefing, sourceNote: "Les données de catalogue sont issues de sources indiquées. Les équipements, tarifs et disponibilités sont à confirmer par l’agence." };
  }),
  create: publicProcedure.input(requestSchema).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const linkedCandidate = await findCandidateFromAuthorizationHeader((ctx.req as any)?.headers?.authorization as string | undefined);
    const owner = linkedCandidate
      ? { candidateId: linkedCandidate.id, fullName: linkedCandidate.fullName, email: linkedCandidate.email }
      : { candidateId: null, fullName: input.fullName, email: input.email };
    const reference = `TRM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await db.insert(tourismServiceRequests).values({ reference, candidateId: owner.candidateId, fullName: owner.fullName, email: owner.email, phone: input.phone, destination: input.destination, departureDate: input.departureDate ? new Date(`${input.departureDate}T00:00:00Z`) : null, returnDate: input.returnDate ? new Date(`${input.returnDate}T00:00:00Z`) : null, travelersCount: input.travelersCount, serviceTypesJson: JSON.stringify(buildTourismServiceTypes(input.packType, input.serviceTypes)), packType: input.packType || null, hotelCategory: input.hotelCategory || null, vehicleCategory: input.vehicleCategory || null, pickupLocation: input.pickupLocation || null, budgetXaf: input.budgetXaf ?? null, notes: input.notes || null, enrichmentJson: input.enrichment ? JSON.stringify(input.enrichment) : null });
    await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Nouvelle demande Tourisme", message: `${owner.fullName} — ${input.destination} — ${reference}`, relatedId: reference, targetAdminType: "accompagnement" });
    return { reference };
  }),

  myRequests: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const requests = await db
      .select({
        id: tourismServiceRequests.id,
        reference: tourismServiceRequests.reference,
        destination: tourismServiceRequests.destination,
        departureDate: tourismServiceRequests.departureDate,
        returnDate: tourismServiceRequests.returnDate,
        travelersCount: tourismServiceRequests.travelersCount,
        serviceTypesJson: tourismServiceRequests.serviceTypesJson,
        packType: tourismServiceRequests.packType,
        hotelCategory: tourismServiceRequests.hotelCategory,
        vehicleCategory: tourismServiceRequests.vehicleCategory,
        budgetXaf: tourismServiceRequests.budgetXaf,
        quotedPriceXaf: tourismServiceRequests.quotedPriceXaf,
        enrichmentJson: tourismServiceRequests.enrichmentJson,
        status: tourismServiceRequests.status,
        createdAt: tourismServiceRequests.createdAt,
        updatedAt: tourismServiceRequests.updatedAt,
      })
      .from(tourismServiceRequests)
      .where(or(eq(tourismServiceRequests.candidateId, ctx.candidate.id), eq(tourismServiceRequests.email, ctx.candidate.email)))
      .orderBy(desc(tourismServiceRequests.updatedAt));
    return requests.map((request) => ({ ...request, tracking: getTourismTrackingMeta(request.status) }));
  }),

  adminList: publicProcedure.input(z.object({ sessionToken: z.string().min(1).optional() }).optional()).query(async ({ ctx, input }) => {
    await requireTourismAdminSession(ctx, input?.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select().from(tourismServiceRequests).orderBy(desc(tourismServiceRequests.createdAt));
  }),

  adminCatalog: publicProcedure.input(z.object({ city: z.string().trim().max(120).optional(), sessionToken: z.string().min(1).optional() }).optional()).query(async ({ input, ctx }) => {
    await requireTourismAdminSession(ctx, input?.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const city = input?.city?.trim();
    return city ? db.select().from(hotelCatalog).where(eq(hotelCatalog.city, city)).orderBy(desc(hotelCatalog.updatedAt)).limit(100) : db.select().from(hotelCatalog).orderBy(desc(hotelCatalog.updatedAt)).limit(100);
  }),

  /**
   * Précontrôle technique : identifie les fiches importées qui possèdent une
   * provenance OpenStreetMap et un lien officiel à ouvrir par un conseiller.
   * Cette procédure ne modifie jamais `verificationStatus`.
   */
  adminCatalogPrecheck: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(12), sessionToken: z.string().min(1).optional() }).optional()).query(async ({ input, ctx }) => {
    await requireTourismAdminSession(ctx, input?.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const entries = await db.select().from(hotelCatalog).where(and(
      eq(hotelCatalog.verificationStatus, "imported"),
      isNotNull(hotelCatalog.sourceUrl),
      or(isNotNull(hotelCatalog.officialWebsiteUrl), isNotNull(hotelCatalog.officialBookingUrl)),
    )).orderBy(desc(hotelCatalog.stars), desc(hotelCatalog.updatedAt)).limit(input?.limit ?? 12);

    return entries.map(entry => ({
      ...entry,
      precheck: {
        ...buildHotelTechnicalPrecheck(entry),
        starsPresent: entry.stars !== null,
      },
    }));
  }),

  importCatalogCity: publicProcedure.input(z.object({ cityKey: osmCityKey, sessionToken: z.string().min(1).optional() })).mutation(async ({ input, ctx }) => {
    const admin = await requireTourismAdminSession(ctx, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const scope = osmCityScopes[input.cityKey];
    const query = `[out:json][timeout:25];(nwr["tourism"="hotel"](${scope.bbox}););out center tags;`;
    let payload: { elements?: OSMHotelElement[] };
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "3M-Booking-Catalog/1.0 (hello@3mtravelagency.com)" }, body: new URLSearchParams({ data: query }).toString(), signal: AbortSignal.timeout(25_000) });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      payload = await response.json() as { elements?: OSMHotelElement[] };
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "La source ouverte est temporairement indisponible. Réessayez plus tard." });
    }
    const entries = (payload.elements ?? []).filter((element) => element.tags?.name).slice(0, 500).map((element) => mapOsmHotelElement(element, scope));
    for (const entry of entries) {
      await db.insert(hotelCatalog).values(entry).onDuplicateKeyUpdate({ set: {
        sourceUrl: entry.sourceUrl, sourceAttribution: entry.sourceAttribution, name: entry.name, country: entry.country, city: entry.city, address: entry.address, latitude: entry.latitude, longitude: entry.longitude, officialWebsiteUrl: entry.officialWebsiteUrl, officialBookingUrl: entry.officialBookingUrl, phone: entry.phone, stars: entry.stars, amenitiesJson: entry.amenitiesJson, rawSourceJson: entry.rawSourceJson, lastImportedAt: new Date(),
      } });
    }
    return { city: scope.city, imported: entries.length, importedBy: admin.email };
  }),

  verifyCatalogEntry: publicProcedure.input(z.object({ id: z.number().int().positive(), verificationStatus: z.enum(["imported", "verified", "inactive"]), officialWebsiteUrl: z.string().url().max(1000).nullable().optional(), officialBookingUrl: z.string().url().max(1000).nullable().optional(), sessionToken: z.string().min(1).optional() })).mutation(async ({ input, ctx }) => {
    const admin = await requireTourismAdminSession(ctx, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(hotelCatalog).set({ verificationStatus: input.verificationStatus, officialWebsiteUrl: input.officialWebsiteUrl, officialBookingUrl: input.officialBookingUrl, lastVerifiedAt: new Date(), verifiedByAdminEmail: admin.email }).where(eq(hotelCatalog.id, input.id));
    return { success: true };
  }),

  updateStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema, sessionToken: z.string().min(1).optional() })).mutation(async ({ input, ctx }) => {
    await requireTourismAdminSession(ctx, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(tourismServiceRequests).set({ status: input.status }).where(eq(tourismServiceRequests.id, input.id));
    return { success: true };
  }),

  updateDetails: publicProcedure.input(z.object({ id: z.number().int().positive(), quotedPriceXaf: z.number().int().positive().optional(), adminNotes: z.string().max(1500).optional(), sessionToken: z.string().min(1).optional() })).mutation(async ({ input, ctx }) => {
    await requireTourismAdminSession(ctx, input.sessionToken);
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
