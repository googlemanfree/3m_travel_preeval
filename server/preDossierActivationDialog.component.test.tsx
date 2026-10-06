// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const h = vi.hoisted(() => ({
  account: {} as any,
  readiness: { data: undefined as any, isLoading: false },
  activate: vi.fn(),
  offline: vi.fn(),
  review: vi.fn(),
  confirmPayment: vi.fn(),
  toast: vi.fn(),
  activateError: null as null | { message: string },
  activateOptions: {} as any,
  confirmPaymentOptions: {} as any,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ adminCandidateManagement: { listPreDossierAccounts: { invalidate: vi.fn() }, list: { invalidate: vi.fn() }, preDossierActivationReadiness: { invalidate: vi.fn() } } }),
    adminCandidateManagement: {
      listPreDossierAccounts: { useQuery: () => ({ data: { total: 1, accounts: [h.account] }, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }) },
      preDossierActivationReadiness: { useQuery: () => ({ data: h.readiness.data, isLoading: h.readiness.isLoading }) },
      reviewEvaluationDeclaration: { useMutation: () => ({ mutate: h.review, isPending: false }) },
      validateOfflineEvaluation: { useMutation: () => ({ mutate: h.offline, isPending: false }) },
      activatePreDossierAccount: { useMutation: (options: any) => { h.activateOptions = options; return { mutate: h.activate, isPending: false, error: h.activateError, reset: vi.fn() }; } },
      confirmOpeningPaymentForAccount: { useMutation: (options: any) => { h.confirmPaymentOptions = options; return { mutate: h.confirmPayment, isPending: false, reset: vi.fn() }; } },
    },
  },
}));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: h.toast }) }));

import AdminPreDossierAccountsPanel from "@/components/AdminPreDossierAccountsPanel";

const account = (overrides: Record<string, unknown> = {}) => ({
  id: 42, fullName: "DJAMBONG TESSA", email: "tessa@example.com", phone: null, destinationPreference: "luxembourg", dossierStatus: "nouveau",
  emailVerified: true, createdAt: "2026-09-20T10:00:00Z", lastLoginAt: null, documentsCount: 2, pendingEvaluationReference: null, evaluationValidated: false, ...overrides,
});
const readiness = (overrides: Record<string, unknown> = {}) => ({
  candidateId: 42, accountReference: "COMPTE-00042", alreadyActive: false, evaluationValidated: false, paymentValidated: false, canActivate: false,
  blockers: [{ code: "evaluation", message: "L’évaluation doit être validée par un conseiller avant l’ouverture du dossier officiel." }, { code: "payment", message: "Le paiement doit être validé par un administrateur avant l’ouverture du dossier officiel." }],
  ...overrides,
});

const open = () => {
  render(<AdminPreDossierAccountsPanel sessionToken="jeton" />);
  // Le libellé du bouton du tableau dépend de l'état de l'évaluation : on ouvre la ligne, quel que soit ce libellé.
  fireEvent.click(screen.getByRole("button", { name: /Activer le dossier|Valider l’évaluation|Rattacher et activer/ }));
};
const confirmButton = () => screen.getByRole("button", { name: /Confirmer et activer|Activation…/ }) as HTMLButtonElement;

