import { describe, expect, it } from "vitest";
import { convertLanguageScores, getLanguageLevel, type LanguageScores } from "../shared/languageTests";

const scores: LanguageScores = { reading: "", writing: "", listening: "", speaking: "" };

describe("conversions des tests de langue IRCC", () => {
  it("convertit séparément les quatre notes IELTS General Training", () => {
    expect(convertLanguageScores("ielts_general", { reading: "7.0", writing: "7.0", listening: "8.0", speaking: "7.0" })).toEqual({ reading: 9, writing: 9, listening: 9, speaking: 9 });
    expect(convertLanguageScores("ielts_general", { reading: "6.5", writing: "6.0", listening: "7.5", speaking: "6.0" })).toEqual({ reading: 8, writing: 7, listening: 8, speaking: 7 });
  });

  it("convertit CELPIP, PTE Core, TEF et TCF avec leurs échelles propres", () => {
    expect(convertLanguageScores("celpip_general", { reading: "9", writing: "8", listening: "7", speaking: "10" })).toEqual({ reading: 9, writing: 8, listening: 7, speaking: 10 });
    expect(convertLanguageScores("pte_core", { reading: "78", writing: "79", listening: "82", speaking: "84" })).toEqual({ reading: 9, writing: 8, listening: 9, speaking: 9 });
    expect(convertLanguageScores("tef_canada", { reading: "248", writing: "310", listening: "298", speaking: "371" })).toEqual({ reading: 9, writing: 7, listening: 9, speaking: 9 });
    expect(convertLanguageScores("tcf_canada", { reading: "524", writing: "10", listening: "503", speaking: "14" })).toEqual({ reading: 9, writing: 7, listening: 8, speaking: 9 });
  });

  it("retourne 0 pour une note vide, invalide ou hors tableau", () => {
    expect(getLanguageLevel("ielts_general", "reading", "")).toBe(0);
    expect(getLanguageLevel("ielts_general", "reading", "abc")).toBe(0);
    expect(getLanguageLevel("ielts_general", "reading", "2.0")).toBe(0);
    expect(scores.reading).toBe("");
  });
});
