import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { bilanPlainText, extractBilanFraming, inspectBilan, renderBilanStandalone, sanitizeBilanHtml, styleBilanHtml, toBilanHtml } from "../shared/bilanContent";
import { cssColorToHighlightName, cssColorToTextName, cssFontSizeToName } from "../shared/bilanDesign";

const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8");

describe("modèle de bilan en texte (séparateurs, lignes à points, ✓ ▸ ①)", () => {
  const framing = extractBilanFraming(model);
  const html = toBilanHtml(model);

  it("retire l'objet de l'e-mail, le bloc de marque et le bloc de coordonnées : le papier à en-tête les fournit", () => {
    expect(framing.subject).toBe("Votre préévaluation professionnelle — 61/100 Luxembourg / France | Comptabilité & Finance");
    expect(framing.removedHeader).toBe(true);
    expect(framing.removedFooter).toBe(true);
    expect(html).not.toMatch(/3M TRAVEL &(?:amp;)? SERVICES|Direction de la Mobilité|hello@3mtravelagency/);
    expect(html).not.toMatch(/Objet\s*:/);
    expect(html).toContain("ÉVALUATION PROFESSIONNELLE INTERNATIONALE");
    expect(html).toContain("INFORMATION IMPORTANTE");
  });

  it("aucun trait décoratif ni ligne à points ne reste dans le texte", () => {
    const text = bilanPlainText(html);
    expect(text).not.toMatch(/[━═]{3,}|─{4,}|◆|\.{4,}/);
  });

  it("les lignes à points deviennent des tableaux de scores, avec la note globale en gras", () => {
    const tables = html.match(/<table data-d="plain">[\s\S]*?<\/table>/g) ?? [];
    expect(tables.length).toBe(3);
    const scores = tables.find((table) => table.includes("Formation et qualification")) ?? "";
    expect(scores).toContain('<td data-a="right"><strong>11 / 15</strong></td>');
    expect(scores).toContain("<strong>NOTE GLOBALE</strong>");
    expect(scores).toContain("<strong>61 / 100</strong>");
    expect(tables[0]).toContain("VOTRE SCORE");
    expect(tables[0]).toContain("MODÉRÉMENT FAVORABLE");
  });

  it("titres de section en h2, sous-titres en h3 ; ▸ IDENTITÉ et 01 — … sont des sous-titres", () => {
    expect(html).toMatch(/<h2>VOS ATOUTS CLÉS<\/h2>/);
    expect(html).toMatch(/<h2>POINTS À RENFORCER<\/h2>/);
    expect(html).toMatch(/<h3>POSTES À EXPLORER<\/h3>/);
    expect(html).toMatch(/<h3>IDENTITÉ<\/h3>/);
    expect(html).toMatch(/<h3>01 — CONFIRMER VOTRE DESTINATION PRIORITAIRE<\/h3>/);
    expect(html).toMatch(/<h3>CES FRAIS COMPRENNENT<\/h3>/);
    expect(html).not.toMatch(/<li>IDENTITÉ/);
  });

  it("✓, • et ① deviennent des listes ; les lignes de suite restent dans leur puce", () => {
    expect(html).toContain("<li>Environ quatre ans d’expérience comptable déclarée depuis septembre 2022.</li>");
    expect(html).toContain("<li>Ouvrir votre dossier et collecter vos pièces.</li>");
    expect((html.match(/<ol>/g) ?? []).length).toBeGreaterThanOrEqual(1);
  });

  it("le schéma à flèches reste un bloc centré", () => {
    const flow = html.match(/<p data-a="center">[\s\S]*?<\/p>/)?.[0] ?? "";
    expect(flow).toContain("Identification d’un employeur");
    expect(flow).toContain("↓");
    expect(flow).toContain("Demande d’autorisation de séjour");
  });

  it("le lien Markdown du modèle devient un vrai lien sûr", () => {
    expect(html).toContain('<a href="https://www.3mtravelagency.com/mon-espace" target="_blank" rel="noopener noreferrer">www.3mtravelagency.com/mon-espace</a>');
  });

  it("le montant à confirmer est signalé : le bilan ne doit pas partir avec une zone à compléter", () => {
    const inspection = inspectBilan(html);
    expect(inspection.placeholders).toEqual(["[À CONFIRMER]"]);
    expect(inspection.empty).toBe(false);
    expect(inspection.headings).toBeGreaterThan(10);
    expect(inspectBilan(html.replace("[À CONFIRMER]", "100 000")).placeholders).toEqual([]);
  });

  it("le modèle ne contient aucune promesse de résultat ni donnée sensible", () => {
    const inspection = inspectBilan(html);
    expect(inspection.forbiddenTerms).toEqual([]);
    expect(inspection.sensitiveData).toEqual([]);
  });

  it("s'affiche sur papier à en-tête avec les styles en ligne (messageries et impression)", () => {
    const page = renderBilanStandalone({ html, title: "Évaluation professionnelle", candidateName: "Prénom Nom" });
    expect(page).toContain("3M TRAVEL");
    expect(page).toMatch(/<h2 style="/);
    expect(page).toMatch(/<table data-d="plain" style="/);
  });
});

describe("mise en forme collée (Word, Google Docs, page web) : palette fermée, jamais de CSS brut", () => {
  it("couleur, surlignage, taille, gras, italique, souligné et barré sont reconnus et ramenés à des noms", () => {
    const html = sanitizeBilanHtml('<p style="text-align:center"><span style="color:#b91c1c;background-color:#fef08a;font-size:22px;font-weight:700;font-style:italic;text-decoration:underline line-through">Important</span></p>');
    expect(html).toBe('<p data-a="center"><span data-c="red" data-h="yellow" data-s="xl" data-b="1" data-i="1" data-u="1" data-x="1">Important</span></p>');
  });

  it("les balises <font>, <mark> et les alignements anciens sont reconnus", () => {
    expect(sanitizeBilanHtml('<font color="#15803d" size="5">Bien</font>')).toContain('<span data-c="green" data-s="lg">Bien</span>');
    expect(sanitizeBilanHtml("<mark>à noter</mark>")).toContain('<span data-h="yellow">à noter</span>');
    expect(sanitizeBilanHtml('<div align="right">à droite</div>')).toContain('<p data-a="right">à droite</p>');
  });

  it("les spans sans mise en forme disparaissent (contenu conservé) et les spans restent équilibrés", () => {
    expect(sanitizeBilanHtml('<p><span class="x"><span style="margin:3px">texte</span></span></p>')).toBe("<p>texte</p>");
    expect(sanitizeBilanHtml('<p><span style="color:red">a</span><span style="color:red">b</p>')).toBe('<p><span data-c="red">a</span><span data-c="red">b</span></p>');
  });

  it("noir, blanc et fond blanc ne créent aucune mise en forme (couleurs par défaut)", () => {
    expect(sanitizeBilanHtml('<p><span style="color:#000;background:#fff">texte</span></p>')).toBe("<p>texte</p>");
    expect(cssColorToTextName("rgb(0, 0, 0)")).toBeNull();
    expect(cssColorToTextName("#ffffff")).toBeNull();
    expect(cssColorToHighlightName("rgba(255,255,255,0)")).toBeNull();
    expect(cssFontSizeToName("14px")).toBeNull();
    expect(cssFontSizeToName("18pt")).toBe("xl");
  });

  it("aucun CSS, script, gestionnaire d'événement ni valeur libre ne passe par les attributs de palette", () => {
    const hostile = sanitizeBilanHtml('<p data-a="center;background:url(x)" style="color:red"><span data-c="red;x" data-h="constructor" data-s="__proto__" onclick="alert(1)" style="color:expression(alert(1));background:url(javascript:1)">x</span></p><blockquote data-v="evil"><a href="javascript:alert(1)">l</a></blockquote><table data-d="x"><tr><td data-a="<script>">c</td></tr></table>');
    expect(hostile).not.toMatch(/javascript:|onclick|expression|url\(|<script|constructor|__proto__|style=/i);
    expect(hostile).toContain("<span>".slice(0, 0) + "x");
  });

  it("styleBilanHtml convertit la palette en styles en ligne, encadrés et tableaux compris", () => {
    const styled = styleBilanHtml('<p data-a="center"><span data-c="red" data-h="yellow" data-s="lg" data-b="1">Alerte</span></p><blockquote data-v="warning"><p>Attention</p></blockquote><table data-d="soft"><tr><th>A</th></tr></table>');
    expect(styled).toContain("text-align:center");
    expect(styled).toContain("color:#b91c1c;background-color:#fef08a;padding:0 2px;border-radius:2px;font-size:17px;line-height:1.4;font-weight:700");
    expect(styled).toContain("background:#fffbeb;border-left:4px solid #d97706;color:#78350f");
    expect(styled).toContain("background:#eaf2fa;color:#17375e");
    expect(styled).not.toMatch(/background:#17375e/);
  });

  it("la mise en forme survit à un second nettoyage (aller-retour de l'éditeur)", () => {
    const once = sanitizeBilanHtml('<p style="text-align:center"><span style="color:#1d4ed8">Titre</span></p>');
    expect(sanitizeBilanHtml(styleBilanHtml(once))).toBe(once);
  });
});
