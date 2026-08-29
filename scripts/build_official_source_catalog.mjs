import fs from "node:fs";

const inputPath = "/home/ubuntu/research_official_visa_sources.json";
const outputPath = "/home/ubuntu/3m_travel_preeval/shared/officialSourceCatalog.ts";
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const results = payload.results.map(({ output }) => {
  const sources = String(output.official_sources || "").split("\\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(/(https?:\/\/\S+)/);
    return match ? { label: line.slice(0, match.index).replace(/\\s+—\\s*$/, "").trim(), url: match[1] } : null;
  }).filter(Boolean);
  return { country: output.country, key: normalize(output.country), verificationStatus: output.verification_status, sources };
});

const source = `export type OfficialSource = { label: string; url: string };\nexport type OfficialSourceRecord = { country: string; verificationStatus: "verified" | "partial" | "unverified"; sources: OfficialSource[] };\n\nexport const OFFICIAL_SOURCE_CATALOG: Record<string, OfficialSourceRecord> = ${JSON.stringify(Object.fromEntries(results.map(({ key, ...record }) => [key, record])), null, 2)};\n`;
fs.writeFileSync(outputPath, source);
console.log(`Generated ${results.length} country source records at ${outputPath}`);
