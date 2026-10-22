import { describe, expect, it } from "vitest";
import { recordSlowdownFailure, resetSlowdown, slowdownDelayMs } from "./loginAttemptsService";

describe("ralentissement progressif de la connexion (sans blocage)", () => {
  const id = "admin:test@example.com";
  const t0 = 1_000_000;

  it("n'attend pas avant la 3e erreur, puis 1 s de plus à chaque erreur, plafonné à 5 s", () => {
    resetSlowdown(id);
    expect(slowdownDelayMs(id, t0)).toBe(0);
    recordSlowdownFailure(id, t0);
    recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs(id, t0)).toBe(0);
    recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs(id, t0)).toBe(1000);
    recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs(id, t0)).toBe(2000);
    for (let i = 0; i < 20; i += 1) recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs(id, t0)).toBe(5000);
  });

  it("repart de zéro après 15 minutes sans erreur ou après une connexion réussie", () => {
    resetSlowdown(id);
    for (let i = 0; i < 5; i += 1) recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs(id, t0 + 15 * 60 * 1000)).toBe(0);
    expect(slowdownDelayMs(id, t0)).toBeGreaterThan(0);
    resetSlowdown(id);
    expect(slowdownDelayMs(id, t0)).toBe(0);
  });

  it("ne bloque jamais : un identifiant lent reste libre de réessayer, et les autres ne sont pas touchés", () => {
    resetSlowdown(id);
    for (let i = 0; i < 10; i += 1) recordSlowdownFailure(id, t0);
    expect(slowdownDelayMs("admin:autre@example.com", t0)).toBe(0);
  });
});
