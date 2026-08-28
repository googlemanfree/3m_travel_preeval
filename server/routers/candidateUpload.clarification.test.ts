import { describe, expect, it } from "vitest";
import { parseClarificationRequestId } from "./candidateUpload";

describe("référence de clarification transmise avec un dépôt", () => {
  it("accepte uniquement une référence numérique positive ou son absence", () => {
    expect(parseClarificationRequestId(undefined)).toBeNull();
    expect(parseClarificationRequestId("")).toBeNull();
    expect(parseClarificationRequestId("24")).toBe(24);
    expect(() => parseClarificationRequestId("24.5")).toThrow("Référence de clarification invalide");
    expect(() => parseClarificationRequestId("-24")).toThrow("Référence de clarification invalide");
    expect(() => parseClarificationRequestId("candidate-24")).toThrow("Référence de clarification invalide");
  });
});
