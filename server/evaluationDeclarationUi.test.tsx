// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DossierProgressTimeline from "@/components/DossierProgressTimeline";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import { AdminPreDossierEvaluationPanel } from "@/components/AdminPreDossierEvaluationPanel";

describe("rendu client et administratif de l’évaluation préalable", () => {
  it("affiche une étape reçue dans la timeline lorsqu’elle est déclarée", () => {
    render(<DossierProgressTimeline dossierStatus="nouveau" evaluationDeclarationStatus="declared_complete" />);
    expect(screen.getByText("Votre évaluation a été indiquée comme reçue. Notre équipe l’associera à votre dossier pour la suite.")).toBeTruthy();
    expect(screen.getByLabelText("Évaluation déclarée comme reçue")).toBeTruthy();
  });

  it("conserve une évaluation en cours lorsqu’elle n’est pas déclarée", () => {
    render(<DossierProgressTimeline dossierStatus="nouveau" evaluationDeclarationStatus="not_declared" />);
    expect(screen.getByText("Votre dossier vient d'être créé. Notre équipe va bientôt l'examiner.")).toBeTruthy();
    render(<EvaluationDeclarationBadge status="not_declared" />);
    expect(screen.getByLabelText("Évaluation en cours")).toBeTruthy();
  });

  it("présente au back-office le compte pré-dossier et sa déclaration sans valider le bilan", () => {
    render(<AdminPreDossierEvaluationPanel status="declared_complete" declaredAt="2026-08-22T10:00:00.000Z" />);
    expect(screen.getByText("Compte avant ouverture de dossier")).toBeTruthy();
    expect(screen.getByText("Évaluation déclarée comme reçue")).toBeTruthy();
    expect(screen.getByText(/Vérifiez l’e-mail ou le bilan avant de rattacher le compte à un dossier actif/)).toBeTruthy();
  });
});
