import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, parseImageData } from "./routers/destinationMedia";

const ONE_PIXEL_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("destinationMedia", () => {
  it("accepte une image PNG base64 valide", () => {
    const result = parseImageData(`data:image/png;base64,${ONE_PIXEL_PNG}`, "image/png");
    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it("refuse les formats qui ne sont pas des images autorisées", () => {
    expect(() => parseImageData("data:image/svg+xml;base64,PHN2Zy8+", "image/svg+xml")).toThrow(
      "Format d’image non autorisé"
    );
  });

  it("refuse les fichiers dont la taille dépasse 5 Mo", () => {
    const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64");
    expect(() => parseImageData(oversized, "image/png")).toThrow("5 Mo");
  });
});
