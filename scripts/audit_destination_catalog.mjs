import { readFile } from "node:fs/promises";
const source = await readFile("client/src/data/procedures107Complete.ts", "utf8");
const entries = [...source.matchAll(/createCountry\(\s*'[^']+'\s*,\s*'([^']+)'/g)].map((match) => match[1]);
const unique = [...new Set(entries)].sort((a, b) => a.localeCompare(b, "fr"));
console.log(JSON.stringify({ ficheCount: entries.length, countryCount: unique.length, countries: unique }, null, 2));
