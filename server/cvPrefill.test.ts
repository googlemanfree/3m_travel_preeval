import { describe, expect, it } from "vitest";
import { normalizeCVExtractedFields } from "./aiEvaluationService";

describe("pré-remplissage IA du CV", () => {
  it("conserve uniquement les champs connus, explicitement valides et non sensibles", () => {
    const fields = normalizeCVExtractedFields({
      educationLevel: "master",
      diplomaTitle: "Master en ingénierie informatique",
      graduationYear: "2021",
      fieldOfStudy: "Informatique",
      employmentStatus: "employe",
      currentJobTitle: "Développeur logiciel",
      yearsOfExperience: "5–10",
      industrySector: "Technologies de l'information",
      mainTasks: "Développement et maintenance d'applications.",
      frenchLevel: "b2",
      englishLevel: "b1",
      languageTestsTaken: "IELTS 2023",
      fullName: "Ne doit jamais être retourné",
      phone: "+237000000000",
      destinationCountry: "Canada",
    });

    expect(fields).toMatchObject({ educationLevel: "master", yearsOfExperience: "5-10", frenchLevel: "b2", englishLevel: "b1" });
    expect(fields).not.toHaveProperty("fullName");
    expect(fields).not.toHaveProperty("phone");
    expect(fields).not.toHaveProperty("destinationCountry");
  });

  it("écarte les valeurs hors référentiel ou mal formées plutôt que de les propager au formulaire", () => {
    const fields = normalizeCVExtractedFields({
      educationLevel: "expert",
      graduationYear: "vingt vingt",
      employmentStatus: "contrat-ambigu",
      yearsOfExperience: "beaucoup",
      frenchLevel: "excellent",
      diplomaTitle: "  Licence professionnelle  ",
    });

    expect(fields).toEqual({ diplomaTitle: "Licence professionnelle" });
  });
});
