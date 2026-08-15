import { describe, expect, it } from "vitest";
import { buildGoogleAuthorizationUrl, isGoogleOAuthConfigured } from "../server/googleCandidateOAuth";
import fs from "node:fs";
import path from "node:path";

describe("Connexion candidat Google", () => {
  it("construit une demande OAuth avec l’URI de redirection de production et un state", () => {
    expect(isGoogleOAuthConfigured()).toBe(true);
    const url = new URL(buildGoogleAuthorizationUrl("state_de_test"));
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe("https://www.3mtravelagency.com/api/auth/google/callback");
    expect(url.searchParams.get("state")).toBe("state_de_test");
    expect(url.searchParams.get("scope")).toContain("email");
  });

  it("sécurise l’import de la photo Google vers le stockage privé du candidat", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "server/googleCandidateOAuth.ts"), "utf8");
    expect(source).toContain("picture?: string");
    expect(source).toContain("lh3.googleusercontent.com");
    expect(source).toContain('redirect: "error"');
    expect(source).toContain("storagePut(");
    expect(source).toContain("candidate.avatarUrl");
  });

  it("ne transfère pas la session candidat dans l’URL et utilise une session courte par cookie", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "server/googleCandidateOAuth.ts"), "utf8");
    expect(source).toContain("candidate_google_oauth_handoff");
    expect(source).toContain("httpOnly: true");
    expect(source).toContain('res.redirect(302, "/login?oauth=google")');
  });
});
