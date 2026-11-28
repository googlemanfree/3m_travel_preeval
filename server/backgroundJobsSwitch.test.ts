import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { backgroundJobsEnabled } from "./services/backgroundJobsSwitch";

describe("interrupteur des tâches automatiques", () => {
  it("reste actif par défaut", () => {
    expect(backgroundJobsEnabled(undefined)).toBe(true);
    expect(backgroundJobsEnabled("")).toBe(true);
    expect(backgroundJobsEnabled("on")).toBe(true);
  });
  it.each(["off", "OFF", "false", "0", "non", " no "])("JOBS_ENABLED=%s coupe tout", (value) => {
    expect(backgroundJobsEnabled(value)).toBe(false);
  });
  it("le démarrage du serveur lance les tâches seulement quand l'interrupteur est actif", () => {
    const source = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
    const guard = source.indexOf("if (!backgroundJobsEnabled())");
    for (const call of ["initScheduledJobsCron(port)", "startCountryGuidesRefresh()", "startActivationGuard()", "startBilanAutoRelance()", "startBilanAutoWorker()"]) {
      expect(guard).toBeGreaterThan(-1);
      expect(source.indexOf(call, guard)).toBeGreaterThan(guard);
    }
  });
});
