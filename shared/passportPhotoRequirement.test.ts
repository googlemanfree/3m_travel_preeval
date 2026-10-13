import { describe, expect, it } from "vitest";
import {
  PASSPORT_PHOTO_DEPOSITED_REASON,
  PASSPORT_PHOTO_REQUEST_BODY,
  hasPassportPhotoDeposited,
  isWorkVisaForPassportPhoto,
  passportPhotoAdminStatus,
  requiresPassportPhotoUpload,
} from "./passportPhotoRequirement";

describe("passportPhotoRequirement", () => {
  it("détecte les visas travail", () => {
    expect(isWorkVisaForPassportPhoto("Travail")).toBe(true);
    expect(isWorkVisaForPassportPhoto("canada_travail")).toBe(true);
    expect(isWorkVisaForPassportPhoto("Études")).toBe(false);
  });

  it("exige la photo après activation visa travail", () => {
    expect(
      requiresPassportPhotoUpload({
        dossierStatus: "documents",
        visaType: "Travail",
        avatarVerificationReason: "Portrait humain détecté",
      }),
    ).toBe(true);
    expect(
      requiresPassportPhotoUpload({
        dossierStatus: "documents",
        visaType: "Études",
        avatarVerificationReason: null,
      }),
    ).toBe(false);
    expect(
      requiresPassportPhotoUpload({
        dossierStatus: "documents",
        visaType: "Travail",
        avatarVerificationReason: PASSPORT_PHOTO_DEPOSITED_REASON,
      }),
    ).toBe(false);
  });

  it("reconnaît demande et dépôt", () => {
    expect(hasPassportPhotoDeposited(PASSPORT_PHOTO_DEPOSITED_REASON)).toBe(true);
    expect(hasPassportPhotoDeposited(PASSPORT_PHOTO_REQUEST_BODY)).toBe(false);
    expect(
      requiresPassportPhotoUpload({
        dossierStatus: "documents",
        visaType: "Études",
        forceRequest: true,
      }),
    ).toBe(true);
  });

  it("statut admin lecture seule : attendue / déposée / aucune", () => {
    expect(passportPhotoAdminStatus({ avatarVerificationReason: PASSPORT_PHOTO_REQUEST_BODY })).toBe("awaiting");
    expect(passportPhotoAdminStatus({ avatarVerificationReason: PASSPORT_PHOTO_DEPOSITED_REASON })).toBe("deposited");
    expect(passportPhotoAdminStatus({ avatarVerificationReason: null })).toBe("none");
  });
});
