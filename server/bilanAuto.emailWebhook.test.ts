import { describe, expect, it } from "vitest";
import { processEmailWebhook, signBody, verifySignature } from "./services/bilanAuto/emailWebhook";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { applyDeliveryEvent } from "./services/bilanAuto/pipeline";
import type { NewRun } from "./services/bilanAuto/types";

const SECRET = "secret-de-test-0123456789-abcdef";
const body = (over: Record<string, unknown> = {}) => Buffer.from(JSON.stringify({ eventId: "evt-1", messageId: "m-1", type: "delivered", ...over }));

describe("webhook de livraison e-mail", () => {
  it("vérifie la signature HMAC du corps brut (avec ou sans préfixe sha256=)", () => {
    const raw = body();
    expect(verifySignature(SECRET, raw, signBody(SECRET, raw))).toBe(true);
    expect(verifySignature(SECRET, raw, `sha256=${signBody(SECRET, raw)}`)).toBe(true);
    expect(verifySignature(SECRET, raw, signBody("autre-secret-0123456789-abcdef", raw))).toBe(false);
    expect(verifySignature(SECRET, body({ type: "bounced" }), signBody(SECRET, raw))).toBe(false); // corps modifié
    expect(verifySignature(SECRET, raw, undefined)).toBe(false);
    expect(verifySignature(SECRET, raw, "zz")).toBe(false);
    expect(verifySignature("court", raw, signBody("court", raw))).toBe(false); // secret trop faible refusé
  });

  it("refuse sans secret (503), sans signature valide (401), événement mal formé (400) — sans rien appliquer", async () => {
    let applied = 0;
    const apply = async () => { applied += 1; return true; };
    const raw = body();
    expect((await processEmailWebhook({ rawBody: raw, signature: signBody(SECRET, raw), secret: undefined, apply })).status).toBe(503);
    expect((await processEmailWebhook({ rawBody: raw, signature: "0".repeat(64), secret: SECRET, apply })).status).toBe(401);
    const bad = Buffer.from(JSON.stringify({ eventId: "e", messageId: "m", type: "opened", extra: 1 }));
    expect((await processEmailWebhook({ rawBody: bad, signature: signBody(SECRET, bad), secret: SECRET, apply })).status).toBe(400);
    expect(applied).toBe(0);
    expect((await processEmailWebhook({ rawBody: raw, signature: signBody(SECRET, raw), secret: SECRET, apply })).body).toEqual({ ok: true, applied: true });
  });

  async function setup() {
    const store = new MemoryBilanAutoStore(() => new Date());
    const run = (await store.insertRun({
      evaluationId: 1, candidateId: 7, dossierRef: null, submissionId: "1", inputVersion: "v", rubricVersion: "r", promptVersion: "p", model: null, idempotencyKey: "k", mode: "validation_admin", state: "published", attempts: 0, maxAttempts: 4,
      nextAttemptAt: null, lockedBy: null, lockedAt: null, lastError: null, outcome: "A", score: 70, scoreMax: 100, thresholdReached: true,
      inputSnapshot: { form: {}, cv: { key: null, fileName: null, sha256: null }, documents: [], consents: { cv: true }, referenceDate: "2026-11-13", rubricVersion: "r", promptVersion: "p" },
      facts: null, scoreResult: null, orientations: null, report: null, reportHash: null, pdfKey: null, complement: null, previous: null, flags: [], reviewStatus: "validated", validatedBy: "a", validatedAt: null,
      publishedAt: null, notificationState: "accepted_by_provider", supersededById: null, costEur: null, tokensUsed: null,
    } as NewRun))!;
    const entry = (await store.enqueueOutbox({ runId: run.id, dedupKey: "d", channel: "email", recipient: "a@b.c", kind: "bilan_publie" }))!;
    await store.updateOutbox(entry.id, { state: "accepted_by_provider", providerMessageId: "m-1" });
    return { store, run, entry };
  }

  it("applique « délivré » une fois, ignore le doublon et l'identifiant inconnu", async () => {
    const { store, run } = await setup();
    const deps = { store, now: () => new Date() };
    const seen = new Set<string>();
    expect(await applyDeliveryEvent(deps, { providerMessageId: "m-1", type: "delivered", eventId: "e1" }, seen)).toBe(true);
    expect((await store.getRun(run.id))!.notificationState).toBe("delivered");
    expect(await applyDeliveryEvent(deps, { providerMessageId: "m-1", type: "delivered", eventId: "e2" }, new Set())).toBe(false); // même état, autre événement
    expect(await applyDeliveryEvent(deps, { providerMessageId: "inconnu", type: "delivered", eventId: "e3" }, seen)).toBe(false);
  });

  it("un rebond n'est jamais effacé par un événement ultérieur", async () => {
    const { store, run } = await setup();
    const deps = { store, now: () => new Date() };
    await applyDeliveryEvent(deps, { providerMessageId: "m-1", type: "bounced", eventId: "b1" }, new Set());
    expect(await applyDeliveryEvent(deps, { providerMessageId: "m-1", type: "delivered", eventId: "b2" }, new Set())).toBe(false);
    expect((await store.getRun(run.id))!.notificationState).toBe("bounced");
  });
});
