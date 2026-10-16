/**
 * Pré-génère les PDF d’évaluation préliminaire pour TOUTES les destinations
 * du catalogue mondial (hors Canada, déjà en AcroForm statique) sous client/public/forms/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { resolveCountryEvaluationForm } from "../shared/countryEvaluationForms";
import { generateCountryEvaluationFormPdf } from "../server/services/generateCountryEvaluationFormPdf";

const outDir = join(process.cwd(), "client/public/forms");
mkdirSync(outDir, { recursive: true });

const targets = WORLD_COUNTRY_ROWS.filter(([code]) => code !== "CA");

let ok = 0;
let bytesTotal = 0;
const names: string[] = [];

for (const [, name] of targets) {
  const template = resolveCountryEvaluationForm(name);
  if (!template || template.kind !== "generated") continue;
  const pdf = generateCountryEvaluationFormPdf(template);
  const out = join(outDir, template.fileName);
  writeFileSync(out, pdf);
  ok += 1;
  bytesTotal += pdf.length;
  names.push(template.fileName);
}

console.log(JSON.stringify({ generated: ok, totalMB: Number((bytesTotal / 1e6).toFixed(2)), sample: names.slice(0, 8) }, null, 2));
