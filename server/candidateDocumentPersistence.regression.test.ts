import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("dépôt documentaire candidat", () => {
  it("enregistre la pièce côté serveur après le stockage avant toute réponse au navigateur", () => {
    const route = read("server/routers/candidateUpload.ts");
    expect(route).toContain("await db.insert(candidateFiles).values({");
    expect(route).toContain("documentId: candidateFileId");
    expect(route).toContain("synchronized: true");
    expect(route.indexOf("await db.insert(candidateFiles).values({")).toBeLessThan(route.indexOf("res.json({ fileUrl"));
  });

  it("permet de catégoriser le CV avant l’envoi et évite la seconde écriture depuis le navigateur", () => {
    const page = read("client/src/pages/DocumentUploadPage.tsx");
    const dashboardUploader = read("client/src/components/DocumentUploader.tsx");
    expect(page).toContain("{ id: 'cv', label: 'CV'");
    expect(page).toContain("'Téléverser'");
    expect(page).not.toContain("saveDocumentMutation.mutateAsync");
    expect(dashboardUploader).not.toContain("saveDocumentMutation.mutateAsync");
    expect(dashboardUploader).toContain('fetch("/api/candidate/upload"');
  });

  it("ne rend le projet de réponse qu’après sa diffusion validée", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("reviewDraft: evaluation.finalResponseSentAt ? evaluation.reviewDraft : null");
  });
});
