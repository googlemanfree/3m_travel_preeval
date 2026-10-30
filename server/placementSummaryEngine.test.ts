import { deflateSync } from "node:zlib";
import { imageCount, letterheadImageBaseline } from "./testUtils/pdfImages";
import { describe, expect, it } from "vitest";
import type { CvDraft } from "../shared/cvDraft";
import {
  buildPlacementSummaryDraft,
  buildPlacementSummaryPdf,
  detectPortrait,
  fingerprintPlacementSources,
  normalizePlacementSummaryDraft,
  pdfSafe,
  summaryFieldsFromCvDraft,
} from "./services/placementProfileSummary";

function crc32(buf: Buffer) {
  let c = ~0;
  for (const byte of buf) { c ^= byte; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** PNG valide minimal (dégradé) pour tester l'incrustation du portrait sans dépendre d'un fichier. */
function png(width = 20, height = 26) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = y * (width * 3 + 1) + 1 + x * 3; raw[i] = 40 + x; raw[i + 1] = 90 + y; raw[i + 2] = 160; }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const base = buildPlacementSummaryDraft({
  fullName: "Aïcha Nkolo Mballa",
  destination: "Canada",
  procedure: "Travail",
  sector: "Logistique",
  yearsExperience: "6 ans",
  languages: "Français",
  documents: [{ type: "cv", status: "approved" }, { type: "passeport", status: "pending" }],
});
const edited = { destination: "Canada", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français, Anglais (B2)", profileSummary: "Gestionnaire logistique avec six années d’expérience.", headline: "Gestionnaire logistique", highlights: ["Gestionnaire logistique — TRANSCAM SA (2019 – 2024)"] };

const cv: CvDraft = {
  headline: "Gestionnaire logistique",
  summary: "Gestionnaire logistique avec six années d’expérience. Contact aicha@example.com.",
  experiences: [
    { role: "Gestionnaire logistique", employer: "TRANSCAM SA", location: "Douala", start: "2019", end: "2024", bullets: ["Suivi des expéditions"] },
    { role: "Assistante logistique", employer: "CAMLOG", location: null, start: "2017", end: "2019", bullets: [] },
    { role: "Stagiaire", employer: "PORT DE DOUALA", location: null, start: "2016", end: "2017", bullets: [] },
    { role: "Autre poste", employer: "QUATRIÈME", location: null, start: null, end: null, bullets: [] },
  ],
  education: [{ degree: "Licence en logistique", institution: "Université de Douala", year: "2017", details: null }],
  skills: ["Gestion des stocks", "Excel", "SAGE", "Transport routier", "", "Douane", "Planification", "Septième"],
  languages: [{ language: "Français", level: "natif" }, { language: "Anglais", level: "B2" }],
  certifications: [],
  missing: ["Niveau d’espagnol non précisé"],
};

describe("fiche de synthèse : brouillon corrigé par l'administrateur", () => {
  it("l'identité externe et les pièces sont toujours ceux du dossier, jamais ceux envoyés par le navigateur", () => {
    const result = normalizePlacementSummaryDraft({ ...edited, identity: "Aïcha Nkolo Mballa", firstName: "X", documents: [{ type: "Passeport", status: "Validé" }] }, base);
    expect(result.identity).toBe("Aïcha N.");
    expect(result.firstName).toBe("Aïcha");
    expect(result.documents).toEqual(base.documents);
    expect(JSON.stringify(result)).not.toContain("Mballa");
  });

  it("masque les e-mails, téléphones et numéros de pièce que l'administrateur aurait collés", () => {
    const result = normalizePlacementSummaryDraft({ ...edited, profileSummary: "Joindre aicha@example.com ou +237 699 123 456, passeport AB123456, très bon profil.", highlights: ["Tél +237 699 123 456"] }, base);
    const serialized = JSON.stringify(result);
    for (const leaked of ["aicha@example.com", "699 123 456", "AB123456"]) expect(serialized).not.toContain(leaked);
    expect(serialized).toContain("[coordonnée masquée]");
  });

  it("refuse un brouillon sans résumé, trop long ou avec plus de 5 points clés", () => {
    expect(() => normalizePlacementSummaryDraft({ ...edited, profileSummary: "court" }, base)).toThrow();
    expect(() => normalizePlacementSummaryDraft({ ...edited, profileSummary: "x".repeat(901) }, base)).toThrow();
    expect(() => normalizePlacementSummaryDraft({ ...edited, highlights: ["a", "b", "c", "d", "e", "f"] }, base)).toThrow();
    expect(() => normalizePlacementSummaryDraft("pas un objet", base)).toThrow();
  });

  it("l'empreinte des sources ignore les corrections de l'administrateur mais change avec le dossier et l'accord photo", () => {
    const sources = (overrides: Partial<Parameters<typeof fingerprintPlacementSources>[0]> = {}) => fingerprintPlacementSources({ draft: base, fullName: "Aïcha Nkolo Mballa", photoConsent: true, photoId: 7, ...overrides });
    const withEdits = { ...base, profileSummary: "Texte corrigé", headline: "Autre" };
    expect(sources({ draft: withEdits })).toBe(sources());
    expect(sources({ photoConsent: false })).not.toBe(sources());
    expect(sources({ photoId: 8 })).not.toBe(sources());
    expect(sources({ draft: { ...base, documents: [{ type: "CV", status: "Validé" }] } })).not.toBe(sources());
    // sans accord, l'identifiant de la photo n'influence pas l'empreinte
    expect(sources({ photoConsent: false, photoId: 1 })).toBe(sources({ photoConsent: false, photoId: 2 }));
  });
});

describe("fiche de synthèse : résumé tiré du CV", () => {
  it("reprend uniquement ce qui est dans le brouillon de CV : 3 expériences, 1 formation, compétences, langues", () => {
    const fields = summaryFieldsFromCvDraft(cv);
    expect(fields.headline).toBe("Gestionnaire logistique");
    expect(fields.highlights).toEqual([
      "Gestionnaire logistique — TRANSCAM SA (2019 – 2024)",
      "Assistante logistique — CAMLOG (2017 – 2019)",
      "Stagiaire — PORT DE DOUALA (2016 – 2017)",
      "Formation : Licence en logistique, Université de Douala (2017)",
      "Compétences : Gestion des stocks, Excel, SAGE, Transport routier, Douane, Planification",
    ]);
    // Points clés : trois expériences au plus. La synthèse complète (parcours détaillé) peut en reprendre jusqu'à six.
    expect(JSON.stringify(fields.highlights)).not.toContain("QUATRIÈME");
    expect(JSON.stringify(fields.highlights)).not.toContain("Septième");
    expect(fields.experiences?.some((line) => line.includes("QUATRIÈME"))).toBe(true);
    expect(fields.languages).toBe("Français (natif), Anglais (B2)");
  });

  it("masque les coordonnées présentes dans le résumé du CV", () => {
    expect(JSON.stringify(summaryFieldsFromCvDraft(cv))).not.toContain("aicha@example.com");
  });

  it("un CV presque vide ne produit ni points clés ni langues inventés", () => {
    const empty: CvDraft = { headline: null, summary: null, experiences: [], education: [], skills: [], languages: [], certifications: [], missing: [] };
    const fields = summaryFieldsFromCvDraft(empty);
    expect(fields.headline).toBeUndefined();
    expect(fields.highlights).toBeUndefined();
    expect(fields.languages).toBe("");
    expect(fields.profileSummary).toBe("Profil préparé et suivi par 3M.");
  });
});

describe("fiche de synthèse : portrait", () => {
  it("reconnaît JPEG et PNG par leur signature, refuse le reste et les fichiers trop lourds", () => {
    expect(detectPortrait(png())?.mime).toBe("image/png");
    expect(detectPortrait(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0]))?.mime).toBe("image/jpeg");
    expect(detectPortrait(Buffer.from("<html>pas une image</html>"))).toBeNull();
    expect(detectPortrait(Buffer.from("%PDF-1.4 ......"))).toBeNull();
    expect(detectPortrait(null)).toBeNull();
    expect(detectPortrait(Buffer.concat([png(), Buffer.alloc(5 * 1024 * 1024)]))).toBeNull();
  });
});

