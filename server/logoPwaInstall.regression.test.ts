import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("logo de navigation et installation PWA", () => {
  it("anime le chargement du logo et fournit un retour de survol accessible", () => {
    const source = read("client/src/components/Navbar.tsx");
    expect(source).toContain("const [logoLoaded, setLogoLoaded] = useState(false)");
    expect(source).toContain("onLoad={() => setLogoLoaded(true)}");
    expect(source).toContain("group-hover:scale-105");
    expect(source).toContain("focus-visible:ring-2");
    expect(source).toContain("motion-reduce:group-hover:scale-100");
  });

  it("capture le prompt d’installation et expose un bouton mobile-friendly", () => {
    const source = read("client/src/components/PwaStatusNotice.tsx");
    expect(source).toContain("beforeinstallprompt");
    expect(source).toContain("event.preventDefault()");
    expect(source).toContain("installPrompt.prompt()");
    expect(source).toContain("appinstalled");
    expect(source).toContain("Installer 3M TRAVEL AGENCY");
    expect(source).toContain(">\n            Installer\n          </Button>");
    expect(source).toContain("w-[min(22rem,calc(100%-2rem))]");
    expect(source).toContain("bottom-24");
    expect(source).toContain('role="status" aria-live="polite"');
  });
});
