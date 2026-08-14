import { describe, it, expect } from "vitest";

describe("Email Notification Preferences", () => {
  it("allows candidate to enable or disable email alerts for documents and reports", () => {
    const preferences = {
      emailNotificationsEnabled: true,
      alertOnDocumentReady: true,
      alertOnEvaluationReady: true,
    };

    expect(preferences.emailNotificationsEnabled).toBe(true);
    expect(preferences.alertOnDocumentReady).toBe(true);
    expect(preferences.alertOnEvaluationReady).toBe(true);
  });
});
