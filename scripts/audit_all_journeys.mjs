import fs from "node:fs";

const source = fs.readFileSync("/home/ubuntu/3m_travel_preeval/client/src/data/procedures107Complete.ts", "utf8");
const lines = source.split("\n");
const records = [];
for (let index = 0; index < lines.length; index += 1) {
  const header = lines[index].match(/^\s*'([^']+)',\s*'([^']+)',\s*'[^']+',\s*'[^']+',\s*'(travail|etudes|visiteur)',/);
  if (!header) continue;
  let end = index + 1;
  while (end < lines.length && !/^\s*\),\s*$/.test(lines[end])) end += 1;
  const block = lines.slice(index, end + 1).join("\n");
  const stepMatch = block.match(/^\s*\['[^']+'(?:,\s*'[^']+')+\],?$/m);
  const documentMatches = [...block.matchAll(/documents:\s*\[([^\]]+)\]/g)];
  records.push({
    id: header[1], country: header[2], visaType: header[3],
    has_steps: Boolean(stepMatch),
    has_documents: documentMatches.length > 0 && documentMatches.some((match) => match[1].split(",").filter((item) => item.trim()).length > 0),
  });
}
const failures = records.filter((item) => !item.has_steps || !item.has_documents);
const report = { total_fiches: records.length, total_pays: new Set(records.map((item) => item.country)).size, failures, passed: failures.length === 0 };
fs.writeFileSync("/home/ubuntu/3m_travel_preeval/docs/journey-audit-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
if (!report.passed || report.total_fiches !== 91 || report.total_pays !== 42) process.exit(1);
