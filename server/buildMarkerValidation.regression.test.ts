import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const script = resolve(root, "scripts/validate-build-marker.mjs");

describe("validation du marqueur de build", () => {
  it("accepte le marqueur c4b41732 attendu", () => {
    const result = execFileSync(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, EXPECTED_BUILD_COMMIT: "c4b41732" },
      encoding: "utf8",
    });
    expect(result).toContain("Validation OK : c4b41732");
  });

  it("bloque un marqueur différent du commit attendu", () => {
    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, EXPECTED_BUILD_COMMIT: "deadbeef" },
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("Publication bloquée");
  });
});
