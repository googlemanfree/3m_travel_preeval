import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("handoff Google candidat", () => {
  it("autorise la récupération du cookie après une redirection Google en production", () => {
    const oauth = read("server/googleCandidateOAuth.ts");
    expect(oauth).toContain('sameSite: secure ? ("none" as const) : ("lax" as const)');
    expect(oauth).toContain('res.cookie(GOOGLE_HANDOFF_COOKIE, handoff');
    expect(oauth).toContain('res.redirect(302, "/login?oauth=google")');
  });

  it("lit et supprime le même cookie avec les mêmes attributs côté procédure tRPC", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("GOOGLE_HANDOFF_COOKIE");
    expect(candidate).toContain("parseCookieHeader(ctx.req.headers.cookie || \"\")[GOOGLE_HANDOFF_COOKIE]");
    expect(candidate).toContain('sameSite: secure ? "none" : "lax"');
    expect(candidate).toContain("ctx.res.clearCookie(GOOGLE_HANDOFF_COOKIE");
  });
});

