import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const TEMPLATE = "<!doctype html><html><head><title>old</title></head><body><!--prerender-app--></body></html>";

describe("/mon-dossier public prerender guard", () => {
  it("returns a non-indexable protected shell instead of a 404 maintenance response", () => {
    const result = composePublicPrerender(TEMPLATE, "/mon-dossier");
    expect(result.status).toBe(200);
    expect(result.noindex).toBe(true);
    expect(result.html).toContain('data-prerendered="true"');
    expect(result.html).toContain('name="robots" content="noindex,follow"');
    expect(result.html).not.toContain("Page introuvable");
    expect(result.html).not.toContain("maintenance");
  });
});
