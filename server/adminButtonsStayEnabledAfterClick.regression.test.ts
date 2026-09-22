import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Signalé par l'utilisateur (2026-09-22) : « les boutons côté admin restent actifs malgré le clic ».
 * Repéré par analyse statique (AST) : boutons dont le clic déclenche une mutation (envoi d'e-mail,
 * bascule de statut, suppression…) sans jamais désactiver ce même bouton pendant que la requête est
 * en cours — un double-clic peut alors déclencher l'action deux fois (ex. un e-mail envoyé deux fois
 * au candidat). Chaque cas ci-dessous a été vérifié individuellement (pas un faux positif dû à un état
 * local du type `isLoading` déjà correctement câblé, comme dans AdminDocumentsManagement.tsx).
 */
describe("boutons administrateur : désactivés pendant leur propre action", () => {
  it("Admin Évaluation : « Retenter l'envoi » (panneau de détail d'un rapport IA)", () => {
    const source = read("client/src/pages/AdminEvaluation.tsx");
    expect(source).toContain("disabled={retryReportMutation.isPending}");
  });

  it("Catalogue e-Visa : bascule Masquer/Réactiver une destination", () => {
    const source = read("client/src/components/AdminEvisaCatalogueManager.tsx");
    expect(source).toContain("disabled={setActive.isPending}");
  });

  it("Cloche de notifications admin : « Tout marquer comme lu » et « Marquer comme lu »", () => {
    const source = read("client/src/components/AdminNotificationBell.tsx");
    expect(source).toContain("disabled={markAllAsRead.isPending}");
    expect(source).toContain("disabled={markAsRead.isPending}");
  });

  it("Demandes tourisme : « Enregistrer le devis & les notes »", () => {
    const source = read("client/src/components/AdminTourismRequests.tsx");
    expect(source).toContain("disabled={updateDetails.isPending}");
  });

  it("Dossiers agence : restaurer un dossier et envoyer une relance", () => {
    const source = read("client/src/pages/AdminAgencyDossiers.tsx");
    expect(source).toContain("disabled={restoreMutation.isPending}");
    expect(source).toContain("disabled={reminderMutation.isPending}");
  });

  it("Médiathèque admin : suppression d'un média", () => {
    const source = read("client/src/pages/AdminMediaLibrary.tsx");
    expect(source).toContain("disabled={removeMutation.isPending}");
  });
});
