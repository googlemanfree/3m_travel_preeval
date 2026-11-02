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
      hasAnyDocuments: true,
    });
    expect(cockpit.progressPercent).toBe(100);
    expect(cockpit.blockers).toHaveLength(0);
    expect(cockpit.stage).toBe("in_progress");
  });

  it("ne coche pas protocole / reçu tant que le paiement n’est pas validé", () => {
    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: false,
      protocolSigned: false,
      receiptApproved: false,
      dossierActivated: false,
      pendingDocuments: 0,
    });
    expect(cockpit.checklist.find((item) => item.key === "protocol")).toMatchObject({
      done: false,
      lockedUntilPayment: true,
    });
    expect(cockpit.checklist.find((item) => item.key === "receipt")).toMatchObject({
      done: false,
      lockedUntilPayment: true,
    });
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
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("AdminCockpitControlBoard");
    expect(dashboard).toContain("AdminCandidateCockpitStrip");
    expect(dashboard).toContain("onTreatNow");
    // Le pilotage reste la section d'ouverture par défaut (dernier onglet mémorisé ou lien ?tab= sinon).
    expect(dashboard).toContain('return "pilotage";');
    expect(dashboard).toContain("useState<string>(readInitialAdminTab)");
  });

  it("route le protocole vers l’onglet évaluation (où vit le panneau d’envoi)", () => {
    const cockpit = buildCandidateCockpit({
      emailVerified: true,
      evaluationStatus: "validated",
      paymentConfirmed: true,
      dossierActivated: true,
      receiptApproved: true,
      protocolSigned: false,
      pendingDocuments: 2,
    });
    expect(cockpit.stage).toBe("awaiting_protocol");
    expect(cockpit.nextAction.tab).toBe("evaluation");
    expect(cockpit.blockers.some((blocker) => blocker.code === "protocol_unsigned" && blocker.tab === "evaluation")).toBe(true);
  });
});
