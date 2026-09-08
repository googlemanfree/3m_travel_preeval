import { describe, expect, it } from "vitest";
import { getCandidateJourney, journeyStepIndex } from "../shared/candidateJourneyCatalog";
import { procedures107Complete } from "../client/src/data/procedures107Complete";
import fs from "node:fs";

describe("catalogue de parcours candidat pays-visa", () => {
  it("réutilise le catalogue complet des fiches pays disponibles", () => {
    expect(procedures107Complete.length).toBeGreaterThanOrEqual(90);
    expect(procedures107Complete.some((item) => item.name === "Canada" && item.visaType === "travail")).toBe(true);
  });

  it("sélectionne le parcours Canada visiteur", () => {
    const journey = getCandidateJourney("Canada", "Visiteur");
    expect(journey.title).toContain("Visiteur");
    expect(journey.steps.slice(-5).map((item) => item.id)).toEqual(["evaluation", "identity", "funds", "biometrics", "decision"]);
    expect(journey.officialSources[0]).toContain("canada.ca");
  });

  it("sélectionne Arrima pour le parcours Québec", () => {
    const journey = getCandidateJourney("Canada", "Québec · Arrima");
    expect(journey.steps.some((item) => item.id === "arrima")).toBe(true);
    expect(journey.steps.find((item) => item.id === "arrima")?.sourceUrl).toContain("quebec.ca");
  });

  it("impose l’évaluation comme première étape", () => {
    const journey = getCandidateJourney("Luxembourg", "Travailleur");
    expect(journeyStepIndex(journey, "documents", "pending")).toBe(0);
    expect(journeyStepIndex(journey, "documents", "validated")).toBeGreaterThan(0);
  });

  it("keeps confirmation, activation and payment in order", () => {
    const journey = getCandidateJourney("Canada", "Travailleur");
    expect(journeyStepIndex(journey, "bilan", "validated", { evaluationClientConfirmed: false })).toBe(4);
    expect(journeyStepIndex(journey, "bilan", "validated", { evaluationClientConfirmed: true, activationRequested: true, paymentConfirmed: false })).toBe(5);
    expect(journeyStepIndex(journey, "paye", "validated", { evaluationClientConfirmed: true, activationRequested: true, paymentConfirmed: true })).toBe(6);
  });

  it("mappe contrat et visa aux étapes post-traitement", () => {
    const journey = getCandidateJourney("Luxembourg", "Travailleur");
    expect(journeyStepIndex(journey, "contrat_obtenu", "validated")).toBeGreaterThan(journeyStepIndex(journey, "soumis_agences", "validated"));
    expect(journeyStepIndex(journey, "visa_approuve", "validated")).toBeGreaterThan(journeyStepIndex(journey, "contrat_obtenu", "validated"));
  });

  it("sélectionne les variantes détaillées du premier lot européen", () => {
    const cases = [
      ["France", "Études", "france-visas.gouv.fr"],
      ["Belgique", "Travail", "home-affairs.ec.europa.eu"],
      ["Suisse", "Travail", "sem.admin.ch"],
      ["Pays-Bas", "Visiteur", "netherlandsworldwide.nl"],
      ["Allemagne", "Travail", "germany.info"],
      ["Espagne", "Travail", "exteriores.gob.es"],
      ["Portugal", "Travail", "vistos.mne.gov.pt"],
      ["Autriche", "Travail", "migration.gv.at"],
      ["Suède", "Travail", "migration-and-asylum"],
      ["Norvège", "Travail", "norway.no"],
      ["Finlande", "Travail", "migri.fi"],
      ["Danemark", "Travail", "nyidanmark.dk"],
      ["République tchèque", "Travail", "ipc.gov.cz"],
      ["Irlande", "Travail", "irishimmigration.ie"],
      ["Grèce", "Travail", "home-affairs.ec.europa.eu"],
      ["Croatie", "Travail", "mvep.gov.hr"],
      ["Slovaquie", "Travail", "home-affairs.ec.europa.eu"],
      ["Serbie", "Travail", "welcometoserbia.gov.rs"],
      ["Roumanie", "Travail", "home-affairs.ec.europa.eu"],
      ["Slovénie", "Travail", "europa.eu"],
      ["Estonie", "Travail", "europa.eu"],
      ["Lettonie", "Travail", "europa.eu"],
      ["Bulgarie", "Travail", "europa.eu"],
      ["Türkiye", "Visiteur", "mfa.gov.tr"],
      ["Türkiye", "Études", "goc.gov.tr"],
      ["Türkiye", "Travail", "csgb.gov.tr"],
      ["Royaume-Uni", "Visiteur", "gov.uk"],
      ["Royaume-Uni", "Études", "gov.uk"],
      ["Royaume-Uni", "Travail", "gov.uk"],
      ["États-Unis", "Visiteur", "travel.state.gov"],
      ["États-Unis", "Études", "travel.state.gov"],
      ["États-Unis", "Travail", "travel.state.gov"],
      ["Australie", "Visiteur", "homeaffairs.gov.au"],
      ["Australie", "Études", "homeaffairs.gov.au"],
      ["Australie", "Travail", "homeaffairs.gov.au"],
      ["Japon", "Visiteur", "mofa.go.jp"],
      ["Japon", "Études", "mofa.go.jp"],
      ["Japon", "Travail", "mofa.go.jp"],
      ["Nouvelle-Zélande", "Visiteur", "immigration.govt.nz"],
      ["Nouvelle-Zélande", "Études", "immigration.govt.nz"],
      ["Nouvelle-Zélande", "Travail", "immigration.govt.nz"],
      ["Corée du Sud", "Visiteur", "visa.go.kr"],
      ["Corée du Sud", "Études", "visa.go.kr"],
      ["Corée du Sud", "Travail", "visa.go.kr"],
      ["Afrique du Sud", "Visiteur", "dirco.gov.za"],
      ["Afrique du Sud", "Études", "dirco.gov.za"],
      ["Afrique du Sud", "Travail", "dirco.gov.za"],
      ["Brésil", "Visiteur", "gov.br"],
      ["Brésil", "Études", "gov.br"],
      ["Brésil", "Travail", "gov.br"],
      ["Émirats arabes unis", "Visiteur", "u.ae"],
      ["Émirats arabes unis", "Études", "u.ae"],
      ["Émirats arabes unis", "Travail", "u.ae"],
      ["Mexique", "Visiteur", "sre.gob.mx"],
      ["Mexique", "Études", "consulmex.sre.gob.mx"],
      ["Mexique", "Travail", "consulmex.sre.gob.mx"],
      ["Argentine", "Visiteur", "cancilleria.gob.ar"],
      ["Argentine", "Études", "cancilleria.gob.ar"],
      ["Argentine", "Travail", "cancilleria.gob.ar"],
      ["Chili", "Visiteur", "serviciomigraciones.cl"],
      ["Chili", "Études", "serviciomigraciones.cl"],
      ["Chili", "Travail", "serviciomigraciones.cl"],
      ["Colombie", "Visiteur", "cancilleria.gov.co"],
      ["Colombie", "Études", "cancilleria.gov.co"],
      ["Colombie", "Travail", "cancilleria.gov.co"],
      ["Pérou", "Visiteur", "consulado.pe"],
      ["Pérou", "Études", "consulado.pe"],
      ["Pérou", "Travail", "gob.pe"],
      ["Nigeria", "Visiteur", "immigration.gov.ng"],
      ["Nigeria", "Études", "immigration.gov.ng"],
      ["Nigeria", "Travail", "immigration.gov.ng"],
      ["Ghana", "Visiteur", "gis.gov.gh"],
      ["Ghana", "Études", "gis.gov.gh"],
      ["Ghana", "Travail", "gis.gov.gh"],
      ["Kenya", "Visiteur", "etakenya.go.ke"],
      ["Kenya", "Études", "immigration.go.ke"],
      ["Kenya", "Travail", "immigration.go.ke"],
      ["Tanzanie", "Visiteur", "visa.immigration.go.tz"],
      ["Tanzanie", "Études", "immigration.go.tz"],
      ["Tanzanie", "Travail", "eservices.immigration.go.tz"],
      ["Maroc", "Visiteur", "consulat.ma"],
      ["Maroc", "Études", "consulat.ma"],
      ["Maroc", "Travail", "consulat.ma"],
      ["Rwanda", "Visiteur", "migration.gov.rw"],
      ["Rwanda", "Études", "migration.gov.rw"],
      ["Rwanda", "Travail", "migration.gov.rw"],
      ["Éthiopie", "Visiteur", "evisa.gov.et"],
      ["Éthiopie", "Études", "evisa.gov.et"],
      ["Éthiopie", "Travail", "evisa.gov.et"],
      ["Maurice", "Visiteur", "passport.govmu.org"],
      ["Maurice", "Études", "dha.govmu.org"],
      ["Maurice", "Travail", "passport.govmu.org"],
      ["Algérie", "Visiteur", "mfa.gov.dz"],
      ["Algérie", "Études", "studyinalgeria.mesrs.dz"],
      ["Algérie", "Travail", "aapi.dz"],
      ["Tunisie", "Visiteur", "diplomatie.gov.tn"],
      ["Tunisie", "Études", "interieur.gov.tn"],
      ["Tunisie", "Travail", "emploi.gov.tn"],
      ["Ouganda", "Visiteur", "immigration.go.ug"],
      ["Ouganda", "Études", "immigration.go.ug"],
      ["Ouganda", "Travail", "immigration.go.ug"],
    ] as const;
    for (const [country, visa, sourceHost] of cases) {
      const journey = getCandidateJourney(country, visa);
      expect(journey.steps.length).toBeGreaterThan(15);
      expect(journey.steps.some((step) => step.sourceUrl.includes(sourceHost))).toBe(true);
      expect(journey.officialSources[0]).toContain(sourceHost);
    }
  });

  it("ne fabrique pas de portail pour un pays non référencé", () => {
    const journey = getCandidateJourney("Destination à vérifier", "Visiteur");
    expect(journey.officialSources).toEqual([]);
    expect(journey.steps.every((item) => item.sourceUrl === "")).toBe(true);
  });

  it("propose un aperçu sécurisé pour les documents disponibles à chaque étape", () => {
    const component = fs.readFileSync("client/src/components/CandidateCountryJourney.tsx", "utf8");
    expect(component).toContain("DocumentPreviewModal");
    expect(component).toContain("setPreviewDocument");
    expect(component).toContain("Aperçu");
    expect(component).toContain('officialRecord?.verificationStatus === "verified"');
  });
});
