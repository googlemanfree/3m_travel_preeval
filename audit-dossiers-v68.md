# Audit complet des dossiers candidats — v68

## Constats confirmés

La route `/admin/document-verification` et la route `/admin/candidates` ne sont pas blanches sans session : elles affichent correctement une garde « Accès refusé » avec des actions de connexion et de retour. Le routeur d’accès est donc rendu, mais le parcours administrateur authentifié doit encore être vérifié avec les données réelles.

Le dépôt candidat principal (`/document-upload`) téléverse réellement vers le stockage, puis persiste les métadonnées dans `candidate_files` via `candidate.saveDocument`. La page admin documentaire historique (`/admin/document-verification`) et le routeur `admin.listDocuments` consultent principalement `client_documents`; ils ne couvrent donc pas automatiquement les fichiers enregistrés dans `candidate_files`. Il existe une divergence de source qui peut rendre un document candidat invisible à l’administration.

La procédure `documentSubmission.submitDocuments` est encore publique et accepte seulement un numéro de dossier ; `getDocumentSubmissionStatus` est également public. Même si l’interface est protégée, le serveur ne vérifie pas que le demandeur possède le dossier. Cette procédure doit être liée à `candidateProcedure` et vérifier `applications.candidateId` ou, pour les anciens dossiers, l’adresse e-mail du candidat authentifié.

`AdminDossierManagement` utilise des dossiers fictifs en mémoire et ses changements de statut, notes et notifications ne sont pas persistés. `AdminPaymentValidation` est également une interface simulée. `CandidatesManager` permet de lister/exporter les candidats mais certaines modifications du profil restent locales sans mutation serveur. Ces écrans ne permettent donc pas encore une gestion fiable de toutes les étapes du dossier.

`application.listApplications` applique la pagination avant les filtres, ce qui peut masquer des dossiers correspondant aux filtres. Les documents de `admin.listDocuments` renvoient `dossierNumber: "N/A"` et `candidateName: "N/A"`, et la page de vérification ne rend pas les liens des fichiers soumis.

## Plan de correction

Unifier la visibilité documentaire en exposant les fichiers `candidate_files` à l’administration avec leur propriétaire et leur URL contrôlée ; protéger le dépôt et le statut par propriété candidate ; remplacer les écrans administratifs simulés par les procédures serveur existantes ; corriger la pagination filtrée et afficher les documents réellement soumis. Ajouter des tests ciblés, puis vérifier desktop/mobile, TypeScript et build.

## Contrôles exécutés après correction

Le serveur a été redémarré avec succès et les logs récents indiquent `Server running on http://localhost:3000/`. L’ancienne erreur `ReferenceError: publicProcedure is not defined` appartient à l’ancien état des logs ; après redémarrage, aucune nouvelle occurrence n’est apparue.

Sans authentification, `/document-upload` affiche une page explicite « Connexion requise », `/suivi-client` affiche un état vide compréhensible, et les routes `/admin/dashboard`, `/admin/document-verification`, `/admin/dossiers` et `/admin/payment-validation` affichent une garde administrateur avec boutons de connexion/retour. Aucune de ces pages ne reste blanche après stabilisation du rendu.

L’appel HTTP non authentifié à `documentSubmission.getDocumentSubmissionStatus` renvoie 401 « Non authentifié ». L’appel non authentifié à `admin.listDocuments` renvoie 401 « Session invalide ». Les documents ne sont donc pas exposés publiquement par ces procédures.

Les tests ciblés `server/dossierAdmin.test.ts` passent (3/3) et TypeScript passe sans erreur. Le rendu desktop des sept routes contrôlées est exploitable ; les routes legacy dossiers/paiement utilisent désormais le tableau admin réel protégé au lieu d’interfaces simulées.

Le build de production complet a finalement réussi après ajout de `rollupOptions.maxParallelFileOps: 1` et libération de la mémoire du sandbox : 3 406 modules transformés, client Vite construit en 24,21 s, bundle serveur esbuild généré en 30 ms. Les avertissements restants concernent uniquement les imports dynamiques de jsPDF/QRCode et un chunk principal de 5,7 Mo ; ils ne bloquent pas la compilation ni les parcours contrôlés.

La vérification mobile à 375×812 px confirme l’absence de débordement horizontal : `/document-upload` affiche une connexion requise lisible, `/suivi-client` affiche le bandeau, les compteurs et l’action Actualiser, tandis que `/admin/document-verification` et `/admin/dossiers` affichent une garde admin complète avec boutons de connexion et retour. Aucun écran blanc n’a été observé après stabilisation.
