import { describe, expect, it } from "vitest";
import { buildPartnerStatement, commissionFor, payoutDueAt, periodOf, statementToCsv, type StatementReferral, type StatementTerms } from "../shared/partnershipStatement";

const terms: StatementTerms = {
  commissionRateBps: 1500,
  countersignedAt: new Date("2026-11-10T09:00:00Z"),
  termMonths: 12,
  attributionMonths: 12,
  paymentDelayDays: 30,
};

let nextId = 0;
const referral = (overrides: Partial<StatementReferral> = {}): StatementReferral => ({
  id: ++nextId,
  reference: `3M-2026-${String(nextId).padStart(4, "0")}`,
  openedAt: new Date("2026-11-12T10:00:00Z"),
  paymentStatus: "SUCCESS",
  paidAt: new Date("2026-11-20T10:00:00Z"),
  amountXaf: 100_000,
  currency: "XAF",
  ...overrides,
});

describe("calcul des commissions d'un partenaire", () => {
  it("applique le taux du protocole au montant encaissé, arrondi au franc", () => {
    expect(commissionFor(100_000, 1500)).toBe(15_000);
    expect(commissionFor(65_000, 1250)).toBe(8_125);
    expect(commissionFor(65_001, 1500)).toBe(9_750);
    expect(commissionFor(0, 1500)).toBe(0);
    expect(commissionFor(-5_000, 1500)).toBe(0);
  });

  it("ne commissionne que les paiements validés, en XAF, dans le périmètre du protocole", () => {
    const statement = buildPartnerStatement(terms, [
      referral(),
      referral({ paymentStatus: "PENDING", paidAt: null }),
      referral({ paymentStatus: "FAILED", paidAt: new Date("2026-11-21T10:00:00Z") }),
      referral({ currency: "EUR" }),
      referral({ paidAt: new Date("2026-11-09T10:00:00Z") }),
      referral({ paidAt: new Date("2027-11-11T10:00:00Z") }),
      referral({ openedAt: new Date("2025-01-01T10:00:00Z") }),
    ]);
    const reasons = statement.lines.map((line) => line.reason);
    expect(statement.lines.filter((line) => line.eligible)).toHaveLength(1);
    expect(reasons.filter(Boolean).sort()).toEqual(["after_term", "before_effect", "currency", "not_paid", "not_paid", "outside_attribution"]);
    expect(statement.totals.earnedXaf).toBe(15_000);
    expect(statement.totals.referrals).toBe(7);
  });

  it("n'accorde rien avant la contresignature, même pour un client déjà payé", () => {
    const statement = buildPartnerStatement(terms, [referral({ paidAt: new Date("2026-11-10T08:59:59Z") })]);
    expect(statement.lines[0]).toMatchObject({ eligible: false, reason: "before_effect", commissionXaf: 0 });
    expect(statement.months).toHaveLength(0);
  });

  it("range les paiements par mois à l'heure du Cameroun, pas en UTC", () => {
    expect(periodOf(new Date("2026-11-30T22:30:00Z"))).toBe("2026-11");
    expect(periodOf(new Date("2026-11-30T23:30:00Z"))).toBe("2026-12");
    const statement = buildPartnerStatement(terms, [
      referral({ paidAt: new Date("2026-11-30T23:30:00Z") }),
      referral({ paidAt: new Date("2026-11-15T10:00:00Z") }),
    ]);
    expect(statement.months.map((month) => month.period)).toEqual(["2026-12", "2026-11"]);
  });

  it("calcule l'échéance : fin du mois + délai convenu", () => {
    expect(payoutDueAt("2026-11", 30).toISOString().slice(0, 10)).toBe("2026-12-30");
    expect(payoutDueAt("2026-02", 7).toISOString().slice(0, 10)).toBe("2026-03-07");
    expect(payoutDueAt("2026-12", 30).toISOString().slice(0, 10)).toBe("2027-01-30");
  });

  it("totalise par mois et distingue acquis, versé, reste et échu", () => {
    const now = new Date("2027-02-15T10:00:00Z"); // décembre était dû le 30 janvier : il est en retard
    const statement = buildPartnerStatement(terms, [
      referral({ paidAt: new Date("2026-11-15T10:00:00Z"), amountXaf: 100_000 }),
      referral({ paidAt: new Date("2026-11-25T10:00:00Z"), amountXaf: 65_000 }),
      referral({ paidAt: new Date("2026-12-05T10:00:00Z"), amountXaf: 100_000 }),
    ], [{ period: "2026-11", amountXaf: 24_750, reference: "OM-123", paidAt: new Date("2026-12-10T10:00:00Z") }], now);
    const november = statement.months.find((month) => month.period === "2026-11")!;
    const december = statement.months.find((month) => month.period === "2026-12")!;
    expect(november).toMatchObject({ paymentsCount: 2, baseXaf: 165_000, commissionXaf: 24_750, paid: true, paidReference: "OM-123", deltaXaf: 0 });
    expect(december).toMatchObject({ paymentsCount: 1, commissionXaf: 15_000, paid: false });
    expect(statement.totals).toMatchObject({ earnedXaf: 39_750, paidOutXaf: 24_750, dueXaf: 15_000, overdueXaf: 15_000, paidReferrals: 3 });
  });

  it("un mois non échu n'est pas compté en retard", () => {
    const statement = buildPartnerStatement(terms, [referral({ paidAt: new Date("2026-12-05T10:00:00Z") })], [], new Date("2026-12-20T10:00:00Z"));
    expect(statement.totals.dueXaf).toBe(15_000);
    expect(statement.totals.overdueXaf).toBe(0);
  });

  it("signale l'écart quand un paiement est remboursé après versement, sans effacer le mois versé", () => {
    const statement = buildPartnerStatement(terms, [referral({ paymentStatus: "CANCELLED", paidAt: new Date("2026-11-15T10:00:00Z") })], [
      { period: "2026-11", amountXaf: 15_000, reference: "VIR-9", paidAt: new Date("2026-12-10T10:00:00Z") },
    ]);
    expect(statement.months).toHaveLength(1);
    expect(statement.months[0]).toMatchObject({ commissionXaf: 0, paid: true, paidAmountXaf: 15_000, deltaXaf: 15_000 });
  });

  it("calcule la fin du protocole à partir de la contresignature", () => {
    expect(buildPartnerStatement(terms, []).termEndsAt.toISOString().slice(0, 10)).toBe("2027-11-10");
  });
});

describe("export CSV du relevé", () => {
  const statement = buildPartnerStatement(terms, [referral({ reference: "=CMD()", paidAt: new Date("2026-11-15T10:00:00Z") })]);

  it("commence par un BOM, sépare par des points-virgules et utilise des fins de ligne Windows", () => {
    const csv = statementToCsv(statement, "Teranga Voyages (PAR-2026-0042)");
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Mois;Paiements validés;Base (XAF);Commission (XAF)");
    expect(csv).toContain("2026-11;1;100000;15000;2026-12-30;non");
    expect(csv).toContain("\r\n");
  });

  it("neutralise une valeur qui commencerait par une formule de tableur", () => {
    const csv = statementToCsv(statement, "Partenaire");
    expect(csv).toContain("'=CMD()");
    expect(csv).not.toMatch(/(^|;)=CMD\(\)/m);
  });

  it("met entre guillemets les cellules contenant un point-virgule ou un guillemet", () => {
    const csv = statementToCsv(statement, 'Agence "Soleil"; Dakar');
    expect(csv).toContain('"Relevé de commissions — Agence ""Soleil""; Dakar"');
  });
});
