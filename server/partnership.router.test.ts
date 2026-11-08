import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Parcours complet du programme de partenariat contre une base simulée en mémoire :
 * candidature → vérification → protocole émis → signature du partenaire → contresignature de 3M → activation.
 */
const state = vi.hoisted(() => ({
  tables: new Map<object, any[]>(),
  nextId: new Map<object, number>(),
  emails: [] as any[],
  notified: [] as any[],
  stored: [] as Array<{ key: string; bytes: Buffer }>,
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

const DEFAULTS = (table: any): Record<string, unknown> => {
  const name = (table as any)[Symbol.for("drizzle:Name")];
  if (name === "partnership_applications") return { status: "submitted" };
  if (name === "ambassadors") return { commissionRateBps: 1500, status: "active" };
  return {};
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
        const id = (state.nextId.get(table) ?? 0) + 1;
        state.nextId.set(table, id);
        rowsOf(table).push({ id, createdAt: new Date(Date.UTC(2026, 10, 7, 9, id)), updatedAt: new Date(), ...DEFAULTS(table), ...Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) });
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
  storagePut: async (key: string, bytes: Buffer) => { state.stored.push({ key, bytes }); return { key, url: `https://files.test/${key}` }; },
  storageGetSignedUrl: async (key: string) => `https://files.test/signed/${key}`,
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "admin@3mtravelagency.com" }) }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));
vi.mock("./routers/placementPortal", () => ({ hashToken: (value: string) => createHash("sha256").update(value).digest("hex") }));

import { ambassadors, partnershipApplications, partnershipEvents, partnershipSpaceLinks } from "../drizzle/schema";
import { partnershipRouter } from "./routers/partnership";

let ip = 0;
const caller = () => partnershipRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: `10.20.0.${++ip}` } } } as any);
const SESSION = "s".repeat(40);
const rows = (table: object) => state.tables.get(table) ?? [];

