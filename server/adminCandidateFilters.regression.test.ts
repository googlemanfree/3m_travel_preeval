import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const dashboard = fs.readFileSync(path.join(root, "client/src/pages/AdminDashboard.tsx"), "utf8");
const adminRouter = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");

describe("filtres et tri du registre administrateur", () => {
  it("valide les critères côté serveur avant de retourner les dossiers", () => {
    expect(adminRouter).toContain('source: z.enum(["WEB", "AGENCY_PHYSICAL", "ACCOUNT_ONLY"]).optional()');
    expect(adminRouter).toContain('sortBy: z.enum(["priority", "recent", "oldest", "name", "score_desc"]).default("priority")');
    expect(adminRouter).toContain("availableDestinations");
    expect(adminRouter).toContain("priorityRank");
  });

  it("expose une recherche, des filtres accessibles et une réinitialisation dans le registre", () => {
    expect(dashboard).toContain('aria-label="Filtrer par source"');
    expect(dashboard).toContain('aria-label="Filtrer par destination"');
    expect(dashboard).toContain('aria-label="Trier les dossiers"');
    expect(dashboard).toContain("Priorités d’abord");
    expect(dashboard).toContain("Réinitialiser");
  });
});
