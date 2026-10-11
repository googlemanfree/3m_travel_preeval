import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cockpitTreatFocusId, buildCandidateCockpit } from "../shared/candidateCockpit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("cockpit 360 — relance protocole", () => {
  it("pointe Traiter maintenant vers la barre Relancer / Accès", () => {
    expect(cockpitTreatFocusId("protocol_unsigned")).toBe("candidate360-protocol-relance");
    expect(cockpitTreatFocusId("send_protocol")).toBe("candidate360-protocol-relance");

    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      receiptApproved: true,
      protocolSigned: false,
      dossierActivated: true,
      pendingDocuments: 0,
    });
    expect(cockpit.stage).toBe("awaiting_protocol");
    expect(cockpit.blockers.some((b) => b.code === "protocol_unsigned")).toBe(true);
    expect(cockpit.nextAction.key).toBe("send_protocol");
    expect(cockpit.nextAction.description.toLowerCase()).toMatch(/relancer/);
  });

  it("branche Relancer + Accès dans Candidate360Workspace", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("resendAgreementSignatureReminder");
    expect(workspace).toContain("candidate360-protocol-relance");
    expect(workspace).toContain("candidate360-protocol-remind");
    expect(workspace).toContain("candidate360-protocol-access");
    expect(workspace).toContain("protocolRemindMutation");
    expect(workspace).toContain("/^(online|agency)_\\d+$/");
  });
});
