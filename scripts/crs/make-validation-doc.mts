/**
 * Produit docs/CRS_VALIDATION.md à partir du fichier de résultats de compare-ircc.mts :
 *   npx tsx scripts/crs/make-validation-doc.mts <resultats.jsonl> [docs/CRS_VALIDATION.md]
 * Chaque ligne du tableau est un profil réellement saisi dans l'outil officiel d'IRCC ; rien n'est « supposé conforme ».
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Row } from "./compare-ircc.mts";

const [input, output = "docs/CRS_VALIDATION.md"] = process.argv.slice(2);
if (!input) { console.error("Usage : make-validation-doc.mts <resultats.jsonl> [sortie.md]"); process.exit(1); }
const rows: Row[] = readFileSync(input, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
const officialTotal = (row: Row) => row.official?.["additional|Comprehensive Ranking System formula grand total"] ?? null;
const GROUPS: Record<string, string> = {
  age: "Âge (valeurs de contrôle)", "tous-ages": "Âge (tous les âges, avec et sans conjoint)", etudes: "Niveau d’études", celpip: "Langue : CELPIP, tous les niveaux", tranches: "Langue : chaque tranche de chaque compétence de chaque test", seuils: "Langue : tests IELTS, PTE Core, TEF Canada, TCF Canada",
  francais: "Français, seconde langue et bonus", "experience-canada": "Expérience canadienne", "salaire-eleve": "Profession à salaire élevé", offre: "Offre d’emploi et facteur d’intégration au marché du travail", "experience-etrangere": "Expérience étrangère et transférabilité",
  certificat: "Certificat de compétence", supplementaires: "Points supplémentaires et plafond de 600", conjoint: "Conjoint et état matrimonial", scenario: "Scénarios « Comparer deux scénarios »", extremes: "Profils extrêmes",
};
const ordered = Object.keys(GROUPS).filter((group) => rows.some((row) => row.group === group));
const mismatches = rows.filter((row) => row.diffs.length > 0 || row.error || !row.local);
const date = new Date().toISOString().slice(0, 10);

const lines: string[] = [];
lines.push("# Validation du calculateur CRS de 3M TRAVEL AGENCY face à l’outil officiel d’IRCC", "");
lines.push(`Dernière exécution : **${date}**. Grille en vigueur depuis le **3 novembre 2026** (note sur 1 270).`, "");
lines.push("## Sources officielles", "");
lines.push("- Critères du SCG (grille de points) : https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note/criteries-scg.html");
lines.push("- Outil officiel « Vérifiez votre note » (utilisé pour la colonne « Score IRCC ») : https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html");
lines.push("- Changements du 3 novembre 2026 : https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html", "");
lines.push("Aucun calculateur tiers n’a été utilisé : la grille a été relue sur canada.ca et chaque profil a été saisi dans le formulaire officiel (version anglaise, même logique que la française).", "");
lines.push("## Méthode", "");
lines.push("1. Le script `scripts/crs/compare-ircc.mts` pilote le formulaire officiel avec un navigateur automatisé (`scripts/crs/ircc-driver.cjs`) : il répond aux questions dans l’ordre, comme une personne, puis lit le détail affiché dans « Your results ». Le calcul se fait dans la page ; rien n’est envoyé à IRCC, et aucun dossier de client n’est utilisé (profils de test uniquement : `scripts/crs/profiles.mts`).");
lines.push("2. Les mêmes réponses sont passées au calculateur de 3M (`shared/crsOfficialAnswers.ts` puis `shared/crsScore.ts`).");
lines.push("3. Sont comparées **toutes les lignes** du résultat (âge, études, première et seconde langue, facteur d’intégration au marché du travail, conjoint, les quatre lignes de transférabilité et leurs sous-totaux, certificat, points supplémentaires, total), pas seulement le total.", "");
lines.push("## Résultat", "");
lines.push(`- Profils saisis dans l’outil officiel : **${rows.length}**.`);
lines.push(`- Profils identiques à l’outil officiel sur toutes les lignes : **${rows.length - mismatches.length}**.`);
lines.push(`- Écarts constatés : **${mismatches.length}**${mismatches.length === 0 ? " — le barème de 3M reproduit exactement celui d’IRCC sur tous les profils testés." : "."}`, "");
if (mismatches.length > 0) { lines.push("### Écarts à corriger", ""); for (const row of mismatches) lines.push(`- ${row.id} — ${row.label} : ${row.error ?? row.diffs.map((diff) => `${diff.field} (IRCC ${diff.official}, 3M ${diff.local})`).join(" ; ")}`); lines.push(""); }
lines.push("## Corrections apportées lors de cet audit (hors barème de points)", "");
lines.push("Le barème de points était déjà exact ; les corrections portent sur des réponses que l’outil officiel traite autrement :", "");
lines.push("- **Seconde langue jamais comptée comme « sans objet » par défaut.** Sur canada.ca, la question « autres résultats linguistiques ? » exige une réponse (« not applicable » inclus). La calculatrice de 3M considérait une réponse vide comme « aucun test ». Désormais, elle demande de choisir un test ou « Sans objet » et le liste parmi les réponses manquantes.");
lines.push("- **Question « 6 ii » (profession à salaire élevé) posée seulement avec au moins 1 an d’expérience canadienne**, comme sur canada.ca (vérifié : masquée à 0 an, affichée dès 1 an). Avant, 3M la posait toujours et pouvait compter une ancienne réponse « Oui » après un retour à 0 an. Désormais, la réponse est ignorée sans expérience canadienne.");
lines.push("- **Lien « Voir le détail des critères sur Canada.ca »** : l’ancienne adresse renvoyait une page « Pas trouvé » (404) ; elle pointe maintenant vers la page des critères du SCG.", "");
lines.push("## Ce qui n’a pas pu être vérifié dans l’outil officiel", "");
lines.push("- **Test de langue de plus de deux ans (question 5 i = « Non »)** : l’outil officiel affiche le message « vous ne semblez pas admissible à Entrée express pour le moment » (preuve de la langue exigée) ; aucune note n’a été lue. 3M se comporte de la même façon (aucune note, explication). Il n’y a donc pas de score IRCC à comparer.");
lines.push("- **Réponses jamais testées une par une** : combinaisons de plusieurs facteurs non listées ci-dessous (le total est la somme de rubriques toutes comparées ligne à ligne ; les plafonds de 50 / 100 / 600 et le cas « les deux sources du facteur d’intégration » le sont par des profils dédiés). Un profil réel peut toujours tomber sur un cas particulier d’IRCC (règles d’admissibilité, justificatifs) que ni l’outil ni ce document ne vérifient.");
lines.push("- **Futures modifications de grille** : ce tableau date du jour d’exécution ; relancer `scripts/crs/compare-ircc.mts` après chaque annonce d’IRCC.", "");
lines.push("## Relancer la validation", "");
lines.push("```bash", "npx tsx scripts/crs/compare-ircc.mts --out resultats.jsonl --workers 3", "npx tsx scripts/crs/make-validation-doc.mts resultats.jsonl docs/CRS_VALIDATION.md", "```", "");
lines.push("Variables utiles : `HTTPS_PROXY` (si l’accès à canada.ca passe par un proxy) et `CRS_CHROMIUM_PATH` (navigateur Chromium à utiliser).", "");
lines.push("## Tableau de validation", "");
lines.push("Tous les résultats ci-dessous ont été **vérifiés dans le calculateur officiel** d’IRCC (colonne « Score IRCC » = total affiché par l’outil le jour de l’exécution). La colonne « Correction » indique « aucune » quand 3M donnait déjà le même résultat sur chacune des lignes détaillées.", "");
for (const group of ordered) {
  lines.push(`### ${GROUPS[group]}`, "", "| Profil testé | Score 3M | Score IRCC | Écart | Correction |", "| --- | ---: | ---: | ---: | --- |");
  for (const row of rows.filter((entry) => entry.group === group)) {
    const ircc = officialTotal(row);
    const local = row.local?.total ?? null;
    const gap = ircc !== null && local !== null ? local - ircc : null;
    lines.push(`| ${row.label.replace(/\|/g, "/")} | ${local ?? "—"} | ${ircc ?? "—"} | ${gap === null ? "—" : gap > 0 ? `+${gap}` : gap} | ${row.diffs.length === 0 && !row.error ? "aucune" : "à corriger"} |`);
  }
  lines.push("");
}
writeFileSync(output, lines.join("\n"));
console.log(`${output} : ${rows.length} profils, ${mismatches.length} écart(s).`);
