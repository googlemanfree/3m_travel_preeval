/**
 * Documents imprimables des outils publics (liste de pièces, orientation, budget, guides) : même papier à en-tête que les bilans et les
 * e-mails, imprimable ou enregistrable en PDF depuis le navigateur. Module pur : texte échappé, aucun script, aucune donnée envoyée au serveur.
 */
import { escapeBrandHtml, renderBrandedEmailHtml } from "./brandLetterhead";
import { makePrintableDocument } from "./bilanPrint";

export type PrintSection = {
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  checks?: Array<{ label: string; done: boolean }>;
  /** Tableau à deux colonnes (libellé, valeur) : budget, récapitulatif. */
  rows?: Array<{ label: string; value: string; strong?: boolean }>;
};
export type BrandedPrintInput = { title: string; intro?: string; sections: PrintSection[]; note?: string; reference?: string | null };

const P = "margin:0 0 10px;font:14px/1.65 Arial,Helvetica,sans-serif;color:#1f2937";
const H = "margin:20px 0 8px;padding-bottom:5px;border-bottom:2px solid #bbd9ea;font:700 16px/1.3 Arial,Helvetica,sans-serif;color:#17375e";
const L = "margin:0 0 12px;padding-left:22px;font:14px/1.65 Arial,Helvetica,sans-serif;color:#1f2937";

export function printSectionsHtml(sections: PrintSection[]): string {
  return sections.map((section) => {
    const parts: string[] = [];
    if (section.title) parts.push(`<h2 style="${H}">${escapeBrandHtml(section.title)}</h2>`);
    for (const paragraph of section.paragraphs ?? []) parts.push(`<p style="${P}">${escapeBrandHtml(paragraph)}</p>`);
    if (section.bullets?.length) parts.push(`<ul style="${L}">${section.bullets.map((item) => `<li style="margin:0 0 4px">${escapeBrandHtml(item)}</li>`).join("")}</ul>`);
    if (section.steps?.length) parts.push(`<ol style="${L}">${section.steps.map((item) => `<li style="margin:0 0 4px">${escapeBrandHtml(item)}</li>`).join("")}</ol>`);
    if (section.checks?.length) parts.push(`<table style="width:100%;border-collapse:collapse;margin:0 0 12px">${section.checks.map((item) => `<tr><td style="width:26px;padding:5px 6px;border-bottom:1px solid #e2e8f0;font:16px Arial,Helvetica,sans-serif">${item.done ? "☑" : "☐"}</td><td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;font:14px/1.5 Arial,Helvetica,sans-serif;color:#1f2937">${escapeBrandHtml(item.label)}</td></tr>`).join("")}</table>`);
    if (section.rows?.length) parts.push(`<table style="width:100%;border-collapse:collapse;margin:0 0 12px">${section.rows.map((row) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font:${row.strong ? "700 " : ""}14px/1.5 Arial,Helvetica,sans-serif;color:#1f2937">${escapeBrandHtml(row.label)}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font:${row.strong ? "700 " : ""}14px/1.5 Arial,Helvetica,sans-serif;color:#17375e">${escapeBrandHtml(row.value)}</td></tr>`).join("")}</table>`);
    return parts.join("");
  }).join("");
}

/** Document complet prêt à imprimer : papier à en-tête, contenu, mention de prudence, barre « Imprimer ou enregistrer en PDF ». */
export function brandedPrintDocument(input: BrandedPrintInput): string {
  const intro = input.intro ? `<p style="${P}">${escapeBrandHtml(input.intro)}</p>` : "";
  const branded = renderBrandedEmailHtml({
    title: input.title,
    reference: input.reference ?? null,
    bodyHtml: `${intro}${printSectionsHtml(input.sections)}`,
    noteHtml: input.note ? escapeBrandHtml(input.note) : undefined,
  });
  return makePrintableDocument(branded, { title: input.title });
}
