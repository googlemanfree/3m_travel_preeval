// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getCandidateDetails = vi.fn();
const activatePreDossierAccount = vi.fn();
const reviewEvaluationDeclaration = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      getCandidateDetails: { useQuery: (...args: unknown[]) => getCandidateDetails(...args) },
      updateCandidateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      revertCandidateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    adminCandidateManagement: {
      activatePreDossierAccount: { useMutation: () => ({ mutate: activatePreDossierAccount, isPending: false }) },
      reviewEvaluationDeclaration: { useMutation: () => ({ mutate: reviewEvaluationDeclaration, isPending: false }) },
      deliverValidatedEvaluation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { CandidateDetailModal } from "@/pages/AdminDashboard";

describe("CandidateDetailModal — traitement d’un compte pré-dossier", () => {
  beforeEach(() => {
    sessionStorage.setItem("adminSessionToken", "session-admin-valide");
    getCandidateDetails.mockReturnValue({
      data: {
        candidate: {
          id: "account_42",
          internalId: 42,
          folderCode: "COMPTE-00042",
          fullName: "Candidat pré-dossier",
          email: "candidat@example.com",
          whatsapp: "+237698104832",
          city: "Compte en ligne",
          destinationCountry: "Canada",
          projectType: "À qualifier",
          status: "PENDING_48H",
          source: "ACCOUNT_ONLY",
          scoringTotal: null,
          evaluationDeclarationStatus: "validated",
          evaluationDeclaredAt: new Date("2026-08-22T10:00:00.000Z"),
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("permet de renseigner la procédure, confirmer et lancer l’activation depuis la fiche", async () => {
    const user = userEvent.setup();
    render(<CandidateDetailModal candidateId="account_42" onClose={vi.fn()} onStatusUpdated={vi.fn()} onOpenOperations={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Actions de traitement du compte pré-dossier" })).toBeTruthy();
    await user.type(screen.getByLabelText("Procédure"), "Études");
    await user.type(screen.getByLabelText("Note interne"), "Pièces vérifiées en agence.");
    await user.click(screen.getByRole("button", { name: "Ouvrir le dossier et activer le suivi" }));
    await user.click(await screen.findByRole("button", { name: "Confirmer l’activation" }));

    expect(activatePreDossierAccount).toHaveBeenCalledWith({
      sessionToken: "session-admin-valide",
      candidateId: 42,
      destination: "Canada",
      visaType: "Études",
      adminNotes: "Pièces vérifiées en agence.",
    });
  });
});
