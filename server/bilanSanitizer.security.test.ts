import { describe, expect, it } from "vitest";
import { sanitizeBilanHtml, toBilanHtml } from "../shared/bilanContent";

// Une fois les balises que le nettoyeur écrit lui-même retirées, il ne doit plus rester aucun « < » : tout le reste est du texte échappé.
const CANONICAL = /<\/?(?:p|strong|em|u|del|sup|sub|ul|ol|li|h2|h3|h4|blockquote|table|thead|tbody|tfoot|tr)>|<(?:br|hr)>|<a(?: href="[^"<>]*" target="_blank" rel="noopener noreferrer")?>|<\/a>|<t[dh](?: colspan="\d{1,2}")?(?: rowspan="\d{1,2}")?>|<\/t[dh]>/g;
const strayLt = (html: string) => html.replace(CANONICAL, "").includes("<");

const PAYLOADS = [
  "<a onmouseover=alert(1) <b>x</b>",
  "<p onclick=alert(1)",
  "<a href=x onfocus=alert(1) autofocus <em>",
  "<scr<script>ipt>alert(1)</scr</script>ipt>",
  "<img src=x onerror=alert(1)>",
  "<svg/onload=alert(1)>",
  "<a href=\"javascript:alert(1)\">clic</a>",
  "<a href=\"&#106;avascript:alert(1)\">clic</a>",
  "<a href=' javascript:alert(1)'>clic</a>",
  "<p<p onclick=alert(1)>",
  "<table colspan=\"1\" onclick=alert(1)><td colspan=\"2\" style=\"x\" onclick=alert(1)>c</td></table>",
  "<<p>p onclick=alert(1)>",
  "<p\nonclick=alert(1)\n<strong>",
  "<math><mi//xlink:href=\"data:x,<script>alert(1)</script>\">",
  "<iframe srcdoc=\"<script>alert(1)</script>\"></iframe>",
  "<a href=\"https://exemple.com/\" onclick=\"alert(1)\" target=\"_self\">ok</a>",
  "texte <  p >juste</ p> et <a",
];

describe("nettoyeur de bilan : aucune attaque HTML ne survit", () => {
  for (const payload of PAYLOADS) {
    it(`neutralise ${JSON.stringify(payload).slice(0, 60)}`, () => {
      for (const out of [sanitizeBilanHtml(payload), toBilanHtml(payload)]) {
        expect(strayLt(out)).toBe(false);
        // « onclick=… » écrit en texte échappé (&lt;…) est inoffensif ; seul compte ce qui se trouve dans une vraie balise.
        for (const tag of out.match(/<[^>]*>/g) ?? []) expect(tag).not.toMatch(/\son[a-z]+\s*=|style\s*=|javascript:/i);
        expect(out).not.toMatch(/href="\s*javascript:/i);
        expect(out).not.toMatch(/<(?:script|img|svg|iframe|math)/i);
      }
    });
  }

  it("garde un lien https légitime, sans attribut superflu", () => {
    expect(sanitizeBilanHtml('<a href="https://exemple.com/a?b=1" onclick="x()" target="_self">ok</a>')).toBe('<a href="https://exemple.com/a?b=1" target="_blank" rel="noopener noreferrer">ok</a>');
  });

  it("est idempotent : re-nettoyer un résultat déjà nettoyé ne change rien", () => {
    for (const payload of PAYLOADS) {
      const once = sanitizeBilanHtml(payload);
      expect(sanitizeBilanHtml(once)).toBe(once);
    }
  });
});
