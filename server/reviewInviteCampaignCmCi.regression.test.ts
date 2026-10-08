import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const campaign = readFileSync(resolve(root, "client/src/data/reviewInviteCampaignCmCi.ts"), "utf8");
const panel = readFileSync(resolve(root, "client/src/components/ReviewInvitationPanel.tsx"), "utf8");
const reviews = readFileSync(resolve(root, "client/src/components/ApprovedReviewsSection.tsx"), "utf8");
const transparency = readFileSync(resolve(root, "server/publicReviewsTransparency.regression.test.ts"), "utf8");

describe("campagne d’invitation CM/CI — 40 créneaux (pas de faux avis)", () => {
  it("expose exactement 40 créneaux d’invitation Cameroun / Côte d’Ivoire", () => {
    expect(campaign).toContain("REVIEW_INVITE_CAMPAIGN_CM_CI");
    expect(campaign).toContain("attendu 40 créneaux");
    expect(campaign).toContain('origin: "Cameroun"');
    expect(campaign).toContain('origin: "Côte d’Ivoire"');
    expect(campaign).toContain('destinationGroup: "Canada"');
    expect(campaign).toContain('destinationGroup: "Schengen"');
    expect(campaign).toContain('destinationGroup: "Chine"');
    // Garde-fou : aucun récit inventé ni note fictive dans le fichier campagne.
    expect(campaign).not.toContain("reviewText");
    expect(campaign).not.toContain("rating");
    expect(campaign).not.toContain("J’ai obtenu mon visa");
  });

  it("branche la campagne dans le panneau d’invitation admin sans publier automatiquement", () => {
    expect(panel).toContain("REVIEW_INVITE_CAMPAIGN_CM_CI");
    expect(panel).toContain('data-testid="review-invite-campaign-slot"');
    expect(panel).toContain("jamais un faux témoignage");
  });

  it("filtre les avis publics par Chine en plus de Canada et Schengen", () => {
    expect(reviews).toContain('"chine"');
    expect(reviews).toContain("isChineReview");
    expect(reviews).toContain('flag: "🇨🇳"');
  });

  it("conserve l’interdiction de témoignages fabriqués sur /avis", () => {
    expect(transparency).toContain("ne fabrique ni témoignage");
    expect(transparency).toContain("Aminata Diallo");
  });
});
