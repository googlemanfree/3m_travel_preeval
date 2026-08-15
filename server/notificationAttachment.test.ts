import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("pièces jointes des réponses rapides", () => {
  it("persiste une pièce jointe sécurisée dans la messagerie candidat", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("candidate-messages/${ctx.candidate.id}");
    expect(router).toContain("attachmentUrl");
    expect(router).toContain("attachmentMimeType");
  });

  it("limite les formats aux PDF, JPG et PNG et la taille à 5 Mo", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain('z.enum(["application/pdf", "image/jpeg", "image/png"])');
    expect(router).toContain("max(5 * 1024 * 1024)");
    expect(router).toContain("buffer.length > 5 * 1024 * 1024");
  });

  it("expose le sélecteur de fichier dans la réponse rapide", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain('type="file"');
    expect(dashboard).toContain("notification-attachment-");
    expect(dashboard).toContain("Retirer la pièce jointe");
  });
});
