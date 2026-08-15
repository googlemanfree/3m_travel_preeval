# Audit complet du site 3M Travel Agency

**Date de l’audit :** 15 août 2026  
**Périmètre :** site public, parcours candidat, administration, e-mails, documents, paiements, tâches planifiées, sécurité, performance et accessibilité.  
**Méthode :** inspection de code ciblée, contrôles de routes et d’écrans en bureau/mobile, analyse des logs et compteurs agrégés, compilation TypeScript et exécution de la suite Vitest. Les opérations nécessitant une vraie boîte mail candidat, un compte administrateur connecté ou une transaction de paiement réelle ne sont pas simulées dans cet audit.

## Synthèse exécutive

Le site possède une base fonctionnelle riche : espace candidat, dépôt documentaire, évaluation, paiements, administration, e-mails d’activation et journal d’audit. Les contrôles serveur essentiels existent pour les documents, les paiements CinetPay et les tâches planifiées. La vérification TypeScript est propre et la suite de tests réussit. [1] [2]

L’audit met toutefois en évidence **quatre corrections prioritaires** : le lien public Canada `/evaluation-canada` est cassé, la délivrabilité historique des e-mails est dégradée, le build de production s’interrompt durant le rendu des chunks et l’accueil public expose des coordonnées personnelles de développeur qui ne doivent pas figurer sur un site d’agence. [1] [3] [4]

> **Conclusion opérationnelle :** les parcours principaux sont présents, mais le site ne doit pas être considéré comme entièrement prêt pour une ouverture large tant que le lien Canada, la délivrabilité e-mail mesurée et la stabilité du build ne sont pas corrigés et retestés avec une adresse candidat réelle.

| Niveau | Nombre | Décision attendue |
|---|---:|---|
| Critique | 0 | Aucune indisponibilité ou fuite directe de secrets observée dans le périmètre testé. |
| Haute | 4 | Corriger avant une campagne publique ou promotionnelle. |
| Moyenne | 6 | Planifier dans le prochain cycle qualité. |
| Basse | 5 | Améliorations d’ergonomie, de cohérence et de maintenance. |

## Périmètre et résultats de vérification

| Domaine | Résultat | Niveau de confiance | Limite de vérification |
|---|---|---|---|
| Accueil, services et mobile | Les pages principales se rendent correctement ; les champs et CTA testés restent accessibles à 375 px. | Élevé | Les interactions profondes de chaque carte destination n’ont pas toutes été cliquées individuellement. |
| Inscription et connexion candidat | Les routes, formulaires, activation e-mail, renvoi et récupération de mot de passe sont présents et couverts par tests. | Élevé | La réception dans une boîte candidat réelle reste à confirmer. |
| Espace candidat et administration | Les portes d’accès non authentifiées sont visibles et le garde-fou admin consulte le serveur avant rendu. | Moyen | Les actions métier sous session réelle n’ont pas été exécutées pendant cet audit. |
| Documents | Signature de fichier, MIME, taille, nom, JWT candidat et stockage privé sont contrôlés dans le flux authentifié. | Élevé | Les visualisations de PDF/documents réels n’ont pas été testées avec un fichier métier. |
| Paiement | Le webhook actif vérifie la transaction auprès de CinetPay, contrôle le montant et évite le double e-mail de succès. | Élevé | Aucune transaction CinetPay réelle n’a été déclenchée. |
| E-mails | Les données montrent de nombreux échecs historiques, surtout liés à des adresses de test et à un ancien domaine d’expédition non vérifié. | Élevé | Le statut SMTP « accepté » n’équivaut pas à une confirmation de lecture/inbox. |
| Qualité technique | TypeScript et Vitest passent ; le build Vite est interrompu lors du rendu des chunks. | Élevé | L’arrêt vient de l’environnement de build, mais demeure reproductible et doit être traité. |

## Forces constatées

Le système de paiements actif est construit selon un bon modèle de sécurité : le callback ne suffit pas à valider seul une transaction. Le serveur retrouve d’abord la transaction enregistrée, appelle l’API CinetPay, compare le montant attendu et ne notifie par e-mail que lors de la première transition réussie. [5]

Le téléversement authentifié de documents est également correctement encadré. Les types autorisés, signatures binaires, tailles, noms de fichier et identité candidate sont contrôlés avant l’enregistrement ; le document est ensuite synchronisé au dossier agence quand il existe. [6]

Les tâches planifiées sont restreintes au préfixe prévu et protégées par `CRON_SECRET`. Les routes admin affichent un garde-fou visuel et interrogent l’état authentifié côté serveur. [7] [8]

