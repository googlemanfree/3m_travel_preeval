import { afterEach, describe, expect, it } from "vitest";
import {
  checkLoginAttempts,
  recordFailedAttempt,
  getLoginAttemptStatus,
  resetLoginAttempts,
  scopedLoginIdentifier,
} from "./loginAttemptsService";

describe("isolation des verrouillages de connexion", () => {
  const identifiers: string[] = [];

  afterEach(() => {
    identifiers.forEach(resetLoginAttempts);
    identifiers.length = 0;
  });

  it("sépare les mêmes e-mails entre admin, candidat et employeur", () => {
    const email = " Agent@Example.com ";
    const admin = scopedLoginIdentifier("admin", email);
    const candidate = scopedLoginIdentifier("candidate", email);
    const employer = scopedLoginIdentifier("employer", email);
    identifiers.push(admin, candidate, employer);

    expect(admin).toBe("admin:agent@example.com");
    expect(new Set([admin, candidate, employer]).size).toBe(3);
  });

  it("ne bloque pas un autre espace quand l’admin atteint sa limite", () => {
    const admin = scopedLoginIdentifier("admin", "same@example.com");
    const candidate = scopedLoginIdentifier("candidate", "same@example.com");
    identifiers.push(admin, candidate);

    recordFailedAttempt(admin);
    recordFailedAttempt(admin);
    recordFailedAttempt(admin);

    expect(() => checkLoginAttempts(admin)).toThrow(/Compte bloqué/);
    expect(() => checkLoginAttempts(candidate)).not.toThrow();
  });

  it("expose les tentatives restantes puis revient au maximum après reset", () => {
    const admin = scopedLoginIdentifier("admin", "reset@example.com");
    identifiers.push(admin);
    recordFailedAttempt(admin);
    expect(getLoginAttemptStatus(admin)).toMatchObject({ remainingAttempts: 2, maxAttempts: 3, lockedUntil: null });
    resetLoginAttempts(admin);
    expect(getLoginAttemptStatus(admin)).toMatchObject({ remainingAttempts: 3, maxAttempts: 3, lockedUntil: null });
  });
});
