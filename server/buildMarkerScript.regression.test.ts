import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
// @ts-expect-error module .mjs sans déclaration de types
import { BuildMarkerError, normalizeSha, resolveBuildCommit } from "../scripts/build-marker-resolve.mjs";

const root = resolve(import.meta.dirname, "..");
const SHA_A = "aaaaaaaa1111111111111111111111111111aaaa";
const SHA_B = "bbbbbbbb2222222222222222222222222222bbbb";
const temps: string[] = [];

/** Dossier de projet minimal avec les vrais scripts, sans git par défaut. */
function project(options: { staleMarker?: string; git?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "marker-"));
  temps.push(dir);
  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "client", "public"), { recursive: true });
  for (const file of ["prepare-build-marker.mjs", "build-marker-resolve.mjs"]) copyFileSync(join(root, "scripts", file), join(dir, "scripts", file));
  writeFileSync(join(dir, "package.json"), '{"type":"module"}');
  if (options.staleMarker) writeFileSync(join(dir, "client/public/build-commit.json"), JSON.stringify({ commit: options.staleMarker, generatedAt: "2026-01-01T00:00:00.000Z" }));
  let headShort = "";
  if (options.git) {
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    git("init", "-q");
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "init");
    headShort = git("rev-parse", "--short=8", "HEAD");
  }
  return { dir, headShort };
}

