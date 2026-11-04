import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const shell = readFileSync(resolve(import.meta.dirname, "../client/index.html"), "utf8");

describe("budget du prérendu de l'accueil", () => {
  // Le budget porte sur le poids TRANSFÉRÉ (compressé), pas sur le HTML brut : on ne retire pas de contenu de référencement
  // (JSON-LD du fondateur, repères de transparence, destinations) pour gagner des octets que la compression absorbe déjà.
  it("reste sous 15 000 octets transférés tout en conservant les repères essentiels", () => {
    const rendered = composePublicPrerender(shell, "/");
    expect(gzipSync(Buffer.from(rendered.html, "utf8")).length).toBeLessThan(15_000);
    expect(rendered.html).toContain("Preuve d’enregistrement vérifiable");
    expect(rendered.html).toContain("Informations vérifiables avant toute démarche");
    expect(rendered.html).toContain('name="description"');
    expect(rendered.html).toContain('type="application/ld+json"');
    expect(rendered.html).toContain("Aureol DONFACK");
  });
});
