// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;
const state = vi.hoisted(() => ({ data: undefined as unknown, grant: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ evaluationValidation: { myBilanProgress: { invalidate: vi.fn() } } }), evaluationValidation: { myBilanProgress: { useQuery: () => ({ data: state.data }) }, grantCvAnalysisConsent: { useMutation: () => ({ mutate: state.grant, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import BilanAutoProgress from "@/components/BilanAutoProgress";

afterEach(cleanup);
const steps = (current: number) => ["Dossier reçu", "Analyse en cours", "Relecture par l'agence", "Bilan disponible"].map((label, index) => ({ id: String(index), label, status: index < current ? "fait" : index === current ? "en_cours" : "a_venir" }));

describe("frise de suivi du bilan", () => {
  it("n'affiche rien si le bilan automatisé est inactif ou sans traitement", () => {
    state.data = { progress: null };
    const { container } = render(<BilanAutoProgress evaluationId={1} />);
    expect(container.innerHTML).toBe("");
  });
  it("affiche les étapes avec l'étape en cours annoncée, et le message complémentaire", () => {
    state.data = { progress: { steps: steps(1), note: "Le traitement prend plus de temps que prévu.", current: "analyse", action: null, updatedAt: "" } };
    render(<BilanAutoProgress evaluationId={1} />);
    expect(screen.getByLabelText("Étapes du bilan").querySelectorAll("li")).toHaveLength(4);
    expect(screen.getByText("Analyse en cours").closest("li")?.getAttribute("aria-current")).toBe("step");
    expect(screen.getByRole("status").textContent).toMatch(/plus de temps que prévu/);
    expect(document.body.textContent).not.toMatch(/échec|erreur|refus/i);
  });

  it("propose l'accord à la lecture du CV quand il manque, et l'enregistre au clic", () => {
    state.data = { progress: { steps: steps(1), note: "Un complément est nécessaire.", current: "analyse", action: "completer", needs: "consentement_cv", updatedAt: "" } };
    render(<BilanAutoProgress evaluationId={9} />);
    expect(screen.getByTestId("cv-consent-request").textContent).toMatch(/lus par un traitement automatisé/);
    fireEvent.click(screen.getByTestId("cv-consent-accept"));
    expect(state.grant).toHaveBeenCalledWith({ evaluationId: 9, accepted: true });
  });
  it("ne propose pas l'accord quand il n'est pas demandé", () => {
    state.data = { progress: { steps: steps(1), note: null, current: "analyse", action: null, needs: null, updatedAt: "" } };
    render(<BilanAutoProgress evaluationId={9} />);
    expect(screen.queryByTestId("cv-consent-request")).toBeNull();
  });
});
