import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_CLIENT_DOSSIERS, MAX_CLIENT_DOSSIERS_MESSAGE } from "../shared/clientDossierLimits";
import { CLIENT_SPACE_SUMMARY_POLL_MS } from "../client/src/lib/clientSpaceSync";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("sync admin ↔ client — garde-fous dynamiques", () => {
  it("bloque la connexion d’un compte candidat placé en corbeille", () => {
    const login = read("server/routers/candidate.ts");
    expect(login).toContain("isNull(candidates.deletedAt)");
    expect(login).toContain("isNotNull(candidates.deletedAt)");
    expect(login).toContain("Ce compte n’est plus accessible");
  });

  it("plafonne à 5 dossiers actifs par compte à la création", () => {
    expect(MAX_CLIENT_DOSSIERS).toBe(5);
    expect(MAX_CLIENT_DOSSIERS_MESSAGE).toContain("5 dossiers");
    const application = read("server/routers/application.ts");
    expect(application).toContain("MAX_CLIENT_DOSSIERS");
    expect(application).toContain("MAX_CLIENT_DOSSIERS_MESSAGE");
    expect(application).toContain("openDossiers.length >= MAX_CLIENT_DOSSIERS");
  });

  it("rafraîchit les documents admin pour voir les dépôts client sans F5", () => {
    const adminDocs = read("client/src/components/AdminDocumentsManagement.tsx");
    expect(adminDocs).toContain("refetchInterval: 30_000");
    expect(adminDocs).toContain("refetchIntervalInBackground: false");
    expect(adminDocs).toContain("Dernière sync");
  });

  it("synchronise le résumé espace client au même rythme que le reste", () => {
    expect(CLIENT_SPACE_SUMMARY_POLL_MS).toBe(30_000);
    const page = read("client/src/pages/EvaluationSpace.tsx");
    expect(page).toContain("procedure:");
    expect(page).toContain("Mes dossiers (");
    expect(page).toContain("Limite de 5 dossiers atteinte");
  });

  it("évite la saturation : parcours détaillé hors overview, empty state docs agence", () => {
    const page = read("client/src/pages/EvaluationSpace.tsx");
    expect(page).toContain("Voir le parcours détaillé");
    // Une seule CandidateCountryJourney (onglet dossier), pas en overview.
    expect(page.match(/<CandidateCountryJourney /g)?.length).toBe(1);
    const caseDocs = read("client/src/components/CaseDocumentsPanel.tsx");
    expect(caseDocs).toContain("Aucune pièce déposée en agence pour le moment");
  });
});
