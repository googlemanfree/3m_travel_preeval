import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(process.cwd());
const applicationRouterSource = readFileSync(join(projectRoot, "server/routers/application.ts"), "utf8");
const adminRouterSource = readFileSync(join(projectRoot, "server/routers/adminCandidateManagement.ts"), "utf8");
const candidatePageSource = readFileSync(join(projectRoot, "client/src/pages/MonDossier.tsx"), "utf8");

describe("suivi Procédures client-administration", () => {
  it("construit un suivi procédural après vérification du numéro de dossier et de l’e-mail", () => {
    const endpointStart = applicationRouterSource.indexOf("getDossierStatus: publicProcedure");
    const endpointEnd = applicationRouterSource.indexOf("sendCandidateMessage: publicProcedure");
    const endpoint = applicationRouterSource.slice(endpointStart, endpointEnd);

    expect(endpoint).toContain("app.email.toLowerCase() !== input.email.toLowerCase()");
    expect(endpoint).toContain("documentRequirements");
    expect(endpoint).toContain("procedureTracking");
    expect(endpoint).toContain("nextAction");
    expect(endpoint).not.toContain("adminComment:");
  });

  it("journalise chaque changement de statut administratif dans le dossier 360°", () => {
    expect(adminRouterSource).toContain("requireAdminSessionFromCookie");
    expect(adminRouterSource).toContain("caseStatusHistory");
    expect(adminRouterSource).toContain("caseActivityLogs");
    expect(adminRouterSource).toContain("procedure_status_synchronized");
    expect(adminRouterSource).toContain("caseId: synchronizedCaseId");
  });

  it("affiche au candidat une prochaine action et des pièces sans note interne", () => {
    expect(candidatePageSource).toContain("Suivi de votre procédure");
    expect(candidatePageSource).toContain("dossier.procedureTracking.nextAction");
    expect(candidatePageSource).toContain("Les pièces et étapes sont confirmées par votre conseiller");
    expect(candidatePageSource).not.toContain("adminComment");
  });
});
