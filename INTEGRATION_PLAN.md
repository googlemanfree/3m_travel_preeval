# Plan d'Intégration Progressive - 61 Fichiers

## Phase 1 : Routeurs tRPC (13 fichiers)
Intégration des routeurs serveur dans `/server/routers/`

### Routeurs à intégrer :
- [ ] `adminAuth.ts` - Authentification admin OTP
- [ ] `agencyDossier.ts` - Gestion des dossiers en agence
- [ ] `candidate.ts` - Gestion des candidats
- [ ] `clientDocuments.ts` - Documents clients
- [ ] `contact.ts` - Formulaire de contact
- [ ] `evaluation.ts` - Évaluations
- [ ] `evaluationComments.ts` - Commentaires d'évaluation
- [ ] `exportRouter.ts` - Exports statistiques
- [ ] `invoiceService.ts` - Gestion des factures
- [ ] `oauthUserDashboard.ts` - Tableau de bord OAuth
- [ ] `payment.ts` - Paiements
- [ ] `profileEvaluation.ts` - Évaluation de profil
- [ ] `translation.ts` - Traductions

### Actions :
1. Vérifier les imports et les tables référencées
2. Corriger les références aux tables inexistantes
3. Tester chaque routeur individuellement
4. Ajouter au fichier `routers.ts` principal

---

## Phase 2 : Pages React (44 fichiers)
Intégration des pages dans `/client/src/pages/`

### Pages Admin (10 fichiers) :
- [ ] `AdminDashboard.tsx` - Tableau de bord admin
- [ ] `AdminLogin.tsx` - Connexion admin
- [ ] `AdminEvaluation.tsx` - Évaluation admin
- [ ] `AdminEvaluations.tsx` - Liste des évaluations
- [ ] `AdminAccompagnement.tsx` - Accompagnement
- [ ] `AdminProcedures.tsx` - Procédures
- [ ] `AdminAgencyDossiers.tsx` - Dossiers en agence
- [ ] `AdminInvite.tsx` - Invitations
- [ ] `AdminUserDetails.tsx` - Détails utilisateur
- [ ] `AdminUsersManagement.tsx` - Gestion des utilisateurs

### Pages Client (15 fichiers) :
- [ ] `Home.tsx` - Accueil
- [ ] `Login.tsx` - Connexion
- [ ] `Register.tsx` - Inscription
- [ ] `Dashboard.tsx` - Tableau de bord client
- [ ] `ClientDashboard.tsx` - Espace client
- [ ] `MySpace.tsx` - Mon espace
- [ ] `Evisa.tsx` - eVisa
- [ ] `EvisaDemande.tsx` - Demande eVisa
- [ ] `Flights.tsx` - Vols
- [ ] `Guide.tsx` - Guide
- [ ] `Procedures.tsx` - Procédures
- [ ] `Ressources.tsx` - Ressources
- [ ] `ResetPassword.tsx` - Réinitialisation mot de passe
- [ ] `ResetPasswordSimple.tsx` - Réinitialisation simple
- [ ] `ScheduleAgency.tsx` - Planification agence

### Pages Modales/Composants (19 fichiers) :
- [ ] Autres pages et composants...

---

## Phase 3 : Configuration et Tests
- [ ] Mettre à jour `routers.ts` pour inclure tous les routeurs
- [ ] Tester la compilation TypeScript
- [ ] Tester le serveur de développement
- [ ] Tester les routes principales

---

## Notes Importantes :
1. **Tables inexistantes** : Certains routeurs référencent des tables qui n'existent pas
   - `transactions`
   - `contactMessages`
   - `clientPayments`
   - `agencyDossierHistory`
   
2. **Colonnes inexistantes** : Certains routeurs utilisent des colonnes qui n'existent pas
   - `agencyDossiers.createdByAdmin`
   - Autres à vérifier

3. **Stratégie** : 
   - Intégrer progressivement
   - Corriger les erreurs au fur et à mesure
   - Tester après chaque étape
   - Créer des checkpoints réguliers
