import { jsPDF } from "jspdf";
import { applyLetterhead } from "../../shared/brandLetterhead";
import { loadBrandLogoSync } from "../utils/brandLogo";

/** Nombre d'objets image d'un PDF (texte latin1). */
export const imageCount = (pdf: string): number => (pdf.match(/\/Subtype \/Image/g) ?? []).length;

/**
 * Images que le papier à en-tête ajoute à lui seul (bandeaux et filigrane) sur un document d'une page : un PDF sans portrait doit en
 * contenir exactement ce nombre, un PDF avec portrait une de plus.
 */
export function letterheadImageBaseline(): number {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  applyLetterhead(doc, { logoDataUri: loadBrandLogoSync()?.dataUri });
  return imageCount(Buffer.from(doc.output("arraybuffer")).toString("latin1"));
}
