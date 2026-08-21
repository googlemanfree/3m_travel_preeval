import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/FlightAgentDashboard.tsx"), "utf8");

describe("poste opérationnel de réservation de vols", () => {
  it("affiche le suivi client du PNR et permet une relance uniquement avant téléchargement", () => {
    expect(source).toContain("Consultation client");
    expect(source).toContain("pnrReminderMutation");
    expect(source).toContain("Relancer le PNR");
    expect(source).toContain("!detailQuery.data.request.pnrDownloadedAt");
  });
});
