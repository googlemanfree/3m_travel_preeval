import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Espace partenaire, relevé et versements contre une base simulée en mémoire. */
const state = vi.hoisted(() => ({
  tables: new Map<object, any[]>(),
  nextId: new Map<object, number>(),
  emails: [] as any[],
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
    and: (...parts: unknown[]) => ({ op: "and", parts }),
    desc: (column: unknown) => ({ op: "desc", column }),
    inArray: (column: unknown, values: unknown[]) => ({ op: "in", column, values }),
    isNull: (column: unknown) => ({ op: "isNull", column }),
  };
});

const keyOf = (table: any, column: unknown) => Object.keys(table).find((key) => table[key] === column) as string;
const matches = (table: any, row: any, predicate: any): boolean => {
  if (!predicate) return true;
  if (predicate.op === "and") return predicate.parts.every((part: any) => matches(table, row, part));
  if (predicate.op === "eq") return row[keyOf(table, predicate.column)] === predicate.value;
  if (predicate.op === "in") return predicate.values.includes(row[keyOf(table, predicate.column)]);
  if (predicate.op === "isNull") return row[keyOf(table, predicate.column)] == null;
  return true;
};

function makeDb() {
  const rowsOf = (table: object) => {
    if (!state.tables.has(table)) state.tables.set(table, []);
    return state.tables.get(table)!;
  };
  return {
    select: () => ({
      from: (table: any) => {
        let predicate: any;
        let order: any;
        let max = Infinity;
        const builder: any = {
          where: (value: any) => { predicate = value; return builder; },
          orderBy: (value: any) => { order = value; return builder; },
          limit: (value: number) => { max = value; return builder; },
          then: (resolve: any, reject: any) => {
            let rows = rowsOf(table).filter((row) => matches(table, row, predicate)).map((row) => ({ ...row }));
            if (order?.op === "desc") {
              const key = keyOf(table, order.column);
              rows = rows.sort((a, b) => (b[key] > a[key] ? 1 : b[key] < a[key] ? -1 : 0));
            }
            return Promise.resolve(rows.slice(0, max)).then(resolve, reject);
          },
        };
        return builder;
      },
    }),
    insert: (table: any) => ({
      values: async (values: Record<string, unknown>) => {
        const id = (state.nextId.get(table) ?? 100) + 1;
        state.nextId.set(table, id);
        rowsOf(table).push({ id, createdAt: new Date(), ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) });
        return [{ insertId: id }];
      },
    }),
    update: (table: any) => ({
      set: (values: Record<string, unknown>) => ({
        where: async (predicate: any) => {
          let affectedRows = 0;
          for (const row of rowsOf(table)) {
            if (!matches(table, row, predicate)) continue;
            for (const [key, value] of Object.entries(values)) if (value !== undefined) row[key] = value;
            affectedRows += 1;
          }
          return [{ affectedRows }];
        },
      }),
    }),
  };
}

vi.mock("./db", () => ({ getDb: async () => makeDb() }));
vi.mock("./_core/email", () => ({ sendEmail: async (options: any) => { state.emails.push(options); } }));
vi.mock("./storage", () => ({
  storagePut: async (key: string) => ({ key, url: `https://files.test/${key}` }),
  storageGetSignedUrl: async (key: string) => `https://files.test/signed/${key}`,
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "admin@3mtravelagency.com" }) }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async () => undefined }));
vi.mock("./routers/placementPortal", () => ({ hashToken: (value: string) => createHash("sha256").update(value).digest("hex") }));

import { applications, partnershipApplications, partnershipEvents, partnershipPayouts, partnershipSpaceLinks } from "../drizzle/schema";
import { partnershipSpaceRouter } from "./routers/partnershipSpace";

let ip = 0;
const caller = () => partnershipSpaceRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: `10.30.0.${++ip}` } } } as any);
const SESSION = "s".repeat(40);
const rows = (table: object) => state.tables.get(table) ?? [];
const tokenOf = (link: string) => new URL(link).searchParams.get("token") as string;

const partner = (overrides: Record<string, unknown> = {}) => ({
  id: 1, kind: "travel_agency", status: "active", contactName: "Awa Ndiaye", email: "awa@teranga.test", phone: "+221770000000", country: "Sénégal",
  companyName: "Teranga Voyages", createdAt: new Date("2026-10-01T09:00:00Z"), commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30,
  territory: "Sénégal", countersignedAt: new Date("2026-11-10T09:00:00Z"), referralCode: "ABC234", finalPdfKey: "partnership/1/protocole-signe-final.pdf", partnerSignatureIp: "10.0.0.1", ...overrides,
});
let dossierId = 0;
const dossier = (overrides: Record<string, unknown> = {}) => ({
  id: ++dossierId, dossierNumber: `3M-2026-${String(dossierId).padStart(4, "0")}`, fullName: "Client Secret", email: "client.secret@example.com", referredByCode: "ABC234",
  createdAt: new Date("2026-11-12T10:00:00Z"), paymentStatus: "SUCCESS", paymentConfirmedAmount: 100_000, paymentAmount: 65_000, paymentCurrency: "XAF",
  paymentDate: new Date("2026-11-20T10:00:00Z"), paymentValidatedAt: new Date("2026-11-20T10:00:00Z"), ...overrides,
});

