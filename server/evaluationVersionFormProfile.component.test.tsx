// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import EvaluationVersionForm from "@/components/EvaluationVersionForm";
import EvaluationReportView from "@/components/EvaluationReportView";
import { blankAdminVersion, buildClientReport, type AdminEvaluationVersion } from "@shared/evaluationValidation";

(globalThis as { React?: typeof React }).React = React;
afterEach(cleanup);

const version = (profile: AdminEvaluationVersion["profile"]): AdminEvaluationVersion => ({
  ...blankAdminVersion({ priorityCountry: "Allemagne", candidateName: "Awa", evaluationDate: "2026-10-23", profile }),
  profileSummary: "Résumé",
  route: "A",
});

describe("formulaire administrateur : le bilan s'adapte au profil", () => {
  it("études : grille, voies et listes du profil « études »", () => {
    render(<EvaluationVersionForm value={version("etudes")} onChange={() => {}} readOnly={false} candidateCountry="Allemagne" suggestedProfile="etudes" />);
    expect(screen.getByText(/Financement des études et garant/)).toBeTruthy();
    expect(screen.getByText(/Admission et adéquation du programme/)).toBeTruthy();
    expect(screen.getByText(/A — Admission directe dans un établissement/)).toBeTruthy();
    expect(screen.getByText("Filières et programmes visés")).toBeTruthy();
    expect(screen.queryByText(/Employabilité/)).toBeNull();
    expect(screen.queryByTestId("profile-differs")).toBeNull();
  });

  it("e-Visa : critères du dossier e-Visa et aucun champ métier ni secteur", () => {
    render(<EvaluationVersionForm value={version("evisa")} onChange={() => {}} readOnly={false} candidateCountry="Ouganda" suggestedProfile="evisa" />);
    expect(screen.getByText(/Passeport et identité/)).toBeTruthy();
    expect(screen.getByText(/Pièces du portail officiel/)).toBeTruthy();
    expect(screen.getByText(/A — e-Visa standard/)).toBeTruthy();
    expect(screen.queryByText(/Métiers/)).toBeNull();
    expect(screen.queryByText(/Secteurs/)).toBeNull();
  });

  it("l'administrateur peut changer le profil : notes ramenées au nouveau barème, écart signalé", () => {
    const onChange = vi.fn();
    const current = { ...version("travail"), scores: { identity: 10, qualification: 15, languages: 15, experience: 20, employability: 15, finances: 10, documents: 10, coherence: 5 } };
    render(<EvaluationVersionForm value={current} onChange={onChange} readOnly={false} candidateCountry="Canada" suggestedProfile="etudes" />);
    expect(screen.getByTestId("profile-differs").textContent).toMatch(/Études/);
    fireEvent.change(screen.getByTestId("profile-select"), { target: { value: "etudes" } });
    const next = onChange.mock.calls[0][0] as AdminEvaluationVersion;
    expect(next.profile).toBe("etudes");
    expect(next.scores.experience).toBe(5); // 20 sur la grille « travail », 5 au maximum en études
    expect(next.scores.qualification).toBe(15);
  });
});

describe("rapport vu par le candidat", () => {
  it("le titre et la grille suivent le profil validé", () => {
    const base = version("evisa");
    const report = buildClientReport({ ...base, scores: { ...base.scores, identity: 22 } }, { candidateName: "Awa", validatedAt: "2026-10-23" });
    render(<EvaluationReportView report={report} />);
    expect(screen.getByRole("heading", { name: "Bilan d’évaluation — demande d’e-Visa" })).toBeTruthy();
    expect(screen.getByText("Passeport et identité")).toBeTruthy();
  });
});
