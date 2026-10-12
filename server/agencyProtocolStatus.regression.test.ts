import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AGENCY_AGREEMENT_SIGNED_KEY_PREFIX,
  agencyAgreementSignedKey,
  parseAgencyAgreementSignature,
} from "./services/agencyAgreementSignature";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("protocole agence — statut réel + signature mon-espace", () => {
  it("persiste la signature hors statut dossier", () => {
    expect(agencyAgreementSignedKey(12)).toBe(`${AGENCY_AGREEMENT_SIGNED_KEY_PREFIX}12`);
    const record = parseAgencyAgreementSignature(JSON.stringify({
      dossierId: 12,
      dossierNumber: "3M-AGN-0012",
      signedAt: "2026-10-11T12:00:00.000Z",
      signatureName: "Nadia Mbarga",
      ipAddress: "1.2.3.4",
      empreinteSha: "abc",
      candidateEmail: "nadia@example.com",
    }));
    expect(record?.dossierNumber).toBe("3M-AGN-0012");
    expect(record?.signatureName).toBe("Nadia Mbarga");
  });

  it("branche le bureau reçus sur le statut protocole agence", () => {
    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("loadAgencyAgreementSignaturesByIds");
    expect(management).toContain("loadAgencyProtocolSignedDocIds");
    expect(management).not.toMatch(/protocolSigned:\s*false,\s*\n\s*stage:\s*\(receiptAvailable \? "protocol_pending"/);
  });

  it("autorise la signature 3M-AGN depuis l’espace client sans rewrite de status", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("parseAgencyDossierReference");
    expect(candidate).toContain("saveAgencyAgreementSignature");
    expect(candidate).toContain("agency_agreement_signed");
    expect(candidate).toContain("showAgreementAfterPayment");
    expect(candidate).toContain("agencyAgreementSigned");
    // Ne plus forcer dossierStatus à « paye » à la signature (dossiers actifs intacts).
    expect(candidate).not.toMatch(/agreementSigned:\s*true,\s*\n\s*agreementSignedAt:[\s\S]{0,120}dossierStatus:\s*"paye"/);

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("agreementDossier");
    expect(space).toContain("agency-agreement-sign-panel");

    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("agencyAgreementSignature");
    expect(admin).toContain("loadAgencyAgreementSignature");
  });
});
