import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("portrait review and recovery workflow", () => {
  it("exposes an animated, accessible detection state", () => {
    const source = read("client/src/components/PortraitCapture.tsx");
    expect(source).toContain("verificationState");
    expect(source).toContain("Analyse du visage en cours");
    expect(source).toContain("animate-pulse");
    expect(source).toContain('aria-live="polite"');
  });

  it("provides a profile action to retake the portrait using the secured upload flow", () => {
    const source = read("client/src/components/CandidateAvatar.tsx");
    expect(source).toContain("Reprendre ma photo");
    expect(source).toContain("verifyHumanPortrait");
    expect(source).toContain("/api/candidate/upload-public");
    expect(source).toContain("portraitVerificationToken");
  });

  it("keeps manual portrait review behind the admin session check", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    const panel = read("client/src/components/AdminPortraitReviewPanel.tsx");
    expect(router).toContain("reviewPortrait:");
    expect(router).toContain("requireAdminSessionFromCookie(ctx.req.headers.cookie)");
    expect(router).toContain('z.enum(["approve", "reject", "request_new"])');
    expect(router).toContain("avatarVerificationStatus: status");
    expect(panel).toContain("adminCandidateManagement.reviewPortrait.useMutation");
    expect(panel).toContain('review(candidate, "request_new")');
    expect(panel).toContain('review(candidate, "reject")');
  });
});
