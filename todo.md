## Dossier actif client ↔ admin et annulations — VALIDÉ
- [x] Référence persistante `candidates.activeDossierNumber` ajoutée au schéma et à la migration additive `drizzle/0079_active_dossier_number.sql` ; sélection client protégée et réutilisée au chargement.
- [x] Projection admin enrichie avec `isActiveDossier`, badge « Dossier actif » et suppression de la ligne COMPTE redondante lorsqu’un vrai dossier EVAL/3M existe.
- [x] Annulation paiement validé ajoutée côté admin avec motif obligatoire, garde de statut, journalisation et remise en attente sur le seul dossier ciblé ; le retrait d’étape existant reste limité au dossier ouvert et demande un motif.
- [x] Typecheck vert, build vert, 4 fichiers de régression / 27 tests verts.
- [x] Migration 0079 exécutée via l’outil SQL WebDev ; vérification shell directe indisponible faute de variables DB locales.
