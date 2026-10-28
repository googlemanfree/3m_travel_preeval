import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications } from "../../drizzle/schema";
import { jobApplications, jobOffers } from "../../drizzle/jobOffersSchema";
import { CONTRACT_TYPES, SALARY_PERIODS, VISA_SPONSORSHIPS, scanOfferText } from "../../shared/jobOffers";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getEmployerSession, requireEmployerManager } from "./placementPortal";

const WORLD_CODES = new Set(WORLD_COUNTRY_ROWS.map((row) => row[0]));

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Les offres d'emploi ne sont pas encore activées : l'agence doit finaliser la mise en service." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const token = z.string().min(32).max(512);
const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));
const optionalDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.").nullish().transform((value) => (value ? value : null));
const money = z.number().min(0).max(100_000_000).nullish().transform((value) => (value === null || value === undefined ? null : value.toFixed(2)));
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase()).refine((value) => WORLD_CODES.has(value), "Pays inconnu.");

/** Statuts qu'un employeur peut modifier : jamais une offre clôturée ou archivée. Une offre publiée modifiée repasse en modération. */
const EDITABLE = ["draft", "rejected", "in_moderation", "published"] as const;

const saveInput = z.object({
  sessionToken: token,
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(3).max(255),
  countryCode,
  city: text(120),
  visaSponsorship: z.enum(VISA_SPONSORSHIPS),
  contractType: z.enum(CONTRACT_TYPES),
  contractMonths: z.number().int().min(1).max(120).nullish().transform((value) => value ?? null),
  salaryMin: money,
  salaryMax: money,
  salaryCurrency: z.string().trim().toUpperCase().length(3).nullish().transform((value) => value ?? null),
  salaryPeriod: z.enum(SALARY_PERIODS).nullish().transform((value) => value ?? null),
  salaryVisible: z.boolean().default(false),
  benefits: text(2000),
  languages: z.array(z.object({ lang: z.string().trim().min(2).max(40), level: z.string().trim().min(1).max(20), required: z.boolean().optional() })).max(8).default([]),
  diplomas: z.array(z.object({ level: z.string().trim().min(2).max(80), field: z.string().trim().max(120).optional(), required: z.boolean().optional() })).max(5).default([]),
  experienceMinYears: z.number().int().min(0).max(40).nullish().transform((value) => value ?? null),
  startDate: optionalDay,
  startFlexible: z.boolean().default(true),
  positionsCount: z.number().int().min(1).max(500).default(1),
  applicationDeadline: optionalDay,
  hideEmployerName: z.boolean().default(false),
  description: z.string().trim().min(80, "Décrivez le poste en 80 caractères au moins.").max(8000),
  requirements: text(4000),
  /** `true` envoie l'offre à la modération de l'agence ; `false` la garde en brouillon. */
  submit: z.boolean(),
});

/**
 * Offres déposées par les employeurs vérifiés (portail employeur). L'employeur ne publie jamais lui-même : toute offre passe par la
 * modération de l'agence. Il ne voit que le nombre de candidatures, jamais l'identité des candidats (présentés par l'agence, avec leur accord).
 */
