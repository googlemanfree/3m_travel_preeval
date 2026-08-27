import { describe, expect, it } from "vitest";
import { getConsularRevalidationState, needsConsularRevalidation } from "../client/src/lib/consularRevalidation";

const referenceDate = new Date("2026-08-27T12:00:00Z");

describe("getConsularRevalidationState", () => {
  it("priorise un contrôle requis même lorsqu’une échéance existe", () => {
    expect(getConsularRevalidationState({ verificationStatus: "a_completer", revalidateDueAt: "2026-10-31T12:00:00Z" }, referenceDate)).toBe("control_required");
  });

  it("distingue une échéance dépassée, proche, absente et à jour", () => {
    expect(getConsularRevalidationState({ verificationStatus: "verifie", revalidateDueAt: "2026-08-26T12:00:00Z" }, referenceDate)).toBe("overdue");
    expect(getConsularRevalidationState({ verificationStatus: "verifie", revalidateDueAt: "2026-09-10T12:00:00Z" }, referenceDate)).toBe("due_soon");
    expect(getConsularRevalidationState({ verificationStatus: "verifie" }, referenceDate)).toBe("missing_deadline");
    expect(getConsularRevalidationState({ verificationStatus: "verifie", revalidateDueAt: "2026-10-31T12:00:00Z" }, referenceDate)).toBe("current");
  });

  it("ne marque pas une source à jour comme une priorité de revalidation", () => {
    expect(needsConsularRevalidation({ verificationStatus: "verifie", revalidateDueAt: "2026-10-31T12:00:00Z" }, referenceDate)).toBe(false);
    expect(needsConsularRevalidation({ verificationStatus: "verifie", revalidateDueAt: "2026-09-10T12:00:00Z" }, referenceDate)).toBe(true);
  });
});
