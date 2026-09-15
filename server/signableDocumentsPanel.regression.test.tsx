// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignableDocumentsPanel } from "../client/src/components/SignableDocumentsPanel";

describe("SignableDocumentsPanel — pré-compte sans dossier actif", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
  it("affiche l’état explicite et ne propose pas de signature lorsque activeDossier est absent", () => {
    render(<SignableDocumentsPanel activeDossier={null} documents={[]} onOpenProtocol={vi.fn()} />);

    expect(screen.getByText("Pré-compte · activation en attente")).toBeTruthy();
    expect(screen.getByText("Pas encore de dossier actif")).toBeTruthy();
    expect(screen.getByText(/aucun dossier officiel n’a encore été ouvert/i)).toBeTruthy();
    expect(screen.queryByText("Dossier actif · signature encadrée")).toBeNull();
    expect(screen.getByRole("button", { name: "Dossier non ouvert" }).getAttribute("disabled")).not.toBeNull();
  });

  it("conserve le verrouillage paiement pour un dossier actif non payé", () => {
    render(<SignableDocumentsPanel activeDossier={{ dossierNumber: "EVAL-DRAFT-TEST", paymentStatus: "PENDING" }} documents={[]} onOpenProtocol={vi.fn()} />);

    expect(screen.getByText("Dossier actif · signature encadrée")).toBeTruthy();
    expect(screen.getByRole("button", { name: "En attente de paiement" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.queryByText("Pas encore de dossier actif")).toBeNull();
  });
});
