/**
 * Envoi WhatsApp client « au mieux » : ne fait jamais échouer l’action admin.
 */

import {
  buildAgencyDocumentsPublishedWhatsApp,
  buildClientAccessLinkWhatsApp,
  buildAgreementSignatureReminderWhatsApp,
  buildAgreementSignedWhatsApp,
  buildDossierCreatedWhatsApp,
  buildPaymentReceiptApprovedWhatsApp,
  buildProcedureStageWhatsApp,
  sendWhatsAppMessage,
} from "../whatsappService";
import { toE164WhatsApp } from "../../shared/whatsappPhone";

export type WhatsAppNotifyResult = {
  attempted: boolean;
  sent: boolean;
  messageId?: string;
  error?: string;
  phoneE164?: string | null;
};

async function safeSend(phone: string | null | undefined, message: string): Promise<WhatsAppNotifyResult> {
  const phoneE164 = toE164WhatsApp(phone);
  if (!phoneE164) {
    return { attempted: false, sent: false, error: "Numéro WhatsApp manquant ou invalide", phoneE164: null };
  }
  try {
    const result = await sendWhatsAppMessage(phoneE164, message);
    return {
      attempted: true,
      sent: result.success,
      messageId: result.messageId,
      error: result.error,
      phoneE164,
    };
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      error: error instanceof Error ? error.message : "Erreur WhatsApp",
      phoneE164,
    };
  }
}

export async function notifyAgencyDocumentsPublishedWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  documentCount: number;
  dossierNumber?: string | null;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildAgencyDocumentsPublishedWhatsApp({
      candidateName: input.candidateName,
      documentCount: input.documentCount,
      dossierNumber: input.dossierNumber,
    }),
  );
}

export async function notifyDossierCreatedWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
  destination: string;
  visaType: string;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildDossierCreatedWhatsApp({
      candidateName: input.candidateName,
      dossierNumber: input.dossierNumber,
      destination: input.destination,
      visaType: input.visaType,
    }),
  );
}

export async function notifyProcedureStageWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
  stageLabel: string;
  stepLabel?: string | null;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildProcedureStageWhatsApp({
      candidateName: input.candidateName,
      dossierNumber: input.dossierNumber,
      stageLabel: input.stageLabel,
      stepLabel: input.stepLabel,
    }),
  );
}

export async function notifyPaymentReceiptApprovedWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
  amount: string;
  currency: string;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildPaymentReceiptApprovedWhatsApp({
      candidateName: input.candidateName,
      dossierNumber: input.dossierNumber,
      amount: input.amount,
      currency: input.currency,
    }),
  );
}

export async function notifyClientAccessLinkWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
  accessUrl: string;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildClientAccessLinkWhatsApp({ candidateName: input.candidateName, dossierNumber: input.dossierNumber, accessUrl: input.accessUrl }),
  );
}

export async function notifyAgreementSignatureReminderWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildAgreementSignatureReminderWhatsApp({ candidateName: input.candidateName, dossierNumber: input.dossierNumber }),
  );
}

export async function notifyAgreementSignedWhatsApp(input: {
  phone?: string | null;
  candidateName: string;
  dossierNumber: string;
}): Promise<WhatsAppNotifyResult> {
  return safeSend(
    input.phone,
    buildAgreementSignedWhatsApp({ candidateName: input.candidateName, dossierNumber: input.dossierNumber }),
  );
}
