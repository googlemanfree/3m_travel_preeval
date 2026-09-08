# Retest paiement — 2026-09-08

URL : https://www.3mtravelagency.com/admin?candidate=3M-AGN-270002&verification=after-payment-read

Lecture seule de `agency_dossiers` après le clic direct : le dossier 270002 porte `adminNotes` `[Paiement confirmé] VALIDATION_MANUELLE · aureoldonfack@gmail.com · 2026-09-08T09:41:09.533Z`, puis une seconde trace de confirmation à `2026-09-08T09:41:28.052Z`. Le statut métier reste `documents_requis` et le dossier n’a pas été supprimé.

Après rechargement, le dashboard admin revient avec 32 dossiers et la fiche peut être filtrée sur `3M-AGN-270002`. Pendant l’ouverture/rafraîchissement du contrôle paiement, la fiche 360° a affiché temporairement « La fiche 360° n’a pas pu être chargée », puis le dashboard global est revenu. Aucun protocole n’a été envoyé ni déposé pendant ce contrôle.

La confirmation paiement a donc été exécutée par le clic direct autorisé ; le test de protocole et la vérification côté client restent à faire séparément.
