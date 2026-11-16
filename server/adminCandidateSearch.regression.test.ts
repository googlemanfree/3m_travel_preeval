import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const routerSource = readFileSync(resolve(projectRoot, "server/routers/admin.ts"), "utf8");
const dashboardSource = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("Recherche Dossiers admin", () => {
  it("lit tous les dossiers (jusqu'à 5 000 par source), avec ou sans recherche, avant de les découper en pages", () => {
    expect(routerSource).toContain("const sourceLimit = 5000;");
    expect(routerSource).toContain(".limit(sourceLimit)");
    expect(routerSource).not.toContain("input.search?.trim() ? 5000 : input.limit");
  });

  it("cherche dans la référence, l’identité, le contact, la destination et la procédure", () => {
    expect(routerSource).toContain("c.folderCode?.toLowerCase().includes(query)");
    expect(routerSource).toContain("c.email?.toLowerCase().includes(query)");
    expect(routerSource).toContain("c.destinationCountry?.toLowerCase().includes(query)");
    expect(routerSource).toContain("c.projectType?.toLowerCase().includes(query)");
  });

  it("relie bien le champ visible au state de recherche transmis à la requête", () => {
    expect(dashboardSource).toContain("value={search}");
    expect(dashboardSource).toContain("onChange={(e) => setSearch(e.target.value)}");
    expect(dashboardSource).toContain("search: debouncedSearch || undefined");
    expect(dashboardSource).toContain("setDebouncedSearch(search)");
  });
});
