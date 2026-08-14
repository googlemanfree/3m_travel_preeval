import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("Espace client unifié", () => {
  it("redirige les anciennes entrées clientes vers la route canonique", () => {
    const app = readProjectFile("client/src/App.tsx");
    expect(app).toContain('<Route path={"/dashboard"}>{() => <Redirect to="/mon-espace" />}</Route>');
    expect(app).toContain('<Route path={"/mon-espace-candidat"}>{() => <Redirect to="/mon-espace" />}</Route>');
    expect(app).toContain('<Route path={"/my-space"}>{() => <Redirect to="/mon-espace" />}</Route>');
    expect(app).toContain('<Route path="/client-dashboard">{() => <Redirect to="/mon-espace" />}</Route>');
  });

  it("expose les sections messagerie et profil dans la navigation canonique", () => {
    const navigation = readProjectFile("client/src/components/ClientSpaceNavigation.tsx");
    expect(navigation).toContain("/mon-espace?section=messages");
    expect(navigation).toContain("/mon-espace?section=profile");
  });

  it("protège la consultation historique par le candidat connecté", () => {
    const candidateRouter = readProjectFile("server/routers/candidate.ts");
    expect(candidateRouter).toContain("getDossierByNumber: candidateProcedure");
    expect(candidateRouter).toContain("application.candidateId === ctx.candidate.id");
    expect(candidateRouter).toContain("agencyDossier.email.toLowerCase() === ctx.candidate.email.toLowerCase()");
  });

  it("relie le back-office à la même table de messages que l’espace client", () => {
    const adminRouter = readProjectFile("server/routers/adminCandidateManagement.ts");
    expect(adminRouter).toContain("getMessages: publicProcedure");
    expect(adminRouter).toContain("replyToCandidate: publicProcedure");
    expect(adminRouter).toContain('senderRole: "advisor"');
    expect(adminRouter).toContain("notifiedCandidate");
    expect(adminRouter).toContain("fullName: z.string().trim().min(2).max(160).optional()");
    expect(adminRouter).toContain("L’équipe a également actualisé certaines informations de votre profil.");
  });
});
