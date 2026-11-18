import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ dbCalls: 0 }));
vi.mock("./db", () => ({ getDb: async () => { state.dbCalls += 1; return null; } }));

import { insuranceRequestsRouter, insuranceSubmissionGuard } from "./routers/insuranceRequests";

const traveler = { fullName: "Voyageur Test", dateOfBirth: "1990-01-01", nationality: "Camerounaise", passportNumber: "AB123456" };
const request = (overrides: Record<string, unknown> = {}) => ({
  fullName: "Voyageur Test", email: "voyageur@example.com", phone: "+237600000000", dateOfBirth: "1990-01-01", nationality: "Camerounaise", passportNumber: "AB123456",
  residenceCountry: "Cameroun", destinationCountry: "France", departureDate: "2026-12-01", returnDate: "2026-12-15", tripPurpose: "Tourisme", coveragePlan: "Essentiel",
  travelers: [traveler], emergencyContactName: "Proche Test", emergencyContactPhone: "+237611111111", acceptedConsent: true as const, ...overrides,
});
let ip = 0;
const caller = () => insuranceRequestsRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: `10.8.0.${++ip}` } } } as any);

describe("demande d'assurance voyage : formulaire public", () => {
  it("champ piège rempli : aucun accès à la base, aucun coupon, réponse d'un succès", async () => {
    const before = state.dbCalls;
    const result = await caller().create(request({ website: "https://spam.example" }));
    expect(state.dbCalls).toBe(before);
    expect(result).toMatchObject({ couponReady: false, requestId: 0 });
  });

  it("est plafonné par adresse e-mail : au-delà de la limite, la demande est refusée (429)", async () => {
    insuranceSubmissionGuard.reset?.();
    const email = `limite${Date.now()}@example.com`;
    let refused: unknown = null;
    for (let attempt = 0; attempt < 6 && !refused; attempt += 1) {
      try { await caller().create(request({ email })); } catch (error) { refused = error; }
    }
    // la base est indisponible (null) : les premières tentatives échouent en INTERNAL_SERVER_ERROR, la limite finit par répondre TOO_MANY_REQUESTS
    expect((refused as { code?: string } | null)?.code).toBeTruthy();
    let limited: { code?: string } | null = null;
    for (let attempt = 0; attempt < 6 && limited?.code !== "TOO_MANY_REQUESTS"; attempt += 1) {
      try { await caller().create(request({ email })); } catch (error) { limited = error as { code?: string }; }
    }
    expect(limited?.code).toBe("TOO_MANY_REQUESTS");
  });
});

describe("pièges à robots côté pages", () => {
  const read = (path: string) => readFileSync(resolve(import.meta.dirname, path), "utf8");
  it("l'assurance et les avis contiennent le champ piège et le transmettent au serveur", () => {
    expect(read("../client/src/pages/AssuranceInscription.tsx")).toContain("<HoneypotField");
    expect(read("../client/src/pages/AssuranceInscription.tsx")).toContain('website: String(form.get("website") || "")');
    expect(read("../client/src/pages/SubmitReview.tsx")).toContain("<HoneypotField");
    expect(read("../client/src/pages/SubmitReview.tsx")).toContain("website: honeypot");
    const field = read("../client/src/components/HoneypotField.tsx");
    expect(field).toContain('tabIndex={-1}');
    expect(field).toContain('aria-hidden="true"');
    expect(field).toContain('name="website"');
  });
});
