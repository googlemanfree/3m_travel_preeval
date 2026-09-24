// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import NextStepCard from "@/components/NextStepCard";
import { EVALUATION_ANCHOR_ID, computeNextStep, type NextStepInput } from "@/lib/nextStep";

afterEach(cleanup);

const base: NextStepInput = { evaluationRequired: false, agreementSignatureRequired: false };
const req = (id: number, status: string, isRequired = true) => ({ id, status, isRequired });

describe("prochaine étape du candidat", () => {
  it("l'évaluation manquante prime sur tout, et ouvre l'évaluation", () => {
    const step = computeNextStep({ ...base, evaluationRequired: true, agreementSignatureRequired: true, requirements: [req(1, "rejected")] });
    expect(step.id).toBe("evaluation-required");
    expect(step.action).toEqual({ kind: "evaluation" });
  });

  it("une demande de complément de l'équipe prime sur le CV manquant et les pièces", () => {
    const step = computeNextStep({ ...base, evaluationStage: "info_requested", cvOnFile: false, requirements: [req(1, "pending")] });
    expect(step.id).toBe("evaluation-info");
    expect(step.action).toEqual({ kind: "anchor", elementId: EVALUATION_ANCHOR_ID });
  });

  it("CV manquant pendant l'examen, mais pas une fois l'évaluation publiée", () => {
    expect(computeNextStep({ ...base, evaluationStage: "pending", cvOnFile: false }).id).toBe("cv-missing");
    expect(computeNextStep({ ...base, evaluationStage: "pending", cvOnFile: true }).id).toBe("waiting-review");
    expect(computeNextStep({ ...base, evaluationStage: "published", cvOnFile: false }).id).toBe("evaluation-published");
  });

  it("protocole à signer, puis pièces refusées, puis pièces demandées, dans cet ordre", () => {
    expect(computeNextStep({ ...base, agreementSignatureRequired: true, requirements: [req(1, "rejected")] }).id).toBe("agreement");
    expect(computeNextStep({ ...base, requirements: [req(1, "rejected"), req(2, "pending")] }).id).toBe("documents-rejected");
    expect(computeNextStep({ ...base, requirements: [req(2, "pending")] }).id).toBe("documents-pending");
  });

  it("accorde les pluriels et ignore les pièces facultatives, reçues ou validées", () => {
    expect(computeNextStep({ ...base, requirements: [req(1, "rejected"), req(2, "rejected")] }).title).toBe("Corrigez 2 pièces refusées");
    expect(computeNextStep({ ...base, requirements: [req(1, "rejected")] }).title).toBe("Corrigez 1 pièce refusée");
    expect(computeNextStep({ ...base, requirements: [req(1, "pending"), req(2, "pending"), req(3, "pending")] }).title).toBe("Déposez 3 pièces");
    expect(computeNextStep({ ...base, requirements: [req(1, "pending", false), req(2, "received"), req(3, "approved"), req(4, "waived")] }).id).toBe("all-clear");
  });

  it("données absentes ou illisibles : aucun plantage, « tout est à jour »", () => {
    expect(computeNextStep({ ...base, requirements: "x" }).id).toBe("all-clear");
    expect(computeNextStep({ ...base, requirements: [null, 3, {}] }).id).toBe("all-clear");
    expect(computeNextStep(base)).toMatchObject({ tone: "done", action: { kind: "none" }, actionLabel: null });
  });

  it("n'annonce ni délai chiffré ni garantie", () => {
    const all = [
      computeNextStep({ ...base, evaluationRequired: true }),
      computeNextStep({ ...base, evaluationStage: "info_requested" }),
      computeNextStep({ ...base, evaluationStage: "pending", cvOnFile: false }),
      computeNextStep({ ...base, agreementSignatureRequired: true }),
      computeNextStep({ ...base, requirements: [req(1, "rejected")] }),
      computeNextStep({ ...base, requirements: [req(1, "pending")] }),
      computeNextStep({ ...base, evaluationStage: "published" }),
      computeNextStep({ ...base, evaluationStage: "pending", cvOnFile: true }),
      computeNextStep(base),
    ];
    for (const step of all) {
      expect(`${step.title} ${step.description}`, step.id).not.toMatch(/garanti|assuré|\b\d+\s?(h|heures|jours)\b|sous 24/i);
    }
  });
});

describe("carte « Votre prochaine étape »", () => {
  it("affiche l'étape, son action, et la déclenche au clic", () => {
    const onAct = vi.fn();
    const step = computeNextStep({ ...base, requirements: [req(1, "rejected")] });
    render(<NextStepCard step={step} onAct={onAct} />);
    expect(screen.getByRole("heading", { name: "Corrigez 1 pièce refusée" })).toBeTruthy();
    expect(screen.getByTestId("next-step-card").getAttribute("data-step")).toBe("documents-rejected");
    fireEvent.click(screen.getByRole("button", { name: /Ouvrir mes documents/ }));
    expect(onAct).toHaveBeenCalledWith(step);
  });

  it("sans action à mener : pas de bouton", () => {
    render(<NextStepCard step={computeNextStep(base)} onAct={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/Aucune action n’est attendue/)).toBeTruthy();
  });
});
