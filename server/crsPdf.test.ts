import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCrsPdf, crsPdfFileName } from "@/lib/crsPdf";
import { CRS_TIPS, tipSummary } from "@/lib/crsTips";
import { improvementLevers } from "@/lib/crsResultModel";
import { EMPTY_CRS_ANSWERS, buildCrsProfileFromOfficialAnswers, type CrsOfficialAnswers } from "@shared/crsOfficialAnswers";
import { computeCrsScore } from "@shared/crsScore";

/** Profil de référence n° 1 de l'outil officiel d'IRCC : 469 points. */
const referenceAnswers: CrsOfficialAnswers = {
  ...EMPTY_CRS_ANSWERS,
  maritalStatus: "single",
  age: "29",
  education: "master_or_professional",
  canadianCredential: "no",
  languageTestRecent: "yes",
  firstTest: "ielts",
  firstBands: { speaking: "1", listening: "1", reading: "1", writing: "1" },
  canadianWorkYears: "0",
  highWageExperience: "no",
  foreignWorkYears: "3",
  certificate: "no",
  jobOffer: "no",
  nomination: "no",
  sibling: "no",
};

describe("export PDF de la calculatrice CRS", () => {
  it("nomme le fichier avec la date", () => {
    expect(crsPdfFileName(new Date("2026-11-05T10:00:00Z"))).toBe("score-crs-canada-2026-11-05.pdf");
  });

  it("produit un vrai PDF contenant la note, les sous-totaux et l'avertissement", async () => {
    const built = buildCrsProfileFromOfficialAnswers(referenceAnswers);
    // Si les clés du profil de test ne correspondent plus au modèle, on le dit clairement plutôt que d'exporter un PDF vide.
    expect(built.complete, `réponses incomplètes : ${"complete" in built && !built.complete ? built.missing.join(" | ") : ""}`).toBe(true);
    if (!built.complete) return;
    const breakdown = computeCrsScore(built.profile);
    const doc = await buildCrsPdf({ breakdown, withSpouse: built.withSpouse, levers: improvementLevers(built.profile, breakdown), generatedAt: new Date("2026-11-05T10:00:00Z") });
    const raw = doc.output();
    expect(raw.startsWith("%PDF-")).toBe(true);
    expect(raw).toContain(`${breakdown.total} / 1 270`);
    expect(raw).toContain("Facteurs de base/du capital humain");
    expect(raw).toContain("Sous-total");
    expect(raw).toContain("Points supplémentaires");
    expect(raw).toContain("prévaut");
    expect(raw).not.toContain(" "); // l'espace fine insécable n'existe pas dans la police par défaut de jsPDF
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});

describe("infobulles de la calculatrice CRS", () => {
  const source = readFileSync(resolve(import.meta.dirname, "../client/src/components/CrsOfficialCalculator.tsx"), "utf8");
  const questionIds = Array.from(source.matchAll(/<Question id="([^"]+)"/g), (match) => match[1]);

  it("toute question de la calculatrice a son explication, et toute explication a sa question", () => {
    expect(questionIds.length).toBeGreaterThanOrEqual(23);
    for (const id of questionIds) expect(CRS_TIPS[id], `pas d'infobulle pour ${id}`).toBeTruthy();
    for (const id of Object.keys(CRS_TIPS)) expect(questionIds, `infobulle orpheline : ${id}`).toContain(id);
  });

  it("chaque explication est rédigée (phrase complète) et ne promet aucun résultat", () => {
    for (const [id, tip] of Object.entries(CRS_TIPS)) {
      expect(tip.length, id).toBeGreaterThan(60);
      expect(tip.trim().endsWith("."), id).toBe(true);
      expect(tip, id).not.toMatch(/garanti|assuré/i);
    }
  });

  it("le résumé du survol est la première phrase, plafonné", () => {
    expect(tipSummary("Première phrase. Deuxième phrase.")).toBe("Première phrase.");
    expect(tipSummary("a".repeat(400)).length).toBeLessThanOrEqual(160);
  });
});
