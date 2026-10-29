import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "server");
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "fixtures" || entry === "node_modules" ? [] : sources(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
const read = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const relative = (path: string) => path.replace(root, "server").replace(/\\/g, "/");

describe("l'évaluation de profil est toujours faite et publiée par un administrateur", () => {
  const files = sources(root).map((path) => ({ path: relative(path), text: read(path) }));

  it("une seule porte de publication : le store de validation structurée, après relecture administrateur", () => {
    const writers = files.filter((file) => /status:\s*"reviewed"/.test(file.text)).map((file) => file.path);
    expect(writers).toEqual(["server/services/evaluationValidationStore.ts"]);
    const store = files.find((file) => file.path === "server/services/evaluationValidationStore.ts")!.text;
    expect(store).toContain("rapport publié après relecture administrateur");
  });

  it("aucun chemin ne marque une évaluation comme envoyée au candidat sans passer par la publication", () => {
    const senders = files.filter((file) => /finalResponseSentAt:\s*(?:new Date\(|now\b|publication\.|[A-Za-z.]*publishedAt)/.test(file.text)).map((file) => file.path);
    // Les seuls autres écritures sont l'envoi de la réponse déjà validée, dans des procédures réservées aux administrateurs.
    expect(senders).toEqual(["server/routers/aiEvaluationManagement.ts", "server/services/evaluationValidationStore.ts"]);
    const management = files.find((file) => file.path === "server/routers/aiEvaluationManagement.ts")!.text;
    expect(management).toContain("requireValidAdminSession");
    expect(management).not.toMatch(/candidateProcedure/);
  });

  it("la soumission du candidat crée une demande « submitted » : aucun résultat n'est calculé ni publié à ce stade", () => {
    const submit = files.find((file) => file.path === "server/routers/profileEvaluation.ts")!.text;
    expect(submit).toContain('status: "submitted"');
    expect(submit).not.toMatch(/finalResponseSentAt|status:\s*"reviewed"/);
  });

  it("l'activation d'un dossier exige une évaluation validée par un conseiller", () => {
    const manual = files.find((file) => file.path === "server/routers/adminCandidateManagement.ts")!.text;
    expect(manual).toContain("L’évaluation doit être validée par un conseiller avant l’ouverture du dossier officiel.");
    const auto = files.find((file) => file.path === "server/services/autoActivatePreDossier.ts")!.text;
    expect(auto).toMatch(/evaluationDeclarationStatus !== "validated" \|\| !candidate\.evaluationReviewedAt/);
  });
});
