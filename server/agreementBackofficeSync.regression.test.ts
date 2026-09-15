import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("agreement synchronization between candidate space and Candidate360", () => {
  const adminRouter = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
  const candidate360 = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");

  it("returns the application agreement state to Candidate360", () => {
    expect(adminRouter).toContain("agreement: reference.source === \"online\"");
    expect(adminRouter).toContain("agreementSignedAt");
    expect(adminRouter).toContain("agreementSignatureName");
  });

  it("uses the synchronized agreement state for the coherence check", () => {
    expect(candidate360).toContain("const agreementState: any = (data as any).agreement ?? (data as any).protocol ?? null;");
    expect(candidate360).toContain("agreementState?.signedAt || agreementState?.agreementSignedAt");
  });
});
