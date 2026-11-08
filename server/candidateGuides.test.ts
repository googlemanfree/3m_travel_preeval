import { describe, expect, it } from "vitest";
import { DESTINATIONS_20 } from "@/data/destinations20";
import { getAllCandidateGuides, getCandidateGuide } from "@/data/candidateGuides";
import { luxembourgGuide } from "@/data/candidateGuides/luxembourg";
import type { CandidateGuide, GuideBlock } from "@/data/candidateGuides/types";

const blockText = (block: GuideBlock): string => {
  switch (block.type) {
    case "text": return block.text;
    case "list": return block.items.join(" ");
    case "callout": return `${block.title ?? ""} ${block.text}`;
    case "table": return [block.caption ?? "", ...block.headers, ...block.rows.flat(), block.note ?? ""].join(" ");
    case "cards": return block.items.map((item) => `${item.title} ${item.text}`).join(" ");
    case "step": return `${block.title} ${block.actors} ${block.action} ${block.expected} ${block.vigilance}`;
    case "faq": return block.items.map((item) => `${item.question} ${item.answer}`).join(" ");
  }
};

const guideText = (guide: CandidateGuide) =>
  [guide.heading, guide.lead, guide.disclaimer, ...guide.sections.flatMap((section) => [section.title, section.kicker ?? "", ...section.blocks.map(blockText)]), ...guide.sources.map((s) => s.text), ...guide.toValidate].join("\n");

/** Repères [S2], [S3–S4], [S5, S9, S10] cités dans le texte → clés individuelles (S2, S3, S4, S5, S9, S10). */
const citedKeys = (text: string): string[] => {
  const keys = new Set<string>();
  for (const match of text.matchAll(/\[(S[\d–,\sS]+)\]/g)) {
    const inner = match[1];
    for (const part of inner.split(",")) {
      const range = part.trim().match(/^S(\d+)\s*–\s*S?(\d+)$/);
      if (range) for (let n = Number(range[1]); n <= Number(range[2]); n += 1) keys.add(`S${n}`);
      else {
        const single = part.trim().match(/^S(\d+)$/);
        if (single) keys.add(`S${single[1]}`);
      }
    }
  }
  return Array.from(keys);
};

const sourceKeysCovered = (guide: CandidateGuide): Set<string> => {
  const covered = new Set<string>();
  for (const source of guide.sources) {
    const range = source.key.match(/^S(\d+)–S(\d+)$/);
    if (range) for (let n = Number(range[1]); n <= Number(range[2]); n += 1) covered.add(`S${n}`);
    else covered.add(source.key);
  }
  return covered;
};

describe("guide candidat Luxembourg (reprise du guide PDF)", () => {
  it("reprend les 12 étapes de la procédure, dans l'ordre", () => {
    const steps = luxembourgGuide.sections.flatMap((section) => section.blocks).filter((block) => block.type === "step");
    expect(steps.map((step) => (step.type === "step" ? step.number : ""))).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
  });

  it("reprend les montants du guide : ouverture 100 000 et trois formules 2 300 000 / 2 645 000 / 2 875 000 FCFA", () => {
    const text = guideText(luxembourgGuide);
    for (const amount of ["100 000 FCFA", "2 300 000 FCFA", "2 645 000 FCFA", "2 875 000 FCFA", "2 200 000 FCFA", "2 545 000 FCFA", "2 775 000 FCFA", "1 018 000", "509 000"]) {
      expect(text, amount).toContain(amount);
    }
  });

  it("l'échéancier est cohérent : chaque colonne totalise la formule", () => {
    const table = luxembourgGuide.sections.find((section) => section.id === "echeancier")?.blocks.find((block) => block.type === "table" && block.headers[0] === "Événement proposé");
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    const num = (value: string) => Number(value.replace(/\s/g, ""));
    const body = table.rows.slice(0, -1);
    const total = table.rows[table.rows.length - 1];
    for (const column of [1, 2, 3]) expect(body.reduce((sum, row) => sum + num(row[column]), 0), `colonne ${column}`).toBe(num(total[column]));
  });

  it("toutes les sources S1 à S14 existent et chaque repère cité renvoie à une source", () => {
    const covered = sourceKeysCovered(luxembourgGuide);
    for (let n = 1; n <= 14; n += 1) expect(covered.has(`S${n}`), `S${n}`).toBe(true);
    for (const key of citedKeys(guideText(luxembourgGuide))) expect(covered.has(key), `repère ${key} sans source`).toBe(true);
  });

  it("ne promet ni embauche ni visa, et rappelle que le guide ne déclenche aucun paiement", () => {
    const text = guideText(luxembourgGuide);
    expect(text).toMatch(/ne garantit pas une embauche/);
    expect(text).toMatch(/Pas de visa garanti|ne garantit pas un visa/);
    expect(text).toContain("Ce guide ne déclenche aucun paiement");
    expect(text).not.toMatch(/65[\s  .,]?000/);
  });

  it("le sommaire ne pointe que des rubriques existantes", () => {
    const ids = new Set([...luxembourgGuide.sections.map((section) => section.id), "sources"]);
    for (const group of luxembourgGuide.contents) for (const id of group.sectionIds) expect(ids.has(id), id).toBe(true);
  });
});

