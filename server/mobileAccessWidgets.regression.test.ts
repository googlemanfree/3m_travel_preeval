import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");

describe("widgets flottants et accès client mobile", () => {
  it("les désactive sur les routes d’accès pour éviter de recouvrir les actions de connexion", () => {
    expect(appSource).toContain("const isAccessRoute");
    expect(appSource).toContain("const normalizedLocation = location.replace");
    for (const route of ["/login", "/signup", "/mon-espace", "/mon-dossier", "/document-upload"]) {
      expect(appSource).toContain(`"${route}"`);
    }
    expect(appSource).toContain("&& !isAccessRoute");
    expect(appSource).toContain("{showFloatingTools && <AiCopilotWidgetEnhanced />}");
    expect(appSource).toContain("{showFloatingTools && <SmartFlightAssistant />}");
  });
});
