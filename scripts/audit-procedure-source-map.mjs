import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = "/home/ubuntu/procedure_portal_verification.json";
const outputPath = resolve(import.meta.dirname, "../research/procedure_source_map_audit_2026-08-27.json");
const source = JSON.parse(readFileSync(sourcePath, "utf8"));
const volatilePattern = /\b(\d+\s*(?:jour|semaine|mois|eur|euro|cad|sek|mur|isk)|frais|salaire|co[uû]t|d[ée]lai|tarif|quota)\b/i;
const officialHostPattern = /(^|\.)(gov|gouv|gc\.ca|go\.kr|go\.jp|europa\.eu|int|admin\.ch|ch|govt\.nz|make-it-in-germany\.com|nyidanmark\.dk|ind\.nl|migrationsverket\.se|island\.is|identita\.gov\.mt|llv\.li|migracija\.lt|enterhungary\.gov\.hu|france-visas\.gouv\.fr|netherlandsworldwide\.nl)$/i;

const entries = source.results.map(({ input, output, error }) => {
  const host = output?.official_url ? new URL(output.official_url).hostname : "";
  const flags = [
    ...(error ? ["erreur_de_collecte"] : []),
    ...(!output?.official_url || output.status !== "verifie" ? ["source_a_verifier"] : []),
    ...(output?.preparation_points && volatilePattern.test(output.preparation_points) ? ["contenu_volatile_a_revoir"] : []),
    ...(host && !officialHostPattern.test(host) ? ["hote_a_valider"] : []),
  ];
  return {
    input,
    procedureId: output?.procedure_id ?? input.split("|")[0],
    officialUrl: output?.official_url ?? "",
    sourceTitle: output?.source_title ?? "",
    status: output?.status ?? "a_verifier",
    preparationPoints: output?.preparation_points ?? "",
    consultedOn: output?.consulted_on ?? "",
    caveat: output?.caveat ?? "",
    flags,
  };
});

const duplicateIds = entries
  .map((entry) => entry.procedureId)
  .filter((id, index, list) => list.indexOf(id) !== index);
const summary = {
  total: entries.length,
  verified: entries.filter((entry) => entry.status === "verifie" && entry.officialUrl).length,
  requiringManualReview: entries.filter((entry) => entry.flags.length > 0).length,
  duplicateIds: [...new Set(duplicateIds)],
};

writeFileSync(outputPath, `${JSON.stringify({ summary, entries }, null, 2)}\n`);
console.log(JSON.stringify(summary));
