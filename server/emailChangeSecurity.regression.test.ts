import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("changement d’adresse e-mail candidat", () => {
  it("exige une session candidat, deux jetons distincts et une origine de confiance", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("requestEmailChange: candidateProcedure");
    expect(router).toContain("currentEmailTokenHash");
    expect(router).toContain("newEmailTokenHash");
    expect(router).toContain("resolveTrustedClientOrigin(input.origin)");
    expect(router).toContain("EMAIL_CHANGE_TTL_MS");
  });

  it("ne modifie l’identité et les dossiers liés qu’après les deux confirmations", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("if (!updatedRequest?.currentEmailConfirmedAt || !updatedRequest.newEmailConfirmedAt)");
    expect(router).toContain("db.update(candidates).set({ email: updatedRequest.newEmail, emailVerified: true })");
    expect(router).toContain("db.update(applications).set({ email: updatedRequest.newEmail })");
    expect(router).toContain("db.update(evaluations).set({ email: updatedRequest.newEmail })");
    expect(router).toContain("status: \"confirmed\"");
  });

  it("réserve le parcours au profil et protège la page de confirmation contre l’indexation", () => {
    const profile = read("client/src/components/ClientProfilePanel.tsx");
    const route = read("client/src/App.tsx");
    const prerender = read("server/publicPrerender.ts");
    expect(profile).toContain("Envoyer les confirmations");
    expect(profile).toContain("Double confirmation");
    expect(route).toContain('path={"/confirm-email-change"}');
    expect(prerender).toContain('"/confirm-email-change"');
    expect(prerender).toContain("noindex: true");
  });
});
