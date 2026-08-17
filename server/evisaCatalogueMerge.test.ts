import { describe, expect, it } from "vitest";
import { mergeEvisaCatalogue } from "../client/src/lib/evisaCatalogueMerge";

const base = [{ id: "kenya", country: "Kenya", capital: "Nairobi", flag: "🇰🇪", region: "Afrique", type: "eTA", duration: "90 jours", delay: "72h", docs: "Passeport", fee: "34 USD", note: "Standard", culture: "", workInfo: "", highlights: [], emblems: [], steps: ["Étape"], image: "" }];
const override = { slug: "kenya", country: "Kenya", capital: "Nairobi", flag: "🇰🇪", region: "Afrique", visaType: "eTA vérifiée", duration: "90 jours", delay: "48h", requirements: "Passeport biométrique", fee: "34 USD", notes: "Portail officiel", officialPortalUrl: "https://example.gov", officialPortalLabel: "Portail Kenya", officialVerifiedAt: "17 août 2026", highlights: ["Contrôlé"], emblems: [], steps: ["Contrôler"], isActive: true };

describe("fusion du catalogue e‑Visa administré", () => {
  it("remplace une fiche standard par ses exigences administrées", () => {
    const catalogue = mergeEvisaCatalogue(base, [override]);
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0]).toMatchObject({ docs: "Passeport biométrique", officialPortalUrl: "https://example.gov" });
  });

  it("masque une fiche standard lorsqu’une surcharge est désactivée", () => {
    expect(mergeEvisaCatalogue(base, [{ ...override, isActive: false }])).toHaveLength(0);
  });

  it("ajoute une nouvelle destination active", () => {
    const catalogue = mergeEvisaCatalogue(base, [{ ...override, slug: "togo", country: "Togo", capital: "Lomé" }]);
    expect(catalogue.map((item) => item.id)).toContain("togo");
  });
});
