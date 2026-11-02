import { describe, expect, it } from "vitest";
import { applyFormBilanDraft, buildFormBilanDraft } from "../shared/evaluationFromForm";
import { blankAdminVersion, findForbiddenTerms, findSensitiveValues } from "../shared/evaluationValidation";
import { formDraftFromContext } from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT } from "./services/evaluationValidationTestkit";

const STUDY = { programId: "etudes-cursus", studyLevel: "master", programName: "Informatique", admissionStatus: "recue", fundingPlan: "famille", languageProofStatus: "a_passer" };
const VISIT = { programId: "tourisme-famille", visitorStatus: "employe", plannedDeparture: "2020-01-10", travelHistory: "aucun", hostInvitation: "non", returnTies: "Emploi et famille" };

describe("bilan préparé depuis le formulaire", () => {
  it("études : atouts et points à renforcer viennent des réponses, profil études, aucune note inventée", () => {
    const draft = buildFormBilanDraft({ projectType: "etudes", country: "Allemagne", details: STUDY });
    expect(draft).not.toBeNull();
    expect(draft!.profile).toBe("etudes");
    expect(draft!.strengths).toContain("Admission déjà reçue d’un établissement.");
    expect(draft!.strengths).toContain("Source de financement identifiée.");
    expect(draft!.improvements).toContain("Preuve de niveau de langue à passer.");
    expect(draft!.requiredDocuments.length).toBeGreaterThan(0);
    expect(draft!.profileSummary).toContain("Allemagne");
  });

  it("séjour visiteur : rendez-vous conseiller proposé, passeport/dates signalés, éléments de retour comptés comme atout", () => {
    const draft = buildFormBilanDraft({ projectType: "tourisme", country: "France", details: VISIT });
    expect(draft!.profile).toBe("tourisme");
    expect(draft!.actionPlan.some((step) => /rendez-vous/i.test(step.title))).toBe(true);
    expect(draft!.blockers).toContain("La date de voyage indiquée est déjà passée : à mettre à jour.");
    expect(draft!.improvements).toContain("Invitation ou attestation d’accueil à obtenir.");
    expect(draft!.strengths.some((line) => /retour/i.test(line))).toBe(true);
  });

  it("le travail ne reçoit pas de rendez-vous visiteur et un formulaire absent donne null", () => {
    const work = buildFormBilanDraft({ projectType: "travail", country: "Canada", details: { programId: "travail-employeur", targetJob: "Soudeur", offerStatus: "signee" } });
    expect(work!.profile).toBe("travail");
    expect(work!.actionPlan.some((step) => /rendez-vous/i.test(step.title))).toBe(false);
    expect(buildFormBilanDraft({ projectType: "etudes", country: "Canada", details: null })).toBeNull();
    expect(buildFormBilanDraft({ projectType: "etudes", country: "Canada", details: { foo: "bar" } })).toBeNull();
  });

  it("le texte produit passe les contrôles de publication (aucune promesse, aucune donnée sensible)", () => {
    for (const [kind, details] of [["etudes", STUDY], ["tourisme", VISIT]] as const) {
      const draft = buildFormBilanDraft({ projectType: kind, country: "France", details })!;
      const text = [draft.profileSummary, ...draft.strengths, ...draft.improvements, ...draft.blockers, ...draft.actionPlan.map((step) => `${step.title} ${step.detail ?? ""}`)].join("\n");
      expect(findForbiddenTerms(text)).toEqual([]);
      expect(findSensitiveValues(text)).toEqual([]);
    }
  });

  it("application : remplit les rubriques vides, n'écrase jamais le travail de l'administrateur ni les notes", () => {
    const draft = buildFormBilanDraft({ projectType: "etudes", country: "Allemagne", details: STUDY })!;
    const blank = { ...blankAdminVersion({ priorityCountry: "Allemagne", candidateName: "A", evaluationDate: "2026-11-02", profile: "etudes" }), scores: { identity: 7, qualification: 0, languages: 0, experience: 0, employability: 0, finances: 0, documents: 0, coherence: 0 } };
    const first = applyFormBilanDraft(blank, draft);
    expect(first.filled).toEqual(expect.arrayContaining(["Résumé du profil", "Atouts", "Points à renforcer", "Plan d’action", "Pièces à fournir"]));
    expect(first.version.scores.identity).toBe(7);
    const edited = { ...first.version, profileSummary: "Mon résumé", strengths: ["Mon atout"] };
    const second = applyFormBilanDraft(edited, draft);
    expect(second.version.profileSummary).toBe("Mon résumé");
    expect(second.version.strengths).toEqual(["Mon atout"]);
    expect(second.filled).not.toContain("Atouts");
  });

  it("les notes du formulaire d'un contexte d'évaluation sont lues, sans formulaire le brouillon est nul", () => {
    expect(formDraftFromContext({ ...CANDIDATE_CONTEXT, projectType: "etudes", visaType: "schengen_etude", projectDetails: STUDY })?.profile).toBe("etudes");
    expect(formDraftFromContext({ ...CANDIDATE_CONTEXT, projectDetails: null })).toBeNull();
  });
});

