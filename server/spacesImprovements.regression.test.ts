import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("améliorations par espace (2026-11-02)", () => {
  it("admin : « PROFIL ÉVALUÉ » en grand dans la fiche et dans la liste dès que l'évaluation est faite", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="profile-evaluated-banner"');
    expect(dashboard).toContain("bilanSent={isBilanSent(candidate, null)}");
    const badge = read("client/src/components/EvaluationDeclarationBadge.tsx");
    expect(badge).toContain("PROFIL ÉVALUÉ");
  });

  it("client : bouton de prise de rendez-vous visible dans l'espace", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain('data-testid="client-appointment-cta"');
    expect(space).toContain('href="/consultation"');
  });

  it("partenaire : contact de l'équipe 3M dans l'espace connecté", () => {
    const portal = read("client/src/pages/EmployerPortal.tsx");
    expect(portal).toContain('data-testid="partner-help-strip"');
  });

  it("visa visiteur : le client voit l'étape « conseiller + rendez-vous », l'admin voit la consigne de contact", () => {
    const client = read("client/src/components/ClientProgramPlan.tsx");
    expect(client).toContain('data-testid="client-visitor-next-step"');
    expect(client).toContain('href="/consultation"');
    const admin = read("client/src/components/AdminDeclaredAnswersPanel.tsx");
    expect(admin).toContain('data-testid="admin-visitor-contact"');
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain('templateForStage("appointment_followup"');
  });
});
