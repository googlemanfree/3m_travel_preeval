import { describe, expect, it } from "vitest";
import { bilanPlainText, inspectBilan, isHtmlLike, renderBilanFragment, renderBilanStandalone, sanitizeBilanHtml, styleBilanHtml, textToBilanHtml, toBilanHtml } from "../shared/bilanContent";

const WORD_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><style>p.MsoNormal{mso-style-parent:""}</style><title>x</title></head><body lang=FR style='tab-interval:35.4pt'>
<!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]-->
<h1 style="color:red">Bilan d’évaluation</h1>
<p class=MsoNormal><b>Profil</b><o:p></o:p> solide <span style="font-size:12pt">et cohérent</span></p>
<div><ul><li>Atout 1</li><li>Atout <i>2</i></li></ul></div>
<table border=1><thead><tr><th>Critère</th><th>Note</th></tr></thead><tbody><tr><td colspan="2">Langues</td></tr></tbody></table>
<img src="https://tracker.example/pixel.gif"><script>alert(1)</script>
<p><a href="javascript:alert(1)" onclick="x()">piège</a> <a href="https://www.3mtravelagency.com/mon-espace" style="x">lien</a></p>
</body></html>`;

describe("bilan collé : HTML quelconque", () => {
  const clean = sanitizeBilanHtml(WORD_HTML);

  it("garde la structure (titres, listes, tableaux) et supprime tout ce qui est dangereux ou parasite", () => {
    expect(clean).toContain("<h2>Bilan d’évaluation</h2>");
    expect(clean).toContain("<strong>Profil</strong>");
    expect(clean).toContain("<ul><li>Atout 1</li><li>Atout <em>2</em></li></ul>");
    expect(clean).toContain("<thead>");
    expect(clean).toContain('colspan="2"');
    for (const forbidden of ["<script", "alert(1)", "<img", "onclick", "style=", "class=", "javascript:", "mso-", "<o:p", "<!--", "<html", "<head", "<style", "tracker.example"]) expect(clean, forbidden).not.toContain(forbidden);
    expect(clean).toContain('<a href="https://www.3mtravelagency.com/mon-espace" target="_blank" rel="noopener noreferrer">lien</a>');
    expect(clean).toContain("<a>piège</a>");
  });

  it("n'a aucune limite artificielle de longueur et reste stable si on le repasse", () => {
    const long = Array.from({ length: 400 }, (_, i) => `<p>Paragraphe ${i} — contenu du bilan assez long pour dépasser largement huit mille caractères.</p>`).join("");
    const html = toBilanHtml(long);
    expect(html.length).toBeGreaterThan(30_000);
    expect(toBilanHtml(html)).toBe(html);
    expect(toBilanHtml(clean)).toBe(clean);
  });

  it("un texte sans balise de bloc est enveloppé dans un paragraphe", () => {
    expect(toBilanHtml("<b>Bonjour</b> tout le monde")).toBe("<p><strong>Bonjour</strong> tout le monde</p>");
    expect(toBilanHtml("   ")).toBe("");
  });

  it("un « < » dans le texte n'ouvre jamais de balise", () => {
    expect(sanitizeBilanHtml("<p>score &lt; 50 et a < b</p>")).toBe("<p>score &lt; 50 et a &lt; b</p>");
  });
});

describe("bilan collé : texte, Markdown, listes", () => {
  const TEXT = `ÉVALUATION PROFESSIONNELLE — CANADA

Résumé du profil :
Candidate avec **six ans** d’expérience, voir https://www.canada.ca/fr

POINTS FORTS
✓ Expérience vérifiable
• Anglais courant
▸ Diplôme reconnu

PLAN D’ACTION
1. Passer un test de langue
2) Préparer les attestations

| Critère | Note |
|---|---|
| Langues | 12/15 |

───────────────────── ◆ ────────────────────────────

Note finale : à confirmer.`;
  const html = toBilanHtml(TEXT);

  it("reconnaît titres, listes, tableaux et gras", () => {
    expect(isHtmlLike(TEXT)).toBe(false);
    expect(html).toContain("<h2>ÉVALUATION PROFESSIONNELLE — CANADA</h2>");
    expect(html).toContain("<h3>Résumé du profil</h3>");
    expect(html).toContain("<strong>six ans</strong>");
    expect(html).toContain('<a href="https://www.canada.ca/fr"');
    expect(html).toContain("<ul><li>Expérience vérifiable</li><li>Anglais courant</li><li>Diplôme reconnu</li></ul>");
    expect(html).toContain("<ol><li>Passer un test de langue</li><li>Préparer les attestations</li></ol>");
    expect(html).toContain("<th>Critère</th>");
    expect(html).toContain("<td>12/15</td>");
    expect(html).not.toContain("◆");
  });

  it("le texte brut reste lisible (e-mail texte, contrôle, PDF)", () => {
    const text = bilanPlainText(html);
    expect(text).toContain("• Expérience vérifiable");
    expect(text).toContain("Langues | 12/15");
    expect(text).not.toContain("<");
  });
});

describe("contrôle et mise en forme", () => {
  it("signale les promesses et les données sensibles sans rien supprimer", () => {
    const report = inspectBilan(toBilanHtml("Votre visa garanti est acquis. Passeport n° AB1234567."));
    expect(report.forbiddenTerms.length).toBeGreaterThan(0);
    expect(report.sensitiveData).toContain("numéro de passeport");
    expect(inspectBilan(toBilanHtml("Profil solide, plusieurs pistes à explorer et à confirmer par les autorités.")).forbiddenTerms).toEqual([]);
    expect(inspectBilan("").empty).toBe(true);
  });

  it("les styles sont en ligne (seuls conservés par les messageries) et le document porte l'identité de l'agence", () => {
    const styled = styleBilanHtml("<h2>T</h2><p>x</p><table><tr><th>a</th></tr></table>");
    expect(styled).toMatch(/<h2 style="[^"]*#17375e/);
    expect(styled).toMatch(/<th style="[^"]*background:#17375e/);
    const fragment = renderBilanFragment({ html: "<p>x</p>", title: "Bilan d’évaluation — projet d’études", candidateName: "Awa <b>", reference: "3M-AGN-0001", destination: "Allemagne", score: 72 });
    expect(fragment).toContain("Bilan d’évaluation — projet d’études");
    expect(fragment).toContain("Awa &lt;b&gt;");
    expect(fragment).toContain("Indice de préparation : 72 / 100");
    expect(fragment).toContain("ne constitue pas");
    expect(renderBilanFragment({ html: "<p>x</p>", title: "T", candidateName: "A", score: 0 })).not.toContain("Indice de préparation");
    const page = renderBilanStandalone({ html: "<p>x</p>", title: "T", candidateName: "A" });
    expect(page).toContain("RC/YAO/2019/A/2567");
    expect(page).toContain("Accompagnement visa et mobilité internationale");
  });
});