describe("fiche de synthèse : PDF", () => {
  const draft = normalizePlacementSummaryDraft({ ...edited }, base);
  const text = (pdf: Buffer) => pdf.toString("latin1");

  it("PDF valide d'une page avec accents, intitulé, points clés et mention de contact via 3M", () => {
    const pdf = buildPlacementSummaryPdf(draft, { reference: "PRF-TEST" });
    expect(text(pdf).startsWith("%PDF-")).toBe(true);
    expect(text(pdf)).toMatch(/\/Count 1\b/);
    expect(text(pdf)).toContain("Contact : 3M TRAVEL AGENCY uniquement");
    expect(text(pdf)).toContain("PRF-TEST");
    expect(text(pdf)).toContain("Gestionnaire logistique");
    expect(text(pdf)).toContain("Aïcha N.".replace("ï", "ï"));
    expect(pdf.includes(Buffer.from([0xe9]))).toBe(true); // « é » en Windows-1252, plus de « ? » à la place des accents
  });

  it("sans portrait : aucune image dans le PDF ; avec portrait : une image est incrustée", () => {
    const baseline = letterheadImageBaseline();
    expect(imageCount(text(buildPlacementSummaryPdf(draft)))).toBe(baseline);
    const withPortrait = buildPlacementSummaryPdf(draft, { portrait: { data: png(), mime: "image/png" } });
    expect(imageCount(text(withPortrait))).toBe(baseline + 1);
  });

  it("une image corrompue ou déguisée n'est jamais incrustée : la fiche reste complète", () => {
    const fake = buildPlacementSummaryPdf(draft, { portrait: { data: Buffer.from("<script>alert(1)</script>"), mime: "image/png" } });
    expect(imageCount(text(fake))).toBe(letterheadImageBaseline());
    expect(text(fake)).toContain("Contact : 3M TRAVEL AGENCY uniquement");
  });

  it("un contenu très long passe sur plusieurs pages au lieu de déborder", () => {
    const long = normalizePlacementSummaryDraft({ ...edited, profileSummary: "Phrase assez longue pour remplir plusieurs lignes. ".repeat(18).slice(0, 890), highlights: Array.from({ length: 5 }, (_, i) => `Point clé numéro ${i} ${"très détaillé ".repeat(14)}`.slice(0, 235)) }, { ...base, documents: Array.from({ length: 60 }, (_, i) => ({ type: `Pièce ${i}`, status: "Validé" })) });
    const pdf = buildPlacementSummaryPdf(long);
    expect(Number(text(pdf).match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(1);
  });

  it("les signes typographiques hors Windows-1252 sont ramenés à une forme simple", () => {
    expect(pdfSafe("l’agence — « test » … ok")).toBe("l'agence - « test » ... ok");
    expect(pdfSafe("日本語 ok")).toBe(" ok");
  });
});
