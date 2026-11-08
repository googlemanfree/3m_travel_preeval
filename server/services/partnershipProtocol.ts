import { createHash } from "node:crypto";
import { jsPDF } from "jspdf";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import type { PartnershipApplicationRow } from "../../drizzle/partnershipSchema";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../../shared/brandLetterhead";
import {
  buildPartnershipProtocolText,
  PARTNERSHIP_PROTOCOL_TITLES,
  previewPartnershipVariables,
  type PartnershipProtocolProvider,
  type PartnershipProtocolVariables,
} from "../../shared/partnershipProtocolContent";
import { partnershipReference, type PartnershipKind } from "../../shared/partnershipProgram";
import { loadBrandLogo } from "../utils/brandLogo";

/** Identité de 3M telle que publiée sur le site (mentions légales) : une seule source, jamais recopiée. */
export function partnershipProvider(): PartnershipProtocolProvider {
  const office = COMPANY_PROFILE.offices.cameroon;
  return {
    legalName: COMPANY_PROFILE.legalName,
    commercialName: COMPANY_PROFILE.publicName,
    legalForm: COMPANY_PROFILE.legalForm,
    shareCapital: COMPANY_PROFILE.shareCapital,
    registration: COMPANY_PROFILE.legalIdentifiers.registration,
    registryAuthority: COMPANY_PROFILE.legalIdentifiers.registryAuthority,
    taxpayerId: COMPANY_PROFILE.legalIdentifiers.taxpayerId,
    // « Biyem-Assi, Montée Chapelle Obili, à 10 m de EHS, Yaoundé, Cameroun » : une seule phrase, sans majuscule au milieu.
    addressLine: office.addressLines.map((line, index) => (index === 0 ? line : line.charAt(0).toLowerCase() + line.slice(1))).join(", "),
    representativeName: COMPANY_PROFILE.founder.name,
    representativeTitle: COMPANY_PROFILE.founder.jobTitle,
    email: COMPANY_PROFILE.publicEmail,
  };
}

/** Aperçu public du modèle (parties entre crochets, conditions « fixées à l'émission »). */
export function buildPartnershipProtocolPreview(kind: PartnershipKind): string {
  return buildPartnershipProtocolText(previewPartnershipVariables(kind, partnershipProvider()));
}

/** Variables d'un protocole réel, à partir du dossier et des conditions fixées par l'administration. */
export function partnershipVariablesFromRow(row: PartnershipApplicationRow, issuedAt: Date): PartnershipProtocolVariables {
  const agency = row.kind === "travel_agency";
  return {
    kind: row.kind,
    reference: partnershipReference(row.id, row.createdAt),
    issuedAt,
    provider: partnershipProvider(),
    partner: {
      displayName: agency ? (row.companyName || row.contactName) : row.contactName,
      representativeName: row.contactName,
      representativeRole: agency ? row.representativeRole : null,
      legalRegistration: agency ? row.legalRegistration : null,
      taxId: agency ? row.taxId : null,
      licenceNumber: agency ? row.licenceNumber : null,
      country: row.country,
      city: row.city,
      email: row.email,
      phone: row.phone,
    },
    terms: {
      commissionRateBps: row.commissionRateBps ?? 0,
      termMonths: row.termMonths ?? 0,
      attributionMonths: row.attributionMonths ?? 0,
      paymentDelayDays: row.paymentDelayDays ?? 0,
      territory: row.territory ?? "",
    },
  };
}

