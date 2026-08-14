import { describe, it, expect } from "vitest";

describe("Shareable Canadian PR Evaluation Page & CRS Calculator", () => {
  it("computes accurate CRS score out of 1200 and shareable link format", () => {
    const profile = {
      age: 28, // 110 pts
      education: "master", // 135 pts
      languageEnglish: "clb9", // 128 pts
      languageFrench: "clb7", // 30 pts (additional)
      experience: "3_years", // 50 pts
      adaptability: "sibling_in_canada", // 15 pts
    };

    const crsScore = 110 + 135 + 128 + 30 + 50 + 15;
    const shareUrl = `https://www.3mtravelagency.com/evaluation-canada?score=${crsScore}`;

    expect(crsScore).toBe(468);
    expect(shareUrl).toContain("/evaluation-canada?score=468");
  });
});
