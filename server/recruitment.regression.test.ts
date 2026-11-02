import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { containsForbiddenPromise } from "../shared/cvtheque";
import {
  ADMIN_SETTABLE_NEED_CANDIDATE,
  CANDIDATE_STATUS_LABELS,
  EMPLOYER_STATUS_LABELS,
  INTERNATIONAL_FIELDS_NOTICE,
  INTERVIEW_STATUS_LABELS,
  NEED_CANDIDATE_STATUSES,
  NEED_STATUS_LABELS,
  SUPPORT_LABELS,
  TRI_STATE_LABELS,
  canAdvanceInterview,
  canAdvanceNeedCandidate,
  candidateNeedView,
} from "../shared/recruitment";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const router = read("server/routers/recruitment.ts");
const section = (from: string, to?: string) => {
  const start = router.indexOf(from);
  const end = to ? router.indexOf(to) : router.length;
  expect(start).toBeGreaterThan(-1);
  return router.slice(start, end);
};
const employerPart = section("// ───────────────────────── Employeur", "// ───────────────────────── Administration");
const adminPart = section("// ───────────────────────── Administration", "// ───────────────────────── Candidat");
const candidatePart = section("// ───────────────────────── Candidat");

const needView = (overrides: Record<string, unknown> = {}) => ({
  title: "Soudeur", country: "Canada", workLocation: "Québec", contractDuration: "24 mois", salaryGross: 32, salaryCurrency: "CAD", salaryPeriod: "hour",
  companyName: "Acier Nord", beneficiaryConfidential: false, foreignApplications: "yes" as const, noLocalWorkAuth: "tbc" as const, intlSupport: "to_specify" as const, ...overrides,
});

describe("Besoins, présentations et entretiens — règles communes", () => {
  it("un candidat ne peut être présenté à l'employeur qu'après avoir exprimé son intérêt", () => {
    expect(canAdvanceNeedCandidate("proposed", "presented")).toBe(false);
    expect(canAdvanceNeedCandidate("admin_review", "presented")).toBe(false);
    expect(canAdvanceNeedCandidate("candidate_contacted", "presented")).toBe(false);
    expect(canAdvanceNeedCandidate("candidate_interested", "presented")).toBe(true);
    expect(canAdvanceNeedCandidate("candidate_declined", "presented")).toBe(false);
  });

  it("un statut clos ne peut plus évoluer et tout statut peut être clos par l'administration", () => {
    for (const status of NEED_CANDIDATE_STATUSES) {
      if (status === "closed") continue;
      if (["candidate_declined", "employer_selected", "employer_not_selected"].includes(status)) expect(canAdvanceNeedCandidate(status, "closed")).toBe(true);
    }
    expect(canAdvanceNeedCandidate("closed", "presented")).toBe(false);
  });

  it("les réponses du candidat et la décision de l'employeur ne sont jamais posées par l'administration", () => {
    for (const forbidden of ["candidate_interested", "candidate_declined", "employer_selected", "employer_not_selected", "proposed"] as const) {
      expect(ADMIN_SETTABLE_NEED_CANDIDATE).not.toContain(forbidden);
    }
    expect(ADMIN_SETTABLE_NEED_CANDIDATE).toContain("candidate_contacted");
    expect(ADMIN_SETTABLE_NEED_CANDIDATE).toContain("presented");
  });

  it("un entretien suit le chemin demande → acceptation → disponibilité du candidat → programmation → réalisation", () => {
    expect(canAdvanceInterview("received", "scheduled")).toBe(false);
    expect(canAdvanceInterview("received", "accepted")).toBe(true);
    expect(canAdvanceInterview("accepted", "scheduled")).toBe(false);
    expect(canAdvanceInterview("accepted", "candidate_confirmed")).toBe(true);
    expect(canAdvanceInterview("candidate_confirmed", "scheduled")).toBe(true);
    expect(canAdvanceInterview("scheduled", "done")).toBe(true);
    expect(canAdvanceInterview("done", "scheduled")).toBe(false);
    expect(canAdvanceInterview("declined", "accepted")).toBe(false);
  });

  it("aucun libellé ne promet un visa, une admissibilité ou un emploi", () => {
    const labels = [
      ...Object.values(NEED_STATUS_LABELS), ...Object.values(EMPLOYER_STATUS_LABELS), ...Object.values(CANDIDATE_STATUS_LABELS), ...Object.values(INTERVIEW_STATUS_LABELS),
      ...Object.values(TRI_STATE_LABELS).map((l) => l.fr), ...Object.values(SUPPORT_LABELS).map((l) => l.fr),
    ];
    for (const label of labels) expect(containsForbiddenPromise(label), label).toBe(false);
    expect(Object.values(NEED_STATUS_LABELS).join(" ")).not.toMatch(/valid[ée]\b.*visa|admissible/i);
  });

  it("le rappel des champs internationaux précise que ce sont des déclarations sans garantie", () => {
    expect(INTERNATIONAL_FIELDS_NOTICE).toMatch(/déclarations de l’employeur/);
    expect(INTERNATIONAL_FIELDS_NOTICE).toMatch(/ni une garantie de visa/);
    expect(INTERNATIONAL_FIELDS_NOTICE).toMatch(/autorité du pays/);
  });

  it("le candidat ne voit jamais l'entreprise bénéficiaire lorsqu'elle est confidentielle", () => {
    expect(candidateNeedView(needView()).employer).toBe("Acier Nord");
    expect(candidateNeedView(needView({ beneficiaryConfidential: true })).employer).toBe("Entreprise examinée par 3M");
    expect(candidateNeedView(needView({ beneficiaryConfidential: 1 })).employer).toBe("Entreprise examinée par 3M");
    expect(candidateNeedView(needView({ companyName: null })).employer).toBe("Entreprise examinée par 3M");
    expect(JSON.stringify(candidateNeedView(needView({ beneficiaryConfidential: true })))).not.toContain("Acier Nord");
  });

  it("la rémunération est présentée avec sa devise et sa période", () => {
    expect(candidateNeedView(needView()).salary).toBe("32 CAD brut par heure");
    expect(candidateNeedView(needView({ salaryGross: null })).salary).toBeNull();
  });
});

