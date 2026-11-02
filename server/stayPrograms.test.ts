import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_ACTIVE_STAY_REQUESTS,
  STAY_REQUEST_CLIENT_NEXT,
  STAY_REQUEST_LABELS,
  STAY_REQUEST_STATUSES,
  isStayStatusChangeAllowed,
  stayPriceFresh,
  stayPriceLabel,
  stayPublishBlockers,
} from "../shared/stayPrograms";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const now = new Date("2026-10-28T10:00:00Z");
const fresh = new Date("2026-10-20T10:00:00Z");
const stale = new Date("2026-01-01T10:00:00Z");
const noPrice = { priceFrom: null, priceCurrency: null, priceBasis: null, priceSourceNote: null, priceCheckedAt: null };
const base = {
  title: "Découverte de Lisbonne", summary: "Quatre jours accompagnés pour découvrir la ville.", visaNote: "Visa Schengen de court séjour selon la nationalité.",
  description: "Quatre jours à Lisbonne avec hébergement choisi par l'agence, visites guidées des quartiers historiques et temps libre pour les repas et les déplacements.",
  checkedAt: fresh, price: noPrice, now,
};

describe("séjours visiteurs : prix et publication", () => {
  it("n'affiche un prix que complet, avec provenance et relu il y a moins de 180 jours", () => {
    const price = { priceFrom: "450.00", priceCurrency: "EUR", priceBasis: "par personne", priceSourceNote: "Devis du prestataire du 20/10", priceCheckedAt: fresh };
    expect(stayPriceLabel(price, now)).toBe("À partir de 450 EUR par personne · indicatif, confirmé par devis");
    expect(stayPriceLabel({ ...price, priceCheckedAt: stale }, now)).toBeNull();
    expect(stayPriceLabel({ ...price, priceSourceNote: "" }, now)).toBeNull();
    expect(stayPriceLabel({ ...price, priceCurrency: null }, now)).toBeNull();
    expect(stayPriceLabel({ ...price, priceBasis: " " }, now)).toBeNull();
    expect(stayPriceLabel({ ...price, priceFrom: "0" }, now)).toBeNull();
    expect(stayPriceFresh(null, now)).toBe(false);
  });

  it("publie un séjour sans prix mais exige description, mention visa et relecture", () => {
    expect(stayPublishBlockers(base)).toEqual([]);
    expect(stayPublishBlockers({ ...base, description: "Trop court" }).join(" ")).toMatch(/80 caractères/);
    expect(stayPublishBlockers({ ...base, visaNote: "" }).join(" ")).toMatch(/visa/i);
    expect(stayPublishBlockers({ ...base, checkedAt: null }).join(" ")).toMatch(/relisez le séjour/i);
    expect(stayPublishBlockers({ ...base, durationDaysMin: 10, durationDaysMax: 4 }).join(" ")).toMatch(/durée minimale/);
  });

  it("refuse les coordonnées, les liens et les demandes d'argent dans le texte public", () => {
    expect(stayPublishBlockers({ ...base, description: `${base.description} Écrivez à voyages@exemple.org` }).join(" ")).toMatch(/coordonnées/);
    expect(stayPublishBlockers({ ...base, visaNote: "Voir www.exemple.org/visa" }).join(" ")).toMatch(/coordonnées|liens/);
    expect(stayPublishBlockers({ ...base, description: `${base.description} Versez des frais de dossier avant le devis.` }).join(" ")).toMatch(/argent/);
  });

  it("un prix saisi doit avoir devise, base, provenance et relecture récente pour publier", () => {
    const full = { priceFrom: "450", priceCurrency: "EUR", priceBasis: "par personne", priceSourceNote: "Devis prestataire", priceCheckedAt: fresh };
    expect(stayPublishBlockers({ ...base, price: full })).toEqual([]);
    expect(stayPublishBlockers({ ...base, price: { ...full, priceSourceNote: null } }).join(" ")).toMatch(/provenance/);
    expect(stayPublishBlockers({ ...base, price: { ...full, priceCheckedAt: stale } }).join(" ")).toMatch(/prix aujourd'hui/);
    expect(stayPublishBlockers({ ...base, price: { ...full, priceCurrency: "euro" } }).join(" ")).toMatch(/devise/);
    expect(stayPublishBlockers({ ...base, price: { ...full, priceFrom: "-5" } }).join(" ")).toMatch(/supérieur à zéro/);
  });

  it("une demande terminée ne se rouvre pas, et chaque étape a un libellé et une consigne", () => {
    expect(MAX_ACTIVE_STAY_REQUESTS).toBe(3);
    expect(isStayStatusChangeAllowed("requested", "quote_prepared")).toBe(true);
    expect(isStayStatusChangeAllowed("quote_prepared", "quote_prepared")).toBe(false);
    for (const from of ["declined", "cancelled"] as const) expect(isStayStatusChangeAllowed(from, "requested"), from).toBe(false);
    for (const status of STAY_REQUEST_STATUSES) {
      expect(STAY_REQUEST_LABELS[status], status).toBeTruthy();
      expect(STAY_REQUEST_CLIENT_NEXT[status], status).toBeTruthy();
    }
  });
});

describe("séjours visiteurs : serveur, confidentialité et migration", () => {
  const router = read("server/routers/stayPrograms.ts");

  it("la liste publique ne montre que le publié, sans prestataire ni provenance du prix", () => {
    const block = router.slice(router.indexOf("programs: publicProcedure"), router.indexOf("myRequests: candidateProcedure"));
    expect(block).toContain('eq(stayPrograms.status, "published")');
    expect(block).toContain("stayPriceLabel(row)");
    for (const hidden of ["providerNote", "priceSourceNote", "priceFrom:", "checkedAt"]) expect(block, hidden).not.toContain(hidden);
  });

  it("la demande exige l'accord, une fois par séjour, trois au plus, et garde le consentement", () => {
    const block = router.slice(router.indexOf("requestStay: candidateProcedure"), router.indexOf("cancelRequest: candidateProcedure"));
    expect(block).toContain("consent: z.boolean().refine((value) => value === true");
    expect(block).toContain('eq(stayPrograms.status, "published")');
    expect(block).toContain("Vous avez déjà demandé ce séjour");
    expect(block).toContain("MAX_ACTIVE_STAY_REQUESTS");
    expect(block).toContain("STAY_CONSENT_VERSION");
    expect(block).toContain("ctx.candidate.id");
  });

  it("toute gestion exige une session d'administration ; publier passe par les contrôles ; un séjour demandé est retiré, pas supprimé", () => {
    const admin = router.match(/\n  admin[A-Za-z]+:/g) ?? [];
    expect(admin.length).toBe(5);
    expect((router.match(/requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(admin.length);
    expect(router).toContain("stayPublishBlockers(");
    const del = router.slice(router.indexOf("adminDeleteProgram:"), router.indexOf("adminRequests:"));
    expect(del).toContain('set({ status: "retired" })');
    expect(router).toContain("Une demande annulée ou non réalisable ne se rouvre pas");
  });

  it("aucun nom de procédure n'est un mot réservé de tRPC", () => {
    const reserved = new Set(["apply", "call", "bind", "toString", "constructor", "prototype", "length", "name", "caller", "arguments", "valueOf", "hasOwnProperty"]);
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): (?:publicProcedure|candidateProcedure)/g), (match) => match[1]);
    expect(names.length).toBe(9);
    expect(names.filter((name) => reserved.has(name))).toEqual([]);
  });

  it("le routeur est branché, l'espace client et l'administration l'affichent, et la migration 0090 ne crée que de nouvelles tables", () => {
    expect(read("server/routers.ts")).toContain("stayPrograms: stayProgramsRouter");
    expect(read("drizzle/schema.ts")).toContain('export * from "./stayProgramsSchema";');
    expect(read("client/src/components/ClientOpportunities.tsx")).toContain('kind === "tourisme" && countryCode ? <StayOpportunities');
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminStayPrograms sessionToken={sessionToken} />");
    const sql = read("drizzle/0090_stay_programs.sql");
    const tables = (sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) ?? []).map((line) => line.replace("CREATE TABLE IF NOT EXISTS ", ""));
    expect(tables).toEqual(["stay_programs", "stay_requests", "stay_request_events"]);
    expect(sql).not.toMatch(/ALTER TABLE|DROP (TABLE|COLUMN|INDEX)|DELETE FROM|^UPDATE /im);
    expect(sql).toContain("UNIQUE KEY uq_stay_requests_candidate_program (candidate_id, program_id)");
  });
});
