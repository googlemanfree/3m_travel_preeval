import { describe, expect, it } from "vitest";
import { claimSimulatorAlert } from "./routers/simulatorDiagnostics";

describe("diagnostics de simulateur", () => {
  it("évite les notifications administratives répétées pour un même simulateur", () => {
    const route = "/canada";
    const simulator = "canada_score";
    const key = `${route}:${simulator}:test-${Date.now()}`;

    expect(claimSimulatorAlert(key, 1_000_000)).toBe(true);
    expect(claimSimulatorAlert(key, 1_001_000)).toBe(false);
    expect(claimSimulatorAlert(key, 1_901_000)).toBe(true);
  });
});
