import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readProjectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("admin client-space control audit", () => {
  it("refreshes candidate and payment lists after a successful payment action", () => {
    const payment = readProjectFile("client/src/components/AdminPaymentManagement.tsx");
    const dashboard = readProjectFile("client/src/pages/AdminDashboard.tsx");
    expect(payment).toContain("onPaymentUpdated?.()");
    expect(dashboard).toContain("trpcUtils.admin.listCandidates.invalidate()");
    expect(dashboard).toContain("trpcUtils.application.listApplications.invalidate()");
  });

  it("keeps Candidate360 mutations behind a verified admin session", () => {
    const admin = readProjectFile("server/routers/admin.ts");
    for (const procedure of [
      "updateCandidate360Workflow",
      "updateCandidate360Deadline",
      "addCandidate360Task",
      "completeCandidate360Task",
      "sendCandidate360DocumentReminder",
      "updateDocumentClarificationDeadline",
      "sendCandidate360Message",
    ]) {
      const start = admin.indexOf(`${procedure}:`);
      expect(start).toBeGreaterThan(-1);
      const body = admin.slice(start, start + 2200);
      expect(body).toContain("requireValidAdminSession(input.sessionToken)");
    }
  });
});
