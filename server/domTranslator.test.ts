// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { normalizeKey, startDomTranslator, translateDates, translateString } from "../client/src/i18n/domTranslator";

const dictionary = new Map<string, string>([
  ["Évaluer mon projet — gratuit", "Assess my project — free"],
  ["Votre projet international commence ici.", "Your international project starts here."],
  ["Vérifié le {date}", "Verified on {date}"],
  ["Rechercher un pays", "Search for a country"],
  ["3M TRAVEL AGENCY", "3M TRAVEL AGENCY"],
  ["Autres procédures pour {c}", "Other procedures for {c}"],
  ["La durée indiquée est «{q}».", "The stated length is “{q}”."],
]);
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));
let stop: (() => void) | null = null;
afterEach(() => { stop?.(); stop = null; document.body.innerHTML = ""; });

describe("traduction du texte visible par dictionnaire", () => {
  it("normalise les espaces comme à l'extraction du dictionnaire", () => {
    expect(normalizeKey("  Votre   projet\n international commence ici. ")).toBe("Votre projet international commence ici.");
  });

  it("traduit les dates en toutes lettres, y compris le 1er du mois", () => {
    expect(translateDates("Vérifié le 27 octobre 2026")).toBe("Vérifié le October 27, 2026");
    expect(translateDates("1er décembre 2026")).toBe("December 1, 2026");
    expect(translateString("Vérifié le 27 octobre 2026", dictionary)).toBe("Verified on October 27, 2026");
    expect(translateString("Texte inconnu du dictionnaire", dictionary)).toBeNull();
  });

  it("traduit les phrases-modèles : nom de pays ({c}) et valeur entre guillemets français ({q})", () => {
    expect(translateString("Autres procédures pour Allemagne", dictionary)).toBe("Other procedures for Germany");
    expect(translateString("Autres procédures pour Pays-Bas", dictionary)).toBe("Other procedures for Netherlands");
    expect(translateString("Autres procédures pour Rép. Tchèque", dictionary)).toBe("Other procedures for Czech Republic");
    expect(translateString("Autres procédures pour États-Unis", dictionary)).toBe("Other procedures for United States");
    expect(translateString("La durée indiquée est « 30 jours ».", dictionary)).toBe("The stated length is “30 days”.");
    expect(translateString("La durée indiquée est « 6 mois ».", dictionary)).toBe("The stated length is “6 months”.");
    expect(translateString("Autres procédures pour Atlantide", dictionary)).toBeNull();
  });

  it("remplace les textes connus en gardant les espaces autour, laisse intacts les textes inconnus et les noms propres", () => {
    document.body.innerHTML = `<main><h1>  Évaluer mon projet — gratuit </h1><p>Un texte absent du dictionnaire.</p><span>3M TRAVEL AGENCY</span></main>`;
    stop = startDomTranslator({ dictionary });
    expect(document.querySelector("h1")?.textContent).toBe("  Assess my project — free ");
    expect(document.querySelector("p")?.textContent).toBe("Un texte absent du dictionnaire.");
    expect(document.querySelector("span")?.textContent).toBe("3M TRAVEL AGENCY");
  });

  it("traduit les attributs visibles (placeholder, aria-label, title, alt)", () => {
    document.body.innerHTML = `<input placeholder="Rechercher un pays" /><button aria-label="Rechercher un pays" title="Évaluer mon projet — gratuit">x</button>`;
    stop = startDomTranslator({ dictionary });
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("Search for a country");
    expect(document.querySelector("button")?.getAttribute("aria-label")).toBe("Search for a country");
    expect(document.querySelector("button")?.getAttribute("title")).toBe("Assess my project — free");
  });

  it("n'altère ni les champs de saisie, ni le code, ni les zones marquées data-no-translate", () => {
    document.body.innerHTML = `<textarea>Évaluer mon projet — gratuit</textarea><code>Évaluer mon projet — gratuit</code><div data-no-translate><p>Évaluer mon projet — gratuit</p></div>`;
    stop = startDomTranslator({ dictionary });
    expect(document.querySelector("textarea")?.textContent).toBe("Évaluer mon projet — gratuit");
    expect(document.querySelector("code")?.textContent).toBe("Évaluer mon projet — gratuit");
    expect(document.querySelector("div p")?.textContent).toBe("Évaluer mon projet — gratuit");
  });

  it("traduit aussi le contenu qui arrive plus tard (routes chargées à la demande, données reçues)", async () => {
    stop = startDomTranslator({ dictionary });
    const late = document.createElement("section");
    late.innerHTML = `<h2>Votre projet international commence ici.</h2>`;
    document.body.appendChild(late);
    await settle();
    expect(late.querySelector("h2")?.textContent).toBe("Your international project starts here.");
  });

  it("retraduit un nœud que l'application réécrit, et restitue le français quand on arrête", async () => {
    document.body.innerHTML = `<p>Évaluer mon projet — gratuit</p>`;
    stop = startDomTranslator({ dictionary });
    const node = document.querySelector("p")!.firstChild as Text;
    expect(node.nodeValue).toBe("Assess my project — free");
    node.nodeValue = "Votre projet international commence ici."; // l'application écrit un nouveau texte français
    await settle();
    expect(node.nodeValue).toBe("Your international project starts here.");
    stop();
    stop = null;
    expect(node.nodeValue).toBe("Votre projet international commence ici.");
  });

  it("restitue aussi les attributs d'origine à l'arrêt", () => {
    document.body.innerHTML = `<input placeholder="Rechercher un pays" />`;
    stop = startDomTranslator({ dictionary });
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("Search for a country");
    stop(); stop = null;
    expect(document.querySelector("input")?.getAttribute("placeholder")).toBe("Rechercher un pays");
  });
});