export const employerOffersRouter = router({
  myOffers: publicProcedure.input(z.object({ sessionToken: token })).query(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const rows = await db.select().from(jobOffers).where(eq(jobOffers.organizationId, organization.id)).orderBy(desc(jobOffers.updatedAt)).limit(100);
    const counts = rows.length ? await db.select({ offerId: jobApplications.offerId, total: sql<number>`count(*)` }).from(jobApplications).where(inArray(jobApplications.offerId, rows.map((row) => row.id))).groupBy(jobApplications.offerId) : [];
    return rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      title: row.title,
      countryCode: row.countryCode,
      city: row.city,
      contractType: row.contractType,
      visaSponsorship: row.visaSponsorship,
      contractMonths: row.contractMonths,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      salaryCurrency: row.salaryCurrency,
      salaryPeriod: row.salaryPeriod,
      salaryVisible: row.salaryVisible,
      benefits: row.benefits,
      languages: row.languagesJson ?? [],
      diplomas: row.diplomasJson ?? [],
      experienceMinYears: row.experienceMinYears,
      startDate: row.startDate,
      startFlexible: row.startFlexible,
      positionsCount: row.positionsCount,
      applicationDeadline: row.applicationDeadline,
      hideEmployerName: row.hideEmployerName,
      description: row.description,
      requirements: row.requirements,
      status: row.status,
      moderationNote: row.moderationNote,
      applicationsCount: Number(counts.find((item) => item.offerId === row.id)?.total ?? 0),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    }));
  })),

  saveOffer: publicProcedure.input(saveInput).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    if (organization.organizationType !== "employer") throw new TRPCError({ code: "FORBIDDEN", message: "Seules les organisations de type employeur peuvent déposer des offres." });
    if (input.salaryMin && input.salaryMax && Number(input.salaryMin) > Number(input.salaryMax)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le salaire minimal dépasse le salaire maximal." });
    if ((input.salaryMin || input.salaryMax) && (!input.salaryCurrency || !input.salaryPeriod)) throw new TRPCError({ code: "BAD_REQUEST", message: "Un salaire exige une devise et une période." });
    if (input.submit) {
      const flags = scanOfferText(`${input.title}\n${input.description}\n${input.requirements ?? ""}\n${input.benefits ?? ""}`);
      if (flags.contact.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: `Retirez les coordonnées du texte (${flags.contact.slice(0, 2).join(", ")}) : la mise en relation passe par l'agence.` });
      if (flags.money.length > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Le texte semble demander de l'argent au candidat : retirez-le, aucun frais n'est admis." });
    }

    const { sessionToken: _token, id, languages, diplomas, submit, ...rest } = input;
    const fields = {
      title: rest.title, countryCode: rest.countryCode, city: rest.city, visaSponsorship: rest.visaSponsorship, contractType: rest.contractType, contractMonths: rest.contractMonths,
      salaryMin: rest.salaryMin, salaryMax: rest.salaryMax, salaryCurrency: rest.salaryCurrency, salaryPeriod: rest.salaryPeriod, salaryVisible: rest.salaryVisible,
      benefits: rest.benefits, languagesJson: languages, diplomasJson: diplomas, experienceMinYears: rest.experienceMinYears, startDate: rest.startDate, startFlexible: rest.startFlexible,
      positionsCount: rest.positionsCount, applicationDeadline: rest.applicationDeadline, hideEmployerName: rest.hideEmployerName, description: rest.description, requirements: rest.requirements,
      employerName: organization.legalName, organizationId: organization.id,
    };
    const nextStatus = submit ? ("in_moderation" as const) : ("draft" as const);
    let savedId = id ?? 0;
    let reference = "";
    if (id) {
      const [current] = await db.select().from(jobOffers).where(and(eq(jobOffers.id, id), eq(jobOffers.organizationId, organization.id))).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
      if (!(EDITABLE as readonly string[]).includes(current.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Une offre clôturée ou archivée ne se modifie plus : créez-en une nouvelle." });
      reference = current.reference;
      // Une offre publiée qui est modifiée doit être relue par l'agence avant de rester visible.
      const status = current.status === "published" ? ("in_moderation" as const) : nextStatus;
      await db.update(jobOffers).set({ ...fields, status, version: current.version + 1, moderationNote: status === "in_moderation" ? null : current.moderationNote }).where(eq(jobOffers.id, id));
    } else {
      const created = await db.insert(jobOffers).values({ ...fields, reference: `TMP-${randomBytes(6).toString("hex")}`, status: nextStatus });
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
      reference = `OFF-${new Date().getUTCFullYear()}-${String(savedId).padStart(4, "0")}`;
      await db.update(jobOffers).set({ reference }).where(eq(jobOffers.id, savedId));
    }
    if (submit) {
      try {
        await db.insert(adminNotifications).values({
          type: "new_contact_message",
          title: "Offre d'emploi à modérer",
          message: `${organization.legalName} — ${rest.title} (${reference})`.slice(0, 1000),
          relatedId: `job_offer:${savedId}`,
          targetAdminType: "accompagnement",
        });
      } catch {
        // La notification ne doit jamais faire échouer le dépôt de l'offre.
      }
    }
    return { id: savedId, reference, submitted: submit };
  })),

  closeOffer: publicProcedure.input(z.object({ sessionToken: token, id: z.number().int().positive(), reason: z.enum(["filled", "cancelled"]) })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    const [offer] = await db.select({ id: jobOffers.id, status: jobOffers.status }).from(jobOffers).where(and(eq(jobOffers.id, input.id), eq(jobOffers.organizationId, organization.id))).limit(1);
    if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
    if (offer.status === "closed" || offer.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette offre est déjà clôturée." });
    await db.update(jobOffers).set({ status: "closed", closeReason: input.reason, closedAt: new Date() }).where(eq(jobOffers.id, offer.id));
    return { ok: true as const };
  })),
});
