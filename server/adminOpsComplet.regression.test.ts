import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_MESSAGE_TEMPLATES,
  buildMailtoRelance,
  fillAdminTemplate,
  formatActivationTransition,
  preDossierReadinessBadge,
  todayQueueToCsv,
} from "../shared/adminOpsToolkit";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin ops complet — toolkit", () => {
  it("fournit des modèles de relance par étape et remplit les variables", () => {
    expect(ADMIN_MESSAGE_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    const filled = fillAdminTemplate(ADMIN_MESSAGE_TEMPLATES[0]!, {
      name: "Aïcha",
      reference: "COMPTE-00042",
    });
    expect(filled.body).toContain("Aïcha");
    expect(filled.body).toContain("COMPTE-00042");
    expect(buildMailtoRelance({ email: "a@test.com", name: "Aïcha", reference: "3M-001", stage: "payment_pending" })).toContain("mailto:");
  });

  it("exporte la file du jour en CSV et calcule les badges pré-dossier", () => {
    const csv = todayQueueToCsv([
      { label: "SLA dépassé", fullName: "Aïcha", folderCode: "3M-001", detail: "Docs", destination: "Canada", tone: "rose" },
    ]);
    expect(csv).toContain("Priorité");
    expect(csv).toContain("Aïcha");
    expect(preDossierReadinessBadge({ source: "ACCOUNT_ONLY", evaluationDeclarationStatus: "validated", paymentStatus: "SUCCESS" })?.label).toBe("Prêt à activer");
    expect(preDossierReadinessBadge({ source: "WEB" })).toBeNull();
    expect(formatActivationTransition({ formerAccountReference: "COMPTE-00042", folderCode: "3M-AGN-0034" })).toContain("COMPTE-00042 → 3M-AGN-0034");
  });
});

describe("admin ops complet — câblage UI", () => {
  it("file du jour CSV + sticky prêts + relance cockpit + modèles 360 + raccourcis docs", () => {
    const today = read("client/src/components/AdminTodayDashboard.tsx");
    const predossier = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
    const cockpit = read("client/src/components/AdminCockpitControlBoard.tsx");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const docs = read("client/src/components/AdminDocumentsManagement.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const css = read("client/src/index.css");

    expect(today).toContain("File du jour");
    expect(today).toContain("today-export-csv");
    expect(today).toContain("todayQueueToCsv");
    expect(predossier).toContain("predossier-ready-sticky");
    expect(cockpit).toContain("cockpit-relance-mail");
    expect(cockpit).toContain("buildMailtoRelance");
    expect(workspace).toContain("candidate360-message-templates");
    expect(workspace).toContain("candidate360-activation-history");
    expect(workspace).toContain("ADMIN_MESSAGE_TEMPLATES");
    expect(docs).toContain("documents-bulk-bar");
    expect(docs).toContain('event.key === "a"');
    expect(dashboard).toContain("admin-predossier-readiness-badge");
    expect(dashboard).toContain("data-admin-ops-mobile");
    expect(dashboard).toContain("admin-role-badge");
    expect(dashboard).toContain("canManageSensitiveOps");
    expect(css).toContain("[data-admin-ops-mobile]");
  });
});