/** Empreinte numérique du texte exact émis (SHA-256, hexadécimal) : preuve de ce qui a été signé. */
export function protocolFingerprint(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const safe = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001F]/g, " ").trim();
const LAYOUT = letterheadLayout({ documentKind: "x" });

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5.2): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  for (const line of lines) {
    if (y > LAYOUT.contentBottom) {
      doc.addPage();
      y = LAYOUT.nextPageTop;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

const isHeading = (paragraph: string) => /^(Article\s+\d+|Annexe\s+\d+|Préambule$|Entre les soussignés$)/.test(paragraph.trim()) && !paragraph.includes("\n") && paragraph.trim().length < 120;

export type PartnershipSignatureBlock = { name: string; signedAt: Date; ipAddress?: string | null; pngBytes?: Buffer | null };

export async function createPartnershipProtocolPdf(input: {
  kind: PartnershipKind;
  reference: string;
  partnerName: string;
  protocolText: string;
  fingerprint: string;
  partnerSignature?: PartnershipSignatureBlock | null;
  countersignature?: { name: string; signedAt: Date } | null;
}): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadBrandLogo();
  // Titre court : il partage la ligne d'en-tête avec la référence (les titres complets sont dans PARTNERSHIP_PROTOCOL_TITLES).
  const status = input.countersignature ? " — signé" : input.partnerSignature ? " — signé partenaire" : "";
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: `Protocole de partenariat${status}`,
    reference: safe(input.reference),
    recipient: safe(input.partnerName),
  };
  const layout = letterheadLayout(letterhead);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = layout.firstPageTop + 2;

  for (const paragraph of input.protocolText.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean)) {
    if (isHeading(paragraph)) {
      if (y > layout.contentBottom - 20) {
        doc.addPage();
        y = layout.nextPageTop;
      }
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 36, 96);
      y = writeParagraph(doc, safe(paragraph), 18, y, 174) + 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
    } else {
      // Chaque sous-clause (6.1, 13.2…) ou ligne de tableau est un paragraphe : un léger espace les sépare.
      const lines = paragraph.split("\n").map(safe).filter(Boolean);
      lines.forEach((line, index) => {
        y = writeParagraph(doc, line, 18, y, 174) + (index === lines.length - 1 ? 2.5 : 1.2);
      });
    }
  }

  // Bloc de signatures : 3M à gauche, le partenaire à droite. Toujours sur une même page.
  if (y > layout.contentBottom - 70) {
    doc.addPage();
    y = layout.nextPageTop;
  }
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y, 192, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 36, 96);
  doc.text("Signatures des Parties", 18, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Lu et approuvé. Le protocole produit ses effets à la contresignature de 3M.", 18, y + 2);
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 36, 96);
  doc.text("Pour 3M", 18, y);
  doc.text("Le Partenaire", 108, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  const provider = partnershipProvider();
  doc.text(doc.splitTextToSize(`${provider.legalName} — ${provider.representativeName}, ${provider.representativeTitle}`, 80) as string[], 18, y);
  doc.text(doc.splitTextToSize(safe(input.partnerName), 80) as string[], 108, y);
  y += 12;

  const top = y;
  if (input.countersignature) {
    doc.text(`Contresigné le ${input.countersignature.signedAt.toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}`, 18, y);
    doc.text(`par ${safe(input.countersignature.name)}`, 18, y + 5);
  } else {
    doc.setTextColor(120, 130, 145);
    doc.text("En attente de contresignature de 3M", 18, y);
    doc.setTextColor(31, 41, 55);
  }
  if (input.partnerSignature) {
    const sig = input.partnerSignature;
    doc.text(`Signé électroniquement le ${sig.signedAt.toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}`, 108, y);
    doc.text(`Signataire : ${safe(sig.name)}`, 108, y + 5);
    if (sig.ipAddress) doc.text(`Adresse IP : ${safe(sig.ipAddress)}`, 108, y + 10);
    if (sig.pngBytes && sig.pngBytes.length > 0) {
      try {
        doc.addImage(`data:image/png;base64,${sig.pngBytes.toString("base64")}`, "PNG", 108, y + 13, 60, 22);
      } catch {
        doc.text("Signature manuscrite enregistrée (aperçu image indisponible).", 108, y + 15);
      }
    }
  } else {
    doc.setTextColor(120, 130, 145);
    doc.text("Non signé", 108, y);
    doc.setTextColor(31, 41, 55);
  }
  y = top + 40;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  y = writeParagraph(
    doc,
    `Empreinte numérique SHA-256 du texte émis : ${input.fingerprint}. Toute modification du texte change cette empreinte. La signature électronique est apposée dans l’espace sécurisé de 3M, par un lien personnel de durée limitée.`,
    18,
    y,
    174,
    4,
  );

  applyLetterhead(doc, letterhead);
  return Buffer.from(doc.output("arraybuffer"));
}
