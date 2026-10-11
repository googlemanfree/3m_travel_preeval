import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("photo profil admin — aperçu, téléchargement, demande passeport", () => {
  it("expose l’aperçu, le téléchargement et la demande photo type passeport dans la fiche admin", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="candidate-portrait-preview-trigger"');
    expect(dashboard).toContain('data-testid="candidate-portrait-download"');
    expect(dashboard).toContain('data-testid="candidate-portrait-request-passport"');
    expect(dashboard).toContain("Demander photo passeport");
    expect(dashboard).toContain('decision: "request_passport"');
  });

  it("envoie la demande par e-mail et dans l’espace client", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("request_passport");
    expect(router).toContain("passport_photo_request");
    expect(router).toContain("PASSPORT_PHOTO_REQUEST_TITLE");
    expect(router).toContain("espaces employeur et agences de placement");
    expect(router).toContain("account_");
  });

  it("exige le CV à l’inscription pour le visa travail", () => {
    const register = read("client/src/pages/Register.tsx");
    const candidateRouter = read("server/routers/candidate.ts");
    expect(register).toContain("CV_REQUIRED_AT_REGISTRATION");
    expect(register).toContain('data-testid="registration-cv-required"');
    expect(candidateRouter).toContain("CV_REQUIRED_AT_REGISTRATION");
    expect(candidateRouter).toContain('fileType: "cv"');
  });
});
