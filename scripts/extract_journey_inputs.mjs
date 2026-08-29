import fs from "node:fs";

const source = fs.readFileSync("/home/ubuntu/3m_travel_preeval/client/src/data/procedures107Complete.ts", "utf8");
const inputs = [];
for (const line of source.split("\n")) {
  const match = line.match(/^\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*'[^']+',\s*'(travail|etudes|visiteur)',/);
  if (match) inputs.push({ id: match[1], country: match[2], visaType: match[3] });
}
const unique = new Map(inputs.map((item) => [item.id, item]));
const result = [...unique.values()];
fs.writeFileSync("/home/ubuntu/3m_travel_preeval/docs/journey-audit-inputs.json", JSON.stringify(result, null, 2) + "\n");
console.log(`Extracted ${result.length} journey inputs across ${new Set(result.map((item) => item.country)).size} countries.`);
