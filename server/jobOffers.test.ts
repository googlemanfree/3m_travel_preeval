import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  JOB_APPLICATION_STATUSES,
  JOB_STATUS_CLIENT_NEXT,
  JOB_STATUS_LABELS,
  MAX_ACTIVE_JOB_APPLICATIONS,
  educationRank,
  isJobStatusChangeAllowed,
  isOfferOpen,
  jobOfferPublishBlockers,
  parseCefr,
  parseYears,
  precheckOffer,
  reportSuspendsOffer,
  scanOfferText,
} from "../shared/jobOffers";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const checks = { noFees: true, noDiscrimination: true, noContact: true, visaCoherent: true };
const description = "Soudeur industriel pour un atelier de fabrication métallique. Travail en équipe, lecture de plans, respect des consignes de sécurité. Formation interne à l'arrivée.";

describe("offres d'emploi : modération du texte", () => {
  it("détecte les coordonnées et les demandes d'argent", () => {
    expect(scanOfferText("Écrivez à recrutement@exemple.org").contact).toContain("recrutement@exemple.org");
    expect(scanOfferText("Contact WhatsApp au +33 6 12 34 56 78").contact.length).toBeGreaterThanOrEqual(1);
    expect(scanOfferText("Voir www.exemple.org/offre").contact.join(" ")).toContain("www.exemple.org/offre");
    expect(scanOfferText("Versez des frais de dossier avant le visa").money.length).toBe(1);
    expect(scanOfferText("Paiement par Western Union pour le dossier du candidat").money.length).toBe(1);
    const clean = scanOfferText(description);
    expect(clean.contact).toEqual([]);
    expect(clean.money).toEqual([]);
  });

  it("refuse de publier sans description détaillée, sans contrôles ou avec un employeur non vérifié", () => {
    const base = { title: "Soudeur", description, requirements: null, contractType: "cdi", organizationVerified: null, checks };
    expect(jobOfferPublishBlockers(base)).toEqual([]);
    expect(jobOfferPublishBlockers({ ...base, description: "Trop court" }).join(" ")).toMatch(/80 caractères/);
    expect(jobOfferPublishBlockers({ ...base, organizationVerified: false }).join(" ")).toMatch(/pas vérifié/);
    expect(jobOfferPublishBlockers({ ...base, checks: { ...checks, noFees: false } }).join(" ")).toMatch(/aucun frais/i);
    expect(jobOfferPublishBlockers({ ...base, checks: { noFees: false, noDiscrimination: false, noContact: false, visaCoherent: false } }).length).toBe(4);
    expect(jobOfferPublishBlockers({ ...base, description: `${description} Écrivez à rh@exemple.org` }).join(" ")).toMatch(/coordonnées/);
    expect(jobOfferPublishBlockers({ ...base, description: `${description} Payer les frais de dossier du candidat avant départ.` }).join(" ")).toMatch(/argent/);
    expect(jobOfferPublishBlockers({ ...base, contractType: "inconnu" }).join(" ")).toMatch(/contrat/);
  });

  it("une offre n'est ouverte que publiée et avant sa date limite", () => {
    const now = new Date("2026-10-28T10:00:00Z");
    expect(isOfferOpen({ status: "published", applicationDeadline: null }, now)).toBe(true);
    expect(isOfferOpen({ status: "published", applicationDeadline: "2026-10-28" }, now)).toBe(true);
    expect(isOfferOpen({ status: "published", applicationDeadline: "2026-10-27" }, now)).toBe(false);
    for (const status of ["draft", "in_moderation", "closed", "rejected", "archived"]) expect(isOfferOpen({ status }, now), status).toBe(false);
  });

  it("un signalement d'argent, de fausse offre ou de contenu illégal retire l'offre de la liste", () => {
    for (const reason of ["fees_requested", "fake_offer", "illegal_content"] as const) expect(reportSuspendsOffer(reason), reason).toBe(true);
    for (const reason of ["discrimination", "wrong_info", "other"] as const) expect(reportSuspendsOffer(reason), reason).toBe(false);
  });
});

describe("offres d'emploi : pré-contrôle qui informe sans écarter", () => {
  it("lit les valeurs libres déclarées par le candidat", () => {
    expect(parseYears("3-5 ans")).toBe(3);
    expect(parseYears("plus de 10 ans")).toBe(10);
    expect(parseYears("aucune")).toBeNull();
    expect(parseCefr("B2")).toBe(4);
    expect(parseCefr("niveau c1 (avancé)")).toBe(5);
    expect(parseCefr("intermédiaire")).toBe(3);
    expect(parseCefr("langue maternelle")).toBe(5);
    expect(parseCefr("")).toBeNull();
    expect(educationRank("Master en gestion")).toBeGreaterThan(educationRank("Licence") as number);
    expect(educationRank("BTS électrotechnique")).toBe(5);
    expect(educationRank("autre chose")).toBeNull();
  });

  it("compare expérience, langues et diplôme : atteint, partiel ou à préciser, jamais refusé", () => {
    const requirements = { experienceMinYears: 3, languages: [{ lang: "Anglais", level: "B2", required: true }, { lang: "Français", level: "B1", required: false }], diplomas: [{ level: "BTS" }] };
    const result = precheckOffer(requirements, { yearsOfExperience: "2 ans", educationLevel: "Licence", frenchLevel: "C1", englishLevel: "B1" });
    const state = (key: string) => result.find((item) => item.key === key)?.state;
    expect(state("experience")).toBe("partial");
    expect(state("lang-anglais")).toBe("partial");
    expect(state("lang-français")).toBe("met");
    expect(state("diploma")).toBe("met");
    const unknown = precheckOffer(requirements, {});
    expect(unknown.every((item) => item.state === "unknown")).toBe(true);
    expect(result.every((item) => ["met", "partial", "unknown"].includes(item.state))).toBe(true);
    expect(precheckOffer({ experienceMinYears: null, languages: [], diplomas: [] }, {})).toEqual([]);
  });

  it("ne rouvre jamais une candidature terminée et limite à cinq candidatures actives", () => {
    expect(MAX_ACTIVE_JOB_APPLICATIONS).toBe(5);
    expect(isJobStatusChangeAllowed("submitted", "screening")).toBe(true);
    expect(isJobStatusChangeAllowed("screening", "screening")).toBe(false);
    for (const from of ["rejected", "withdrawn", "hired"] as const) expect(isJobStatusChangeAllowed(from, "screening"), from).toBe(false);
    for (const status of JOB_APPLICATION_STATUSES) {
      expect(JOB_STATUS_LABELS[status], status).toBeTruthy();
      expect(JOB_STATUS_CLIENT_NEXT[status], status).toBeTruthy();
    }
  });
});

