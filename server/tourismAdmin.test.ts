import { describe, expect, it } from "vitest";
import { buildTourismServiceTypes } from "./routers/tourism";

describe("Admin Tourisme & Devis", () => {
  it("valide la composition des services de tourisme", () => {
    expect(buildTourismServiceTypes("explorer", ["hotel"])).toContain("vehicle");
    expect(buildTourismServiceTypes("escapade", ["hotel"])).toContain("hotel");
  });
});
