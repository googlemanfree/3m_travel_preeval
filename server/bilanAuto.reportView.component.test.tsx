// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ClientReport } from "../shared/evaluationValidation";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ evaluationValidation: { myBilanPdfUrl: { fetch: state.fetch } } }) } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import EvaluationReportView from "@/components/EvaluationReportView";

const report = (over: Partial<NonNullable<ClientReport["automated"]>> = {}): ClientReport => ({
  profile: "travail", profileLabel: "Travail", reportTitle: "Bilan d'évaluation préliminaire — projet de travail", candidateName: "Awa Ndiaye", validatedAt: "2026-11-13",
  priorityCountry: "Luxembourg", score: 72, scoreMax: 100, status: "favorable", statusLabel: "Seuil interne atteint (72/100, seuil 65)", route: null, profileSummary: "", scoreBreakdown: [{ key: "qualification", label: "Formation", score: 12, max: 15 }],
  strengths: [], improvements: [], riskLevel: null, actionPlan: [], documents: [], alternatives: [], remarks: "", validUntil: null, legalDisclaimer: "Ce bilan est une préévaluation interne.",
  automated: { runId: 4, gridVersion: 1, verdictLabel: "Seuil interne atteint (72/100, seuil 65)", pdfAvailable: true, reviewedByAgency: true, sections: [
    { id: "rappel", title: "1. Rappel d'une évaluation antérieure", paragraphs: ["Aucune évaluation antérieure n'a été trouvée pour ce compte."], bullets: [] },
    { id: "verdict", title: "2. Verdict interne et note expliquée", paragraphs: ["Le total est calculé par le système."], bullets: ["Formation · Niveau : 5/6"], table: [["Formation", "12/15"]] },
  ], ...over },
});

afterEach(cleanup);

describe("bilan automatisé côté candidat", () => {
  it("affiche les sections, le score et la mention de relecture par l'agence", () => {
    render(<EvaluationReportView report={report()} evaluationId={9} />);
    expect(screen.getByText(/relu par 3M TRAVEL AGENCY/i)).toBeTruthy();
    expect(screen.getByText("1. Rappel d'une évaluation antérieure")).toBeTruthy();
    expect(screen.getByText("Formation · Niveau : 5/6")).toBeTruthy();
    expect(screen.getByLabelText("Score : 72 sur 100")).toBeTruthy();
  });

  it("n'affirme jamais une relecture humaine quand il n'y en a pas eu", () => {
    render(<EvaluationReportView report={report({ reviewedByAgency: false })} evaluationId={9} />);
    expect(screen.getByText(/établi automatiquement/i)).toBeTruthy();
    expect(screen.queryByText(/relu par/i)).toBeNull();
  });

  it("le PDF s'ouvre par lien signé demandé au serveur ; une erreur est annoncée sans lien cassé", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    state.fetch.mockResolvedValueOnce({ url: "https://files.test/signed.pdf" });
    render(<EvaluationReportView report={report()} evaluationId={9} />);
    fireEvent.click(screen.getByTestId("bilan-pdf-download"));
    await waitFor(() => expect(open).toHaveBeenCalledWith("https://files.test/signed.pdf", "_blank", "noopener,noreferrer"));
    expect(state.fetch).toHaveBeenCalledWith({ evaluationId: 9 });
    state.fetch.mockRejectedValueOnce(new Error("404"));
    fireEvent.click(screen.getByTestId("bilan-pdf-download"));
    await waitFor(() => expect(state.fetch).toHaveBeenCalledTimes(2));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("pas de bouton PDF quand le PDF n'est pas disponible", () => {
    render(<EvaluationReportView report={report({ pdfAvailable: false })} evaluationId={9} />);
    expect(screen.queryByTestId("bilan-pdf-download")).toBeNull();
  });
});
