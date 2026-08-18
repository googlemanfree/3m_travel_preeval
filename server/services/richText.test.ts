import { describe, expect, it } from "vitest";
import { richTextToPlainText, sanitizeRichTextHtml } from "./richText";

describe("richText", () => {
  it("conserve seulement les balises de mise en forme autorisées", () => {
    const safe = sanitizeRichTextHtml('<p><strong>Bonjour</strong> <script>alert(1)</script><a href="https://example.com" onclick="x()">Portail</a></p>');
    expect(safe).toContain("<strong>Bonjour</strong>");
    expect(safe).toContain('href="https://example.com"');
    expect(safe).not.toContain("script");
    expect(safe).not.toContain("onclick");
  });

  it("retire les destinations de lien non sûres", () => {
    const safe = sanitizeRichTextHtml('<p><a href="javascript:alert(1)">Lien</a></p>');
    expect(safe).toContain("<a>" );
    expect(safe).not.toContain("javascript:");
  });

  it("produit une version texte compatible avec notifications et historique", () => {
    expect(richTextToPlainText("<p>Bonjour <strong>candidat</strong></p><ul><li>Document</li></ul>")).toContain("Bonjour candidat");
  });
});
