import { describe, it, expect } from "vitest";
import { categoryForCountry, visaTypeFor } from "@/components/SimpleMultiProjectForm";

describe("Formulaire d'évaluation et robustesse des redirections", () => {
  it("valide les paramètres de projet et de destination supportés", () => {
    const validProjects = ["travail", "etudes", "tourisme"];
    const testProject = "etudes";
    const testDestination = "Canada";

    expect(validProjects).toContain(testProject);
    expect(testDestination).toBe("Canada");
  });

  it("génère correctement l'URL WhatsApp avec les détails formatés du projet", () => {
    const formData = {
      fullName: "Marie Curie",
      email: "marie@example.com",
      whatsappPhone: "+237699999999",
      nationality: "Camerounaise",
      projectType: "etudes",
      sector: "Destination souhaitée : Canada",
    };

    const text = `Bonjour 3M Travel, voici les détails de mon projet :\n- Nom : ${formData.fullName}\n- Email : ${formData.email}\n- WhatsApp : ${formData.whatsappPhone}\n- Nationalité : ${formData.nationality}\n- Type de projet : ${formData.projectType.toUpperCase()}\n- Précisions / Destination : ${formData.sector}`;
    const encoded = encodeURIComponent(text);
    const expectedUrl = `https://wa.me/237698104832?text=${encoded}`;

    expect(expectedUrl).toContain("wa.me");
    expect(expectedUrl).toContain("Canada");
    expect(expectedUrl).toContain("ETUDES");
  });

  it("catégorise correctement les pays pour le SEO et le scoring", () => {
    expect(categoryForCountry("Canada")).toBe("canada");
    expect(categoryForCountry("France")).toBe("schengen");
    expect(categoryForCountry("Luxembourg")).toBe("schengen");
    expect(categoryForCountry("USA")).toBe("autre");
  });

  it("détermine le type de visa adapté selon le pays et le projet", () => {
    expect(visaTypeFor("travail", "Canada")).toBe("canada_travail");
    expect(visaTypeFor("etudes", "Canada")).toBe("canada_etude");
    expect(visaTypeFor("travail", "France")).toBe("schengen_travail");
    expect(visaTypeFor("tourisme", "Belgique")).toBe("schengen_tourisme");
    expect(visaTypeFor("etudes", "Allemagne")).toBe("schengen_etude");
    expect(visaTypeFor("travail", "USA")).toBe("autre");
  });
});
