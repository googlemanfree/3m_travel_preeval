import { describe, expect, it } from "vitest";
import { INITIAL_SYNC_MESSAGE, formatAdminSyncTime } from "../shared/adminSync";

describe("admin sync display", () => {
  it("shows a clear message before the first synchronization", () => {
    expect(formatAdminSyncTime(null)).toBe(INITIAL_SYNC_MESSAGE);
  });

  it("formats a completed synchronization as a localized date and time", () => {
    const result = formatAdminSyncTime(new Date("2026-08-11T18:30:00.000Z"), "en-GB");
    expect(result).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
