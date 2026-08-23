// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DossierProgressTimeline from "@/components/DossierProgressTimeline";
import { EvaluationDeclarationBadge } from "@/components/EvaluationDeclarationBadge";
import { AdminPreDossierEvaluationPanel } from "@/components/AdminPreDossierEvaluationPanel";

describe("rendu client et administratif de l’évaluation préalable", () => {
  it("maintient la timeline en attente tant que la déclaration n’est pas validée", () => {
    render(<DossierProgressTimeline dossierStatus="nouveau" evaluationDeclarationStatus="pending_validation" />);
    expect(screen.getByText("Votre évaluation déclarée est en cours de vérification par notre équipe avant la suite du dossier.")).toBeTruthy();
    render(<EvaluationDeclarationBadge status="pending_validation" />);
    expect(screen.getByLabelText("Évaluation déclarée en attente de vérification")).toBeTruthy();
  });

  it("marque l’étape reçue uniquement après validation administrative", () => {
    render(<DossierProgressTimeline dossierStatus="nouveau" evaluationDeclarationStatus="validated" />);
    expect(screen.getByText("Votre évaluation a été vérifiée par notre équipe. Votre dossier peut poursuivre son traitement selon les étapes confirmées.")).toBeTruthy();
    expect(screen.getByLabelText("Évaluation validée par l’équipe")).toBeTruthy();
  });

  it("conserve une évaluation en cours lorsqu’elle n’est pas déclarée", () => {
    render(<DossierProgressTimeline dossierStatus="nouveau" evaluationDeclarationStatus="not_declared" />);
    expect(screen.getByText("Votre dossier vient d'être créé. Notre équipe va bientôt l'examiner.")).toBeTruthy();
    render(<EvaluationDeclarationBadge status="not_declared" />);
    expect(screen.getByLabelText("Évaluation en cours")).toBeTruthy();
  });

  it("présente au back-office des décisions explicites avant l’ouverture du dossier", () => {
    const onReview = vi.fn();
    render(<AdminPreDossierEvaluationPanel status="pending_validation" declaredAt="2026-08-22T10:00:00.000Z" onReview={onReview} />);
    expect(screen.getByText("Compte avant ouverture de dossier")).toBeTruthy();
    expect(screen.getByText("Évaluation à vérifier")).toBeTruthy();
    expect(screen.getByText(/Vérifiez l’e-mail ou le bilan avant toute ouverture de dossier/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Valider l’évaluation" }));
    expect(onReview).toHaveBeenCalledWith("validate", "");
  });
});
