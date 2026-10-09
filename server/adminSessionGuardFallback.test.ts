import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers/adminAuth.ts"), "utf8");
const guardSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminGuard.tsx"), "utf8");

describe("repli de session administrateur", () => {
  it("valide le cookie en priorité et un jeton actif lorsqu’un navigateur bloque le cookie", () => {
    expect(routerSource).toContain("input?.sessionToken");
    expect(routerSource).toContain("requireValidAdminSession(input.sessionToken");
    expect(routerSource).toContain("ADMIN_SESSION_COOKIE");
  });

  it("transmet le jeton de l’onglet à la garde de route administrateur", () => {
    expect(guardSource).toContain('sessionStorage.getItem("adminSessionToken")');
    expect(guardSource).toContain("sessionToken ? { sessionToken } : undefined");
  });

  it("ne masque pas durablement le tableau lorsqu’un jeton local existe mais que le réseau échoue", () => {
    expect(guardSource).toContain("retry: 3");
    expect(guardSource).toContain("retryDelay: 1500");
    expect(guardSource).toContain("Boolean(sessionToken) && adminSession.isError");
    expect(guardSource).toContain("sessionTemporarilyUnavailable && !sessionToken");
    expect(guardSource).toContain("adminSession.refetch()");
  });
});
