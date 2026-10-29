/**
 * Bilan imprimable et téléchargeable : le document à l'identité de l'agence (papier à en-tête) est repris tel quel, puis habillé pour la
 * page A4 (marges, couleurs conservées à l'impression, titres et tableaux jamais coupés) avec une barre « Imprimer / Enregistrer en PDF ».
 * Module pur : le même code sert l'espace candidat, l'administration et les tests.
 */

const bodyOf = (html: string): string => /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PRINT_CSS = `
@page { size: A4; margin: 12mm 12mm 14mm; }
html { background: #e5e7eb; }
body { margin: 0; }
.bilan-bar { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; padding: 10px 12px; background: #17375e; font: 14px Arial, Helvetica, sans-serif; color: #fff; }
.bilan-bar button { min-height: 40px; padding: 0 16px; border: 0; border-radius: 20px; background: #fff; color: #17375e; font: 700 14px Arial, Helvetica, sans-serif; cursor: pointer; }
.bilan-bar span { opacity: .85; }
@media print {
  html, body { background: #fff !important; }
  .bilan-bar { display: none !important; }
  body > table, body > table > tbody > tr > td { padding: 0 !important; background: #fff !important; }
  table[width="640"] { max-width: none !important; width: 100% !important; border-radius: 0 !important; }
  h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
  table, blockquote, li, tr, p { break-inside: avoid; page-break-inside: avoid; }
  a { color: inherit !important; text-decoration: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** Document autonome à ouvrir dans un onglet : imprimable (A4) et enregistrable en PDF par le navigateur. */
export function makePrintableDocument(brandedHtml: string, options: { title: string }): string {
  const title = escapeText(options.title).slice(0, 160);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${PRINT_CSS}</style></head><body>
<div class="bilan-bar"><button type="button" onclick="window.print()">Imprimer ou enregistrer en PDF</button><span>Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » pour télécharger.</span></div>
${bodyOf(brandedHtml)}
<script>if (location.hash === "#print") setTimeout(function () { window.print(); }, 500);</script>
</body></html>`;
}

/** Document Word (.doc) : Word ouvre ce HTML et conserve l'en-tête, les tableaux et les couleurs. */
export function makeWordDocument(brandedHtml: string, options: { title: string }): string {
  const title = escapeText(options.title).slice(0, 160);
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page Section1 { size: 21cm 29.7cm; margin: 1.5cm; } div.Section1 { page: Section1; } body { font-family: Arial, Helvetica, sans-serif; }</style></head><body><div class="Section1">${bodyOf(brandedHtml)}</div></body></html>`;
}

/** Nom de fichier sûr : « Bilan-evaluation-Prenom-Nom ». */
export function bilanFileBase(candidateName: string | null | undefined, reference?: string | null): string {
  const slug = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return ["Bilan-evaluation", slug(String(candidateName ?? "")), slug(String(reference ?? ""))].filter(Boolean).join("-");
}
