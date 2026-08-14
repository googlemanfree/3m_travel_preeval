import { describe, it, expect } from "vitest";

describe("Canada Evaluation WhatsApp Share", () => {
  it("constructs prefilled share text with score and evaluation link", () => {
    const score = 465;
    const shareUrl = "https://www.3mtravelagency.com/evaluation-canada";
    const message = `Bonjour ! J'ai évalué mon score d'immigration pour le Canada sur 3M Travel Agency et j'ai obtenu ${score} points. Découvrez votre score ici : ${shareUrl}`;

    expect(message).toContain("465 points");
    expect(message).toContain(shareUrl);
  });
});
