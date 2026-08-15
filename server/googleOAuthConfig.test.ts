import { describe, expect, it } from "vitest";

describe("Configuration OAuth Google", () => {
  it("accepte les identifiants configurés auprès du point de jeton Google sans les exposer", async () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: "refresh_token",
        // Valeur volontairement invalide : le test vérifie l’acceptation du client,
        // sans nécessiter ni créer de session utilisateur OAuth.
        refresh_token: "oauth_configuration_probe",
      }),
    });

    const payload = (await response.json()) as { error?: string };
    expect(payload.error).not.toBe("invalid_client");
    expect([400, 401]).toContain(response.status);
  }, 20_000);
});
