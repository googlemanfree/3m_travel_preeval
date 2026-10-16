// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  data: null as any,
  saved: [] as any[],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    adminPassportIdentity: {
      get: { useQuery: () => ({ data: state.data, isLoading: false, refetch: vi.fn() }) },
      save: { useMutation: (handlers: any) => ({ isPending: false, mutate: (variables: any) => { state.saved.push(variables); handlers.onSuccess?.({ success: true }); } }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import AdminPassportIdentityCard from "@/components/AdminPassportIdentityCard";

const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;

beforeEach(() => { state.data = null; state.saved = []; });
afterEach(() => cleanup());

describe("carte « Contrôle du passeport » (fiche 360°)", () => {
  it("sans candidat valide, rien n'est affiché", () => {
    const { container } = render(<AdminPassportIdentityCard sessionToken="tok" candidateId={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("sans passeport déposé : message clair, aucun contrôle inventé", () => {
    state.data = { candidate: { fullName: "A B", dateOfBirth: null }, file: null, identity: null, expiry: null, discrepancies: [] };
    render(<AdminPassportIdentityCard sessionToken="tok" candidateId={5} />);
    expect(screen.getByTestId("passport-missing")).toBeTruthy();
    expect(screen.queryByTestId("passport-expiry-badge")).toBeNull();
  });

  it("passeport déposé mais données non saisies : le dit, sans validité affichée", () => {
    state.data = { candidate: { fullName: "A B", dateOfBirth: null }, file: { id: 9, fileName: "passeport.pdf", status: "uploaded" }, identity: null, expiry: null, discrepancies: [] };
    render(<AdminPassportIdentityCard sessionToken="tok" candidateId={5} />);
    expect(screen.getByTestId("passport-not-entered").textContent).toContain("non contrôlées");
    expect(screen.queryByTestId("passport-expiry-badge")).toBeNull();
  });

  it("affiche la validité insuffisante et les écarts à confirmer", () => {
    state.data = {
      candidate: { fullName: "Fatou Diallo", dateOfBirth: "1990-01-01" },
      file: { id: 9, fileName: "passeport.pdf", status: "uploaded" },
      identity: { surname: "NKOLO", givenNames: "Aïcha", dateOfBirth: "1995-03-14", passportNumber: "AB123456", expiryDate: "2027-01-01", plannedTravelDate: null, enteredBy: "agent@3mtravelagency.com", enteredAt: "2026-10-16T09:00:00Z" },
      expiry: { status: "too_short", daysLeft: 77, mustBeValidUntil: "2027-04-16", message: "Passeport valable 77 jour(s)." },
      discrepancies: [{ field: "name", message: "Nom différent : à confirmer avec le candidat." }],
    };
    render(<AdminPassportIdentityCard sessionToken="tok" candidateId={5} />);
    expect(screen.getByTestId("passport-expiry-badge").textContent).toBe("Validité insuffisante");
    expect(screen.getByTestId("passport-discrepancies").textContent).toContain("à confirmer avec le candidat");
  });

  it("la saisie envoie les données du passeport pour le bon fichier", () => {
    state.data = { candidate: { fullName: "A B", dateOfBirth: null }, file: { id: 9, fileName: "passeport.pdf", status: "uploaded" }, identity: null, expiry: null, discrepancies: [] };
    render(<AdminPassportIdentityCard sessionToken="tok" candidateId={5} />);
    fireEvent.click(screen.getByTestId("passport-identity-toggle"));
    expect((screen.getByTestId("passport-identity-save") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(field(/Nom de famille/), { target: { value: "Nkolo" } });
    fireEvent.change(field(/Prénoms/), { target: { value: "Aïcha" } });
    fireEvent.change(field(/Date de naissance/), { target: { value: "1995-03-14" } });
    fireEvent.change(field(/Numéro de passeport/), { target: { value: "AB123456" } });
    fireEvent.change(field(/Date d’expiration/), { target: { value: "2031-01-01" } });
    fireEvent.click(screen.getByTestId("passport-identity-save"));
    expect(state.saved[0]).toMatchObject({ sessionToken: "tok", candidateId: 5, fileId: 9, surname: "Nkolo", passportNumber: "AB123456", expiryDate: "2031-01-01", plannedTravelDate: null });
  });
});
