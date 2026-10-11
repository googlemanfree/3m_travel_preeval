// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type Handlers = { onSuccess?: (result: any) => unknown; onError?: (error: any) => unknown };

const { state } = vi.hoisted(() => ({
  state: { calls: [] as any[], next: undefined as undefined | ((handlers: Handlers) => unknown), toast: { success: vi.fn(), error: vi.fn() } },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    application: {
      adminSetOpeningFee: {
        useMutation: () => ({ isPending: false, mutate: (variables: any, handlers: Handlers) => { state.calls.push(variables); state.next?.(handlers); } }),
      },
    },
  },
}));
vi.mock("sonner", () => ({ toast: state.toast }));

import AdminOpeningFeeDialog from "@/components/AdminOpeningFeeDialog";

const payment = { id: 12, dossierNumber: "3M-2026-0012", fullName: "Aïcha Nkolo", expectedAmount: 65000, currency: "XAF" };
const mount = (onSaved = vi.fn(), onClose = vi.fn()) => ({ onSaved, onClose, ...render(<AdminOpeningFeeDialog payment={payment} onClose={onClose} onSaved={onSaved} />) });
const save = () => screen.getByRole("button", { name: /Enregistrer le montant/ }) as HTMLButtonElement;

beforeEach(() => {
  state.calls.length = 0;
  state.next = undefined;
  state.toast.success.mockClear();
  state.toast.error.mockClear();
});
afterEach(() => cleanup());

describe("dialogue « Modifier le montant » des frais d'ouverture (administrateur)", () => {
  it("affiche le dossier et le montant actuel, et n'enregistre rien tant que le montant et le motif ne sont pas valides", () => {
    mount();
    expect(screen.getByText(/Frais d’ouverture du dossier 3M-2026-0012/)).toBeTruthy();
    expect(screen.getByText(/Montant actuel : 65 000 XAF/)).toBeTruthy();
    expect(save().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Montant \(XAF\)/), { target: { value: "40000" } });
    expect(save().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Profil étudiant" } });
    expect(save().disabled).toBe(false);
  });

  it("un montant hors bornes affiche une alerte et bloque l'enregistrement", () => {
    mount();
    fireEvent.change(screen.getByLabelText(/Montant \(XAF\)/), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Profil étudiant" } });
    expect(screen.getByRole("alert").textContent).toContain("entre 1 000 XAF et 5 000 000 XAF");
    expect(save().disabled).toBe(true);
  });

  it("envoie dossier, montant et motif, confirme par un message puis prévient la liste", () => {
    state.next = (handlers) => handlers.onSuccess?.({ id: 12, amount: 40000, previousAmount: 65000, changed: true });
    const { onSaved } = mount();
    fireEvent.change(screen.getByLabelText(/Montant \(XAF\)/), { target: { value: "40000" } });
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "  Profil étudiant " } });
    fireEvent.click(save());
    expect(state.calls).toEqual([{ id: 12, amount: 40000, reason: "Profil étudiant" }]);
    expect(state.toast.success).toHaveBeenCalledWith("Frais d’ouverture fixés à 40 000 XAF");
    expect(onSaved).toHaveBeenCalled();
  });

  it("un refus du serveur (paiement déjà validé) est affiché tel quel et la liste n'est pas rechargée", () => {
    state.next = (handlers) => handlers.onError?.(new Error("Le paiement de ce dossier est déjà validé."));
    const { onSaved } = mount();
    fireEvent.change(screen.getByLabelText(/Montant \(XAF\)/), { target: { value: "40000" } });
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Profil étudiant" } });
    fireEvent.click(save());
    expect(state.toast.error).toHaveBeenCalledWith("Le paiement de ce dossier est déjà validé.");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
