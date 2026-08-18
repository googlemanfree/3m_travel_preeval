import { describe, expect, it } from "vitest";
import { SHARED_BILINGUAL_TEMPLATES } from "./bilingualCommunicationTemplates";

describe("modèles de communication partagés bilingues", () => {
  it("propose les modèles français et anglais nécessaires aux messages et bilans", () => {
    expect(SHARED_BILINGUAL_TEMPLATES.filter((template) => template.language === "fr")).toHaveLength(3);
    expect(SHARED_BILINGUAL_TEMPLATES.filter((template) => template.language === "en")).toHaveLength(3);
    expect(SHARED_BILINGUAL_TEMPLATES.some((template) => template.scope === "evaluation_message" && template.language === "fr")).toBe(true);
    expect(SHARED_BILINGUAL_TEMPLATES.some((template) => template.scope === "evaluation_message" && template.language === "en")).toBe(true);
  });
});
