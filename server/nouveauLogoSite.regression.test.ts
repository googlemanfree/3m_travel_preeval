import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const publicFile = (name: string) => resolve(root, "client/public", name);
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/** Dimensions d'un PNG lues dans l'en-tête IHDR. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("hex"), path).toBe("89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
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
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v58-nouveau-logo");
    expect(read("client/index.html")).toContain("2026-10-15-nouveau-logo-v58");
  });

  it("le PNG HD a un fond transparent hors cercle (pas un carré blanc)", () => {
    const path = publicFile("logo-3m-travel-agency-hd.png");
    const script = `from PIL import Image; im = Image.open(${JSON.stringify(path)}).convert("RGBA"); print(im.getpixel((0, 0))[3])`;
    const alpha = Number(execFileSync("python3", ["-c", script], { encoding: "utf8" }).trim());
    expect(alpha).toBeLessThan(10);
  });
});
