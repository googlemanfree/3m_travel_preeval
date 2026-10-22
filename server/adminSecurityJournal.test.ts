import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  exemptCount: 0,
  admins: [] as any[],
  lookupEmail: null as string | null,
  updates: [] as Array<{ table: any; values: any }>,
  inserts: [] as any[],
  twoFactorRequired: false,
  twoFactorValid: true,
  failedAttempts: 0,
  sentEmails: [] as Array<{ to: string; subject: string; html: string }>,
  nextEventId: 1,
}));

vi.mock("./db", async () => {
  const schema = await import("../drizzle/schema");
  return {
    getDb: async () => ({
      select: () => ({
        from: (table: any) => {
          if (table === schema.adminAccounts) {
            const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.lookupEmail ? state.admins.filter((candidate) => candidate.email === state.lookupEmail) : state.admins) };
            return chain;
          }
          // adminSessionEvents.innerJoin(adminAccounts) : jointure faite à la main sur l'état en mémoire.
          const chain: any = {
            innerJoin: () => chain,
            where: () => chain,
            orderBy: () => chain,
            limit: async () => state.inserts.map((row) => {
              const admin = state.admins.find((candidate) => candidate.id === row.adminId);
              return { id: row.id, eventType: row.eventType, createdAt: row.createdAt, adminEmail: admin?.email, adminFullName: admin?.fullName };
            }),
          };
          return chain;
        },
      }),
      update: () => ({ set: (values: any) => ({ where: async () => { state.updates.push(values); } }) }),
      insert: () => ({ values: async (values: any) => { state.inserts.push({ id: state.nextEventId++, createdAt: new Date(), ...values }); } }),
    }),
  };
});
vi.mock("bcryptjs", () => ({ default: { compare: async (password: string, hash: string) => password === "correct" && hash === "hash", hash: async () => "hash" } }));
vi.mock("./_core/email", () => ({
  sendEmail: async (options: { to: string; subject: string; html: string }) => { state.sentEmails.push(options); },
}));
vi.mock("./twoFactor", () => ({
  getTwoFactorStatus: async () => ({ enabled: state.twoFactorRequired, enrolledAt: null }),
  verifyTwoFactor: async () => ({ required: state.twoFactorRequired, valid: state.twoFactorValid, recovery: false }),
  beginTwoFactorEnrollment: async () => ({}),
  confirmTwoFactorEnrollment: async () => ({}),
}));
vi.mock("./loginAttemptsService", () => ({
  checkLoginAttempts: () => undefined,
  recordExemptLoginAttempt: () => {
    state.exemptCount += 1;
    return state.exemptCount === 3;
  },
  recordFailedAttempt: () => { state.failedAttempts += 1; },
  resetExemptLoginAttempts: () => undefined,
  resetLoginAttempts: () => undefined,
  recordSlowdownFailure: () => undefined,
  resetSlowdown: () => undefined,
  slowdownDelayMs: () => 0,
  getLoginAttemptStatus: () => ({ remainingAttempts: 2, maxAttempts: 3, lockedUntil: null }),
  scopedLoginIdentifier: (scope: string, identifier: string) => `${scope}:${identifier.trim().toLowerCase()}`,
}));

import { adminAuthRouter } from "./routers/adminAuth";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const fakeRes = () => ({ cookie: vi.fn(), clearCookie: vi.fn() });
const caller = () => adminAuthRouter.createCaller({ req: { headers: {} }, res: fakeRes() } as any);

const admin = (overrides: Record<string, unknown> = {}) => ({ id: 7, email: "agent@3mtravelagency.com", fullName: "Agent 3M", passwordHash: "hash", status: "active", adminType: "accompagnement", requiresPasswordChange: false, sessionToken: "tok-agent", sessionExpiresAt: new Date(Date.now() + 3_600_000), ...overrides });

beforeEach(() => {
  state.exemptCount = 0;
  state.admins = [admin()];
  state.lookupEmail = null;
  state.updates = [];
  state.inserts = [];
  state.twoFactorRequired = false;
  state.twoFactorValid = true;
  state.failedAttempts = 0;
  state.sentEmails = [];
  state.nextEventId = 1;
});
afterEach(() => vi.restoreAllMocks());

