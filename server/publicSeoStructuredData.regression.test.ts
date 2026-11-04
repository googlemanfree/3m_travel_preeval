import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const template = '<html><head></head><body><!--prerender-app--></body></html>';

describe("JSON-LD des pages d'accès et d'évaluation", () => {
  it("décrit l'évaluation comme une page et un service structurés", () => {
    const result = composePublicPrerender(template, "/evaluation");

    expect(result.status).toBe(200);
    expect(result.html).toContain('"@type":"WebPage"');
    expect(result.html).toContain('"@type":"Service"');
    expect(result.html).toContain("evaluation-service");
    expect(result.html).toContain("Évaluation de profil");
  });

  it("conserve le noindex de la connexion tout en fournissant un WebPage JSON-LD cohérent", () => {
    const result = composePublicPrerender(template, "/login");

    expect(result.noindex).toBe(true);
    expect(result.html).toContain('name="robots" content="noindex,follow"');
    expect(result.html).toContain('"@type":"WebPage"');
    expect(result.html).toContain("Connexion |");
  });
});
