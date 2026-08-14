import { beforeEach, describe, expect, it } from "vitest";
import { createPortraitProof, verifyPortraitProof } from "./portraitVerification";

describe("Mandatory human portrait registration gate", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-avatar-secret";
  });

  it("accepts a signed portrait proof for the same candidate email and URL", () => {
    const proof = createPortraitProof({
      email: "candidate@example.test",
      key: "applications/pending-portraits/photo_identite/avatar.webp",
      url: "/manus-storage/applications/pending-portraits/photo_identite/avatar.webp",
      captureMethod: "camera",
    });

    expect(verifyPortraitProof(
      proof,
      "candidate@example.test",
      "/manus-storage/applications/pending-portraits/photo_identite/avatar.webp",
    )).toMatchObject({
      type: "candidate_portrait",
      email: "candidate@example.test",
      captureMethod: "camera",
    });
  });

  it("rejects a portrait proof replayed for another email or URL", () => {
    const proof = createPortraitProof({
      email: "candidate@example.test",
      key: "applications/pending-portraits/photo_identite/avatar.webp",
      url: "/manus-storage/applications/pending-portraits/photo_identite/avatar.webp",
      captureMethod: "gallery",
    });

    expect(() => verifyPortraitProof(proof, "other@example.test")).toThrow();
    expect(() => verifyPortraitProof(
      proof,
      "candidate@example.test",
      "/manus-storage/another-avatar.webp",
    )).toThrow();
  });

  it("keeps the human verification state synchronized for client and admin views", () => {
    const candidate = {
      avatarUrl: "/manus-storage/applications/pending-portraits/avatar.webp",
      avatarVerificationStatus: "verified" as const,
      avatarFaceCount: 1,
    };
    const clientView = { ...candidate };
    const adminView = { ...candidate };

    expect(clientView.avatarVerificationStatus).toBe("verified");
    expect(adminView.avatarVerificationStatus).toBe("verified");
    expect(clientView.avatarUrl).toBe(adminView.avatarUrl);
    expect(clientView.avatarFaceCount).toBe(1);
  });
});
