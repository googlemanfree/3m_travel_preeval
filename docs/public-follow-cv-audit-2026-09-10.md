# Audit suivi public et CV PDF — 2026-09-10

## Correctif du suivi

Le formulaire de suivi ne doit pas mélanger une référence de dossier et l’e-mail d’un autre compte. `useCandidateAuth` donne désormais priorité à `sessionStorage` pour le token, l’expiration et les informations candidat. Une nouvelle connexion nettoie les anciennes clés de session d’onglet avant d’écrire l’identité courante.

`MonDossier` utilise le couple provenant de la même application associée (`dossierNumber` et `email`) et masque le formulaire manuel lorsqu’un dossier est déjà associé au compte. Le bouton « Suivre ce dossier » réutilise exactement ce couple.

## Correctif CV PDF

Le téléversement authentifié conserve le type `cv`, le `candidateId` issu du token courant, le fichier dans `candidate_files` et, lorsqu’un dossier agence correspondant existe, une ligne `agency_dossier_documents` strictement rattachée à ce dossier. La recherche du dossier agence compare désormais les e-mails normalisés (`LOWER(TRIM(email))`).

`getCandidateDetails` inclut les documents `agency_dossier_documents` du seul dossier demandé et expose un `cvDocument` dédié lorsque le type ou le nom identifie un CV. Le document reste téléchargeable via son URL de stockage et apparaît dans la collection `documents` de Candidate360.

## Vérifications réalisées

La compilation TypeScript et les régressions ciblées passent : 9 tests sur 3 fichiers pour le suivi/CV et les actions admin. Une lecture DB sur les comptes de test a trouvé le document `qa-e2e-cv-fictif.pdf`, dossier agence `420001`, e-mail `qa.e2e.20260903@example.com`, type `cv`, statut `verified`, source `agency_scan`.

Aucun téléversement n’a été exécuté sur `aureoldonfack@gmail.com` ni sur un autre compte réel. La vérification live d’un nouveau téléversement candidat exige une session du compte explicitement fictif `qa.e2e.20260903@example.com` ou `test.evaluation.preinscription@invalid.test`; aucun mot de passe ou session de ces comptes n’est disponible dans cette passe. Aucune donnée n’a été supprimée ni modifiée par l’audit DB.
