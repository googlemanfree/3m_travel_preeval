import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { agencyDossierDocuments, agencyDossiers, applications, clientDocuments, paymentAuditLogs, paymentReceiptApprovals } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { AGREEMENT_PROTOCOL_VERSION } from "../../shared/agreementProtocolContent";
import { buildProtocolOneRichText } from "../../shared/agreementProtocolCountryTemplates";
import { sendEmail } from "../_core/email";
import { createAgreementProtocolOnePdf } from "../agreementProtocolPdfService";
import type { getDb } from "../db";
import { buildPaymentReceiptPdf, formatPaymentAmount } from "../utils/paymentReceipt";
import { buildPaymentPackageEmail } from "./paymentPackageEmail";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type PaymentReference = { source: "online" | "agency"; id: number };

export type PaymentPackageResult = { sent: boolean; dossierNumber: string; email: string; alreadySent: boolean };

/** Reprise de l'empreinte de signature du reçu (même contenu que la validation du reçu dans le back-office). */
export function receiptSignatureHash(input: { source: "online" | "agency"; paymentId: number; dossierNumber: string; candidateEmail: string; amount: string; currency: string; approvedByEmail: string; approvedAt: Date }): string {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

type Loaded = {
  email: string;
  fullName: string;
  dossierNumber: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  paymentReference: string | null;
  destination: string | null;
  visaType: string | null;
  whatsapp: string;
  candidateId: number | null;
  applicationId: number | null;
  agencyDossierId: number | null;
  paymentConfirmed: boolean;
};

async function loadDossier(db: Db, reference: PaymentReference): Promise<Loaded> {
  if (reference.source === "agency") {
    const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, reference.id)).limit(1);
    if (!dossier) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier agence introuvable." });
    const [latestAudit] = await db.select().from(paymentAuditLogs).where(and(eq(paymentAuditLogs.paymentId, dossier.id), eq(paymentAuditLogs.candidateEmail, dossier.email))).orderBy(desc(paymentAuditLogs.createdAt)).limit(1);
    const audited = latestAudit?.amount ? Number(String(latestAudit.amount).replace(/[^0-9]/g, "")) : 0;
    return {
      email: dossier.email,
      fullName: dossier.fullName,
      dossierNumber: `3M-AGN-${String(dossier.id).padStart(4, "0")}`,
      amount: audited || 65000,
      currency: "XAF",
      paymentDate: dossier.lastStatusChangeAt ?? dossier.updatedAt ?? dossier.createdAt ?? new Date(),
      paymentMethod: "Paiement en agence / validation administrative",
      paymentReference: null,
      destination: dossier.destination,
      visaType: dossier.visaType,
      whatsapp: dossier.phone || "",
      candidateId: null,
      applicationId: null,
      agencyDossierId: dossier.id,
      paymentConfirmed: dossier.initialPaymentStatus === "paid",
    };
  }
  const [application] = await db.select().from(applications).where(eq(applications.id, reference.id)).limit(1);
  if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier en ligne introuvable." });
  return {
    email: application.email,
    fullName: application.fullName,
    dossierNumber: application.dossierNumber,
    amount: Number(application.paymentConfirmedAmount ?? application.paymentAmount ?? 65000),
    currency: application.paymentCurrency ?? "XAF",
    paymentDate: application.paymentDate ?? application.paymentValidatedAt ?? new Date(),
    paymentMethod: application.paymentMethod || "Validation administrative",
    paymentReference: application.paymentTransactionId,
    destination: application.destination,
    visaType: application.visaType,
    whatsapp: application.whatsappNumber || "",
    candidateId: application.candidateId ?? null,
    applicationId: application.id,
    agencyDossierId: null,
    paymentConfirmed: application.paymentStatus === "SUCCESS",
  };
}

/**
 * Après confirmation du paiement : le reçu (signé par l'administrateur qui agit) et le Protocole d'accord N°01 sont envoyés
 * ENSEMBLE, dans un seul e-mail avec les deux PDF. Un second appel sans `resend` ne renvoie rien (pas de doublon).
 * Ne valide jamais un paiement : il exige un paiement déjà confirmé.
 */
