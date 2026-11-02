import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_ACTIVE_STUDY_APPLICATIONS,
  STUDY_APPLICATION_STATUSES,
  STUDY_STATUS_CLIENT_NEXT,
  STUDY_STATUS_LABELS,
  canApplyToIntake,
  effectiveAvailability,
  feePublishBlockers,
  institutionPublishBlockers,
  intakePublishBlockers,
  isAcademicYear,
  isCurrencyCode,
  isStudyStatusChangeAllowed,
  tuitionFreshness,
  tuitionLabel,
} from "../shared/studyCatalog";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const now = new Date("2026-10-28T10:00:00Z");

describe("catalogue études : règles partagées", () => {
  it("affiche toujours une scolarité avec sa devise, son année et la mention « indicatif »", () => {
    const label = tuitionLabel({ amount: "12500.00", currency: "EUR", period: "year", academicYear: "2026-2027", checkedAt: "2026-10-01T00:00:00Z" }, now);
    expect(label).toContain("EUR");
    expect(label).toContain("par an");
    expect(label).toContain("année 2026-2027");
    expect(label).toContain("indicatif");
    expect(label).not.toContain("à reconfirmer");
    expect(tuitionLabel({ amount: 8000, currency: "CAD", period: "semester", academicYear: "2025-2026", checkedAt: "2024-01-01T00:00:00Z" }, now)).toContain("(à reconfirmer)");
    expect(tuitionFreshness(null, now)).toBe("never");
  });

  it("une date limite dépassée ferme la rentrée même si elle est restée « ouverte »", () => {
    const base = { startDate: "2027-09-01", availability: "open" as const };
    expect(effectiveAvailability({ ...base, applicationDeadline: "2027-03-01" }, now)).toBe("open");
    expect(effectiveAvailability({ ...base, applicationDeadline: "2026-11-15" }, now)).toBe("closing_soon");
    expect(effectiveAvailability({ ...base, applicationDeadline: "2026-10-01" }, now)).toBe("closed");
    expect(effectiveAvailability({ ...base, applicationDeadline: "2027-03-01", availability: "closed" }, now)).toBe("closed");
    expect(effectiveAvailability({ ...base, applicationDeadline: "2027-03-01", applicationsOpenAt: "2027-01-01" }, now)).toBe("closed");
    expect(effectiveAvailability({ startDate: "2026-09-01", availability: "open" }, now)).toBe("closed");
    expect(effectiveAvailability({ ...base, applicationDeadline: "2027-03-01", availability: "waitlist" }, now)).toBe("waitlist");
    expect(canApplyToIntake({ ...base, applicationDeadline: "2027-03-01" }, now)).toBe(true);
    expect(canApplyToIntake({ ...base, applicationDeadline: "2026-10-01" }, now)).toBe(false);
  });

  it("limite à trois vœux actifs et ne rouvre jamais une candidature retirée ou non retenue", () => {
    expect(MAX_ACTIVE_STUDY_APPLICATIONS).toBe(3);
    expect(isStudyStatusChangeAllowed("submitted_to_agency", "agency_review")).toBe(true);
    expect(isStudyStatusChangeAllowed("agency_review", "agency_review")).toBe(false);
    expect(isStudyStatusChangeAllowed("withdrawn", "agency_review")).toBe(false);
    expect(isStudyStatusChangeAllowed("rejected", "submitted_to_institution")).toBe(false);
    for (const status of STUDY_APPLICATION_STATUSES) {
      expect(STUDY_STATUS_LABELS[status], status).toBeTruthy();
      expect(STUDY_STATUS_CLIENT_NEXT[status], status).toBeTruthy();
    }
  });

  it("ne publie rien sans relecture du jour, sans accréditation ni provenance du montant", () => {
    expect(institutionPublishBlockers({ name: "Université exemple", countryCode: "CA", accreditationNote: "Établissement reconnu", checkedAt: now, now })).toEqual([]);
    expect(institutionPublishBlockers({ name: "Université exemple", countryCode: "CA", accreditationNote: "", checkedAt: now, now }).join(" ")).toMatch(/accréditation/i);
    expect(institutionPublishBlockers({ name: "Université exemple", countryCode: "CA", accreditationNote: "Reconnue", checkedAt: null, now }).join(" ")).toMatch(/relisez/i);
    expect(feePublishBlockers({ amount: 12000, currency: "EUR", academicYear: "2026-2027", sourceNote: "Grille tarifaire 2026", checkedAt: now, now })).toEqual([]);
    const bad = feePublishBlockers({ amount: 0, currency: "euro", academicYear: "2026", sourceNote: "", checkedAt: null, now }).join(" ");
    for (const part of [/supérieur à zéro/, /devise/, /année académique/, /provenance/, /Relisez/]) expect(bad).toMatch(part);
    expect(isAcademicYear("2026-2027")).toBe(true);
    expect(isAcademicYear("2026-2028")).toBe(false);
    expect(isCurrencyCode("CAD")).toBe(true);
    expect(isCurrencyCode("cad")).toBe(false);
  });

  it("vérifie la cohérence des dates d'une rentrée", () => {
    expect(intakePublishBlockers({ startDate: "2027-09-01", applicationDeadline: "2027-03-01", applicationsOpenAt: "2026-11-01" })).toEqual([]);
    expect(intakePublishBlockers({ startDate: "2027-09-01", applicationDeadline: "2027-10-01" }).join(" ")).toMatch(/précéder le début/);
    expect(intakePublishBlockers({ startDate: "2027-09-01", applicationDeadline: "2027-03-01", applicationsOpenAt: "2027-04-01" }).join(" ")).toMatch(/ouverture/);
  });
});

