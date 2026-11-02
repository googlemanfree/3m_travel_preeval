import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { manusRuntimeFileName, manusRuntimeLoaderScript } from "./manusRuntimeLoader";

const root = resolve(import.meta.dirname, "..");

describe("runtime Manus à la demande", () => {
  it("le fichier est à empreinte : même contenu, même nom ; contenu changé, nouveau nom (cache longue durée sans risque de version périmée)", () => {
    expect(manusRuntimeFileName("abc")).toBe(manusRuntimeFileName("abc"));
    expect(manusRuntimeFileName("abc")).not.toBe(manusRuntimeFileName("abd"));
    expect(manusRuntimeFileName("abc")).toMatch(/^assets\/manus-runtime-[0-9a-f]{10}\.js$/);
  });

  it("le chargeur ignore une page ouverte seule et charge le fichier statique dans un cadre, avec l'identifiant d'origine", () => {
    const script = manusRuntimeLoaderScript("assets/manus-runtime-0123456789.js");
    expect(script).toContain("if(window.parent===window)return;");
    expect(script).toContain('s.id="manus-runtime"');
    expect(script).toContain('s.src="/assets/manus-runtime-0123456789.js"');
    expect(script).toContain("window.__MANUS_HOST_DEV__=false");
    expect(script.length).toBeLessThan(400);
  });

  it("exécuté dans une page seule il ne charge rien ; dans un cadre il ajoute exactement un script", () => {
    const run = (parent: unknown) => {
      const added: Array<Record<string, string>> = [];
      const doc = { createElement: () => ({}) as Record<string, string>, body: { appendChild: (el: Record<string, string>) => { added.push(el); } } };
      const win: Record<string, unknown> = {};
      win.parent = parent === "self" ? win : {};
      vm.runInNewContext(manusRuntimeLoaderScript("assets/manus-runtime-aaaaaaaaaa.js"), { window: win, document: doc });
      return { added, win };
    };
    expect(run("self").added).toHaveLength(0);
    const framed = run("frame");
    expect(framed.added).toHaveLength(1);
    expect(framed.added[0].src).toBe("/assets/manus-runtime-aaaaaaaaaa.js");
    expect(framed.win.__MANUS_HOST_DEV__).toBe(false);
  });

  it("la configuration n'utilise le plugin à la demande qu'en production et garde l'original en développement", () => {
    const config = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(config).toContain('isProductionBuild ? manusRuntimeOnDemandPlugin() : vitePluginManusRuntime({ injectTo: "body" })');
  });

  it("ne lit pas le runtime au chargement du bundle serveur : la lecture est différée au build", () => {
    const config = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(config).toContain("const readRuntime = () => {");
    expect(config).toContain('source = fs.readFileSync(runtimePath, "utf8");');
    expect(config).toContain("generateBundle()");
  });
});
