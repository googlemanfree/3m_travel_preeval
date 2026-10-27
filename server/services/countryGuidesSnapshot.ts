/**
 * Instantané en mémoire des guides par pays PUBLIÉS : le prérendu (synchrone, lu par les robots) et la page publique
 * lisent la même source. Seules les fiches publiées apparaissent, donc appuyées par une source officielle relue
 * (voir `publishBlockers` dans shared/countryCatalog.ts).
 */
import { and, asc, eq } from "drizzle-orm";
import { countryPathways, countrySources, countryVisaPrograms, procedureSteps } from "../../drizzle/schema";
import { guideCountryName, guideSlugForCode } from "../../shared/countryGuides";
import type { Pathway } from "../../shared/countryCatalog";
import { logger } from "../_core/logger";

export type GuideStep = { stepNo: number; actor: string; title: string; description: string | null; documents: string[]; delayNote: string | null; feeNote: string | null; officialUrl: string | null };
export type GuideProgram = {
  officialName: string;
  nameFr: string | null;
  routeType: string | null;
  offerRequired: string | null;
  salaryNote: string | null;
  durationNote: string | null;
  feesNote: string | null;
  processingNote: string | null;
  residencePathNote: string | null;
  steps: GuideStep[];
};
export type GuideSource = { label: string; url: string; authority: string; checkedAt: string | null };
export type GuidePathway = { pathway: Pathway; summary: string | null; checkedAt: string | null; programs: GuideProgram[]; sources: GuideSource[] };
export type CountryGuide = { code: string; name: string; slug: string; pathways: GuidePathway[]; updatedAt: string | null };

type Rows = {
  pathways: Array<typeof countryPathways.$inferSelect>;
  programs: Array<typeof countryVisaPrograms.$inferSelect>;
  sources: Array<typeof countrySources.$inferSelect>;
  steps: Array<typeof procedureSteps.$inferSelect>;
};

const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const PATHWAY_ORDER: Pathway[] = ["work", "study", "visit"];

/** Pur et testable : ne retient que le publié (fiche, dispositifs, étapes) et les sources vérifiées. */
export function buildCountryGuides(rows: Rows): Map<string, CountryGuide> {
  const guides = new Map<string, CountryGuide>();
  const published = rows.pathways.filter((row) => row.status === "published");
  for (const code of Array.from(new Set(published.map((row) => row.countryCode)))) {
    const slug = guideSlugForCode(code);
    const name = guideCountryName(code);
    if (!slug || !name) continue;
    const pathways: GuidePathway[] = [];
    for (const pathway of PATHWAY_ORDER) {
      const row = published.find((item) => item.countryCode === code && item.pathway === pathway);
      if (!row) continue;
      const programs = rows.programs.filter((program) => program.countryCode === code && program.pathway === pathway && program.status === "published");
      pathways.push({
        pathway,
        summary: row.summary,
        checkedAt: iso(row.checkedAt),
        programs: programs.map((program) => ({
          officialName: program.officialName,
          nameFr: program.nameFr,
          routeType: program.routeType,
          offerRequired: program.offerRequired,
          salaryNote: program.salaryNote,
          durationNote: program.durationNote,
          feesNote: program.feesNote,
          processingNote: program.processingNote,
          residencePathNote: program.residencePathNote,
          steps: rows.steps
            .filter((step) => step.programId === program.id && step.status === "published")
            .sort((a, b) => a.stepNo - b.stepNo)
            .map((step) => ({ stepNo: step.stepNo, actor: step.actor, title: step.title, description: step.description, documents: step.documentsJson ?? [], delayNote: step.delayNote, feeNote: step.feeNote, officialUrl: step.officialUrl })),
        })),
        sources: rows.sources
          .filter((source) => source.countryCode === code && source.pathway === pathway && source.status === "verified")
          .map((source) => ({ label: source.label, url: source.url, authority: source.authority, checkedAt: iso(source.checkedAt) })),
      });
    }
    if (pathways.length === 0) continue;
    const dates = pathways.map((item) => item.checkedAt).filter((value): value is string => Boolean(value)).sort();
    guides.set(slug, { code, name, slug, pathways, updatedAt: dates.length ? dates[dates.length - 1] : null });
  }
  return guides;
}

let snapshot: Map<string, CountryGuide> = new Map();
let timer: ReturnType<typeof setInterval> | null = null;

export function getCountryGuides(): ReadonlyMap<string, CountryGuide> {
  return snapshot;
}

export function getCountryGuide(slug: string): CountryGuide | undefined {
  return snapshot.get(slug);
}

/** Pour les tests : remplace l'instantané. */
export function setCountryGuidesForTest(guides: Map<string, CountryGuide>) {
  snapshot = guides;
}

/** Recharge depuis la base. Une base ou des tables absentes laissent l'instantané vide (aucune fiche publiée). */
export async function refreshCountryGuides(): Promise<number> {
  try {
    // Chargement tardif : le prérendu importe ce module sans avoir besoin de la connexion à la base.
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return snapshot.size;
    const pathways = await db.select().from(countryPathways).where(eq(countryPathways.status, "published"));
    if (pathways.length === 0) {
      snapshot = new Map();
      return 0;
    }
    const [programs, sources, steps] = await Promise.all([
      db.select().from(countryVisaPrograms).where(eq(countryVisaPrograms.status, "published")),
      db.select().from(countrySources).where(eq(countrySources.status, "verified")),
      db.select().from(procedureSteps).where(and(eq(procedureSteps.status, "published"))).orderBy(asc(procedureSteps.stepNo)),
    ]);
    snapshot = buildCountryGuides({ pathways, programs, sources, steps });
    return snapshot.size;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (!/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) logger.warn("country_guides.refresh_failed", { error: detail });
    return snapshot.size;
  }
}

/** Charge au démarrage puis toutes les 10 minutes : les changements de l'administration rafraîchissent aussi tout de suite. */
export function startCountryGuidesRefresh(intervalMs = 10 * 60 * 1000) {
  void refreshCountryGuides();
  if (timer) return;
  timer = setInterval(() => { void refreshCountryGuides(); }, intervalMs);
  timer.unref?.();
}
