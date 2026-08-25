import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("microcopies publiques bilingues", () => {
  it("branche les pages et composants publics prioritaires sur le contexte de langue", () => {
    for (const file of [
      "client/src/pages/Accessibility.tsx",
      "client/src/pages/Login.tsx",
      "client/src/components/AureolQuestionField.tsx",
      "client/src/components/AureolAssistantChat.tsx",
      "client/src/components/FacebookQRCodeWidget.tsx",
    ]) {
      expect(read(file)).toContain("useLanguage");
    }
  });

  it("préserve les libellés FR/EN des aides, champs et actions publiques", () => {
    const login = read("client/src/pages/Login.tsx");
    const accessibility = read("client/src/pages/Accessibility.tsx");
    const aureol = read("client/src/components/AureolQuestionField.tsx");
    expect(login).toContain('t("Se connecter", "Sign in")');
    expect(login).toContain('t("Mot de passe oublié ?", "Forgot password?")');
    expect(accessibility).toContain('t("Accessibilité & confort", "Accessibility & comfort")');
    expect(aureol).toContain('t("Demander à Aureol", "Ask Aureol")');
  });

  it("évite une promesse automatique dans le guide conversationnel public", () => {
    const chat = read("client/src/components/AureolAssistantChat.tsx");
    expect(chat).not.toContain("Aureol AI");
    expect(chat).toContain("human review");
    expect(chat).toContain("validation humaine");
  });
});
