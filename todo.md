
## Correctif tRPC — erreurs transform/fetch accueil
- [x] Procédure suspecte identifiée : `customerReview.listApproved`, appelée par `ApprovedReviewsSection` et renvoyant désormais du JSON sûr. Les journaux disponibles ne prouvent pas directement que cette procédure est l’origine exacte de l’erreur du 12/10 à 09:05; ils prouvent des redémarrages serveur autour de la période.
- [x] Correctif déjà présent sur `main` : contrat JSON-only (`id`, dates ISO, nombres normalisés) et fallback `[]` avec journalisation; aucune modification supplémentaire inutile.
- [x] Endpoint vérifié localement, sur l’aperçu et sur le domaine public; accueil chargé sans erreur. Régression ciblée, typecheck et build verts.
- [ ] Créer le checkpoint WebDev après validation; aucun dossier, paiement ou compte n’a été modifié.
