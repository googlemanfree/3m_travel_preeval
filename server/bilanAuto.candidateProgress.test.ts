import { describe, expect, it } from "vitest";
import { progressForCandidate } from "./services/bilanAuto/candidateProgress";

const at = (state: string, mode = "validation_admin") => progressForCandidate({ state, mode, updatedAt: new Date("2026-11-13T10:00:00Z") } as never);

describe("suivi du bilan côté candidat", () => {
  it("avance étape par étape sans jamais révéler d'erreur ni de note", () => {
    expect(at("queued")?.steps.map((s) => s.status)).toEqual(["en_cours", "a_venir", "a_venir", "a_venir"]);
    expect(at("extracting")?.current).toBe("analyse");
    expect(at("ready_for_review")?.current).toBe("relecture");
    expect(at("ready_for_review", "automatique")?.current).toBe("publie");
    expect(at("published")?.steps.every((s) => s.status === "fait")).toBe(true);
  });
  it("un incident s'affiche comme une analyse plus longue, sans mot alarmant", () => {
    for (const state of ["failed", "retry_pending"]) {
      const progress = at(state)!;
      expect(progress.current).toBe("analyse");
      expect(progress.note).toMatch(/plus de temps que prévu/);
      expect(JSON.stringify(progress)).not.toMatch(/échec|erreur|refus|incident|failed/i);
    }
  });
  it("un complément demandé propose l'action « compléter »", () => {
    const progress = at("needs_information")!;
    expect(progress.action).toBe("completer");
    expect(progress.note).toMatch(/complément/);
  });
  it("une version remplacée n'est pas affichée", () => { expect(at("superseded")).toBeNull(); });
});
