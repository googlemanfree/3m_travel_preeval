import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PASSPORT_IDENTITY_KIND,
  buildPassportIdentity,
  comparePassportWithCandidate,
  normalizeFlexibleDate,
  parseIsoDate,
  parsePassportIdentity,
  passportExpiryStatus,
  validatePassportIdentityInput,
} from "../shared/passportIdentity";

const today = new Date("2026-10-16T09:00:00Z");
const valid = { surname: "NKOLO", givenNames: "Aïcha Marie", dateOfBirth: "1995-03-14", passportNumber: "ab123456", expiryDate: "2030-05-01", plannedTravelDate: null };

describe("validité du passeport", () => {
  it("expiré : signalé avec le nombre de jours", () => {
    const result = passportExpiryStatus("2026-09-01", today);
    expect(result.status).toBe("expired");
    expect(result.daysLeft).toBeLessThan(0);
    expect(result.message).toContain("expiré");
  });

  it("valable mais moins de 6 mois après aujourd'hui : validité insuffisante, sans trancher pour la destination", () => {
    const result = passportExpiryStatus("2027-02-01", today);
    expect(result.status).toBe("too_short");
    expect(result.message).toContain("à vérifier pour la destination");
    expect(result.mustBeValidUntil).toBe("2027-04-16");
  });

  it("la date de voyage prévue décale l'exigence de 6 mois", () => {
    expect(passportExpiryStatus("2027-12-01", today, "2027-08-01").status).toBe("too_short");
    expect(passportExpiryStatus("2027-12-01", today, "2027-03-01").status).toBe("ok");
  });

  it("valable bien au-delà : conforme ; date absente ou invalide : non contrôlée", () => {
    expect(passportExpiryStatus("2030-05-01", today).status).toBe("ok");
    expect(passportExpiryStatus("", today).status).toBe("unknown");
    expect(passportExpiryStatus("2030-02-31", today).status).toBe("unknown");
  });

  it("fin de mois : 31 août + 6 mois = fin février (pas de débordement sur mars)", () => {
    expect(passportExpiryStatus("2030-01-01", new Date("2026-08-31T00:00:00Z")).mustBeValidUntil).toBe("2027-02-28");
  });
});

describe("cohérence avec la fiche candidat", () => {
  const identity = { surname: "NKOLO", givenNames: "Aïcha Marie", dateOfBirth: "1995-03-14" };

  it("même personne malgré accents, casse, ordre et prénom secondaire manquant : aucun écart", () => {
    expect(comparePassportWithCandidate({ fullName: "aicha nkolo", dateOfBirth: "1995-03-14" }, identity)).toEqual([]);
    expect(comparePassportWithCandidate({ fullName: "NKOLO Aïcha Marie", dateOfBirth: "14/03/1995" }, identity)).toEqual([]);
  });

  it("nom différent : écart signalé ; date de naissance différente : écart signalé", () => {
    const result = comparePassportWithCandidate({ fullName: "Fatou Diallo", dateOfBirth: "1990-01-01" }, identity);
    expect(result.map((item) => item.field).sort()).toEqual(["dateOfBirth", "name"]);
    expect(result.every((item) => item.message.includes("à confirmer avec le candidat"))).toBe(true);
  });

  it("date de naissance absente de la fiche : pas d'écart inventé", () => {
    expect(comparePassportWithCandidate({ fullName: "Aïcha Nkolo", dateOfBirth: null }, identity)).toEqual([]);
  });
});

describe("saisie et stockage", () => {
  it("valide la saisie d'un agent et refuse les valeurs incohérentes", () => {
    expect(validatePassportIdentityInput(valid, today)).toBeNull();
    expect(validatePassportIdentityInput({ ...valid, passportNumber: "12" }, today)).toMatch(/numéro/);
    expect(validatePassportIdentityInput({ ...valid, dateOfBirth: "2999-01-01" }, today)).toMatch(/futur/);
    expect(validatePassportIdentityInput({ ...valid, expiryDate: "1990-01-01" }, today)).toMatch(/postérieure/);
    expect(validatePassportIdentityInput({ ...valid, expiryDate: "2030-13-40" }, today)).toMatch(/expiration/);
    expect(validatePassportIdentityInput({ ...valid, surname: "  " }, today)).toMatch(/nom de famille/i);
  });

  it("l'identité se relit telle qu'écrite ; tout autre contenu (anciens blocs inventés, JSON invalide) est ignoré", () => {
    const stored = JSON.stringify(buildPassportIdentity(valid, "agent@3mtravelagency.com", today));
    const parsed = parsePassportIdentity(stored)!;
    expect(parsed.kind).toBe(PASSPORT_IDENTITY_KIND);
    expect(parsed.passportNumber).toBe("AB123456");
    expect(parsed.enteredBy).toBe("agent@3mtravelagency.com");
    const legacyFake = JSON.stringify({ documentTypeDetected: "Passeport Biométrique", expirationDate: "2029-10-16", keyFields: [] });
    expect(parsePassportIdentity(legacyFake)).toBeNull();
    expect(parsePassportIdentity("pas du json")).toBeNull();
    expect(parsePassportIdentity(null)).toBeNull();
  });

  it("dates : formats acceptés et refusés", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(normalizeFlexibleDate("5/3/1995")).toBe("1995-03-05");
    expect(normalizeFlexibleDate("n'importe quoi")).toBeNull();
  });
});

describe("plus aucune fausse extraction", () => {
  const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r/g, "");

  it("le dépôt d'une pièce n'enregistre plus de valeurs inventées d'après le nom du fichier", () => {
    expect(existsSync(resolve(import.meta.dirname, "services/documentExtractorService.ts"))).toBe(false);
    expect(read("server/routers/candidate.ts")).not.toContain("documentExtractorService");
    expect(read("server/routers/candidate.ts")).not.toContain("extractedData: extractionJson");
  });
});
