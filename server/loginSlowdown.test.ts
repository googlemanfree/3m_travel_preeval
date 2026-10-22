import { describe, expect, it } from "vitest";
import { recordSlowdownFailure, resetSlowdown, runExclusiveLogin, slowdownDelayMs } from "./loginAttemptsService";

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

describe("une seule tentative à la fois par compte", () => {
  it("refuse une tentative simultanée sur le même compte, accepte les autres comptes et la suivante", async () => {
    let release: () => void = () => undefined;
    const slow = runExclusiveLogin("admin:a@example.com", () => new Promise<string>((resolve) => { release = () => resolve("ok"); }));
    await expect(runExclusiveLogin("admin:a@example.com", async () => "parallèle")).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(runExclusiveLogin("admin:b@example.com", async () => "autre compte")).resolves.toBe("autre compte");
    release();
    await expect(slow).resolves.toBe("ok");
    await expect(runExclusiveLogin("admin:a@example.com", async () => "suivante")).resolves.toBe("suivante");
  });

  it("libère le compte même si la tentative échoue", async () => {
    await expect(runExclusiveLogin("admin:c@example.com", async () => { throw new Error("mot de passe faux"); })).rejects.toThrow("mot de passe faux");
    await expect(runExclusiveLogin("admin:c@example.com", async () => "libre")).resolves.toBe("libre");
  });
});
