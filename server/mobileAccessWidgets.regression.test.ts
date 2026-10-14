import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const flightSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/SmartFlightAssistant.tsx"), "utf8");
const aureolSource = readFileSync(resolve(import.meta.dirname, "../client/src/components/AiCopilotWidgetEnhanced.tsx"), "utf8");

describe("widgets flottants et accès client mobile", () => {
  it("les désactive sur les routes d’accès pour éviter de recouvrir les actions de connexion", () => {
    expect(appSource).toContain("const isAccessRoute");
    expect(appSource).toContain("const normalizedLocation = location.replace");
    for (const route of ["/login", "/register", "/signup", "/evaluation", "/mon-espace", "/mon-dossier", "/document-upload", "/assistance-acces", "/confirm-email-change"]) {
      expect(appSource).toContain(`"${route}"`);
    }
    expect(appSource).toContain("&& !isAccessRoute");
    expect(appSource).toContain("{showFloatingTools && floatingToolsReady && (");
    expect(appSource).toContain("<AiCopilotWidgetEnhanced />");
    expect(appSource).toContain("<SmartFlightAssistant />");
    expect(appSource).not.toContain("{!isHomeRoute && <AiCopilotWidgetEnhanced />}");
    expect(appSource).not.toContain("{!isHomeRoute && <SmartFlightAssistant />}");
  });

  it("contraint le panneau de vol à la largeur et à la hauteur disponibles sur mobile", () => {
    expect(flightSource).toContain("w-[min(360px,calc(100vw-1.5rem))]");
    expect(flightSource).toContain("h-[min(500px,calc(100dvh-6rem))]");
    expect(flightSource).toContain("min-h-[360px]");
  });

  it("affiche un état de chargement accessible pendant l’ouverture d’Aureol", () => {
    expect(aureolSource).toContain("const [isOpening, setIsOpening] = useState(false)");
    expect(aureolSource).toContain("aria-busy={isOpening}");
    expect(aureolSource).toContain("<Loader className=\"w-5 h-5 animate-spin");
  });
});
