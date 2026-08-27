import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("activation et suivi candidat", () => {
  it.each(["/confirm-email", "/verify-email-link", "/verify-email", "/verify-email-sent", "/verify-application-email"])("pré-rend %s avec un statut 200 non indexable", (path) => {
    const result = composePublicPrerender(shell, path);
    expect(result.status).toBe(200);
    expect(result.noindex).toBe(true);
    expect(result.html).toContain('content="noindex,follow"');
  });

  it("charge les pages d’activation critiques sans module différé", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('import VerifyEmailLink from "./pages/VerifyEmailLink";');
    expect(app).toContain('import ConfirmEmail from "./pages/ConfirmEmail";');
    expect(app).toContain('import VerifyApplicationEmail from "./pages/VerifyApplicationEmail";');
    expect(app).not.toContain('const VerifyEmailLink = lazyWithTimeout');
  });

  it("reconnaît une référence d’évaluation uniquement après concordance de l’e-mail", () => {
    const router = read("server/routers/application.ts");
    expect(router).toContain("from(evaluations).where(inArray(evaluations.referenceCode, dossierReferenceCandidates(input.dossierNumber)))");
    expect(router).toContain("const matchedEmail = (app ?? agencyDossier ?? evaluation)!.email.trim().toLowerCase() === input.email.trim().toLowerCase()");
    expect(router).toContain('trackingKind: "evaluation" as const');
    expect(router).not.toMatch(/evaluation\.aiReportContent/);
    expect(router).not.toMatch(/evaluation\.reviewDraft/);
  });

  it("affiche uniquement un état de revue minimal pour une référence d’évaluation", () => {
    const page = read("client/src/pages/MonDossier.tsx");
    expect(page).toContain('dossier.trackingKind === "evaluation"');
    expect(page).toContain("Les documents, notes internes et brouillons ne sont jamais affichés ici.");
  });
});
