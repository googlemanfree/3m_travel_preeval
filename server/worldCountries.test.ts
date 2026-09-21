import { describe, expect, it } from "vitest";
import { getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";
import { getAllDestinationOptionsForProject, getDestinationOptionsForProject } from "../client/src/lib/destinationProcedureCatalog";
import {
  CANDIDATE_DESTINATION_OPTIONS,
  DESTINATION_REGIONS,
  coarseCategoryForPreferredDestinations,
  flagEmojiToIsoCode,
  getCandidateDestinationOption,
  destinationLabelForStaff,
  getDestinationFormProfile,
  isoCodeToFlagEmoji,
  normalizeDestinationText,
  parsePreferredDestinations,
  REGISTRATION_PROJECT_TYPES,
  searchCandidateDestinations,
} from "../shared/candidateDestinationOptions";
import { GUIDE_COUNTRY_CODES, WORLD_COUNTRY_ROWS } from "../shared/worldCountries";

// Libellés de l'ancienne liste de 20 pays : déjà enregistrés en base, ils doivent rester reconnus à l'identique.
const LEGACY_COUNTRIES: Array<[string, string]> = [
  ["Pays-Bas", "europe"], ["Luxembourg", "luxembourg"], ["Belgique", "europe"], ["France", "europe"], ["Royaume-Uni", "europe"],
  ["Irlande", "europe"], ["Portugal", "europe"], ["Espagne", "europe"], ["Italie", "europe"], ["Pologne", "pologne"],
  ["Malte", "europe"], ["Norvège", "europe"], ["Canada", "canada"], ["Australie", "autre"], ["Nouvelle-Zélande", "autre"],
  ["Émirats Arabes Unis", "golfe"], ["Qatar", "golfe"], ["Arabie Saoudite", "golfe"], ["Corée du Sud", "autre"], ["Japon", "autre"],
];

describe("liste mondiale des pays", () => {
  it("couvre 196 pays sans doublon de code ni de nom", () => {
    expect(WORLD_COUNTRY_ROWS).toHaveLength(196);
    expect(CANDIDATE_DESTINATION_OPTIONS).toHaveLength(196);
    expect(new Set(WORLD_COUNTRY_ROWS.map(([code]) => code)).size).toBe(196);
    expect(new Set(WORLD_COUNTRY_ROWS.map(([, name]) => normalizeDestinationText(name))).size).toBe(196);
  });

  it("range chaque pays dans une région connue", () => {
    for (const option of CANDIDATE_DESTINATION_OPTIONS) {
      expect(DESTINATION_REGIONS, option.name).toContain(option.region);
    }
  });

  it("propose les pays d'origine des candidats et les destinations courantes, avec leurs vrais noms", () => {
    for (const name of ["Cameroun", "Sénégal", "Côte d’Ivoire", "Congo-Kinshasa", "Maroc", "Allemagne", "États-Unis", "Suisse", "Brésil", "Turquie", "Chine", "Inde"]) {
      expect(getCandidateDestinationOption(name), name).toBeDefined();
    }
  });

  it("conserve à l'identique les libellés et la catégorie large de l'ancienne liste de 20 pays", () => {
    for (const [name, coarse] of LEGACY_COUNTRIES) {
      expect(getCandidateDestinationOption(name)?.name, name).toBe(name);
      expect(coarseCategoryForPreferredDestinations([name]), name).toBe(coarse);
    }
  });

  it("dérive le drapeau du code ISO et le retrouve pour chaque pays", () => {
    expect(isoCodeToFlagEmoji("CA")).toBe("🇨🇦");
    for (const option of CANDIDATE_DESTINATION_OPTIONS) {
      expect(flagEmojiToIsoCode(option.flag), option.name).toBe(option.code.toLowerCase());
    }
  });

  it("ne promet un guide que pour les pays dotés d'une source officielle vérifiée", () => {
    expect(GUIDE_COUNTRY_CODES.length).toBeGreaterThanOrEqual(50);
    for (const code of GUIDE_COUNTRY_CODES) {
      const option = CANDIDATE_DESTINATION_OPTIONS.find((item) => item.code === code);
      expect(option, code).toBeDefined();
      expect(option!.hasGuide, code).toBe(true);
      expect(getEnrichedCandidateJourney(option!.name, "travail", "").officialSources.length, option!.name).toBeGreaterThan(0);
    }
    expect(CANDIDATE_DESTINATION_OPTIONS.filter((option) => option.hasGuide)).toHaveLength(GUIDE_COUNTRY_CODES.length);
  });

  it("donne aux pays sans guide un parcours générique honnête, sans source inventée", () => {
    const senegal = getEnrichedCandidateJourney("Sénégal", "travail", "");
    expect(senegal.officialSources).toHaveLength(0);
    expect(senegal.steps.length).toBeGreaterThan(0);
  });
});

describe("recherche de pays", () => {
  it("ignore accents, majuscules, tirets et apostrophes", () => {
    expect(searchCandidateDestinations("cote d'ivoire")[0].name).toBe("Côte d’Ivoire");
    expect(searchCandidateDestinations("COTE DIVOIRE")[0].name).toBe("Côte d’Ivoire");
    expect(searchCandidateDestinations("etats unis")[0].name).toBe("États-Unis");
    expect(searchCandidateDestinations("pays bas")[0].name).toBe("Pays-Bas");
    expect(searchCandidateDestinations("emirats")[0].name).toBe("Émirats Arabes Unis");
  });

  it("retrouve un pays par son alias usuel, avant les simples préfixes d'autres noms", () => {
    expect(searchCandidateDestinations("uk")[0].name).toBe("Royaume-Uni");
    expect(searchCandidateDestinations("usa")[0].name).toBe("États-Unis");
    expect(searchCandidateDestinations("uae")[0].name).toBe("Émirats Arabes Unis");
    expect(searchCandidateDestinations("rdc")[0].name).toBe("Congo-Kinshasa");
    expect(searchCandidateDestinations("hollande")[0].name).toBe("Pays-Bas");
    expect(searchCandidateDestinations("birmanie")[0].name).toBe("Myanmar (Birmanie)");
  });

  it("place les noms qui commencent par la saisie avant ceux qui la contiennent", () => {
    const names = searchCandidateDestinations("al").map((option) => normalizeDestinationText(option.name));
    const firstNonPrefix = names.findIndex((name) => !name.startsWith("al"));
    expect(firstNonPrefix).toBeGreaterThan(2);
    expect(names.slice(firstNonPrefix).some((name) => name.startsWith("al"))).toBe(false);
  });

  it("cherche aussi par région, rend tous les pays sans saisie et rien pour un texte absurde", () => {
    expect(searchCandidateDestinations("").length).toBe(196);
    expect(searchCandidateDestinations("caraibes").length).toBeGreaterThan(20);
    expect(searchCandidateDestinations("zzzzqq")).toEqual([]);
  });

  it("reconnaît les graphies utilisées ailleurs sur le site", () => {
    expect(getCandidateDestinationOption("UAE / Dubaï")?.name).toBe("Émirats Arabes Unis");
    expect(getCandidateDestinationOption("canada")?.name).toBe("Canada");
    expect(getCandidateDestinationOption("Etats-Unis")?.name).toBe("États-Unis");
    expect(getCandidateDestinationOption("europe")).toBeUndefined();
    expect(getCandidateDestinationOption("autre")).toBeUndefined();
  });
});

describe("formulaire d'inscription selon le pays choisi", () => {
  it("est complet pour un pays avec guide : quatre questions de projet et un repère de langue adapté", () => {
    const france = getDestinationFormProfile("France");
    expect(france.level).toBe("complet");
    expect(france.extraFields).toEqual(["visaType", "educationLevel", "employmentStatus", "languageLevel"]);
    expect(france.languageHint).toContain("DELF");
    expect(getDestinationFormProfile("Canada").languageHint).toContain("TEF");
    expect(getDestinationFormProfile("Royaume-Uni").languageHint).toContain("IELTS");
    expect(getDestinationFormProfile("Allemagne").languageHint).toContain("Goethe");
  });

  it("est réduit pour un pays sans guide, avec un message honnête sur l'accompagnement", () => {
    const senegal = getDestinationFormProfile("Sénégal");
    expect(senegal.level).toBe("reduit");
    expect(senegal.extraFields).toEqual(["visaType"]);
    expect(senegal.message).toContain("Sénégal");
    expect(senegal.message).toContain("conseiller");
  });

  it("adapte les questions au type de projet pour un pays avec guide", () => {
    const fields = (country: string, project?: string) => getDestinationFormProfile(country, project).extraFields;
    expect(fields("France", "Études")).toEqual(["visaType", "educationLevel", "languageLevel"]);
    expect(fields("France", "Travail")).toEqual(["visaType", "employmentStatus", "educationLevel", "languageLevel"]);
    expect(fields("France", "Tourisme / visite")).toEqual(["visaType"]);
    expect(fields("France", "Regroupement familial")).toEqual(["visaType"]);
    expect(fields("France", "Autre")).toEqual(["visaType", "educationLevel", "employmentStatus", "languageLevel"]);
    expect(fields("France", "")).toEqual(fields("France", "Autre"));
    expect(fields("France")).toEqual(fields("France", "Autre"));
  });

  it("ne demande que le type de projet pour un pays sans guide, quel que soit le projet", () => {
    for (const project of ["Études", "Travail", "Tourisme / visite", "", undefined]) {
      expect(getDestinationFormProfile("Sénégal", project).extraFields, String(project)).toEqual(["visaType"]);
    }
  });

  it("propose exactement les types de projet que le formulaire sait interpréter", () => {
    for (const type of REGISTRATION_PROJECT_TYPES) {
      expect(getDestinationFormProfile("France", type).extraFields[0], type).toBe("visaType");
    }
    expect(getDestinationFormProfile("France", "Études").extraFields).not.toContain("employmentStatus");
  });

  it("reste réduit et muet tant qu'aucun pays reconnu n'est choisi", () => {
    for (const value of [undefined, null, "", "Narnia"]) {
      const profile = getDestinationFormProfile(value);
      expect(profile.level).toBe("reduit");
      expect(profile.extraFields).toEqual([]);
      expect(profile.message).toBe("");
    }
  });
});

describe("formulaire d'évaluation — tous les pays", () => {
  it("propose tous les pays du monde, ceux qui ont des procédures en tête, sans doublon", () => {
    for (const project of ["travail", "etudes", "tourisme"] as const) {
      const all = getAllDestinationOptionsForProject(project);
      const withProcedures = getDestinationOptionsForProject(project);
      expect(all.slice(0, withProcedures.length), project).toEqual(withProcedures);
      const keys = all.map((option) => getCandidateDestinationOption(option.country)?.code ?? option.country);
      expect(new Set(keys).size, project).toBe(all.length);
      for (const option of CANDIDATE_DESTINATION_OPTIONS) expect(keys, `${project} / ${option.name}`).toContain(option.code);
    }
  });
});

describe("destination affichée à l'équipe (back-office)", () => {
  it("lit la liste enregistrée sans jamais lever d'erreur", () => {
    expect(parsePreferredDestinations(JSON.stringify(["France", "Canada"]))).toEqual(["France", "Canada"]);
    expect(parsePreferredDestinations(["Japon", 3, "", "  "])).toEqual(["Japon"]);
    for (const raw of [null, undefined, "", "pas du json", "{\"a\":1}", 42]) expect(parsePreferredDestinations(raw), String(raw)).toEqual([]);
  });

  it("montre le pays principal précis plutôt que la catégorie large historique", () => {
    expect(destinationLabelForStaff({ preferredDestinations: JSON.stringify(["france", "Canada"]), destination: "europe" })).toBe("France");
    expect(destinationLabelForStaff({ preferredDestinations: JSON.stringify(["Sénégal"]), destination: "autre" })).toBe("Sénégal");
  });

  it("retombe sur la catégorie historique des anciens comptes, puis sur « Non spécifiée »", () => {
    expect(destinationLabelForStaff({ preferredDestinations: null, destination: "golfe" })).toBe("golfe");
    expect(destinationLabelForStaff({ preferredDestinations: "illisible", destination: "canada" })).toBe("canada");
    expect(destinationLabelForStaff({})).toBe("Non spécifiée");
  });
});