describe("connexion admin : journal des échecs", () => {
  it("mot de passe incorrect sur un compte connu : « login_failed » journalisé avec le bon compte, jamais le mot de passe", async () => {
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "faux" })).rejects.toThrow(/incorrect/);
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({ adminId: 7, eventType: "login_failed" });
    expect(JSON.stringify(state.inserts[0])).not.toContain("faux");
  });

  it("adresse e-mail inconnue : rien n'est écrit en base (aucun compte auquel rattacher l'événement)", async () => {
    state.admins = [];
    await expect(caller().login({ email: "inconnu@example.com", password: "peu-importe" })).rejects.toThrow();
    expect(state.inserts).toHaveLength(0);
  });

  it("compte désactivé : « login_blocked » journalisé", async () => {
    state.admins = [admin({ status: "suspended" })];
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "correct" })).rejects.toThrow(/désactivé/);
    expect(state.inserts[0]).toMatchObject({ eventType: "login_blocked" });
  });

  it("code à deux étapes non fourni (redemande) : PAS un échec journalisé ; code fourni et invalide : « twofactor_failed »", async () => {
    state.twoFactorRequired = true;
    state.twoFactorValid = false;
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "correct" })).rejects.toThrow(/TOTP_REQUIRED/);
    expect(state.inserts).toHaveLength(0);
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "correct", twoFactorCode: "000000" })).rejects.toThrow(/Code 2FA invalide/);
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({ eventType: "twofactor_failed" });
  });

  it("isole les tentatives admin et ne compte pas le premier affichage du 2FA", () => {
    const source = read("server/routers/adminAuth.ts");
    expect(source).toContain('scopedLoginIdentifier("admin", input.email)');
    expect(source).toContain("if (input.twoFactorCode && !lockoutExempt) recordFailedAttempt(loginIdentifier);");
  });

  it("ne verrouille plus aucun administrateur (verrouillage désactivé à la demande de la direction)", async () => {
    state.admins = [admin({ email: "aureoldonfack@gmail.com" })];
    await expect(caller().login({ email: "aureoldonfack@gmail.com", password: "faux" })).rejects.toThrow(/incorrect/);
    await expect(caller().login({ email: "aureoldonfack@gmail.com", password: "faux" })).rejects.toThrow(/incorrect/);
    expect(state.failedAttempts).toBe(0);

    state.admins = [admin()];
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "faux" })).rejects.toThrow(/incorrect/);
    await expect(caller().login({ email: "agent@3mtravelagency.com", password: "faux" })).rejects.toThrow(/incorrect/);
    expect(state.failedAttempts).toBe(0);
  });

  it("expose un compteur non sensible et masque la limite du super administrateur", async () => {
    await expect(caller().loginAttemptStatus({ email: "agent@3mtravelagency.com" })).resolves.toMatchObject({
      exempt: true,
      remainingAttempts: null,
      maxAttempts: null,
      locked: false,
    });
    await expect(caller().loginAttemptStatus({ email: "aureoldonfack@gmail.com" })).resolves.toMatchObject({
      exempt: true,
      remainingAttempts: null,
      maxAttempts: null,
      locked: false,
    });
  });

  it("envoie une alerte unique après trois échecs du compte exempté", async () => {
    state.admins = [admin({ email: "aureoldonfack@gmail.com" })];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(caller().login({ email: "aureoldonfack@gmail.com", password: "faux" })).rejects.toThrow(/incorrect/);
    }
    expect(state.sentEmails).toHaveLength(1);
    expect(state.sentEmails[0]).toMatchObject({ to: "aureoldonfack@gmail.com" });
    expect(state.sentEmails[0].html).not.toContain("faux");
  });

  it("connexion réussie : toujours seulement « login », comme avant", async () => {
    const result = await caller().login({ email: "agent@3mtravelagency.com", password: "correct" });
    expect(result.success).toBe(true);
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({ eventType: "login" });
  });
});

describe("journal de sécurité de l'équipe (listSecurityEvents)", () => {
  it("session admin requise avant toute lecture, en base avant l'appel de getDb ; routeur enregistré", () => {
    const source = read("server/routers/adminAuth.ts");
    const start = source.indexOf("listSecurityEvents: publicProcedure");
    const section = source.slice(start, start + 1400);
    expect(section.indexOf("requireSuperAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect(section.indexOf("requireSuperAdminSession(input.sessionToken)")).toBeLessThan(section.indexOf("getDb()"));
    expect(section).toContain("inArray(adminSessionEvents.eventType");
  });

  it("relie chaque événement à l'admin concerné (nom et e-mail), pas seulement un identifiant", async () => {
    state.admins = [
      admin({ id: 7, email: "agent@3mtravelagency.com", fullName: "Agent 3M" }),
      admin({ id: 8, email: "aureoldonfack@gmail.com", fullName: "Aureol DONFACK", sessionToken: "t" }),
    ];
    state.lookupEmail = "agent@3mtravelagency.com";
    await caller().login({ email: "agent@3mtravelagency.com", password: "faux" }).catch(() => undefined);
    state.lookupEmail = "aureoldonfack@gmail.com";
    const events = await caller().listSecurityEvents({ sessionToken: "t" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ eventType: "login_failed", adminEmail: "agent@3mtravelagency.com", adminFullName: "Agent 3M" });
  });

  it("réserve les opérations sensibles au super administrateur identifié", () => {
    const source = read("server/routers/adminAuth.ts");
    const body = source.slice(source.indexOf("export async function requireSuperAdminSession"), source.indexOf("export async function requireSuperAdminSession") + 500);
    expect(source).toContain('export const SUPER_ADMIN_EMAIL = "aureoldonfack@gmail.com";');
    expect(body).toContain("admin.email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL");
    expect(body).toContain("Cette action est réservée au super administrateur.");
  });

  it("protège la remise à zéro ciblée par le super administrateur", () => {
    const source = read("server/routers/adminAuth.ts");
    const start = source.indexOf("resetLoginAttemptCounter: publicProcedure");
    const section = source.slice(start, start + 1400);
    expect(section).toContain("requireSuperAdminSession(input.sessionToken)");
    expect(section).toContain("resetLoginAttempts(scopedLoginIdentifier(\"admin\", target.email))");
    expect(section).toContain("actor.id === input.adminId");
  });

  it("branche le tableau de sécurité et le bouton de remise à zéro dans les interfaces admin", () => {
    const adminsPage = read("client/src/pages/AdminsList.tsx");
    const loginPage = read("client/src/pages/AdminLogin.tsx");
    expect(adminsPage).toContain("<AdminSecurityJournal sessionToken={sessionToken} />");
    expect(adminsPage).toContain("Réinitialiser tentatives");
    expect(loginPage).toContain("trpc.adminAuth.loginAttemptStatus.useQuery");
    expect(loginPage).toContain("Tentatives restantes avant verrouillage");
  });
});
