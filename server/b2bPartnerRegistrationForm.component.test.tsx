// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ pending: false, mutate: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    partnerModule: {
      uploadAuthorizationDocument: {
        useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
      },
    },
    placementPortal: {
      requestPartnerAccess: {
        useMutation: () => ({ mutate: state.mutate, isPending: state.pending }),
      },
    },
  },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (fr: string) => fr }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { B2bPartnerRegistrationForm } from "@/components/B2bPartnerRegistrationForm";

beforeEach(() => {
  state.pending = false;
  state.mutate.mockReset();
  window.localStorage.clear();
});

afterEach(() => cleanup());

describe("formulaire d’inscription partenaire — feedback de soumission", () => {
  it("affiche le chargement et verrouille le bouton pendant l’envoi", () => {
    state.pending = true;
    render(<B2bPartnerRegistrationForm />);

    const submit = screen.getByRole("button", { name: /Enregistrement/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Enregistrement…")).toBeTruthy();
  });

  it("annonce une validation lisible quand la confirmation d’identification manque", () => {
    render(<B2bPartnerRegistrationForm />);

    fireEvent.submit(screen.getByTestId("b2b-registration-form"));

    const message = screen.getByTestId("b2b-registration-validation");
    expect(message.getAttribute("role")).toBe("alert");
    expect(message.getAttribute("aria-live")).toBe("assertive");
    expect(message.textContent).toContain("Confirmez l’exactitude des informations");
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it("sauvegarde le brouillon local sans le mot de passe et annonce son statut", async () => {
    render(<B2bPartnerRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/raison sociale/i), { target: { value: "Entreprise Santé" } });

    await waitFor(() => {
      const draft = JSON.parse(window.localStorage.getItem("3m-placement-partner-request-draft") || "{}");
      expect(draft.legalName).toBe("Entreprise Santé");
      expect(draft.acknowledgeCharter).toBeUndefined();
      expect(screen.getByTestId("b2b-draft-status").textContent).toContain("Brouillon sauvegardé");
    }, { timeout: 1000 });
  });
});
