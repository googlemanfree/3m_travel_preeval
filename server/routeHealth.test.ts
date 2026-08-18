import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { safeExternalUrl } from "./routers/routeHealthRouter";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("route health security and contracts", () => {
  it("accepts only public HTTPS links", () => {
    expect(safeExternalUrl("https://www.3mtravelagency.com/consular"))
      .toBe("https://www.3mtravelagency.com/consular");
    expect(() => safeExternalUrl("http://example.com"))
      .toThrow("Seules les URLs HTTPS publiques sont autorisées.");
    expect(() => safeExternalUrl("https://localhost/admin"))
      .toThrow("Seules les URLs HTTPS publiques sont autorisées.");
    expect(() => safeExternalUrl("https://192.168.1.20/private"))
      .toThrow("Seules les URLs HTTPS publiques sont autorisées.");
  });

  it("keeps the public 404 page connected to configuration and event logging", () => {
    const notFound = read("client/src/pages/NotFound.tsx");
    expect(notFound).toContain("routeHealth.getPublic404Config.useQuery");
    expect(notFound).toContain("routeHealth.record404.useMutation");
    expect(notFound).toContain("aria-label=\"Liens utiles\"");
  });

  it("exposes the three administrative health surfaces", () => {
    const manager = read("client/src/components/AdminRouteHealthManager.tsx");
    expect(manager).toContain("Page 404");
    expect(manager).toContain("Erreurs introuvables");
    expect(manager).toContain("Vérifier tous les liens");
    expect(manager).toContain("routeHealth.update404Config.useMutation");
  });

  it("mounts the recurring checker on the Heartbeat callback contract", () => {
    const job = read("server/scheduled/externalLinkCheckJob.ts");
    const server = read("server/_core/index.ts");
    expect(job).toContain("user.isCron");
    expect(job).toContain("user.taskUid");
    expect(server).toContain("/api/scheduled/external-link-check");
  });

  it("exposes broken link AI replacement suggestion and application procedures", () => {
    const routerCode = read("server/routers/routeHealthRouter.ts");
    const managerCode = read("client/src/components/AdminRouteHealthManager.tsx");
    expect(routerCode).toContain("suggestBrokenLinkReplacements");
    expect(routerCode).toContain("applyExternalLinkReplacement");
    expect(managerCode).toContain("Assistance IA");
    expect(managerCode).toContain("Appliquer");
  });
});