const seed = (partnerOverrides: Record<string, unknown> = {}, dossiers: Array<Record<string, unknown>> = [dossier()]) => {
  state.tables.set(partnershipApplications, [partner(partnerOverrides)]);
  state.tables.set(applications, dossiers);
};
const openSpace = async () => {
  const issued = await caller().adminSendSpaceLink({ sessionToken: SESSION, id: 1 });
  return tokenOf(issued.link);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-15T10:00:00Z"));
  state.tables.clear();
  state.nextId.clear();
  state.emails = [];
  dossierId = 0;
});
afterEach(() => vi.useRealTimers());

describe("espace partenaire (lien privé)", () => {
  it("refuse un lien inconnu", async () => {
    seed();
    await expect(caller().spaceGet({ token: "x".repeat(43) })).rejects.toThrow(/pas valable/i);
  });

  it("montre le code, les conditions et le relevé, sans aucune identité de client ni donnée interne", async () => {
    seed();
    const token = await openSpace();
    const space = await caller().spaceGet({ token });
    expect(space).toMatchObject({ partnerName: "Teranga Voyages", status: "active", referralCode: "ABC234", hasProtocolPdf: true });
    expect(space.referralLink).toContain("/?ref=ABC234");
    expect(space.terms).toMatchObject({ commissionRate: "15 %", termMonths: 12, paymentDelayDays: 30 });
    expect(space.totals).toMatchObject({ referrals: 1, paidReferrals: 1, earnedXaf: 15_000, paidOutXaf: 0, dueXaf: 15_000 });
    expect(space.lines[0]).toMatchObject({ reference: "3M-2026-0001", commissionXaf: 15_000, eligible: true });
    const serialized = JSON.stringify(space);
    for (const secret of ["Client Secret", "client.secret@example.com", "awa@teranga.test", "10.0.0.1", "+221770000000"]) expect(serialized).not.toContain(secret);
  });

  it("n'envoie que l'empreinte du lien en base, et enregistre le dernier usage", async () => {
    seed();
    const token = await openSpace();
    expect(rows(partnershipSpaceLinks)[0].tokenHash).not.toContain(token);
    expect(rows(partnershipSpaceLinks)[0].lastUsedAt).toBeUndefined();
    await caller().spaceGet({ token });
    expect(rows(partnershipSpaceLinks)[0].lastUsedAt).toBeInstanceOf(Date);
  });

  it("un nouveau lien révoque l'ancien", async () => {
    seed();
    const first = await openSpace();
    const second = await openSpace();
    await expect(caller().spaceGet({ token: first })).rejects.toThrow(/pas valable/i);
    expect((await caller().spaceGet({ token: second })).reference).toBe("PAR-2026-0001");
  });

  it("refuse un lien expiré", async () => {
    seed();
    const token = await openSpace();
    rows(partnershipSpaceLinks)[0].expiresAt = new Date("2027-01-01T00:00:00Z");
    await expect(caller().spaceGet({ token })).rejects.toThrow(/expiré/i);
  });

  it("n'ouvre l'espace qu'aux partenaires actifs ou suspendus", async () => {
    seed({ status: "partner_signed" });
    state.tables.set(partnershipSpaceLinks, [{ id: 1, applicationId: 1, tokenHash: createHash("sha256").update("y".repeat(43)).digest("hex"), expiresAt: new Date("2028-01-01T00:00:00Z"), revokedAt: null }]);
    await expect(caller().spaceGet({ token: "y".repeat(43) })).rejects.toThrow(/n’est pas disponible/i);
  });

  it("un partenaire suspendu garde l'accès à son relevé, avec son statut", async () => {
    seed({ status: "suspended" });
    const link = await caller().adminSendSpaceLink({ sessionToken: SESSION, id: 1 });
    const space = await caller().spaceGet({ token: tokenOf(link.link) });
    expect(space).toMatchObject({ status: "suspended", statusLabel: "Suspendu" });
    expect(space.totals?.earnedXaf).toBe(15_000);
  });

  it("donne un lien temporaire vers l'exemplaire signé", async () => {
    seed();
    const token = await openSpace();
    const result = await caller().spaceProtocolPdfUrl({ token });
    expect(result.url).toBe("https://files.test/signed/partnership/1/protocole-signe-final.pdf");
  });

  it("l'envoi du lien prévient le partenaire par e-mail et trace l'action", async () => {
    seed();
    await openSpace();
    expect(state.emails.at(-1).to).toBe("awa@teranga.test");
    expect(state.emails.at(-1).html).toContain("/partenariat/espace?token=");
    expect(rows(partnershipEvents).some((event) => event.kind === "space_link")).toBe(true);
  });

  it("refuse d'envoyer un lien avant la contresignature", async () => {
    seed({ status: "partner_signed" });
    await expect(caller().adminSendSpaceLink({ sessionToken: SESSION, id: 1 })).rejects.toThrow(/contresignature/i);
  });
});

