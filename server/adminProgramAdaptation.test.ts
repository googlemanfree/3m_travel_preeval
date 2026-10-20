import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCountryProcedureDocumentChecklist, summarizeCountryProcedureChecklist } from "../shared/countryProcedureChecklist";
import { buildClientPlan, programChecklistLines } from "../shared/dynamicForm";
import { programContextFromDetails } from "./services/evaluationProgramContext";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").split("\r\n").join("\n");
const labels = (checklist: ReturnType<typeof buildCountryProcedureDocumentChecklist>) => checklist.documents.map((line) => line.documentType);

describe("checklist administrateur — adaptée au visa et au domaine choisis", () => {
  it("sans parcours choisi, la checklist reste celle du pays et de la procédure", () => {
    const before = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "study_permit" });
    const same = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "study_permit", programId: null, domainId: null });
    const orientation = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "study_permit", programId: "etudes-orientation" });
    expect(labels(same)).toEqual(labels(before));
    expect(labels(orientation)).toEqual(labels(before));
  });

  it("Allemagne + formation professionnelle + santé ajoute les pièces du parcours sans doublonner les pièces communes", () => {
    const base = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "study_permit" });
    const adapted = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "study_permit", programId: "etudes-professionnelle", domainId: "sante" });
    const text = labels(adapted).join(" | ");
    expect(text).toMatch(/Contrat ou promesse de formation/);
    expect(adapted.documents.some((line) => line.source === "program")).toBe(true);
    // le passeport et la photo restent demandés une seule fois
    expect(labels(adapted).filter((label) => /passeport/i.test(label))).toHaveLength(1);
    expect(labels(adapted).filter((label) => /photo/i.test(label))).toHaveLength(1);
    expect(adapted.documents.length).toBeLessThanOrEqual(16);
    expect(adapted.documents.length).toBeGreaterThan(base.documents.length - 1);
    expect(labels(adapted)).not.toEqual(labels(base));
  });

  it("les demandes de l'administration restent prioritaires sur les pièces du parcours", () => {
    const adapted = buildCountryProcedureDocumentChecklist({ destination: "Allemagne", procedureType: "work_permit", customDocuments: ["Lettre de recommandation de la clinique"], programId: "travail-employeur", domainId: "sante" });
    expect(adapted.documents[0].documentType).toBe("Lettre de recommandation de la clinique");
    expect(adapted.documents[0].source).toBe("custom");
  });

  it("deux domaines donnent deux checklists différentes pour le même visa", () => {
    const health = labels(buildCountryProcedureDocumentChecklist({ destination: "Canada", procedureType: "work_permit", programId: "travail-employeur", domainId: "sante" })).join("|");
    const trades = labels(buildCountryProcedureDocumentChecklist({ destination: "Canada", procedureType: "work_permit", programId: "travail-employeur", domainId: "btp" })).join("|");
    expect(health).not.toBe(trades);
  });

  it("l'avancement de la checklist compte les pièces du parcours", () => {
    const summary = summarizeCountryProcedureChecklist({ destination: "Allemagne", procedureType: "study_permit", programId: "etudes-professionnelle", documents: [{ documentType: "Contrat de formation", documentName: "contrat.pdf", verificationStatus: "verified" }] });
    expect(summary.lines.some((line) => line.documentType.includes("Contrat ou promesse de formation"))).toBe(true);
    expect(summary.total).toBeGreaterThan(0);
  });

  it("ne produit rien pour un programme inconnu ou l'orientation générale", () => {
    expect(programChecklistLines("inconnu", null)).toEqual([]);
    expect(programChecklistLines("travail-orientation", "sante")).toEqual([]);
    expect(programChecklistLines("etudes-professionnelle", "sante").every((line) => line.source === "program")).toBe(true);
  });
});

describe("administration — suivi propre au parcours", () => {
  it("formule les actions pour le conseiller", () => {
    const plan = buildClientPlan({ projectType: "etudes", country: "Allemagne", details: { programId: "etudes-professionnelle", domainId: "sante", trainingContract: "aucune", healthSchoolStatus: "terminee", healthRecognitionStatus: "non_commencee" } })!;
    const staff = plan.staffActions.map((action) => action.text).join(" ");
    expect(staff).toMatch(/Identifier avec le candidat un employeur/);
    expect(staff).toMatch(/Ouvrir le dossier de reconnaissance/);
    expect(plan.staffActions.map((action) => action.id)).toEqual(plan.actions.map((action) => action.id));
  });

  it("relit le visa et le domaine de la dernière évaluation sans jamais lever", () => {
    expect(programContextFromDetails(JSON.stringify({ programId: "etudes-professionnelle", domainId: "sante" }))).toEqual({ programId: "etudes-professionnelle", domainId: "sante" });
    expect(programContextFromDetails(JSON.stringify({ targetJob: "soudeur" }))).toEqual({ programId: null, domainId: null });
    expect(programContextFromDetails("{pas json")).toEqual({ programId: null, domainId: null });
    expect(programContextFromDetails(null)).toEqual({ programId: null, domainId: null });
  });

  it("branche le parcours sur la création manuelle, le suivi 360 et l'activation automatique", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("procedureChecklistFor(input.procedureType, input.destination, { programId: input.programId, domainId: input.domainId })");
    expect(admin).toContain("programId: typeof projectDetails.programId === \"string\" ? projectDetails.programId : null");
    expect(read("server/services/seedCountryProcedureCase.ts")).toContain("latestProgramContext(db, owner?.email)");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("<CountrySelect id=\"candidate360-checklist-country\"");
    expect(workspace).not.toContain('<SelectItem value="Autre destination">Autre destination</SelectItem>');
    expect(workspace).toContain("checklist-program-hint");
  });
});
