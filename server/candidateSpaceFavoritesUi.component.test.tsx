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
import { CountrySelect, DestinationPicker } from "@/components/CountryPicker";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { computeProfileCompletion } from "@shared/profileCompletion";

const searchBox = () => screen.getByRole("combobox", { name: "Rechercher une destination" });
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

describe("FavoriteDestinationsCard — destinations favorites parmi tous les pays", () => {
  beforeEach(() => {
    state.mutate.mockClear();
    state.invalidate.mockClear();
  });

  it("propose la recherche parmi tous les pays et des pays populaires en un clic, sans rien choisir au départ", () => {
    render(<FavoriteDestinationsCard saved={[]} />);

    expect(searchBox()).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Destinations sélectionnées" })).toBeNull();
    expect(within(screen.getByRole("group", { name: "Destinations populaires" })).getAllByRole("button")).toHaveLength(6);
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Choisissez au moins une destination.")).toBeTruthy();
    expect(screen.getByText("0/3 choisies")).toBeTruthy();
  });

  it("retrouve un pays hors de l'ancienne liste, même mal orthographié (accents, apostrophe)", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={[]} />);

    await user.type(searchBox(), "cote d'ivoire");
    await user.click(screen.getByRole("option", { name: /^Côte d’Ivoire/ }));

    const chips = within(screen.getByRole("list", { name: "Destinations sélectionnées" }));
    expect(chips.getByRole("button", { name: "Retirer Côte d’Ivoire" })).toBeTruthy();
    expect(chips.getByText("Principale")).toBeTruthy();
  });

  it("verrouille la recherche à trois choix et la rouvre dès qu'on en retire un", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={[]} />);

    for (const name of ["Canada", "France", "Belgique"]) {
      await user.click(within(screen.getByRole("group", { name: "Destinations populaires" })).getByRole("button", { name }));
    }

    const chips = within(screen.getByRole("list", { name: "Destinations sélectionnées" }));
    expect(chips.getAllByRole("button")).toHaveLength(3);
    expect(chips.getByText("Principale")).toBeTruthy();
    expect(screen.getByText("3/3 choisies")).toBeTruthy();
    expect(searchBox().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByRole("group", { name: "Destinations populaires" })).toBeNull();

    await user.click(chips.getByRole("button", { name: "Retirer France" }));
    expect(searchBox().hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("2/3 choisies")).toBeTruthy();
  });

  it("enregistre les pays dans l'ordre choisi, rafraîchit l'espace personnel et se remet au repos", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={[]} />);

    await user.type(searchBox(), "senegal");
    await user.click(screen.getByRole("option", { name: /^Sénégal/ }));
    await user.click(within(screen.getByRole("group", { name: "Destinations populaires" })).getByRole("button", { name: "Canada" }));
    expect(screen.getByText("Modifications non enregistrées.")).toBeTruthy();

    await user.click(saveButton());

    expect(state.mutate).toHaveBeenCalledTimes(1);
    expect(state.mutate).toHaveBeenCalledWith({ preferredDestinations: ["Sénégal", "Canada"] });
    expect(state.invalidate).toHaveBeenCalledTimes(1);
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Modifications non enregistrées.")).toBeNull();
  });

  it("reprend les destinations déjà enregistrées, y compris en ancienne graphie, sans proposer d'enregistrer", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={["luxembourg"]} />);

    const chips = within(screen.getByRole("list", { name: "Destinations sélectionnées" }));
    expect(chips.getByRole("button", { name: "Retirer Luxembourg" })).toBeTruthy();
    expect(chips.getByText("Principale")).toBeTruthy();
    expect(saveButton().hasAttribute("disabled")).toBe(true);

    await user.type(searchBox(), "pologne");
    await user.click(screen.getByRole("option", { name: /^Pologne/ }));
    await user.click(saveButton());
    expect(state.mutate).toHaveBeenCalledWith({ preferredDestinations: ["Luxembourg", "Pologne"] });
  });

  it("ne permet pas d'enregistrer une liste vidée", async () => {
    const user = userEvent.setup();
    render(<FavoriteDestinationsCard saved={["Canada"]} />);

    await user.click(screen.getByRole("button", { name: "Retirer Canada" }));

    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Choisissez au moins une destination.")).toBeTruthy();
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it("dit honnêtement si le pays principal a un guide détaillé ou si un conseiller étudiera le projet", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FavoriteDestinationsCard saved={["Canada"]} />);
    expect(screen.getByText(/Guide 3M disponible pour Canada/)).toBeTruthy();

    rerender(<FavoriteDestinationsCard saved={["Sénégal"]} />);
    expect(screen.getByText(/Pas encore de guide détaillé pour Sénégal/)).toBeTruthy();
    expect(screen.getByText(/un conseiller étudie votre projet/)).toBeTruthy();
    expect(user).toBeTruthy();
  });
});

describe("CountrySelect et DestinationPicker — sélecteurs de pays partagés", () => {
  it("CountrySelect : liste « Populaires » puis « Tous les pays », choix au clavier, champ natif pour FormData", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<CountrySelect id="cs" name="destinationCountry" ariaLabel="Pays de destination" value="" onChange={onChange} />);

    const box = screen.getByRole("combobox", { name: "Pays de destination" });
    await user.click(box);
    expect(screen.getByText("Populaires")).toBeTruthy();
    expect(screen.getByText("Tous les pays")).toBeTruthy();
    expect(screen.getAllByRole("option").length).toBe(196);

    await user.type(box, "alle");
    expect(screen.getAllByRole("option")[0].getAttribute("aria-label")).toMatch(/^Allemagne/);
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("Allemagne");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(container.querySelector('input[type="hidden"][name="destinationCountry"]')).not.toBeNull();
  });

  it("CountrySelect : affiche le pays choisi (drapeau + nom), ou telle quelle une valeur historique, et permet d'effacer", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(<CountrySelect id="cs2" ariaLabel="Pays" value="canada" onChange={onChange} allowClear />);
    expect((screen.getByRole("combobox", { name: "Pays" }) as HTMLInputElement).value).toBe("Canada");
    expect(container.querySelector("img")?.getAttribute("src")).toContain("/ca.png");

    await user.click(screen.getByRole("button", { name: "Effacer le pays" }));
    expect(onChange).toHaveBeenCalledWith("");

    rerender(<CountrySelect id="cs2" ariaLabel="Pays" value="Autre pays" onChange={onChange} />);
    expect((screen.getByRole("combobox", { name: "Pays" }) as HTMLInputElement).value).toBe("Autre pays");
  });

  it("navigation clavier : flèches, Entrée et Échap", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect id="cs3" ariaLabel="Pays" value="" onChange={onChange} />);

    const box = screen.getByRole("combobox", { name: "Pays" });
    await user.click(box);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const active = box.getAttribute("aria-activedescendant");
    expect(active).toBe(document.querySelectorAll('[role="option"]')[2].id);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    await user.type(box, "zzzz");
    expect(screen.getByText("Aucun pays ne correspond à votre recherche.")).toBeTruthy();
  });

  it("DestinationPicker : limite à `max`, ignore les doublons et normalise les valeurs reçues", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DestinationPicker id="dp" value={["canada", "Canada"]} onChange={onChange} max={2} />);

    const chips = within(screen.getByRole("list", { name: "Destinations sélectionnées" }));
    expect(chips.getAllByRole("button")).toHaveLength(1);

    await user.type(screen.getByRole("combobox", { name: "Rechercher une destination" }), "japon");
    await user.click(screen.getByRole("option", { name: /^Japon/ }));
    expect(onChange).toHaveBeenCalledWith(["Canada", "Japon"]);
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
