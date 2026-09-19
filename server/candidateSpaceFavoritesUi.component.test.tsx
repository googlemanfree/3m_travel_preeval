// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
}

const state = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ candidate: { getClientDashboardSummary: { invalidate: state.invalidate } } }),
    candidate: {
      updateProfile: {
        useMutation: (options: any) => ({
          isPending: false,
          mutate: (variables: any) => {
            state.mutate(variables);
            options?.onSuccess?.({ success: true }, variables);
          },
        }),
      },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CountryFlag from "@/components/CountryFlag";
import FavoriteDestinationsCard from "@/components/FavoriteDestinationsCard";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { computeProfileCompletion } from "@shared/profileCompletion";

const country = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}\\b`) });
const saveButton = () => screen.getByRole("button", { name: /Enregistrer mes destinations/ });

afterEach(cleanup);

describe("CountryFlag — miniature de drapeau", () => {
  it("affiche une vraie image de drapeau (1x et 2x) plutôt qu'un emoji illisible sous Windows", () => {
    const { container } = render(<CountryFlag flag="🇨🇦" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://flagcdn.com/w40/ca.png");
    expect(img!.getAttribute("srcset")).toContain("https://flagcdn.com/w80/ca.png 2x");
    expect(img!.getAttribute("alt")).toBe("");
  });

  it("retombe sur l'emoji quand le symbole n'est pas un drapeau, ou quand l'image ne charge pas", () => {
    const globe = render(<CountryFlag flag="🌐" />);
    expect(globe.container.querySelector("img")).toBeNull();
    expect(globe.container.textContent).toBe("🌐");
    cleanup();

    const { container } = render(<CountryFlag flag="🇫🇷" />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("🇫🇷");
  });
});

describe("FavoriteDestinationsCard — destinations favorites", () => {
  beforeEach(() => {
    state.mutate.mockClear();
    state.invalidate.mockClear();
  });

  it("propose toutes les destinations par région, aucune choisie au départ, sans pouvoir enregistrer", () => {
    render(<FavoriteDestinationsCard saved={[]} />);

    for (const region of ["Europe", "Amérique du Nord", "Océanie", "Golfe et Moyen-Orient", "Asie"]) {
      expect(screen.getByRole("group", { name: region })).toBeTruthy();
    }
    expect(within(screen.getByRole("group", { name: "Europe" })).getAllByRole("button")).toHaveLength(12);
    expect(country("Canada").getAttribute("aria-pressed")).toBe("false");
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Choisissez au moins une destination.")).toBeTruthy();
    expect(screen.getByText("0/3 choisies")).toBeTruthy();
  });

  it("marque la première destination comme principale et verrouille les autres à trois choix", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={[]} />);

    await user.click(country("Canada"));
    await user.click(country("France"));
    await user.click(country("Belgique"));

    expect(country("Canada").getAttribute("aria-pressed")).toBe("true");
    expect(within(country("Canada")).getByText("Principale")).toBeTruthy();
    expect(within(country("France")).getByText("2")).toBeTruthy();
    expect(within(country("Belgique")).getByText("3")).toBeTruthy();
    expect(screen.getByText("3/3 choisies")).toBeTruthy();
    expect(country("Portugal").hasAttribute("disabled")).toBe(true);

    await user.click(country("Portugal"));
    expect(country("Portugal").getAttribute("aria-pressed")).toBe("false");

    await user.click(country("France"));
    expect(country("Portugal").hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("2/3 choisies")).toBeTruthy();
  });

  it("enregistre les pays dans l'ordre choisi, rafraîchit l'espace personnel et se remet au repos", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<FavoriteDestinationsCard saved={[]} onSaved={onSaved} />);

    await user.click(country("Canada"));
    await user.click(country("France"));
    expect(screen.getByText("Modifications non enregistrées.")).toBeTruthy();
    expect(saveButton().hasAttribute("disabled")).toBe(false);

    await user.click(saveButton());

    expect(state.mutate).toHaveBeenCalledTimes(1);
    expect(state.mutate).toHaveBeenCalledWith({ preferredDestinations: ["Canada", "France"] });
    expect(state.invalidate).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith("canada");
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Modifications non enregistrées.")).toBeNull();
  });

  it("reprend les destinations déjà enregistrées sans proposer d'enregistrer tant que rien ne change", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={["Luxembourg"]} />);

    expect(country("Luxembourg").getAttribute("aria-pressed")).toBe("true");
    expect(within(country("Luxembourg")).getByText("Principale")).toBeTruthy();
    expect(saveButton().hasAttribute("disabled")).toBe(true);

    await user.click(country("Pologne"));
    expect(saveButton().hasAttribute("disabled")).toBe(false);
    await user.click(saveButton());
    expect(state.mutate).toHaveBeenCalledWith({ preferredDestinations: ["Luxembourg", "Pologne"] });
  });

  it("ne permet pas d'enregistrer une liste vidée", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={["Canada"]} />);

    await user.click(country("Canada"));

    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Choisissez au moins une destination.")).toBeTruthy();
    expect(state.mutate).not.toHaveBeenCalled();
  });
});

describe("ProfileCompletionBar — barre de progression du profil", () => {
  const newCandidate = computeProfileCompletion({
    fullName: "Aïcha Nkolo",
    avatarVerificationStatus: "verified",
    preferredDestinations: JSON.stringify(["Canada"]),
  });

  it("montre la progression, ce qu'il reste à compléter, et ouvre le profil au clic", async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    render(<ProfileCompletionBar completion={newCandidate} onEditClick={onEditClick} />);

    const bar = screen.getByRole("progressbar", { name: "Progression de votre profil" });
    expect(bar.getAttribute("aria-valuenow")).toBe("30");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(screen.getByText("30 %")).toBeTruthy();
    expect(screen.getByText(/3 étapes sur 10 terminées/)).toBeTruthy();

    const remaining = within(screen.getByRole("list", { name: "Éléments restant à compléter" }));
    for (const label of ["Téléphone", "Nationalité", "Date de naissance", "Niveau de langue"]) {
      expect(remaining.getByText(label)).toBeTruthy();
    }
    expect(remaining.queryByText("Destinations favorites")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Compléter mon profil" }));
    expect(onEditClick).toHaveBeenCalledTimes(1);
  });

  it("disparaît une fois le profil complet à 100 %", () => {
    const complete = computeProfileCompletion({
      fullName: "Aïcha Nkolo",
      avatarVerificationStatus: "verified",
      preferredDestinations: ["Canada"],
      phone: "+237 600 00 00 00",
      nationality: "Camerounaise",
      dateOfBirth: "1995-04-12",
      visaType: "Études",
      educationLevel: "Licence",
      employmentStatus: "Étudiante",
      languageLevel: "DELF B2",
    });
    const { container } = render(<ProfileCompletionBar completion={complete} onEditClick={vi.fn()} />);
    expect(complete.percent).toBe(100);
    expect(container.innerHTML).toBe("");
  });
});