Enfin, le projet conserve une couverture de tests importante : **109 fichiers réussis, 258 tests réussis et 4 tests ignorés**, avec TypeScript sans erreur. [2]

## Constats prioritaires

### Priorité haute — lien Canada public cassé

La route `/evaluation-canada` renvoie une page 404, alors que les tests de partage et les liens historiques continuent de construire cette URL. Le parcours fonctionnel actuel est `/evaluation`, ce qui casse les liens partagés, les messages WhatsApp et potentiellement des publicités ou QR codes déjà diffusés. L’écran 404 est de plus en anglais, alors que le site public cible en priorité des utilisateurs francophones. [3] [9]

| Risque | Impact | Correctif recommandé |
|---|---|---|
| Conversion | Les candidats arrivent sur une page inexistante après un partage. | Créer une redirection permanente `/evaluation-canada → /evaluation`, ou réintroduire la route canonique ; mettre à jour tous les générateurs de liens et tests. |
| Référencement | Les liens externes accumulent des 404. | Ajouter redirection, sitemap et test de non-régression de route. |
| Expérience | Erreur 404 non localisée. | Traduire entièrement la page 404 et proposer un retour à l’évaluation pertinente. |

### Priorité haute — délivrabilité e-mail à assainir

Les compteurs agrégés montrent **579 échecs historiques pour 50 messages envoyés**. Une large part concerne des destinataires de test `example.com`, tandis que 40 échecs proviennent d’un domaine Resend non vérifié. Le canal SMTP est maintenant utilisé pour les derniers parcours, mais les métriques mélangent encore les anciens échecs Resend et les tentatives plus récentes. [1]

La conséquence directe est un risque sur les e-mails d’activation, les resets et les confirmations de dossier. Le correctif ne consiste pas seulement à renvoyer le message : il faut distinguer le fournisseur, le type de message, le motif et l’état final de livraison dans le tableau admin.

| Action | Mesure de succès |
|---|---|
| Vérifier le domaine et les enregistrements SPF/DKIM/DMARC du canal choisi | Aucun rejet « domaine non vérifié ». |
| Exclure ou étiqueter les données de test dans les statistiques | Les taux de livraison opérationnels ne sont plus dilués par `example.com`. |
| Réaliser un test réel candidat | Activation et reset reçus, ouverts, validés et journalisés de bout en bout. |
| Ajouter un tableau de délivrabilité par fournisseur | Les échecs SMTP/Resend sont identifiables sans lire de contenu sensible. |

### Priorité haute — build de production non stabilisé

La commande de build transforme 4 726 modules, puis s’arrête durant le rendu de 131 chunks. Une tentative sans minification s’interrompt aussi, à 129 chunks. Le défaut n’est donc pas limité à Terser ; la structure de bundle, les dépendances lourdes et les imports dynamiques doivent être mesurés et rationalisés. [4]

La conséquence est un risque de publication lente, instable ou impossible lorsqu’une évolution plus importante augmente encore le graphe de dépendances. Une investigation dédiée doit isoler les modules les plus lourds, notamment les bibliothèques de vision, PDF, OCR et les dépendances UI.

### Priorité haute — élément de développeur publié dans l’accueil

Le composant de l’accueil contient un CTA « Obtenir un site similaire », un popup de développement, un e-mail personnel et un WhatsApp personnel. Cela détourne les visiteurs de l’agence, affaiblit la confiance de marque et expose une information de contact non nécessaire à la relation agence-candidat. [10]

Le composant doit être retiré ou remplacé par un CTA officiel de 3M Travel Agency menant à `hello@3mtravelagency.com` ou au canal commercial officiel approuvé.

## Constats de priorité moyenne

| Constat | Impact | Recommandation |
|---|---|---|
| Le placeholder de connexion admin indique `admin@3mtravelagency.com`, alors que les comptes administrateurs confirmés utilisent d’autres adresses. [11] | Confusion et faux échecs de connexion. | Utiliser `votre.email@exemple.com` comme placeholder neutre. |
| Google et Facebook affichent « Bientôt disponible ». [12] | L’utilisateur peut croire à une authentification réellement disponible. | Masquer ces boutons jusqu’à une configuration OAuth complète, ou les transformer explicitement en informations non cliquables. |
| Le dépôt public de portrait accepte Turnstile comme contrôle optionnel et la limite IP est en mémoire. [6] | Protection anti-robot inégale sur plusieurs instances ou quand la variable manque. | Rendre Turnstile obligatoire en production ou déplacer le rate limit vers un stockage partagé. |
| Le jeton admin reste aussi présent dans `sessionStorage` pour compatibilité. [11] | Risque accru en cas de XSS. | Migrer progressivement les appels vers un cookie HttpOnly et supprimer le stockage JavaScript. |
| Un module historique de webhook CinetPay existe en parallèle du webhook actif. [5] | Risque de mauvaise maintenance ou de réactivation involontaire. | Archiver/supprimer le module non monté ou le marquer explicitement obsolète. |
| Absence d’outil d’accessibilité automatisé. [13] | Régressions ARIA, contraste et clavier non détectées systématiquement. | Ajouter `axe-core` et un contrôle CI sur les routes prioritaires. |

