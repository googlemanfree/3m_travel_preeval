import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlacementSummaryPdf, normalizePlacementSummaryDraft, summaryFieldsFromCvDraft, fingerprintPlacementSummary, type PlacementSummaryDraft } from "./services/placementProfileSummary";
import type { CvDraft } from "../shared/cvDraft";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const base = { firstName: "Aïcha", identity: "Aïcha D.", documents: [{ type: "CV", status: "Validé" }, { type: "Passeport", status: "Validé" }] };
const edited = {
  destination: "Luxembourg", procedure: "Visa travail", sector: "Comptabilité", experience: "5 ans", languages: "Français (natif), Anglais (courant)",
  profileSummary: "Comptable confirmée, habituée aux clôtures mensuelles et aux outils ERP.",
  headline: "Comptable générale",
  highlights: ["Clôtures mensuelles", "ERP Odoo"],
  experiences: ["Comptable — Société Alpha (09/2022 – 04/2025) : clôtures mensuelles ; rapprochements bancaires", "Assistante comptable — Cabinet Bêta (2019 – 2022)"],
  education: ["Licence en comptabilité, Université de Douala (2018)"],
  skills: ["Sage", "Excel avancé", "Odoo"],
  availability: "Disponible sous 4 semaines",
};
const pdfText = (draft: PlacementSummaryDraft) => buildPlacementSummaryPdf(draft, { reference: "3M-2026-00005" }).toString("latin1");

