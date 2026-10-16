import { describe, expect, it } from "vitest";
import {
  bilanStructuresForKind,
  EVALUATION_KIND_LABELS,
  messageTemplatesForKind,
  resolveBilanProjectKind,
} from "./evaluationBilanTemplates";

describe("évaluation bilan dynamique par type de visa", () => {
  it("résout le kind depuis les codes visa (études / travail / visiteurs)", () => {
    expect(resolveBilanProjectKind("canada_etude")).toBe("etudes");
    expect(resolveBilanProjectKind("schengen_travail")).toBe("travail");
    expect(resolveBilanProjectKind("schengen_tourisme")).toBe("tourisme");
    expect(resolveBilanProjectKind("etudes")).toBe("etudes");
  });

  it("fournit des structures distinctes études vs travail vs visiteurs", () => {
    const etudes = bilanStructuresForKind("etudes");
    const travail = bilanStructuresForKind("travail");
    const tourisme = bilanStructuresForKind("tourisme");

    expect(etudes.standard?.recommendations).toMatch(/diplômes|relevés|cycle/i);
    expect(etudes.standard?.recommendations).not.toMatch(/\bCV\b/);
    expect(travail.standard?.recommendations).toMatch(/CV/i);
    expect(tourisme.standard?.recommendations).toMatch(/statut|motif|attaches/i);
    expect(etudes.standard?.verdict).not.toBe(travail.standard?.verdict);
    expect(EVALUATION_KIND_LABELS.etudes).toMatch(/études/i);
  });

  it("fournit des modèles de message différenciés par kind", () => {
    const etudes = messageTemplatesForKind("etudes");
    const travail = messageTemplatesForKind("travail");
    const tourisme = messageTemplatesForKind("tourisme");

    expect(etudes.standard?.subject).toMatch(/études/i);
    expect(travail.standard?.subject).toMatch(/travail/i);
    expect(tourisme.standard?.subject).toMatch(/visiteurs/i);
    expect(etudes.standard?.message).toMatch(/diplômes|relevés|cycle|académique/i);
    expect(travail.standard?.message).toMatch(/CV|professionnel/i);
    expect(tourisme.standard?.message).toMatch(/statut|motif|séjour/i);
  });
});
