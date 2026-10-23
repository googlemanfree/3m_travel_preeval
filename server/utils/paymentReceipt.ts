import { jsPDF } from "jspdf";
import { paymentReceiptCopyForVisa } from "../../shared/agreementProtocolCountryTemplates";
import { applyLetterhead, BRAND, letterheadLayout, renderBrandedEmailHtml, serviceFocusLabel, type LetterheadOptions } from "../../shared/brandLetterhead";
import { loadBrandLogo } from "./brandLogo";

const AGENCY = {
  name: BRAND.legalName,
  address: "Yaoundé, Cameroun",
  phone: "+237 698 104 832",
  email: BRAND.email,
  registration: `${BRAND.rc} · NIU : ${BRAND.niu}`,
  logoUrl: BRAND.logoUrl,
};

export interface PaymentReceiptInput {
  dossierNumber: string;
  fullName: string;
  email: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  paymentReference?: string | null;
  validatedBy: string;
  destination?: string | null;
  visaType?: string | null;
  receiptApprovedAt?: Date | null;
  receiptSignatureLabel?: string | null;
  receiptSignatureHash?: string | null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#039;" })[character] ?? character);
}

/**
 * jsPDF/Helvetica can render French non-breaking grouping spaces inconsistently.
 * Normalize them to ordinary spaces so amounts such as 65 000 XAF remain readable.
 */
export function formatPaymentAmount(amount: number, currency: string) {
  const groupedAmount = new Intl.NumberFormat("fr-FR", { useGrouping: true }).format(amount).replace(/[\u00A0\u202F]/g, " ");
  return `${groupedAmount} ${currency}`;
}

