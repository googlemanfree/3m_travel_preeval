import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { studyDestinationArticles } from "../client/src/data/studyDestinationArticles";
import { composePublicPrerender, getIndexablePublicPaths, PUBLIC_PAGES } from "./publicPrerender";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");
const shell = '<!doctype html><html lang="fr"><head><title>x</title></head><body><!--prerender-app--></body></html>';
const titleOf = (path: string) => (composePublicPrerender(shell, path).html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? "";

// Extrait la balise ouvrante complète (accolades JSX et guillemets compris) d'un champ de formulaire.
function fieldTags(source: string) {
  const tags: { line: number; tag: string }[] = [];
  const open = /<(input|select|textarea|Input)\b/g;
  let match: RegExpExecArray | null;
  while ((match = open.exec(source))) {
    let depth = 0;
    let quote: string | null = null;
    let end = source.length;
    for (let i = match.index; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === quote && source[i - 1] !== "\\") quote = null;
      } else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0 && source[i - 1] !== "=") {
        end = i + 1;
        break;
      }
    }
    tags.push({ line: source.slice(0, match.index).split("\n").length, tag: source.slice(match.index, end) });
  }
  return tags;
}

describe("audit du site du 2026-10-11 : titres, h1, étiquettes, alias", () => {
  it("chaque champ des pages publiques a un nom accessible (aria-label, aria-labelledby ou id)", () => {
    const files = [
      "client/src/pages/Contact.tsx",
      "client/src/pages/Flights.tsx",
      "client/src/components/FlightQuoteRequest.tsx",
      "client/src/pages/ProceduresAdvanced.tsx",
      "client/src/pages/EvisasAdvanced.tsx",
      "client/src/pages/EmployerPortal.tsx",
    ];
    const unnamed: string[] = [];
    for (const file of files) {
      for (const { line, tag } of fieldTags(read(file))) {
        const type = (tag.match(/\btype=["{']+([a-z]+)/) || [])[1];
        if (["hidden", "checkbox", "radio", "submit", "button", "file"].includes(type)) continue;
        if (!/\baria-label(ledby)?=|\bid=|\{\.\.\./.test(tag)) unnamed.push(`${file}:${line} ${tag.replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }
    expect(unnamed).toEqual([]);
  });

  it("/avis n'a qu'un seul h1 : le formulaire intégré utilise un h2", () => {
    expect(read("client/src/pages/Avis.tsx").match(/<h1[\s>]/g)).toHaveLength(1);
    const submit = read("client/src/pages/SubmitReview.tsx");
    expect(submit).toContain('const Heading = embedded ? "h2" : "h1";');
    expect(submit).not.toMatch(/<h1[\s>]/);
  });

  it("/employeurs : l'écran de connexion affiche un h1", () => {
    expect(read("client/src/pages/EmployerPortal.tsx")).toMatch(/<h1 className="flex items-center gap-2 font-semibold leading-none text-\[#071b3d\]">/);
  });

  it("aucun titre prérendu ne répète la marque, et les articles études tiennent en 70 caractères", () => {
    for (const [path, page] of Object.entries(PUBLIC_PAGES)) {
      const brand = (page.title.match(/3M TRAVEL AGENCY/g) || []).length;
      expect(brand, `${path} : ${page.title}`).toBeLessThanOrEqual(1);
    }
    for (const article of studyDestinationArticles) {
      const title = titleOf(`/blog/etudes/${article.slug}`).replace(/&amp;/g, "&");
      expect(title, article.slug).toMatch(/ \| 3M TRAVEL AGENCY$/);
      expect((title.match(/3M TRAVEL AGENCY/g) || []).length, title).toBe(1);
      expect(title.length, title).toBeLessThanOrEqual(70);
    }
  });

  it("le titre prérendu est celui que la page affiche (Google lit le prérendu)", () => {
    expect(PUBLIC_PAGES["/tarifs"].title).toBe("Tarifs et honoraires | 3M TRAVEL AGENCY");
    expect(read("client/src/pages/Tarifs.tsx")).toContain('title: "Tarifs et honoraires | 3M TRAVEL AGENCY"');
    expect(PUBLIC_PAGES["/etudes"].title).toBe("Visa études à l’international | 3M TRAVEL AGENCY");
    expect(PUBLIC_PAGES["/evisa"].title).toBe("Annuaire e-Visa | 3M TRAVEL AGENCY");
    expect(PUBLIC_PAGES["/how-it-works"].title).toBe("Comment ça marche : les étapes | 3M TRAVEL AGENCY");
    expect(read("client/src/pages/HowItWorks.tsx")).toContain('title: "Comment ça marche : les étapes | 3M TRAVEL AGENCY"');
  });

  it("deux pages indexables n'ont jamais le même titre", () => {
    const seen = new Map<string, string>();
    for (const [path, page] of Object.entries(PUBLIC_PAGES)) {
      if (page.noindex) continue;
      const previous = seen.get(page.title);
      expect(previous, `${path} et ${previous} partagent « ${page.title} »`).toBeUndefined();
      seen.set(page.title, path);
    }
  });

  it("/visa-etudes et /hotels restent des coquilles de redirection cliente, mais ne sont plus indexables ni dans le sitemap", () => {
    expect(PUBLIC_PAGES["/visa-etudes"].noindex).toBe(true);
    expect(PUBLIC_PAGES["/hotels"].noindex).toBe(true);
    expect(getIndexablePublicPaths()).not.toContain("/visa-etudes");
    expect(getIndexablePublicPaths()).not.toContain("/hotels");
    expect(titleOf("/visa-etudes")).not.toBe(titleOf("/etudes"));
  });

  it("la page « Comment ça marche » est en français correctement accentué", () => {
    const source = read("client/src/pages/HowItWorks.tsx");
    for (const wrong of ["Comment ca marche", "securise", "Evaluation approfondie", "eligibilite", "Depot de vos", "Questions frequemment", "succes", "Reseau de partenaires"]) {
      expect(source, wrong).not.toContain(wrong);
    }
    expect(source).toContain("Comment ça marche ?");
    expect(source).toContain("Réseau de partenaires");
  });
});