describe("relevé et versement des commissions", () => {
  it("fournit le relevé et un CSV prêt pour Excel", async () => {
    seed();
    const result = await caller().adminStatement({ sessionToken: SESSION, id: 1 });
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.statement.totals.earnedXaf).toBe(15_000);
    expect(result.currentPeriod).toBe("2027-01");
    expect(result.csv.charCodeAt(0)).toBe(0xfeff);
    expect(result.csv).toContain("Teranga Voyages (PAR-2026-0001)");
  });

  it("indique qu'aucun relevé n'existe tant que le protocole n'est pas contresigné", async () => {
    seed({ status: "partner_signed", countersignedAt: null, referralCode: null });
    expect((await caller().adminStatement({ sessionToken: SESSION, id: 1 })).available).toBe(false);
  });

  const pay = (overrides: Record<string, unknown> = {}) => caller().adminMarkPayout({ sessionToken: SESSION, id: 1, period: "2026-11", reference: "OM-77881", method: "mobile_money", ...overrides } as any);

  it("enregistre le versement d'un mois terminé, montant figé, et prévient le partenaire", async () => {
    seed();
    const result = await pay();
    expect(result.amountXaf).toBe(15_000);
    expect(rows(partnershipPayouts)[0]).toMatchObject({ applicationId: 1, period: "2026-11", amountXaf: 15_000, paymentsCount: 1, reference: "OM-77881", method: "Mobile Money", paidBy: "admin@3mtravelagency.com" });
    const mail = state.emails.at(-1);
    expect(mail.to).toBe("awa@teranga.test");
    expect(mail.subject).toContain("novembre 2026");
    expect(mail.html).toContain("15 000 XAF");
    expect(mail.html).toContain("OM-77881");
    expect(rows(partnershipEvents).some((event) => event.kind === "payout")).toBe(true);
  });

  it("refuse de verser deux fois le même mois", async () => {
    seed();
    await pay();
    await expect(pay({ reference: "OM-99999" })).rejects.toThrow(/déjà été versé/i);
    expect(rows(partnershipPayouts)).toHaveLength(1);
  });

  it("refuse un mois non terminé, un mois sans commission et une référence trop courte", async () => {
    seed({}, [dossier({ paymentValidatedAt: new Date("2027-01-05T10:00:00Z"), paymentDate: new Date("2027-01-05T10:00:00Z") })]);
    await expect(pay({ period: "2027-01" })).rejects.toThrow(/pas terminé/i);
    await expect(pay({ period: "2026-10" })).rejects.toThrow(/Aucune commission/i);
    await expect(pay({ reference: "ab" })).rejects.toThrow();
    expect(rows(partnershipPayouts)).toHaveLength(0);
  });

  it("n'autorise aucun versement avant l'activation du partenaire", async () => {
    seed({ status: "partner_signed" });
    await expect(pay()).rejects.toThrow(/contresigné/i);
  });

  it("le versement apparaît dans l'espace du partenaire, avec son écart si un paiement est remboursé ensuite", async () => {
    seed();
    const token = await openSpace();
    await pay();
    rows(applications)[0].paymentStatus = "CANCELLED";
    const space = await caller().spaceGet({ token });
    const month = space.months.find((item) => item.period === "2026-11")!;
    expect(month).toMatchObject({ paid: true, paidAmountXaf: 15_000, paidReference: "OM-77881", commissionXaf: 0, deltaXaf: 15_000 });
    expect(space.totals).toMatchObject({ paidOutXaf: 15_000, earnedXaf: 0 });
  });

  it("ne compte jamais les paiements d'un autre code de parrainage", async () => {
    seed({}, [dossier(), dossier({ referredByCode: "ZZZ999", paymentConfirmedAmount: 500_000 })]);
    const result = await caller().adminStatement({ sessionToken: SESSION, id: 1 });
    expect(result.available && result.statement.totals.earnedXaf).toBe(15_000);
  });
});
