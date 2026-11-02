// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

// Les composants lisent les règles de l'administration : sans serveur, aucune règle (le formulaire reste celui du moteur).
vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { buildClientPlan, buildPlanActions, documentIsReceived, parseClientProjectDetails, resolveDynamicForm } from "../shared/dynamicForm";
import { containsForbiddenPromise } from "../shared/cvtheque";
import { ClientProgramPlan } from "@/components/ClientProgramPlan";
import { AdminDeclaredAnswersPanel } from "@/components/AdminDeclaredAnswersPanel";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

const trainingDetails = {
  programId: "etudes-professionnelle", domainId: "sante", trainingKind: "apprentissage", trainingTarget: "Soins infirmiers", trainingContract: "aucune",
  trainingFunding: "remuneree", healthTrainingTrack: "soins_infirmiers", healthSchoolStatus: "terminee", lang_de: "a1_a2",
};

afterEach(() => cleanup());

describe("parcours du candidat — prochaines actions selon les réponses", () => {
  it("transforme les situations « à faire » en étapes de préparation concrètes", () => {
    const form = resolveDynamicForm({ country: "Allemagne", projectType: "etudes", programId: "etudes-professionnelle", domainId: "sante" });
    const ids = buildPlanActions(form, trainingDetails).map((action) => action.id);
    expect(ids).toEqual(expect.arrayContaining(["training_contract", "lang_de"]));
    const text = buildPlanActions(form, trainingDetails).map((action) => action.text).join(" ");
    expect(text).toMatch(/contrat ou une promesse de formation/);
    expect(text).toMatch(/langue du pays/);
    expect(containsForbiddenPromise(text)).toBe(false);
  });

  it("propose une étape de reconnaissance du diplôme de santé tant qu'elle n'est pas engagée", () => {
    const form = resolveDynamicForm({ country: "Allemagne", projectType: "travail", programId: "travail-employeur", domainId: "sante" });
    const actions = buildPlanActions(form, { offerStatus: "en_discussion", healthRecognitionStatus: "non_commencee" });
    expect(actions.map((action) => action.id)).toEqual(expect.arrayContaining(["offer", "recognition"]));
    expect(buildPlanActions(form, { offerStatus: "signee", healthRecognitionStatus: "obtenue" }).map((action) => action.id)).toEqual(["review"]);
  });

  it("une visite familiale demande l'invitation, un transit le billet de suite", () => {
    const family = resolveDynamicForm({ country: "France", projectType: "tourisme", programId: "tourisme-famille" });
    expect(buildPlanActions(family, { hostInvitation: "non" }).map((action) => action.id)).toContain("invitation");
    const transit = resolveDynamicForm({ country: "Turquie", projectType: "tourisme", programId: "tourisme-transit" });
    expect(buildPlanActions(transit, { onwardTicket: "non" }).map((action) => action.id)).toContain("onward_ticket");
  });
});

describe("parcours du candidat — pièces reçues", () => {
  it("reconnaît une pièce déposée par son type ou son nom", () => {
    expect(documentIsReceived("Passeport valide pour toute la durée prévue du séjour", [{ documentType: "passport", documentName: "mon-passeport.pdf" }])).toBe(true);
    expect(documentIsReceived("Diplômes et relevés de notes", [{ documentType: "diplome", documentName: "licence.pdf" }])).toBe(true);
    expect(documentIsReceived("Contrat ou promesse de formation", [{ documentType: "cv", documentName: "cv.pdf" }])).toBe(false);
    expect(documentIsReceived("Photos d’identité récentes", [])).toBe(false);
  });
});

describe("parcours du candidat — lecture des réponses enregistrées", () => {
  it("ne remonte que les champs du formulaire (jamais les accords, liens ni dossiers de candidature)", () => {
    const json = JSON.stringify({ ...trainingDetails, preparatoryAnalysisConsent: true, preparatoryAnalysisConsentRecordedAt: "2026-10-20", cvLink: "https://exemple.org/cv", applicationPack: { motivationLetter: "secret" }, cle_inventee: "x" });
    const details = parseClientProjectDetails(json, "Allemagne", "etudes");
    expect(details).toMatchObject({ programId: "etudes-professionnelle", domainId: "sante", trainingKind: "apprentissage", healthTrainingTrack: "soins_infirmiers" });
    expect(JSON.stringify(details)).not.toMatch(/preparatory|cvLink|applicationPack|secret|cle_inventee/);
  });

  it("ne produit rien pour une ancienne évaluation sans programme", () => {
    expect(parseClientProjectDetails(JSON.stringify({ targetJob: "soudeur" }), "Canada", "travail")).toBeNull();
    expect(parseClientProjectDetails("{pas json", "Canada", "travail")).toBeNull();
    expect(parseClientProjectDetails(null, "Canada", "travail")).toBeNull();
    expect(buildClientPlan({ projectType: "travail", country: "Canada", details: { targetJob: "soudeur" } })).toBeNull();
  });
});

