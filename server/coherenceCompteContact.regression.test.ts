import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_FAQ_ITEMS } from "../shared/publicFaq";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("cohérence compte / contact / confidentialité / annulation", () => {
  it("aligne Accueil, Footer, CTA et FAQ Procédures sur démarrage sans compte", () => {
    const footer = read("client/src/components/Footer.tsx");
    const cta = read("client/src/components/PublicEvaluationCTA.tsx");
    const brand = read("client/src/data/internationalBrand.ts");
    const tarifs = read("client/src/pages/Tarifs.tsx");
    const account = PUBLIC_FAQ_ITEMS.find((item) => item.question === "Faut-il créer un compte avant de commencer ?");

    expect(account?.answer).toMatch(/Non pour démarrer/i);
    expect(account?.answer).toContain("sans compte");
    expect(footer).toContain("sans compte pour démarrer et soumettre");
    expect(footer).not.toContain("déposer un CV avant la soumission");
    expect(cta).toContain("Sans compte pour démarrer et envoyer");
    expect(cta).not.toContain("déposez mon CV");
    expect(brand).toContain("Sans compte pour démarrer et envoyer");
    expect(tarifs).toContain("Sans compte pour démarrer et envoyer");
    expect(composePublicPrerender(shell, "/procedures").html).toContain("sans compte");
    expect(composePublicPrerender(shell, "/procedures").html).not.toContain("Oui. Créez d’abord votre compte");
  });

  it("clarifie WhatsApp vs fixe Yaoundé sur Contact (UI + prerender), aligné Accueil", () => {
    const contact = read("client/src/pages/Contact.tsx");
    const home = read("client/src/pages/Home.tsx");
    const html = composePublicPrerender(shell, "/contact").html;

    expect(contact).toContain('data-testid="contact-yaounde-numbers"');
    expect(contact).toContain("canal principal pour messages");
    expect(contact).toContain("appels vocaux uniquement");
    expect(home).toContain("Canal principal : WhatsApp");
    expect(home).toContain("pour les appels");
    expect(html).toContain("WhatsApp");
    expect(html).toContain("698 104 832");
    expect(html).toContain("620 996 045");
    expect(html).toContain("appels vocaux uniquement");
    expect(html).toContain("même logique que l’accueil");
  });

  it("expose le texte complet de la politique de confidentialité aux extracteurs (lead riche + sections)", () => {
    const html = composePublicPrerender(shell, "/politique-confidentialite").html;
    expect(html).toContain("Politique complète");
    expect(html).toContain("politique-confidentialite-complete");
    expect(html).toContain("1. Objet");
    expect(html).toContain("Données collectées");
    expect(html).toContain("Qui peut consulter vos documents");
    expect(html).toContain("jusqu’à 5 ans");
    expect(html).toContain("Cookies");
    expect(html).toContain("PrivacyPolicy");
    expect(html).toMatch(/description[^>]*Politique complète|Politique complète 3M/i);
    expect(html).not.toMatch(/Les données sensibles sont limitées aux finalités/);
  });

  it("publie un résumé des cas d’annulation/remboursement sur Tarifs avant paiement", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    const html = composePublicPrerender(shell, "/tarifs").html;
    expect(tarifs).toContain('data-testid="tarifs-cancel-cases"');
    expect(tarifs).toContain("Avant protocole / avant paiement");
    expect(tarifs).toContain("Traitement déjà engagé");
    expect(tarifs).toContain("Refus de visa");
    expect(html).toContain("Annulation et remboursement — cas couverts");
    expect(html).toContain("Avant protocole / avant paiement");
    expect(html).toContain("Refus de visa");
  });

  it("purge le service worker pour ce lot de cohérence", () => {
    expect(read("client/public/sw.js")).toContain("3m-travel-pwa-v56-coherence-compte-contact");
  });
});
