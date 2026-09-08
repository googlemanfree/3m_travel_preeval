import { jsPDF } from "jspdf";

const AGENCY = {
  name: "3M Travel & Services SARL",
  address: "Yaoundé, Cameroun",
  phone: "+237 698 104 832",
  email: "hello@3mtravelagency.com",
  registration: "RC/YAO/2019/A/2567 · NIU : M112417203369H",
  logoUrl: "https://www.3mtravelagency.com/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg",
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

async function loadLogoDataUri() {
  try {
    const response = await fetch(AGENCY.logoUrl, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.warn("[Payment Receipt] Logo unavailable; generating text-branded receipt.", error);
    return null;
  }
}

export async function buildPaymentReceiptPdf(input: PaymentReceiptInput) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logoDataUri = await loadLogoDataUri();
  const margin = 18;
  const width = 210;
  const contentWidth = width - margin * 2;
  const formattedAmount = formatPaymentAmount(input.amount, input.currency);
  const paymentDate = input.paymentDate.toLocaleString("fr-FR");

  pdf.setFillColor(7, 27, 61);
  pdf.rect(0, 0, width, 38, "F");
  if (logoDataUri) {
    try {
      pdf.addImage(logoDataUri, "JPEG", margin, 7, 24, 24, undefined, "FAST");
    } catch (error) {
      console.warn("[Payment Receipt] Logo could not be embedded.", error);
    }
  }
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(AGENCY.name, margin + 31, 16);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Mobilité internationale · Accompagnement humain", margin + 31, 23);
  pdf.text(`${AGENCY.address} · ${AGENCY.phone} · ${AGENCY.email}`, margin + 31, 29);

  pdf.setTextColor(7, 27, 61);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text("REÇU DE CONFIRMATION DE PAIEMENT", margin, 54);
  pdf.setDrawColor(201, 151, 43);
  pdf.setLineWidth(1.1);
  pdf.line(margin, 59, width - margin, 59);

  pdf.setFillColor(243, 246, 251);
  pdf.roundedRect(margin, 67, contentWidth, 43, 3, 3, "F");
  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Dossier", margin + 7, 76);
  pdf.text("Client", margin + 7, 86);
  pdf.text("Destination / projet", margin + 7, 96);
  pdf.setFont("helvetica", "normal");
  pdf.text(input.dossierNumber, margin + 48, 76);
  pdf.text(input.fullName, margin + 48, 86);
  pdf.text(`${input.destination || "À préciser"} · ${input.visaType || "À préciser"}`, margin + 48, 96);

  pdf.setFillColor(236, 253, 245);
  pdf.setDrawColor(16, 185, 129);
  pdf.roundedRect(margin, 119, contentWidth, 25, 3, 3, "FD");
  pdf.setTextColor(6, 95, 70);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(`Paiement confirmé : ${formattedAmount}`, margin + 7, 130);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`Validé le ${paymentDate} · ${input.paymentMethod}`, margin + 7, 138);

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Objet des frais", margin, 160);
  pdf.setFont("helvetica", "normal");
  const objectText = "Les frais confirmés couvrent l’ouverture du dossier, le traitement administratif et la préparation/soumission du profil auprès d’agences de placement partenaires pour la recherche d’un contrat de travail, selon le projet et l’éligibilité du candidat. Ces frais sont non remboursables une fois le traitement administratif engagé, car ils rémunèrent les diligences déjà réalisées avant la soumission.";
  let y = 168;
  pdf.splitTextToSize(objectText, contentWidth).forEach((line) => { pdf.text(line, margin, y); y += 5; });

  pdf.setFont("helvetica", "bold");
  pdf.text("Information importante", margin, y + 8);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const importantText = "La recherche peut aboutir ou non. Les frais d’ouverture et de traitement sont non remboursables après le début des diligences, sauf disposition impérative contraire applicable au dossier. Ce reçu ne garantit ni emploi, ni contrat de travail, ni visa, ni résultat. Après obtention d’un contrat de travail ou d’une lettre d’invitation et validation du projet, un protocole d’accord distinct devra être signé pour lancer la procédure complète de visa. Toute prestation ou tout frais supplémentaire fera l’objet d’un accord distinct.";
  y += 14;
  pdf.splitTextToSize(importantText, contentWidth).forEach((line) => { pdf.text(line, margin, y); y += 4.3; });

  const traceY = 235;
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Traçabilité", margin, traceY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(`Référence de paiement : ${input.paymentReference || "Validation manuelle / agence"}`, margin, traceY + 9);
  pdf.text(`Conseiller validateur : ${input.validatedBy}`, margin, traceY + 14);
  if (input.receiptApprovedAt && input.receiptSignatureLabel && input.receiptSignatureHash) {
    const signatureY = traceY + 21;
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(37, 99, 235);
    pdf.roundedRect(margin, signatureY, contentWidth, 18, 3, 3, "FD");
    pdf.setTextColor(30, 64, 175);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text("Reçu validé électroniquement par l’agence", margin + 6, signatureY + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(`${input.receiptSignatureLabel} · ${input.receiptApprovedAt.toLocaleString("fr-FR")}`, margin + 6, signatureY + 12);
    pdf.text(`Empreinte : ${input.receiptSignatureHash.slice(0, 24)}…`, margin + 6, signatureY + 16);
  }

  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(8);
  pdf.text(AGENCY.registration, margin, 282);
  pdf.text("Reçu administratif — à conserver avec les échanges et justificatifs du dossier.", margin, 287);
  pdf.text("Les décisions d’employeurs, d’agences partenaires et d’autorités restent indépendantes de 3M Travel & Services.", margin, 292);

  return Buffer.from(pdf.output("arraybuffer"));
}

export function buildPaymentReceiptEmailHtml(input: PaymentReceiptInput) {
  const formattedAmount = formatPaymentAmount(input.amount, input.currency);
  const paymentDate = input.paymentDate.toLocaleString("fr-FR");
  const approvalHtml = input.receiptApprovedAt && input.receiptSignatureLabel && input.receiptSignatureHash
    ? `<div style="margin:18px 0;padding:14px;border:1px solid #93c5fd;border-radius:10px;background:#eff6ff;color:#1e3a8a"><strong>Reçu validé électroniquement par l’agence</strong><br/><span style="font-size:12px">${escapeHtml(input.receiptSignatureLabel)} · ${escapeHtml(input.receiptApprovedAt.toLocaleString("fr-FR"))}</span><br/><span style="font-size:11px">Empreinte : ${escapeHtml(input.receiptSignatureHash.slice(0, 24))}…</span></div>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#1e293b"><div style="max-width:680px;margin:24px auto;background:#fff;border:1px solid #dbe5f1;border-radius:16px;overflow:hidden"><div style="background:#071b3d;padding:24px 28px;color:#fff"><div style="font-size:22px;font-weight:700">${escapeHtml(AGENCY.name)}</div><div style="margin-top:6px;color:#dbeafe;font-size:13px">Mobilité internationale · Accompagnement humain</div></div><div style="padding:28px"><h1 style="margin:0;color:#071b3d;font-size:22px">Reçu de confirmation de paiement</h1><p>Bonjour ${escapeHtml(input.fullName)},</p><p>Nous vous confirmons l’enregistrement de votre paiement de <strong>${formattedAmount}</strong> pour le dossier <strong>${escapeHtml(input.dossierNumber)}</strong>.</p><div style="margin:20px 0;padding:16px;border:1px solid #bbf7d0;border-radius:10px;background:#ecfdf5;color:#065f46"><strong>Frais concernés :</strong><br/>Ouverture du dossier, traitement administratif et préparation/soumission de votre profil auprès d’agences de placement partenaires pour la recherche d’un contrat de travail.<br/><span style="font-size:13px">Paiement confirmé le ${paymentDate} · ${escapeHtml(input.paymentMethod)}</span></div><p>La recherche peut aboutir ou ne pas aboutir. Si une première soumission n’aboutit pas, des soumissions complémentaires ou une réorientation peuvent être envisagées avec vous jusqu’à l’aboutissement ou la clôture convenue du mandat, selon votre éligibilité, les postes disponibles et les conditions applicables.</p><p style="padding:14px;background:#fff7ed;border-left:4px solid #d97706;font-size:13px"><strong>Information importante :</strong> ce reçu ne constitue pas une garantie d’emploi, de contrat de travail, de visa ou de résultat. Toute prestation ou tout frais supplémentaire doit faire l’objet d’un accord distinct et explicite.</p>  <p>Les frais d’ouverture et de traitement sont non remboursables après le début des diligences administratives et de préparation, sauf disposition impérative contraire applicable au dossier. Après obtention d’un contrat de travail ou d’une lettre d’invitation et validation du projet, un protocole d’accord distinct devra être signé pour lancer la procédure complète de visa.</p>${approvalHtml}<p>Votre dossier reste suivi par un conseiller 3M Travel &amp; Services. Consultez votre espace candidat pour les prochaines étapes et les documents disponibles.</p><p><a href="https://www.3mtravelagency.com/mon-espace?section=dossier" style="display:inline-block;background:#123a7a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Accéder à mon espace</a></p><hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0"/><p style="font-size:12px;color:#64748b">${AGENCY.address} · ${AGENCY.phone} · ${AGENCY.email}<br/>${AGENCY.registration}</p></div></div></body></html>`;
}

export const PAYMENT_RECEIPT_AGENCY = AGENCY;
