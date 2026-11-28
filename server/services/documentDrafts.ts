/**
 * Brouillons modifiables du reçu et du Protocole d'accord N°01, par dossier.
 *
 * Le reçu et le protocole ont un contenu par défaut (montant du dossier, texte du pays et du type de visa). L'administrateur peut le
 * modifier à tout moment avant l'envoi : ce qu'il enregistre ici est ce qui part au candidat. Sans brouillon, rien ne change.
 * Stockage : agency_settings, une ligne par document et par dossier (« receipt_draft:online:12 », « protocol_draft:agency:7 »).
 */

import { eq } from "drizzle-orm";
import { agencySettings } from "../../drizzle/schema";
import type { getDb } from "../db";
import type { Loaded, PaymentReference } from "./paymentPackage";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ReceiptDraft = {
  amount: number;
  currency: string;
  /** Date du paiement, ISO 8601. */
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string | null;
  updatedAt: string;
  updatedBy: string;
};

export type ProtocolDraft = {
  content: string;
  updatedAt: string;
  updatedBy: string;
};

export const MAX_RECEIPT_AMOUNT = 1_000_000_000;
export const PROTOCOL_MIN_LENGTH = 200;
export const PROTOCOL_MAX_LENGTH = 60_000;

export const receiptDraftKey = (reference: PaymentReference) => `receipt_draft:${reference.source}:${reference.id}`;
export const protocolDraftKey = (reference: PaymentReference) => `protocol_draft:${reference.source}:${reference.id}`;

function parse<T>(value: string | null | undefined): T | null {
  try {
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

async function readSetting(db: Db, key: string): Promise<string | null> {
  const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  return row?.settingValue ?? null;
}

async function writeSetting(db: Db, key: string, value: string): Promise<void> {
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue: value }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue: value });
}

async function deleteSetting(db: Db, key: string): Promise<void> {
  await db.delete(agencySettings).where(eq(agencySettings.settingKey, key));
}

export async function readReceiptDraft(db: Db, reference: PaymentReference): Promise<ReceiptDraft | null> {
  const draft = parse<ReceiptDraft>(await readSetting(db, receiptDraftKey(reference)));
  return draft && Number.isFinite(draft.amount) && draft.amount > 0 && typeof draft.currency === "string" ? draft : null;
}

export async function readProtocolDraft(db: Db, reference: PaymentReference): Promise<ProtocolDraft | null> {
  const draft = parse<ProtocolDraft>(await readSetting(db, protocolDraftKey(reference)));
  return draft && typeof draft.content === "string" && draft.content.trim().length >= PROTOCOL_MIN_LENGTH ? draft : null;
}

export type ReceiptDraftInput = Omit<ReceiptDraft, "updatedAt" | "updatedBy">;

/** Contrôle des valeurs saisies : renvoie un message clair, ou null si tout est valide. */
export function validateReceiptDraft(input: ReceiptDraftInput): string | null {
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "Le montant doit être supérieur à zéro.";
  if (input.amount > MAX_RECEIPT_AMOUNT) return "Le montant est trop élevé : vérifiez qu'il ne contient pas une erreur de saisie.";
  if (!/^[A-Z]{3}$/.test(input.currency)) return "La devise doit comporter trois lettres (XAF, EUR, CAD…).";
  const time = new Date(input.paymentDate).getTime();
  if (!Number.isFinite(time)) return "La date du paiement est invalide.";
  if (time > Date.now() + 24 * 60 * 60 * 1000) return "La date du paiement ne peut pas être dans le futur.";
  if (!input.paymentMethod.trim()) return "Indiquez le mode de paiement.";
  return null;
}

export function validateProtocolContent(content: string): string | null {
  const text = content.trim();
  if (text.length < PROTOCOL_MIN_LENGTH) return `Le protocole est trop court (${PROTOCOL_MIN_LENGTH} caractères au minimum) : utilisez « Rétablir le texte par défaut » si besoin.`;
  if (text.length > PROTOCOL_MAX_LENGTH) return `Le protocole est trop long (${PROTOCOL_MAX_LENGTH} caractères au maximum).`;
  return null;
}

export async function saveReceiptDraft(db: Db, reference: PaymentReference, input: ReceiptDraftInput, actor: string): Promise<ReceiptDraft> {
  const error = validateReceiptDraft(input);
  if (error) throw new Error(error);
  const draft: ReceiptDraft = {
    amount: Math.round(input.amount),
    currency: input.currency,
    paymentDate: new Date(input.paymentDate).toISOString(),
    paymentMethod: input.paymentMethod.trim().slice(0, 120),
    paymentReference: input.paymentReference?.trim() ? input.paymentReference.trim().slice(0, 120) : null,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  await writeSetting(db, receiptDraftKey(reference), JSON.stringify(draft));
  return draft;
}

export async function saveProtocolDraft(db: Db, reference: PaymentReference, content: string, actor: string): Promise<ProtocolDraft> {
  const error = validateProtocolContent(content);
  if (error) throw new Error(error);
  const draft: ProtocolDraft = { content: content.replace(/\r\n/g, "\n").trim(), updatedAt: new Date().toISOString(), updatedBy: actor };
  await writeSetting(db, protocolDraftKey(reference), JSON.stringify(draft));
  return draft;
}

export const clearReceiptDraft = (db: Db, reference: PaymentReference) => deleteSetting(db, receiptDraftKey(reference));
export const clearProtocolDraft = (db: Db, reference: PaymentReference) => deleteSetting(db, protocolDraftKey(reference));

/** Applique le brouillon du reçu au dossier chargé (sans effet s'il n'y a pas de brouillon). */
export function applyReceiptDraft(dossier: Loaded, draft: ReceiptDraft | null): void {
  if (!draft) return;
  dossier.amount = draft.amount;
  dossier.currency = draft.currency;
  dossier.paymentDate = new Date(draft.paymentDate);
  dossier.paymentMethod = draft.paymentMethod;
  dossier.paymentReference = draft.paymentReference;
}
