// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EvaluationVersionForm from "@/components/EvaluationVersionForm";
import { blankAdminVersion, type AdminEvaluationVersion } from "@shared/evaluationValidation";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
(globalThis as { React?: typeof React }).React = React;
afterEach(cleanup);

const ready = (overrides: Partial<AdminEvaluationVersion> = {}): AdminEvaluationVersion => ({
  ...blankAdminVersion({ priorityCountry: "Allemagne", candidateName: "Awa", evaluationDate: "2026-10-26", profile: "travail" }),
  profileSummary: "Résumé du profil.",
  route: "A",
  strengths: ["Atout A"],
  ...overrides,
});

describe("formulaire administrateur : justifications et modèles d'e-mail", () => {
  it("demande une justification quand le pays évalué diffère du pays demandé", () => {
    render(<EvaluationVersionForm value={ready()} onChange={() => {}} readOnly={false} candidateCountry="Canada" candidateName="Awa" />);
    expect(screen.getByLabelText("Justification du pays évalué")).toBeTruthy();
  });

  it("n'affiche aucune justification de pays quand il correspond", () => {
    render(<EvaluationVersionForm value={ready()} onChange={() => {}} readOnly={false} candidateCountry="Allemagne" candidateName="Awa" />);
    expect(screen.queryByLabelText("Justification du pays évalué")).toBeNull();
  });

  it("demande une justification quand le statut final diffère du statut suggéré", () => {
    render(<EvaluationVersionForm value={ready({ finalStatus: "tres_favorable" })} onChange={() => {}} readOnly={false} candidateCountry="Allemagne" candidateName="Awa" />);
    expect(screen.getByLabelText("Justification du statut final")).toBeTruthy();
  });

  it("le bouton « Modèle complet » remplit l'objet et le corps ; « Modèle court » les rétablit", () => {
    const onChange = vi.fn();
    render(<EvaluationVersionForm value={ready()} onChange={onChange} readOnly={false} candidateCountry="Allemagne" candidateName="Awa Diop" />);
    fireEvent.click(screen.getByRole("button", { name: /Modèle complet/ }));
    const complete = onChange.mock.calls[0][0] as AdminEvaluationVersion;
    expect(complete.emailBody).toContain("① VOTRE RÉSULTAT");
    expect(complete.emailBody).toContain("Bonjour Awa Diop,");
    fireEvent.click(screen.getByRole("button", { name: /Modèle court/ }));
    expect((onChange.mock.calls[1][0] as AdminEvaluationVersion).emailBody).toContain("[BOUTON : Consulter mon évaluation]");
  });

  it("« Copier le mail complet » écrit le mail dans le presse-papiers", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<EvaluationVersionForm value={ready()} onChange={() => {}} readOnly={false} candidateCountry="Allemagne" candidateName="Awa Diop" />);
    fireEvent.click(screen.getByRole("button", { name: /Copier le mail complet/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = String(writeText.mock.calls[0][0]);
    expect(copied).toMatch(/^Objet : /);
    expect(copied).toContain("✓ Atout A");
    expect(copied).not.toContain("[LIEN_PORTAIL_CLIENT]");
  });

  it("en lecture seule, les modèles ne modifient rien mais la copie reste possible", () => {
    render(<EvaluationVersionForm value={ready()} onChange={() => {}} readOnly={true} candidateCountry="Allemagne" candidateName="Awa" />);
    expect(screen.getByRole("button", { name: /Modèle court/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Modèle complet/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Copier le mail complet/ }).hasAttribute("disabled")).toBe(false);
  });
});
