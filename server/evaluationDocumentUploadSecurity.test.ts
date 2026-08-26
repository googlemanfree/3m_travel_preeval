import { describe, expect, it } from "vitest";
import { createEvaluationUploadToken, verifyEvaluationUploadToken } from "./routers/evaluation";

describe("dépôt documentaire d’évaluation", () => {
  it("accepte un jeton lié à la bonne évaluation et au bon e-mail", () => {
    const token = createEvaluationUploadToken(42, "candidate@example.com");
    expect(() => verifyEvaluationUploadToken(token, 42, "candidate@example.com")).not.toThrow();
  });

  it("refuse la réutilisation du jeton pour une autre évaluation ou un autre e-mail", () => {
    const token = createEvaluationUploadToken(42, "candidate@example.com");
    expect(() => verifyEvaluationUploadToken(token, 43, "candidate@example.com")).toThrow("Lien de dépôt invalide ou expiré.");
    expect(() => verifyEvaluationUploadToken(token, 42, "other@example.com")).toThrow("Lien de dépôt invalide ou expiré.");
  });
});
