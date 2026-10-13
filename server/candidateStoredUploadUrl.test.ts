import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  isOpenableStoredUrl,
  portraitVerificationTokenSchema,
  storedUploadUrlSchema,
} from "../shared/storedFileUrl";
import { createPortraitProof, verifyPortraitProof } from "./portraitVerification";

const REAL_PORTRAIT = "/manus-storage/applications/pending-portraits/photo_identite/1760000000000-abc123-portrait.webp";

describe("URLs de dépôt candidat (`/manus-storage/…`)", () => {
  it("accepte les adresses proxy renvoyées par storagePut et les https historiques", () => {
    expect(storedUploadUrlSchema.safeParse(REAL_PORTRAIT).success).toBe(true);
    expect(storedUploadUrlSchema.safeParse("https://files.example.com/portrait.webp").success).toBe(true);
    expect(isOpenableStoredUrl(REAL_PORTRAIT)).toBe(true);
  });

  it("refuse javascript:, chemins site, clés suspectes — cause historique du invalid_format avatarUrl", () => {
    for (const bad of ["javascript:alert(1)", "/admin", "/api/trpc/x", "/manus-storage/../x", "", "not-a-url"]) {
      expect(storedUploadUrlSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("accepte un jeton portrait jusqu’à 2048 caractères (ex-plafond 512 trop court avec URL complète)", () => {
    const longToken = "a".repeat(1024);
    expect(portraitVerificationTokenSchema.safeParse(longToken).success).toBe(true);
    expect(portraitVerificationTokenSchema.safeParse("a".repeat(2049)).success).toBe(false);
    expect(portraitVerificationTokenSchema.safeParse("short").success).toBe(false);
  });
});

describe("preuve portrait compacte (clé seule, pas l’URL complète)", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-stored-upload-secret";
  });

  it("signe uniquement la clé et reconstruit `/manus-storage/<clé>` à la vérification", () => {
    const proof = createPortraitProof({
      email: "candidat@example.test",
      key: "applications/pending-portraits/photo_identite/1760000000000-abc123-portrait.webp",
      url: REAL_PORTRAIT,
      captureMethod: "gallery",
    });
    const decoded = jwt.decode(proof) as { key?: string; url?: string };
    expect(decoded.key).toBe("applications/pending-portraits/photo_identite/1760000000000-abc123-portrait.webp");
    expect(decoded.url).toBeUndefined();
    expect(proof.length).toBeLessThan(512);

    const verified = verifyPortraitProof(proof, "candidat@example.test", REAL_PORTRAIT);
    expect(verified.url).toBe(REAL_PORTRAIT);
    expect(verified.key).toBe("applications/pending-portraits/photo_identite/1760000000000-abc123-portrait.webp");
    expect(verified.captureMethod).toBe("gallery");
  });

  it("accepte encore un ancien jeton qui embarquait l’URL sans clé explicite", () => {
    const legacy = jwt.sign(
      {
        type: "candidate_portrait",
        email: "candidat@example.test",
        url: REAL_PORTRAIT,
        captureMethod: "camera",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m", subject: "candidat@example.test" },
    );
    const verified = verifyPortraitProof(legacy, "candidat@example.test", REAL_PORTRAIT);
    expect(verified.url).toBe(REAL_PORTRAIT);
    expect(verified.key).toContain("pending-portraits");
  });

  it("refuse un jeton rejoué avec une autre URL avatar", () => {
    const proof = createPortraitProof({
      email: "candidat@example.test",
      key: "applications/pending-portraits/photo_identite/portrait.webp",
      url: "/manus-storage/applications/pending-portraits/photo_identite/portrait.webp",
      captureMethod: "camera",
    });
    expect(() =>
      verifyPortraitProof(proof, "candidat@example.test", "/manus-storage/applications/pending-portraits/autre.webp"),
    ).toThrow(/plus valide/);
  });
});
