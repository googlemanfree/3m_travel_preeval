// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OfficeContactPanel from "../client/src/components/OfficeContactPanel";
import { OfficeContactProvider } from "../client/src/contexts/OfficeContactContext";

function renderPanel() {
  return render(
    <OfficeContactProvider>
      <OfficeContactPanel />
    </OfficeContactProvider>,
  );
}

function getOfficeSwitch(label: "Ottawa, Canada" | "Yaoundé") {
  const button = screen.getByText(label).closest("button");
  if (!button) throw new Error(`Sélecteur ${label} introuvable`);
  return button;
}

describe("OfficeContactPanel — parcours interactif", () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    openSpy.mockReset();
    vi.stubGlobal("open", openSpy);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("bascule visiblement Ottawa vers Cameroun avec le fuseau, les horaires et le CTA associés", () => {
    renderPanel();
    expect(getOfficeSwitch("Ottawa, Canada").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("link", { name: /WhatsApp : \+1 672 897 2999/i }).getAttribute("href")).toContain("wa.me/16728972999");

    fireEvent.click(getOfficeSwitch("Yaoundé"));

    expect(getOfficeSwitch("Yaoundé").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/Heure de Douala/i)).toBeTruthy();
    expect(screen.getByText(/Lun–ven : 08 h 00 – 20 h 00/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /WhatsApp : \+237 698 104 832/i }).getAttribute("href")).toContain("wa.me/237698104832");
  });

  it("annonce les erreurs puis ouvre le WhatsApp du bureau sélectionné avec le message saisi", () => {
    renderPanel();
    fireEvent.click(getOfficeSwitch("Yaoundé"));
    fireEvent.click(screen.getByRole("button", { name: /Continuer vers WhatsApp/i }));
    expect(screen.getByRole("alert").textContent).toContain("Indiquez votre nom.");

    fireEvent.change(screen.getByLabelText("Votre nom"), { target: { value: "Marie Dupont" } });
    fireEvent.change(screen.getByLabelText("Votre adresse e-mail"), { target: { value: "marie@example.com" } });
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: "Je souhaite préparer mon projet de voyage avec votre équipe." } });
    fireEvent.click(screen.getByRole("button", { name: /Continuer vers WhatsApp · Yaoundé/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("wa.me/237698104832"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent("Bureau de Yaoundé, Cameroun"));
  });

  it("reste opérable au clavier avec un focus visible et une erreur annoncée", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.tab();
    expect(document.activeElement).toBe(getOfficeSwitch("Ottawa, Canada"));
    expect(getOfficeSwitch("Ottawa, Canada").className).toContain("focus-visible:ring-2");

    await user.tab();
    expect(document.activeElement).toBe(getOfficeSwitch("Yaoundé"));
    await user.keyboard("{Enter}");
    expect(getOfficeSwitch("Yaoundé").getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /Continuer vers WhatsApp/i }));
    expect(screen.getByRole("alert").getAttribute("role")).toBe("alert");
    expect(screen.getByLabelText("Votre nom")).toBeTruthy();
    expect(screen.getByLabelText("Votre adresse e-mail")).toBeTruthy();
    expect(screen.getByLabelText("Votre message")).toBeTruthy();
  });
});
