import { describe, it, expect } from "vitest";

describe("Resend API Key", () => {
  it("should send a test email successfully", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY doit être défini").toBeTruthy();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "3M Travel <onboarding@resend.dev>",
        to: ["3mtravelandservices@gmail.com"],
        subject: "Test Resend — 3M Travel Agency",
        html: "<p>✅ Test d'envoi email Resend réussi pour 3M Travel Agency.</p>",
      }),
    });

    const data = await res.json() as { id?: string; name?: string; message?: string };
    console.log("Resend response:", data);

    expect(res.ok, `Resend API erreur: ${JSON.stringify(data)}`).toBe(true);
    expect(data.id, "L'email doit avoir un ID Resend").toBeTruthy();
  }, 15000);
});
