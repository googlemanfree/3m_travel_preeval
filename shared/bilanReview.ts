/**
 * Relecture automatique d'un bilan avant validation : attrape les restes d'un autre dossier (nom, pays, montant), un total qui ne
 * correspond pas aux critères et l'ancienne marque. Une ERREUR bloque la validation ; un AVERTISSEMENT est signalé à l'administrateur.
 * Module pur : même code dans l'éditeur (en direct) et sur le serveur (garde finale).
 */
import { bilanPlainText } from "./bilanContent";

export type ReviewLevel = "error" | "warning";
export type ReviewIssue = { level: ReviewLevel; code: string; message: string };
export type ReviewContext = { fullName: string; destinations?: Array<string | null | undefined>; expectedAmount?: number | null };

const fold = (value: string | null | undefined) => String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokensOf = (value: string) => fold(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
const decode = (value: string) => value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

type ScoreRow = { label: string; score: number; max: number };

/** Lignes « libellé | n / m » des tableaux de scores (une liste par tableau). */
function scoreTables(html: string): Array<{ rows: ScoreRow[]; plain: Array<{ label: string; value: string }> }> {
  const tables: Array<{ rows: ScoreRow[]; plain: Array<{ label: string; value: string }> }> = [];
  for (const table of html.match(/<table\b[\s\S]*?<\/table>/g) ?? []) {
    const rows: ScoreRow[] = [];
    const plain: Array<{ label: string; value: string }> = [];
    for (const row of table.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
      const cells = Array.from(row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g), (match) => decode(match[1]));
      if (cells.length !== 2) continue;
      plain.push({ label: cells[0], value: cells[1] });
      const fraction = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(cells[1]);
      if (fraction) rows.push({ label: cells[0], score: Number(fraction[1]), max: Number(fraction[2]) });
    }
    if (plain.length) tables.push({ rows, plain });
  }
  return tables;
}

const TOTAL_LABEL = /^(?:note globale|total|score global)\b/i;
const SALUTATION = /\b(?:Cher|Chère|Chers|Chères|Dear)\s+(?:(?:Monsieur|Madame|Mademoiselle|Mme|Mr|Mrs|Ms|M\.)\s+)?(?!(?:Monsieur|Madame|Mademoiselle|Mme|Mr|Mrs|Ms)\b)([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){0,3})/g;
const OLD_BRAND = /3M\s+TRAVEL\s*(?:&|ET|AND)\s*SERVICES/i;

export function reviewBilan(html: string, context: ReviewContext): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const text = bilanPlainText(html);
  if (text.trim().length < 20) return issues;
  const own = new Set(tokensOf(context.fullName));

  // 1. Nom : le bilan doit s'adresser au candidat du dossier.
  for (const match of Array.from(text.matchAll(SALUTATION))) {
    const addressed = tokensOf(match[1]);
    if (addressed.length && own.size && !addressed.some((token) => own.has(token))) {
      issues.push({ level: "error", code: "name_mismatch", message: `Le bilan s'adresse à « ${match[1].trim()} » alors que le dossier est celui de « ${context.fullName} » : reste d'un autre dossier ?` });
      break;
    }
  }
  if (text.length > 300 && own.size && !Array.from(own).some((token) => token.length >= 3 && fold(text).includes(token)) && !SALUTATION.test(text)) {
    issues.push({ level: "warning", code: "name_absent", message: "Le nom du candidat n'apparaît nulle part dans le bilan." });
  }
  SALUTATION.lastIndex = 0;

  // 2. Scores : chaque note ≤ son maximum, la note globale = somme des critères, le score affiché = la note globale.
  const tables = scoreTables(html);
  let headline: ScoreRow | null = null;
  let total: ScoreRow | null = null;
  for (const table of tables) {
    const totalRow = table.rows.find((row) => TOTAL_LABEL.test(row.label));
    const others = table.rows.filter((row) => row !== totalRow);
    for (const row of others) if (row.score > row.max) issues.push({ level: "error", code: "score_over_max", message: `« ${row.label} » : ${row.score} dépasse le maximum de ${row.max}.` });
    if (totalRow && others.length >= 2) {
      total = totalRow;
      const sum = others.reduce((acc, row) => acc + row.score, 0);
      const sumMax = others.reduce((acc, row) => acc + row.max, 0);
      if (sum !== totalRow.score || sumMax !== totalRow.max) issues.push({ level: "error", code: "score_total", message: `La note globale (${totalRow.score} / ${totalRow.max}) ne correspond pas à la somme des critères (${sum} / ${sumMax}).` });
    }
    const score = table.rows.find((row) => /^votre score$/i.test(row.label));
    if (score) headline = score;
  }
  if (headline && total && headline.score !== total.score) issues.push({ level: "error", code: "score_headline", message: `« Votre score » (${headline.score}) diffère de la note globale (${total.score}).` });

  // 3. Orientation et montant du dossier.
  const wanted = (context.destinations ?? []).map((value) => fold(value)).filter(Boolean);
  for (const table of tables) {
    const orientation = table.plain.find((row) => /^orientation principale$/i.test(row.label));
    if (orientation && wanted.length && !wanted.some((destination) => fold(orientation.value).includes(destination) || destination.includes(fold(orientation.value)))) {
      issues.push({ level: "warning", code: "destination_mismatch", message: `Orientation principale « ${orientation.value} » : le dossier vise « ${(context.destinations ?? []).filter(Boolean).join(", ")} ».` });
    }
    const amount = table.plain.find((row) => /^montant$/i.test(row.label));
    const typed = amount ? Number(amount.value.replace(/[^\d]/g, "")) : NaN;
    if (amount && Number.isFinite(typed) && typed > 0 && context.expectedAmount && typed !== context.expectedAmount) {
      issues.push({ level: "warning", code: "amount_mismatch", message: `Montant du bilan (${typed}) différent du montant du dossier (${context.expectedAmount}).` });
    }
  }

  // 4. Ancienne marque et restes de rédaction.
  if (OLD_BRAND.test(text)) issues.push({ level: "warning", code: "old_brand", message: "L'ancien nom « 3M TRAVEL & SERVICES » figure encore dans le texte : la marque est « 3M TRAVEL AGENCY »." });
  if (/\b(?:lorem ipsum|todo|a completer|à compléter)\b/i.test(text)) issues.push({ level: "warning", code: "draft_marker", message: "Un marqueur de brouillon (« à compléter », « todo ») figure encore dans le texte." });
  return issues;
}
