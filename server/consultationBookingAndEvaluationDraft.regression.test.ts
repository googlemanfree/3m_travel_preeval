import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("wizard de prise de rendez-vous", () => {
  it("est chargé à la demande, accessible publiquement et l'ancien alias redirige vers lui", () => {
    const app = source("client/src/App.tsx");
    expect(app).toContain('const ConsultationBooking = lazyWithTimeout(() => import("./pages/ConsultationBooking"))');
    expect(app).toContain('<Route path={"/consultation"} component={ConsultationBooking} />');
    expect(app).toContain('<Route path={"/prise-de-rdv"}>{() => <Redirect to="/consultation" />}</Route>');
  });

  it("réutilise la mutation serveur existante et valide chaque étape avant de continuer", () => {
    const page = source("client/src/pages/ConsultationBooking.tsx");
    expect(page).toContain("trpc.consultationRequest.submit.useMutation");
    expect(page).toContain('<StepIndicator step={step} total={3} />');
    expect(page).toContain("Merci de choisir le type de consultation.");
    expect(page).toContain("Merci d'indiquer votre pays cible.");
    expect(page).toContain("Adresse email invalide.");
    expect(page).toContain("Numéro de téléphone invalide.");
  });

  it("s'appuie sur une mutation publique qui notifie l'équipe et confirme au client", () => {
    const router = source("server/routers/consultationRequest.ts");
    expect(router).toContain("submit: publicProcedure");
    expect(router).toContain('to: "hello@3mtravelagency.com"');
    expect(router).toContain("Confirmation de votre demande");
  });
});

describe("formulaire d'évaluation — progression et brouillon", () => {
  const form = source("client/src/pages/Evaluation.tsx");

  it("affiche une progression accessible sur les six sections, section par section", () => {
    expect(form).toContain("Progression du formulaire");
    expect(form).toContain('role="progressbar"');
    expect(form).toContain("sectionProgress / 6");
    expect(form).toContain("sectionsDone[i]");
    for (const label of ["État civil", "Études", "Expérience", "Langues", "Projet", "Historique"]) {
      expect(form).toContain(`"${label}"`);
    }
  });

  it("ne part pas de 17 % : « Historique » n'est acquis qu'une fois les cinq autres sections complétées", () => {
    expect(form).toContain("return [...done, done.every(Boolean)];");
    expect(form).not.toContain("const s6 = 1");
  });

  it("sauvegarde le brouillon avec délai, le restaure, l'efface après envoi réussi ou sur demande", () => {
    expect(form).toContain("const DRAFT_KEY = 'eval_draft'");
    expect(form).toContain("localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), owner: draftOwner, form }))");
    expect(form).toContain("localStorage.getItem(DRAFT_KEY)");
    expect(form).toContain("Brouillon restauré");
    expect(form).toContain("localStorage.removeItem(DRAFT_KEY)");
    expect(form).toContain("onSuccess: clearDraft");
    expect(form).toContain("label: 'Effacer'");
    expect(form).toContain("}, 1000);");
  });

  it("protège les données personnelles du brouillon : expiration, propriétaire, aucun brouillon sans saisie", () => {
    expect(form).toContain("const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000");
    expect(form).toContain("saved.owner !== draftOwner");
    expect(form).toContain("const draftOwner = candidate?.email ?? ''");
    expect(form).toContain("JSON.stringify(form) === initialSnapshot.current");
  });

  it("laisse un projet choisi dans l'URL primer sur un ancien brouillon", () => {
    expect(form).toContain("isEvaluationProjectType(projectFromUrl) && saved.form.projectType !== projectFromUrl");
  });

  it("ne sérialise jamais le fichier CV dans le brouillon", () => {
    expect(form).not.toMatch(/JSON\.stringify\([^)]*cvFile/);
    expect(form).not.toMatch(/setItem\(DRAFT_KEY[^)]*cvFile/);
  });
});
