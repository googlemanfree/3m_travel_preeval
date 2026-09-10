# Audit paiement Candidate360 — 3M-AGN-270002

## Périmètre

Audit en lecture seule du dossier agence **3M-AGN-270002 — SIEWE TCHAKOUA Louis Valere**, e-mail `louistchakoua4@gmail.com`. Aucun paiement, dossier ou document n’a été modifié et aucune trace n’a été supprimée.

## Résultat

Le dossier est enregistré dans `agency_dossiers` avec `id = 270002` et `initialPaymentStatus = paid`. Le dossier est de source agence ; il ne possède donc pas de ligne `applications` avec le numéro `3M-AGN-270002`. Le panneau Candidate360 doit lire le snapshot paiement construit à partir de `agency_dossiers.initialPaymentStatus` et de l’audit associé.

Dans `payment_audit_logs`, la recherche ciblée sur `paymentId = 270002` et l’e-mail du candidat a trouvé :

| Action | Nombre | Première trace | Dernière trace |
|---|---:|---|---|
| `confirmed` | 1 | 2026-09-08 09:41:09 | 2026-09-08 09:41:09 |
| `confirmed_again` | 11 | 2026-09-08 09:41:28 | 2026-09-10 11:28:38 |
| `receipt_resent` | 2 | 2026-09-08 12:12:49 | 2026-09-08 19:09:45 |
| `receipt_approved_signed` | 1 | 2026-09-08 19:09:37 | 2026-09-08 19:09:37 |

La trace `confirmed` du 8 septembre est l’enregistrement original. Les onze lignes `confirmed_again` sont des traces d’audit répétées ; elles ne constituent pas onze paiements métier distincts dans `applications` ou `client_payments`. Elles montrent toutefois que l’ancienne mutation acceptait une nouvelle validation même lorsque le paiement était déjà confirmé.

## Correctif appliqué

Le panneau admin lit maintenant `payments[0].status` et remplace le bouton par **Paiement déjà confirmé**, avec le validateur et l’horodatage lorsqu’ils sont disponibles. Après un succès, un état optimiste masque immédiatement le bouton et le toast de succès reste affiché. La mutation serveur refuse désormais une seconde validation avec `PRECONDITION_FAILED` et n’ajoute plus de nouvelle trace `confirmed_again`.

Aucune suppression des onze traces historiques n’a été effectuée. Leur nettoyage nécessite une confirmation distincte et une règle de conservation validée.

## Vérifications

TypeScript passe. Les régressions de verrouillage, de retours d’erreur et d’interaction d’activation passent : **9 tests** sur les trois suites ciblées. La vérification par clic réel sur le dossier réel reste à effectuer après publication ; aucun clic de mutation n’a été exécuté par cet audit.