export async function sendReceiptAndProtocol(db: Db, reference: PaymentReference, admin: { email: string }, options: { resend?: boolean } = {}): Promise<PaymentPackageResult> {
  const dossier = await loadDossier(db, reference);
  if (!dossier.paymentConfirmed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le reçu et le protocole ne partent qu’après confirmation du paiement." });
  if (!dossier.email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune adresse e-mail client n’est disponible pour ce dossier." });
  const adminEmail = admin.email || "Administrateur";

  if (!options.resend) {
    const [already] = await db.select({ id: paymentAuditLogs.id }).from(paymentAuditLogs).where(and(eq(paymentAuditLogs.paymentId, reference.id), eq(paymentAuditLogs.candidateEmail, dossier.email), eq(paymentAuditLogs.action, "receipt_protocol_sent"))).limit(1);
    if (already) return { sent: false, alreadySent: true, dossierNumber: dossier.dossierNumber, email: dossier.email };
  }

  // Le reçu est signé par l'administrateur qui envoie (comme la validation du reçu), sans seconde manipulation.
  let [approval] = await db.select().from(paymentReceiptApprovals).where(and(eq(paymentReceiptApprovals.source, reference.source), eq(paymentReceiptApprovals.paymentId, reference.id), eq(paymentReceiptApprovals.candidateEmail, dossier.email))).orderBy(desc(paymentReceiptApprovals.approvedAt)).limit(1);
  if (!approval) {
    const approvedAt = new Date();
    const signatureLabel = `3M Travel & Services · ${adminEmail}`;
    const signatureHash = receiptSignatureHash({ source: reference.source, paymentId: reference.id, dossierNumber: dossier.dossierNumber, candidateEmail: dossier.email, amount: String(dossier.amount), currency: dossier.currency, approvedByEmail: adminEmail, approvedAt });
    await db.insert(paymentReceiptApprovals).values({ source: reference.source, paymentId: reference.id, dossierNumber: dossier.dossierNumber, candidateEmail: dossier.email, amount: `${dossier.amount} ${dossier.currency}`, currency: dossier.currency, approvedByName: adminEmail, approvedByEmail: adminEmail, approvedAt, signatureLabel, signatureHash });
    await db.insert(paymentAuditLogs).values({ adminName: adminEmail, adminEmail, action: "receipt_approved_signed", paymentId: reference.id, candidateEmail: dossier.email, amount: `${dossier.amount} ${dossier.currency}`, details: `Reçu validé et signé électroniquement pour ${dossier.dossierNumber} lors de l’envoi groupé reçu + protocole. Empreinte ${signatureHash}.` });
    [approval] = await db.select().from(paymentReceiptApprovals).where(and(eq(paymentReceiptApprovals.source, reference.source), eq(paymentReceiptApprovals.paymentId, reference.id), eq(paymentReceiptApprovals.candidateEmail, dossier.email))).orderBy(desc(paymentReceiptApprovals.approvedAt)).limit(1);
  }

  const receiptPdf = await buildPaymentReceiptPdf({
    dossierNumber: dossier.dossierNumber,
    fullName: dossier.fullName,
    email: dossier.email,
    amount: dossier.amount,
    currency: dossier.currency,
    paymentDate: dossier.paymentDate,
    paymentMethod: dossier.paymentMethod,
    paymentReference: dossier.paymentReference,
    validatedBy: adminEmail,
    destination: dossier.destination,
    visaType: dossier.visaType,
    receiptApprovedAt: approval?.approvedAt,
    receiptSignatureLabel: approval?.signatureLabel,
    receiptSignatureHash: approval?.signatureHash,
  });

  const protocolVariables = {
    clientNomComplet: dossier.fullName,
    dossierRef: dossier.dossierNumber,
    destinationProjet: dossier.destination || "Non spécifiée",
    clientTelephoneWhatsapp: dossier.whatsapp || undefined,
    clientEmail: dossier.email,
    modePaiement: dossier.paymentMethod || "Validation manuelle par un conseiller",
    dateHeurePaiement: dossier.paymentDate.toLocaleString("fr-FR", { timeZone: "Africa/Douala" }),
    conseillerEmail: adminEmail,
    empreinteSha: crypto.createHash("sha256").update(`${dossier.dossierNumber}|${dossier.email}|${dossier.destination ?? ""}|${Date.now()}`).digest("hex").slice(0, 24),
    clientIpAddress: "Non applicable (envoi initié par l'agence, signature à venir dans l'espace client)",
    dateDuJour: new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" }),
  };
  const protocolPdf = await createAgreementProtocolOnePdf({
    dossierNumber: dossier.dossierNumber,
    fullName: dossier.fullName,
    destination: dossier.destination,
    variables: protocolVariables,
    content: buildProtocolOneRichText(protocolVariables, dossier.destination || ""),
  });

  const receiptFileName = `Recu-paiement-${dossier.dossierNumber}.pdf`;
  const protocolFileName = `Protocole-accord-01-${dossier.dossierNumber}.pdf`;
  const message = buildPaymentPackageEmail({
    fullName: dossier.fullName,
    dossierNumber: dossier.dossierNumber,
    amountLabel: formatPaymentAmount(dossier.amount, dossier.currency),
    siteUrl: process.env.SITE_URL || "https://www.3mtravelagency.com",
    receiptFileName,
    protocolFileName,
  });
  try {
    await sendEmail({
      to: dossier.email,
      subject: message.subject,
      html: message.html,
      attachments: [
        { filename: receiptFileName, content: receiptPdf, contentType: "application/pdf" },
        { filename: protocolFileName, content: protocolPdf.bytes, contentType: "application/pdf" },
      ],
    });
  } catch (error) {
    console.error("[PaymentPackage] Delivery failed", { dossierNumber: dossier.dossierNumber, error });
    await db.insert(paymentAuditLogs).values({ adminName: adminEmail, adminEmail, action: "receipt_failed", paymentId: reference.id, candidateEmail: dossier.email, amount: `${dossier.amount} ${dossier.currency}`, details: `Échec d’envoi groupé reçu + protocole pour ${dossier.dossierNumber}.` });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le reçu et le protocole n’ont pas pu être envoyés. Vérifiez le service e-mail puis relancez l’envoi." });
  }

  // Le protocole est aussi déposé dans l'espace client, pour être relu et signé sans chercher l'e-mail.
  const protocolName = `Protocole d’accord N°01 — ${dossier.dossierNumber}.pdf`;
  if (!options.resend) {
    if (dossier.agencyDossierId) {
      await db.insert(agencyDossierDocuments).values({ dossierId: dossier.agencyDossierId, documentType: "protocole_accord", documentName: protocolName, documentUrl: protocolPdf.url, fileSize: protocolPdf.bytes.length, source: "admin_upload", uploadedBy: adminEmail, verificationStatus: "verified", verificationComment: `PDF du Protocole ${AGREEMENT_PROTOCOL_VERSION} envoyé avec le reçu après validation du paiement.` });
    } else if (dossier.applicationId) {
      await db.insert(clientDocuments).values({ evaluationId: dossier.applicationId, candidateEmail: dossier.email, documentType: "other", documentName: protocolName, documentUrl: protocolPdf.url, fileSize: protocolPdf.bytes.length, source: "manual_admin", uploadedByAdmin: adminEmail, receivedByAdmin: true, status: "verified", verificationStatus: "approved", verifiedByAdmin: adminEmail, verifiedAt: new Date(), adminNotes: `PDF du Protocole ${AGREEMENT_PROTOCOL_VERSION} envoyé avec le reçu après validation du paiement.` });
    }
    if (dossier.candidateId) {
      await db.insert(clientNotifications).values({
        candidateId: dossier.candidateId,
        type: "payment_validated",
        title: "Reçu et protocole d’accord envoyés",
        body: `Votre paiement est confirmé. Le reçu et le Protocole d’accord N°01 du dossier ${dossier.dossierNumber} viennent de vous être envoyés par e-mail. Lisez puis signez le protocole dans l’onglet Signatures.`,
        actionUrl: "/mon-espace?section=signatures",
      });
    }
  }
  await db.insert(paymentAuditLogs).values({ adminName: adminEmail, adminEmail, action: options.resend ? "receipt_protocol_resent" : "receipt_protocol_sent", paymentId: reference.id, candidateEmail: dossier.email, amount: `${dossier.amount} ${dossier.currency}`, details: `Reçu et Protocole N°01 envoyés ensemble pour ${dossier.dossierNumber}.` });
  return { sent: true, alreadySent: false, dossierNumber: dossier.dossierNumber, email: dossier.email };
}
