import { describe, expect, it } from "vitest";
import {
  collapseEvalAgencyShellRows,
  isEvalAgencyShell,
  parseEvalAgencyShellId,
  resolveCanonicalAgencyOpenId,
} from "./evalAgencyShell";

describe("evalAgencyShell", () => {
  it("détecte le miroir EVAL-AG", () => {
    expect(isEvalAgencyShell("EVAL-AG-240001")).toBe(true);
    expect(parseEvalAgencyShellId("EVAL-AG-240001")).toBe(240001);
    expect(isEvalAgencyShell("3M-AGN-240001")).toBe(false);
  });

  it("supprime EVAL-AG quand le 3M-AGN du même id est présent", () => {
    const rows = [
      { id: "online_9", folderCode: "EVAL-AG-240001", source: "WEB" },
      { id: "agency_240001", folderCode: "3M-AGN-240001", source: "AGENCY_PHYSICAL" },
      { id: "online_10", folderCode: "EVAL-AG-99", source: "WEB" },
    ];
    const collapsed = collapseEvalAgencyShellRows(rows);
    expect(collapsed.map((row) => row.folderCode)).toEqual(["3M-AGN-240001", "EVAL-AG-99"]);
  });

  it("redirige l’ouverture EVAL-AG vers agency_N", () => {
    expect(resolveCanonicalAgencyOpenId({ candidateId: "online_9", folderCode: "EVAL-AG-240001" })).toBe("agency_240001");
    expect(resolveCanonicalAgencyOpenId({ candidateId: "agency_240001", folderCode: "3M-AGN-240001" })).toBe(null);
  });
});
