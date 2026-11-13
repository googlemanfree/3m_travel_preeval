import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("jeton de session administrateur", () => {
  it("la connexion enregistre la clé lue par le helper commun", () => {
    const helper = read("client/src/lib/adminSession.ts");
    expect(helper).toContain('localStorage.getItem("adminSessionToken")');
  });

  it("aucun composant ne lit l'ancienne clé inexistante « admin_session_token »", () => {
    // Avant correction : la modération des avis affichait toujours « Veuillez vous connecter » et le panneau
    // des paiements de réservation envoyait le jeton factice « active_session ».
    for (const file of ["client/src/pages/AdminCustomerReviews.tsx", "client/src/components/AdminReservationPayments.tsx"]) {
      const source = read(file);
      expect(source, file).not.toMatch(/Storage\.getItem\(["']admin_session_token["']\)/);
      expect(source, file).not.toContain("active_session");
      expect(source, file).toContain("getAdminSessionToken()");
    }
  });
});
