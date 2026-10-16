import { describe, expect, it } from "vitest";
import {
  evaluationRequiresCv,
  isNonWorkEvaluationVisa,
  isWorkEvaluationVisa,
  resolveEvaluationProjectKind,
} from "./evaluationVisaCv";

describe("evaluationVisaCv", () => {
  it("détecte les visas travail", () => {
    expect(isWorkEvaluationVisa("travail")).toBe(true);
    expect(isWorkEvaluationVisa("canada_travail")).toBe(true);
    expect(isWorkEvaluationVisa("Visa travail qualifié")).toBe(true);
    expect(isWorkEvaluationVisa("work permit")).toBe(true);
  });

  it("détecte les visas non travail", () => {
    expect(isNonWorkEvaluationVisa("etudes")).toBe(true);
    expect(isNonWorkEvaluationVisa("tourisme")).toBe(true);
    expect(isNonWorkEvaluationVisa("visiteur")).toBe(true);
    expect(isNonWorkEvaluationVisa("famille")).toBe(true);
  });

  it("exige le CV uniquement pour le travail", () => {
    expect(evaluationRequiresCv("travail")).toBe(true);
    expect(evaluationRequiresCv("etudes")).toBe(false);
    expect(evaluationRequiresCv("tourisme")).toBe(false);
    expect(evaluationRequiresCv(null, "travail")).toBe(true);
    expect(evaluationRequiresCv(null, "etudes")).toBe(false);
    expect(evaluationRequiresCv(null, null)).toBe(false);
  });

  it("normalise le type de projet pour bilans et pilotage", () => {
    expect(resolveEvaluationProjectKind("etudes")).toBe("etudes");
    expect(resolveEvaluationProjectKind(null, "Visa études")).toBe("etudes");
    expect(resolveEvaluationProjectKind("tourisme")).toBe("tourisme");
    expect(resolveEvaluationProjectKind("travail")).toBe("travail");
    expect(resolveEvaluationProjectKind("schengen_travail")).toBe("travail");
    expect(resolveEvaluationProjectKind("schengen_tourisme")).toBe("tourisme");
    expect(resolveEvaluationProjectKind("")).toBe("autre");
  });
});