describe("espace client — « Votre parcours »", () => {
  const props = { projectType: "etudes", country: "Allemagne", projectDetails: trainingDetails, columns: { frenchLevel: "b1" } };

  it("affiche le pays, le visa, le domaine, les actions, les pièces propres au parcours et les réponses", () => {
    render(<ClientProgramPlan {...props} uploadedDocuments={[{ documentType: "passport", documentName: "passeport.pdf" }]} />);
    const card = screen.getByTestId("client-program-plan");
    expect(card.textContent).toMatch(/Allemagne/);
    expect(card.textContent).toMatch(/Formation professionnelle ou apprentissage/);
    expect(card.textContent).toMatch(/Santé et soins/);
    expect(within(screen.getByTestId("client-plan-actions")).getAllByRole("listitem").length).toBeGreaterThan(1);
    const documents = screen.getByTestId("client-plan-documents").textContent ?? "";
    expect(documents).toMatch(/Contrat ou promesse de formation/);
    expect(documents).toMatch(/Diplôme de santé/);
    expect(card.textContent).toMatch(/1\/\d+ reçues/);
    expect(screen.getByTestId("client-plan-answers").textContent).toMatch(/Soins infirmiers/);
  });

  it("rappelle que ce sont des repères de préparation, sans promesse", () => {
    render(<ClientProgramPlan {...props} />);
    const text = screen.getByTestId("client-program-plan").textContent ?? "";
    expect(text).toMatch(/Repères de préparation/);
    expect(text).toMatch(/rien ici ne garantit un visa/);
    expect(containsForbiddenPromise(text.replace(/rien ici ne garantit un visa ni une décision/, ""))).toBe(false);
  });

  it("n'affiche rien pour une évaluation sans parcours dynamique", () => {
    const { container } = render(<ClientProgramPlan projectType="travail" country="Canada" projectDetails={{ targetJob: "soudeur" }} />);
    expect(container.innerHTML).toBe("");
  });

  it("le bouton de modification ouvre l'évaluation", () => {
    const calls: string[] = [];
    render(<ClientProgramPlan {...props} onEditEvaluation={() => calls.push("edit")} />);
    screen.getByRole("button", { name: "Modifier mon évaluation" }).click();
    expect(calls).toEqual(["edit"]);
  });
});

describe("back-office — lecture conseiller", () => {
  it("affiche la complétude, les points à clarifier et les réponses avec leurs libellés", () => {
    render(<AdminDeclaredAnswersPanel projectType="etudes" country="Allemagne" details={trainingDetails} />);
    const panel = screen.getByTestId("admin-declared-answers");
    expect(panel.textContent).toMatch(/Formation professionnelle ou apprentissage/);
    expect(screen.getByTestId("admin-declared-completeness").textContent).toMatch(/\d+\/\d+ réponses/);
    const flags = screen.getByTestId("admin-declared-flags").textContent ?? "";
    expect(flags).toMatch(/rémunérée par l’employeur, mais sans contrat/);
    expect(flags).toMatch(/reconnaissance du diplôme n’est pas renseigné/);
    expect(panel.textContent).toMatch(/Apprentissage \/ alternance en entreprise/);
    expect(panel.textContent).not.toMatch(/soins_infirmiers|apprentissage\b(?! \/)/);
  });

  it("ne s'affiche pas pour une ancienne évaluation", () => {
    const { container } = render(<AdminDeclaredAnswersPanel projectType="travail" country="Canada" details={{ targetJob: "soudeur" }} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("branchements", () => {
  it("l'espace client monte le parcours dans la vue d'ensemble et dans le dossier, et reçoit les réponses du serveur", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect((space.match(/<ClientProgramPlan /g) ?? []).length).toBe(2);
    expect(space).toContain("latestEvaluation?.projectDetails?.selectedProcedure");
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("projectDetails: parseClientProjectDetails(evaluation.projectDetailsJson, evaluation.destinationCountry, evaluation.projectType, formOverrides)");
    expect(read("client/src/components/Candidate360Workspace.tsx")).toContain("<AdminDeclaredAnswersPanel");
  });
});
