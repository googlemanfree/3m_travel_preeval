// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  publicData: undefined as any,
  mutate: undefined as any,
  mutation: { isPending: false, data: undefined as any, error: null as any },
  authenticated: true,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    paymentInstructions: {
      getPublic: { useQuery: () => ({ data: state.publicData }) },
      requestManualPayment: { useMutation: () => ({ mutate: state.mutate, ...state.mutation }) },
    },
  },
}));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ isAuthenticated: state.authenticated }) }));

import PaymentMethodsPanel from "@/components/PaymentMethodsPanel";
import PaymentFallbackPanel from "@/components/PaymentFallbackPanel";
import { EMPTY_PAYMENT_INSTRUCTIONS, parsePaymentInstructions } from "@shared/paymentMethods";

const configured = parsePaymentInstructions(JSON.stringify({
  bankTransfer: { bankName: "Banque Test", accountHolder: "3M Test SARL", iban: "FR76 3000 6000 0112 3456 7890 189", bic: "", accountNumber: "", note: "" },
  mobileMoney: [{ operator: "orange", number: "+237 6 55 00 00 00", accountName: "Titulaire Orange" }],
  agency: { address: "", hours: "", note: "" },
  generalNote: "",
}));
const agency = { address: "Yaoundé", hours: "8h–17h", whatsappNumber: "237698104832", whatsappDisplay: "+237 6 98 10 48 32", phoneDisplay: "+237 6 98 10 48 32" };

const reset = () => {
  state.publicData = { instructions: EMPTY_PAYMENT_INSTRUCTIONS, onlineEnabled: false, agency };
  state.mutate = vi.fn();
  state.mutation = { isPending: false, data: undefined, error: null };
  state.authenticated = true;
};
afterEach(() => {
  cleanup();
  reset();
});
reset();

describe("panneau des moyens de paiement", () => {
  it("sans réglages : le paiement en ligne est « bientôt », les coordonnées « sur demande », aucun compte affiché", () => {
    render(<PaymentMethodsPanel />);
    expect(screen.getByTestId("method-card").textContent).toContain("Bientôt disponible");
    expect(screen.getByTestId("method-bank_transfer").textContent).toContain("Coordonnées sur demande");
    expect(screen.getByTestId("method-cash_agency").textContent).toContain("Disponible");
    fireEvent.click(screen.getAllByText("Voir les coordonnées")[0]);
    expect(screen.getByTestId("details-on-request").textContent).toContain("Ne payez sur aucun autre compte");
    expect(screen.queryByTestId("bank-details")).toBeNull();
  });

  it("avec les coordonnées de l'admin : elles s'affichent avec le nom du titulaire à vérifier", () => {
    state.publicData = { instructions: configured, onlineEnabled: true, agency };
    render(<PaymentMethodsPanel />);
    expect(screen.getByTestId("method-card").textContent).toContain("Disponible");
    fireEvent.click(screen.getByTestId("method-bank_transfer").querySelector("button") as HTMLButtonElement);
    expect(screen.getByTestId("bank-details").textContent).toContain("FR76 3000 6000 0112 3456 7890 189");
    expect(screen.getByTestId("bank-details").textContent).toContain("3M Test SARL");
    fireEvent.click(screen.getByTestId("method-mobile_money_deposit").querySelector("button") as HTMLButtonElement);
    expect(screen.getByTestId("mobile-money-details").textContent).toContain("Titulaire Orange");
    expect(screen.getByTestId("mobile-money-details").textContent).toContain("vérifiez ce nom");
  });
});

describe("panneau de repli après un échec de paiement", () => {
  it("propose toujours WhatsApp avec la référence et le téléphone de l'agence", () => {
    render(<PaymentFallbackPanel reason="failed" reference="3M-2026-1234" amount={65000} />);
    const panel = screen.getByTestId("payment-fallback");
    expect(panel.getAttribute("data-reason")).toBe("failed");
    expect(panel.textContent).toContain("Votre paiement en ligne n’a pas abouti");
    expect(panel.textContent).toContain("Aucun règlement n’est enregistré");
    const whatsapp = screen.getByText("Contacter l’agence sur WhatsApp").closest("a") as HTMLAnchorElement;
    expect(whatsapp.href).toContain("https://wa.me/237698104832?text=");
    expect(decodeURIComponent(whatsapp.href)).toContain("3M-2026-1234");
  });

  it("un clic sur un mode enregistre la demande avec le motif « online_failed »", () => {
    render(<PaymentFallbackPanel reason="failed" reference="3M-2026-1234" kind="dossier" />);
    fireEvent.click(screen.getByText("Virement bancaire"));
    expect(state.mutate).toHaveBeenCalledWith({ kind: "dossier", reference: "3M-2026-1234", method: "bank_transfer", trigger: "online_failed" });
  });

  it("en mode « alternatives », le motif est « chosen » ; pour un vol, le type est « flight »", () => {
    render(<PaymentFallbackPanel reference="FB-2026-ABC123" kind="flight" />);
    fireEvent.click(screen.getByText("Dépôt Mobile Money sur le numéro de l’agence"));
    expect(state.mutate).toHaveBeenCalledWith({ kind: "flight", reference: "FB-2026-ABC123", method: "mobile_money_deposit", trigger: "chosen" });
  });

  it("client non connecté : boutons désactivés, WhatsApp reste possible", () => {
    state.authenticated = false;
    render(<PaymentFallbackPanel reason="failed" reference="3M-2026-1234" />);
    expect((screen.getByText("Virement bancaire").closest("button") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Connectez-vous").getAttribute("href")).toBe("/login");
    expect(screen.getByText("Contacter l’agence sur WhatsApp")).toBeTruthy();
  });

  it("sans référence : aucun bouton d'envoi d'e-mail, seulement le contact agence", () => {
    render(<PaymentFallbackPanel reason="failed" />);
    expect(screen.queryByText("Recevoir les instructions par e-mail")).toBeNull();
    expect(screen.getByText("Contacter l’agence sur WhatsApp")).toBeTruthy();
  });

  it("après la demande : confirme, rappelle que rien n'est validé avant réception et affiche les coordonnées de l'admin", () => {
    const { rerender } = render(<PaymentFallbackPanel reason="failed" reference="3M-2026-1234" />);
    fireEvent.click(screen.getByText("Virement bancaire"));
    state.mutation = { isPending: false, error: null, data: { success: true, clientEmailSent: true, instructions: configured, agency, method: "bank_transfer" } };
    rerender(<PaymentFallbackPanel reason="failed" reference="3M-2026-1234" />);
    const result = screen.getByTestId("manual-payment-result");
    expect(result.textContent).toContain("Instructions envoyées par e-mail");
    expect(result.textContent).toContain("le paiement est validé à sa réception");
    expect(result.textContent).toContain("Banque Test");
  });

  it("affiche l'erreur du serveur sans la masquer", () => {
    state.mutation = { isPending: false, data: undefined, error: { message: "Dossier introuvable." } };
    render(<PaymentFallbackPanel reference="3M-2026-9999" />);
    expect(screen.getByRole("alert").textContent).toBe("Dossier introuvable.");
  });
});
