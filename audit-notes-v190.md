# Audit complet du site — notes de vérification

## Parcours publics et accès — 15 août 2026

| Parcours vérifié | Résultat observé | Priorité | Note |
|---|---|---:|---|
| Accueil `/` | Accessible et riche en contenu, mais navigation et hiérarchie visuelle très denses | Moyenne | L’écran mêle beaucoup de styles, de couleurs et d’icônes ; il demeure fonctionnel dans l’aperçu. |
| Inscription `/register` | Accessible | Haute à vérifier | Le formulaire exige le portrait humain avant l’inscription et présente des CTA Google/Facebook à contrôler comme intégrations réelles ou placeholders. |
| Connexion `/login` | Accessible | Basse | Les entrées Inscription, renvoi d’e-mail et mot de passe oublié sont présentes et lisibles. |
| Mot de passe oublié `/forgot-password` | Accessible | Basse | Le parcours affiche le formulaire et annonce une expiration du lien après une heure. |
| Confirmation e-mail invalide | État d’erreur propre | Basse | Le renvoi de l’e-mail et les sorties de secours sont présents. |
| Réinitialisation avec token de test | Formulaire affiché | Basse | Le parcours de succès réel nécessite un token valide et sera analysé côté serveur/tests. |
| Évaluation Canada `/evaluation-canada` | **404 dans l’aperçu** | Haute | À comparer avec la route déclarée dans `App.tsx` et corriger si le lien public est cassé. |
| Administration `/admin` | Accès protégé | Basse | Le garde-fou admin et la connexion sont visuellement cohérents. |

## Constats transverses

Le design public est fonctionnel, mais l’expérience d’accueil est surchargée : navigation emoji-heavy, nombreuses couleurs d’accent, cartes et CTA simultanés. La cohérence de marque et la hiérarchie éditoriale constituent une amélioration UX non bloquante. Les pages d’authentification sont visuellement plus homogènes que la page d’accueil. Le 404 de l’évaluation Canada est le premier défaut fonctionnel prioritaire détecté.

## Données et délivrabilité e-mail

| Contrôle | Constat | Risque | Priorité |
|---|---|---|---:|
| Données opérationnelles | 2 candidats, 2 administrateurs, 6 événements d’audit, 629 journaux e-mail ; aucun document, dossier candidat ou paiement dans les tables contrôlées | La recette ne valide pas encore les parcours métier avec de vraies données candidates | Moyenne |
| E-mails | 579 journaux en échec contre 50 envoyés | Les confirmations, dossiers et resets peuvent ne pas atteindre les candidats | Haute |
| Principale cause d’échec | 517 échecs historiques concernent des adresses de test `example.com` ; 40 autres proviennent d’un domaine Resend non vérifié | Les tests ont pollué les métriques et le domaine Resend reste un risque de reprise | Haute |
| Canal actuel | Les dernières procédures utilisent SMTP, mais les journaux historiques contiennent encore de nombreux échecs Resend | Nécessite une supervision distincte des anciens et nouveaux canaux | Moyenne |

## Routes et liens

La route `/evaluation-canada` n’est pas montée dans `App.tsx`, alors que deux tests de partage continuent de générer cette URL. Elle produit un 404 dans l’aperçu. Le parcours d’évaluation actif est `/evaluation`, actuellement protégé par authentification. Cette incohérence affecte les liens partagés et doit être corrigée en priorité.

Une seconde vérification, après redémarrage du serveur, confirme que `/evaluation-canada` affiche un 404. Cet écran d’erreur est en anglais (`Page Not Found`, `Go Home`) alors que l’interface ciblée est francophone ; le lien partagé est donc simultanément cassé et mal localisé.

## Services et espaces protégés — vérification visuelle

| Zone | Résultat observé | Priorité | Note |
|---|---|---:|---|
| Vols `/flights` | Formulaires de recherche et demande de devis visibles | Moyenne | Le bloc assistant inférieur est si pâle qu’il est presque illisible ; à tester aussi avec une recherche réelle et une source tarifaire connectée. |
| Assurance `/assurance` | Formulaire structuré, progression et consentement visibles | Basse | Le message indique correctement que le numéro de passeport n’est pas transmis dans WhatsApp. |
| Procédures `/procedures` | Catalogue très complet affiché | Moyenne | Très forte densité de cartes sur la page ; filtrage présent mais charge cognitive importante. |
| e‑Visa `/evisas` | Grille de destinations et filtres fonctionnels visuellement | Basse | Les détails de chaque destination doivent être contrôlés avec un clic réel. |
| Ressources `/ressources` | Bibliothèque de guides et boutons de téléchargement visibles | Haute à vérifier | Le contrôle d’authentification et les liens vers des documents privés doivent être testés au clic. |
| Espace client `/mon-espace` | Porte d’accès candidate correcte | Basse | Le garde-fou d’authentification est clair et offre connexion/inscription. |
| Connexion admin `/admin/login` | Écran fonctionnel | Moyenne | L’e-mail prérempli est `admin@3mtravelagency.com`, différent des deux comptes admin actuellement présents dans les données contrôlées ; risque de confusion ou de faux échec de connexion. |
| Tableau admin `/admin/dashboard` | Accès bloqué sans session | Basse | Le contrôle d’accès non authentifié est visuellement présent. |

