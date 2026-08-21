import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInsuranceCouponPdf } from "./services/insuranceCoupon";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("coupon et remise assurance", () => {
  it("génère un coupon PDF de réservation sans données de passeport", () => {
    const pdf = createInsuranceCouponPdf({ reference: "ASR-2026-123456", fullName: "Client Test", destinationCountry: "Rwanda", departureDate: "2026-09-10", returnDate: "2026-09-20", coveragePlan: "Voyage international standard", travelersCount: 2 });
    expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("stocke le coupon et envoie une remise au client sans bloquer la demande", () => {
    const router = read("server/routers/insuranceRequests.ts");
    expect(router).toContain("createInsuranceCouponPdf");
    expect(router).toContain("couponEmailSentAt");
    expect(router).toContain('documentKind: "coupon"');
    expect(router).toContain('documentKind: "attestation"');
  });

  it("donne au client un accès propriétaire au coupon et à l’attestation", () => {
    const tracking = read("server/routers/caseTracking.ts");
    const client = read("client/src/pages/ClientCaseTracking.tsx");
    expect(tracking).toContain("downloadMyInsuranceCoupon");
    expect(tracking).toContain("eq(insuranceRequests.email, ctx.candidate.email)");
    expect(client).toContain("Télécharger le coupon");
    expect(client).toContain("Télécharger l’attestation");
  });
});
