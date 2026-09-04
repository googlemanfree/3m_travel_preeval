import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("Correctifs urgents upload et navigation", () => {
  it("autorise la catégorie photo_identite et ses alias biométriques", () => {
    const source = read("server/routers/candidateUpload.ts");
    expect(source).toContain('photo_identite: "photo_identite"');
    expect(source).toContain('portrait: "photo_identite"');
    expect(source).toContain('portrait_humain: "photo_identite"');
  });

  it("retire le QR et les tooltips flottants du Footer", () => {
    const source = read("client/src/components/Footer.tsx");
    expect(source).not.toContain("FacebookQRCodeWidget");
    expect(source).not.toContain('role="tooltip"');
  });

  it("normalise le proxy CV et signale un CV manquant", () => {
    const source = read("client/src/components/Candidate360Workspace.tsx");
    expect(source).toContain("new URL(String(candidateCv.documentUrl), window.location.origin)");
    expect(source).toContain('cache: "no-store"');
    expect(source).toContain("CV introuvable");
  });

  it("privilégie le jeton admin local pour éviter la désynchronisation de session", () => {
    const source = read("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain('localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken")');
  });

  it("rend les onglets admin Pilotage et Bilans cliquables", () => {
    const source = read("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain('value="pilotage" onClick={() => setActiveAdminTab("pilotage")}');
    expect(source).toContain('value="evaluation-review" onClick={() => setActiveAdminTab("evaluation-review")}');
  });

  it("ouvre directement la fiche 360 depuis la file des bilans", () => {
    const queueSource = read("client/src/components/AdvisorEvaluationReviewQueue.tsx");
    expect(queueSource).toContain("onOpenDossier(row.dossierNumber, String(row.id))");
    const dashboardSource = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboardSource).toContain('setSelectedCandidateId(candidateId); setActiveAdminTab("candidates")');
  });

  it("dirige le suivi client vers la page dédiée", () => {
    const source = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(source).toContain('href="/mon-dossier"');
    expect(source).not.toContain('href="/mon-espace?section=dossier"');
    const appSource = read("client/src/App.tsx");
    expect(appSource).toContain('path={"/mon-dossier"}');
  });
});