## Mobile — vérification visuelle

Les pages d’inscription, de connexion, de récupération du mot de passe, de vols, d’assurance, d’e‑Visa et de ressources restent accessibles à 375 px de large. Les champs et CTA principaux ne sont pas coupés. Deux sujets restent à prioriser : la page d’accueil et les catalogues de procédures/ressources deviennent très longs, et la recherche de vols contient un widget d’assistance à contraste très faible. Ces observations relèvent de l’ergonomie et non d’un blocage fonctionnel immédiat.

## Sécurité et intégrations

| Domaine | Constat | Évaluation |
|---|---|---|
| Paiement CinetPay actif | Le webhook réellement monté retrouve la transaction en base puis interroge l’API CinetPay avant de finaliser ; il compare le montant et n’envoie l’e-mail que lors de la première transition `PENDING → SUCCESS` | Conforme sur les points essentiels de vérification serveur et anti-double e-mail |
| Webhook CinetPay historique | Un second module de webhook existe avec une logique différente ; il n’est pas monté dans `server/_core/index.ts` | Dette technique à éliminer ou documenter, pour éviter toute confusion lors d’une maintenance future |
| Documents candidats | Types, signatures de fichiers, tailles, noms et identité candidate sont contrôlés avant stockage ; le dépôt candidat est lié à un JWT côté serveur | Protection solide pour le flux authentifié |
| Dépôt public de portrait | Le dépôt est limité par IP en mémoire et Turnstile n’est activé que si un secret est configuré | Risque moyen : les limites en mémoire ne sont pas partagées entre instances, et l’anti-robot devient inactif si la variable manque |
| Session admin | La garde visuelle appelle `adminAuth.me` côté serveur avant de rendre le back-office ; le jeton stocké dans `sessionStorage` sert aussi à des appels historiques | Garde serveur présente ; exposition au vol XSS à réduire en retirant progressivement les jetons accessibles au JavaScript |
| Tâches automatiques | Les endpoints `/api/scheduled/*` sont protégés par `CRON_SECRET` et les chemins sont restreints | Protection présente ; à vérifier en production que `CRON_SECRET` est renseigné et que les tâches sont configurées sur la plateforme |
| Boutons sociaux candidat | Google et Facebook affichent actuellement « Bientôt disponible » | Ce ne sont pas des connexions réelles ; la présence de ces boutons peut créer une attente trompeuse |
| Accueil public | Un popup de conception expose le nom, e-mail et WhatsApp personnels d’un développeur, ainsi qu’un CTA « Obtenir un site similaire » | Défaut de marque et de confidentialité à retirer du site de l’agence |

## Qualité technique, performance et accessibilité

| Contrôle | Résultat | Priorité |
|---|---|---:|
| TypeScript | `pnpm check` réussit | Basse |
| Tests unitaires | 109 fichiers réussissent ; 258 tests réussissent ; 1 fichier / 4 tests sont ignorés | Basse |
| Build production minifié | Arrêté durant le rendu de 131 chunks, malgré un plafond mémoire Node élevé | Haute : risque de publication instable ou lenteur de build |
| Build Vite non minifié | Également arrêté durant le rendu de 129 chunks | Haute : le problème est lié à la taille/structure du bundle plutôt qu’à Terser |
| Accessibilité automatisée | Des tests de contrat existent (chargement PDF différé, safe-area mobile, liens légaux), mais aucun outil Axe/Playwright n’est installé | Moyenne |
| 404 | Écran et CTA en anglais sur une interface francophone | Moyenne |

Le redémarrage du serveur après les tests confirme que l’accueil continue de se rendre normalement. L’échec de build est reproductible dans le sandbox après transformation de 4 726 modules, au stade de rendu des chunks, ce qui mérite une optimisation dédiée des imports et chunks lourds.
