import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANDIDATE_DESTINATION_OPTIONS,
  flagEmojiToIsoCode,
  MAX_PREFERRED_DESTINATIONS,
  getCandidateDestinationOption,
  normalizeCandidateDestinations,
  POPULAR_DESTINATION_NAMES,
} from "../shared/candidateDestinationOptions";
import { computeProfileCompletion } from "../shared/profileCompletion";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("destinations favorites — normalisation partagée", () => {
  it("remet chaque pays à l'orthographe officielle, sans doublon, dans l'ordre reçu", () => {
    const result = normalizeCandidateDestinations(["canada", "  FRANCE ", "emirats arabes unis", "France"]);
    expect(result.destinations).toEqual(["Canada", "France", "Émirats Arabes Unis"]);
    expect(result.unrecognized).toEqual([]);
  });

  it("signale ce qui n'est pas un pays connu", () => {
    const result = normalizeCandidateDestinations(["Canada", "Allemagne", "Atlantide"]);
    expect(result.destinations).toEqual(["Canada", "Allemagne"]);
    expect(result.unrecognized).toEqual(["Atlantide"]);
  });

  it("limite les destinations de préférence à trois", () => {
    expect(MAX_PREFERRED_DESTINATIONS).toBe(3);
  });
});

describe("drapeaux — code ISO issu de l'emoji", () => {
  it("convertit un drapeau emoji en code pays et rejette le reste", () => {
    expect(flagEmojiToIsoCode("🇨🇦")).toBe("ca");
    expect(flagEmojiToIsoCode("🇬🇧")).toBe("gb");
    expect(flagEmojiToIsoCode("🇪🇺")).toBe("eu");
    expect(flagEmojiToIsoCode("🌐")).toBeNull();
    expect(flagEmojiToIsoCode("CA")).toBeNull();
    expect(flagEmojiToIsoCode("")).toBeNull();
  });

  it("fournit un code pays pour chacune des destinations proposées", () => {
    for (const option of CANDIDATE_DESTINATION_OPTIONS) {
      expect(flagEmojiToIsoCode(option.flag), option.name).toMatch(/^[a-z]{2}$/);
    }
  });
});

describe("complétude du profil — source unique serveur et client", () => {
  const registered = {
    fullName: "Aïcha Nkolo",
    avatarVerificationStatus: "verified",
    preferredDestinations: JSON.stringify(["Canada"]),
  };

  it("ne remplit pas la barre dès l'inscription : il reste des étapes à accomplir", () => {
    const completion = computeProfileCompletion(registered);
    expect(completion.total).toBe(10);
    expect(completion.filled).toBe(3);
    expect(completion.percent).toBe(30);
    expect(completion.missing.map((field) => field.key)).toEqual([
      "phone", "nationality", "dateOfBirth", "visaType", "educationLevel", "employmentStatus", "languageLevel",
    ]);
  });

  it("atteint 100 % lorsque tout est renseigné", () => {
    const completion = computeProfileCompletion({
      ...registered,
      phone: "+237 6 00 00 00 00",
      nationality: "Camerounaise",
      dateOfBirth: "1995-04-12",
      visaType: "Études",
      educationLevel: "Licence",
      employmentStatus: "Étudiante",
      languageLevel: "DELF B2",
    });
    expect(completion.percent).toBe(100);
    expect(completion.missing).toEqual([]);
  });

  it("ignore les valeurs vides, blanches ou illisibles", () => {
    expect(computeProfileCompletion(null).percent).toBe(0);
    const completion = computeProfileCompletion({
      fullName: "   ",
      phone: "",
      avatarVerificationStatus: "pending",
      preferredDestinations: "pas du json",
    });
    expect(completion.filled).toBe(0);
  });

  it("accepte les destinations sous forme de tableau", () => {
    expect(computeProfileCompletion({ preferredDestinations: ["France"] }).missing.some((field) => field.key === "preferredDestinations")).toBe(false);
  });
});

describe("destinations favorites et progression — câblage", () => {
  it("valide côté serveur comme à l'inscription et redérive la catégorie large", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain('.min(1, "Choisissez au moins une destination").max(MAX_PREFERRED_DESTINATIONS');
    expect(router).toContain("normalizeCandidateDestinations(input.preferredDestinations)");
    expect(router).toContain("updateData.destination = coarseCategoryForPreferredDestinations(destinations)");
    expect(router).toContain("updateData.preferredDestinations = JSON.stringify(destinations)");
  });

  it("expose au tableau de bord les destinations choisies et la progression détaillée", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("preferredDestinations: candidate.preferredDestinations ?? null");
    expect(router).toContain("const profileCompletion = computeProfileCompletion(candidate)");
    expect(router).toContain("profileCompletionPercent: profileCompletion.percent");
  });

  it("affiche la barre de progression dans l'espace personnel et le rafraîchit après chaque sauvegarde", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const panel = read("client/src/components/ClientProfilePanel.tsx");
    const favorites = read("client/src/components/FavoriteDestinationsCard.tsx");
    expect(space).toContain("<ProfileCompletionBar completion={dashboardData.profileCompletion}");
    expect(panel).toContain("utils.candidate.getClientDashboardSummary.invalidate()");
    expect(favorites).toContain("utils.candidate.getClientDashboardSummary.invalidate()");
  });

  it("permet d'enregistrer les destinations favorites depuis le profil", () => {
    const panel = read("client/src/components/ClientProfilePanel.tsx");
    const favorites = read("client/src/components/FavoriteDestinationsCard.tsx");
    expect(panel).toContain("<FavoriteDestinationsCard");
    expect(favorites).toContain("saveMutation.mutate({ preferredDestinations: selected })");
    expect(favorites).toContain("<DestinationPicker");
  });

  it("affiche de vraies miniatures de drapeaux dans les sélecteurs de pays et le résumé du profil", () => {
    expect(read("client/src/components/CountryPicker.tsx")).toContain("<CountryFlag flag={option.flag} />");
    expect(read("client/src/components/ClientProfilePanel.tsx")).toContain("<CountryFlag flag={primaryDestinationOption.flag} />");
    expect(read("client/src/pages/Register.tsx")).toContain("<DestinationPicker");
  });

  it("ne suggère que des pays réellement sélectionnables, tous dotés d'un guide", () => {
    expect(POPULAR_DESTINATION_NAMES.length).toBeGreaterThanOrEqual(6);
    for (const name of POPULAR_DESTINATION_NAMES) {
      const option = getCandidateDestinationOption(name);
      expect(option, name).toBeDefined();
      expect(option!.hasGuide, name).toBe(true);
    }
    const picker = read("client/src/components/CountryPicker.tsx");
    const placeholder = /placeholder = "Rechercher un pays : ([^"…]+)…"/.exec(picker);
    expect(placeholder).not.toBeNull();
    for (const name of placeholder![1].split(",").map((item) => item.trim())) {
      expect(normalizeCandidateDestinations([name]).unrecognized, name).toEqual([]);
    }
  });
});
