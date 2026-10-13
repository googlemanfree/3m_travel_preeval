import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("About — publications du fondateur et accessibilité", () => {
  const about = read("client/src/pages/About.tsx");

  it("présente une sélection de publications publiques sans inventer de date ou de média", () => {
    expect(about).toContain("FOUNDER_PUBLICATIONS");
    expect(about).toContain("Actualités & publications");
    expect(about).toContain("/ressources");
    expect(about).toContain("/travail");
    expect(about).toContain("ne constitue ni une promesse de résultat");
  });

  it("expose le partage LinkedIn/Facebook et le contact avec des noms accessibles", () => {
    expect(about).toContain("SocialShareButtons");
    expect(about).toContain("linkedin.com/sharing/share-offsite/?url=");
    expect(about).toContain("Partager le profil du fondateur sur LinkedIn, nouvel onglet");
    expect(about).toContain("Suivre la page Facebook officielle de 3M TRAVEL AGENCY, nouvel onglet");
    expect(about).toContain("Contacter 3M TRAVEL AGENCY sur WhatsApp, nouvel onglet");
    expect(about).toContain("aria-hidden=\"true\"");
  });

  it("nomme les régions About qui contiennent plusieurs contenus", () => {
    expect(about).toContain('aria-labelledby="founder-heading"');
    expect(about).toContain('aria-labelledby="founder-publications-heading"');
    expect(about).toContain('aria-labelledby="operating-principles-heading"');
    expect(about).toContain('aria-labelledby="process-heading"');
    expect(about).toContain('aria-labelledby="about-final-cta-heading"');
  });
});
