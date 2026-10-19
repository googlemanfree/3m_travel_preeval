import { describe, expect, it } from "vitest";
import { DEFAULT_FORM_ERROR, describeFormError } from "../client/src/lib/formErrors";

const trpc = (message: string, code: string, httpStatus = 400) => ({ message, data: { code, httpStatus } });

describe("messages d'erreur des formulaires", () => {
  it("nomme les champs invalides au lieu d'afficher du JSON brut", () => {
    const raw = JSON.stringify([
      { code: "invalid_type", path: ["phone"], message: "Invalid input: expected string, received undefined" },
      { code: "too_small", path: ["email"], message: "Email invalide" },
    ]);
    const text = describeFormError(trpc(raw, "BAD_REQUEST"));
    expect(text).toContain("Téléphone / WhatsApp : à renseigner ou à corriger");
    expect(text).toContain("E-mail : Email invalide");
    expect(text).not.toContain("invalid_type");
    expect(text).not.toContain("[");
  });

  it("signale qu'il reste des champs au-delà de trois", () => {
    const raw = JSON.stringify(["a", "b", "c", "d", "e"].map((key) => ({ path: [key], message: "Requis" })));
    expect(describeFormError(trpc(raw, "BAD_REQUEST"))).toContain("(et 2 autres)");
  });

  it("distingue connexion coupée, délai dépassé, fichier trop lourd, trop de tentatives et session expirée", () => {
    expect(describeFormError(new TypeError("Failed to fetch"))).toMatch(/Connexion impossible/);
    expect(describeFormError({ name: "AbortError", message: "The user aborted a request." })).toMatch(/trop de temps/);
    expect(describeFormError(trpc("Payload Too Large", "PAYLOAD_TOO_LARGE", 413))).toMatch(/trop volumineux/);
    expect(describeFormError(trpc("Too many", "TOO_MANY_REQUESTS", 429))).toMatch(/Trop de tentatives/);
    expect(describeFormError(trpc("UNAUTHORIZED", "UNAUTHORIZED", 401))).toMatch(/session a expiré/);
  });

  it("une panne serveur est rassurante, sans détail technique ; un message métier lisible est conservé", () => {
    expect(describeFormError(trpc("ER_DUP_ENTRY: duplicate key at foo (bar.ts:1)", "INTERNAL_SERVER_ERROR", 500))).toMatch(/momentanément indisponible/);
    expect(describeFormError(trpc("Un dossier existe déjà pour cette adresse e-mail.", "INTERNAL_SERVER_ERROR", 500))).toBe("Un dossier existe déjà pour cette adresse e-mail.");
    expect(describeFormError(trpc("Cette adresse e-mail est déjà utilisée.", "CONFLICT", 409))).toBe("Cette adresse e-mail est déjà utilisée.");
  });

  it("replie sur un message par défaut quand rien d'exploitable n'est disponible", () => {
    expect(describeFormError(undefined)).toBe(DEFAULT_FORM_ERROR);
    expect(describeFormError({ message: "TypeError: undefined is not a function" })).toBe(DEFAULT_FORM_ERROR);
    expect(describeFormError({ message: "" }, "Erreur de test")).toBe("Erreur de test");
  });
});
