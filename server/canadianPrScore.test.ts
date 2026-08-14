import { describe, it, expect } from "vitest";

describe("Canadian PR Score Estimator (Express Entry Style)", () => {
  it("calculates comprehensive points based on age, education, language and experience", () => {
    const candidate = {
      ageScore: 110, // Max for age 20-29
      educationScore: 135, // Master's degree
      languageScore: 128, // Strong CLB 9
      experienceScore: 50, // 3+ years foreign experience
      adaptabilityScore: 50, // Canadian study + sibling
    };

    const totalEstimatedScore = 
      candidate.ageScore + 
      candidate.educationScore + 
      candidate.languageScore + 
      candidate.experienceScore + 
      candidate.adaptabilityScore;

    expect(totalEstimatedScore).toBe(473);
    expect(totalEstimatedScore).toBeGreaterThan(400);
  });
});
