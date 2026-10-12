import { readFileSync } from "node:fs";
import path from "node:path";
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
  it("expose les quatre plateformes curated pour usage admin uniquement", () => {
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

  it("ne publie pas les liens job boards sur la fiche client", () => {
    expect((luxembourgProcedure as { jobPlatforms?: unknown }).jobPlatforms).toBeUndefined();
    expect(JSON.stringify(luxembourgProcedure)).not.toContain("work-in-luxembourg.lu");
    expect(JSON.stringify(luxembourgProcedure)).not.toContain("moovijob.com");
    expect(JSON.stringify(luxembourgProcedure)).not.toContain("jobs.lu");
    const templateSource = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/CountryProcedureTemplate.tsx"),
      "utf8",
    );
    expect(templateSource).not.toContain("job-platforms-title");
    expect(luxembourgProcedure.faq.some((item) => /candidater moi-même/i.test(item.question))).toBe(true);
  });
});
