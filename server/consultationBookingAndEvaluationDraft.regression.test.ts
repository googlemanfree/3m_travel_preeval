import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");
const shell = "<!doctype html><html lang=\"fr\"><head><title>t</title></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("wizard de prise de rendez-vous", () => {
  it("est chargé à la demande et accessible publiquement", () => {
    const app = source("client/src/App.tsx");
    expect(app).toContain('const ConsultationBooking = lazyWithTimeout(() => import("./pages/ConsultationBooking"))');
    expect(app).toContain('<Route path={"/consultation"} component={ConsultationBooking} />');
  });

  it("est servi en 200 indexable par le serveur de production, jamais en 404", () => {
    const rendered = composePublicPrerender(shell, "/consultation");
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(false);
    expect(rendered.html).toContain("<h1>Prendre rendez-vous avec un conseiller</h1>");
    expect(rendered.html).toContain('<link rel="canonical" href="https://www.3mtravelagency.com/consultation" />');
    expect(getIndexablePublicPaths()).toContain("/consultation");
  });

  it("respecte les plafonds SEO des pages prioritaires", () => {
    const html = composePublicPrerender(shell, "/consultation").html;
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    const keywords = html.match(/<meta name="keywords" content="([^"]*)"/)?.[1].split(", ") ?? [];
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(keywords.length).toBeGreaterThanOrEqual(3);
    expect(keywords.length).toBeLessThanOrEqual(8);
  });

  it("est joignable depuis la page Contact", () => {
    const contact = source("client/src/pages/Contact.tsx");
    expect(contact).toContain('href="/consultation"');
    expect(contact).toContain("Prendre rendez-vous");
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

  it("n'ajoute pas de seconde barre de navigation : App.tsx fournit déjà la barre globale", () => {
    const page = source("client/src/pages/ConsultationBooking.tsx");
    const app = source("client/src/App.tsx");
    expect(app).toContain("<Navbar />");
    expect(page).not.toMatch(/import\s+Navbar/);
    expect(page).not.toContain("<Navbar");
  });

  it("garde le champ pays propre et range le type de consultation dans le message", () => {
    const page = source("client/src/pages/ConsultationBooking.tsx");
    expect(page).toContain("targetCountry: form.targetCountry,");
    expect(page).toContain("Type de consultation : ${serviceLabel}");
    expect(page).not.toMatch(/targetCountry:\s*`/);
    expect(page).toContain("maxLength={1800}");
  });

  it("annonce les erreurs et l'étape courante aux technologies d'assistance", () => {
    const page = source("client/src/pages/ConsultationBooking.tsx");
    expect(page.match(/role="alert"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain('role="progressbar"');
    expect(page).toContain("aria-valuenow={step}");
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
