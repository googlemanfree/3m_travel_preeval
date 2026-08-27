import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REVIEW_ALERT_WINDOW_MS, shouldCreateReviewDeadlineAlert } from "./evaluationReviewDeadlineAlertJob";

const root = resolve(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const now = new Date("2026-08-27T12:00:00.000Z");

describe("alertes internes d’échéance de revue", () => {
  it("crée une alerte une seule fois pour une revue ouverte qui arrive dans quatre heures", () => {
    expect(shouldCreateReviewDeadlineAlert({
      id: 14,
      referenceCode: "3M-EVAL-14",
      destinationCountry: "Luxembourg",
      reviewDeadline: new Date(now.getTime() + REVIEW_ALERT_WINDOW_MS),
      reviewedAt: null,
      reviewDeadlineAlertedAt: null,
    }, now)).toBe(true);
  });

  it("ignore une revue traitée, déjà alertée, échue ou encore trop éloignée", () => {
    const base = { id: 14, referenceCode: "3M-EVAL-14", destinationCountry: null };
    expect(shouldCreateReviewDeadlineAlert({ ...base, reviewDeadline: new Date(now.getTime() + 60_000), reviewedAt: now, reviewDeadlineAlertedAt: null }, now)).toBe(false);
    expect(shouldCreateReviewDeadlineAlert({ ...base, reviewDeadline: new Date(now.getTime() + 60_000), reviewedAt: null, reviewDeadlineAlertedAt: now }, now)).toBe(false);
    expect(shouldCreateReviewDeadlineAlert({ ...base, reviewDeadline: new Date(now.getTime() - 60_000), reviewedAt: null, reviewDeadlineAlertedAt: null }, now)).toBe(false);
    expect(shouldCreateReviewDeadlineAlert({ ...base, reviewDeadline: new Date(now.getTime() + REVIEW_ALERT_WINDOW_MS + 1), reviewedAt: null, reviewDeadlineAlertedAt: null }, now)).toBe(false);
  });

  it("protège la route planifiée et ne transmet aucune alerte au candidat", () => {
    const handler = read("server/scheduled/evaluationReviewDeadlineAlertJob.ts");
    const server = read("server/_core/index.ts");
    expect(handler).toContain("sdk.authenticateRequest(req)");
    expect(handler).toContain("if (!user.isCron || !user.taskUid)");
    expect(handler).toContain('type: "evaluation_review_deadline"');
    expect(handler).toContain('targetAdminType: "evaluation"');
    expect(handler).not.toContain("sendEmail");
    expect(handler).not.toContain("clientNotifications");
    expect(server).toContain('app.post("/api/scheduled/evaluation-review-deadline-alerts"');
  });
});
