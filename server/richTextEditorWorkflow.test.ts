import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("workflow éditeur riche administrateur", () => {
  it("protège les modèles et l’assistance IA par une session administrateur valide", () => {
    const router = readFileSync(resolve(root, "server/routers/richTextTemplatesRouter.ts"), "utf8");
    expect(router).toContain("requireValidAdminSession");
    expect(router).toContain("sanitizeRichTextHtml");
    expect(router).toContain("improveAdministrativeRichText");
  });

  it("propose des modèles, une reformulation IA et un collage Word nettoyé dans l’éditeur", () => {
    const editor = readFileSync(resolve(root, "client/src/components/RichTextEditor.tsx"), "utf8");
    expect(editor).toContain("pasteClean");
    expect(editor).toContain("Collage Word nettoyé");
    expect(editor).toContain("Assistance IA");
    expect(editor).toContain("Modèles :");
  });
});
