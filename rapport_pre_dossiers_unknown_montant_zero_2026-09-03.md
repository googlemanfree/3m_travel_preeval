# Rapport de traitement manuel — pré-dossiers agence

**Date d’extraction :** 3 septembre 2026  
**Périmètre :** pré-dossiers agence non supprimés, non refusés, avec `initialPaymentStatus = unknown`.  
**Résultat :** 12 dossiers correspondent au filtre de statut demandé.

> **Important — lecture seule :** aucun statut, montant, document ou dossier n’a été modifié. La table `agency_dossiers` ne contient pas de colonne de montant. La table `transactions` ne contient aucune transaction retrouvée par les identifiants de dossiers ci-dessous ; le montant nul indiqué ici correspond donc à l’absence de transaction liée, et non à un montant stocké directement dans le pré-dossier. Les dates de dépôt sont actuellement `NULL` pour les 12 lignes ; la date de création est fournie comme repère opérationnel.

| # | Identifiant agence | Nom du candidat | Date de dépôt | Date de création | Conseiller référent | Statut dossier | Destination | Type de visa | Paiement déclaré | Montant transaction lié |
|---:|---:|---|---|---|---|---|---|---|---|---:|
| 1 | `120001` | Ntie Takoutsing Idriss Rock | Non renseignée | 2026-08-25 10:24 | fabienbah203@gmail.com | documents_requis | LUXEMBOURG | TRAVAIL | unknown | 0 — aucune transaction liée |
| 2 | `150001` | Clauvis Guoula | Non renseignée | 2026-08-25 10:34 | fabienbah203@gmail.com | documents_requis | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 3 | `180002` | NGNINTEDEM DONGMO AVEREL NIDEL | Non renseignée | 2026-08-26 23:00 | aureoldonfack@gmail.com | documents_requis | luxembourg | travail | unknown | 0 — aucune transaction liée |
| 4 | `240001` | Eboule eboule Gatien Armstrong | Non renseignée | 2026-08-27 15:37 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 5 | `270001` | Yannick Martial Ketcheckmen | Non renseignée | 2026-08-28 06:47 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 6 | `270002` | SIEWE TCHAKOUA Louis Valere | Non renseignée | 2026-08-28 06:48 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 7 | `270003` | Astride Wafifi | Non renseignée | 2026-08-28 06:49 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 8 | `270004` | Moïse Fabrice | Non renseignée | 2026-08-28 06:49 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 9 | `270006` | Alex Stéphane SITIO EPOH | Non renseignée | 2026-08-28 06:49 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 10 | `300001` | Wafo fodouop astride brondon | Non renseignée | 2026-08-29 11:31 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 11 | `300002` | chahir laiffi | Non renseignée | 2026-08-29 11:32 | aureoldonfack@gmail.com | nouveau | luxembourg | Travail | unknown | 0 — aucune transaction liée |
| 12 | `390001` | TEST E2E QA 2026 | Non renseignée | 2026-09-03 07:13 | Non affecté | soumis | Canada | Visa Étudiant | unknown | 0 — aucune transaction liée |

## Action manuelle recommandée

Dans `https://www.3mtravelagency.com/admin`, rechercher chaque identifiant dans l’interface **Pré-dossiers agence**, puis vérifier séparément la preuve de paiement, les documents remis et l’identité du conseiller avant toute validation. Le présent rapport ne déclenche aucune action administrative.
