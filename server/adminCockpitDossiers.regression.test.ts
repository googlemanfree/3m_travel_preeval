import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCandidateCockpit, cockpitQueueCategory } from "../shared/candidateCockpit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin cockpit dossiers", () => {
  it("priorise e-mail puis évaluation puis paiement puis activation", () => {
    const email = buildCandidateCockpit({ emailVerified: false });
    expect(email.stage).toBe("email_unverified");
    expect(email.nextAction.key).toBe("confirm_email");

    const evalMissing = buildCandidateCockpit({ emailVerified: true, evaluationStatus: "not_declared" });
    expect(evalMissing.stage).toBe("awaiting_evaluation");
    expect(cockpitQueueCategory(evalMissing.stage)).toBe("no_evaluation");

    const payment = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: false,
    });
    expect(payment.stage).toBe("awaiting_payment");

    const activate = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      dossierActivated: false,
    });
    expect(activate.stage).toBe("ready_to_activate");
    expect(activate.canForceActions).toContain("activate_dossier");
  });

  it("calcule une checklist et un pourcentage de contrôle", () => {
    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      dossierActivated: true,
      receiptApproved: true,
      protocolSigned: true,
      pendingDocuments: 0,
    });
    expect(cockpit.progressPercent).toBe(100);
    expect(cockpit.blockers).toHaveLength(0);
    expect(cockpit.stage).toBe("in_progress");
  });

  it("branche le cockpit dans 360°, pré-dossiers, API files et dashboard", () => {
    const adminRouter = read("server/routers/admin.ts");
    const management = read("server/routers/adminCandidateManagement.ts");
    expect(adminRouter).toContain("buildCandidateCockpit");
    expect(adminRouter).toContain("cockpit:");
    expect(adminRouter).toContain("opening_payment:");
    expect(management).toContain("listCockpitControlBoard");
    expect(management).toContain("OPENING_PAYMENT_KEY_PREFIX");
    expect(management).toContain("like(agencySettings.settingKey");
    expect(read("client/src/components/Candidate360Workspace.tsx")).toContain("AdminCandidateCockpitStrip");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("AdminCockpitControlBoard");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("AdminCandidateCockpitStrip");
  });
});
