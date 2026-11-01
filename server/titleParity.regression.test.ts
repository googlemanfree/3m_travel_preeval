import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(path.resolve(__dirname, "..", file), "utf8").replace(/\r\n/g, "\n");

/**
 * Le titre prérendu par le serveur est celui que voient les robots et l'onglet pendant le chargement.
 * S'il change une fois la page affichée, Google peut retenir le premier : on garde donc les deux identiques.
 */
describe("titres de page : prérendu serveur = affichage final", () => {
  const prerender = read("server/publicPrerender.ts");

  const staticTitle = (route: string) => {
    const match = new RegExp(`"${route}":\\s*\\{\\s*title: \`([^\`]+)\``).exec(prerender);
    expect(match, `titre prérendu introuvable pour ${route}`).not.toBeNull();
    return match![1].replace("${SITE}", "3M TRAVEL AGENCY");
  };

  it("accueil, contact, procédures, destinations et à propos", () => {
    expect(read("client/src/pages/Home.tsx")).toContain('document.title = "3M TRAVEL AGENCY | Agence de voyage, visas et mobilité"');
    expect(prerender).toContain("| Agence de voyage, visas et mobilité`");
    expect(read("client/src/pages/Contact.tsx")).toContain(`title: '${staticTitle("/contact")}'`);
    expect(read("client/src/pages/ProceduresAdvanced.tsx")).toContain("title: `Procédures & destinations | ${BRAND_PUBLIC_NAME}`");
    expect(staticTitle("/procedures")).toBe("Procédures & destinations | 3M TRAVEL AGENCY");
    expect(read("client/src/pages/DestinationsHub.tsx")).toContain(`title: "${staticTitle("/destinations")}"`);
    expect(staticTitle("/about")).toBe("Aureol DONFACK, fondateur PDG 3M Group SARL | 3M TRAVEL AGENCY");
    expect(read("client/src/pages/About.tsx")).toContain("title: `${FOUNDER.name}, fondateur PDG ${GROUP_LEGAL_NAME} | ${BRAND_PUBLIC_NAME}`");
  });

  it("fiches procédure : même titre (nom du visa + marque), sans suffixe ajouté au chargement", () => {
    const detail = read("client/src/pages/CountryDetailPage.tsx");
    expect(detail.match(/title: `\$\{displayTitle\} \| 3M TRAVEL AGENCY`/g)).toHaveLength(2);
    expect(prerender).toContain("const fullTitle = `${displayTitle} | ${SITE}`");
  });

  it("guide pays : même titre que le prérendu, et jamais « en cours de vérification » pendant le chargement", () => {
    const guide = read("client/src/pages/CountryGuide.tsx");
    expect(guide).toContain("clampSeoTitle(data ? `Visa ${name} : ${labels} | 3M TRAVEL AGENCY`");
    expect(prerender).toContain("clampSeoTitle(`Visa ${name} : ${labels} | ${SITE}`)");
    expect(guide).toContain("if (!name || guide.isLoading) return;");
  });
});
