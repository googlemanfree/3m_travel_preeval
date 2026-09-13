# Protocoles d'Accord N°01 / N°02 — état d'implémentation et reste à faire

Cahier des charges original de l'utilisateur : voir les deux modèles Luxembourg intégraux dans
`docs/protocole-accord-01-luxembourg.md` et `docs/protocole-accord-02-luxembourg.md`.

Important : le système doit fonctionner **pour chaque pays de destination choisi par le candidat**,
pas seulement le Luxembourg. Le Luxembourg est aujourd'hui la seule destination pour laquelle
l'agence a communiqué des montants réels pour le Protocole N°02 (2 300 000 / 2 645 000 / 2 875 000
FCFA) ; pour toute autre destination, tant que l'agence n'a pas communiqué de barème réel, le
Protocole N°02 doit rester générique et ne jamais inventer de montant.

## Déjà fait dans ce commit (git, à publier)

1. **Correction d'un bug réel** (`server/routers/candidate.ts`, `getClientDashboardSummary` et
   `getMyDossierData`) : le dossier "actif" affiché au candidat était toujours le plus récent
   (`ORDER BY createdAt DESC LIMIT 1`), même si un dossier plus ancien était celui réellement payé.
   Conséquence : des candidats ayant payé ne voyaient plus l'alerte "Signez votre protocole
   d'accord" ni le protocole lui-même, car le système regardait une ligne `applications` plus
   récente et non payée. Corrigé : on préfère désormais la ligne payée (`paymentStatus SUCCESS`)
   à la plus récente. Cette correction doit résoudre automatiquement la majorité des cas signalés
   ("plusieurs candidats demandent le protocole d'accord").

2. **Protocole N°01 générique amélioré** (`shared/agreementProtocolContent.ts`,
   `INITIAL_AGREEMENT_PROTOCOL`) : articles renumérotés "Article 1" à "Article 8", montant réel de
   65 000 FCFA explicité (au lieu d'une formulation abstraite), article 6 clarifié sur le
   déclenchement du second protocole après sélection par un employeur et soumission aux agences
   partenaires de placement. Ce texte reste le texte affiché aujourd'hui dans
   `client/src/pages/MySpace.tsx` (case à cocher + `SignatureCanvas`) — donc déjà utilisable sans
   changement de composant.

3. **Nouveaux modèles riches paramétrés par pays**
   (`shared/agreementProtocolCountryTemplates.ts`) :
   - `COUNTRY_PROTOCOL_PROFILES` : table par pays (aujourd'hui seul `luxembourg` est renseigné avec
     les vraies données — autorité de l'emploi ADEM, Direction de l'Immigration, Ambassade de
     Belgique à Yaoundé, barème des 3 formules). `getCountryProtocolProfile(destination)` retombe
     sur un profil générique neutre pour toute destination non encore configurée (aucun chiffre
     inventé).
   - `buildProtocolOneRichText(vars, destination)` / `buildProtocolTwoRichText(vars, destination)` :
     génèrent le texte complet (en-tête société, articles numérotés, bloc de signature) en
     substituant les variables candidat + le profil pays. C'est la base textuelle à utiliser pour
     la génération PDF et l'affichage web enrichi demandés par l'utilisateur.

4. **Rattrapage côté back-office** (`server/routers/adminCandidateManagement.ts` +
   `client/src/components/AdminPaymentManagement.tsx`) :
   - Nouvelle requête `listCandidatesAwaitingAgreementProtocol` (dossiers payés, protocole non
     signé).
   - Nouveau bouton "Envoyer le protocole" sur chaque ligne "Accord requis" du tableau des
     paiements admin, avec boîte de dialogue de confirmation (validation humaine explicite avant
     envoi) qui appelle la mutation existante `sendAgreementProtocol` (déjà en prod : dépose un
     document "vérifié" dans l'espace client et envoie un e-mail HTML). Permet de régulariser
     manuellement les dossiers plus anciens si la correction n°1 ne suffit pas pour un cas
     particulier.

## Reste à faire (nécessite une implémentation plus large côté infra — PDF, email, DB, back-office)

D'après le cahier des charges complet de l'utilisateur :

1. **Génération PDF réelle** des Protocoles N°01 et N°02 (actuellement `sendAgreementProtocol`
   envoie un e-mail HTML, pas une pièce jointe PDF). Utiliser la librairie déjà en place dans le
   projet pour la génération PDF (voir `server/pdfReportGenerator.ts` / `server/utils/paymentReceipt.ts`
   qui génère déjà le reçu en PDF) et l'étendre aux deux protocoles, à partir des textes de
   `agreementProtocolCountryTemplates.ts`.

2. **Nouveaux champs en base** sur `applications` (`drizzle/schema.ts`) pour l'audit de signature :
   empreinte SHA de validation, adresse IP au moment de la signature de chaque protocole (le champ
   `agreementIpAddress` existe déjà pour le protocole 1 — vérifier s'il est bien renseigné à la
   signature), formule choisie pour le Protocole N°02 (`0 | 1 | 2`), nom de l'employeur et poste
   retenu (`{{EMPLOYEUR_LUXEMBOURG_NOM}}` / `{{POSTE_RETENU}}` du cahier des charges), référence du
   Protocole N°02 signé et son URL PDF.

3. **Back-office — déclenchement du Protocole N°02** : bouton "Valider la sélection candidat" sur
   la fiche candidat (probablement dans `Candidate360Workspace.tsx`, à côté de
   `sendAgreementProtocol` existant) qui : (a) enregistre l'employeur et le poste retenu, (b)
   débloque l'affichage du Protocole N°02 dans l'espace client, (c) envoie une notification e-mail
   de sélection avec lien de connexion.

4. **Espace client — section "Mes Documents & Contrats"** : nouvel onglet ou section listant les
   deux protocoles (statut, date de signature, bouton de téléchargement PDF). Pour le Protocole
   N°02 : affichage des 3 formules du profil pays sous forme de boutons radio (voir
   `CountryProtocolProfile.secondProtocolFormulas` dans `agreementProtocolCountryTemplates.ts`),
   sélection obligatoire avant signature électronique, horodatage + IP capturés côté serveur au
   moment de la signature (pas seulement côté client).

5. **E-mails transactionnels avec pièces jointes PDF** : étendre `sendAgreementProtocol` (et créer
   l'équivalent pour le Protocole N°02) pour joindre le PDF généré au lieu du seul corps HTML,
   selon le canal d'envoi déjà utilisé sur le projet (voir `server/emailService.ts` /
   `server/_core/email.ts`).

6. **Statuts de dossier back-office** proposés par l'utilisateur, à faire correspondre aux valeurs
   existantes de `dossierStatus` dans `drizzle/schema.ts` (`nouveau`, `en_evaluation`,
   `bilan_envoye`, `en_attente_paiement`, `paye`, `en_attente_documents`, `documents_recus`,
   `soumis_agences`, `en_cours_recrutement`, `contrat_obtenu`, `visa_approuve`, `refuse`) — vérifier
   si un nouveau statut explicite "candidat sélectionné / Protocole 02 actif" doit être ajouté à
   cette liste plutôt que de réutiliser `contrat_obtenu`.

Merci de construire ces points sur un environnement de test, de vérifier la réception réelle des
e-mails avec pièces jointes PDF, puis de publier.
