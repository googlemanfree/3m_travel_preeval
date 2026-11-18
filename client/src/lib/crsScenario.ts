import { buildCrsProfileFromOfficialAnswers, type CrsOfficialAnswers } from "@shared/crsOfficialAnswers";
import { computeCrsScore, type CrsBreakdown } from "@shared/crsScore";
import { resultSections } from "@/lib/crsResultModel";

/**
 * Mode « Comparer deux scénarios » : le scénario A est le profil saisi, le scénario B en est une copie dont on change quelques réponses
 * (par exemple la seule note d'expression orale du TCF Canada). Aucun calcul propre ici : les deux totaux viennent de `computeCrsScore`
 * (la même grille que le résultat principal) ; ce module ne fait que rapprocher les deux ventilations. Ce n'est ni une prévision ni une garantie.
 */
export type ScenarioLine = { label: string; sub?: boolean; a: number; b: number; delta: number };
export type ScenarioSection = { title: string; lines: ScenarioLine[]; subtotalLabel: string; a: number; b: number; delta: number };

export type ScenarioComparison =
  | { ok: true; totalA: number; totalB: number; delta: number; sections: ScenarioSection[]; changedLines: Array<ScenarioLine & { section: string }>; changedFields: string[]; identical: boolean }
  | { ok: false; reason: "a_incomplete" | "b_incomplete"; missing: string[] };

/** Réponses qui diffèrent entre A et B, sous la forme « champ » ou « groupe.compétence » (ex. « firstBands.speaking »). */
export function changedAnswerFields(a: CrsOfficialAnswers, b: CrsOfficialAnswers): string[] {
  const fields: string[] = [];
  for (const key of Object.keys(a) as Array<keyof CrsOfficialAnswers>) {
    const left = a[key];
    const right = b[key];
    if (typeof left === "object" && left !== null && typeof right === "object" && right !== null) {
      for (const ability of Object.keys(left) as Array<keyof typeof left>) if (left[ability] !== right[ability]) fields.push(`${key}.${String(ability)}`);
    } else if (left !== right) fields.push(key);
  }
  return fields;
}

export function compareScenarios(a: CrsOfficialAnswers, b: CrsOfficialAnswers): ScenarioComparison {
  const builtA = buildCrsProfileFromOfficialAnswers(a);
  if (!builtA.complete) return { ok: false, reason: "a_incomplete", missing: builtA.missing };
  const builtB = buildCrsProfileFromOfficialAnswers(b);
  if (!builtB.complete) return { ok: false, reason: "b_incomplete", missing: builtB.missing };

  const breakdownA: CrsBreakdown = computeCrsScore(builtA.profile);
  const breakdownB: CrsBreakdown = computeCrsScore(builtB.profile);
  const sectionsA = resultSections(breakdownA, builtA.withSpouse);
  const sectionsB = resultSections(breakdownB, builtB.withSpouse);

  const sections: ScenarioSection[] = sectionsA.map((sectionA, index) => {
    const sectionB = sectionsB[index];
    const pointsB = new Map(sectionB.lines.map((line) => [line.label, line.points]));
    const lines: ScenarioLine[] = sectionA.lines.map((line) => {
      const b2 = pointsB.get(line.label) ?? 0;
      return { label: line.label, sub: line.sub, a: line.points, b: b2, delta: b2 - line.points };
    });
    // lignes présentes seulement dans B (ex. barème « avec conjoint » dans un seul des deux scénarios)
    for (const line of sectionB.lines) if (!sectionA.lines.some((entry) => entry.label === line.label)) lines.push({ label: line.label, sub: line.sub, a: 0, b: line.points, delta: line.points });
    return { title: sectionA.title, lines, subtotalLabel: sectionA.subtotalLabel, a: sectionA.subtotal, b: sectionB.subtotal, delta: sectionB.subtotal - sectionA.subtotal };
  });

  const changedLines = sections.flatMap((section) => section.lines.filter((line) => line.delta !== 0 && !line.label.startsWith("Sans objet")).map((line) => ({ ...line, section: section.title })));
  const changedFields = changedAnswerFields(a, b);
  return { ok: true, totalA: breakdownA.total, totalB: breakdownB.total, delta: breakdownB.total - breakdownA.total, sections, changedLines, changedFields, identical: changedFields.length === 0 };
}
