import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-only-jwt-secret-0123456789abcdef";
  return { sent: [] as Array<Record<string, unknown>> };
});

vi.mock("./db", () => ({ getDb: vi.fn(async () => ({})) }));
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn(async (message: Record<string, unknown>) => {
    state.sent.push(message);
  }),
}));

import { flightsRouter } from "./routers/flights";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const caller = () => flightsRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: "10.0.0.4" } } } as any);
const flightDetails = {
  airlineName: "Air Test",
  flightNumber: "AT100",
  origin: "DLA",
  destination: "CDG",
  departureDate: "2026-12-01",
  departureTime: "10:00",
  arrivalTime: "18:00",
  duration: "8h",
  stops: 0,
  cabinClass: "economy",
  totalPrice: 450000,
  pnrRef: "ABC123",
};

/**
 * `flights.sendFlightSummaryEmail` est publique et envoie un e-mail aux couleurs de l'agence à l'adresse saisie,
 * avec du texte fourni par l'appelant : sans plafond, c'était un relais de spam et d'hameçonnage.
 */
describe("flights.sendFlightSummaryEmail : plafond d'envois", () => {
  it("envoie 3 récapitulatifs par adresse destinataire, puis refuse le 4e sans rien envoyer", async () => {
    for (let i = 0; i < 3; i += 1) {
      await expect(caller().sendFlightSummaryEmail({ email: "cible@example.test", flightDetails })).resolves.toMatchObject({ success: true });
    }
    expect(state.sent).toHaveLength(3);
    await expect(caller().sendFlightSummaryEmail({ email: "cible@example.test", flightDetails })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(state.sent).toHaveLength(3);
  });
});

/**
 * Identifiants séquentiels et URL d'écriture publiques : `profileEvaluation.getById` renvoyait la fiche complète
 * (identité, numéro de passeport, date de naissance, adresse, téléphone) pour n'importe quel `id` ; `upload.getUploadUrl`
 * délivrait à n'importe qui une URL d'écriture présignée sur le stockage. Aucun appelant : retirées.
 */
describe("lectures et écritures publiques retirées", () => {
  it("profileEvaluation.getById n'existe plus, submit reste", () => {
    const source = read("server/routers/profileEvaluation.ts");
    expect(source).not.toMatch(/\bgetById\s*:/);
    expect(source).toMatch(/\bsubmit\s*:\s*publicProcedure/);
  });

  it("uploadRouter est retiré et non monté", () => {
    expect(existsSync(resolve(root, "server/routers/uploadRouter.ts"))).toBe(false);
    const source = read("server/routers.ts");
    expect(source).not.toMatch(/\bupload\s*:\s*uploadRouter/);
    expect(source).not.toContain('from "./routers/uploadRouter"');
  });
});
