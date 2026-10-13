import { describe, expect, it } from "vitest";
import { SERVICE_POLES, SERVICES_FAQ } from "../client/src/data/serviceCatalog";

// Contenu soutenu mais honnête : ni prix, ni délai chiffré, ni résultat promis, ni montant unique de frais d'ouverture.
const NUMBERS = /\d+\s?(%|€|\$|FCFA|F CFA|h\b|heures?|jours?|semaines?|mois)/i;
const PROMISES = /garanti(?!r)|100\s?%|sans risque|assur[ée]s? de réussir|à coup sûr/i;

describe("page /services : contenu enrichi", () => {
  it("chaque service explique concrètement ce que 3M prépare (3 à 4 repères) sans prix ni promesse", () => {
    for (const pole of SERVICE_POLES) {
      for (const service of pole.services) {
        expect(service.points.length, service.id).toBeGreaterThanOrEqual(3);
        expect(service.points.length, service.id).toBeLessThanOrEqual(4);
        for (const point of service.points) {
          expect(point, `${service.id} : ${point}`).not.toMatch(NUMBERS);
          expect(point, `${service.id} : ${point}`).not.toMatch(PROMISES);
          expect(point.length, point).toBeGreaterThan(20);
        }
        expect(new Set(service.points).size, service.id).toBe(service.points.length);
      }
    }
  });

  it("chaque pôle a un texte d'introduction qui rappelle que la décision appartient aux autorités ou au prestataire", () => {
    for (const pole of SERVICE_POLES) {
      expect(pole.summary.length, pole.id).toBeGreaterThan(150);
      expect(pole.summary, pole.id).not.toMatch(NUMBERS);
      expect(pole.summary, pole.id).not.toMatch(PROMISES);
      expect(pole.summary, pole.id).toMatch(/autorités|prestataires|compagnies|administrations/);
    }
  });

  it("la FAQ répond aux questions clés : sans garantie de visa, frais confirmés par écrit, aucun montant ni délai promis", () => {
    expect(SERVICES_FAQ.length).toBeGreaterThanOrEqual(7);
    for (const item of SERVICES_FAQ) {
      expect(item.answer, item.question).not.toMatch(NUMBERS);
      expect(item.answer, item.question).not.toMatch(/65[\s .]?000/);
      expect(item.answer.length, item.question).toBeGreaterThan(80);
    }
    const byQuestion = Object.fromEntries(SERVICES_FAQ.map((item) => [item.question, item.answer]));
    expect(byQuestion["Que coûte l’accompagnement ?"]).toContain("confirmé par écrit avant tout paiement");
    expect(byQuestion["3M peut-elle garantir l’obtention d’un visa ?"]).toMatch(/^Non/);
    expect(byQuestion["Combien de temps faut-il ?"]).toContain("aucun délai n’est promis");
  });
});
