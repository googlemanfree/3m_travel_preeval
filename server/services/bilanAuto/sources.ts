import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { bilanAutoSources } from "../../../drizzle/bilanAutoSchema";
import { getDb } from "../../db";
import { DESTINATIONS, type SearchResult, type SourceSearch } from "./orientations";

/**
 * Référentiel de sources saisi par l'agence (offres et repères salariaux). Branché comme « recherche » du bilan : seules les entrées
 * actives, sourcées (adresse https), datées et récentes (politique de fraîcheur) deviennent « offre repérée » ou « repère salarial ».
 * Aucune conversion brut/net implicite : la mention brut/net saisie est reprise telle quelle, ou « brut/net non précisé ».
 */
export type SourceEntry = {
  id: number; country: string; kind: "offre" | "salaire"; occupation: string; employer: string | null; city: string | null;
  amountMin: number | null; amountMax: number | null; currency: string | null; period: string | null; grossOrNet: "brut" | "net" | null; geography: string | null;
  url: string; title: string; observedAt: string; remoteRecruiting: "confirmee" | "non_confirmee"; active: boolean; createdBy: string; createdAt: Date;
};
export type NewSource = Omit<SourceEntry, "id" | "createdAt" | "active">;

export interface SourcesStore {
  list(filter?: { country?: string; activeOnly?: boolean }): Promise<SourceEntry[]>;
  create(entry: NewSource): Promise<SourceEntry>;
  setActive(id: number, active: boolean): Promise<void>;
  remove(id: number): Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null).nullable().optional().transform((value) => value ?? null);

export const SourceInputSchema = z.object({
  country: z.string().trim().refine((value) => Object.keys(DESTINATIONS).includes(value), "Pays hors liste des destinations examinées"),
  kind: z.enum(["offre", "salaire"]),
  occupation: z.string().trim().min(2).max(160),
  employer: optionalText(160),
  city: optionalText(120),
  amountMin: z.number().int().min(0).max(10_000_000).nullable().optional().transform((value) => value ?? null),
  amountMax: z.number().int().min(0).max(10_000_000).nullable().optional().transform((value) => value ?? null),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Devise à 3 lettres (EUR, CAD…)").nullable().optional().transform((value) => value ?? null),
  period: z.enum(["heure", "jour", "mois", "an"]).nullable().optional().transform((value) => value ?? null),
  grossOrNet: z.enum(["brut", "net"]).nullable().optional().transform((value) => value ?? null),
  geography: optionalText(120),
  url: z.string().trim().max(700).regex(/^https:\/\/[^\s]+$/i, "Adresse https obligatoire"),
  title: z.string().trim().min(3).max(200),
  observedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date AAAA-MM-JJ").refine((value) => !Number.isNaN(Date.parse(value)) && value <= today(), "Date de consultation invalide ou future"),
  remoteRecruiting: z.enum(["confirmee", "non_confirmee"]).default("non_confirmee"),
}).superRefine((value, ctx) => {
  if (value.kind === "offre" && !value.employer) ctx.addIssue({ code: "custom", path: ["employer"], message: "L'employeur est obligatoire pour une offre" });
  if (value.kind === "salaire") {
    if (value.amountMin === null && value.amountMax === null) ctx.addIssue({ code: "custom", path: ["amountMin"], message: "Un montant minimum ou maximum est obligatoire" });
    if (!value.currency) ctx.addIssue({ code: "custom", path: ["currency"], message: "La devise est obligatoire" });
    if (!value.period) ctx.addIssue({ code: "custom", path: ["period"], message: "La période est obligatoire" });
    if (value.amountMin !== null && value.amountMax !== null && value.amountMin > value.amountMax) ctx.addIssue({ code: "custom", path: ["amountMax"], message: "Le maximum doit dépasser le minimum" });
  }
});

const fold = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (value: string) => fold(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 4);