describe("Besoins, présentations et entretiens — garde-fous du routeur", () => {
  it("chaque procédure employeur passe par la session employeur et reste limitée à son organisation", () => {
    const procedures = employerPart.split(/\n  (?=\w+: publicProcedure)/).slice(1);
    expect(procedures.length).toBeGreaterThanOrEqual(8);
    for (const body of procedures) expect(body, body.slice(0, 40)).toContain("getEmployerSession(input.sessionToken)");
    expect(employerPart).toContain("eq(recruitmentNeeds.organizationId, organization.id)");
    expect(employerPart).toContain("eq(partnerNotifications.organizationId, organization.id)");
  });

  it("les actions d'écriture de l'employeur exigent une permission précise côté serveur", () => {
    expect(employerPart).toContain('requirePartnerPermission(db, account, "submitNeeds")');
    expect(employerPart).toContain('requirePartnerPermission(db, account, "requestInterviews")');
  });

  it("l'employeur ne reçoit jamais d'identité, de coordonnée ni de note interne du candidat", () => {
    expect(employerPart).not.toMatch(/candidates\.(fullName|email|phone|nationality)/);
    expect(employerPart).not.toMatch(/candidateName|candidateId/);
    expect(employerPart).not.toContain("adminNote: link.adminNote");
    expect(employerPart).toContain("adminNote: undefined");
    // seuls les profils actuellement visibles (publiés, consentement, résumé approuvé) peuvent être proposés
    expect(employerPart).toContain("requireVisibleProfile");
  });

  it("toute procédure d'administration exige une session administrateur valide", () => {
    const procedures = adminPart.split(/\n  (?=\w+: publicProcedure)/).slice(1);
    expect(procedures.length).toBeGreaterThanOrEqual(6);
    for (const body of procedures) expect(body, body.slice(0, 40)).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("l'administration ne contacte ni ne présente un candidat avant l'examen de l'offre", () => {
    expect(adminPart).toMatch(/\["candidate_contacted", "presented", "interview_scheduled"\]\.includes\(input\.status\) && row\.need\.status !== "verified"/);
    expect(adminPart).toContain("L’offre doit d’abord être examinée avant d’accepter l’entretien.");
  });

  it("un candidat ne répond que pour lui-même et une seule fois", () => {
    expect(candidatePart).toContain("row.owner !== candidateId");
    expect((candidatePart.match(/verifyCandidateToken\(input\.candidateToken\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(candidatePart).toContain('row.link.status !== "candidate_contacted"');
    expect(candidatePart).toContain('row.iv.status !== "accepted"');
  });

  it("le dépôt d'un besoin refuse les formules de promesse et limite le volume quotidien", () => {
    expect(employerPart).toContain("containsForbiddenPromise(");
    expect(employerPart).toContain("TOO_MANY_REQUESTS");
    expect(containsForbiddenPromise("Visa garanti pour tous")).toBe(true);
    expect(containsForbiddenPromise("Emploi garanti")).toBe(true);
  });

  it("les notifications ne contiennent jamais de nom de candidat ni de pièce", () => {
    const calls = router.match(/await notify\(db, \{[^\n]+/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(10);
    for (const call of calls) expect(call, call).not.toMatch(/fullName|candidateName|passport|passeport|email/i);
  });

  it("une migration 0083 absente produit un message clair plutôt qu'une erreur brute", () => {
    expect(router).toContain("la migration 0083 doit être appliquée");
  });

  it("le routeur est enregistré et la migration crée les cinq nouvelles tables sans toucher aux existantes", () => {
    expect(read("server/routers.ts")).toContain("recruitment: recruitmentRouter");
    const sql = read("drizzle/0083_recruitment_needs_interviews.sql");
    for (const table of ["recruitment_needs", "need_candidates", "interview_requests", "partner_notifications", "recruitment_events"]) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    expect(sql).not.toMatch(/ALTER TABLE/i);
    expect(read("drizzle/schema.ts")).toContain('export * from "./recruitmentSchema"');
  });
});
