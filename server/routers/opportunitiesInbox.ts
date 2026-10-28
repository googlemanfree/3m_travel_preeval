import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { jobApplications, jobOfferReports, jobOffers } from "../../drizzle/jobOffersSchema";
import { stayRequests } from "../../drizzle/stayProgramsSchema";
import { studyApplications } from "../../drizzle/studyCatalogSchema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireValidAdminSession } from "./adminAuth";

/** Compte ce qui attend une action ; une table pas encore migrée donne `null` au lieu de faire échouer tout le tableau de bord. */
async function countOrNull(work: () => Promise<Array<{ total: number | string }>>): Promise<number | null> {
  try {
    const [row] = await work();
    return Number(row?.total ?? 0);
  } catch {
    return null;
  }
}

export const opportunitiesInboxRouter = router({
  /** Ce qui attend l'administration dans les trois onglets Opportunités (écoles, emplois, séjours). */
  summary: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) return { study: null, jobs: null, stay: null, jobsDetail: { moderation: null, applications: null, reports: null } };
    const [studyNew, offersInModeration, jobsNew, reportsOpen, stayNew] = await Promise.all([
      countOrNull(() => db.select({ total: sql<number>`count(*)` }).from(studyApplications).where(eq(studyApplications.status, "submitted_to_agency"))),
      countOrNull(() => db.select({ total: sql<number>`count(*)` }).from(jobOffers).where(eq(jobOffers.status, "in_moderation"))),
      countOrNull(() => db.select({ total: sql<number>`count(*)` }).from(jobApplications).where(eq(jobApplications.status, "submitted"))),
      countOrNull(() => db.select({ total: sql<number>`count(*)` }).from(jobOfferReports).where(and(eq(jobOfferReports.status, "open")))),
      countOrNull(() => db.select({ total: sql<number>`count(*)` }).from(stayRequests).where(eq(stayRequests.status, "requested"))),
    ]);
    const jobParts = [offersInModeration, jobsNew, reportsOpen];
    return {
      study: studyNew,
      jobs: jobParts.every((value) => value === null) ? null : jobParts.reduce<number>((sum, value) => sum + (value ?? 0), 0),
      stay: stayNew,
      jobsDetail: { moderation: offersInModeration, applications: jobsNew, reports: reportsOpen },
    };
  }),
});
