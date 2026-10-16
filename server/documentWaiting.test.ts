import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { summarizeWaiting, waitingInfo } from "../shared/documentWaiting";

const now = new Date("2026-10-16T12:00:00Z");
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000);

describe("attente des pièces à vérifier", () => {
  it("niveaux : normal avant 48 h, à traiter dès 48 h, en retard dès 7 jours", () => {
    expect(waitingInfo(hoursAgo(5), now)).toMatchObject({ level: "ok", label: "en attente depuis 5 h" });
    expect(waitingInfo(hoursAgo(47), now)?.level).toBe("ok");
    expect(waitingInfo(hoursAgo(48), now)).toMatchObject({ level: "late", label: "en attente depuis 2 j" });
    expect(waitingInfo(hoursAgo(24 * 7), now)).toMatchObject({ level: "overdue", label: "en attente depuis 7 j" });
    expect(waitingInfo(hoursAgo(0), now)?.label).toBe("reçue à l'instant");
  });

  it("date absente, invalide ou dans le futur : pas d'attente inventée", () => {
    expect(waitingInfo(null, now)).toBeNull();
    expect(waitingInfo("pas une date", now)).toBeNull();
    expect(waitingInfo(new Date(now.getTime() + 3600 * 1000), now)?.hours).toBe(0);
  });

  it("ne compte que les pièces en attente et repère la plus ancienne", () => {
    const summary = summarizeWaiting(
      [
        { verificationStatus: "pending", submittedAt: hoursAgo(3) },
        { verificationStatus: "pending", submittedAt: hoursAgo(60) },
        { verificationStatus: "pending", submittedAt: hoursAgo(24 * 10) },
        { verificationStatus: "approved", submittedAt: hoursAgo(24 * 30) },
        { verificationStatus: "rejected", submittedAt: hoursAgo(24 * 30) },
        { verificationStatus: "pending", submittedAt: null },
      ],
      now,
    );
    expect(summary).toEqual({ pending: 3, late: 2, overdue: 1, oldestHours: 240 });
    expect(summarizeWaiting([], now)).toEqual({ pending: 0, late: 0, overdue: 0, oldestHours: null });
  });

  it("l'écran des pièces affiche la file, le badge d'attente et le raccourci « plus anciennes d'abord »", () => {
    const source = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/AdminDocumentsManagement.tsx"), "utf8").replace(/\r/g, "");
    expect(source).toContain("const waitingSummary = summarizeWaiting(documents);");
    expect(source).toContain('data-testid="documents-waiting-queue"');
    expect(source).toContain('setFilterStatus("pending"); setSortBy("uploadedAt"); setSortDirection("asc");');
    expect(source).toContain("waitingInfo(doc.submittedAt)");
  });
});