export async function buildPaymentReceiptPdf(input: PaymentReceiptInput) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Reçu de confirmation de paiement",
    reference: input.dossierNumber,
    dateLabel: input.paymentDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" }),
    recipient: input.fullName,
    serviceFocus: serviceFocusLabel(input.visaType, input.destination),
  };
  const layout = letterheadLayout(letterhead);
  const margin = layout.marginLeft;
  const contentWidth = layout.contentWidth;
  const formattedAmount = formatPaymentAmount(input.amount, input.currency);
  const paymentDate = input.paymentDate.toLocaleString("fr-FR");
  const ensureRoom = (needed: number, y: number) => {
    if (y + needed <= layout.contentBottom) return y;
    pdf.addPage();
    return layout.nextPageTop;
  };

  let y = layout.firstPageTop + 2;
  pdf.setFillColor(243, 246, 251);
  pdf.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");
  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Dossier", margin + 7, y + 8);
  pdf.text("Client", margin + 7, y + 16);
  pdf.text("Destination / projet", margin + 7, y + 24);
  pdf.setFont("helvetica", "normal");
  pdf.text(input.dossierNumber, margin + 48, y + 8);
  pdf.text(input.fullName, margin + 48, y + 16);
  pdf.text(`${input.destination || "À préciser"} · ${input.visaType || "À préciser"}`, margin + 48, y + 24);
  y += 38;

  pdf.setFillColor(236, 253, 245);
  pdf.setDrawColor(16, 185, 129);
  pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, "FD");
  pdf.setTextColor(6, 95, 70);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(`Paiement confirmé : ${formattedAmount}`, margin + 7, y + 9);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Validé le ${paymentDate} · ${input.paymentMethod}`, margin + 7, y + 17);
  y += 30;

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Objet des frais", margin, y);
  pdf.setFont("helvetica", "normal");
  const receiptCopy = paymentReceiptCopyForVisa(input.visaType);
  y += 7;
  (pdf.splitTextToSize(receiptCopy.objectText, contentWidth) as string[]).forEach((line) => { y = ensureRoom(5, y); pdf.text(line, margin, y); y += 5; });

  y = ensureRoom(18, y + 4);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Information importante", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  y += 6;
  (pdf.splitTextToSize(receiptCopy.importantText, contentWidth) as string[]).forEach((line) => { y = ensureRoom(4.3, y); pdf.text(line, margin, y); y += 4.3; });

  y = ensureRoom(26, y + 5);
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Traçabilité", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(`Référence de paiement : ${input.paymentReference || "Validation manuelle / agence"}`, margin, y + 6);
  pdf.text(`Conseiller validateur : ${input.validatedBy}`, margin, y + 11);
  y += 14;
  if (input.receiptApprovedAt && input.receiptSignatureLabel && input.receiptSignatureHash) {
    y = ensureRoom(20, y + 2);
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(37, 99, 235);
    pdf.roundedRect(margin, y, contentWidth, 17, 3, 3, "FD");
    pdf.setTextColor(30, 64, 175);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text("Reçu validé électroniquement par l’agence", margin + 6, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(`${input.receiptSignatureLabel} · ${input.receiptApprovedAt.toLocaleString("fr-FR")}`, margin + 6, y + 11);
    pdf.text(`Empreinte : ${input.receiptSignatureHash.slice(0, 24)}…`, margin + 6, y + 15);
    y += 19;
  }

  y = ensureRoom(11, y + 2);
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.5);
  pdf.text("Reçu administratif — à conserver avec les échanges et justificatifs du dossier.", margin, y);
  pdf.text("Les décisions d’employeurs, d’agences partenaires et d’autorités restent indépendantes de 3M TRAVEL AGENCY.", margin, y + 4);

  applyLetterhead(pdf, letterhead);
  return Buffer.from(pdf.output("arraybuffer"));
}

export function buildPaymentReceiptEmailHtml(input: PaymentReceiptInput) {
  const formattedAmount = formatPaymentAmount(input.amount, input.currency);
  const paymentDate = input.paymentDate.toLocaleString("fr-FR");
  const copy = paymentReceiptCopyForVisa(input.visaType);
  const approvalHtml = input.receiptApprovedAt && input.receiptSignatureLabel && input.receiptSignatureHash
    ? `<div style="margin:18px 0;padding:14px;border:1px solid #93c5fd;border-radius:10px;background:#eff6ff;color:#1e3a8a"><strong>Reçu validé électroniquement par l’agence</strong><br/><span style="font-size:12px">${escapeHtml(input.receiptSignatureLabel)} · ${escapeHtml(input.receiptApprovedAt.toLocaleString("fr-FR"))}</span><br/><span style="font-size:11px">Empreinte : ${escapeHtml(input.receiptSignatureHash.slice(0, 24))}…</span></div>`
    : "";
  const body = `<p>Bonjour ${escapeHtml(input.fullName)},</p><p>Nous vous confirmons l’enregistrement de votre paiement de <strong>${formattedAmount}</strong> pour le dossier <strong>${escapeHtml(input.dossierNumber)}</strong>.</p><div style="margin:20px 0;padding:16px;border:1px solid #bbf7d0;border-radius:10px;background:#ecfdf5;color:#065f46"><strong>Frais concernés :</strong><br/>${escapeHtml(copy.emailFeesLine)}<br/><span style="font-size:13px">Paiement confirmé le ${paymentDate} · ${escapeHtml(input.paymentMethod)}</span></div><p>Les diligences peuvent aboutir ou ne pas aboutir. Des démarches complémentaires ou une réorientation peuvent être envisagées avec vous jusqu’à l’aboutissement ou la clôture convenue du mandat, selon votre éligibilité et les conditions applicables.</p><p style="padding:14px;background:#fff7ed;border-left:4px solid #d97706;font-size:13px"><strong>Information importante :</strong> ${escapeHtml(copy.emailImportant)}</p><p>Les frais d’ouverture et de traitement sont non remboursables après le début des diligences administratives et de préparation, sauf disposition impérative contraire applicable au dossier. Un protocole d’accord distinct pourra être signé pour lancer la procédure complète selon votre type de visa.</p>${approvalHtml}<p>Votre dossier reste suivi par un conseiller 3M TRAVEL AGENCY. Consultez votre espace candidat pour les prochaines étapes et les documents disponibles.</p>`;
  return renderBrandedEmailHtml({
    title: "Reçu de confirmation de paiement",
    preheader: `Paiement de ${formattedAmount} confirmé pour le dossier ${input.dossierNumber}`,
    reference: input.dossierNumber,
    serviceFocus: serviceFocusLabel(input.visaType, input.destination),
    bodyHtml: body,
    cta: { label: "Accéder à mon espace", url: "https://www.3mtravelagency.com/mon-espace?section=dossier" },
  });
}

export const PAYMENT_RECEIPT_AGENCY = AGENCY;
