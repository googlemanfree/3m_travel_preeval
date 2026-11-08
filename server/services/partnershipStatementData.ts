import { eq } from "drizzle-orm";
import { applications, partnershipPayouts, type PartnershipApplicationRow } from "../../drizzle/schema";
import { buildPartnerStatement, type PartnerStatement, type PayoutRecord, type StatementReferral } from "../../shared/partnershipStatement";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Les dossiers en ligne amenés par le code de parrainage du partenaire. Aucun nom de client n'est lu. */
export async function loadReferrals(db: Db, referralCode: string): Promise<StatementReferral[]> {
  const rows = await db.select({
    id: applications.id,
    dossierNumber: applications.dossierNumber,
    createdAt: applications.createdAt,
    paymentStatus: applications.paymentStatus,
    paymentConfirmedAmount: applications.paymentConfirmedAmount,
    paymentAmount: applications.paymentAmount,
    paymentDate: applications.paymentDate,
    paymentValidatedAt: applications.paymentValidatedAt,
    paymentCurrency: applications.paymentCurrency,
  }).from(applications).where(eq(applications.referredByCode, referralCode)).limit(5000);
  return rows.map((row) => ({
    id: row.id,
    reference: row.dossierNumber,
    openedAt: row.createdAt,
    paymentStatus: row.paymentStatus,
    paidAt: row.paymentValidatedAt ?? row.paymentDate ?? null,
    amountXaf: row.paymentConfirmedAmount ?? row.paymentAmount ?? 0,
    currency: row.paymentCurrency,
  }));
}

export async function loadPayouts(db: Db, applicationId: number): Promise<Array<PayoutRecord & { id: number; paidBy: string | null; method: string | null; note: string | null }>> {
  const rows = await db.select().from(partnershipPayouts).where(eq(partnershipPayouts.applicationId, applicationId)).limit(240);
  return rows.map((row) => ({ id: row.id, period: row.period, amountXaf: row.amountXaf, reference: row.reference, paidAt: row.paidAt, paidBy: row.paidBy, method: row.method, note: row.note }));
}

/** Relevé d'un partenaire actif ou suspendu ; null tant que le protocole n'est pas contresigné (aucune commission avant). */
export async function loadPartnerStatement(db: Db, row: PartnershipApplicationRow, now: Date = new Date()): Promise<PartnerStatement | null> {
  if (!row.referralCode || !row.countersignedAt || !row.commissionRateBps || !row.termMonths || !row.attributionMonths || !row.paymentDelayDays) return null;
  const [referrals, payouts] = await Promise.all([loadReferrals(db, row.referralCode), loadPayouts(db, row.id)]);
  return buildPartnerStatement({
    commissionRateBps: row.commissionRateBps,
    countersignedAt: row.countersignedAt,
    termMonths: row.termMonths,
    attributionMonths: row.attributionMonths,
    paymentDelayDays: row.paymentDelayDays,
  }, referrals, payouts, now);
}
