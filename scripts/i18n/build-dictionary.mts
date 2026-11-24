/**
 * Assemble le dictionnaire français → anglais du site (client/src/i18n/frToEn.json) à partir des lots de scripts/i18n/batches :
 * NNN.fr.json (chaînes françaises, telles que le site les affiche) et NNN.en.json (traductions, dans le même ordre).
 *
 *   npx tsx scripts/i18n/build-dictionary.mts
 *
 * Refuse un lot dont les deux fichiers n'ont pas la même longueur, une traduction vide, ou deux traductions différentes pour la même chaîne.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(import.meta.dirname, "batches");
const dictionary: Record<string, string> = {};
const names = readdirSync(dir).filter((file) => file.endsWith(".fr.json")).map((file) => file.slice(0, -".fr.json".length)).sort();
let conflicts = 0;
for (const name of names) {
  const fr: string[] = JSON.parse(readFileSync(resolve(dir, `${name}.fr.json`), "utf8"));
  const en: string[] = JSON.parse(readFileSync(resolve(dir, `${name}.en.json`), "utf8"));
  if (fr.length !== en.length) throw new Error(`Lot ${name} : ${fr.length} chaînes françaises pour ${en.length} traductions.`);
  fr.forEach((source, index) => {
    const target = en[index];
    if (!target || !target.trim()) throw new Error(`Lot ${name}, ligne ${index} : traduction vide pour « ${source.slice(0, 60)} ».`);
    if (source in dictionary && dictionary[source] !== target) { conflicts += 1; console.warn(`Doublon différent (lot ${name}) : « ${source.slice(0, 60)} »`); return; }
    dictionary[source] = target;
  });
}
const sorted = Object.fromEntries(Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b, "fr")));
writeFileSync(resolve(import.meta.dirname, "../../client/src/i18n/frToEn.json"), `${JSON.stringify(sorted, null, 0)}\n`);
console.log(`${Object.keys(sorted).length} chaînes, ${names.length} lot(s), ${conflicts} conflit(s).`);