## Constats UX et mobile

L’accueil est riche mais chargé : navigation avec de nombreux emoji, CTA concurrents, variations de couleurs, cartes et widgets créent une hiérarchie incertaine. La page de recherche de vols comporte un assistant à contraste insuffisant. Les catalogues de procédures et de ressources deviennent très longs sur mobile, même si les champs et boutons restent utilisables. [1]

Ces éléments ne bloquent pas immédiatement les parcours, mais une simplification de la navigation et des CTA devrait accompagner la correction des défauts fonctionnels. L’objectif est de faire ressortir un seul chemin principal : évaluation, ouverture de dossier ou prise de rendez-vous.

## Plan de correction recommandé

| Horizon | Correctifs | Résultat attendu |
|---|---|---|
| **Immédiat (0–2 jours)** | Redirection de `/evaluation-canada`, retrait du popup de développeur, neutralisation ou masquage des boutons sociaux fictifs, placeholder admin neutre. | Aucun lien public 404 et marque agence cohérente. |
| **Court terme (3–7 jours)** | Test réel activation/reset, assainissement des métriques e-mail, écran 404 FR/EN, purge du webhook CinetPay historique. | Parcours compte et communication réellement mesurés. |
| **Moyen terme (1–2 semaines)** | Analyse du bundle, séparation/réduction des dépendances lourdes, axe-core en CI, rate-limit partagé / Turnstile production. | Publication plus fiable et sécurité anti-abus homogène. |
| **Amélioration continue** | Revue mensuelle des e-mails, liens 404, incidents d’authentification et performance mobile. | Prévention des régressions avant les campagnes commerciales. |

## Paramètres externes à confirmer

| Élément | État à confirmer | Responsable suggéré |
|---|---|---|
| SMTP | Identifiants actifs, expéditeur autorisé, réputation du compte et réceptions Gmail/Outlook. | Direction / administrateur e-mail. |
| Domaine e-mail | SPF, DKIM et DMARC du domaine officiel de l’agence. | Gestionnaire DNS. |
| CinetPay | Clés serveur, site ID, endpoint webhook déclaré et paiement de test. | Direction / finance. |
| Turnstile | Clé site et clé secrète activées en production. | Direction technique. |
| Planificateur | Valeur de `CRON_SECRET` et exécution des jobs dans la plateforme. | Direction technique. |
| OAuth social | À désactiver visuellement ou configurer réellement avant annonce. | Direction / technique. |

## Références internes

[1]: `audit-notes-v190.md` — contrôles visuels, données agrégées et analyse des logs effectués pendant cet audit.

[2]: sortie de `pnpm check && pnpm test` du 15 août 2026 — 109 fichiers réussis, 258 tests réussis, 4 ignorés.

[3]: `client/src/App.tsx`, `server/shareableCanadaEvaluation.test.ts`, `server/canadaEvaluationWhatsappShare.test.ts` et contrôle visuel de `/evaluation-canada`.

[4]: sorties de `pnpm build` et `pnpm exec vite build --minify=false` du 15 août 2026.

[5]: `server/_core/index.ts`, `server/routers/cinetpayWebhook.ts`, `server/_core/cinetpayWebhook.ts`.

[6]: `server/routers/candidateUpload.ts`.

[7]: `server/_core/scheduledAuth.ts`, `server/_core/index.ts`, `server/_core/heartbeat.ts`.

[8]: `client/src/components/AdminGuard.tsx`.

[9]: `client/src/pages/NotFound.tsx`.

[10]: `client/src/pages/Home.tsx`.

[11]: `client/src/pages/AdminLogin.tsx`, `client/src/components/AdminGuard.tsx`.

[12]: `client/src/pages/Login.tsx`.

[13]: `server/phase4-performance-accessibility.test.ts`.
