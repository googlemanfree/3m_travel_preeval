# Gestion des dossiers et des documents — proposition et état d'avancement

## Constat (ce que le code fait déjà)
Documents déposés dans `client_documents` (types, URL de stockage), demandes de précision de documents, relances de documents planifiées, vérification du passeport, statuts de pièces (reçu, à fournir, à mettre à jour, à vérifier) dans le bilan, dossiers d'agence. Mais : pas de contrôle de lisibilité à la réception, pas de versions ni de détection des doublons, pas de date d'expiration, pas de checklist unique par projet, et l'information « ce document est-il exploitable ? » n'apparaît qu'au moment de l'analyse, trop tard pour le candidat.

## Proposition (par ordre de valeur)
1. **Contrôle à la réception** : dès le dépôt, vérifier le type réel, la taille, le nombre de pages et la lisibilité (texte présent ou non). Réponse immédiate au candidat : « lisible », ou « illisible : redéposez un PDF avec texte ». Évite qu'un CV non lisible bloque le bilan des jours plus tard.
2. **Checklist documentaire par projet** : une liste de pièces attendues selon le projet (travail, études, séjour, e-Visa, installation), avec un statut unique par pièce : À fournir · Reçu · Lisible · À mettre à jour · Vérifié par l'agence. Même vocabulaire côté candidat et côté administrateur.
3. **Versions et doublons** : conserver l'historique des dépôts d'une pièce, empreinte du fichier pour repérer un redépôt identique, motif de remplacement.
4. **Dates de validité** : passeport, tests de langue, casier : date d'expiration saisie ou lue, alerte avant échéance, relance automatique.
5. **Vue administrateur par dossier** : visionneuse, comparaison « déclaré / pièce examinée » (réutilise la provenance du bilan), demande groupée de plusieurs pièces en un message, actions groupées sur plusieurs dossiers.
6. **Références et statuts unifiés** : une référence par personne et un seul vocabulaire de statut de dossier (aujourd'hui plusieurs, dont certains textes libres).
7. **Accès et cycle de vie** : journal des consultations de documents sensibles, durées de conservation par type (voir `bilan-auto/CONSERVATION.md`), suppression à la demande jusque dans le stockage (aujourd'hui sans fonction de suppression).

## État d'avancement
| # | Élément | État |
|---|---|---|
| 1 | Contrôle à la réception (`server/services/documentIntake.ts`) | **Fait** : CV et documents déposés, type réel, pages, lisibilité, message immédiat au candidat ; le document peu lisible est enregistré, jamais refusé |
| 2 | Liste de pièces par projet (`shared/documentChecklist.ts`) | **Fait** : statuts À fournir · Reçu · Lisible · À mettre à jour · Vérifié par l'agence, visibles côté candidat (« Vos documents ») et côté administrateur |
| 3 | Versions et doublons | **Fait** : empreinte SHA-256, doublon repéré par évaluation, seule la pièce la plus récente d'un type compte ; l'historique des dépôts reste dans `client_documents` |
| 4 | Dates de validité | **Fait en partie** : date saisie par l'administrateur, pièce « à mettre à jour » si expirée ou à moins de 60 jours. Pas de lecture automatique de la date, pas de relance e-mail automatique |
| 5 | Vue administrateur (`/admin/documents`) | **Fait en partie** : filtres (à mettre à jour, manquantes, doublons, non contrôlées), détail, contrôle des documents déjà reçus par lot, vérification, remplacement demandé avec motif, date de validité. Pas de visionneuse intégrée, pas de demande groupée ni d'actions groupées |
| 6 | Références et statuts unifiés | **Non fait** : chantier transverse (plusieurs vocabulaires de statut et références), à cadrer à part |
| 7 | Journal des consultations, suppression dans le stockage | **Non fait** : le stockage actuel n'expose pas de suppression ; les consultations de fichiers passent par de nombreux écrans |

Données : table additive `document_intake` (créée à la demande, retour arrière : `DROP TABLE document_intake`), aucune colonne ajoutée aux tables existantes. Les documents reçus avant cette fonction apparaissent « non contrôlés » jusqu'au bouton « Contrôler les documents déjà reçus » (lots de 40 ; les fichiers de plus de 5 Mo ou inaccessibles sont comptés à part).

## Ordre conseillé
Étape 1 (1) puis (2) : effet immédiat sur le blocage du bilan. Étape 2 : (3) et (4). Étape 3 : (5) et (6). (7) en parallèle de la politique de conservation, après sa validation.
