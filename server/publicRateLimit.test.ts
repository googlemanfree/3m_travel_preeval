import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EVALUATION_SUBMISSION_LIMITS, clientKeyOf, createFixedWindowLimiter, createSubmissionGuard } from "./_core/publicRateLimit";
import { evaluationRouter, evaluationSubmissionGuard } from "./routers/evaluation";

const HOUR = 60 * 60_000;
const req = (ip: string) => ({ headers: { "x-forwarded-for": ip } });

describe("limiteur à fenêtre fixe", () => {
  it("accepte jusqu'à la limite, refuse ensuite avec un délai, puis repart à la fin de la fenêtre", () => {
    const limiter = createFixedWindowLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("a", 0)).toEqual({ allowed: true });
    expect(limiter.check("a", 100)).toEqual({ allowed: true });
    expect(limiter.check("a", 200)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.check("b", 200)).toEqual({ allowed: true }); // une autre clé n'est pas touchée
    expect(limiter.check("a", 1000)).toEqual({ allowed: true }); // fenêtre écoulée
  });

  it("reste borné sous une attaque à clés uniques", () => {
    const limiter = createFixedWindowLimiter({ limit: 1, windowMs: HOUR, maxKeys: 50 });
    for (let index = 0; index < 5000; index++) limiter.check(`ip-${index}`, 0);
    expect(limiter.size()).toBeLessThanOrEqual(50);
  });
});

describe("identification du client", () => {
  it("prend la première adresse de x-forwarded-for, sinon l'adresse du socket, sinon rien", () => {
    expect(clientKeyOf({ headers: { "x-forwarded-for": "41.202.1.1, 10.0.0.1" } })).toBe("41.202.1.1");
    expect(clientKeyOf({ headers: {}, socket: { remoteAddress: "10.1.1.1" } })).toBe("10.1.1.1");
    expect(clientKeyOf({ headers: {} })).toBeNull();
    expect(clientKeyOf(undefined)).toBeNull();
  });
});

describe("garde des formulaires publics", () => {
  const options = { perClient: { limit: 2, windowMs: HOUR }, perEmail: { limit: 2, windowMs: HOUR }, global: { limit: 5, windowMs: HOUR } };

  it("refuse la troisième demande d'une même connexion, avec un message clair", () => {
    const guard = createSubmissionGuard(options);
    guard.assertAllowed(req("1.1.1.1"), "a@example.com", 0);
    guard.assertAllowed(req("1.1.1.1"), "b@example.com", 1);
    expect(() => guard.assertAllowed(req("1.1.1.1"), "c@example.com", 2)).toThrowError(/Trop de demandes envoyées depuis votre connexion/);
    expect(() => guard.assertAllowed(req("2.2.2.2"), "c@example.com", 3)).not.toThrow(); // autre connexion
  });

  it("protège une adresse e-mail contre l'envoi répété de messages de réception, même depuis des connexions différentes", () => {
    const guard = createSubmissionGuard(options);
    guard.assertAllowed(req("1.1.1.1"), "victime@example.com", 0);
    guard.assertAllowed(req("2.2.2.2"), "Victime@Example.com ", 1); // casse et espaces ignorés
    expect(() => guard.assertAllowed(req("3.3.3.3"), "victime@example.com", 2)).toThrowError(/cette adresse e-mail/);
  });

  it("borne le total même si l'en-tête d'adresse est falsifié à chaque requête", () => {
    const guard = createSubmissionGuard(options);
    for (let index = 0; index < 5; index++) guard.assertAllowed(req(`9.9.9.${index}`), `u${index}@example.com`, index);
    expect(() => guard.assertAllowed(req("9.9.9.99"), "nouveau@example.com", 10)).toThrowError(/Trop de demandes/);
  });

  it("annonce le délai en minutes quand il est long, et rouvre après la fenêtre", () => {
    const guard = createSubmissionGuard(options);
    guard.assertAllowed(req("1.1.1.1"), "a@example.com", 0);
    guard.assertAllowed(req("1.1.1.1"), "b@example.com", 0);
    expect(() => guard.assertAllowed(req("1.1.1.1"), "c@example.com", 60_000)).toThrowError(/59 minutes/);
    expect(() => guard.assertAllowed(req("1.1.1.1"), "c@example.com", HOUR + 1)).not.toThrow();
  });

  it("ne limite pas un appel sans adresse identifiable (test, appel interne)", () => {
    const guard = createSubmissionGuard(options);
    for (let index = 0; index < 20; index++) guard.assertAllowed({ headers: {} }, "meme@example.com", index);
    guard.assertAllowed(undefined, "meme@example.com", 0);
  });

  it("a des réglages d'évaluation qui laissent passer un usage normal", () => {
    expect(EVALUATION_SUBMISSION_LIMITS.perClient.limit).toBeGreaterThanOrEqual(5); // famille ou agence derrière une même connexion
    expect(EVALUATION_SUBMISSION_LIMITS.perEmail.limit).toBeGreaterThanOrEqual(2);
    expect(EVALUATION_SUBMISSION_LIMITS.global.limit).toBeGreaterThan(EVALUATION_SUBMISSION_LIMITS.perClient.limit);
  });
});

describe("formulaires d'évaluation publics : refus AVANT tout accès à la base", () => {
  const input = { fullName: "Jean Dupont", email: "limite@example.com", phone: "+237698104832", destinationCategory: "canada" as const, visaType: "canada_rp" as const };

  it("submit renvoie TOO_MANY_REQUESTS quand la connexion a épuisé sa limite (et non une erreur de base de données)", async () => {
    evaluationSubmissionGuard.reset();
    const request = req("77.77.77.77");
    for (let index = 0; index < EVALUATION_SUBMISSION_LIMITS.perClient.limit; index++) evaluationSubmissionGuard.assertAllowed(request, `pre${index}@example.com`);
    const caller = evaluationRouter.createCaller({ req: request } as never);
    await expect(caller.submit(input)).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    evaluationSubmissionGuard.reset();
  });

  it("submit et submitEvaluation appellent la garde en premier, avant la base", () => {
    const source = readFileSync(resolve(import.meta.dirname, "routers/evaluation.ts"), "utf8");
    for (const name of ["submitEvaluation", "submit"]) {
      const start = source.indexOf(`  ${name}: publicProcedure`);
      expect(start, name).toBeGreaterThan(-1);
      const body = source.slice(start, start + 600);
      expect(body.indexOf("evaluationSubmissionGuard.assertAllowed(ctx?.req, input.email)"), name).toBeGreaterThan(-1);
      expect(body.indexOf("evaluationSubmissionGuard.assertAllowed"), name).toBeLessThan(body.indexOf("await getDb()"));
    }
  });
});
