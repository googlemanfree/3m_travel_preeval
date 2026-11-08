import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTNERSHIP_ROUTES } from "../shared/partnershipProgram";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("programme de partenariat : câblage", () => {
  it("déclare les deux routes côté client et côté serveur (200, jamais un écran de maintenance)", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('<Route path={"/partenariat"} component={Partnership} />');
    expect(app).toContain('<Route path={"/partenariat/signature"} component={PartnershipSignature} />');
    const prerender = read("server/publicPrerender.ts");
    expect(prerender).toContain('"/partenariat": {');
    expect(prerender).toContain('"/partenariat/signature": privateShell(');
    expect(PARTNERSHIP_ROUTES.hub).toBe("/partenariat");
    expect(PARTNERSHIP_ROUTES.sign).toBe("/partenariat/signature");
  });

  it("la page de signature n'est pas indexable (lien personnel), la page publique l'est", () => {
    const prerender = read("server/publicPrerender.ts");
    const signature = prerender.split("\n").find((line) => line.includes('"/partenariat/signature"')) ?? "";
    expect(signature).toContain("privateShell(");
    const publicLine = prerender.split("\n").find((line) => line.includes('"/partenariat": {')) ?? "";
    expect(publicLine).toContain("description:");
    expect(publicLine).not.toMatch(/visa garanti|100 % de réussite/i);
  });

  it("enregistre le routeur et monte la console dans l'onglet des partenaires de l'administration", () => {
    expect(read("server/routers.ts")).toContain("partnership: partnershipRouter,");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('import { AdminPartnership } from "@/components/AdminPartnership";');
    expect(dashboard).toContain('<div id="admin-partnership"><AdminPartnership sessionToken={sessionToken} /></div>');
  });

  it("relie le programme depuis le hub partenaires et le pied de page", () => {
    expect(read("client/src/pages/PartnersHub.tsx")).toContain('href="/partenariat"');
    expect(read("client/src/components/Footer.tsx")).toContain('href: "/partenariat"');
  });

  it("protège chaque procédure d'administration par une session valide", () => {
    const router = read("server/routers/partnership.ts");
    const adminProcedures = Array.from(router.matchAll(/^\s{2}(admin\w+): publicProcedure/gm)).map((match) => match[1]);
    expect(adminProcedures.sort()).toEqual(["adminCountersign", "adminCounts", "adminGet", "adminIssueProtocol", "adminList", "adminNote", "adminPdfUrl", "adminResendLink", "adminSetStatus"]);
    for (const name of adminProcedures) {
      const start = router.indexOf(`  ${name}: publicProcedure`);
      const body = router.slice(start, start + 1500);
      expect(body, name).toContain("requireValidAdminSession(input.sessionToken)");
    }
  });

  it("le schéma Drizzle et la migration 0098 décrivent les mêmes colonnes", () => {
    const schema = read("drizzle/partnershipSchema.ts");
    const sql = read("drizzle/0098_partnership_program.sql");
    const columns = Array.from(schema.matchAll(/(?:varchar|int|text|mediumtext|timestamp|mysqlEnum)\("([a-z_]+)"/g)).map((match) => match[1]);
    expect(columns.length).toBeGreaterThan(40);
    for (const column of new Set(columns)) expect(sql, `colonne ${column}`).toMatch(new RegExp(`\\b${column}\\b`));
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS partnership_applications");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS partnership_events");
    // Uniquement de nouvelles tables : rien d'existant n'est modifié ni supprimé.
    expect(sql).not.toMatch(/ALTER TABLE|DROP |TRUNCATE|DELETE FROM/i);
  });

  it("n'expose au public ni l'adresse IP, ni les notes internes, ni le texte tant que le lien n'est pas valide", () => {
    const router = read("server/routers/partnership.ts");
    const summary = router.slice(router.indexOf("function publicSummary"), router.indexOf("function publicSummary") + 700);
    expect(summary).not.toMatch(/sourceIp|adminNote|signTokenHash|rejectionReason/);
    expect(router).toContain('protocolText: state === "ready" || state === "signed" ? row.protocolText : null');
  });

  it("le texte des mails ne promet ni résultat ni commission avant la contresignature", () => {
    const router = read("server/routers/partnership.ts");
    expect(router).toContain("ne vaut ni accord ni autorisation de se présenter comme partenaire de 3M");
    expect(router).toContain("Le protocole produit ses effets à la contresignature de 3M");
  });
});
