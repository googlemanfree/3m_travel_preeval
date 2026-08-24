import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("retour OAuth et session administrateur", () => {
  it("préserve une route interne sûre après le choix du compte OAuth", () => {
    const clientAuth = read("client/src/const.ts");
    const callback = read("server/_core/oauth.ts");

    expect(clientAuth).toContain("returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`");
    expect(clientAuth).toContain("encodeOAuthState({ redirectUri, returnTo, nonce })");
    expect(callback).toContain("function getSafeReturnPath(returnTo: string | undefined)");
    expect(callback).toContain("returnTo.startsWith(\"//\")");
    expect(callback).toContain("res.redirect(302, getSafeReturnPath(returnTo))");
  });

  it("restaure une session de 24 h uniquement pour un compte OAuth administrateur actif", () => {
    const router = read("server/routers/adminAuth.ts");
    const guard = read("client/src/components/AdminGuard.tsx");

    expect(router).toContain("bootstrapPlatformSession: publicProcedure");
    expect(router).toContain("const platformEmail = ctx.user?.email?.trim().toLowerCase()");
    expect(router).toContain('if (!admin || admin.status !== "active") return { authenticated: false } as const');
    expect(router).toContain("sessionExpiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_MS)");
    expect(guard).toContain("trpc.adminAuth.bootstrapPlatformSession.useQuery");
    expect(guard).toContain('localStorage.setItem("adminSessionToken", restoredToken)');
  });
});