// ── Cœur : repli sans IA et publication sans CV ──────────────────────────────
import { buildAdminView, publishEvaluation, recordAiDraft, saveAdminVersion, versionStamp, type ValidationDeps } from "./services/evaluationValidationCore";
import { FakeMailer, InMemoryValidationStore } from "./services/evaluationValidationTestkit";
import { PUBLICATION_CHECKLIST } from "../shared/evaluationValidation";

function studySetup() {
  const now = () => new Date("2026-11-02T09:00:00.000Z");
  const context = { ...CANDIDATE_CONTEXT, candidateCountry: "Allemagne", visaType: "schengen_etude", projectType: "etudes", programId: "etudes-cursus", projectDetails: STUDY, cvOnFile: false, cvFileName: null, cvFileUrl: null };
  const store = new InMemoryValidationStore([context], now);
  const deps: ValidationDeps = { store, mailer: new FakeMailer(store.timeline), now, portalUrl: "https://www.3mtravelagency.com/mon-espace" };
  return { store, deps };
}

describe("études sans CV ni IA : le formulaire prépare le bilan", () => {
  it("si l'IA échoue, la version administrateur est préparée depuis le formulaire (notes vierges)", async () => {
    const { deps, store } = studySetup();
    await recordAiDraft(deps, 1, { ok: false, error: "Clé IA absente" });
    const version = (await store.getLatestCase(1))!.adminVersion!;
    expect(version.profile).toBe("etudes");
    expect(version.strengths).toContain("Admission déjà reçue d’un établissement.");
    expect(version.actionPlan.length).toBeGreaterThan(0);
    expect(Object.values(version.scores).every((score) => score === 0)).toBe(true);
    const view = await buildAdminView(deps, 1);
    expect(view.formDraft?.profile).toBe("etudes");
  });

  it("la publication n'est pas bloquée par l'absence de CV pour un projet d'études", async () => {
    const { deps, store } = studySetup();
    await recordAiDraft(deps, 1, { ok: false, error: "Clé IA absente" });
    const current = (await store.getLatestCase(1))!;
    const filled = {
      ...current.adminVersion!,
      scores: { identity: 8, qualification: 14, languages: 10, experience: 3, employability: 12, finances: 14, documents: 6, coherence: 4 },
      route: "A" as const,
      riskLevel: "faible" as const,
      clientRemarks: "Dossier d’études cohérent.",
    };
    await saveAdminVersion(deps, { email: "admin@3m.test" }, 1, filled);
    const saved = (await store.getLatestCase(1))!;
    const result = await publishEvaluation(deps, { email: "admin@3m.test" }, 1, {
      reviewedVersionStamp: versionStamp(saved.adminVersion!),
      sendEmail: false,
      checklist: Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true])),
    } as never);
    expect(result).toBeTruthy();
  });
});

describe("panneau administrateur : branchement", () => {
  it("le CV n'est exigé côté interface que si le serveur l'exige, et la carte du formulaire est affichée", () => {
    const panel = readFileSync(resolve(import.meta.dirname, "../client/src/components/EvaluationValidationPanel.tsx"), "utf8");
    expect(panel).toContain("evaluationRequiresCv(view.evaluation.visaType, view.evaluation.projectType, view.evaluation.programId)");
    expect(panel).toContain("cvRequired && !view.evaluation.cvOnFile");
    expect(panel).toContain("<EvaluationFormDraftCard");
  });
});
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
