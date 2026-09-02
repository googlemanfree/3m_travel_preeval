import { afterEach, describe, expect, it } from "vitest";
import { getPublicBuildMarker } from "./publicBuildMarker";

describe("public build marker", () => {
  const previous = process.env.PUBLIC_BUILD_MARKER;

  afterEach(() => {
    if (previous === undefined) delete process.env.PUBLIC_BUILD_MARKER;
    else process.env.PUBLIC_BUILD_MARKER = previous;
  });

  it("uses a safe fallback when no deployment marker is configured", () => {
    delete process.env.PUBLIC_BUILD_MARKER;
    expect(getPublicBuildMarker()).toBe("3m-travel-current");
  });

  it("sanitizes and bounds an explicit deployment marker", () => {
    process.env.PUBLIC_BUILD_MARKER = "release/2026 09 <admin>";
    const marker = getPublicBuildMarker();
    expect(marker).toBe("release-2026-09--admin-");
    expect(marker.length).toBeLessThanOrEqual(64);
  });
});
