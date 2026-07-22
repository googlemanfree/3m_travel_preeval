# 3M Travel & Services - TODO

- [x] Créer le schéma DB pour les demandes d'évaluation (table evaluations)
- [x] Créer la route tRPC pour soumettre une évaluation avec upload de fichier
- [x] Créer la page principale avec 3 sections : Schengen, Canada, Autre pays
- [x] Implémenter le formulaire multi-étapes avec sélection de type de visa
- [x] Ajouter le champ upload de CV (fichier PDF/DOC)
- [x] Connecter le formulaire à la route backend tRPC
- [x] Ajouter la notification WPS (email) lors de la soumission
- [x] Tester le formulaire complet et la soumission
- [x] Ajouter une barre de progression visuelle en 3 étapes (Destination / Visa / Profil)
- [x] Animer les transitions entre étapes avec framer-motion (slide + fade)
- [x] Animer l'apparition des cartes de visa lors de la sélection de destination
- [x] Animer le formulaire complet avec entrée progressive des champs
- [x] Uploader le logo 3M sur S3 et récupérer l'URL publique
- [x] Mettre à jour la palette CSS aux couleurs exactes du logo (bleu royal #1E3A8A, bleu ciel #7CB9E8, blanc)
- [x] Remplacer l'icône avion dans le header par le vrai logo 3M
- [x] Intégrer le logo dans le hero (section principale)
- [x] Intégrer le logo dans le footer
- [x] Générer et configurer le favicon avec le logo 3M
- [x] Ajouter une section Témoignages avec 6 avis de clients ayant obtenu leur visa
- [x] Implémenter un carousel automatique avec navigation manuelle
- [x] Animer les cartes avec Framer Motion (fade + slide)
- [x] Ajouter les étoiles de notation et les drapeaux des pays obtenus
- [x] Validation temps réel sur tous les champs obligatoires (nom, email, téléphone, message)
- [x] Indicateurs visuels vert/rouge sur les champs (bordure + icône checkmark/erreur)
- [x] Messages d'erreur contextuels sous chaque champ
- [x] Compteur de caractères sur le champ message
- [x] Validation du format email et téléphone en temps réel
- [x] Indicateur de force du formulaire (% de complétion)
- [x] Ajouter un bouton WhatsApp flottant en bas à droite avec animation et message pré-rempli
- [x] Ajouter le bloc légal RC/NIU + Charte de Transparence dans le footer
- [x] Créer la section Tarifs & Garanties avec 3 pricing cards (Intégral, Échelonné, Permis Garanti)
- [x] Ajouter le CTA "Évaluer mon éligibilité en 2 minutes" dans le header et le hero
- [x] Créer la modal d'auto-évaluation express avec 6 champs
- [x] Implémenter la redirection WhatsApp avec message pré-rempli à la soumission
- [x] Configurer les credentials Travelport API (OAuth2) — mode démo, à connecter dès réception credentials
- [x] Créer les routes backend : auth Travelport, recherche de vols (Low Fare Shopping), pricing, booking
- [x] Créer la page /flights avec moteur de recherche avancé (aller simple/retour/multi)
- [x] Autocomplétion IATA des aéroports (YAO, CDG, etc.)
- [x] Sélecteur de dates avec calendrier (dates passées bloquées)
- [x] Dropdowns passagers & classes (Adultes, Enfants, Bébés, Éco, Affaires, 1ère)
- [x] Tableau des résultats de vols avec cartes (logo compagnie, horaires, prix)
- [x] Filtres dynamiques (escales, compagnies, prix slider, horaires)
- [x] Marge bénéficiaire configurable pour les prix affichés
- [x] Bouton WhatsApp "Envoyer cet itinéraire à un conseiller" sur chaque vol
- [x] Système de cache temporaire pour optimiser les requêtes API
- [x] Extraire le contenu des PDFs de procédures (80+ fichiers)
- [x] Créer la page /procedures avec onglets Canada/Luxembourg/Pologne&Europe
- [x] Implémenter le catalogue dynamique avec filtres par pays et type de visa
- [x] Créer la timeline verticale/horizontale du parcours candidat (5 étapes)
- [x] Ajouter le bandeau de conformité juridique et éthique
- [x] Uploader les PDFs sur S3 et créer les liens de téléchargement
- [x] Ajouter le lien "Procédures" dans la navigation principale (header + footer + page Vols)

## Refonte Immigration & Mobilité Internationale (v2)
- [x] Refondre la page /procedures : 5 destinations (Canada, Luxembourg, Pologne, Europe Schengen, Golfe)
- [x] Boutons CTA tous fonctionnels : formulaire multi-étapes, WhatsApp pré-rempli, pop-up Europe
- [x] Section sélection de formule de paiement (Intégral / Échelonné / Permis Garanti) avec frais 65 000 FCFA
- [x] Pop-up détails Europe Schengen (Allemagne, France, Belgique) avec procédures Chancenkarte
- [x] Afficher les exigences Luxembourg (salaire 3 165 EUR/mois, contrat MAEE)
- [x] Afficher les conditions Pologne (25,36-25,50 PLN/h, hébergement inclus)
- [x] Intégrer le formulaire d'évaluation multi-étapes directement sur la page /procedures

## Compteur dynamique de dossiers traités
- [x] Créer le composant CounterStats réutilisable avec animation de décompte au scroll (useIntersectionObserver)
- [x] Intégrer le compteur dans Home.tsx (section chiffres clés)
- [x] Intégrer le compteur dans Procedures.tsx (sous le hero)

## Espace Candidat — Compte & Tableau de Bord
- [x] Étendre le schéma DB : tables candidates, candidate_files, candidate_messages
- [x] Appliquer la migration DB via pnpm db:push
- [x] Procédures tRPC : register, login, logout, getProfile, updateProfile
- [x] Procédures tRPC : getMyDossier, uploadDocument, listDocuments
- [x] Procédures tRPC : sendMessage, getMessages (messagerie candidat ↔ conseiller)
- [x] Page /register : formulaire d'inscription (nom, email, mot de passe, destination, téléphone)
- [x] Page /login : formulaire de connexion avec gestion d'erreurs
- [x] Page /dashboard : tableau de bord candidat (statut dossier, documents, messages)
- [x] Protéger la route /dashboard (redirection vers /login si non connecté)
- [x] Ajouter le lien "Mon Espace" dans la navigation de toutes les pages
- [x] Intégrer l'upload de documents (CV, passeport, diplômes) via S3 via route Express multer

## Authentification Renforcée — Email OTP & Protection des Routes
- [x] Ajouter colonnes emailVerified, emailVerificationOtp, otpExpiresAt, passwordResetToken, passwordResetExpiresAt dans la table candidates
- [x] Procédure tRPC : verifyEmail(otp) — valider le code OTP
- [x] Procédure tRPC : resendVerificationEmail — renvoyer l'OTP
- [x] Procédure tRPC : requestPasswordReset(email) — envoyer un lien de réinitialisation
- [x] Procédure tRPC : resetPassword(token, newPassword) — réinitialiser le mot de passe
- [x] Envoyer l'OTP par email via Nodemailer/SMTP au moment de l'inscription
- [x] Envoyer l'email de réinitialisation de mot de passe par email
- [x] Page /verify-email : saisie du code OTP à 6 chiffres
- [x] Page /forgot-password : formulaire email pour demander la réinitialisation
- [x] Page /reset-password : formulaire nouveau mot de passe (avec token dans l'URL)
- [x] Refondre /register : indicateur de force du mot de passe (8 car, 1 chiffre, 1 majuscule)
- [x] Refondre /login : option "Se souvenir de moi", lien "Mot de passe oublié ?"
- [x] Auth Guard sur /flights : écran d'accès refusé avec CTA connexion/inscription
- [x] Auth Guard sur /procedures : écran d'accès refusé avec CTA connexion/inscription
- [x] Message d'avertissement sur /login quand redirigé depuis une page protégée
- [x] Améliorer /dashboard : message d'accueil personnalisé + raccourcis vers les services

## Nom agence + Signature concepteur
- [x] Afficher "3M Travel Agency" en grand dans le hero de Home.tsx
- [x] Ajouter la signature Aureol Donfack avec CTA WhatsApp/email dans le footer

## Visuels Hero — Logo et Image Passeport/Visa
- [x] Générer une image hero de personnes avec passeport et visa (style professionnel, tons bleus)
- [x] Agrandir et améliorer l'affichage du logo 3M dans le hero
- [x] Uploader les visuels sur S3 et intégrer dans Home.tsx

## Refonte Destinations — 6 Régions Mondiales (v3)
- [x] Corriger les destinations : extraire toutes les destinations réelles des 89 PDFs
- [x] Organiser en 6 grandes régions : Canada, Europe Schengen (30+ pays), Royaume-Uni & États-Unis, Golfe & Moyen-Orient, Océanie, Caucase & Stratégie Schengen
- [x] Générer des images pour chaque région (IA)
- [x] Rendre la page /procedures publique (accessible sans connexion)
- [x] Intégrer image dédiée pour le Caucase (Arménie, Géorgie, Azerbaïdjan)

## Barre de Recherche Interactive — Page /procedures
- [x] Barre de recherche avec suggestions automatiques (pays, visa, procédure)
- [x] Filtrage en temps réel des régions et destinations par mot-clé
- [x] Affichage des résultats groupés par région avec navigation directe
- [x] Raccourcis rapides (tags cliquables) : Canada, Schengen, UK, USA, Qatar, Australie...

## Refonte Navigation — Uniformisation
- [x] Composant Navbar réutilisable : logo propre, liens uniformes, sans numéros de téléphone
- [x] Retirer les numéros de téléphone des headers de toutes les pages
- [x] Consolider les numéros de téléphone uniquement dans les footers
- [x] Boutons uniformes dans toutes les navbars (style cohérent)

## Module Paiement CinetPay & Panneau Admin PDF
- [x] Table applications en DB (26 colonnes : id, dossierNumber, candidateId, fullName, email, whatsapp, destination, formulaChosen, paymentStatus, paymentTransactionId, paymentAmount, paymentCurrency, paymentMethod, paymentDate, dossierStatus, adminNote, etc.)
- [x] Procédures tRPC : createApplication, getMyApplications, getApplicationByDossierNumber, listApplications (admin), updateApplicationStatus (admin)
- [x] Intégration CinetPay : initialisation transaction 65 000 FCFA (MTN MoMo, Orange Money, Visa/Mastercard)
- [x] Webhook sécurisé POST /api/cinetpay/webhook pour mise à jour payment_status avec double vérification API
- [x] Page /open-dossier : formulaire multi-étapes (Destination/Formule → Infos perso → Profil pro → Paiement)
- [x] Page /payment-success : confirmation avec numéro dossier #3M-XXXX et prochaines étapes
- [x] Page /payment-failed : page d'erreur avec bouton retenter et contact WhatsApp
- [x] Panneau admin /admin : liste des dossiers avec filtres [Payé/En attente/Tous], statistiques, notes internes
- [x] Bouton "Imprimer fiche PDF" par candidat avec logo 3M, infos légales, tableau structuré
- [x] CSS @media print pour impression optimisée des fiches candidats
- [x] Notifications email : confirmation candidat + alerte admin + confirmation paiement (sendDossierConfirmationEmail, sendAdminNewDossierAlert, sendPaymentSuccessEmail)
- [x] Sécurité admin : protectedProcedure + vérification ctx.user.role === 'admin' côté backend, useAuth().user?.role === 'admin' côté frontend
- [x] Promotion du propriétaire en admin via SQL (openId = VgxUFTC4ywmuDrGzDmfJRT)
- [x] Navbar mise à jour : bouton "Ouvrir un dossier" + lien "Admin" visible uniquement pour les admins

## Tunnel de Conversion — Scoring Automatique & Upload Documents (v4)
- [x] Moteur de scoring partagé (client/src/lib/scoring.ts) : 5 critères, 100 points (formation 25, expérience 25, langues 20, secteur 20, âge 10)
- [x] Composant ProcedureDetailModal : fiche informative complète par procédure avec prérequis, documents requis, délais, budget, bouton "Continuer"
- [x] Composant ScoringForm : formulaire multi-étapes (Infos perso → Profil pro avec score temps réel → Upload documents → Résultat + Paiement)
- [x] Upload de documents publique (passeport, CV, diplôme) via route POST /api/candidate/upload-public (sans authentification)
- [x] Remplacement des boutons WhatsApp "Démarrer ma procédure" par le tunnel bleu "Démarrer ma procédure" → ProcedureDetailModal → ScoringForm
- [x] Schéma DB étendu : colonnes passportUrl, cvUrl, diplomaUrl, scoringTotal, scoringDetails (JSON), scoringBadge
- [x] Procédure createApplication étendue : accepte les URLs de documents et le scoring
- [x] Panneau Admin : filtre par score (Très favorable / Admissible / À renforcer / Non évalué)
- [x] Panneau Admin : badge de score coloré sur chaque carte de dossier
- [x] Panneau Admin : détail du scoring (barres par critère) dans la section expandable
- [x] Panneau Admin : liens cliquables vers les documents (Passeport, CV, Diplôme) dans la section expandable
- [x] Fiche PDF : section "Score d'éligibilité" avec score/100, badge profil et détail par critère
- [x] Fiche PDF : section "Documents fournis" avec liste des documents téléversés
- [x] Statistique "Profils éligibles" dans le tableau de bord admin (remplace "En attente paiement")

## Améliorations UX — Barre de Progression & Animations (v5)
- [x] Barre de progression linéaire dans l'en-tête du ScoringForm (0% → 100% au fur et à mesure des étapes)
- [x] Animations de transition fluides entre les étapes (fade + slide horizontal)
- [x] Stepper animé avec agrandissement (scale) de l'étape active
- [x] Connecteurs entre les étapes animés (changement de couleur quand complété)
- [x] AnimatePresence pour gérer les entrées/sorties des contenus d'étapes


## Amélioration des Inscriptions — Confirmation Email & Corrections de Bugs (v6)
- [x] Ajouter colonnes emailVerified, emailOtp, emailOtpExpiresAt à la table applications
- [x] Modifier createApplication : créer l'application avec emailVerified=false, générer et envoyer OTP
- [x] Créer une page /verify-application-email pour vérifier l'OTP avant le paiement
- [x] Intégrer la vérification email dans le tunnel ScoringForm (après étape 4, avant redirection paiement)
- [x] Ajouter procédure verifyApplicationOtp : vérifier OTP et initialiser paiement CinetPay
- [x] Route /verify-application-email intégrée dans App.tsx
- [x] Adapter OpenDossier.tsx pour rediriger vers /verify-application-email
- [x] Retirer emailOtp de la réponse createApplication (sécurité)
- [x] Ajouter procédure resendApplicationOtp pour renvoyer l'OTP si expiré
- [x] Implémenter handleResend dans VerifyApplicationEmail.tsx
- [ ] Corriger le bug : login candidat ne vérifiait pas emailVerified (ajouter la vérification)
- [ ] Corriger le bug : VerifyEmail.tsx dépendait de localStorage "pendingCandidate" (rendre optionnel)


## Système d'Évaluation Automatique — Rapports Personnalisés Multi-Destination (v7)
- [x] Service d'évaluation : scoring multi-destination (Pologne, Canada, Allemagne, Luxembourg, UK, USA)
- [x] Génération de rapports HTML personnalisés avec barres de progression visuelles
- [x] Procédures tRPC : sendEvaluationReport (manuel) et sendBulkEvaluationReports (en masse)
- [x] Fonction d'envoi d'email : sendEvaluationReportEmail avec template professionnel
- [x] Composant EvaluationManager dans le panneau admin avec bouton "Envoyer les rapports"
- [x] Endpoint Heartbeat : POST /api/scheduled/evaluation-job pour exécution périodique
- [x] Routeur Heartbeat tRPC : createEvaluationJob, listJobs, deleteJob
- [x] Intégration du gestionnaire d'évaluation dans Admin.tsx
- [ ] Configurer le job Heartbeat via l'interface admin (bouton "Créer job quotidien")
- [ ] Tester l'envoi en masse des rapports et vérifier les emails reçus
- [ ] Ajouter un historique des envois de rapports dans la DB (optionnel)


## Intégration IA — Analyse de CV avec OpenAI (v8)
- [x] Installer les dépendances pdf-parse et openai
- [x] Créer le service aiEvaluationService.ts : extraction PDF + analyse IA + rapport par défaut
- [x] Ajouter la procédure tRPC evaluateCVWithAI : analyse CV en base64 + génération rapport + envoi email
- [x] Intégrer analyzeCV dans ScoringForm : déclencher l'analyse lors de l'upload du CV
- [x] Ajouter la mutation tRPC evaluateCVWithAI dans ScoringForm
- [ ] Configurer une clé OpenAI valide (OPENAI_API_KEY) et valider avec le test vitest
- [ ] Tester l'upload de CV et vérifier la génération du rapport IA
- [ ] Ajouter un toast de notification lors de l'analyse IA en cours


## Animation de Chargement IA (v9)
- [x] Créer le composant AILoadingAnimation avec étapes animées (Extraction → Analyse → Génération → Envoi)
- [x] Ajouter les icônes et animations Framer Motion pour chaque étape
- [x] Intégrer l'animation dans ScoringForm lors de l'analyse IA du CV
- [x] Ajouter l'état isAnalyzingCV pour contrôler la visibilité de l'animation
- [x] Ajouter une barre de progression globale et des messages d'encouragement
- [ ] Tester l'animation en uploadant un CV et vérifier les étapes
- [ ] Ajouter des sons de notification (optionnel) lors de la fin de l'analyse


## Configuration SMTP — Emails de Confirmation (v10)
- [x] Vérifier la configuration SMTP actuelle dans emailService.ts
- [x] Configurer les variables SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
- [x] Créer le test de validation SMTP (smtp.test.ts)
- [x] Créer le test du mode développement (email-dev-mode.test.ts)
- [x] Tous les tests SMTP passent avec succès
- [ ] Générer un mot de passe d'application Gmail pour l'authentification réelle
- [ ] Tester l'envoi réel d'emails avec Gmail
- [ ] Ajouter des templates d'emails supplémentaires (rappel paiement, confirmation admin)

## Pages Mobilité Internationale (v10)
- [x] Créer shared/visaData.ts avec données génériques (6 types de visa, 6 destinations, procédures)
- [x] Page /visa-types : 6 cartes colorées expandables (conditions, documents, délais, coûts)
- [x] Page /destinations : grille avec recherche, filtres par continent, infos clés par pays
- [x] Page /guide : timeline interactive 6 étapes + FAQ + types de visa + CTA
- [x] Navbar : menu déroulant "Ressources" (Types de Visa, Destinations, Guide Complet)
- [x] Navbar mobile : liens Ressources dans le menu hamburger
- [x] Routes App.tsx : /visa-types, /destinations, /guide
- [x] Aucune erreur TypeScript

## Formulaire Complet de Constitution de Dossier (v11)
- [ ] Analyser le formulaire actuel (ScoringForm, OpenDossier) et identifier les champs manquants
- [ ] Étendre le schéma DB : état civil, coordonnées complètes, études/diplômes, situation pro, expérience, ressources financières, situation familiale, champs spécifiques par type de visa
- [ ] Créer FullDossierForm : 7 étapes (Visa & Destination → État civil → Coordonnées → Études/Diplômes → Situation pro/financière → Situation familiale → Documents & Paiement)
- [ ] Étapes dynamiques selon le type de visa (ex: étape "Regroupement familial" uniquement si visa famille)
- [ ] Upload documents : passeport, CV, diplômes, relevés bancaires, contrat de travail, lettre d'invitation
- [ ] Scoring automatique mis à jour avec les nouveaux critères
- [ ] Mettre à jour les procédures tRPC createApplication pour accepter tous les nouveaux champs
- [ ] Remplacer ScoringForm par FullDossierForm dans le tunnel Procedures et OpenDossier
- [ ] Barre de progression claire avec noms d'étapes et indicateur de complétion

## Formulaire Complet de Constitution de Dossier (v11)
- [x] Schéma DB étendu : 27 nouvelles colonnes (état civil, diplômes, emploi, finances, famille, type de visa)
- [x] Migration DB appliquée via webdev_execute_sql
- [x] Composant FullDossierForm : 6 étapes (Visa → Identité → Études → Emploi → Finances → Documents)
- [x] Étapes adaptées dynamiquement au type de visa (ex: Regroupement Familial affiche l'étape Famille)
- [x] Barre de progression et stepper numéroté avec labels
- [x] Animations de transition Framer Motion entre étapes
- [x] Upload de documents (passeport, CV, diplôme, justificatifs) via route publique S3
- [x] Procédure tRPC createApplication étendue avec tous les nouveaux champs
- [x] Page /open-dossier remplacée par wrapper autour de FullDossierForm
- [x] Tunnel Procedures.tsx : ScoringForm remplacé par FullDossierForm dans la modale
- [x] Props procedureId et procedureTitle passées depuis Procedures vers FullDossierForm
- [x] Aucune erreur TypeScript

## Protocole d'Accord — Signature Électronique (v12)
- [ ] Ajouter colonnes DB : agreementSigned, agreementSignedAt, agreementSignatureName, agreementIpAddress
- [ ] Procédure tRPC signAgreement : enregistrer la signature avec horodatage et IP
- [ ] Composant AgreementProtocol : document d'accord complet (engagements agence + candidat, honoraires en référence discrète)
- [ ] Signature électronique : champ nom + case à cocher + date auto + bouton "Je signe et accepte"
- [ ] Intégrer AgreementProtocol dans le tunnel après l'évaluation positive (avant vérification email)
- [ ] Afficher le récapitulatif de la signature dans le panneau admin (fiche PDF)
- [ ] Tester le flux complet : évaluation → accord → signature → vérification email → paiement

## Protocole d'Accord — Signature Électronique (v11)
- [x] Colonnes DB : agreementSigned, agreementSignedAt, agreementSignatureName, agreementIpAddress
- [x] Procédure tRPC signAgreement : vérification dossier, enregistrement signature horodatée avec IP
- [x] Retour applicationId dans createApplication pour lier le protocole au bon dossier
- [x] Composant AgreementProtocol : document d'accord complet avec engagements réciproques
- [x] Signature électronique : nom + case à cocher + date horodatée
- [x] Intégration dans FullDossierForm : affichage après soumission, avant vérification email
- [x] Tunnel complet : Formulaire → Protocole d'Accord → Vérification Email → Paiement

## Tableau de Bord Candidat — Suivi de Dossier (v12)
- [x] Procédure tRPC getDossierStatus : récupérer le dossier par numéro + email (sans compte)
- [x] Procédure tRPC sendCandidateMessage : envoyer un message au conseiller
- [x] Procédure tRPC replyToCandidate : répondre au candidat depuis l'admin
- [x] Page /mon-dossier : formulaire de connexion par numéro de dossier + email
- [x] Timeline visuelle des étapes : Soumission → Accord → Paiement → Traitement → Soumis → Visa
- [x] Section statut actuel avec badge coloré et description de l'étape
- [x] Section documents soumis avec liens de téléchargement (passeport, CV, diplôme)
- [x] Section messagerie candidat ↔ conseiller
- [x] Section prochaines étapes personnalisées selon le statut
- [x] Lien "Suivre mon dossier" dans la Navbar desktop et mobile
- [x] Route /mon-dossier ajoutée dans App.tsx
- [ ] Admin : bouton "Répondre" aux messages candidats depuis le panneau admin (procédure replyToCandidate disponible, UI à créer)
- [ ] Lien "Suivre mon dossier" dans la page /payment-success

## Bibliothèque de Ressources PDF (v14)
- [x] Upload de 212 fichiers PDF/DOCX sur S3 (Visa Travail, Études, Visiteur, Guides, Formulaires)
- [x] Fichier shared/pdfResources.ts avec catalogue complet et vraies URLs S3
- [x] Page /ressources avec recherche, filtres par catégorie, cartes de téléchargement (107 documents)
- [x] Lien "Télécharger les guides PDF" dans le menu déroulant Ressources (desktop)
- [x] Lien "Télécharger les guides PDF" dans le menu mobile
- [x] Route /ressources ajoutée dans App.tsx

## Enrichissement contenu PDF (v14)
- [x] Extraction texte de 113 fichiers PDF/DOCX via pdfminer + python-docx
- [x] Script analyze_docs.py : structuration en 102 procédures (pays, type, délai, coûts, docs, étapes, conseils)
- [x] Fichier shared/procedureData.ts : 12 000+ lignes de données réelles extraites des PDFs
- [x] Page /fiches : 95 fiches détaillées par pays avec recherche, filtres, boutons PDF et CTA
- [x] Lien "Fiches détaillées par pays" dans le menu déroulant Ressources (desktop + mobile)
- [x] Route /fiches ajoutée dans App.tsx

## Comparaison côte à côte de visas — Page /fiches (v15)
- [x] Bouton "Comparer" sur chaque fiche (sélection de 2 fiches max)
- [x] Barre de sélection flottante en bas de page (0/2 → 1/2 → 2/2 sélectionnés)
- [x] Modal de comparaison côte à côte : pays, type, délai, coûts, documents, conditions, étapes
- [x] Mise en évidence visuelle de la fiche sélectionnée (ring bleu)
- [x] Bouton "Effacer la comparaison" (X) pour réinitialiser la sélection

## Espace Vols — Mode Démo Amadeus (v16)
- [ ] shared/flightData.ts : données démo réalistes (structure Amadeus) — aéroports, compagnies, vols
- [ ] server/routers/flights.ts : procédures tRPC searchFlights, getFlightDetail, getAirportSuggestions
- [ ] Page /vols refonte complète : formulaire de recherche (aller simple / aller-retour / multi)
- [ ] Autocomplete aéroports (IATA) dans les champs origine/destination
- [ ] Sélecteur de date avec calendrier
- [ ] Sélecteur passagers (adultes, enfants, bébés) et classe (Économique, Business, Première)
- [ ] Page /vols/resultats : liste des vols avec filtres (escales, compagnie, heure, prix)
- [ ] Tri des résultats (prix croissant, durée, départ, arrivée)
- [ ] Carte de vol détaillée : compagnie, horaires, durée, escales, bagages, prix par classe
- [ ] Badge "Mode Démo" visible — prêt pour connexion API Amadeus réelle
- [ ] CTA "Réserver via 3M Travel" → ouverture dossier
- [ ] Route /vols/resultats ajoutée dans App.tsx
