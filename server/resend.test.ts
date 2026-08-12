import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  const runExternal = process.env.RUN_EXTERNAL_EMAIL_TESTS === "true";

  it.skipIf(!runExternal)("should validate the Resend API key by checking account status", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    
    // Check if API key is set
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^re_/);
    
    // Try to use the API key
    const resend = new Resend(apiKey);
    
    // Try to send a test email to the testing address
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "delivered@resend.dev",
      subject: "Test Email - 3M Travel Agency",
      html: "<p>This is a test email to validate the Resend API key.</p>",
    });
    
    // Check if the email was sent successfully
    expect(response.error).toBeNull();
    expect(response.data?.id).toBeDefined();
    console.log("✅ Resend API key is valid. Email ID:", response.data?.id);
  });
});
