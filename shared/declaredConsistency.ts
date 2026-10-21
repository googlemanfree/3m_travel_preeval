import { resolveEvaluationProjectKind } from "./evaluationVisaCv";

const fold = (value: string | null | undefined) => (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export type DeclaredProject = { destinationCountry?: string | null; projectType?: string | null; visaType?: string | null; programLabel?: string | null };
export type ChosenProcedure = { destination?: string | null; visaType?: string | null };

/**
 * Écarts entre l'évaluation du candidat (pays, type de projet) et la procédure choisie à l'activation. Jamais bloquant : un conseiller
 * peut avoir de bonnes raisons de changer, mais l'écart est dit à l'écran, tracé dans l'historique et visible dans le suivi.
 */
export function declaredProjectWarnings(declared: DeclaredProject | null | undefined, chosen: ChosenProcedure): string[] {
  if (!declared) return [];
  const warnings: string[] = [];
  const declaredCountry = fold(declared.destinationCountry);
  const chosenCountry = fold(chosen.destination);
  if (declaredCountry && chosenCountry && declaredCountry !== chosenCountry && !chosenCountry.includes(declaredCountry) && !declaredCountry.includes(chosenCountry)) {
    warnings.push(`Destination déclarée par le candidat : ${declared.destinationCountry} — procédure ouverte : ${chosen.destination}.`);
  }
  const declaredKind = resolveEvaluationProjectKind(declared.projectType, declared.visaType);
  const chosenKind = resolveEvaluationProjectKind(chosen.visaType);
  if (declaredKind !== "autre" && chosenKind !== "autre" && declaredKind !== chosenKind) {
    warnings.push(`Projet déclaré par le candidat : ${declared.programLabel || declared.projectType || declared.visaType} — procédure ouverte : ${chosen.visaType}.`);
  }
  return warnings;
}
