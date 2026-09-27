import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admins: [] as any[],
  updates: [] as Array<{ table: any; values: any }>,
  inserts: [] as any[],
  twoFactorRequired: false,
  twoFactorValid: true,
  nextEventId: 1,
}));

vi.mock("./db", async () => {
  const schema = await import("../drizzle/schema");
  return {
    getDb: async () => ({
      select: () => ({
        from: (table: any) => {
          if (table === schema.adminAccounts) {
            const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.admins) };
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
vi.mock("./twoFactor", () => ({
  getTwoFactorStatus: async () => ({ enabled: state.twoFactorRequired, enrolledAt: null }),
  verifyTwoFactor: async () => ({ required: state.twoFactorRequired, valid: state.twoFactorValid, recovery: false }),
  beginTwoFactorEnrollment: async () => ({}),
  confirmTwoFactorEnrollment: async () => ({}),
}));
vi.mock("./loginAttemptsService", () => ({ checkLoginAttempts: () => undefined, recordFailedAttempt: () => undefined, resetLoginAttempts: () => undefined }));

import { adminAuthRouter } from "./routers/adminAuth";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const fakeRes = () => ({ cookie: vi.fn(), clearCookie: vi.fn() });
const caller = () => adminAuthRouter.createCaller({ req: { headers: {} }, res: fakeRes() } as any);

const admin = (overrides: Record<string, unknown> = {}) => ({ id: 7, email: "agent@3mtravelagency.com", fullName: "Agent 3M", passwordHash: "hash", status: "active", adminType: "accompagnement", requiresPasswordChange: false, sessionToken: "tok-agent", sessionExpiresAt: new Date(Date.now() + 3_600_000), ...overrides });

beforeEach(() => {
  state.admins = [admin()];
  state.updates = [];
  state.inserts = [];
  state.twoFactorRequired = false;
  state.twoFactorValid = true;
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
    const section = source.slice(start, start + 1000);
    expect(section.indexOf("requireSuperAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect(section.indexOf("requireSuperAdminSession(input.sessionToken)")).toBeLessThan(section.indexOf("getDb()"));
    expect(section).toContain("inArray(adminSessionEvents.eventType");
  });

  it("relie chaque événement à l'admin concerné (nom et e-mail), pas seulement un identifiant", async () => {
    await caller().login({ email: "agent@3mtravelagency.com", password: "faux" }).catch(() => undefined);
    const events = await caller().listSecurityEvents({ sessionToken: "t" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ eventType: "login_failed", adminEmail: "agent@3mtravelagency.com", adminFullName: "Agent 3M" });
  });

  it("mêmes règles d'accès que le reste de l'administration (session admin valide, pas de rôle à part)", () => {
    const source = read("server/routers/adminAuth.ts");
    const body = source.slice(source.indexOf("export async function requireSuperAdminSession"), source.indexOf("export async function requireSuperAdminSession") + 200);
    expect(body).toContain("return requireValidAdminSession(sessionToken);");
  });
});