function run(dir: string, env: Record<string, string> = {}, strict = true) {
  const clean: Record<string, string> = { PATH: process.env.PATH ?? "", SystemRoot: process.env.SystemRoot ?? "", ...env };
  if (strict) clean.BUILD_STRICT_MARKER = "1";
  const result = spawnSync(process.execPath, [join(dir, "scripts", "prepare-build-marker.mjs")], { cwd: dir, env: clean, encoding: "utf8" });
  const file = join(dir, "client/public/build-commit.json");
  return { status: result.status, out: `${result.stdout}${result.stderr}`, marker: existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")).commit as string) : null };
}

afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

describe("résolution du commit (fonction pure)", () => {
  it("SHA de la plateforme valide : raccourci à 8 caractères, PUBLIC_BUILD_COMMIT prioritaire", () => {
    expect(resolveBuildCommit({ env: { RAILWAY_GIT_COMMIT_SHA: SHA_A }, strict: true })).toEqual({ commit: "aaaaaaaa", source: "RAILWAY_GIT_COMMIT_SHA" });
    expect(resolveBuildCommit({ env: { RAILWAY_GIT_COMMIT_SHA: SHA_A, PUBLIC_BUILD_COMMIT: SHA_B }, strict: true }).commit).toBe("bbbbbbbb");
  });

  it("SHA Git valide quand la plateforme n'en donne pas", () => {
    expect(resolveBuildCommit({ env: {}, gitCommit: "1bda07b1", strict: true })).toEqual({ commit: "1bda07b1", source: "git" });
  });

  it("un identifiant WebDev, une empreinte non hexadécimale ou un texte libre n'est jamais un commit", () => {
    for (const value of ["webdev-checkpoint-7f3a", "manus_9fa2c1d0", "checkpoint ac4eba01", "ab12", "", "  "]) {
      expect(() => resolveBuildCommit({ env: { GIT_COMMIT: value }, strict: true })).toThrow(BuildMarkerError);
      expect(normalizeSha(value)).toBeUndefined();
    }
  });

  it("absence de SHA : échec en mode strict, « nogit » (jamais un ancien marqueur) sinon", () => {
    expect(() => resolveBuildCommit({ env: {}, strict: true })).toThrow(BuildMarkerError);
    expect(resolveBuildCommit({ env: {}, strict: false })).toEqual({ commit: "nogit", source: "nogit" });
  });

  it("incohérence plateforme / Git : bloquée en mode strict", () => {
    expect(() => resolveBuildCommit({ env: { GIT_COMMIT: SHA_A }, gitCommit: "bbbbbbbb", strict: true })).toThrow(/différent du HEAD Git/);
    expect(resolveBuildCommit({ env: { GIT_COMMIT: SHA_A }, gitCommit: "aaaaaaaa", strict: true }).commit).toBe("aaaaaaaa");
  });

  it("commit attendu différent du commit construit : bloqué en mode strict", () => {
    expect(() => resolveBuildCommit({ env: { GIT_COMMIT: SHA_A, EXPECTED_BUILD_COMMIT: SHA_B }, strict: true })).toThrow(/attendu bbbbbbbb/);
    expect(resolveBuildCommit({ env: { GIT_COMMIT: SHA_A, EXPECTED_BUILD_COMMIT: SHA_A }, strict: true }).commit).toBe("aaaaaaaa");
  });
});

describe("script prepare-build-marker.mjs (exécution réelle)", () => {
  it("SHA de la plateforme valide : build-commit.json contient exactement ce SHA", () => {
    const { dir } = project();
    const result = run(dir, { RAILWAY_GIT_COMMIT_SHA: SHA_A });
    expect(result.status).toBe(0);
    expect(result.marker).toBe("aaaaaaaa");
  });

  it("SHA Git valide sans variable de plateforme : le marqueur est le HEAD réel", () => {
    const { dir, headShort } = project({ git: true });
    const result = run(dir);
    expect(result.status).toBe(0);
    expect(result.marker).toBe(headShort);
  });

  it("ni Git ni SHA : le build strict échoue explicitement et n'écrit rien", () => {
    const { dir } = project();
    const result = run(dir);
    expect(result.status).toBe(1);
    expect(result.out).toContain("Aucun SHA Git fiable");
    expect(result.marker).toBeNull();
  });

  it("ancien marqueur périmé : jamais réutilisé, le build strict échoue et le fichier reste intact", () => {
    const { dir } = project({ staleMarker: "80c08638" });
    const result = run(dir);
    expect(result.status).toBe(1);
    expect(result.marker).toBe("80c08638"); // fichier laissé tel quel, mais le build est bloqué
    expect(result.out).not.toContain("Commit préparé");
  });

  it("ancien marqueur périmé hors mode strict : remplacé par « nogit », pas conservé", () => {
    const { dir } = project({ staleMarker: "80c08638" });
    const result = run(dir, {}, false);
    expect(result.status).toBe(0);
    expect(result.marker).toBe("nogit");
  });

  it("un ancien marqueur est remplacé par le vrai SHA quand il existe", () => {
    const { dir } = project({ staleMarker: "80c08638" });
    expect(run(dir, { GIT_COMMIT: SHA_B }).marker).toBe("bbbbbbbb");
  });

  it("incohérence SHA attendu / commit construit : le build strict est bloqué", () => {
    const { dir } = project();
    const result = run(dir, { GIT_COMMIT: SHA_A, EXPECTED_BUILD_COMMIT: SHA_B });
    expect(result.status).toBe(1);
    expect(result.out).toContain("Commit attendu");
  });

  it("incohérence plateforme / Git : le build strict est bloqué", () => {
    const { dir } = project({ git: true });
    const result = run(dir, { GIT_COMMIT: SHA_A });
    expect(result.status).toBe(1);
    expect(result.out).toContain("différent du HEAD Git");
  });
});

describe("le dépôt ne porte plus de marqueur périmé", () => {
  it("le script n'utilise ni métadonnées WebDev, ni empreinte de fichiers, ni ancien build-commit.json", () => {
    const script = readFileSync(join(root, "scripts/prepare-build-marker.mjs"), "utf8") + readFileSync(join(root, "scripts/build-marker-resolve.mjs"), "utf8");
    expect(script).not.toMatch(/__manus__|version\.json|createHash|readdirSync|commitFromExistingMetadata|commitFromWebDevMetadata|commitFromSourceFingerprint/);
  });

  it("build-commit.json est généré, donc ignoré par Git", () => {
    const ignored = spawnSync("git", ["check-ignore", "-q", "client/public/build-commit.json"], { cwd: root });
    expect(ignored.status).toBe(0);
  });
});
