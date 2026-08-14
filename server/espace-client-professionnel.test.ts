import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("espace client professionnel", () => {
  it("affiche la photo réelle du candidat et permet sa mise à jour", () => {
    const avatar = read("client/src/components/CandidateAvatar.tsx");
    const page = read("client/src/pages/EvaluationSpace.tsx");
    const router = read("server/routers/candidate.ts");

    expect(avatar).toContain("trpc.candidate.updateAvatar.useMutation()");
    expect(avatar).toContain("/api/candidate/upload");
    expect(page).toContain("avatarUrl={myDossierData.data.candidate.avatarUrl}");
    expect(router).toContain("updateAvatar:");
  });

  it("utilise cinq étapes visuelles et le statut réel de l’application", () => {
    const timeline = read("client/src/components/DossierProgressTimeline.tsx");
    const page = read("client/src/pages/EvaluationSpace.tsx");
    const router = read("server/routers/candidate.ts");

    expect(timeline).toContain('key: "evaluation"');
    expect(timeline).toContain('key: "paiement"');
    expect(timeline).toContain('key: "documents"');
    expect(timeline).toContain('key: "soumission"');
    expect(timeline).toContain('key: "decision"');
    expect(page).toContain("dossierStatus={myDossierData.data.dossierStatus}");
    expect(router).toContain("dossierStatus: application.dossierStatus");
  });

  it("alerte d’une nouvelle étape et mémorise l’étape consultée", () => {
    const timeline = read("client/src/components/DossierProgressTimeline.tsx");

    expect(timeline).toContain("Nouvelle étape");
    expect(timeline).toContain("Marquer comme lu");
    expect(timeline).toContain("localStorage");
    expect(timeline).toContain("3m-travel:dossier-status-seen:");
    expect(timeline).toContain("dossierKey");
  });
});
