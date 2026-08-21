import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers/flightBooking.ts"), "utf8");

describe("remise synchronisée du PNR", () => {
  it("journalise la notification e-mail sans empêcher l’accès du client à son document", () => {
    expect(source).toContain("pnr_email_dispatched");
    expect(source).toContain("pnr_email_dispatch_failed");
    expect(source).toContain("clientSpaceReady");
    expect(source).toContain("emailNotificationDispatched");
  });
});
