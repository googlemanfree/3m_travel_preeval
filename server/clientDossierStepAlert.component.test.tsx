// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));

import ClientDossierStepAlert from "@/components/ClientDossierStepAlert";

const change = { id: "case-42", tone: "info" as const, title: "Votre dossier N° 3M-42 a évolué", description: "Nouvel état : Documents requis." };

afterEach(cleanup);

describe("alerte de progression espace client", () => {
  it("affiche l’évolution sans déclencher d’action métier", () => {
    const onDismiss = vi.fn();
    render(<ClientDossierStepAlert change={change} onDismiss={onDismiss} />);
    expect(screen.getByTestId("client-dossier-step-alert").textContent).toContain("Votre dossier vient d’avancer");
    expect(screen.getByTestId("client-dossier-step-alert").textContent).toContain("Documents requis");
    expect(screen.getByText(/Aucune action n’est enregistrée/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fermer l’alerte de progression" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("dépôt client", () => {
  it("monte le centre documentaire sécurisé et conserve l’envoi candidat existant", async () => {
    const page = await import("node:fs/promises").then((fs) => fs.readFile("client/src/pages/EvaluationSpace.tsx", "utf8"));
    expect(page).toContain('data-testid="client-document-dropzone"');
    expect(page).toContain("Transmission chiffrée, accès limité à votre compte et à l’équipe 3M");
    expect(page).toContain("<DocumentUploader");
    expect(page).toContain("getMyAgencyDocuments.invalidate");
  });
});
