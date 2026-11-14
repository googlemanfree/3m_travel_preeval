# Bilans automatiques et modifiables — contrôle éditorial permanent

Principe : le système prépare le bilan ; l'administrateur peut TOUJOURS le copier, le corriger et publier une version corrigée. L'édition est une possibilité permanente, jamais une étape obligatoire.

## Ce qui est enregistré séparément
| Élément | Où |
|---|---|
| Faits extraits (avec provenance) | `bilan_auto_runs.factsJson` |
| Résultat de notation | `bilan_auto_runs.scoreJson` et, par version, `bilan_auto_versions.scoreJson` |
| Contenu rédactionnel modifiable | `bilan_auto_versions.reportJson` (sections de texte) |
| Versions (auteur, date, motif, statut, sources) | `bilan_auto_versions` : v1 = proposition du système, puis une version par correction |
| PDF de chaque version publiée | `bilan_auto_versions.pdfKey` (jamais le PDF comme seul stockage du contenu) |

## Actions de l'éditeur (`/admin/bilans`, détail d'un dossier ; lien « CV reçu · à traiter » depuis la liste des candidats)
Copier tout le bilan (texte simple, ou avec mise en forme) · Modifier le bilan (sections, ou texte simple) · Enregistrer le brouillon · Prévisualiser (tel que le candidat le verra) · Publier sans notification · Publier et notifier · Télécharger le PDF (brouillon marqué « non publié ») · Notifier le candidat · Voir l'historique et comparer deux versions.

## Règles garanties par le code (testées)
- **Brouillon ≠ publication** : enregistrer un brouillon ne modifie pas le bilan visible du candidat, ne génère aucun e-mail. Seule la publication écrit dans l'espace client.
- **Publier une correction** : nouvelle version, bilan visible mis à jour, PDF de CETTE version (texte vérifié dans le fichier), version précédente conservée (« remplacée »). Deux actions explicites : sans notification, ou avec notification (message « mis à jour » si une version était déjà publiée). « Notifier le candidat » n'envoie qu'un message par version, même en cas de double clic.
- **Notes** : les points, le total et le verdict passent par un champ contrôlé (sous-critère, points, justification de 10 caractères au moins) ; total et verdict sont recalculés, la section « Verdict » est régénérée, l'auteur et la date sont conservés. Un total écrit dans le texte libre (« NN/100 ») qui contredit la note enregistrée est refusé.
- **Sections calculées** (verdict, note) : non modifiables à la main.
- **Sources** : une ligne « OFFRE REPÉRÉE » ou « REPÈRE SALARIAL » modifiée ou ajoutée est refusée (elle n'est plus soutenue par sa source) ; un montant absent du bilan généré, donc sans source, est refusé.
- **Charte** : formulations interdites, promesses, valeurs sensibles, mot « garanti » et variantes : contrôlés à l'enregistrement ET à la publication.
- **Régénération** : une nouvelle proposition (nouvelles informations du candidat) ne remplace JAMAIS une version corrigée : elle reste distincte, signalée (« version corrigée manuellement existante »), comparable, et n'est jamais publiée automatiquement même en mode automatique. Sans correction manuelle, le parcours automatique est inchangé.
- **Droits** : administrateur — consultation, copie, édition, publication ; candidat — ses bilans publiés et leur PDF uniquement (lien signé, propriétaire seulement), jamais les brouillons ni les dossiers d'autres candidats.

## Points restant à décider
- **Perplexity pour les recherches documentaires** : le principe est accepté « si la solution est retenue ». Rien n'est branché. Le point d'insertion existe (interface de recherche de sources : seuls un pays et un intitulé de métier lui sont transmis, aucun nom ni CV ; résultats exigeant adresse https, date et fraîcheur). Reste à décider : clé et budget, et la règle qui transforme une réponse en « offre repérée » ou « repère salarial » (une réponse de moteur de recherche n'est pas une source fiable en soi : chaque élément devrait être vérifié sur la page citée, ou validé par l'agence dans le référentiel de sources).
- Approbation du barème (la publication réelle reste refusée tant qu'il n'est pas approuvé, y compris pour une version corrigée à la main).
