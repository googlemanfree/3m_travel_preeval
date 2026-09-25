import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Candidate360 blocked journey step visuals", () => {
  it("keeps blocked-step controls visible with a lock, explanation, and disabled action", () => {
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain("LockKeyhole");
    expect(stepper).toContain("Étape bloquée :");
    expect(stepper).toContain("Progression indisponible :");
    expect(stepper).toContain("Verrouillé");
    expect(stepper).toContain("disabled={busy}");
    // le bureau désactive les actions pendant une mutation d'étape, comme avant
    expect(read("client/src/components/Candidate360Workspace.tsx")).toContain("journeyStepMutation.isPending || actionLocks.journeyStep");
  });
});
