import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertApplicationCanEnterStatus } from "./utils/applicationGates";
import { ADMIN_MESSAGE_TEMPLATES } from "../shared/adminOpsToolkit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("admin — confirmer le bilan à la place du candidat", () => {
  it("expose confirmBilanOnBehalfOfCandidate et confirmOnBehalf sur le parcours", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("confirmBilanOnBehalfOfCandidate");
    expect(admin).toContain("bilan_confirmed_on_behalf");
    expect(admin).toContain("confirmOnBehalf: z.boolean().optional()");
    expect(admin).toContain("confirmBilanOnBehalf: z.boolean().optional()");
    expect(admin).toContain("Valider à la place du candidat");
    expect(admin).toContain("evaluationClientConfirmed:");
  });

  it("UI 360° : bannière + boutons de validation à la place du client", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("candidate360-bilan-confirm-banner");
    expect(workspace).toContain("candidate360-confirm-bilan-on-behalf");
    expect(workspace).toContain("confirmBilanOnBehalfOfCandidate");
    expect(workspace).toContain("confirmOnBehalf: true");
    expect(workspace).toContain("bilan-confirm-on-behalf-submit");

    const stepper = read("client/src/components/ProcedureStepper.tsx");
    expect(stepper).toContain("Valider à la place du candidat");
    expect(stepper).toContain('data-testid="force-candidate-confirmation"');
  });

  it("accepte evaluationClientConfirmedAt comme confirmation dans les gates", () => {
    expect(() =>
      assertApplicationCanEnterStatus(
        {
          agreementSigned: true,
          paymentStatus: "SUCCESS",
          paymentValidatedAt: new Date(),
          paymentValidatedBy: "admin@3m.test",
          evaluationDeliveryStatus: "sent",
          evaluationClientConfirmedAt: new Date(),
        },
        "paye",
      ),
    ).not.toThrow();

    expect(() =>
      assertApplicationCanEnterStatus(
        {
          agreementSigned: true,
          paymentStatus: "SUCCESS",
          paymentValidatedAt: new Date(),
          paymentValidatedBy: "admin@3m.test",
          evaluationDeliveryStatus: "sent",
        },
        "paye",
      ),
    ).toThrow(/confirmation du bilan/i);
  });

  it("modèle de relance confirmation bilan", () => {
    expect(ADMIN_MESSAGE_TEMPLATES.some((row) => row.id === "bilan_confirmation_pending")).toBe(true);
  });
});
