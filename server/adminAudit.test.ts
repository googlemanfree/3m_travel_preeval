import { describe, expect, it } from "vitest";
import { sanitizeAuditDetails, getRequestIp, getRequestUserAgent } from "./services/adminAudit";
import { adminAuditRouter } from "./routers/adminAudit";

describe("admin audit journal", () => {
  it("removes credentials, tokens and private file references from details", () => {
    const sanitized = sanitizeAuditDetails({
      candidateId: 42,
      password: "do-not-store",
      sessionToken: "do-not-store",
      fileUrl: "https://private.example/document.pdf",
      status: "approved",
    });

    expect(sanitized).toContain("candidateId");
    expect(sanitized).toContain("status");
    expect(sanitized).not.toContain("do-not-store");
    expect(sanitized).not.toContain("private.example");
  });

  it("bounds plain-text details before persistence", () => {
    const sanitized = sanitizeAuditDetails("x".repeat(10_000));
    expect(sanitized).toHaveLength(4_000);
  });

  it("extracts the first forwarded IP and bounds user-agent data", () => {
    const ctx = {
      req: {
        headers: {
          "x-forwarded-for": "203.0.113.8, 10.0.0.1",
          "user-agent": "Audit test browser",
        },
        socket: { remoteAddress: "127.0.0.1" },
      },
    } as any;

    expect(getRequestIp(ctx)).toBe("203.0.113.8");
    expect(getRequestUserAgent(ctx)).toBe("Audit test browser");
  });

  it("exposes the admin-only list procedure through the dedicated router", () => {
    expect(adminAuditRouter._def.procedures.list).toBeDefined();
  });
});