export function occupationMatches(entryOccupation: string, jobTitle: string | null): boolean {
  if (!jobTitle) return false;
  const wanted = new Set(tokens(jobTitle));
  return tokens(entryOccupation).some((token) => wanted.has(token) || Array.from(wanted).some((other) => other.startsWith(token.slice(0, 5)) && token.startsWith(other.slice(0, 5))));
}

export function formatAmount(entry: Pick<SourceEntry, "amountMin" | "amountMax" | "currency" | "grossOrNet">): string {
  const number = (value: number) => value.toLocaleString("fr-FR");
  const range = entry.amountMin !== null && entry.amountMax !== null ? `${number(entry.amountMin)} à ${number(entry.amountMax)}` : entry.amountMin !== null ? `à partir de ${number(entry.amountMin)}` : `jusqu'à ${number(entry.amountMax ?? 0)}`;
  return `${range} ${entry.currency ?? ""} (${entry.grossOrNet ?? "brut/net non précisé"})`.replace(/\s+/g, " ").trim();
}

export function makeReferentialSearch(store: SourcesStore): SourceSearch {
  return async ({ country, jobTitle }): Promise<SearchResult> => {
    const entries = (await store.list({ country, activeOnly: true })).filter((entry) => occupationMatches(entry.occupation, jobTitle));
    const source = (entry: SourceEntry) => ({ url: entry.url, title: entry.title, consultedAt: entry.observedAt });
    return {
      offers: entries.filter((entry) => entry.kind === "offre" && entry.employer).map((entry) => ({ title: entry.occupation, employer: entry.employer as string, city: entry.city ?? undefined, remote: entry.remoteRecruiting, source: source(entry) })),
      salaries: entries.filter((entry) => entry.kind === "salaire" && entry.period).map((entry) => ({ label: `${entry.occupation}${entry.geography ? ` — ${entry.geography}` : ""}`, amount: formatAmount(entry), period: `par ${entry.period}`, source: source(entry) })),
    };
  };
}

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export class DrizzleSourcesStore implements SourcesStore {
  constructor(private readonly db: Db) {}
  private map(row: typeof bilanAutoSources.$inferSelect): SourceEntry { return { ...row, kind: row.kind as SourceEntry["kind"], grossOrNet: row.grossOrNet as SourceEntry["grossOrNet"], remoteRecruiting: row.remoteRecruiting as SourceEntry["remoteRecruiting"] }; }
  async list(filter: { country?: string; activeOnly?: boolean } = {}) {
    const conditions = [filter.country ? eq(bilanAutoSources.country, filter.country) : undefined, filter.activeOnly ? eq(bilanAutoSources.active, true) : undefined].filter((c): c is NonNullable<typeof c> => Boolean(c));
    const rows = await this.db.select().from(bilanAutoSources).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(bilanAutoSources.id)).limit(500);
    return rows.map((row) => this.map(row));
  }
  async create(entry: NewSource) {
    const inserted = await this.db.insert(bilanAutoSources).values(entry).$returningId();
    const [row] = await this.db.select().from(bilanAutoSources).where(eq(bilanAutoSources.id, inserted[0].id)).limit(1);
    return this.map(row);
  }
  async setActive(id: number, active: boolean) { await this.db.update(bilanAutoSources).set({ active }).where(eq(bilanAutoSources.id, id)); }
  async remove(id: number) { await this.db.delete(bilanAutoSources).where(eq(bilanAutoSources.id, id)); }
}

export class MemorySourcesStore implements SourcesStore {
  private entries: SourceEntry[] = [];
  private seq = 0;
  async list(filter: { country?: string; activeOnly?: boolean } = {}) { return this.entries.filter((e) => (!filter.country || e.country === filter.country) && (!filter.activeOnly || e.active)); }
  async create(entry: NewSource) { const created: SourceEntry = { ...entry, id: ++this.seq, active: true, createdAt: new Date() }; this.entries.push(created); return created; }
  async setActive(id: number, active: boolean) { const e = this.entries.find((x) => x.id === id); if (e) e.active = active; }
  async remove(id: number) { this.entries = this.entries.filter((e) => e.id !== id); }
}
