import { TRPCError } from "@trpc/server";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { agencyDossierDocuments, clientDocuments, paymentAuditLogs } from "../../drizzle/schema";
import { buildProtocolOneRichText } from "../../shared/agreementProtocolCountryTemplates";
import { createAgreementProtocolOnePdf } from "../agreementProtocolPdfService";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  amountChangeError,
  clearProtocolDraft,
  clearReceiptDraft,
  readProtocolDraft,
  readReceiptDraft,
  saveProtocolDraft,
  saveReceiptDraft,
  validateProtocolContent,
  validateReceiptDraft,
  applyReceiptDraft,
  type ReceiptDraftInput,
} from "../services/documentDrafts";
import { buildProtocolVariables, loadDossier, type PaymentReference } from "../services/paymentPackage";
import { buildPaymentReceiptPdf } from "../utils/paymentReceipt";
import { parseAdminCandidateReference, requireAdminTreatmentSession } from "./adminCandidateManagement";

/**
 * Éditeurs du reçu et du Protocole d'accord N°01 : le contenu par défaut est proposé, l'administrateur le modifie à tout moment,
 * visualise le PDF puis envoie (l'envoi lui-même reste réservé aux paiements confirmés).
 */
const base = z.object({ sessionToken: z.string().min(1), candidateId: z.string().regex(/^(online|agency)_\d+$/) });
const receiptInput = z.object({
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "La devise doit comporter trois lettres (XAF, EUR, CAD…)."),
  paymentDate: z.string().min(8).max(40),
  paymentMethod: z.string().trim().min(1).max(120),
  paymentReference: z.string().trim().max(120).nullable().optional(),
  amountReason: z.string().trim().max(300).nullable().optional(),
  /** Frais déposés : somme totale ou avance (mention sur le reçu et dans le protocole). */
  paymentNature: z.enum(["total", "avance"]).nullable().optional(),
  balanceDue: z.number().positive().max(1_000_000_000).nullable().optional(),
});

async function context(input: z.infer<typeof base>, cookie: string | undefined) {
  const admin = await requireAdminTreatmentSession(cookie, input.sessionToken);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const reference = parseAdminCandidateReference(input.candidateId) as PaymentReference | null;
  if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Identifiant candidat invalide." });
  return { admin, db, reference, actor: admin.email || "Administrateur" };
}

const toReceiptInput = (value: z.infer<typeof receiptInput>): ReceiptDraftInput => ({
  amount: value.amount,
  currency: value.currency,
  paymentDate: value.paymentDate,
  paymentMethod: value.paymentMethod,
  paymentReference: value.paymentReference ?? null,
  amountReason: value.amountReason ?? null,
  paymentNature: value.paymentNature ?? null,
  balanceDue: value.balanceDue ?? null,
});

function asBase64(bytes: Uint8Array | Buffer) {
  return Buffer.from(bytes).toString("base64");
}