beforeEach(() => {
  h.account = account();
  h.readiness = { data: readiness(), isLoading: false };
  h.activateError = null;
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("dialogue « Activer le dossier client »", () => {
  it("bouton inactif = raison écrite à côté, plus un bouton grisé sans explication", () => {
    open();
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByTestId("activation-disabled-reason").textContent).toContain("évaluation doit être validée");
    expect(confirmButton().getAttribute("aria-describedby")).toBe("activation-disabled-reason");
    expect(confirmButton().parentElement?.getAttribute("title")).toContain("évaluation doit être validée");
    const checklist = screen.getByTestId("activation-checklist").textContent ?? "";
    expect(checklist).toContain("Évaluation à valider");
    expect(checklist).toContain("Paiement à valider");
  });

  it("annonce que COMPTE-… devient le numéro de dossier à l'activation", () => {
    open();
    expect(document.body.textContent).toContain("COMPTE-00042");
    expect(document.body.textContent).toContain("elle deviendra automatiquement le numéro de dossier 3M-");
  });

  it("compte sans évaluation déclarée : propose de confirmer l'évaluation remise, avec le bon identifiant (account_42)", () => {
    open();
    expect(screen.getByTestId("offline-evaluation-block")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer que l’évaluation a été remise" }));
    expect(h.offline).toHaveBeenCalledWith({ sessionToken: "jeton", candidateId: "account_42", channel: "agence", note: undefined });
  });

  it("évaluation déclarée mais à valider : le bloc de validation existant reste la seule option (pas de contournement hors ligne)", () => {
    h.account = account({ pendingEvaluationReference: "Évaluation externe à valider" });
    open();
    expect(screen.queryByTestId("offline-evaluation-block")).toBeNull();
    expect(document.body.textContent).toContain("Valider l’évaluation avant activation");
  });

  it("évaluation validée, paiement manquant : seul le paiement est cité et le bloc hors ligne disparaît", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "Le paiement doit être validé par un administrateur avant l’ouverture du dossier officiel." }] }), isLoading: false };
    open();
    expect(screen.queryByTestId("offline-evaluation-block")).toBeNull();
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByTestId("activation-disabled-reason").textContent).toContain("paiement doit être validé");
  });

  it("paiement manquant : le bloc de confirmation inline apparaît, avec champ référence et bouton caméra", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "Le paiement doit être validé par un administrateur avant l’ouverture du dossier officiel." }] }), isLoading: false };
    open();
    const block = screen.getByTestId("opening-payment-block");
    expect(block.textContent).toContain("Valider le paiement des frais d’ouverture");
    expect(screen.getByLabelText("Référence ou ID de transaction du paiement")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Filmer \/ photographier/ })).toBeTruthy();
  });

  it("paiement validé : le bloc de confirmation inline n'apparaît plus", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, paymentValidated: true, canActivate: true, blockers: [] }), isLoading: false };
    open();
    expect(screen.queryByTestId("opening-payment-block")).toBeNull();
  });

  it("prévisualise une photo de facture avant le dépôt", async () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "x" }] }), isLoading: false };
    open();
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "facture.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Photo ou vidéo de la facture"), { target: { files: [file] } });
    expect(await screen.findByTestId("opening-payment-proof-preview")).toBeTruthy();
    expect(screen.getByAltText("Aperçu de la facture")).toBeTruthy();
  });

  it("affiche l’indicateur de paiement validé dans la liste des comptes", () => {
    h.account = account({ paymentValidated: true });
    render(<AdminPreDossierAccountsPanel sessionToken="jeton" />);
    expect(screen.getByTestId("opening-payment-validated-42").textContent).toContain("Paiement validé");
  });

  it("ouvre instantanément l’aperçu de la preuve depuis le badge validé", () => {
    h.account = account({ paymentValidated: true, paymentProofUrl: "https://storage.example/facture.jpg", paymentReference: "OM-123" });
    render(<AdminPreDossierAccountsPanel sessionToken="jeton" />);
    fireEvent.click(screen.getByTestId("opening-payment-validated-42"));
    expect(screen.getByRole("dialog").textContent).toContain("Aperçu de la preuve de paiement");
    expect(screen.getByAltText("Preuve de paiement de DJAMBONG TESSA").getAttribute("src")).toBe("https://storage.example/facture.jpg");
    expect(screen.getByRole("dialog").textContent).toContain("OM-123");
  });

  it("filtre les comptes dont le paiement d’ouverture est encore en attente", () => {
    h.account = account({ paymentValidated: false });
    render(<AdminPreDossierAccountsPanel sessionToken="jeton" />);
    fireEvent.click(screen.getByRole("button", { name: "Paiements en attente" }));
    expect(screen.getByText("DJAMBONG TESSA")).toBeTruthy();
    h.account = account({ paymentValidated: true });
    cleanup();
    render(<AdminPreDossierAccountsPanel sessionToken="jeton" />);
    fireEvent.click(screen.getByRole("button", { name: "Paiements en attente" }));
    expect(screen.getByText("Aucun compte pré-dossier ne correspond à la recherche.")).toBeTruthy();
  });

  it("accepte une preuve déposée par glisser-déposer avec un état de zone actif", async () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "x" }] }), isLoading: false };
    open();
    const zone = screen.getByTestId("opening-payment-proof-dropzone");
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "preuve.jpg", { type: "image/jpeg" });
    fireEvent.dragEnter(zone, { dataTransfer: { files: [file] } });
    expect(zone.className).toContain("bg-amber-100");
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(await screen.findByTestId("opening-payment-proof-preview")).toBeTruthy();
  });

  it("confirme le paiement avec seulement une référence saisie (pas de fichier)", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "x" }] }), isLoading: false };
    open();
    fireEvent.change(
      screen.getByLabelText("Référence ou ID de transaction du paiement"),
      { target: { value: "OM-998877" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le paiement" }));
    expect(h.confirmPayment).toHaveBeenCalledWith({
      sessionToken: "jeton",
      candidateId: 42,
      paymentReference: "OM-998877",
      proofFileUrl: undefined,
    });
  });

  it("sans référence ni fichier joint : avertit au lieu d'appeler le serveur à l'aveugle", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, blockers: [{ code: "payment", message: "x" }] }), isLoading: false };
    open();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le paiement" }));
    expect(h.confirmPayment).not.toHaveBeenCalled();
    expect(h.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Preuve manquante" })
    );
  });

  it("tout est réuni : bouton actif, aucune raison affichée, l'activation part avec les bons paramètres", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, paymentValidated: true, canActivate: true, blockers: [] }), isLoading: false };
    open();
    expect(confirmButton().disabled).toBe(false);
    expect(screen.queryByTestId("activation-disabled-reason")).toBeNull();
    fireEvent.click(confirmButton());
    expect(h.activate).toHaveBeenCalledWith({ sessionToken: "jeton", candidateId: 42, destination: "luxembourg", visaType: "Études", adminNotes: undefined });
  });

  it("pendant la vérification des conditions : bouton inactif avec « Vérification… »", () => {
    h.readiness = { data: undefined, isLoading: true };
    open();
    expect(confirmButton().disabled).toBe(true);
    expect(screen.getByTestId("activation-disabled-reason").textContent).toContain("Vérification");
  });

  it("refus du serveur : le message reste affiché dans la boîte (et pas seulement dans un message qui disparaît)", () => {
    h.readiness = { data: readiness({ evaluationValidated: true, paymentValidated: true, canActivate: true, blockers: [] }), isLoading: false };
    h.activateError = { message: "Ce compte possède déjà un dossier actif." };
    open();
    expect(screen.getByRole("alert").textContent).toContain("Ce compte possède déjà un dossier actif.");
  });

  it("succès : le message annonce l'ancienne et la nouvelle référence", async () => {
    h.readiness = { data: readiness({ evaluationValidated: true, paymentValidated: true, canActivate: true, blockers: [] }), isLoading: false };
    open();
    h.activateOptions.onSuccess({ linkedExistingDossier: false, emailSent: true, previousAccountReference: "COMPTE-00042", dossierReference: "3M-AGN-0034" });
    const call = h.toast.mock.calls.at(-1)![0];
    expect(call.title).toBe("Dossier activé");
    expect(call.description).toContain("COMPTE-00042 devient 3M-AGN-0034");
    await waitFor(() => {
      expect(screen.getByTestId("activation-success").textContent).toContain("COMPTE-00042");
      expect(screen.getByTestId("activation-success").textContent).toContain("3M-AGN-0034");
      const successIcon = screen.getByTestId("activation-success").querySelector("svg")?.parentElement;
      expect(successIcon?.className).toContain("animate-bounce");
    });
  });

  it("copie la nouvelle référence et confirme visuellement l’action", async () => {
    h.readiness = { data: readiness({ evaluationValidated: true, paymentValidated: true, canActivate: true, blockers: [] }), isLoading: false };
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    open();
    h.activateOptions.onSuccess({ linkedExistingDossier: false, emailSent: true, previousAccountReference: "COMPTE-00042", dossierReference: "3M-AGN-0034" });

    const copyButton = await screen.findByTestId("copy-dossier-reference");
    expect(copyButton.getAttribute("aria-label")).toBe("Copier la référence 3M-AGN-0034");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("3M-AGN-0034");
      expect(screen.getByTestId("copy-dossier-reference").getAttribute("aria-label")).toBe("Référence 3M-AGN-0034 copiée");
      expect(screen.getByTestId("copy-dossier-reference-status").textContent).toContain("a été copiée dans le presse-papiers");
    });
  });
});
