import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
// Fins de ligne normalisées : le test passe aussi bien sur un poste Windows (CRLF) que sur Linux (LF).
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

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
    const sw = read("client/public/sw.js");
    const offline = read("client/public/offline.html");
    expect(source).toContain("beforeinstallprompt");
    expect(source).toContain("event.preventDefault()");
    expect(source).toContain("installPrompt.prompt()");
    expect(source).toContain("appinstalled");
    expect(source).toContain('INSTALL_PROMPT_PREFERENCE = "3m-pwa-install-preference"');
    expect(source).toContain('dismissInstallPrompt("temporary")');
    expect(source).toContain('dismissInstallPrompt("permanent")');
    expect(source).toContain("Installer 3M TRAVEL AGENCY");
    expect(source).toContain(">\n            Installer\n          </Button>");
    expect(source).toContain("animate-[pulse_2.4s_ease-in-out_3]");
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain("w-[min(22rem,calc(100%-2rem))]");
    expect(source).toContain("bottom-24");
    expect(source).toContain('role="status" aria-live="polite"');
    expect(sw).toContain("3m-travel-pwa-v59-offline-brand");
    expect(sw).toContain("'/offline.html'");
    expect(sw).toContain("caches.match('/offline.html')");
    expect(offline).toContain('src="/logo-3m.webp"');
    expect(offline).toContain("Vous êtes hors connexion");
    expect(offline).toContain("prefers-reduced-motion");
  });
});
