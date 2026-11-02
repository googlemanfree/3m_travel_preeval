import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { allVisibleFields, buildClientPlan, crsProfileFromAnswers, crsSummaryFromAnswers, missingCrsAnswers, resolveDynamicForm, sanitizeProjectDetails } from "../shared/dynamicForm";
import { computeCrsScore } from "../shared/crsScore";
import { buildFormBilanDraft } from "../shared/evaluationFromForm";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

const SINGLE = {
  crs_age: "29", crs_marital: "without_spouse", crs_education: "master_or_professional", crs_french: "7", crs_english: "9",
  crs_canadian_exp: "0", crs_foreign_exp: "3", crs_trade_cert: "non", crs_canadian_edu: "none", crs_sibling: "non", crs_pnp: "non",
};
const WITH_SPOUSE = { ...SINGLE, crs_marital: "with_spouse", crs_spouse_education: "bachelor_or_three_year", crs_spouse_clb: "7", crs_spouse_canadian_exp: "0" };

const hasCrs = (country: string, projectType: any, programId: string) => resolveDynamicForm({ country, projectType, programId }).sections.some((section) => section.id === "crs");

describe("calculateur CRS obligatoire — Canada, résidence permanente", () => {
  it("apparaît pour les programmes d'installation fondés sur les points, et seulement pour le Canada", () => {
    expect(hasCrs("Canada", "immigration", "immigration-points")).toBe(true);
    expect(hasCrs("Canada", "travail", "travail-points")).toBe(true);
    expect(hasCrs("Canada", "immigration", "immigration-orientation")).toBe(true);
    expect(hasCrs("Canada", "immigration", "immigration-regional")).toBe(true);
    // pas de CRS hors résidence permanente par points, ni hors Canada
    expect(hasCrs("Canada", "immigration", "immigration-famille")).toBe(false);
    expect(hasCrs("Canada", "etudes", "etudes-cursus")).toBe(false);
    expect(hasCrs("Canada", "tourisme", "tourisme-tourisme")).toBe(false);
    expect(hasCrs("Canada", "travail", "travail-saisonnier")).toBe(false);
    expect(hasCrs("France", "immigration", "immigration-points")).toBe(false);
  });

  it("toutes les questions sont obligatoires, celles du conjoint seulement avec un conjoint", () => {
    const form = resolveDynamicForm({ country: "Canada", projectType: "immigration", programId: "immigration-points" });
    const required = (values: Record<string, string>) => allVisibleFields(form, values).filter((field) => field.key.startsWith("crs_")).map((field) => field.key);
    expect(required({ crs_marital: "without_spouse" })).not.toContain("crs_spouse_clb");
    expect(required({ crs_marital: "with_spouse" })).toEqual(expect.arrayContaining(["crs_spouse_education", "crs_spouse_clb", "crs_spouse_canadian_exp"]));
    for (const field of allVisibleFields(form, { crs_marital: "with_spouse" }).filter((entry) => entry.key.startsWith("crs_"))) expect(field.required, field.key).toBe(true);
  });

  it("le score est recalculé depuis les réponses brutes avec la grille officielle", () => {
    const summary = crsSummaryFromAnswers(SINGLE)!;
    const expected = computeCrsScore(crsProfileFromAnswers(SINGLE)!);
    expect(summary.total).toBe(expected.total);
    expect(summary.total).toBeGreaterThan(300);
    expect(summary.total).toBeLessThanOrEqual(1200);
    // un total envoyé par le navigateur est ignoré : seules les réponses comptent
    expect(crsSummaryFromAnswers({ ...SINGLE, crs_total: "1200", total: "1200" })!.total).toBe(summary.total);
    // le conjoint change le barème
    expect(crsSummaryFromAnswers(WITH_SPOUSE)!.total).not.toBe(summary.total);
  });

  it("refuse un profil incomplet ou invalide", () => {
    expect(crsSummaryFromAnswers({})).toBeNull();
    expect(crsSummaryFromAnswers({ ...SINGLE, crs_age: "abc" })).toBeNull();
    expect(crsSummaryFromAnswers({ ...SINGLE, crs_french: "11" })).toBeNull();
    expect(crsSummaryFromAnswers({ ...SINGLE, crs_education: "phd" })).toBeNull();
    expect(crsSummaryFromAnswers({ ...SINGLE, crs_marital: "with_spouse" })).toBeNull();
  });

  it("le serveur exige le calculateur : réponses manquantes listées, rien d'exigé ailleurs", () => {
    const base = { country: "Canada", projectType: "immigration", details: { programId: "immigration-points" } };
    expect(missingCrsAnswers(base).length).toBeGreaterThan(8);
    expect(missingCrsAnswers({ ...base, details: { programId: "immigration-points", ...SINGLE } })).toEqual([]);
    expect(missingCrsAnswers({ country: "Canada", projectType: "etudes", details: { programId: "etudes-cursus" } })).toEqual([]);
    expect(missingCrsAnswers({ country: "Allemagne", projectType: "immigration", details: { programId: "immigration-points" } })).toEqual([]);
    expect(missingCrsAnswers({ country: "Canada", projectType: "immigration", details: null })).toEqual([]);
  });

  it("les réponses du calculateur survivent au nettoyage serveur et un faux champ est écarté", () => {
    const clean = sanitizeProjectDetails({ country: "Canada", projectType: "immigration" }, { programId: "immigration-points", ...SINGLE, crs_age: "99", crs_total: "1200" });
    expect(clean.crs_french).toBe("7");
    expect(clean.crs_age).toBeUndefined();
    expect(clean.crs_total).toBeUndefined();
  });

  it("l'administration voit le score recalculé, ou l'alerte « non rempli »", () => {
    const plan = buildClientPlan({ projectType: "immigration", country: "Canada", details: { programId: "immigration-points", ...SINGLE } })!;
    expect(plan.crs.required).toBe(true);
    expect(plan.crs.summary?.total).toBe(crsSummaryFromAnswers(SINGLE)!.total);
    const empty = buildClientPlan({ projectType: "immigration", country: "Canada", details: { programId: "immigration-points" } })!;
    expect(empty.crs).toMatchObject({ required: true, summary: null });
    const other = buildClientPlan({ projectType: "immigration", country: "Allemagne", details: { programId: "immigration-points" } })!;
    expect(other.crs.required).toBe(false);
  });

  it("le bilan préparé depuis le formulaire cite le score estimé, sans promesse", () => {
    const draft = buildFormBilanDraft({ projectType: "immigration", country: "Canada", details: { programId: "immigration-points", ...SINGLE } })!;
    expect(draft.profileSummary).toContain("Score CRS estimé");
    expect(draft.profileSummary).toContain("ne vaut ni invitation ni décision");
    const missing = buildFormBilanDraft({ projectType: "immigration", country: "Canada", details: { programId: "immigration-points" } })!;
    expect(missing.internalNotes.join(" ")).toContain("Calculateur CRS non rempli");
  });

  it("branchements : contrôle côté serveur aux deux points d'envoi et carte admin", () => {
    const router = read("server/routers/evaluation.ts");
    expect(router.match(/CRS_REQUIRED_MESSAGE/g)?.length).toBeGreaterThanOrEqual(3);
    expect(router).toContain("missingCrsAnswers(");
    const admin = read("client/src/components/AdminDeclaredAnswersPanel.tsx");
    expect(admin).toContain('data-testid="admin-crs-score"');
    expect(admin).toContain('data-testid="admin-crs-missing"');
  });
});