const agency = (overrides: Record<string, unknown> = {}) => ({
  kind: "travel_agency" as const,
  contactName: "Awa Ndiaye",
  email: `awa${ip}@agence-test.com`,
  phone: "+221 77 000 00 00",
  country: "Sénégal",
  city: "Dakar",
  companyName: "Teranga Voyages",
  representativeRole: "Gérante",
  legalRegistration: "SN-DKR-2019-B-1234",
  channels: ["office", "whatsapp"] as const,
  consentPrivacy: true,
  codeOfConduct: true,
  ...overrides,
});
const individual = (overrides: Record<string, unknown> = {}) => ({
  kind: "individual" as const,
  contactName: "Marc Tchoua",
  email: `marc${ip}@example.com`,
  phone: "+237 690 00 00 00",
  country: "Cameroun",
  isAdult: true,
  consentPrivacy: true,
  codeOfConduct: true,
  ...overrides,
});
const TERMS = { commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Sénégal et Afrique de l’Ouest" };

const tokenOf = (link: string) => new URL(link).searchParams.get("token") as string;

async function issued(overrides: Record<string, unknown> = {}) {
  const submitted = await caller().submit(agency(overrides) as any);
  const id = rows(partnershipApplications).length;
  const result = await caller().adminIssueProtocol({ sessionToken: SESSION, id, terms: TERMS });
  return { id, reference: submitted.reference, token: tokenOf(result.link) };
}

beforeEach(() => {
  state.tables.clear();
  state.nextId.clear();
  state.emails = [];
  state.notified = [];
  state.stored = [];
});

describe("candidature de partenariat", () => {
  it("enregistre une agence, prévient l'administration et accuse réception sans rien promettre", async () => {
    const result = await caller().submit(agency() as any);
    expect(result).toMatchObject({ received: true, alreadyReceived: false });
    expect(result.reference).toMatch(/^PAR-2026-0001$/);
    expect(rows(partnershipApplications)[0]).toMatchObject({ kind: "travel_agency", status: "submitted", companyName: "Teranga Voyages", channels: "office,whatsapp" });
    expect(state.notified[0]).toMatchObject({ title: "Nouvelle candidature de partenariat", targetAdminType: "accompagnement" });
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].html).toContain("ne vaut ni accord ni autorisation");
    expect(rows(partnershipEvents)).toHaveLength(1);
  });

  it("n'accepte pas une agence sans immatriculation, ni un particulier mineur, ni sans consentement", async () => {
    await expect(caller().submit(agency({ legalRegistration: undefined }) as any)).rejects.toThrow(/immatriculation/i);
    await expect(caller().submit(individual({ isAdult: false }) as any)).rejects.toThrow(/majeures/i);
    await expect(caller().submit(agency({ consentPrivacy: false }) as any)).rejects.toThrow(/consentement/i);
    await expect(caller().submit(agency({ codeOfConduct: false }) as any)).rejects.toThrow(/charte/i);
    expect(rows(partnershipApplications)).toHaveLength(0);
  });

  it("ne crée pas de doublon pour une candidature déjà en cours avec la même adresse e-mail", async () => {
    const first = await caller().submit(individual({ email: "marc.doublon@example.com" }) as any);
    const second = await caller().submit(individual({ email: "marc.doublon@example.com" }) as any);
    expect(second).toMatchObject({ alreadyReceived: true, reference: first.reference });
    expect(rows(partnershipApplications)).toHaveLength(1);
  });

  it("ignore silencieusement un robot qui remplit le champ piège", async () => {
    const result = await caller().submit(individual({ hp: "https://spam.test" }) as any);
    expect(result.received).toBe(true);
    expect(rows(partnershipApplications)).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("n'expose le texte du protocole qu'avec la bonne signature de lien", async () => {
    await expect(caller().getForSigning({ token: "x".repeat(43) })).rejects.toThrow(/pas valide/i);
  });

  it("propose l'aperçu public du modèle pour les deux profils, avec des parties entre crochets", async () => {
    const agencyPreview = await caller().previewProtocol({ kind: "travel_agency" });
    const personPreview = await caller().previewProtocol({ kind: "individual" });
    expect(agencyPreview.text).toContain("[Raison sociale de l’agence]");
    expect(personPreview.text).toContain("[Prénom et nom du partenaire]");
    expect(agencyPreview.text).not.toBe(personPreview.text);
  });
});

describe("émission du protocole par l'administration", () => {
  it("refuse des conditions hors bornes et fige le texte avec une empreinte", async () => {
    await caller().submit(agency() as any);
    await expect(caller().adminIssueProtocol({ sessionToken: SESSION, id: 1, terms: { ...TERMS, commissionRateBps: 9000 } })).rejects.toThrow(/taux de commission/i);
    await expect(caller().adminIssueProtocol({ sessionToken: SESSION, id: 1, terms: { ...TERMS, territory: "" } })).rejects.toThrow(/territoire/i);
    const result = await caller().adminIssueProtocol({ sessionToken: SESSION, id: 1, terms: TERMS });
    const row = rows(partnershipApplications)[0];
    expect(row.status).toBe("protocol_issued");
    expect(row.protocolText).toContain("15 %");
    expect(row.protocolText).toContain("Teranga Voyages");
    expect(row.protocolFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(row.signTokenHash).not.toContain(tokenOf(result.link));
    const mail = state.emails.at(-1);
    expect(mail.to).toBe(row.email);
    expect(mail.html).toContain("/partenariat/signature?token=");
  });

  it("ré-émettre un protocole invalide l'ancien lien", async () => {
    const { id, token } = await issued();
    const again = await caller().adminIssueProtocol({ sessionToken: SESSION, id, terms: { ...TERMS, commissionRateBps: 1200 } });
    await expect(caller().getForSigning({ token })).rejects.toThrow(/pas valide/i);
    const view = await caller().getForSigning({ token: tokenOf(again.link) });
    expect(view.state).toBe("ready");
    expect(view.protocolText).toContain("12 %");
  });

  it("n'émet pas de protocole pour une candidature refusée", async () => {
    await caller().submit(agency() as any);
    await expect(caller().adminSetStatus({ sessionToken: SESSION, id: 1, status: "rejected", note: "" })).rejects.toThrow(/motif/i);
    await caller().adminSetStatus({ sessionToken: SESSION, id: 1, status: "rejected", note: "Immatriculation introuvable au registre." });
    await expect(caller().adminIssueProtocol({ sessionToken: SESSION, id: 1, terms: TERMS })).rejects.toThrow(/ne peut être émis/i);
  });
});

describe("signature du partenaire et contresignature de 3M", () => {
  const sign = (token: string, overrides: Record<string, unknown> = {}) =>
    caller().sign({ token, signatureName: "Awa Ndiaye", declarations: [true, true, true], ...overrides } as any);

  it("exige les trois déclarations et un nom de signataire", async () => {
    const { token } = await issued();
    await expect(sign(token, { declarations: [true, false, true] })).rejects.toThrow(/trois déclarations/i);
    await expect(sign(token, { signatureName: "Aw" })).rejects.toThrow();
    expect(rows(partnershipApplications)[0].status).toBe("protocol_issued");
  });

  it("enregistre la signature, produit le PDF signé, prévient l'administration et ne se rejoue pas", async () => {
    const { token, reference } = await issued();
    const result = await sign(token);
    expect(result).toEqual({ signed: true, reference });
    const row = rows(partnershipApplications)[0];
    expect(row).toMatchObject({ status: "partner_signed", partnerSignatureName: "Awa Ndiaye" });
    expect(row.partnerSignedAt).toBeInstanceOf(Date);
    const pdf = state.stored.find((item) => item.key.endsWith("protocole-signe-partenaire.pdf"));
    expect(pdf?.bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(state.notified.at(-1).title).toMatch(/à contresigner/);
    const mail = state.emails.at(-1);
    expect(mail.attachments[0].contentType).toBe("application/pdf");
    await expect(sign(token)).rejects.toThrow(/déjà été signé/i);
    const view = await caller().getForSigning({ token });
    expect(view.state).toBe("signed");
  });

  it("refuse un lien expiré", async () => {
    const { token } = await issued();
    rows(partnershipApplications)[0].signTokenExpiresAt = new Date(Date.now() - 1000);
    await expect(sign(token)).rejects.toThrow(/expiré/i);
    expect((await caller().getForSigning({ token })).state).toBe("expired");
  });

  it("n'active aucun partenaire, ni aucun suivi de commission, avant la contresignature", async () => {
    const { id, token } = await issued();
    await expect(caller().adminCountersign({ sessionToken: SESSION, id })).rejects.toThrow(/d’abord avoir signé/i);
    await sign(token);
    expect(rows(partnershipApplications)[0].status).toBe("partner_signed");
    expect(rows(ambassadors)).toHaveLength(0);
  });

  it("la contresignature active le partenaire et crée son suivi de parrainage au taux convenu", async () => {
    const { id, token } = await issued();
    await sign(token);
    const result = await caller().adminCountersign({ sessionToken: SESSION, id });
    expect(result.referralCode).toMatch(/^[A-Z2-9]{6}$/);
    const row = rows(partnershipApplications)[0];
    expect(row).toMatchObject({ status: "active", countersignedBy: "admin@3mtravelagency.com", referralCode: result.referralCode });
    expect(rows(ambassadors)[0]).toMatchObject({ commissionRateBps: 1500, status: "active", referralCode: result.referralCode, email: row.email });
    expect(state.stored.some((item) => item.key.endsWith("protocole-signe-final.pdf"))).toBe(true);
    expect(state.emails.at(-1).html).toContain(result.referralCode);
    // L'activation crée aussi l'espace partenaire : un seul lien actif, envoyé dans le même e-mail.
    expect(rows(partnershipSpaceLinks)).toHaveLength(1);
    expect(result.spaceLink).toContain("/partenariat/espace?token=");
    expect(state.emails.at(-1).html).toContain("/partenariat/espace?token=");
  });

  it("l'activation réussit même si l'espace partenaire (migration 0099) n'est pas encore disponible", async () => {
    const { id, token } = await issued();
    await sign(token);
    const original = state.tables.get(partnershipSpaceLinks);
    state.tables.set(partnershipSpaceLinks, new Proxy([], { get() { throw new Error("ER_NO_SUCH_TABLE: Table 'partnership_space_links' doesn't exist"); } }) as any);
    const result = await caller().adminCountersign({ sessionToken: SESSION, id });
    state.tables.set(partnershipSpaceLinks, original ?? []);
    expect(rows(partnershipApplications)[0].status).toBe("active");
    expect(result.spaceLink).toBeNull();
    expect(state.emails.at(-1).html).not.toContain("/partenariat/espace");
  });

  it("un ambassadeur déjà inscrit garde son code mais passe au taux du protocole", async () => {
    const { id, token } = await issued({ email: "awa.existante@agence-test.com" });
    state.tables.set(ambassadors, [{ id: 7, fullName: "Awa", email: "awa.existante@agence-test.com", referralCode: "ABC234", commissionRateBps: 500, status: "suspended", createdAt: new Date() }]);
    await sign(token);
    await caller().adminCountersign({ sessionToken: SESSION, id });
    expect(rows(ambassadors)).toHaveLength(1);
    expect(rows(ambassadors)[0]).toMatchObject({ referralCode: "ABC234", commissionRateBps: 1500, status: "active" });
  });

  it("suspendre un partenaire coupe aussi son suivi de parrainage et exige un motif", async () => {
    const { id, token } = await issued();
    await sign(token);
    await caller().adminCountersign({ sessionToken: SESSION, id });
    await expect(caller().adminSetStatus({ sessionToken: SESSION, id, status: "suspended", note: "" })).rejects.toThrow(/motif/i);
    await caller().adminSetStatus({ sessionToken: SESSION, id, status: "suspended", note: "Promesse de visa garanti relevée." });
    expect(rows(partnershipApplications)[0].status).toBe("suspended");
    expect(rows(ambassadors)[0].status).toBe("suspended");
  });

  it("le texte modifié après émission n'est jamais signé (contrôle d'empreinte)", async () => {
    const { token } = await issued();
    rows(partnershipApplications)[0].protocolText += "\n\nClause ajoutée en douce.";
    await expect(sign(token)).rejects.toThrow(/ne peut pas être vérifié/i);
    expect(rows(partnershipApplications)[0].status).toBe("protocol_issued");
  });
});

describe("administration du programme", () => {
  it("liste, filtre et compte les dossiers à traiter", async () => {
    await caller().submit(agency({ email: "a@agence-test.com" }) as any);
    await caller().submit(individual({ email: "b@example.com" }) as any);
    await caller().adminSetStatus({ sessionToken: SESSION, id: 2, status: "in_review" });
    expect(await caller().adminList({ sessionToken: SESSION })).toHaveLength(2);
    const reviewing = await caller().adminList({ sessionToken: SESSION, status: "in_review" });
    expect(reviewing.map((item) => item.reference)).toEqual(["PAR-2026-0002"]);
    expect(await caller().adminCounts({ sessionToken: SESSION })).toEqual({ toReview: 2, toCountersign: 0, awaitingSignature: 0 });
    const detail = await caller().adminGet({ sessionToken: SESSION, id: 1 });
    expect(detail.events.length).toBeGreaterThan(0);
    expect((detail as any).signTokenHash).toBeUndefined();
  });

  it("renvoie un lien de signature neuf et invalide l'ancien", async () => {
    const { id, token } = await issued();
    const resent = await caller().adminResendLink({ sessionToken: SESSION, id });
    await expect(caller().getForSigning({ token })).rejects.toThrow(/pas valide/i);
    expect((await caller().getForSigning({ token: tokenOf(resent.link) })).state).toBe("ready");
  });
});
