import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CORRIDOR_COMPARISON_PACKS,
  mergeCorridorIntoFavorites,
} from "../client/src/data/corridorComparisonPacks";
import { procedures107Complete } from "../client/src/data/procedures107Complete";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const template =
  '<!doctype html><html lang="fr"><head><title>x</title></head><body><div id="root"><!--prerender-app--></div></body></html>';

describe("comparateur de corridors", () => {
  it("expose des packs valides alignés sur le catalogue procédures", () => {
    expect(CORRIDOR_COMPARISON_PACKS.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(procedures107Complete.map((item) => item.id));
    for (const pack of CORRIDOR_COMPARISON_PACKS) {
      expect(pack.procedureIds.length).toBeGreaterThanOrEqual(2);
      for (const id of pack.procedureIds) {
        expect(ids.has(id), id).toBe(true);
      }
    }
    expect(mergeCorridorIntoFavorites([], CORRIDOR_COMPARISON_PACKS[0]!)).toEqual(
      CORRIDOR_COMPARISON_PACKS[0]!.procedureIds,
    );
  });

  it("câble l’UI empty-state et le CTA procédures", () => {
    const page = read("client/src/pages/CountryComparisonPage.tsx");
    expect(page).toContain("CORRIDOR_COMPARISON_PACKS");
    expect(page).toContain("corridor-comparer-empty");
    expect(page).toContain("applyCorridorPack");
    expect(page).toContain("/travail");
    expect(page).toContain("/etudes");
    expect(page).toContain("/ressources");

    expect(read("client/src/pages/ProceduresAdvanced.tsx")).toContain("Comparer un corridor");
    expect(read("client/src/pages/ProceduresAdvanced.tsx")).toContain("procedures-corridor-comparer-cta");
  });

  it("pré-rend la page comparaison en public indexable", () => {
    const result = composePublicPrerender(template, "/procedures/comparaison");
    expect(result.status).toBe(200);
    expect(result.noindex).toBeFalsy();
    expect(result.html).toContain("Comparateur de corridors");
    expect(result.html).toContain("/travail");
    expect(result.html).toContain("Corridor travail");
  });
});
