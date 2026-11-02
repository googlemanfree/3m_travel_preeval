import { expect, test } from "@playwright/test";

const trpcResponse = (data: unknown) => ({
  result: { data: { json: data } },
});

test("le formulaire contact affiche des validations inline compréhensibles", async ({ page }) => {
  await page.goto("/contact");

  const form = page.getByTestId("contact-email-form");
  await form.getByLabel("Nom complet").fill("A");
  await form.getByLabel("E-mail").fill("client@example.com");
  await form.getByLabel("Sujet").fill("X");
  await form.getByLabel("Message").fill("Court");
  await form.locator("form").evaluate((node) => node.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

  await expect(page.locator("#contact-name-help")).toContainText("Indiquez votre nom complet");
  await expect(page.locator("#contact-subject-help")).toContainText("Précisez brièvement le sujet");
  await expect(page.locator("#contact-message-help")).toContainText("Votre message doit contenir au moins 10 caractères");
  await expect(page.getByText(/Vérifiez les champs signalés/)).toBeVisible();
  await expect(form.getByLabel("Nom complet")).toHaveAttribute("aria-invalid", "true");
});

test("la recherche employeurs filtre les profils et peut être réinitialisée", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("3m_placement_employer_session", "e2e-session-token-123456789012345678901234567890");
    void navigator.serviceWorker?.getRegistrations().then(registrations => registrations.forEach(registration => void registration.unregister()));
  });

  await page.context().route("**/api/trpc/**", async route => {
    const procedure = decodeURIComponent(new URL(route.request().url()).pathname.split("/api/trpc/")[1] ?? "");
    let data: unknown = null;
    if (procedure.includes("employerSessionInfo")) {
      data = { organization: { name: "Organisation E2E", country: "Cameroun", organizationType: "employer" } };
    } else if (procedure.includes("employerProfiles")) {
      data = [{
        submissionId: 1,
        status: "submitted",
        submittedAt: null,
        lastResponseAt: null,
        isFavorite: false,
        privateNote: null,
        sharedWithMe: null,
        outgoingShares: [],
        profile: {
          code: "PRF-ALPHA",
          summary: "Profil logistique pour un projet de travail au Canada.",
          targetDestination: "Canada",
          targetProcedure: "Travail",
          sector: "Logistique",
          yearsExperience: "5 ans",
          languagesSummary: "Français",
          summaryStatus: "published",
          summaryAvailable: true,
          summaryUnavailableReason: null,
        },
      }];
    } else if (procedure.includes("employerCollaborators")) {
      data = { currentRole: "manager", collaborators: [] };
    } else if (procedure.includes("employerNotifications")) {
      data = [];
    } else if (procedure.includes("employerTwoFactorStatus")) {
      data = { enabled: false };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([trpcResponse(data)]),
    });
  });

  await page.goto("/employeurs");
  const search = page.getByTestId("partner-profile-search");
  await expect(search).toBeVisible();
  await expect(page.getByTestId("partner-profile-search-status")).toContainText("Recherchez par code");

  await search.fill("Canada");
  await expect(page.getByTestId("partner-profile-search-status")).toContainText("1 résultat");
  await expect(page.getByText("PRF-ALPHA")).toBeVisible();

  await page.getByRole("button", { name: "Effacer la recherche" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByTestId("partner-profile-search-status")).toContainText("Recherchez par code");
});