describe("catalogue études : serveur, migration et confidentialité", () => {
  const router = read("server/routers/studyCatalog.ts");

  it("la lecture publique ne renvoie que le publié, sans site d'établissement ni provenance des montants", () => {
    const publicBlock = router.slice(router.indexOf("schools:"), router.indexOf("myApplications:"));
    expect(publicBlock).toContain('eq(studyInstitutions.status, "published")');
    expect(publicBlock).toContain('eq(studyPrograms.status, "published")');
    expect(publicBlock).toContain('eq(studyIntakes.status, "published")');
    expect(publicBlock).toContain('eq(studyTuitionFees.status, "published")');
    expect(publicBlock).not.toContain("adminWebsite");
    expect(publicBlock).not.toContain("sourceNote");
    expect(publicBlock).not.toContain("sessionToken");
  });

  it("la candidature exige un candidat connecté, son accord, un seul envoi par rentrée et trois vœux actifs au plus", () => {
    const block = router.slice(router.indexOf("applyToIntake: candidateProcedure"), router.indexOf("withdraw: candidateProcedure"));
    expect(block).toContain("consent: z.boolean().refine((value) => value === true");
    expect(block).toContain("canApplyToIntake(intake)");
    expect(block).toContain("Vous avez déjà postulé à cette rentrée.");
    expect(block).toContain("MAX_ACTIVE_STUDY_APPLICATIONS");
    expect(block).toContain("ctx.candidate.id");
    expect(block).toContain("STUDY_CONSENT_VERSION");
    expect(block).toContain('actorType: "candidate"');
    // Le candidat ne retire et ne lit que ses propres candidatures.
    expect(router.slice(router.indexOf("withdraw: candidateProcedure"), router.indexOf("adminTree:"))).toContain("eq(studyApplications.candidateId, ctx.candidate.id)");
    expect(router.slice(router.indexOf("myApplications:"), router.indexOf("applyToIntake: candidateProcedure"))).toContain("eq(studyApplications.candidateId, ctx.candidate.id)");
  });

  it("toute gestion exige une session d'administration et est journalisée", () => {
    const adminProcedures = router.match(/\n  admin[A-Za-z]+:/g) ?? [];
    expect(adminProcedures.length).toBe(8);
    expect((router.match(/requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(adminProcedures.length);
    expect((router.match(/await audit\(db, admin,/g) ?? []).length).toBe(6); // établissement, programme, rentrée, scolarité, suppression, étape d'une candidature
    expect(router).toContain("refuseIfBlocked(institutionPublishBlockers(");
    expect(router).toContain("refuseIfBlocked(feePublishBlockers(");
    expect(router).toContain("refuseIfBlocked(intakePublishBlockers(");
    expect(router).toContain("Des candidatures existent pour cette rentrée");
  });

  it("le routeur est branché et la migration 0088 ne crée que de nouvelles tables", () => {
    expect(read("server/routers.ts")).toContain("studyCatalog: studyCatalogRouter");
    expect(read("drizzle/schema.ts")).toContain('export * from "./studyCatalogSchema";');
    const sql = read("drizzle/0088_study_catalog.sql");
    const tables = (sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) ?? []).map((line) => line.replace("CREATE TABLE IF NOT EXISTS ", ""));
    expect(tables).toEqual(["study_institutions", "study_programs", "study_intakes", "study_tuition_fees", "study_applications", "study_application_events"]);
    expect(sql).not.toMatch(/ALTER TABLE|DROP (TABLE|COLUMN|INDEX)|DELETE FROM|^UPDATE /im);
    expect(sql).toContain("UNIQUE KEY uq_study_applications_candidate_intake (candidate_id, intake_id)");
  });
});
