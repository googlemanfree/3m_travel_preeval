import { describe, expect, it } from "vitest";
import {
  LUXEMBOURG_JOB_PLATFORMS,
  getLuxembourgJobPlatform,
  isLuxembourgDestination,
  luxembourgApplicationTaskDescription,
  luxembourgApplicationTaskTitle,
  luxembourgProgressTaskPresets,
} from "../shared/luxembourgJobPlatforms";
import { luxembourgProcedure } from "../client/src/data/countryProcedures/luxembourg";

describe("luxembourgJobPlatforms", () => {
  it("expose les quatre plateformes curated pour candidats non-UE", () => {
    expect(LUXEMBOURG_JOB_PLATFORMS).toHaveLength(4);
    expect(LUXEMBOURG_JOB_PLATFORMS.map((p) => p.id)).toEqual([
      "work-in-luxembourg",
      "adem-offres-publiques",
      "moovijob",
      "jobs-lu",
    ]);
    for (const platform of LUXEMBOURG_JOB_PLATFORMS) {
      expect(platform.url).toMatch(/^https:\/\//);
      expect(platform.nonEuUtility.length).toBeGreaterThan(20);
    }
  });

  it("priorise Work in Luxembourg et ADEM pour le recrutement hors UE", () => {
    const high = LUXEMBOURG_JOB_PLATFORMS.filter((p) => p.priorityForNonEu === "high");
    expect(high.map((p) => p.id)).toEqual(["work-in-luxembourg", "adem-offres-publiques"]);
    expect(high.every((p) => p.officialChannel)).toBe(true);
  });

  it("construit des actions admin exploitables", () => {
    const platform = getLuxembourgJobPlatform("moovijob");
    expect(platform).toBeDefined();
    expect(luxembourgApplicationTaskTitle(platform!.name, "DONFACK")).toBe("Postuler sur Moovijob — DONFACK");
    expect(luxembourgApplicationTaskDescription(platform!)).toContain("https://www.moovijob.com/");
    expect(luxembourgProgressTaskPresets("DONFACK")).toHaveLength(3);
  });

  it("détecte une destination Luxembourg", () => {
    expect(isLuxembourgDestination("Luxembourg")).toBe(true);
    expect(isLuxembourgDestination("visa luxembourg travail")).toBe(true);
    expect(isLuxembourgDestination("Canada")).toBe(false);
  });

  it("branche les plateformes sur la fiche procédure publique", () => {
    expect(luxembourgProcedure.jobPlatforms?.map((p) => p.id)).toEqual(
      LUXEMBOURG_JOB_PLATFORMS.map((p) => p.id),
    );
    expect(luxembourgProcedure.jobPlatforms?.[0]?.url).toBe("https://work-in-luxembourg.lu/");
  });
});
