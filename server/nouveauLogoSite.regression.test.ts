import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const publicFile = (name: string) => resolve(root, "client/public", name);
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/** Dimensions d'un PNG lues dans l'en-tête IHDR. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("hex"), path).toBe("89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * Opacité (0-255) du pixel en haut à gauche d'un PNG, lue directement (sans Python ni dépendance) :
 * le premier pixel de la première ligne n'est jamais modifié par le filtre PNG.
 */
function pngTopLeftAlpha(path: string): number {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("hex"), path).toBe("89504e470d0a1a0a");
  const bitDepth = bytes[24];
  const colorType = bytes[25];
  const idat: Buffer[] = [];
  let transparency: Buffer | null = null;
  for (let offset = 8; offset < bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("latin1");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IDAT") idat.push(data);
    if (type === "tRNS") transparency = data;
    offset += 12 + length;
  }
  const first = inflateSync(Buffer.concat(idat)).subarray(1); // l'octet de filtre est ignoré
  const sampleBytes = bitDepth === 16 ? 2 : 1;
  if (colorType === 6) return first[3 * sampleBytes]; // RGBA
  if (colorType === 4) return first[sampleBytes]; // niveaux de gris + alpha
  if (colorType === 3) return transparency?.[first[0] >> (8 - bitDepth)] ?? 255; // palette (+ tRNS)
  return 255; // sans canal alpha : opaque
}

describe("nouveau logo 3M — déploiement site-wide", () => {
  it("remplace les assets logo / favicon / PWA avec des tailles valides", () => {
    expect(existsSync(publicFile("logo-3m.webp"))).toBe(true);
    expect(existsSync(publicFile("logo-3m-hd.webp"))).toBe(true);
    expect(existsSync(publicFile("logo-3m-travel-agency-hd.png"))).toBe(true);
    expect(statSync(publicFile("logo-3m.webp")).size).toBeLessThan(40 * 1024);
    expect(statSync(publicFile("logo-3m-hd.webp")).size).toBeGreaterThan(30 * 1024);
    expect(statSync(publicFile("logo-3m-travel-agency-hd.png")).size).toBeGreaterThan(100 * 1024);

    expect(pngSize(publicFile("apple-touch-icon.png"))).toEqual({ width: 180, height: 180 });
    expect(pngSize(publicFile("favicon-32x32.png"))).toEqual({ width: 32, height: 32 });
    expect(pngSize(publicFile("icon-192.png"))).toEqual({ width: 192, height: 192 });
    expect(pngSize(publicFile("icon-512.png"))).toEqual({ width: 512, height: 512 });
    expect(readFileSync(publicFile("favicon.ico")).subarray(0, 4).toString("hex")).toBe("00000100");
  });

  it("câble hero/nav/footer + purge cache PWA", () => {
    expect(read("client/src/components/HeroSectionVIP.tsx")).toContain('logoUrl = "/logo-3m-hd.webp"');
    expect(read("client/src/components/HeroSectionVIP.tsx")).toContain("object-contain");
    expect(read("client/src/pages/Home.tsx")).toContain("/logo-3m-hd.webp");
    expect(read("client/src/components/Navbar.tsx")).toContain('src="/logo-3m.webp"');
    expect(read("client/src/components/Footer.tsx")).toContain('src="/logo-3m.webp"');
    expect(read("client/public/sw.js")).toMatch(/const CACHE_NAME = '3m-travel-pwa-v\d+/);
    expect(read("client/index.html")).toMatch(/const SW_REVISION = '\d{4}-\d{2}-\d{2}-[a-z0-9-]+'/);
  });

  it("le PNG HD a un fond transparent hors cercle (pas un carré blanc)", () => {
    const path = publicFile("logo-3m-travel-agency-hd.png");
    expect(pngTopLeftAlpha(path)).toBeLessThan(10);
  });
});