export const adminDocumentDraftsRouter = router({
  /** Valeurs par défaut, brouillons enregistrés, et état du dossier (paiement confirmé ? lot déjà envoyé ?). */
  get: publicProcedure.input(base).query(async ({ input, ctx }) => {
    const { db, reference, actor } = await context(input, ctx.req.headers.cookie);
    const dossier = await loadDossier(db, reference);
    const [receiptDraft, protocolDraft] = await Promise.all([readReceiptDraft(db, reference), readProtocolDraft(db, reference)]);
    const defaults = {
      paymentNature: null as "total" | "avance" | null,
      balanceDue: null as number | null,
      amount: dossier.amount,
      currency: dossier.currency,
      paymentDate: dossier.paymentDate.toISOString(),
      paymentMethod: dossier.paymentMethod,
      paymentReference: dossier.paymentReference,
    };
    // Le texte par défaut du protocole reprend le reçu enregistré (montant, nature du versement : total ou avance).
    const withReceipt = { ...dossier };
    applyReceiptDraft(withReceipt, receiptDraft);
    const protocolDefault = buildProtocolOneRichText(buildProtocolVariables(withReceipt, actor), dossier.destination || "", dossier.visaType || null);
    const [sent] = await db.select({ createdAt: paymentAuditLogs.createdAt }).from(paymentAuditLogs)
      .where(and(eq(paymentAuditLogs.paymentId, reference.id), eq(paymentAuditLogs.candidateEmail, dossier.email), eq(paymentAuditLogs.action, "receipt_protocol_sent")))
      .orderBy(desc(paymentAuditLogs.createdAt)).limit(1);
    return {
      dossierNumber: dossier.dossierNumber,
      fullName: dossier.fullName,
      email: dossier.email,
      paymentConfirmed: dossier.paymentConfirmed,
      packageSentAt: sent?.createdAt ? sent.createdAt.toISOString() : null,
      receipt: {
        defaults,
        saved: receiptDraft ? { ...defaults, ...receiptDraft } : null,
        modified: Boolean(receiptDraft),
        updatedAt: receiptDraft?.updatedAt ?? null,
        updatedBy: receiptDraft?.updatedBy ?? null,
        amountReason: receiptDraft?.amountReason ?? null,
      },
      protocol: {
        defaultContent: protocolDefault,
        content: protocolDraft?.content ?? protocolDefault,
        modified: Boolean(protocolDraft),
        updatedAt: protocolDraft?.updatedAt ?? null,
        updatedBy: protocolDraft?.updatedBy ?? null,
      },
    };
  }),

  saveReceipt: publicProcedure.input(base.extend({ receipt: receiptInput })).mutation(async ({ input, ctx }) => {
    const { db, reference, actor } = await context(input, ctx.req.headers.cookie);
    const values = toReceiptInput(input.receipt);
    const error = validateReceiptDraft(values);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error });
    const dossier = await loadDossier(db, reference);
    const defaultAmount = dossier.amount;
    const reasonError = amountChangeError({ newAmount: values.amount, defaultAmount, reason: values.amountReason });
    if (reasonError) throw new TRPCError({ code: "BAD_REQUEST", message: reasonError });
    const previous = await readReceiptDraft(db, reference);
    const draft = await saveReceiptDraft(db, reference, values, actor);
    // Traçabilité : chaque changement de montant du reçu est inscrit au journal des paiements (qui, quand, de combien à combien, pourquoi).
    const before = Math.round(previous?.amount ?? defaultAmount);
    if (Math.round(values.amount) !== before) {
      await db.insert(paymentAuditLogs).values({
        adminName: actor,
        adminEmail: actor,
        action: "receipt_amount_changed",
        paymentId: reference.id,
        candidateEmail: dossier.email,
        amount: `${Math.round(values.amount)} ${values.currency}`,
        details: `Reçu ${dossier.dossierNumber} : montant ${before.toLocaleString("fr-FR")} → ${Math.round(values.amount).toLocaleString("fr-FR")} ${values.currency}${values.amountReason?.trim() ? `. Motif : ${values.amountReason.trim()}` : ""}.`,
      });
    }
    return { updatedAt: draft.updatedAt };
  }),

  resetReceipt: publicProcedure.input(base).mutation(async ({ input, ctx }) => {
    const { db, reference } = await context(input, ctx.req.headers.cookie);
    await clearReceiptDraft(db, reference);
    return { ok: true as const };
  }),

  saveProtocol: publicProcedure.input(base.extend({ content: z.string().max(80_000) })).mutation(async ({ input, ctx }) => {
    const { db, reference, actor } = await context(input, ctx.req.headers.cookie);
    const error = validateProtocolContent(input.content);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error });
    const draft = await saveProtocolDraft(db, reference, input.content, actor);
    return { updatedAt: draft.updatedAt };
  }),

  resetProtocol: publicProcedure.input(base).mutation(async ({ input, ctx }) => {
    const { db, reference } = await context(input, ctx.req.headers.cookie);
    await clearProtocolDraft(db, reference);
    return { ok: true as const };
  }),

  /** Lien du dernier protocole envoyé (PDF), à copier et coller dans WhatsApp, un SMS ou un e-mail. */
  protocolLink: publicProcedure.input(base).query(async ({ input, ctx }) => {
    const { db, reference } = await context(input, ctx.req.headers.cookie);
    let url: string | null = null;
    if (reference.source === "agency") {
      const [doc] = await db.select({ documentUrl: agencyDossierDocuments.documentUrl }).from(agencyDossierDocuments)
        .where(and(eq(agencyDossierDocuments.dossierId, reference.id), eq(agencyDossierDocuments.documentType, "protocole_accord")))
        .orderBy(desc(agencyDossierDocuments.id)).limit(1);
      url = doc?.documentUrl ?? null;
    } else {
      const [doc] = await db.select({ documentUrl: clientDocuments.documentUrl }).from(clientDocuments)
        .where(and(eq(clientDocuments.evaluationId, reference.id), like(clientDocuments.documentName, "Protocole d’accord N°01%")))
        .orderBy(desc(clientDocuments.id)).limit(1);
      url = doc?.documentUrl ?? null;
    }
    if (!url) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun protocole n'a encore été envoyé pour ce dossier." });
    const site = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
    return { url: /^https?:\/\//i.test(url) ? url : `${site}${url.startsWith("/") ? "" : "/"}${url}` };
  }),

  /** Aperçu PDF du reçu avec les valeurs en cours de saisie (rien n'est enregistré ni envoyé). */
  previewReceipt: publicProcedure.input(base.extend({ receipt: receiptInput.optional() })).mutation(async ({ input, ctx }) => {
    const { db, reference, actor } = await context(input, ctx.req.headers.cookie);
    const dossier = await loadDossier(db, reference);
    if (input.receipt) {
      const values = toReceiptInput(input.receipt);
      const error = validateReceiptDraft(values);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error });
      dossier.amount = Math.round(values.amount);
      dossier.currency = values.currency;
      dossier.paymentDate = new Date(values.paymentDate);
      dossier.paymentMethod = values.paymentMethod.trim();
      dossier.paymentReference = values.paymentReference?.trim() || null;
      dossier.paymentNature = values.paymentNature ?? null;
      dossier.balanceDue = values.paymentNature === "avance" ? values.balanceDue ?? null : null;
    } else {
      applyReceiptDraft(dossier, await readReceiptDraft(db, reference));
    }
    const pdf = await buildPaymentReceiptPdf({
      dossierNumber: dossier.dossierNumber,
      fullName: dossier.fullName,
      email: dossier.email,
      amount: dossier.amount,
      currency: dossier.currency,
      paymentDate: dossier.paymentDate,
      paymentMethod: dossier.paymentMethod,
      paymentReference: dossier.paymentReference,
      validatedBy: actor,
      destination: dossier.destination,
      visaType: dossier.visaType,
      paymentNature: dossier.paymentNature,
      balanceDue: dossier.balanceDue,
    });
    return { fileName: `Apercu-recu-${dossier.dossierNumber}.pdf`, pdfBase64: asBase64(pdf) };
  }),

  /** Aperçu PDF du protocole avec le texte en cours de saisie (aucun dépôt dans le stockage). */
  previewProtocol: publicProcedure.input(base.extend({ content: z.string().max(80_000).optional() })).mutation(async ({ input, ctx }) => {
    const { db, reference, actor } = await context(input, ctx.req.headers.cookie);
    const dossier = await loadDossier(db, reference);
    applyReceiptDraft(dossier, await readReceiptDraft(db, reference));
    const variables = buildProtocolVariables(dossier, actor);
    let content = input.content?.trim();
    if (content) {
      const error = validateProtocolContent(content);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error });
    } else {
      content = (await readProtocolDraft(db, reference))?.content ?? buildProtocolOneRichText(variables, dossier.destination || "", dossier.visaType || null);
    }
    const pdf = await createAgreementProtocolOnePdf({
      dossierNumber: dossier.dossierNumber,
      fullName: dossier.fullName,
      destination: dossier.destination,
      variables,
      visaType: dossier.visaType,
      content,
      documentTitle: "APERÇU — Protocole d’accord N°01",
      skipStorage: true,
    });
    return { fileName: `Apercu-protocole-${dossier.dossierNumber}.pdf`, pdfBase64: asBase64(pdf.bytes) };
  }),
});
