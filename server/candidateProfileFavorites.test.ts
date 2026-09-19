import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANDIDATE_DESTINATION_OPTIONS,
  flagEmojiToIsoCode,
  MAX_PREFERRED_DESTINATIONS,
  normalizeCandidateDestinations,
} from "../shared/candidateDestinationOptions";
import { computeProfileCompletion } from "../shared/profileCompletion";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("destinations favorites — normalisation partagée", () => {
  it("remet chaque pays à l'orthographe officielle, sans doublon, dans l'ordre reçu", () => {
    const result = normalizeCandidateDestinations(["canada", "  FRANCE ", "emirats arabes unis", "France"]);
    expect(result.destinations).toEqual(["Canada", "France", "Émirats Arabes Unis"]);
    expect(result.unrecognized).toEqual([]);
  });

  it("signale les pays qui ne figurent pas dans la liste supportée", () => {
    const result = normalizeCandidateDestinations(["Canada", "Allemagne", "Atlantide"]);
    expect(result.destinations).toEqual(["Canada"]);
    expect(result.unrecognized).toEqual(["Allemagne", "Atlantide"]);
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
    expect(favorites).toContain("aria-pressed={isSelected}");
  });

  it("affiche de vraies miniatures de drapeaux dans les menus de destinations", () => {
    expect(read("client/src/pages/Register.tsx")).toContain("<CountryFlag flag={option.flag} />");
    expect(read("client/src/components/ClientProfilePanel.tsx")).toContain("<CountryFlag flag={option.flag} />");
    expect(read("client/src/components/FavoriteDestinationsCard.tsx")).toContain("<CountryFlag flag={option.flag} />");
  });

  it("ne suggère à l'inscription que des destinations réellement sélectionnables", () => {
    const register = read("client/src/pages/Register.tsx");
    const hint = /Destinations populaires : ([^<.]+)\./.exec(register);
    const placeholder = /placeholder="Rechercher ([^"…]+)…"/.exec(register);
    expect(hint).not.toBeNull();
    expect(placeholder).not.toBeNull();
    const names = [hint![1], placeholder![1]].flatMap((text) => text.split(/,| et /)).map((name) => name.trim()).filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(6);
    for (const name of names) {
      expect(normalizeCandidateDestinations([name]).unrecognized, name).toEqual([]);
    }
  });
});
