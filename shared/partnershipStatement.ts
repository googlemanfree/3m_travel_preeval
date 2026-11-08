/**
 * Relevé de commissions d'un partenaire : règles de calcul communes au serveur (versements) et à l'interface (relevé).
 *
 * Elles appliquent le protocole d'accord (articles 2 et 6, 13.4) :
 *  - la commission naît au paiement VALIDÉ du client (statut SUCCESS, date connue, devise XAF) ;
 *  - seuls comptent les paiements validés à partir de la contresignature de 3M et jusqu'à la fin du protocole ;
 *  - pendant la durée d'attribution, à compter de l'ouverture du dossier du client ;
 *  - le versement est dû à la fin du mois du paiement + le délai convenu.
 * Un paiement refusé, annulé ou en attente ne donne aucune commission.
 */

import { addMonths } from "./partnershipProgram";

export const STATEMENT_TIME_ZONE = "Africa/Douala";

export type StatementReferral = {
  id: number;
  /** Référence du dossier (jamais le nom du client : le partenaire ne voit pas d'identité). */
  reference: string;
  openedAt: Date;
  paymentStatus: string;
  paidAt: Date | null;
  /** Honoraires encaissés (montant confirmé, sinon montant du dossier). */
  amountXaf: number;
  currency: string;
};

export type StatementTerms = {
  commissionRateBps: number;
  countersignedAt: Date;
  termMonths: number;
  attributionMonths: number;
  paymentDelayDays: number;
};

export type StatementIneligibleReason = "not_paid" | "currency" | "before_effect" | "after_term" | "outside_attribution";

export const STATEMENT_REASON_LABELS: Record<StatementIneligibleReason, string> = {
  not_paid: "Paiement non validé",
  currency: "Devise autre que le XAF : à traiter manuellement",
  before_effect: "Payé avant l’entrée en vigueur du protocole",
  after_term: "Payé après la fin du protocole",
  outside_attribution: "Hors de la durée d’attribution",
};

export type StatementLine = StatementReferral & {
  eligible: boolean;
  reason: StatementIneligibleReason | null;
  /** Mois du paiement (AAAA-MM, heure du Cameroun), null si non payé. */
  period: string | null;
  commissionXaf: number;
};

export type StatementMonth = {
  period: string;
  paymentsCount: number;
  baseXaf: number;
  commissionXaf: number;
  /** Échéance de versement : fin du mois + délai convenu. */
  dueAt: Date;
  paid: boolean;
  paidAt: Date | null;
  paidAmountXaf: number | null;
  paidReference: string | null;
  /** Montant payé − montant recalculé (un remboursement tardif le rend négatif) ; 0 si non versé. */
  deltaXaf: number;
};

export type PayoutRecord = { period: string; amountXaf: number; reference: string | null; paidAt: Date };

export type PartnerStatement = {
  lines: StatementLine[];
  months: StatementMonth[];
  totals: {
    referrals: number;
    paidReferrals: number;
    earnedXaf: number;
    paidOutXaf: number;
    dueXaf: number;
    /** Échu = échéance dépassée et non versé. */
    overdueXaf: number;
  };
  termEndsAt: Date;
};

