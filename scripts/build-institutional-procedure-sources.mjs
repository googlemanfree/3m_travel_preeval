import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "/home/ubuntu/procedure_portal_verification.json";
const outputPath = resolve(import.meta.dirname, "../client/src/data/institutionalProcedureSources.ts");
const collected = JSON.parse(readFileSync(sourcePath, "utf8"));

const volatileOrDecisionPattern = /(?:\b\d+\b|frais|salaire|co[uû]t|d[ée]lai|tarif|quota|admissibilit[ée]|[ée]ligibilit[ée]|in[ée]ligible|eligible|ineligible)/i;
const normalizePoints = (value = "") => value
  .split("|")
  .map((point) => point.trim().replace(/\.$/, ""))
  .filter((point) => point.length >= 12 && !volatileOrDecisionPattern.test(point))
  .slice(0, 3);

const entries = collected.results
  .map(({ output }) => {
    if (!output?.procedure_id || !output?.official_url || output.status !== "verifie") return null;
    return {
      procedureId: output.procedure_id,
      officialUrl: output.official_url,
      sourceTitle: output.source_title,
      consultedOn: output.consulted_on,
      preparationPoints: normalizePoints(output.preparation_points),
      caveat: "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche.",
    };
  })
  .filter(Boolean)
  .sort((left, right) => left.procedureId.localeCompare(right.procedureId, "fr"));

const file = `/**
 * Références institutionnelles collectées le 27 août 2026 pour les fiches publiques.
 * Les points de préparation excluent volontairement les montants, délais et appréciations
 * individuelles : le portail de l'autorité reste la source de référence.
 */

export type InstitutionalProcedureSource = {
  procedureId: string;
  officialUrl: string;
  sourceTitle: string;
  consultedOn: string;
  preparationPoints: string[];
  caveat: string;
};

export const INSTITUTIONAL_PROCEDURE_SOURCES: InstitutionalProcedureSource[] = ${JSON.stringify(entries, null, 2)};

const byProcedureId = new Map(INSTITUTIONAL_PROCEDURE_SOURCES.map((source) => [source.procedureId, source]));

export const getInstitutionalProcedureSource = (procedureId: string) => byProcedureId.get(procedureId);
`;

writeFileSync(outputPath, file);
console.log(`Generated ${entries.length} institutional procedure sources.`);
