// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const discoverMutate = vi.fn();
const jinkoMutate = vi.fn();
let jinkoError: { message: string } | null = null;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    tourism: {
      discover: { useMutation: () => ({ mutate: discoverMutate, isPending: false, data: undefined }) },
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    jinkoHotels: {
      search: { useMutation: () => ({ mutate: jinkoMutate, isPending: false, data: undefined, error: jinkoError }) },
    },
  },
}));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ candidate: null, isAuthenticated: false }) }));

import { ThreeMBookingExperience } from "../client/src/components/ThreeMBookingExperience";

beforeEach(() => {
  discoverMutate.mockClear();
  jinkoMutate.mockClear();
  jinkoError = null;
});
afterEach(cleanup);

const destinationInput = () => screen.getByLabelText("Destination") as HTMLInputElement;
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe("recherche d'hébergement : retour visible et une seule action", () => {
  it("le titre est en blanc explicite (il disparaissait sur le fond sombre)", () => {
    render(<ThreeMBookingExperience />);
    const title = screen.getByText("Votre séjour, plus clair dès le départ.");
    expect(title.className).toContain("text-white");
  });

  it("sans destination : message à côté du champ, champ en erreur et actif, aucune recherche lancée", () => {
    render(<ThreeMBookingExperience />);
    fireEvent.click(screen.getByTestId("booking-search"));
    const error = screen.getByTestId("booking-form-error");
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.textContent).toContain("Saisissez une ville");
    expect(destinationInput().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(destinationInput());
    expect(discoverMutate).not.toHaveBeenCalled();
    expect(jinkoMutate).not.toHaveBeenCalled();
    // Dès que le visiteur écrit, l'erreur disparaît.
    type(destinationInput(), "Do");
    expect(screen.queryByTestId("booking-form-error")).toBeNull();
  });

  it("le bouton vert « Vérifier » sans destination signale la même erreur au même endroit", () => {
    render(<ThreeMBookingExperience />);
    fireEvent.click(screen.getByText("Vérifier"));
    expect(screen.getByTestId("booking-form-error").textContent).toContain("Saisissez une ville");
    expect(jinkoMutate).not.toHaveBeenCalled();
  });

  it("« Rechercher » lance ensemble le catalogue 3M et la recherche en direct, avec les mêmes critères", () => {
    render(<ThreeMBookingExperience />);
    type(destinationInput(), "  Douala ");
    fireEvent.click(screen.getByTestId("booking-search"));
    expect(discoverMutate).toHaveBeenCalledTimes(1);
    expect(discoverMutate.mock.calls[0][0]).toMatchObject({ destination: "Douala" });
    expect(jinkoMutate).toHaveBeenCalledTimes(1);
    expect(jinkoMutate.mock.calls[0][0]).toMatchObject({ cityName: "Douala", countryCode: "CM", adults: 1, currency: "EUR" });
    // Une deuxième recherche relance les deux.
    fireEvent.click(screen.getByTestId("booking-search"));
    expect(discoverMutate).toHaveBeenCalledTimes(2);
    expect(jinkoMutate).toHaveBeenCalledTimes(2);
  });

  it("la touche Entrée dans le champ destination lance la recherche", () => {
    render(<ThreeMBookingExperience />);
    type(destinationInput(), "Paris");
    fireEvent.keyDown(destinationInput(), { key: "Enter" });
    expect(discoverMutate).toHaveBeenCalledTimes(1);
  });

  it("dates incohérentes : erreur sur les dates, pas de recherche", () => {
    render(<ThreeMBookingExperience />);
    type(destinationInput(), "Douala");
    type(screen.getByLabelText("Départ"), "2000-01-01");
    fireEvent.click(screen.getByTestId("booking-search"));
    expect(screen.getByTestId("booking-form-error").textContent).toContain("postérieure");
    expect(discoverMutate).not.toHaveBeenCalled();
    expect(jinkoMutate).not.toHaveBeenCalled();
  });

  it("une panne du fournisseur s'affiche dans la page, avec une issue : le conseiller 3M", () => {
    jinkoError = { message: "Le fournisseur hôtelier est temporairement indisponible." };
    render(<ThreeMBookingExperience />);
    const alert = screen.getByTestId("jinko-search-error");
    expect(alert.textContent).toContain("temporairement indisponible");
    expect(alert.textContent).toContain("conseiller 3M");
  });
});
