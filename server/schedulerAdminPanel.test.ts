import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { clearSchedulerHistoryForTests, getSchedulerHistory, recordSchedulerExecution } from "./cron/schedulerHistory";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("pilotage admin du planificateur", () => {
  beforeEach(() => clearSchedulerHistoryForTests());

  it("conserve un historique borné avec les compteurs simulés et envoyés", () => {
    recordSchedulerExecution({ job: "Relances documents", path: "/api/scheduled/document-reminders", mode: "dry-run", startedAt: new Date("2026-10-05T10:00:00Z"), finishedAt: new Date("2026-10-05T10:00:01Z"), status: "success", planned: 4, sent: 0, failed: 0, source: "manual" });
    const history = getSchedulerHistory();
    expect(history[0]).toMatchObject({ mode: "dry-run", planned: 4, sent: 0, failed: 0, source: "manual" });
  });

  it("protège les procédures et désactive le test manuel hors dry-run", () => {
    const router = read("server/routers/schedulerAdmin.ts");
    const trpc = read("server/_core/trpc.ts");
    expect(router).toContain("adminProcedure");
    expect(router).toContain("runDocumentRemindersDryRun");
    expect(router).toContain('mode !== "dry-run"');
    expect(trpc).toContain("schedulerAdmin");
  });

  it("affiche le badge, la bannière dry-run, le bouton de simulation et le rapport dans le dashboard", () => {
    const panel = read("client/src/components/AdminSchedulerPanel.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(panel).toContain("Planificateur :");
    expect(panel).toContain("Simuler les relances");
    expect(panel).toContain("Rapport d’exécution");
    expect(panel).toContain("SchedulerDryRunBanner");
    expect(panel).toContain("mode dry-run");
    expect(panel).toContain("Historique des dernières exécutions");
    expect(panel).toContain("runDocumentRemindersDryRun");
    expect(dashboard).toContain('value="scheduler"');
    expect(dashboard).toContain("<AdminSchedulerPanel />");
    expect(dashboard).toContain("<SchedulerDryRunBanner />");
    expect(dashboard).toContain("<SchedulerModeBadge compact />");
  });
});
