// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getCandidateDetails = vi.fn();
const activatePreDossierAccount = vi.fn();
const reviewEvaluationDeclaration = vi.fn();
let activationErrorMessage: string | null = null;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { getCandidateDetails: { invalidate: vi.fn() } }, adminCandidateManagement: {} }),
    adminAuth: {
      bootstrapPlatformSession: { useQuery: () => ({ data: null, isLoading: false }) },
    },
    monitoring: {
      getEvaluationDeliveryHealth: { useQuery: () => ({ data: null, isLoading: false }) },
    },
    unifiedRequests: {
      initializeEvaluationDelivery: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      getEvaluationDelivery: { useQuery: () => ({ data: null, isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn() }) },
      saveEvaluationDeliveryDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendEvaluationNow: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      scheduleEvaluationDelivery: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      approveSensitiveEvaluation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      validateEvaluationDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      previewEvaluationDeliveryEmail: { useQuery: () => ({ data: null, isLoading: false }) },
      previewEvaluationDeliveryPdf: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendEvaluationTestEmail: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    admin: {
      getCandidateDetails: { useQuery: (...args: unknown[]) => getCandidateDetails(...args) },
      updateCandidateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      revertCandidateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    adminCandidateManagement: {
      activatePreDossierAccount: { useMutation: (options: { onError?: (error: Error) => void }) => ({ mutate: (...args: unknown[]) => { activatePreDossierAccount(...args); if (activationErrorMessage) options.onError?.(new Error(activationErrorMessage)); }, isPending: false }) },
      reviewEvaluationDeclaration: { useMutation: () => ({ mutate: reviewEvaluationDeclaration, isPending: false }) },
      validateOfflineEvaluation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendAgreementProtocol: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      approvePaymentReceipt: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      sendPaymentReceiptForCandidate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      confirmPaymentForCandidate: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deliverValidatedEvaluation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/PDFPreviewModal", () => ({ PDFPreviewModal: () => null }));

import { CandidateDetailModal } from "@/pages/AdminDashboard";

describe("CandidateDetailModal — traitement d’un compte pré-dossier", () => {
  beforeEach(() => {
    sessionStorage.setItem("adminSessionToken", "session-admin-valide");
    activationErrorMessage = null;
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
    activationErrorMessage = null;
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

  it("affiche le refus serveur et réarme la confirmation si un dossier actif existe déjà", async () => {
    activationErrorMessage = "Ce compte possède déjà un dossier actif.";
    const user = userEvent.setup();
    render(<CandidateDetailModal candidateId="account_42" onClose={vi.fn()} onStatusUpdated={vi.fn()} onOpenOperations={vi.fn()} />);

    await user.type(screen.getByLabelText("Procédure"), "Travail");
    await user.click(screen.getByRole("button", { name: "Ouvrir le dossier et activer le suivi" }));
    await user.click(await screen.findByRole("button", { name: "Confirmer l’activation" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Ce compte possède déjà un dossier actif.");
    expect((screen.getByRole("button", { name: "Confirmer l’activation" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
