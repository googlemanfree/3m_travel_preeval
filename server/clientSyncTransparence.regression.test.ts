import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildClientSpaceSnapshot,
  diffClientSpace,
} from "../client/src/lib/clientSpaceSync";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("sync client — transparence multi-dossiers", () => {
  it("annonce l’apparition d’une seconde procédure et un changement de statut", () => {
    const previous = buildClientSpaceSnapshot({
      dossiers: [
        {
          dossierNumber: "3M-AGN-0001",
          procedureLabel: "Visa travail",
          destination: "Canada",
          dossierStatus: "en_cours",
          paymentStatus: "SUCCESS",
        },
      ],
    });
    const next = buildClientSpaceSnapshot({
      dossiers: [
        {
          dossierNumber: "3M-AGN-0001",
          procedureLabel: "Visa travail",
          destination: "Canada",
          dossierStatus: "documents",
          paymentStatus: "SUCCESS",
        },
        {
          dossierNumber: "3M-AGN-0002",
          procedureLabel: "Visa études",
          destination: "France",
          dossierStatus: "en_cours",
          paymentStatus: "SUCCESS",
        },
      ],
    });
    const changes = diffClientSpace(previous, next);
    expect(changes.some((change) => change.id.startsWith("dossier-new-3M-AGN-0002"))).toBe(true);
    expect(changes.some((change) => change.id.includes("dossier-status-3M-AGN-0001"))).toBe(true);
  });

  it("branche API enrichie, notification duale et UI mon-espace", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("procedureLabel");
    expect(candidateRouter).toContain("parallelProcedures");
    expect(candidateRouter).toContain("activeAgencyDossier");

    const activation = read("server/routers/adminCandidateManagement.ts");
    expect(activation).toContain("Deux procédures activées en parallèle");

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("selectClientDossier");
    expect(space).toContain("parallel-procedures-banner");
    expect(space).toContain("dossiers: dashboardData?.onlineDossiers");
    expect(space).toContain("params.set(\"dossier\"");

    expect(read("client/src/lib/clientSpaceSync.ts")).toContain("dossiers?:");
  });
});