describe("guide candidat de chaque destination du site", () => {
  const guides = getAllCandidateGuides();

  it("il existe un guide par destination du répertoire, et seul le Luxembourg est rédigé en entier", () => {
    expect(guides.map((guide) => guide.slug)).toEqual(DESTINATIONS_20.map((destination) => destination.slug));
    expect(guides.filter((guide) => guide.maturity === "complete").map((guide) => guide.slug)).toEqual(["luxembourg"]);
    expect(getCandidateGuide("destination-inconnue")).toBeNull();
  });

  it.each(DESTINATIONS_20.map((destination) => destination.slug))("%s : structure complète, sommaire valide, repères sourcés", (slug) => {
    const guide = getCandidateGuide(slug)!;
    const ids = new Set([...guide.sections.map((section) => section.id), "sources"]);
    expect(ids.size).toBe(guide.sections.length + 1);
    for (const group of guide.contents) for (const id of group.sectionIds) expect(ids.has(id), `${slug} : ${id}`).toBe(true);
    for (const required of ["evaluation", "faq-securite"]) expect(ids.has(required), `${slug} : ${required}`).toBe(true);
    const covered = sourceKeysCovered(guide);
    for (const key of citedKeys(guideText(guide))) expect(covered.has(key), `${slug} : repère ${key} sans source`).toBe(true);
    expect(guide.toValidate.length).toBeGreaterThan(0);
  });

  const framework = guides.filter((guide) => guide.maturity === "framework");

  it.each(framework.map((guide) => guide.slug))("%s : aucun montant, aucune promesse, aucun lien inventé", (slug) => {
    const text = guideText(getCandidateGuide(slug)!);
    expect(text).not.toMatch(/\d[\d\s  ]*(FCFA|XAF|EUR|€|USD|\$)/);
    expect(text).not.toMatch(/65[\s  .,]?000/);
    expect(text).not.toMatch(/https?:\/\//);
    // « ne signifie pas visa garanti » est une négation légitime : on ne retient que les promesses positives.
    expect(text.replace(/ne signifie pas visa garanti/gi, "")).not.toMatch(/visa garanti|emploi garanti|100 ?% ?(de réussite|garanti)/i);
    expect(text).toMatch(/à confirmer/i);
  });

  it("chaque guide du cadre commun reprend bien les repères propres au pays (visa, secteurs, étapes)", () => {
    for (const destination of DESTINATIONS_20) {
      const guide = getCandidateGuide(destination.slug)!;
      if (guide.maturity !== "framework") continue;
      const text = guideText(guide);
      expect(text, destination.slug).toContain(destination.visa);
      expect(text, destination.slug).toContain(destination.secteurs[0]);
      expect(text, destination.slug).toContain(destination.name);
    }
  });
});
