import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COUNTRY_FORM_RETURN_EMAIL,
  COUNTRY_FORM_RETURN_INSTRUCTION,
  resolveCountryEvaluationForm,
} from "../shared/countryEvaluationForms";
import { countryFormTargetsForCandidate } from "./services/candidateCountryForms";

const read = (path: string) => readFileSync(path, "utf8");

describe("formulaire pays — ciblage des pays choisis à l’inscription", () => {
  it("livre un formulaire par pays choisi, dans l’ordre, jusqu’à 3", () => {
    const targets = countryFormTargetsForCandidate({
      preferredDestinations: JSON.stringify(["Canada", "France", "Allemagne", "Belgique"]),
      destination: "europe",
    });
    expect(targets.map((t) => t.countryLabel)).toEqual(["Canada", "France", "Allemagne"]);
  });

  it("dédoublonne les libellés qui désignent le même pays", () => {
    const targets = countryFormTargetsForCandidate({
      preferredDestinations: JSON.stringify(["France", "France - Visa Études"]),
    });
    expect(targets).toHaveLength(1);
  });

  it("utilise l’ancienne catégorie large seulement si elle désigne un seul pays", () => {
    expect(countryFormTargetsForCandidate({ preferredDestinations: null, destination: "canada" })[0]?.countryLabel).toBe("Canada");
    expect(countryFormTargetsForCandidate({ preferredDestinations: "[]", destination: "europe" })).toEqual([]);
    expect(countryFormTargetsForCandidate({ preferredDestinations: "illisible{", destination: "autre" })).toEqual([]);
  });

  it("chaque pays a un titre de notification distinct (un e-mail par pays)", () => {
    const titles = countryFormTargetsForCandidate({ preferredDestinations: JSON.stringify(["Canada", "France", "Japon"]) }).map((t) => t.notificationTitle);
    expect(new Set(titles).size).toBe(3);
  });
});

describe("formulaire pays — consigne de renvoi", () => {
  it("indique le renvoi par e-mail OU le dépôt dans l’espace client, pour tous les pays", () => {
    expect(COUNTRY_FORM_RETURN_INSTRUCTION).toContain(COUNTRY_FORM_RETURN_EMAIL);
    expect(COUNTRY_FORM_RETURN_INSTRUCTION).toMatch(/espace client/i);
    for (const name of ["Canada", "France", "Japon", "Sénégal"]) {
      const form = resolveCountryEvaluationForm(name)!;
      expect(form.instructions, name).toContain(COUNTRY_FORM_RETURN_INSTRUCTION);
      expect(form.notificationBody, name).toContain(COUNTRY_FORM_RETURN_EMAIL);
      expect(form.notificationBody, name).toMatch(/espace client/i);
      expect(form.notificationBody, name).toMatch(/distinct de l’évaluation/i);
    }
  });

  it("l’e-mail met la consigne en évidence et la livraison est idempotente par pays", () => {
    const service = read("server/services/deliverCountryEvaluationForm.ts");
    expect(service).toContain("À faire : remplir puis renvoyer ce formulaire");
    expect(service).toContain("soit par e-mail");
    expect(service).toContain("soit en le déposant dans votre espace client");
    expect(service).toMatch(/eq\(clientNotifications\.title, template\.notificationTitle\)/);
  });
});

describe("formulaire pays — déclencheurs automatiques", () => {
  const candidateRouter = read("server/routers/candidate.ts");

  it("part à la confirmation de l’e-mail (lien et code) sans bloquer l’activation", () => {
    expect(candidateRouter.match(/void deliverCountryFormsForCandidateSafely\(db, candidate\)/g)?.length).toBe(2);
  });

  it("part aussi quand le candidat change ses pays favoris (compte confirmé)", () => {
    expect(candidateRouter).toMatch(/input\.preferredDestinations !== undefined && ctx\.candidate\.emailVerified/);
  });

  it("le rattrapage admin compte d’abord (dryRun par défaut), puis envoie par lots", () => {
    const admin = read("server/routers/adminCandidateManagement.ts");
    expect(admin).toMatch(/sendCountryFormsBackfill[\s\S]*dryRun: z\.boolean\(\)\.default\(true\)/);
    expect(admin).toContain("requireAdminSessionFromCookie");
    const ui = read("client/src/pages/CandidatesManager.tsx");
    expect(ui).toContain("send-country-forms-backfill");
    expect(ui).toContain("dryRun: true");
  });
});
