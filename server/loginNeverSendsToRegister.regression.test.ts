import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("« Se connecter » ne renvoie jamais vers l'inscription", () => {
  const complete = read("client/src/pages/CompleteProfile.tsx");
  const login = read("client/src/pages/Login.tsx");
  const employer = read("client/src/pages/EmployerPortal.tsx");

  it("l'activation de l'espace n'envoie plus vers /register et conserve la page demandée", () => {
    expect(complete).not.toContain('navigate("/register")');
    expect(complete).toContain('navigate("/login")');
    expect(complete).toContain("resolveCandidateReturnPath(from)");
    expect(login.split("&from=${encodeURIComponent(from)}").length - 1).toBe(2);  });

  it("un candidat connecté voit qu'il finalise son espace, peut le faire plus tard et n'est pas renvoyé à la connexion", () => {
    expect(complete).toContain('data-testid="complete-profile-signed-in"');
    expect(complete).toContain("Ce n’est pas une nouvelle inscription");
    // Le portrait vérifié est obligatoire : aucune échappatoire « plus tard ».
    expect(complete).not.toContain("complete-profile-later");
    expect(complete).toContain("un portrait vérifié est obligatoire");
    expect(complete).toContain('toast.success("Votre espace est activé.")');
  });

  it("un compte précréé reçoit directement une action caméra ou galerie pour fournir son portrait", () => {
    expect(complete).toContain('data-testid="complete-profile-portrait-action"');
    expect(complete).toContain("<PortraitCapture");
    expect(complete).toContain("Action requise pour continuer");
    expect(complete).toContain("handlePortraitVerified");
  });

  it("ne tente pas de valider le profil depuis l’étape Profession avant d’afficher la photo", () => {
    expect(complete).toContain("if (step < 4)");
    expect(complete).toContain("Étape 4: Photo de profil obligatoire");
  });

  it("un accès partenaire en cours de vérification ne pousse pas à se réinscrire", () => {
    expect(employer).toContain('data-testid="partner-login-pending"');
    expect(employer).toContain("Inutile de vous réinscrire");
    expect(employer).toContain('/non vérifié/i.test(login.error.message) ? "/contact"');
  });
});
