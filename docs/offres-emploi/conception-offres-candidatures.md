# Module « Opportunités » : offres d'emploi, écoles et programmes de séjour

Dossier de conception à valider avant tout développement.
Version brouillon 1 du 27 octobre 2026. Aucun code n'est écrit à ce stade.

## 0. Ce que ce dossier ajoute à la demande initiale

La demande de départ portait sur les offres d'emploi. Trois précisions l'ont élargie :

1. **Visa travail** : la liste des offres est visible dans l'espace client.
2. **Visa études** : les écoles, les dates de rentrée et les scolarités sont visibles et on peut y postuler depuis l'espace client.
3. **Visa visiteur ou tourisme** : les différents programmes sont visibles dans l'espace client.
4. **Tous les pays du monde** : les 196 pays du site ont une fiche (voir le § 3).

Le module devient donc un **espace « Opportunités »** unique dans `/mon-espace`. Son contenu dépend du projet que le candidat a choisi.

| Projet choisi par le candidat | Ce qu'il voit | Ce qu'il peut faire |
|---|---|---|
| Travail (et immigration liée à un employeur) | Offres d'emploi des employeurs vérifiés | Pré-contrôle, candidature avec consentement, suivi, entretiens, messages |
| Études | Écoles, programmes, dates de rentrée, scolarités | Choisir jusqu'à 3 vœux, postuler via l'agence, suivre l'admission |
| Tourisme, visiteur, e-Visa | Programmes de séjour du pays, type d'autorisation, services de l'agence | Demander un devis ou un accompagnement (billets, hôtel, assurance, itinéraire, lettre d'invitation) |

Le projet vient du **moteur de formulaire dynamique existant** (`PROJECT_KINDS` : `travail`, `etudes`, `tourisme`, `evisa`, `immigration`). Aucun nouveau choix n'est demandé au candidat. Un candidat qui a plusieurs dossiers voit un onglet par dossier (`clientMultiDossier`).

## 1. Ce qui existe déjà et que le module réutilise

| Existant | Rôle dans le module |
|---|---|
| `placement_organizations` (type `employer`, statut `pending/verified/suspended`) | Fiche employeur. On lui ajoute le statut « refusé » et des champs de vérification. |
| `placement_employer_accounts` (rôles lecteur/gestionnaire) | Comptes des recruteurs. |
| `candidate_placement_consents` | Consentement général de mise en relation. Le consentement par candidature s'y ajoute. |
| `placement_candidate_profiles` (profil anonymisé, résumé validé par l'admin) | Base du « profil minimal » vu par l'employeur. |
| `placement_profile_submissions` + `placement_submission_events` | Parcours actuel où l'agence présente des profils. Il reste en place. |
| Étapes `selected → contract_invitation → protocol_two → procedure_ready` | Les étapes finales de la candidature s'alignent dessus, pour que l'espace candidat et le back-office restent cohérents. |
| `shared/dynamicForm` (pays × visa × domaine) | Pré-contrôle d'éligibilité. Les mêmes questions et la même version de schéma. |
| `shared/worldCountries.ts` (196 pays) | Liste unique des pays. |
| `shared/officialSourceCatalog.ts` et la règle « À confirmer » | Aucune exigence n'est publiée sans source officielle. |
| `tourism_service_requests`, vols, hôtels, assurance | Services proposés aux visiteurs. |
| Polling de 30 s de l'espace client | Notifications de changement de statut. |
| `agency_dossiers` | Chaque candidature à un employeur ou à une école est liée au dossier du client. |

**Principe directeur.** Aujourd'hui, l'agence choisit les profils qu'elle présente aux employeurs. Le nouveau module permet au candidat de postuler lui-même. L'agence garde la main sur quatre points : qui est employeur vérifié, quelle offre est publiée, ce que l'employeur voit du candidat, et le suivi du dossier de visa. Elle n'est plus l'unique porte d'entrée.

## 2. Arborescence des écrans

### 2.1 Espace client (`/mon-espace`, nouvelle section « Opportunités »)

```text
Opportunités
├── (projet = Travail / Immigration liée à un employeur)
│   ├── Offres d'emploi
│   │   ├── Liste filtrable : pays, métier, domaine, type de visa, contrat, salaire,
│   │   │   langues, diplôme, date de démarrage, « compatibles avec mon profil »
│   │   ├── Fiche d'une offre
│   │   │   ├── Résumé : employeur (nom masqué si l'employeur le demande), lieu, contrat, salaire publié
│   │   │   ├── Visa concerné + lien vers la fiche du dispositif du pays
│   │   │   ├── Pré-contrôle d'éligibilité (résultat par critère, jamais un refus automatique)
│   │   │   └── Postuler en un clic → fenêtre de consentement
│   │   └── Offres enregistrées
│   ├── Mes candidatures
│   │   ├── Liste par statut
│   │   └── Détail : frise d'étapes, entretiens, messages, pièces partagées, qui a consulté mon dossier
│   └── Signaler une offre
│
├── (projet = Études)
│   ├── Écoles
│   │   ├── Liste filtrable : pays, ville, niveau, domaine, langue d'enseignement, budget, rentrée
│   │   └── Fiche d'une école : présentation, accréditation sourcée, programmes
│   ├── Programme
│   │   ├── Conditions d'admission déclarées par l'école
│   │   ├── Rentrées : date de début, ouverture des candidatures, date limite, places (ouvert / bientôt clos / clos)
│   │   └── Scolarité : montant, devise, année académique, frais annexes, source et date de vérification
│   ├── Mes vœux (3 maximum, classés)
│   └── Mes candidatures études
│       └── Détail : statut, pièces demandées, lettre d'admission, étape visa
│
├── (projet = Tourisme / Visiteur / e-Visa)
│   ├── Programmes de séjour du pays
│   │   ├── Court séjour touristique, visite familiale, voyage d'affaires, soins, événement, transit, entrées multiples
│   │   ├── Type d'autorisation : visa, e-Visa, ETA, visa à l'arrivée, exemption (selon la nationalité)
│   │   └── Portail officiel et pièces à préparer
│   ├── Séjours et circuits proposés par l'agence (prix seulement s'il est saisi avec sa provenance)
│   └── Ma demande : billets, hôtel, assurance, itinéraire, lettre d'invitation
│
└── Transparence
    ├── Mon consentement (voir, retirer)
    └── Journal des consultations de mon dossier
```

### 2.2 Espace employeur (`/employeurs`, déjà existant, nouveaux onglets)

```text
Espace employeur
├── Inscription → état : en attente / vérifié / refusé / suspendu
├── Entreprise : identité, pièces de vérification, équipe
├── Mes offres
│   ├── Créer / modifier (brouillon → soumise à modération)
│   ├── Statuts : brouillon / en modération / publiée / clôturée (+ refusée, archivée)
│   └── Statistiques : vues, candidatures, délai moyen de réponse
├── Candidatures
│   ├── Tableau par étape : reçues / présélection / entretien / offre / accepté / refusé
│   ├── Fiche candidat (profil minimal, puis plus selon l'étape)
│   └── Décision avec motif codé
├── Entretiens : proposer des créneaux, fuseau horaire, lien visio, rappels
├── Messagerie (par candidature, modérée)
├── Journal : qui de mon équipe a consulté quoi
└── Existant conservé : CVthèque, besoins, suivi, équipe, sécurité
```

### 2.3 Back-office administrateur

```text
Opportunités (admin)
├── Employeurs : file de validation, pièces, décision motivée, suspension
├── Modération des offres : file, grille de contrôle, accepter / demander des corrections / refuser
├── Signalements : file, instruction, sanctions (retrait, suspension, avis aux candidats concernés)
├── Écoles : établissements, programmes, rentrées, scolarités, fraîcheur des données
├── Programmes de séjour : par pays, par type, séjours de l'agence
├── Catalogue pays : matrice 196 pays × (travail, études, visiteur) avec statut et date de vérification
├── Candidatures : vue transversale (travail, études), liaison au dossier du client
└── Journal d'audit des accès : filtres candidat / employeur / période, export
```

## 3. Couverture des 196 pays

### 3.1 Méthode

- Chaque pays de `worldCountries.ts` a **une fiche pour chacun des trois parcours** (travail, études, visiteur). Le fichier [catalogue-pays-196.csv](catalogue-pays-196.csv) la liste : 196 lignes, aucune manquante.
- **Niveau A (55 pays)** : les dispositifs principaux sont nommés (ex. Skilled Worker au Royaume-Uni, Kennismigrant aux Pays-Bas, Permis unique en Belgique, Employment Pass à Singapour). Voir [catalogue-pays-parcours.json](catalogue-pays-parcours.json).
- **Niveau B (141 pays)** : fiche créée avec la mention « permis de travail national, dispositif à documenter » et le statut « À confirmer ». Ces pays ne montrent pas de fausses précisions. Ils s'enrichissent par vagues (voir le planning).
- Les **29 États de l'espace Schengen** sont marqués. Le parcours visiteur y repose sur un visa Schengen de court séjour.
- Un pays n'a pas besoin de dispositif « avec offre » pour exister dans le module. Certains dispositifs n'exigent aucune offre (Chancenkarte allemande, systèmes à points). La fiche l'indique par le type de route `jobseeker` ou `points`, et l'espace client oriente alors vers le parcours d'évaluation et non vers des offres.

### 3.1 bis Décision du 27 octobre 2026 : sources officielles visibles de l'administration seulement

Les guides publics (`/pays`, panneau « Opportunités », outil des pièces) donnent **tout le détail** (étapes, pièces, délais, frais, durée, famille, base légale) mais **aucun lien vers les sites officiels** : le candidat est invité à lancer sa procédure avec l'agence.
- Les sources (adresse, libellé, date de relecture) restent enregistrées et obligatoires pour publier une fiche. Seule l'administration les voit, toutes réunies par pays.
- L'instantané public ne contient aucune source. Les adresses saisies à la main dans les textes libres sont retirées avant affichage.
- Le texte public affirme seulement ce qui est vrai : « repères vérifiés le … » et « un conseiller confirme chaque exigence au moment d'instruire votre dossier ».
- Les pages plus anciennes (procédures, e-Visas, `/sources-officielles`, ressources) gardent leurs liens officiels tant que cette décision n'est pas étendue.

### 3.2 Ce que ce catalogue ne contient volontairement pas

Aucun seuil de salaire, délai, frais, quota ou liste de métiers. Ces valeurs changent chaque année. Elles sont saisies en base avec **l'URL de la source officielle et la date de vérification**, et ne sont affichées au candidat qu'après publication par un administrateur. C'est la règle déjà appliquée au formulaire dynamique.

**Contenu procédural déjà recherché.** Sept pays de la vague 1 ont leurs procédures détaillées dans [procedures-vague-1.md](procedures-vague-1.md) : étapes, qui dépose quoi, pièces, délais, frais et liens officiels, pour le travail, les études et le visiteur. Deux fiches Canada viennent de Perplexity, les autres d'une recherche web limitée aux sites officiels. Six contradictions entre sources y sont listées pour être tranchées sur les pages officielles.

**Limite à connaître.** Le catalogue des 196 pays est un point de départ établi sans consultation systématique des sites officiels. Les noms de dispositifs sont ceux que je connais, et ils peuvent avoir changé (par exemple, le Royaume-Uni et l'Australie ont réformé leurs visas ces dernières années). Aucune fiche n'est donc marquée « vérifiée ». La phase 1 du planning prévoit le contrôle pays par pays.

### 3.3 Exigences par parcours (fiche pays)

Chaque fiche pays, par parcours, porte les informations suivantes. Elles sont saisies, sourcées et datées.

| Bloc | Travail | Études | Visiteur |
|---|---|---|---|
| Dispositif | Nom officiel et nom français, base légale | Type de visa ou de permis | Visa, e-Visa, ETA, visa à l'arrivée, exemption |
| Condition d'entrée | Offre ou contrat exigé (oui / non / selon le cas), employeur agréé, test du marché du travail | Admission préalable, établissement agréé | Nationalités concernées, motif de séjour |
| Conditions chiffrées | Salaire minimal, quota, métiers en pénurie (texte + source) | Preuve de fonds, assurance (texte + source) | Durée de séjour, entrées (texte + source) |
| Durée et suites | Durée, renouvellement, famille, voie vers la résidence | Droit de travailler, permis après le diplôme | Prolongation |
| Démarches | Étapes, délais indicatifs, frais publics | Étapes, délais, frais | Étapes, délais, frais |
| Sources | URL officielles, date et auteur de la vérification | idem | idem |

## 4. Modèle de données

Les noms suivent la convention du dépôt (snake_case, MySQL / Drizzle). Les clés étrangères sont logiques, comme dans le reste du schéma. Légende : **[nouveau]**, **[étend]** pour une table existante.

### 4.1 Vue d'ensemble

```text
                         ┌──────────────────────────────┐
                         │ catalogue pays (référentiel) │
                         │ country_pathways             │
                         │ country_visa_programs        │
                         │ country_sources              │
                         └─────────────┬────────────────┘
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
   TRAVAIL                           ÉTUDES                         VISITEUR
 placement_organizations [étend]   institutions                    visit_programs
   └─ job_offers                    └─ study_programs                └─ visit_packages
       ├─ job_offer_questions           ├─ study_intakes             visit_requests
       ├─ job_offer_reports             └─ study_tuition_fees
       └─ job_applications          study_applications
           ├─ application_consents       (liée à study_intakes)
           ├─ application_stages (config)
           ├─ interviews
           ├─ application_threads → application_messages
           └─ document_grants
 opportunity_events  (historique commun)      access_audit_log (append-only)
 candidate_notifications
```

### 4.2 Référentiel pays (partagé par les trois parcours)

**`country_pathways`** [nouveau] : une ligne par pays et par parcours.
`id`, `country_code` (ISO alpha-2), `pathway` (`work`/`study`/`visit`), `coverage` (`named`/`to_document`/`not_offered`), `summary`, `status` (`draft`/`needs_review`/`published`/`retired`), `checked_at`, `checked_by_admin_id`, `schema_version`.
Unicité : (`country_code`, `pathway`). Amorçage : 196 × 3 = 588 lignes.

**`country_visa_programs`** [nouveau] : un dispositif par ligne.
`id`, `country_code`, `pathway`, `program_ref` (identifiant du moteur dynamique, ex. `travail-employeur`), `official_name`, `name_fr`, `legal_basis`, `route_type` (`employer`/`qualified`/`transfer`/`seasonal`/`jobseeker`/`quota`/`points`), `job_offer_required` (`yes`/`no`/`depends`), `sponsor_licence_required`, `labour_market_test`, `salary_note`, `duration_note`, `renewable`, `family_allowed`, `residence_path_note`, `fees_note`, `processing_note`, `status`, `checked_at`.
Les champs `*_note` sont du texte libre avec source. Aucun n'est numérique, pour éviter de figer des chiffres périmés.

**`country_sources`** [nouveau] : `id`, `country_code`, `pathway`, `label`, `url`, `authority` (`immigration`/`embassy`/`ministry`/`education`/`employment`/`other`), `status` (`verified`/`needs_review`/`missing`), `checked_at`, `checked_by_admin_id`.
Reprend `OfficialSource` du dossier de formulaire dynamique et alimente `officialSourceCatalog`.

**`procedure_steps`** [nouveau] : le « comment faire » étape par étape d'un dispositif.
`id`, `visa_program_id`, `step_no`, `actor` (`employer`/`candidate`/`authority`/`agency`/`institution`), `title`, `description`, `documents_json`, `delay_note`, `fee_note`, `official_url`, `checked_at`, `status`.
Un même dispositif a des étapes pour l'employeur, le candidat et l'administration. L'espace client montre celles du candidat en premier, et l'espace employeur celles de l'employeur. Premier contenu : [procedures-vague-1.md](procedures-vague-1.md) (Canada, France, Allemagne, Belgique, Luxembourg, Royaume-Uni, Émirats arabes unis ; travail, études, visiteur).

### 4.3 Employeurs

**`placement_organizations`** [étend] : `verification_status` reçoit la valeur `refused` (le brief demande « en attente / vérifié / refusé »). Colonnes ajoutées : `registration_number`, `registration_country`, `website`, `sectors_json`, `public_name`, `hide_name_from_candidates` (booléen), `logo_key`, `recruitment_licence_note`, `refusal_reason_code`, `refusal_note`.

**`organization_verification_documents`** [nouveau] : `id`, `organization_id`, `kind` (`registry_extract`/`tax_id`/`licence`/`id_of_signatory`/`other`), `file_key`, `status`, `reviewed_by_admin_id`, `reviewed_at`.

### 4.4 Offres d'emploi

**`job_offers`** [nouveau]

| Colonne | Type | Note |
|---|---|---|
| `id`, `reference` | int, varchar | Référence lisible `OFF-AAAA-NNNN` |
| `organization_id` | int | Employeur vérifié uniquement |
| `title` | varchar | |
| `country_code`, `city`, `region` | varchar | Pays du poste |
| `domain_id` | varchar | Domaine du moteur dynamique (santé, numérique, BTP…) |
| `occupation_code` | varchar | Code ISCO-08 (classification internationale, commune à tous les pays) |
| `program_id` | varchar | Programme du moteur dynamique, ex. `travail-employeur` |
| `visa_program_id` | int | Lien vers `country_visa_programs` |
| `visa_sponsorship` | enum | `employer_sponsors`/`employer_assists`/`candidate_handles` |
| `contract_type` | enum | CDI, CDD, saisonnier, intérim, stage, alternance, indépendant |
| `contract_months` | int | Pour les contrats à durée déterminée |
| `salary_min`, `salary_max` | decimal | Optionnels |
| `salary_currency` | char(3) | ISO 4217 |
| `salary_period` | enum | heure, mois, an |
| `salary_visible` | bool | Le salaire est-il publié ? |
| `benefits_json` | json | Logement, billet, assurance, prime |
| `languages_json` | json | `[{langue, niveau CECR, obligatoire}]` |
| `diplomas_json` | json | `[{niveau, domaine, obligatoire}]` |
| `experience_min_years` | tinyint | |
| `start_date`, `start_flexible` | date, bool | Date de démarrage |
| `positions_count` | smallint | |
| `application_deadline` | date | |
| `description`, `requirements` | text | |
| `status` | enum | `draft`/`in_moderation`/`published`/`closed`/`rejected`/`archived` |
| `moderation_note`, `moderated_by_admin_id`, `moderated_at` | | |
| `published_at`, `closed_at`, `close_reason` | | `filled`/`cancelled`/`expired`/`withdrawn_by_admin` |
| `version` | int | Une modification d'une offre publiée la repasse en modération |

**`job_offer_questions`** [nouveau] : questions de pré-contrôle propres à l'offre (réutilisent `DynamicField` : `key`, `label`, `kind`, `options`, `required`).
**`job_offer_revisions`** [nouveau] : instantané JSON à chaque version, pour l'historique de modération.
**`job_offer_reports`** [nouveau] (signalements) : `offer_id`, `reporter_type` (`candidate`/`admin`/`employer`), `reporter_id`, `reason` (`fees_requested`/`fake_offer`/`discrimination`/`illegal_content`/`wrong_info`/`other`), `details`, `status` (`open`/`reviewing`/`upheld`/`dismissed`), `handled_by_admin_id`, `decision_note`.

**Filtres interdits dans une offre.** Pas de filtre sur l'âge, le sexe, la situation familiale ou la religion. La nationalité n'est utilisable que si l'employeur indique une exigence légale précise, validée en modération (voir la décision D3).

### 4.5 Candidatures à une offre

**`job_applications`** [nouveau]

`id`, `offer_id`, `candidate_id`, `dossier_id` (nullable), `status` (`submitted`/`screening`/`shortlisted`/`interview`/`offer_sent`/`accepted`/`hired`/`rejected`/`withdrawn`/`documents_requested`), `stage_code`, `precheck_json` (résultat par critère : atteint / partiel / non renseigné), `profile_snapshot_json` (profil minimal figé au moment de la candidature), `disclosure_level` (0 à 4, voir le § 5), `cover_note`, `rejection_code` (liste fermée), `submitted_at`, `last_status_at`.
Unicité : (`offer_id`, `candidate_id`).
Le pré-contrôle **n'écarte jamais** un candidat : il informe le candidat avant l'envoi et l'employeur après.

**`application_consents`** [nouveau] : `application_id`, `candidate_id`, `scope_json` (profil minimal, CV, portrait, niveaux de pièces), `text_version`, `granted_at`, `withdrawn_at`, `ip_hash`. Le retrait du consentement coupe les accès futurs ; il ne supprime pas ce qui a déjà été consulté, et le journal le conserve.

**`application_stages`** [nouveau, configuration] : étapes du tableau employeur, avec leur correspondance vers les étapes de l'agence (`selected`, `contract_invitation`, `protocol_two`, `procedure_ready`).

**`interviews`** [nouveau] : `application_id`, `proposed_slots_json`, `confirmed_slot`, `timezone` (nom IANA, car les deux parties sont souvent dans des pays différents), `mode` (`video`/`phone`/`onsite`), `join_url`, `status` (`proposed`/`confirmed`/`done`/`cancelled`/`no_show`), `employer_notes_private`.

**`application_threads`** et **`application_messages`** [nouveau] : une conversation par candidature. `sender_type` (`candidate`/`employer`/`admin`/`system`), `body`, `attachments_json`, `flagged` et `flag_reason`. Détection de coordonnées partagées trop tôt et de demandes d'argent (voir le § 5).

**`document_grants`** [nouveau] : `application_id`, `document_ref` (vers `candidate_files` ou `client_documents`), `level`, `granted_by` (`candidate`/`admin`), `granted_at`, `revoked_at`, `view_only` (bool).

### 4.6 Études

**`institutions`** [nouveau] : `id`, `country_code`, `city`, `name`, `type` (`university`/`college`/`business_school`/`language_school`/`vocational`/`other`), `public_private`, `website`, `accreditation_note`, `accreditation_source_url`, `agency_relation` (`partner`/`listed`), `logo_key`, `status`, `checked_at`.

**`study_programs`** [nouveau] : `institution_id`, `name`, `level` (`language`/`certificate`/`diploma`/`bachelor`/`master`/`phd`/`vocational`), `field`, `teaching_language`, `duration_months`, `mode` (`on_site`/`hybrid`), `admission_requirements_note`, `language_requirement_note`, `visa_program_id`, `source_url`, `status`.

**`study_intakes`** (rentrées) [nouveau] : `study_program_id`, `label` (« Automne 2027 »), `start_date`, `applications_open_at`, `application_deadline`, `documents_deadline`, `availability` (`open`/`closing_soon`/`closed`/`waitlist`), `source_url`, `checked_at`.

**`study_tuition_fees`** (scolarités) [nouveau] : `study_program_id`, `academic_year`, `student_category` (`international`/`local`), `amount`, `currency`, `period` (`year`/`semester`/`total`), `application_fee`, `extra_fees_json` (assurance, logement estimé), `source_url`, `checked_at`.
**Affichage :** le montant est toujours accompagné de l'année, de la devise, de la mention « indicatif » et de la date de vérification. Un montant plus ancien que 12 mois (seuil réglable) passe en « à reconfirmer ».

**`study_applications`** [nouveau] : `candidate_id`, `dossier_id`, `intake_id`, `preference_rank` (1 à 3), `status` (`draft`/`submitted_to_agency`/`agency_review`/`documents_requested`/`submitted_to_institution`/`offer_conditional`/`offer_unconditional`/`deposit_paid`/`admission_letter_received`/`visa_phase`/`rejected`/`withdrawn`), `institution_reference`, `snapshot_json`, `consent_id`, `submitted_at`.
La candidature passe par l'agence : le candidat ne dépose pas lui-même auprès de l'école. C'est le mode de fonctionnement d'une agence, et cela permet de contrôler les pièces avant envoi.

**`study_scholarships`** [nouveau, optionnel en phase 3] : bourses publiques ou privées liées à un pays ou à une école.

### 4.7 Visiteurs

**`visit_programs`** [nouveau] : `country_code`, `kind` (`tourism`/`family_visit`/`business`/`medical`/`event`/`transit`/`multi_entry`), `title`, `summary`, `authorization_type` (`visa`/`e_visa`/`eta`/`visa_on_arrival`/`visa_free`), `official_portal_url`, `eligibility_note` (« selon la nationalité »), `program_ref`, `status`, `checked_at`.
**`visit_packages`** [nouveau] : séjours et circuits de l'agence. `title`, `duration_days`, `season_note`, `includes_json`, `price_from` et `price_currency` **facultatifs**, avec `price_valid_until` et `price_source`. Sans ces trois champs, aucun prix n'est affiché. Le site n'a pas de tarif de vitrine sans provenance, et cela reste vrai ici.
**`visit_requests`** [nouveau] : `candidate_id`, `program_id`, `travel_dates`, `travellers`, `services_json` (billet, hôtel, assurance, itinéraire, lettre d'invitation), `status`. S'appuie sur `tourism_service_requests` et les modules de vols, hôtels et assurance existants.

### 4.8 Transverses

**`opportunity_events`** : historique commun (candidatures travail, études, demandes de séjour). `subject_type`, `subject_id`, `actor_type`, `actor_id`, `action`, `note`, `created_at`. Généralise `placement_submission_events`.
**`candidate_notifications`** : `candidate_id`, `type`, `subject_ref`, `read_at`, canaux `in_app`/`email`/`whatsapp` (WhatsApp seulement sur accord explicite).
**`access_audit_log`** : voir le § 5.4.

## 5. Confidentialité des données du candidat

### 5.1 Niveaux de divulgation

| Niveau | Déclencheur | Ce que voit l'employeur |
|---|---|---|
| 0 | Avant toute candidature | Rien |
| 1 (défaut) | Candidature envoyée avec consentement | **Profil minimal** : code profil, pays de résidence, métier, années d'expérience, niveau d'études, langues et niveaux, disponibilité, résumé validé par l'administrateur. Ni nom, ni photo, ni coordonnées, ni date de naissance. |
| 2 | Présélection ou entretien planifié | CV complet, nom, portrait si le candidat l'a autorisé, lettre. Contact par la messagerie de la plateforme. |
| 3 | Offre envoyée | Diplômes, certificats de travail, résultats de tests de langue. Consultation en lecture seule, filigrane au nom de l'employeur. |
| 4 | Offre acceptée / contrat confirmé | Pièces d'identité et de procédure (passeport, casier, certificat médical). Elles transitent par l'agence, qui en reste le point de contact. |

Les niveaux 3 et 4 correspondent aux étapes existantes `contract_invitation` et `protocol_two`.

### 5.2 Règles

- Le candidat voit à tout moment ce qui est partagé et peut retirer l'accès futur à une pièce.
- Le passage d'un niveau au suivant est décidé par l'étape de la candidature. Il n'y a pas de bouton « tout voir ».
- Le profil minimal est un **instantané** pris à la candidature. Une modification ultérieure du dossier ne change pas ce que l'employeur a vu.
- Les coordonnées personnelles ne circulent pas avant le niveau 2, et le contact reste médié par l'agence, comme dans les documents actuels (« Contact : 3M TRAVEL AGENCY uniquement »).
- La messagerie détecte les numéros, e-mails, liens de paiement et demandes d'argent. Le message est alors retenu pour contrôle d'un administrateur.
- **Aucun frais n'est demandé au candidat par un employeur.** C'est une règle de modération et un motif de suspension immédiate.

### 5.3 Données sensibles

Passeport, casier judiciaire, certificat médical et photo ne sont jamais visibles en dessous du niveau 4 (portrait : niveau 2, avec consentement). Ils sont conservés dans le coffre existant (`documentVaultPolicy`), sans copie chez l'employeur.

### 5.4 Journal d'audit des accès

**`access_audit_log`** : `id`, `actor_type` (`employer_user`/`admin`/`system`), `actor_id`, `organization_id`, `candidate_id`, `application_id`, `resource_type` (`profile`/`cv`/`document`/`message`/`interview`), `resource_id`, `action` (`view`/`download`/`print`/`export`), `ip_hash`, `user_agent_hash`, `created_at`.

- **Une ligne par consultation**, y compris celles des administrateurs.
- **Ajout seulement** : aucune modification ni suppression possible depuis l'application. Un hachage chaîné (chaque ligne contient l'empreinte de la précédente) permet de détecter une altération.
- Le candidat consulte la liste de ses propres consultations. L'administrateur filtre par candidat, employeur et période, et exporte en CSV.
- Une alerte se déclenche sur un volume anormal de consultations ou sur des téléchargements en rafale.
- Durée de conservation : à fixer avec le conseil juridique (décision D8).

## 6. Rôles et modération

### 6.1 Validation d'un employeur

1. Inscription (déjà en place via `placement_access_requests`).
2. Contrôle administratif : numéro d'immatriculation, site, domaine de l'adresse e-mail (une adresse gratuite est un signal d'alerte), pièces, appel de vérification si nécessaire, licence de recrutement exigée dans certains pays.
3. Décision : vérifié / refusé (avec motif codé) / complément demandé.
4. Seul un employeur vérifié peut soumettre une offre.

### 6.2 Grille de modération d'une offre

| Contrôle | Résultat attendu |
|---|---|
| L'employeur est vérifié et actif | Oui |
| Le dispositif de visa existe pour ce pays et correspond au poste | Oui, ou « à confirmer » avec note |
| Aucun frais demandé au candidat | Oui |
| Pas de discrimination (âge, sexe, origine, religion) | Oui |
| Salaire plausible pour le pays et le métier | Oui, ou salaire non publié |
| Pas de coordonnées personnelles dans le texte | Oui |
| Description cohérente (poste, lieu, contrat, langue) | Oui |

Décisions : publier, demander des corrections, refuser. Un objectif de délai de traitement est affiché dans le tableau de bord.

### 6.3 Signalements

Tout candidat signale une offre en un clic. Un signalement « frais demandés » ou « fausse offre » retire l'offre de la liste en attendant l'instruction.

## 7. Faisabilité juridique à valider avant l'ouverture

Ces points ne sont pas techniques. Ils conditionnent le lancement.

1. **Autorisation de placement.** Selon les pays, le recrutement ou le placement de travailleurs à l'étranger exige un agrément (pays d'origine du candidat et pays d'accueil). À faire confirmer par un juriste pour le Cameroun et pour chaque pays de la première vague.
2. **Protection des données.** Loi camerounaise sur les données personnelles et, pour les candidats ou employeurs de l'Union européenne, le RGPD. Transferts transfrontaliers, base légale du consentement, droit d'accès et d'effacement.
3. **Responsabilité sur les offres.** Conditions d'utilisation de l'employeur, clause de non-facturation de frais au candidat, droit de retrait par l'agence.
4. **Non-discrimination.** Encadrement des filtres de nationalité et de langue.
5. **Promesses.** Le site ne promet ni visa ni embauche. Le pré-contrôle est indicatif et ne remplace pas l'avis de l'autorité d'immigration.

## 8. Prérequis à lever avant la mise en ligne

| Prérequis | Constat à ce jour | Action |
|---|---|---|
| Corriger `/mon-dossier` | Dans `App.tsx`, la route redirige côté client vers `/mon-espace?section=dossier`. Je n'ai **pas reproduit** de dysfonctionnement en navigateur. | Reproduire le problème exact (connecté et non connecté), puis vérifier que le serveur répond 200 ou 301 et jamais 404 (règle du registre des routes publiques). |
| Finaliser les pages vides | Les audits précédents (`audit-ecrans-blancs-v75.md`, parcours du site des 11 et 19 octobre 2026) listent des pages à contenu insuffisant, mais je n'ai pas refait de parcours complet pour ce dossier. | Refaire un parcours complet, produire la liste des pages vides avec leur URL, les traiter avant la phase 4. |
| Contenu employeur sans promesse | Les pages employeurs existantes doivent rester cohérentes avec le nouveau module. | Relecture des textes `contentCampaignPartners`. |

## 9. Planning par phases

Les durées sont des estimations pour une équipe d'un développeur à temps plein et un administrateur qui valide les contenus. Elles sont à rediscuter avec vous. Chaque phase se termine par une démonstration et une validation avant la suivante.

| Phase | Contenu | Durée |
|---|---|---|
| 0. Validation | Valider ce dossier, trancher les décisions D1 à D10, avis juridique lancé. Lever les prérequis du § 8. | 1 à 2 semaines |
| 1. Catalogue pays | Tables `country_*` et `procedure_steps`, amorçage des 196 pays, import des procédures de la vague 1 après relecture des pages officielles, écran d'administration de la matrice. | 2 à 3 semaines |
| 2. Visiteurs | Section « Opportunités » dans l'espace client, routage par projet, programmes de séjour, demande de services. C'est la phase la plus simple et elle livre de la valeur très tôt. | 2 semaines |
| 3. Études | Écoles, programmes, rentrées, scolarités, vœux, candidature via l'agence, suivi. Administration du catalogue des écoles. | 4 à 5 semaines |
| 4. Offres d'emploi | Comptes employeurs vérifiés, création d'offres, modération, liste dans l'espace client, pré-contrôle, candidature avec consentement. | 4 à 5 semaines |
| 5. Pipeline | Tableau par étape, entretiens avec fuseaux horaires, messagerie modérée, notifications, niveaux de divulgation 1 à 4. | 4 semaines |
| 6. Audit et durcissement | Journal d'audit, signalements, alertes, tests de sécurité et de charge, revue juridique finale. | 2 à 3 semaines |
| 7. Pilote | Ouverture à 2 ou 3 pays et à quelques employeurs choisis, mesure, correction. | 4 semaines |
| 8. Extension | Vagues de pays supplémentaires : sourcer les fiches de niveau B, 15 à 20 pays par vague. | Continu |

Total jusqu'au pilote : environ 5 à 6 mois. Les phases 2 et 3 peuvent démarrer avant la fin de la phase 1 pour les pays déjà sourcés.

**Ordre de lancement des pays (proposition).** Vague 1 : Canada, France, Allemagne, Belgique, Luxembourg, Royaume-Uni, Émirats arabes unis. Ce choix suit les pays déjà présents dans vos parcours. À ajuster selon votre portefeuille réel.

## 10. Décisions à prendre

| N° | Question | Recommandation |
|---|---|---|
| D1 | Le candidat voit-il le nom de l'employeur avant de postuler ? | Oui par défaut, sauf si l'employeur demande à le masquer. |
| D2 | Le candidat peut-il postuler sans passer par l'agence ? | Oui pour l'envoi, mais le dossier de visa reste suivi par l'agence. |
| D3 | La nationalité est-elle visible dès le niveau 1 ? | Non, à partir du niveau 2, sauf exigence légale justifiée en modération. |
| D4 | Publication des offres : automatique ou modérée ? | Toujours modérée en pilote. |
| D5 | Nombre maximal de candidatures actives par candidat | 5, pour éviter les envois en masse. |
| D6 | Études : le candidat dépose-t-il lui-même auprès de l'école ? | Non, via l'agence. |
| D7 | Les salaires sont-ils obligatoires dans une offre ? | Recommandé mais facultatif ; la fourchette publiée doit être réelle. |
| D8 | Durée de conservation du journal d'audit | À fixer avec le juriste. |
| D9 | Modèle économique (frais de dossier, commission employeur, abonnement) | À définir. Il conditionne la mention « aucun frais pour le candidat ». |
| D10 | Les visiteurs voient-ils des prix ? | Seulement avec provenance et date de validité. |

## 11. Risques principaux

| Risque | Parade |
|---|---|
| Fausses offres ou arnaques au recrutement | Vérification des employeurs, modération, signalements, interdiction des frais pour le candidat |
| Données périmées (scolarités, dispositifs, dates) | Date de vérification affichée, alerte de fraîcheur, mention « à reconfirmer » |
| Promesse implicite de visa | Textes validés, pré-contrôle indicatif, règle « À confirmer » |
| Fuite de données candidat | Niveaux de divulgation, filigrane, journal d'audit, pas de copie des pièces sensibles chez l'employeur |
| Charge de modération | Grille, file de priorité, alertes automatiques, objectif de délai |
| Ampleur du catalogue mondial | Niveaux A et B, vagues successives, aucune fiche affichée sans validation |
