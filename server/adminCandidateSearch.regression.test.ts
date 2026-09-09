import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const routerSource = readFileSync(resolve(projectRoot, "server/routers/admin.ts"), "utf8");
const dashboardSource = readFileSync(resolve(projectRoot, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("Recherche Dossiers admin", () => {
  it("charge plus que la page courante lorsque la recherche est active", () => {
    expect(routerSource).toContain("const sourceLimit = input.search?.trim() ? 5000 : input.limit;");
    expect(routerSource).toContain(".limit(sourceLimit)");
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
    expect(dashboardSource).toContain("search: search || undefined");
  });
});