export function periodOf(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: STATEMENT_TIME_ZONE, year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

/** Fin du mois « AAAA-MM » + délai (jours) : échéance de versement. */
export function payoutDueAt(period: string, delayDays: number): Date {
  const [year, month] = period.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return new Date(endOfMonth.getTime() + delayDays * 24 * 3600 * 1000);
}

export function commissionFor(amountXaf: number, rateBps: number): number {
  return Math.max(0, Math.round((amountXaf * rateBps) / 10_000));
}

export function buildPartnerStatement(terms: StatementTerms, referrals: StatementReferral[], payouts: PayoutRecord[] = [], now: Date = new Date()): PartnerStatement {
  const termEndsAt = addMonths(terms.countersignedAt, terms.termMonths);
  const lines: StatementLine[] = referrals.map((referral) => {
    const base = { ...referral, eligible: false, reason: null as StatementIneligibleReason | null, period: referral.paidAt ? periodOf(referral.paidAt) : null, commissionXaf: 0 };
    const skip = (reason: StatementIneligibleReason): StatementLine => ({ ...base, reason });
    if (referral.paymentStatus !== "SUCCESS" || !referral.paidAt) return skip("not_paid");
    if ((referral.currency || "XAF").toUpperCase() !== "XAF") return skip("currency");
    if (referral.paidAt.getTime() < terms.countersignedAt.getTime()) return skip("before_effect");
    if (referral.paidAt.getTime() > termEndsAt.getTime()) return skip("after_term");
    if (referral.paidAt.getTime() > addMonths(referral.openedAt, terms.attributionMonths).getTime()) return skip("outside_attribution");
    return { ...base, eligible: true, commissionXaf: commissionFor(referral.amountXaf, terms.commissionRateBps) };
  }).sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0) || b.id - a.id);

  const byPeriod = new Map<string, StatementLine[]>();
  for (const line of lines) {
    if (!line.eligible || !line.period) continue;
    byPeriod.set(line.period, [...(byPeriod.get(line.period) ?? []), line]);
  }
  const payoutByPeriod = new Map(payouts.map((payout) => [payout.period, payout]));
  // Un mois déjà versé reste visible même si plus aucune ligne n'est éligible (remboursement tardif).
  for (const period of Array.from(payoutByPeriod.keys())) if (!byPeriod.has(period)) byPeriod.set(period, []);

  const months: StatementMonth[] = Array.from(byPeriod.entries()).map(([period, items]) => {
    const commissionXaf = items.reduce((sum, item) => sum + item.commissionXaf, 0);
    const payout = payoutByPeriod.get(period);
    return {
      period,
      paymentsCount: items.length,
      baseXaf: items.reduce((sum, item) => sum + item.amountXaf, 0),
      commissionXaf,
      dueAt: payoutDueAt(period, terms.paymentDelayDays),
      paid: Boolean(payout),
      paidAt: payout?.paidAt ?? null,
      paidAmountXaf: payout?.amountXaf ?? null,
      paidReference: payout?.reference ?? null,
      deltaXaf: payout ? payout.amountXaf - commissionXaf : 0,
    };
  }).sort((a, b) => (a.period < b.period ? 1 : -1));

  const earnedXaf = months.reduce((sum, month) => sum + month.commissionXaf, 0);
  const paidOutXaf = months.reduce((sum, month) => sum + (month.paidAmountXaf ?? 0), 0);
  const unpaid = months.filter((month) => !month.paid);
  return {
    lines,
    months,
    totals: {
      referrals: lines.length,
      paidReferrals: lines.filter((line) => line.paymentStatus === "SUCCESS" && line.paidAt).length,
      earnedXaf,
      paidOutXaf,
      dueXaf: unpaid.reduce((sum, month) => sum + month.commissionXaf, 0),
      overdueXaf: unpaid.filter((month) => month.dueAt.getTime() < now.getTime()).reduce((sum, month) => sum + month.commissionXaf, 0),
    },
    termEndsAt,
  };
}

/** Export CSV d'un relevé (séparateur « ; » et BOM : s'ouvre correctement dans Excel en français). */
export function statementToCsv(statement: PartnerStatement, partnerLabel: string): string {
  const cell = (value: string | number | null | undefined) => {
    const text = String(value ?? "");
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; // neutralise l'injection de formule dans un tableur
    return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const rows: Array<Array<string | number | null>> = [
    [`Relevé de commissions — ${partnerLabel}`],
    [],
    ["Mois", "Paiements validés", "Base (XAF)", "Commission (XAF)", "Échéance", "Versé", "Montant versé (XAF)", "Référence du versement", "Écart (XAF)"],
    ...statement.months.map((month) => [month.period, month.paymentsCount, month.baseXaf, month.commissionXaf, month.dueAt.toISOString().slice(0, 10), month.paid ? "oui" : "non", month.paidAmountXaf, month.paidReference, month.deltaXaf]),
    [],
    ["Dossier", "Ouvert le", "Payé le", "Base (XAF)", "Commission (XAF)", "Statut"],
    ...statement.lines.map((line) => [line.reference, line.openedAt.toISOString().slice(0, 10), line.paidAt ? line.paidAt.toISOString().slice(0, 10) : "", line.amountXaf, line.commissionXaf, line.eligible ? "commissionnable" : STATEMENT_REASON_LABELS[line.reason ?? "not_paid"]]),
  ];
  return `﻿${rows.map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
