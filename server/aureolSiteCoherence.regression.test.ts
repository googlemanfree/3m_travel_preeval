import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUREOL_CANONICAL_OFFICES_ANSWER,
  AUREOL_FORBIDDEN_CLAIMS,
  AUREOL_OFFICE_FACTS,
  buildAureolSystemPrompt,
  matchesOfficeCanadaQuestion,
  tryCanonicalAureolAnswer,
} from "../shared/aureolSiteKnowledge";
import { COMPANY_PROFILE } from "../client/src/lib/companyContacts";
import { SYSTEM_PROMPT } from "./routers/aiCopilot";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers/aiCopilot.ts"), "utf8");

describe("Aureol — cohérence avec le contenu du site", () => {
  it("aligne les faits bureaux sur COMPANY_PROFILE (Contact / Footer)", () => {
    expect(AUREOL_OFFICE_FACTS.yaounde.whatsapp).toBe(COMPANY_PROFILE.offices.cameroon.whatsappDisplay);
    expect(AUREOL_OFFICE_FACTS.ottawa.whatsapp).toBe(COMPANY_PROFILE.offices.ottawa.whatsappDisplay);
    expect(AUREOL_OFFICE_FACTS.email).toBe(COMPANY_PROFILE.publicEmail);
    expect(AUREOL_OFFICE_FACTS.yaounde.address).toMatch(/Biyem-Assi/i);
    expect(AUREOL_OFFICE_FACTS.ottawa.address).toMatch(/Ottawa/i);
  });

  it("le prompt système affirme Yaoundé ET Ottawa et interdit l’unique-agence", () => {
    const prompt = buildAureolSystemPrompt();
    expect(prompt).toBe(SYSTEM_PROMPT);
    expect(prompt).toMatch(/Ottawa/);
    expect(prompt).toMatch(/Yaoundé/);
    expect(prompt).toMatch(/PAS une seule agence/i);
    expect(prompt).toContain(AUREOL_OFFICE_FACTS.ottawa.whatsapp);
    for (const claim of AUREOL_FORBIDDEN_CLAIMS) {
      expect(prompt.toLowerCase()).not.toContain(`nous n'avons pas de bureau`);
      expect(claim.length).toBeGreaterThan(3);
    }
    expect(prompt).toMatch(/Ne dis JAMAIS que.*n'a pas de bureau au Canada/i);
  });

  it("répond de façon canonique à la question du screenshot (bureau Canada)", () => {
    const q = "vous n'avez pas de bureau au canada ?";
    expect(matchesOfficeCanadaQuestion(q)).toBe(true);
    const answer = tryCanonicalAureolAnswer(q);
    expect(answer).toBe(AUREOL_CANONICAL_OFFICES_ANSWER);
    expect(answer).toMatch(/Ottawa/i);
    expect(answer).toMatch(/Yaoundé/i);
    expect(answer?.toLowerCase()).not.toMatch(/unique agence|pas de bureau physique au canada|n'avons pas de bureau/);
  });

  it("détecte d’autres formulations bureau / Ottawa", () => {
    expect(matchesOfficeCanadaQuestion("Avez-vous un bureau à Ottawa ?")).toBe(true);
    expect(matchesOfficeCanadaQuestion("Où est votre agence au Canada ?")).toBe(true);
    expect(matchesOfficeCanadaQuestion("Quel est le contact WhatsApp Ottawa ?")).toBe(true);
    expect(matchesOfficeCanadaQuestion("Comment obtenir un visa Schengen ?")).toBe(false);
  });

  it("le routeur court-circuite le LLM pour les faits bureaux", () => {
    expect(routerSource).toContain("tryCanonicalAureolAnswer");
    expect(routerSource).toContain("copilot_canonical");
    expect(routerSource).toContain("FAITS BUREAUX (PRIORITAIRES SUR LE RAG)");
    expect(routerSource).toContain("buildAureolSystemPrompt");
    expect(routerSource).not.toMatch(/basée à Yaoundé, Cameroun\.\s*\n\s*\nNe mentionne jamais/);
  });
});
