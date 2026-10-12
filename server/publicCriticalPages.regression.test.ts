import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("public critical page boot resilience", () => {
  it("keeps the conversion and procedure pages out of lazy chunks", () => {
    const app = read("client/src/App.tsx");
    const criticalPages = [
      "Flights",
      "VisaEtudes",
      "Schengen",
      "Formation",
      "CniPasseport",
      "Services",
      "DestinationsHub",
      "Evisa",
      "About",
      "Contact",
      "HowItWorks",
      "Tourism",
      "PartnersHub",
      "ProceduresAdvanced",
    ];

    for (const page of criticalPages) {
      expect(app).toContain(`import ${page} from "./pages/${page}";`);
      expect(app).not.toContain(`const ${page} = lazyWithTimeout(() => import("./pages/${page}"));`);
    }
  });

  it("keeps the global prerender guard and boot-slow recovery", () => {
    const html = read("client/index.html");
    expect(html).toContain("html.app-ready .seo-prerender");
    expect(html).toContain("html.app-boot-slow:not(.app-ready) .seo-prerender");
    expect(html).toContain("window.setTimeout(function ()");
  });
});
