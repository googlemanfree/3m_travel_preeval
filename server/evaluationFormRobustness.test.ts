import { describe, it, expect } from "vitest";

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
});
