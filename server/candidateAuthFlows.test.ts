import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { hashPasswordResetToken, issuePasswordResetToken } from "./routers/candidate";

const candidateRouterSource = readFileSync(new URL("./routers/candidate.ts", import.meta.url), "utf8");
const emailServiceSource = readFileSync(new URL("./emailService.ts", import.meta.url), "utf8");
const loginSource = readFileSync(new URL("../client/src/pages/Login.tsx", import.meta.url), "utf8");
const forgotSource = readFileSync(new URL("../client/src/pages/ForgotPassword.tsx", import.meta.url), "utf8");
const resetSource = readFileSync(new URL("../client/src/pages/ResetPassword.tsx", import.meta.url), "utf8");

 describe("Candidate registration and password recovery", () => {
  it("creates a high-entropy reset token and stores only its hash contract", () => {
    const issued = issuePasswordResetToken();
    expect(issued.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(issued.rawToken).not.toBe(issued.tokenHash);
    expect(hashPasswordResetToken(issued.rawToken)).toBe(issued.tokenHash);
  });

  it("does not silently report a password-reset email failure", () => {
    expect(candidateRouterSource).toContain("await sendPasswordResetEmail(candidate.email, candidate.fullName, rawToken)");
    expect(candidateRouterSource).toContain('code: "INTERNAL_SERVER_ERROR"');
    expect(emailServiceSource).toContain('console.error("Failed to send password reset email:", error);');
    expect(emailServiceSource).toContain("throw error;");
  });

  it("connects the login modal to the real forgot-password page and preserves the email", () => {
    expect(loginSource).toContain("navigate(`/forgot-password?email=");
    expect(forgotSource).toContain("trpc.candidate.requestPasswordReset.useMutation");
    expect(forgotSource).toContain("query.get(\"email\")");
  });

  it("resets the password using a hashed token, clears it, and then returns to login", () => {
    expect(candidateRouterSource).toContain("const tokenHash = hashPasswordResetToken(input.token);");
    expect(candidateRouterSource).toContain("passwordResetToken: null");
    expect(resetSource).toContain('navigate("/login")');
    expect(resetSource).not.toContain("console.log(\"[ResetPassword]");
    expect(resetSource).not.toContain("console.warn(\"[ResetPassword]");
  });

  it("does not log activation tokens in the browser", () => {
    const verifySource = readFileSync(new URL("../client/src/pages/VerifyEmailLink.tsx", import.meta.url), "utf8");
    expect(verifySource).not.toContain("substring(0, 8)");
    expect(verifySource).toContain("verifyMutation.mutate({ token })");
  });
});
