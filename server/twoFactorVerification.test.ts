import bcrypt from "bcryptjs";
import { generate } from "otplib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ factor: null as null | Record<string, unknown>, codes: [] as Array<Record<string, unknown>>, used: [] as number[] }));

vi.mock("./db", async () => {
  const schema = await import("../drizzle/schema");
  const rows = (table: unknown) => (table === schema.securityTotpFactors ? (state.factor ? [state.factor] : []) : state.codes.filter((code) => !state.used.includes(code.id as number)));
  return {
    getDb: async () => ({
      select: () => ({ from: (table: unknown) => ({ where: () => Object.assign(Promise.resolve(rows(table)), { limit: async () => rows(table).slice(0, 1) }) }) }),
      insert: (table: unknown) => ({ values: async (values: Record<string, unknown> | Array<Record<string, unknown>>) => { if (table === schema.securityTotpFactors) state.factor = { id: 1, enabled: false, ...(values as Record<string, unknown>) }; } }),
      update: (table: unknown) => ({ set: (values: Record<string, unknown>) => ({ where: async () => { if (table === schema.securityTotpFactors && state.factor) state.factor = { ...state.factor, ...values }; if (table === schema.securityRecoveryCodes) state.used.push(1); } }) }),
      delete: () => ({ where: async () => undefined }),
    }),
  };
});

import { beginTwoFactorEnrollment, confirmTwoFactorEnrollment, isTotpFormat, verifyTwoFactor } from "./twoFactor";

async function enroll() {
  const { otpAuthUri } = await beginTwoFactorEnrollment("admin", 7, "admin@example.com");
  const secret = new URL(otpAuthUri).searchParams.get("secret")!;
  const confirmed = await confirmTwoFactorEnrollment("admin", 7, await generate({ secret }));
  return { secret, recoveryCodes: confirmed.recoveryCodes };
}

beforeEach(() => { state.factor = null; state.codes = []; state.used = []; });

describe("double authentification — jamais d'erreur interne sur un code absent ou mal formé", () => {
  it("un compte sans 2FA n'exige rien", async () => {
    expect(await verifyTwoFactor("admin", 7, "")).toEqual({ required: false, valid: true, recovery: false });
  });

  it("un code absent demande le code (required, non valide) au lieu de planter", async () => {
    await enroll();
    expect(await verifyTwoFactor("admin", 7, "")).toEqual({ required: true, valid: false, recovery: false });
    expect(await verifyTwoFactor("admin", 7, "   ")).toEqual({ required: true, valid: false, recovery: false });
  });

  it("un code mal formé est refusé proprement", async () => {
    await enroll();
    for (const token of ["12", "abcdef", "1234567", "ABCD-EF12-3456"]) {
      expect(await verifyTwoFactor("admin", 7, token), token).toEqual({ required: true, valid: false, recovery: false });
    }
  });

  it("un code d'application valide ouvre la session", async () => {
    const { secret } = await enroll();
    expect(await verifyTwoFactor("admin", 7, await generate({ secret }))).toEqual({ required: true, valid: true, recovery: false });
  });

  it("un code de secours (autre format que six chiffres) est accepté une fois", async () => {
    const { recoveryCodes } = await enroll();
    state.codes = [{ id: 1, codeHash: await bcrypt.hash(recoveryCodes[0], 4) }];
    expect(await verifyTwoFactor("admin", 7, recoveryCodes[0].toLowerCase())).toEqual({ required: true, valid: true, recovery: true });
    expect(await verifyTwoFactor("admin", 7, recoveryCodes[0])).toEqual({ required: true, valid: false, recovery: false });
  });

  it("la confirmation d'enrôlement refuse un code mal formé avec un message lisible", async () => {
    await beginTwoFactorEnrollment("admin", 7, "admin@example.com");
    await expect(confirmTwoFactorEnrollment("admin", 7, "abc")).rejects.toThrow("Code d’authentification invalide.");
    await expect(confirmTwoFactorEnrollment("admin", 7, "")).rejects.toThrow("Code d’authentification invalide.");
  });

  it("reconnaît le format d'un code d'application", () => {
    expect(isTotpFormat("123456")).toBe(true);
    expect(["", "12345", "1234567", "12 456", "ABCDEF"].some(isTotpFormat)).toBe(false);
  });
});
