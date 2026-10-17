import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEDULED_JOBS } from "./cron/scheduledJobsCron";
import { getNextAdminStage } from "../shared/adminStageCatalog";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Automatisation site complet — Vague 2–3", () => {
  it("enregistre le job pilotage-automation avec dry-run", () => {
    const job = SCHEDULED_JOBS.find((entry) => entry.path === "/api/scheduled/pilotage-automation");
    expect(job).toBeTruthy();
    expect(job?.supportsDryRun).toBe(true);
    expect(job?.candidateFacing).toBe(true);
    expect(read("server/_core/index.ts")).toContain("/api/scheduled/pilotage-automation");
    expect(read("server/scheduled/pilotageAutomationJob.ts")).toContain("runPilotageAutomation");
  });

  it("active COMPTE→3M, relance et avance Kanban via services dédiés", () => {
    expect(read("server/services/autoActivatePreDossier.ts")).toContain("activateReadyPreDossier");
    expect(read("server/services/autoActivatePreDossier.ts")).toContain("runAutoActivateReadyAccounts");
    expect(read("server/services/deliverDynamicRelance.ts")).toContain("deliverDynamicRelance");
    expect(read("server/services/safeKanbanAdvance.ts")).toContain("DOCUMENTS_CHECK");
    expect(read("server/services/safeKanbanAdvance.ts")).toContain("en_attente_documents");
    expect(read("server/services/pilotageAutomation.ts")).toContain("purgeAllOrphanEvalAgencyShells");
    expect(getNextAdminStage("PUBLISHED")).toBe("DOCUMENTS_CHECK");
  });

  it("branche l’auto-activation après paiement CinetPay", () => {
    const opening = read("server/services/openingPaymentAutomation.ts");
    expect(opening).toContain("activateReadyPreDossier");
  });

  it("remplace les mailto ops admin par envoi direct", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("candidate-header-email-relance");
    expect(dashboard).toContain("openPreDossierRelance(\"generic\", \"email\")");
    expect(dashboard).not.toMatch(/href=\{`mailto:\$\{candidate\.email\}`\}/);

    const ai = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(ai).toContain("sendDynamicRelance");
    expect(ai).toContain("evaluation-cv-remind-email");
    expect(ai).not.toContain("buildGapMailtoReminder");
    expect(ai).not.toContain("mailto:");
  });
});