describe("synthèse complète pour les employeurs", () => {
  it("le brouillon complet est conservé, nettoyé des coordonnées, et reste rétro-compatible sans les nouveaux champs", () => {
    const full = normalizePlacementSummaryDraft({ ...edited, experiences: [...edited.experiences, "Contact : aicha@example.test ou +237 677 12 34 56"] }, base);
    expect(full.experiences).toHaveLength(3);
    expect(full.experiences![0]).toContain("09/2022 – 04/2025");
    expect(full.experiences![2]).not.toMatch(/@|677/);
    expect(full.experiences![2]).toContain("[coordonnée masquée]");
    expect(full.education).toEqual(["Licence en comptabilité, Université de Douala (2018)"]);
    expect(full.skills).toEqual(["Sage", "Excel avancé", "Odoo"]);
    expect(full.availability).toBe("Disponible sous 4 semaines");
    expect(full.identity).toBe("Aïcha D.");
    const { experiences, education, skills, availability, ...legacyInput } = edited;
    const legacy = normalizePlacementSummaryDraft(legacyInput, base);
    expect(legacy).not.toHaveProperty("experiences");
    expect(legacy).not.toHaveProperty("availability");
    expect(fingerprintPlacementSummary(legacy)).toBe(fingerprintPlacementSummary(normalizePlacementSummaryDraft(legacyInput, base)));
    expect(fingerprintPlacementSummary(full)).not.toBe(fingerprintPlacementSummary(legacy));
  });

  it("les limites sont tenues : 6 postes, 4 diplômes, 12 compétences ; au-delà, le brouillon est refusé", () => {
    expect(() => normalizePlacementSummaryDraft({ ...edited, experiences: Array.from({ length: 7 }, (_, index) => `Poste ${index}`) }, base)).toThrow();
    expect(() => normalizePlacementSummaryDraft({ ...edited, education: Array.from({ length: 5 }, (_, index) => `Diplôme ${index}`) }, base)).toThrow();
    expect(() => normalizePlacementSummaryDraft({ ...edited, skills: Array.from({ length: 13 }, (_, index) => `Compétence ${index}`) }, base)).toThrow();
    expect(normalizePlacementSummaryDraft({ ...edited, experiences: [""], skills: [" "] }, base)).not.toHaveProperty("experiences");
  });

  it("le CV alimente la synthèse sans rien inventer : postes avec réalisations, formation, compétences", () => {
    const cv = {
      headline: "Comptable générale", summary: "Comptable confirmée avec cinq ans d'expérience.",
      experiences: [
        { role: "Comptable", employer: "Société Alpha", location: null, start: "09/2022", end: "04/2025", bullets: ["Clôtures mensuelles", "Rapprochements bancaires", "Troisième réalisation ignorée"] },
        { role: "", employer: "", location: null, start: null, end: null, bullets: [] },
      ],
      education: [{ degree: "Licence en comptabilité", institution: "Université de Douala", year: "2018" }],
      skills: ["Sage", "Excel avancé"],
      languages: [{ language: "Français", level: "natif" }],
    } as unknown as CvDraft;
    const fields = summaryFieldsFromCvDraft(cv);
    expect(fields.experiences).toEqual(["Comptable — Société Alpha (09/2022 – 04/2025) : Clôtures mensuelles ; Rapprochements bancaires"]);
    expect(fields.education).toEqual(["Licence en comptabilité, Université de Douala (2018)"]);
    expect(fields.skills).toEqual(["Sage", "Excel avancé"]);
    expect(fields.highlights?.length).toBeGreaterThan(0);
    const empty = summaryFieldsFromCvDraft({ ...cv, experiences: [], education: [], skills: [] } as unknown as CvDraft);
    expect(empty.experiences).toBeUndefined();
    expect(empty.education).toBeUndefined();
    expect(empty.skills).toBeUndefined();
  });

  it("le PDF contient les sections de la synthèse complète et un bandeau « dossier complet » calculé depuis les pièces réelles", () => {
    const complete = pdfText(normalizePlacementSummaryDraft(edited, base));
    expect(complete.startsWith("%PDF")).toBe(true);
    for (const text of ["PARCOURS PROFESSIONNEL", "FORMATION", "COMP", "DISPONIBILIT", "Dossier complet", "Soci"]) expect(complete, text).toContain(text);
    const partial = pdfText(normalizePlacementSummaryDraft(edited, { ...base, documents: [{ type: "CV", status: "Validé" }, { type: "Passeport", status: "En vérification" }] }));
    expect(partial).toContain("Dossier en cours");
    expect(partial).not.toContain("Dossier complet");
    const none = pdfText(normalizePlacementSummaryDraft(edited, { ...base, documents: [] }));
    expect(none).toContain("en cours de collecte");
    const minimal = pdfText(normalizePlacementSummaryDraft({ destination: "Canada", procedure: "Travail", sector: "TI", experience: "2 ans", languages: "Français", profileSummary: "Développeur web, deux ans d'expérience." }, base));
    expect(minimal).not.toContain("PARCOURS PROFESSIONNEL");
    expect(minimal).not.toContain("DISPONIBILIT");
  });

  it("l'identité reste « prénom + initiale » et aucune coordonnée du candidat n'apparaît dans le PDF", () => {
    const text = pdfText(normalizePlacementSummaryDraft({ ...edited, experiences: ["Comptable — Alpha ; joignable au +237 677 12 34 56 ou aicha.diallo@example.test"] }, base));
    expect(text).not.toContain("aicha.diallo");
    expect(text).not.toContain("677 12 34");
    expect(text).toContain("3M TRAVEL AGENCY uniquement");
  });

  it("le routeur accepte un brouillon complet (limite relevée) et la carte admin propose les nouveaux champs", () => {
    const router = read("server/routers/placementPortal.ts");
    expect(router.split("max(16000)").length - 1).toBe(2);
    expect(router).not.toContain("max(6000)");
    const card = read("client/src/components/AdminCandidateSummaryCard.tsx");
    for (const id of ["summary-experiences", "summary-education", "summary-skills", "summary-availability"]) expect(card).toContain(`data-testid="${id}"`);
    expect(card).toContain("...(highlightLines(fields.experiences).length ? { experiences: highlightLines(fields.experiences).slice(0, 6) } : {}),");
    expect(card).toContain("skillList(fields.skills).slice(0, 12)");
    expect(card).toContain('experiences: (result.fields.experiences ?? []).join("\\n") || current.experiences,');
  });
});
