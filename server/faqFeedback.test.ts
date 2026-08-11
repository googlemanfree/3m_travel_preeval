import { describe, expect, it } from "vitest";
import {
  canSubmitFaqFeedback,
  parseStoredFaqFeedback,
} from "../shared/faqFeedback";

describe("FAQ feedback helpers", () => {
  it("ignore les données locales invalides et conserve uniquement les votes connus", () => {
    const parsed = parseStoredFaqFeedback(
      JSON.stringify({
        reservation: "helpful",
        payment: "notHelpful",
        unknown: "maybe",
        nested: { value: "helpful" },
      })
    );

    expect(parsed).toEqual({
      reservation: "helpful",
      payment: "notHelpful",
    });
    expect(parseStoredFaqFeedback("not-json")).toEqual({});
  });

  it("autorise un seul vote par question dans le navigateur", () => {
    expect(canSubmitFaqFeedback({}, "reservation")).toBe(true);
    expect(canSubmitFaqFeedback({ reservation: "helpful" }, "reservation")).toBe(false);
    expect(canSubmitFaqFeedback({}, "   ")).toBe(false);
  });
});
