import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Aujourd’hui + 360 — protocole agence réel", () => {
  it("branche listCandidates sur le statut protocole agence (lecture seule)", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("loadAgencyAgreementSignaturesByIds");
    expect(admin).toContain("loadAgencyProtocolSignedDocIds");
    expect(admin).toContain("agencyProtocolSigned");
    expect(admin).toContain("agreementSigned: agencyProtocolSigned(app.id)");
    // Plus de null permanent qui masquait les walk-in dans Aujourd’hui.
    expect(admin).not.toMatch(/paymentStatus:\s*paymentStatusForAgency\(app\.initialPaymentStatus\),\s*\n\s*agreementSigned:\s*null,/);
  });

  it("aligne le cockpit 360 sur protocolOneSigned (agency_settings)", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("protocolOneSigned");
    expect(admin).toContain("protocolSigned: protocolOneSigned");
    // Ancien bug : cockpit ne lisait que onlineApp.agreementSigned
    expect(admin).not.toMatch(/protocolSigned:\s*Boolean\(onlineApp\?\.agreementSigned\)/);
  });

  it("Aujourd’hui compte agreementSigned === false (online + agency)", () => {
    const today = read("client/src/components/AdminTodayDashboard.tsx");
    expect(today).toContain('candidate.paymentStatus === "SUCCESS" && candidate.agreementSigned === false');
    const test = read("server/adminTodayDashboard.component.test.tsx");
    expect(test).toContain("agency_7");
    expect(test).toContain('item.candidate.id === "agency_7"');
  });
});
