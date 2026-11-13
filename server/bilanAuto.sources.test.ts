import { describe, expect, it } from "vitest";
import { MemorySourcesStore, SourceInputSchema, formatAmount, makeReferentialSearch, occupationMatches } from "./services/bilanAuto/sources";
import { buildOrientations } from "./services/bilanAuto/orientations";
import { emptyFacts } from "./services/bilanAuto/scoring";
import { buildReport } from "./services/bilanAuto/report";
import { scoreFacts } from "./services/bilanAuto/scoring";

const NOW = new Date("2026-11-13T10:00:00Z");
const valid = { country: "Luxembourg", kind: "salaire", occupation: "Technicien de maintenance", amountMin: 3000, amountMax: 3500, currency: "eur", period: "mois", grossOrNet: "brut", url: "https://example.org/salaires", title: "Observatoire des salaires", observedAt: "2026-10-30" };

describe("référentiel de sources", () => {
  it("valide une source de salaire complète et normalise la devise", () => {
    const parsed = SourceInputSchema.parse(valid);
    expect(parsed.currency).toBe("EUR");
    expect(parsed.remoteRecruiting).toBe("non_confirmee");
    expect(parsed.employer).toBeNull();
  });
  it.each([
    [{ url: "http://example.org" }, /https/],
    [{ observedAt: "2999-01-01" }, /invalide ou future/],
    [{ observedAt: "hier" }, /AAAA-MM-JJ/],
    [{ currency: null }, /devise/i],
    [{ period: null }, /période/i],
    [{ amountMin: null, amountMax: null }, /montant/i],
    [{ amountMin: 4000, amountMax: 3000 }, /maximum/i],
    [{ country: "Atlantide" }, /hors liste/],
    [{ kind: "offre" }, /employeur/i],
  ])("refuse une saisie invalide %#", (override, message) => {
    const result = SourceInputSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) expect(JSON.stringify(result.error.issues)).toMatch(message);
  });

  it("ne convertit jamais brut/net : la mention absente est dite", () => {
    expect(formatAmount({ amountMin: 3000, amountMax: 3500, currency: "EUR", grossOrNet: "brut" })).toBe("3 000 à 3 500 EUR (brut)".replace(/ /g, " "));
    expect(formatAmount({ amountMin: 3000, amountMax: null, currency: "EUR", grossOrNet: null })).toMatch(/brut\/net non précisé/);
  });

  it("rapproche le métier visé de l'intitulé saisi", () => {
    expect(occupationMatches("Technicien de maintenance industrielle", "Technicienne de maintenance")).toBe(true);
    expect(occupationMatches("Comptable", "Technicienne de maintenance")).toBe(false);
    expect(occupationMatches("Comptable", null)).toBe(false);
  });

  async function orientationsWith(entries: unknown[]) {
    const store = new MemorySourcesStore();
    for (const entry of entries) await store.create({ ...SourceInputSchema.parse(entry), createdBy: "admin" });
    const facts = emptyFacts();
    facts.metierVise = "Technicienne de maintenance";
    facts.formation.niveau = { value: "bac_plus_2", provenance: "declare", sources: ["formulaire"] };
    facts.ageAns = 30;
    return { store, outcome: await buildOrientations({ facts, now: NOW, search: makeReferentialSearch(store) }), facts };
  }

  it("un repère salarial saisi remplace « à documenter » pour son pays seulement, avec source et date", async () => {
    const { outcome } = await orientationsWith([valid]);
    const lux = outcome.proposals.find((p) => p.country === "Luxembourg")!;
    expect(lux.salary).not.toMatch(/à documenter/i);
    expect(lux.items.find((i) => i.kind === "repere_salarial")).toMatchObject({ amount: expect.stringContaining("(brut)") });
    expect(lux.sources[0]).toMatchObject({ url: "https://example.org/salaires", consultedAt: "2026-10-30" });
    expect(outcome.proposals.find((p) => p.country === "Pologne")!.salary).toMatch(/à documenter/i);
  });

  it("une offre repérée indique que le recrutement depuis l'étranger n'est pas confirmé sans preuve", async () => {
    const { outcome, facts } = await orientationsWith([{ ...valid, kind: "offre", employer: "Société X", city: "Esch-sur-Alzette", amountMin: null, amountMax: null, currency: null, period: null, grossOrNet: null }]);
    const offer = outcome.proposals[0].items.find((i) => i.kind === "offre_reperee");
    expect(offer).toMatchObject({ remote: "non_confirmee" });
    const report = buildReport({ candidateName: "A", dossierRef: null, referenceDate: NOW.toISOString(), facts, score: scoreFacts(facts), orientations: outcome, previous: null, unreadableDocuments: [], injectionSuspected: false });
    expect(JSON.stringify(report)).toMatch(/recrutement depuis l'étranger : non confirmé/);
  });

  it("une source périmée ou désactivée n'est pas publiée", async () => {
    const { outcome } = await orientationsWith([{ ...valid, observedAt: "2025-01-02" }]);
    expect(outcome.proposals[0].salary).toMatch(/à documenter/i);
    const store = new MemorySourcesStore();
    const created = await store.create({ ...SourceInputSchema.parse(valid), createdBy: "admin" });
    await store.setActive(created.id, false);
    const facts = emptyFacts(); facts.metierVise = "Technicien de maintenance";
    const search = await makeReferentialSearch(store)({ country: "Luxembourg", jobTitle: facts.metierVise });
    expect(search.salaries).toHaveLength(0);
  });
});
