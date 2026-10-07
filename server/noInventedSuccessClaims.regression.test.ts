import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("aucune statistique de réussite inventée sur le site public", () => {
  it("le carrousel des visas n'affiche plus de « taux de succès » par visa", () => {
    const carousel = read("client/src/components/VisasCarousel.tsx");
    expect(carousel).not.toMatch(/successRate/);
    expect(carousel).not.toMatch(/Taux de Succ[èe]s/i);
  });

  it("l'accueil ne promet plus un « taux de succès élevé » sans chiffre vérifié", () => {
    expect(read("client/src/pages/Home.tsx")).not.toMatch(/Taux de succ[èe]s [ée]lev[ée]/i);
  });

  it("aucune procédure serveur publique ne renvoie un taux de réussite ou un délai moyen en dur", () => {
    const router = read("server/routers/proceduresRouter.ts");
    expect(router).not.toMatch(/successRate/);
    expect(router).not.toMatch(/averageProcessingTime/);
  });

  it("les pages e-Visa décrivent un contrôle avant soumission, pas une « garantie »", () => {
    expect(read("client/src/pages/Evisa.tsx")).not.toContain("Garantie Conformité");
    expect(read("client/src/pages/EvisaDetailPage.tsx")).not.toContain("Garantie 3M Travel");
  });
});
