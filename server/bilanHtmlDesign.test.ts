import { describe, expect, it } from "vitest";
import { sanitizeBilanHtml, styleBilanHtml, toBilanHtml } from "../shared/bilanContent";

describe("HTML soigné collé dans le bilan", () => {
  const designed = `<div style="background:#faf5ff;padding:12px"><h1 style="color:#17375e">Votre analyse</h1>
<p style="text-align:justify"><b>Important</b> à lire <span style="color:#b91c1c;font-weight:700">en rouge</span> et <span style="background-color:#fef08a">surligné</span></p>
<blockquote style="border-left:4px solid #16a34a;background:#ecfdf5">Point fort : cinq ans d'expérience</blockquote>
<blockquote style="border-left:4px solid #dc2626">Alerte : passeport à renouveler</blockquote>
<blockquote style="border-left:4px solid #d97706;background:#fffbeb">À préciser : niveau de langue</blockquote>
<blockquote style="border-left:4px solid #2563eb">Information utile</blockquote>
<blockquote style="border-left:4px solid #999999">Simple citation</blockquote>
<table style="width:100%"><tr><th style="text-align:center">Critère</th></tr><tr><td style="text-align:right">8 / 15</td></tr></table></div>`;

  it("conserve la structure, l'alignement, le gras, la couleur du texte, le surlignage et les tableaux", () => {
    const out = sanitizeBilanHtml(designed);
    expect(out).toContain("<h2>Votre analyse</h2>");
    expect(out).toContain('<p data-a="justify"><strong>Important</strong>');
    expect(out).toMatch(/<span data-c="red" data-b="1">en rouge<\/span>/);
    expect(out).toContain('<span data-h="yellow">surligné</span>');
    expect(out).toContain('<th data-a="center">Critère</th>');
    expect(out).toContain('<td data-a="right">8 / 15</td>');
  });

  it("reconnaît les encadrés d'après la couleur de la bordure : vert, rouge, ocre, bleu ; une citation grise reste simple", () => {
    const out = sanitizeBilanHtml(designed);
    expect(out).toContain('<blockquote data-v="success">Point fort');
    expect(out).toContain('<blockquote data-v="danger">Alerte');
    expect(out).toContain('<blockquote data-v="warning">À préciser');
    expect(out).toContain('<blockquote data-v="info">Information utile');
    expect(out).toContain("<blockquote>Simple citation");
    expect(sanitizeBilanHtml('<blockquote data-v="success">Déjà choisi</blockquote>')).toContain('data-v="success"');
    expect(sanitizeBilanHtml('<blockquote style="background:#ecfdf5">Fond seul</blockquote>')).toContain('data-v="success"');
  });

  it("le rendu final habille ces encadrés (styles en ligne pour les messageries) et ne laisse passer ni script, ni image, ni style arbitraire", () => {
    const html = styleBilanHtml(toBilanHtml(designed + '<img src="x.png" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)" style="position:fixed">piège</a>'));
    expect(html).toMatch(/<blockquote[^>]*border-left:4px solid #15803d/);
    expect(html).not.toMatch(/<script|<img|javascript:|onerror|position:fixed/i);
    expect(html).not.toContain("#faf5ff");
  });
});
