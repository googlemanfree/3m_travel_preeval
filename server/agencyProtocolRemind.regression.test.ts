import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("relance protocole agence — bureau + mutation", () => {
  it("accepte agency_* sans rewrite de statut dossier", () => {
    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("resendAgreementSignatureReminder");
    expect(management).toMatch(/candidateId:\s*z\.string\(\)\.regex\(\/\^\(online\|agency\)_\\d\+\$\/\)/);
    expect(management).toContain("loadAgencyAgreementSignature");
    expect(management).toContain('initialPaymentStatus !== "paid"');
    expect(management).toContain("agreement_signature_reminder_sent");
    expect(management).toContain("notifyAgreementSignatureReminderWhatsApp");
    // Garde-fou : la mutation ne doit pas écrire le statut du dossier.
    const mutationSlice = management.slice(
      management.indexOf("resendAgreementSignatureReminder:"),
      management.indexOf("listCandidatesAwaitingAgreementProtocol:"),
    );
    expect(mutationSlice).not.toMatch(/\.update\(agencyDossiers\)/);
    expect(mutationSlice).not.toMatch(/\.update\(applications\)/);
    expect(mutationSlice).not.toMatch(/status:\s*["']/);
  });

  it("montre Relancer sur le bureau pour les walk-in protocol_pending", () => {
    const desk = read("client/src/components/AdminContractsReceiptsDesk.tsx");
    expect(desk).toContain("protocol-remind-");
    expect(desk).toContain("/^(online|agency)_\\d+$/");
    expect(desk).not.toContain('row.candidateId.startsWith("online_") && !row.protocolSigned');
  });
});
