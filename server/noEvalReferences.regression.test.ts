import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Règle de l'agence : avant paiement un candidat n'a qu'un COMPTE (« COMPTE-00012 ») ; « 3M- » n'existe qu'après paiement validé.
 * Aucun code ne doit donc FABRIQUER un identifiant « EVAL-… » (ils restent seulement reconnus pour être renommés).
 */
const ROOT = process.cwd();
const ALLOWED_LEGACY_READERS = new Set([
  "shared/accountKeys.ts",
  "shared/evalAgencyShell.ts",
  "server/utils/dossierReference.ts",
  "server/services/canonicalizeActiveDossier.ts",
  "server/services/normalizeAccountReferences.ts",
]);

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, found);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) found.push(full);
  }
  return found;
}

describe("plus d'identifiant EVAL fabriqué", () => {
  const files = ["server", "shared", "client/src"].flatMap((dir) => sourceFiles(join(ROOT, dir)));
  const creators = [/`EVAL-DRAFT-\$\{/, /`EVAL-AG-\$\{/, /`EVAL-\$\{/, /`3M-EVAL-\$\{/, /["']EVAL-DRAFT-["']\s*\+/];

  it("aucune fabrication d'un numéro EVAL en dehors des lecteurs de l'ancien format", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const path = relative(ROOT, file).split(sep).join("/");
      if (ALLOWED_LEGACY_READERS.has(path)) continue;
      const text = readFileSync(file, "utf8");
      for (const pattern of creators) if (pattern.test(text)) offenders.push(`${path} : ${pattern}`);
    }
    expect(offenders).toEqual([]);
  });

  it("la validation d'un bilan n'attribue plus de numéro 3M- à un compte non payé", () => {
    const text = readFileSync(join(ROOT, "server/routers/unifiedRequests.ts"), "utf8");
    expect(text).toContain('if (application.paymentStatus !== "SUCCESS" || !application.paymentValidatedAt) return application.dossierNumber;');
  });

  it("les nouvelles demandes prennent une clé de compte", () => {
    const application = readFileSync(join(ROOT, "server/routers/application.ts"), "utf8");
    const unified = readFileSync(join(ROOT, "server/routers/unifiedRequests.ts"), "utf8");
    expect(application).toContain("allocateDraftKey(db, ctx.candidate.id)");
    expect(unified).toContain("allocateDraftKey(db, candidateAccount.id)");
    expect(unified).toContain("allocateDraftKey(db, candidate.id)");
    expect(unified).toContain("agencyMirrorKey(agencyDossier.id)");
  });
});
