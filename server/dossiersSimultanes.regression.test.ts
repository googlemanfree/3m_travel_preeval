import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  attachSiblingProcedures,
  retainSiblingGroupsInFilteredList,
} from "../shared/clientMultiDossier";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("dossiers simultanés travail + études", () => {
  it("conserve les procédures sœurs après un filtre destination", () => {
    const universe = attachSiblingProcedures([
      {
        id: "agency_1",
        email: "a@test.com",
        folderCode: "3M-AGN-0001",
        projectType: "Travail",
        destinationCountry: "Canada",
        paymentStatus: "SUCCESS",
        source: "AGENCY_PHYSICAL",
        status: "en_cours",
      },
      {
        id: "agency_2",
        email: "a@test.com",
        folderCode: "3M-AGN-0002",
        projectType: "Études",
        destinationCountry: "France",
        paymentStatus: "SUCCESS",
        source: "AGENCY_PHYSICAL",
        status: "en_cours",
      },
      {
        id: "agency_3",
        email: "b@test.com",
        folderCode: "3M-AGN-0003",
        projectType: "Travail",
        destinationCountry: "Canada",
        paymentStatus: "NOT_PAID",
        source: "AGENCY_PHYSICAL",
        status: "en_cours",
      },
    ]);
    expect(universe[0].siblingCount).toBe(2);
    expect(universe[0].siblingProcedures[0].procedureLabel).toBe("Visa études");

    const filtered = universe.filter((row) => row.destinationCountry === "Canada");
    const retained = retainSiblingGroupsInFilteredList(filtered, universe);
    expect(retained.map((row) => row.id).sort()).toEqual(["agency_1", "agency_2", "agency_3"].sort());
    // Le dossier France (études) reste visible à côté du Canada (travail) du même client.
    expect(retained.some((row) => row.id === "agency_2")).toBe(true);
  });

  it("protège la seconde procédure à l’activation et expose le board simultané", () => {
    const activation = read("server/routers/adminCandidateManagement.ts");
    expect(activation).toContain('status: "en_cours"');
    expect(activation).toContain("protectedIds");
    expect(activation).toContain("simultaneousProcedures");
    expect(activation).toContain("Procédure parallèle intentionnelle");

    expect(read("server/routers/admin.ts")).toContain("retainSiblingGroupsInFilteredList");
    expect(read("server/routers/admin.ts")).toContain("LOWER(TRIM(${applications.email}))");

    expect(read("client/src/components/Candidate360Workspace.tsx")).toContain("AdminSimultaneousProceduresBoard");
    expect(read("client/src/components/AdminSimultaneousProceduresBoard.tsx")).toContain("Traitement simultané");
    expect(read("client/src/components/AdminTodayDashboard.tsx")).toContain("siblingCount ?? 0) > 1");
  });
});