describe("offres d'emploi : serveur, confidentialité et migration", () => {
  const router = read("server/routers/jobOffers.ts");

  it("le candidat ne voit que les offres publiées et ouvertes, sans donnée interne, et son profil présenté reste minimal", () => {
    const listBlock = router.slice(router.indexOf("list: candidateProcedure"), router.indexOf("myApplications: candidateProcedure"));
    expect(listBlock).toContain('eq(jobOffers.status, "published")');
    expect(listBlock).toContain("isOfferOpen(offer, now)");
    const view = router.slice(router.indexOf("const offerView"), router.indexOf("const offerInput"));
    for (const hidden of ["moderationNote", "createdByAdminId", "organizationId", "moderatedByAdminId"]) expect(view, hidden).not.toContain(hidden);
    expect(view).toContain("offer.hideEmployerName");
    const profile = router.slice(router.indexOf("async function loadMinimalProfile"), router.indexOf("const offerView"));
    for (const personal of ["fullName", "email:", "phone", "avatar", "passport"]) expect(profile, personal).not.toContain(personal);
  });

  it("la candidature exige l'accord du candidat, une seule fois par offre, cinq au plus, et garde le consentement", () => {
    const block = router.slice(router.indexOf("applyToOffer: candidateProcedure"), router.indexOf("withdrawApplication: candidateProcedure"));
    expect(block).toContain("consent: z.boolean().refine((value) => value === true");
    expect(block).toContain("isOfferOpen(offer)");
    expect(block).toContain("Vous avez déjà postulé à cette offre.");
    expect(block).toContain("MAX_ACTIVE_JOB_APPLICATIONS");
    expect(block).toContain("JOB_CONSENT_VERSION");
    expect(block).toContain("disclosureLevel: 1");
    expect(block).toContain("ctx.candidate.id");
  });

  it("toute gestion exige une session d'administration ; consulter des candidatures est journalisé ; publier passe par les contrôles", () => {
    const adminProcedures = router.match(/\n  admin[A-Za-z]+:/g) ?? [];
    expect(adminProcedures.length).toBe(7);
    expect((router.match(/requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(adminProcedures.length);
    expect(router).toContain('audit(db, admin, "job_applications.viewed"');
    expect(router).toContain("jobOfferPublishBlockers(");
    expect(router).toContain("organization?.status === \"verified\"");
    expect(router).toContain("Choisissez le motif du refus dans la liste.");
    expect(router).toContain("Une candidature terminée ne se rouvre pas");
    // Un signalement fondé retire l'offre et prévient les candidats concernés.
    expect(router.slice(router.indexOf("adminHandleReport:"))).toContain('closeReason: "withdrawn_by_admin"');
  });

  it("aucun nom de procédure n'est un mot réservé de tRPC (apply, call, bind…) : un seul fait échouer le démarrage du serveur", () => {
    const reserved = new Set(["apply", "call", "bind", "toString", "constructor", "prototype", "length", "name", "caller", "arguments", "valueOf", "hasOwnProperty"]);
    for (const file of ["server/routers/jobOffers.ts", "server/routers/studyCatalog.ts", "server/routers/countryCatalog.ts"]) {
      const names = Array.from(read(file).matchAll(/\n  ([A-Za-z]+): (?:publicProcedure|candidateProcedure)/g), (match) => match[1]);
      expect(names.length, file).toBeGreaterThan(5);
      expect(names.filter((name) => reserved.has(name)), file).toEqual([]);
    }
  });

  it("le routeur est branché et la migration 0089 ne crée que de nouvelles tables", () => {
    expect(read("server/routers.ts")).toContain("jobOffers: jobOffersRouter");
    expect(read("drizzle/schema.ts")).toContain('export * from "./jobOffersSchema";');
    const sql = read("drizzle/0089_job_offers.sql");
    const tables = (sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) ?? []).map((line) => line.replace("CREATE TABLE IF NOT EXISTS ", ""));
    expect(tables).toEqual(["job_offers", "job_applications", "job_application_events", "job_offer_reports"]);
    expect(sql).not.toMatch(/ALTER TABLE|DROP (TABLE|COLUMN|INDEX)|DELETE FROM|^UPDATE /im);
    expect(sql).toContain("UNIQUE KEY uq_job_applications_offer_candidate (offer_id, candidate_id)");
  });
});
