import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Candidate360 blocked journey step visuals", () => {
  it("keeps blocked-step controls visible with a lock, explanation, and disabled action", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");
    expect(source).toContain("LockKeyhole");
    expect(source).toContain("Étape bloquée :");
    expect(source).toContain("Progression indisponible :");
    expect(source).toContain("isBlocked || journeyStepMutation.isPending");
    expect(source).toContain("Étape verrouillée");
  });
});

