import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
const indexHtml = read("client/index.html");
const publicFile = (name: string) => resolve(root, "client/public", name);

/** Dimensions d'un PNG lues dans l'en-tête IHDR (aucune dépendance d'image). */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("hex"), path).toBe("89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("performance : ce que la page d'accueil télécharge au démarrage", () => {
  const HEAVY = ["jspdf", "jspdf-autotable", "html2canvas", "html2pdf.js", "react-pdf", "pdfjs-dist", "recharts", "@tensorflow/tfjs"];
  const SRC = resolve(root, "client/src");
  const importPattern = /^\s*import\s+(?!type\b)(?:[^'";]*?\sfrom\s+)?["']([^"']+)["']/gm;
  const exportFromPattern = /^\s*export\s+(?!type\b)[^'";]*?\sfrom\s+["']([^"']+)["']/gm;

  function resolveLocal(from: string, spec: string): string | null {
    let base: string;
    if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
    else if (spec.startsWith("@shared/")) base = join(root, "shared", spec.slice(8));
    else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
    else return null;
    for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const candidate = base + suffix;
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
  }

  /** Imports STATIQUES depuis main.tsx (les `import()` dynamiques ne comptent pas : ils se chargent à la demande). */
  function heavyStaticImports(): string[] {
    const entry = join(SRC, "main.tsx");
    const seen = new Set<string>([entry]);
    const queue = [entry];
    const found: string[] = [];
    while (queue.length) {
      const file = queue.shift() as string;
      const source = readFileSync(file, "utf8");
      const specs: string[] = [];
      for (const pattern of [importPattern, exportFromPattern]) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(source))) specs.push(match[1]);
      }
      for (const spec of specs) {
        const local = resolveLocal(file, spec);
        if (local) {
          if (!seen.has(local)) {
            seen.add(local);
            queue.push(local);
          }
        } else if (HEAVY.some((name) => spec === name || spec.startsWith(`${name}/`))) {
          found.push(`${spec} <- ${file.replace(SRC, "")}`);
        }
      }
    }
    return found;
  }

  it("aucune bibliothèque PDF, de graphiques ou de vision n'est importée au démarrage", () => {
    expect(heavyStaticImports()).toEqual([]);
  });

  it("l'utilitaire de préchargement de Vite n'est pas rangé dans un morceau lourd (sinon 1,5 Mo de PDF au démarrage)", () => {
    const config = read("vite.config.ts");
    expect(config).toContain('id.includes("vite/preload-helper")');
    expect(config.indexOf('id.includes("vite/preload-helper")')).toBeLessThan(config.indexOf('id.includes("node_modules")'));
  });

  it("le hero n'a plus d'animation infinie, et le logo d'interface est une image légère", () => {
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    expect(hero).not.toContain("repeat: Infinity");
    expect(hero).not.toContain("animate-pulse");
    expect(hero).toContain('logoUrl = "/logo-3m.webp"');
    expect(statSync(publicFile("logo-3m.webp")).size).toBeLessThan(40 * 1024);
    for (const file of ["client/src/components/Navbar.tsx", "client/src/components/Footer.tsx", "client/src/pages/Home.tsx"]) {
      expect(read(file), file).not.toContain("pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg");
    }
  });
});

describe("mobile : zoom, polices et icônes", () => {
  it("n'interdit pas le zoom (accessibilité) et adapte l'affichage aux écrans à encoche", () => {
    const viewport = indexHtml.match(/<meta name="viewport" content="([^"]*)"/)?.[1] ?? "";
    expect(viewport).toContain("width=device-width");
    expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/);
    expect(viewport).toContain("viewport-fit=cover");
  });

  it("charge la police sans bloquer l'affichage", () => {
    const withoutNoscript = indexHtml.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
    expect(withoutNoscript).not.toMatch(/<link[^>]+fonts\.googleapis\.com[^>]+rel="stylesheet"/);
    expect(indexHtml).toContain('rel="preload" as="style"');
    expect(indexHtml).toContain("display=swap");
  });

  it("déclare des icônes complètes qui existent réellement", () => {
    for (const link of ['href="/favicon.ico"', 'href="/favicon-32x32.png"', 'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"']) expect(indexHtml, link).toContain(link);
    expect(pngSize(publicFile("apple-touch-icon.png"))).toEqual({ width: 180, height: 180 });
    expect(pngSize(publicFile("icon-192.png"))).toEqual({ width: 192, height: 192 });
    expect(pngSize(publicFile("icon-512.png"))).toEqual({ width: 512, height: 512 });
    expect(pngSize(publicFile("icon-maskable-512.png"))).toEqual({ width: 512, height: 512 });
    expect(pngSize(publicFile("favicon-32x32.png"))).toEqual({ width: 32, height: 32 });
    expect(readFileSync(publicFile("favicon.ico")).subarray(0, 4).toString("hex")).toBe("00000100"); // en-tête ICO
  });

  it("le manifeste ne référence que des fichiers présents, avec les icônes 192, 512 et maskable", () => {
    const manifest = JSON.parse(read("client/public/manifest.json")) as { icons: Array<{ src: string; sizes: string; purpose?: string }>; lang: string };
    expect(manifest.lang).toBe("fr");
    for (const icon of manifest.icons) expect(existsSync(publicFile(icon.src.replace(/^\//, ""))), icon.src).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any")).toBe(true);
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  });
});

describe("référencement de la page d'accueil et des pages de service", () => {
  const template = indexHtml;
  const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const meta = (html: string) => ({
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
    description: decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""),
  });

  it("les pages ajoutées ou reprises aujourd'hui respectent 60 caractères de titre et 160 de description", () => {
    for (const path of ["/services", "/billets", "/cni-passeport"]) {
      const { title, description } = meta(composePublicPrerender(template, path).html);
      expect(title.length, `${path} : ${title}`).toBeLessThanOrEqual(60);
      expect(description.length, `${path} : ${description}`).toBeGreaterThanOrEqual(70);
      expect(description.length, `${path} : ${description}`).toBeLessThanOrEqual(160);
    }
  });

  it("le logo des données structurées est l'icône du site, pas l'image de partage qui change à chaque page", () => {
    const html = composePublicPrerender(template, "/").html;
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
    const graph = (JSON.parse(jsonLd) as { "@graph": Array<Record<string, any>> })["@graph"];
    const organization = graph.find((node) => node["@type"] === "Organization");
    const website = graph.find((node) => node["@type"] === "WebSite");
    expect(organization?.logo?.url).toBe("https://www.3mtravelagency.com/icon-512.png");
    expect(organization?.name).toBe("3M Travel & Services");
    expect(website?.name).toBe("3M Travel & Services");
    expect(JSON.stringify(graph)).not.toContain("/api/og");
  });

  it("l'accueil déclare canonical, cartes sociales et une image de partage", () => {
    const html = composePublicPrerender(template, "/").html;
    expect(html).toContain('<link rel="canonical" href="https://www.3mtravelagency.com/" />');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:image"');
    expect(html).toContain('<meta name="twitter:card"');
  });
});
