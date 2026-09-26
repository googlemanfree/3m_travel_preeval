// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";

(globalThis as any).React = React;

import { computeNextStep, type NextStepInput } from "@/lib/nextStep";
import { buildRequirementOptions, summarizeChecklist } from "@/components/DossierDocumentChecklist";
import { buildStoredDocumentName } from "./routers/candidateUpload";

const base: NextStepInput = { evaluationRequired: false, agreementSignatureRequired: false };
const req = (id: number, status: string) => ({ id, status, isRequired: true });

describe("prochaine étape : la checklist du pays et du visa est prise en compte", () => {
  it("sans demande individuelle du conseiller, des pièces manquantes ne donnent plus « aucune action attendue »", () => {
    const step = computeNextStep({ ...base, checklist: { total: 8, missing: 5, replace: 0, firstMissingLabel: "Passeport valide" } });
    expect(step.id).toBe("checklist-missing");
    expect(step.tone).toBe("action");
    expect(step.title).toContain("Envoyez 5 pièces");
    expect(step.description).toContain("3 sur 8 déjà reçues");
    expect(step.description).toContain("Prochaine pièce : Passeport valide");
    expect(step.action).toEqual({ kind: "section", section: "documents" });
  });

  it("une seule pièce : singulier", () => {
    expect(computeNextStep({ ...base, checklist: { total: 4, missing: 1, replace: 0 } }).title).toBe("Envoyez 1 pièce de votre checklist");
  });

  it("une pièce refusée de la checklist passe avant les pièces manquantes ; le refus d'une demande du conseiller passe avant", () => {
    const replace = computeNextStep({ ...base, checklist: { total: 8, missing: 3, replace: 2, firstReplaceLabel: "Acte de naissance" } });
    expect(replace.id).toBe("checklist-replace");
    expect(replace.title).toContain("Corrigez 2 pièces refusées");
    expect(replace.description).toContain("Commencez par : Acte de naissance");
    expect(computeNextStep({ ...base, requirements: [req(1, "rejected")], checklist: { total: 8, missing: 3, replace: 2 } }).id).toBe("documents-rejected");
  });

  it("une demande précise du conseiller (en attente) reste prioritaire sur la liste générale", () => {
    expect(computeNextStep({ ...base, requirements: [req(1, "pending")], checklist: { total: 8, missing: 3, replace: 0 } }).id).toBe("documents-pending");
  });

  it("l'évaluation et le protocole à signer passent toujours avant les pièces", () => {
    expect(computeNextStep({ ...base, evaluationRequired: true, checklist: { total: 8, missing: 8, replace: 0 } }).id).toBe("evaluation-required");
    expect(computeNextStep({ ...base, agreementSignatureRequired: true, checklist: { total: 8, missing: 8, replace: 0 } }).id).toBe("agreement");
  });

  it("checklist complète : tout est à jour ; sans checklist fournie, comportement inchangé", () => {
    expect(computeNextStep({ ...base, checklist: { total: 8, missing: 0, replace: 0 } }).id).toBe("all-clear");
    expect(computeNextStep(base).id).toBe("all-clear");
  });
});

describe("résumé de la checklist réelle (pays × visa)", () => {
  it("un dossier vide : toutes les pièces manquent, la première est nommée", () => {
    const summary = summarizeChecklist("Canada", "etudes", []);
    expect(summary.total).toBeGreaterThan(2);
    expect(summary.missing).toBe(summary.total);
    expect(summary.replace).toBe(0);
    expect(summary.firstMissingLabel).toBe(buildRequirementOptions("Canada", "etudes")[0].label);
  });

  it("chaque pièce envoyée (nom enregistré avec l'intitulé) fait baisser le nombre de pièces manquantes", () => {
    const options = buildRequirementOptions("Canada", "etudes");
    const documents = options.slice(0, 2).map((option) => ({ documentType: "autre", documentName: buildStoredDocumentName(option.label, "scan.pdf"), verificationStatus: "pending" }));
    const summary = summarizeChecklist("Canada", "etudes", documents);
    expect(summary.missing).toBe(summary.total - 2);
    expect(summary.firstMissingLabel).toBe(options[2].label);
  });

  it("une pièce rejetée compte comme « à remplacer », les demandes du conseiller sont comptées, les pièces dispensées non", () => {
    const options = buildRequirementOptions("Canada", "etudes");
    const rejected = [{ documentType: "autre", documentName: buildStoredDocumentName(options[0].label, "scan.pdf"), verificationStatus: "rejected" }];
    const summary = summarizeChecklist("Canada", "etudes", rejected, [
      { id: 1, documentType: "Lettre de parrainage", status: "pending" },
      { id: 2, documentType: "Pièce dispensée", status: "waived" },
    ]);
    expect(summary.replace).toBe(1);
    const base = summarizeChecklist("Canada", "etudes", []);
    expect(summary.total).toBe(base.total + 1);
  });
});

describe("branchement dans l'espace client", () => {
  it("la carte « Votre prochaine étape » reçoit le résumé de la checklist du pays et du visa", () => {
    const space = require("node:fs").readFileSync(require("node:path").resolve(import.meta.dirname, "../client/src/pages/EvaluationSpace.tsx"), "utf8") as string;
    expect(space).toContain("checklist: summarizeChecklist(primaryDestination, latestEvaluation?.projectType, checklistDocuments, customRequirements)");
  });
});
