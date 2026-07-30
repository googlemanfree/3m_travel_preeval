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
- [x] Corriger le bug : login candidat ne vérifiait pas emailVerified (ajouter la vérification)
- [x] Corriger le bug : VerifyEmail.tsx dépendait de localStorage "pendingCandidate" (rendre optionnel)


## Système d'Évaluation Automatique — Rapports Personnalisés Multi-Destination (v7)
- [x] Service d'évaluation : scoring multi-destination (Pologne, Canada, Allemagne, Luxembourg, UK, USA)
- [x] Génération de rapports HTML personnalisés avec barres de progression visuelles
- [x] Procédures tRPC : sendEvaluationReport (manuel) et sendBulkEvaluationReports (en masse)
- [x] Fonction d'envoi d'email : sendEvaluationReportEmail avec template professionnel
- [x] Composant EvaluationManager dans le panneau admin avec bouton "Envoyer les rapports"
- [x] Endpoint Heartbeat : POST /api/scheduled/evaluation-job pour exécution périodique
- [x] Routeur Heartbeat tRPC : createEvaluationJob, listJobs, deleteJob
- [x] Intégration du gestionnaire d'évaluation dans Admin.tsx
- [x] Corriger l'authentification admin pour le gestionnaire Heartbeat (utiliser OWNER_OPEN_ID comme fallback)
- [x] Tester la création/liste/suppression d'un job depuis l'interface admin
- [x] Exécuter un vrai test du job d'évaluation avec envoi d'emails
- [x] Ajouter un historique d'envoi des rapports en base de données


## Intégration IA — Analyse de CV avec OpenAI (v8)
- [x] Installer les dépendances pdf-parse et openai
- [x] Créer le service aiEvaluationService.ts : extraction PDF + analyse IA + rapport par défaut
- [x] Ajouter la procédure tRPC evaluateCVWithAI : analyse CV en base64 + génération rapport + envoi email
- [x] Intégrer analyzeCV dans ScoringForm : déclencher l'analyse lors de l'upload du CV
- [x] Ajouter la mutation tRPC evaluateCVWithAI dans ScoringForm
- [x] Configurer une clé OpenAI valide (OPENAI_API_KEY) et valider avec le test vitest
- [x] Tester l'upload de CV et vérifier la génération du rapport IA
- [x] Ajouter un toast de notification lors de l'analyse IA en cours


## Animation de Chargement IA (v9)
- [x] Créer le composant AILoadingAnimation avec étapes animées (Extraction → Analyse → Génération → Envoi)
- [x] Ajouter les icônes et animations Framer Motion pour chaque étape
- [x] Intégrer l'animation dans ScoringForm lors de l'analyse IA du CV
- [x] Ajouter l'état isAnalyzingCV pour contrôler la visibilité de l'animation
- [x] Ajouter une barre de progression globale et des messages d'encouragement
- [x] Tester l'animation en uploadant un CV et vérifier les étapes
- [x] Ajouter des sons de notification (optionnel) lors de la fin de l'analyse


## Configuration SMTP — Emails de Confirmation (v10)
- [x] Vérifier la configuration SMTP actuelle dans emailService.ts
- [x] Configurer les variables SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
- [x] Créer le test de validation SMTP (smtp.test.ts)
- [x] Créer le test du mode développement (email-dev-mode.test.ts)
- [x] Tous les tests SMTP passent avec succès
- [x] Générer un mot de passe d'application Gmail pour l'authentification réelle
- [x] Tester l'envoi réel d'emails avec Gmail
- [x] Ajouter des templates d'emails supplémentaires (rappel paiement, confirmation admin)

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
- [x] Analyser le formulaire actuel (ScoringForm, OpenDossier) et identifier les champs manquants
- [x] Étendre le schéma DB : état civil, coordonnées complètes, études/diplômes, situation pro, expérience, ressources financières, situation familiale, champs spécifiques par type de visa
- [x] Créer FullDossierForm : 7 étapes (Visa & Destination → État civil → Coordonnées → Études/Diplômes → Situation pro/financière → Situation familiale → Documents & Paiement)
- [x] Étapes dynamiques selon le type de visa (ex: étape "Regroupement familial" uniquement si visa famille)
- [x] Upload documents : passeport, CV, diplômes, relevés bancaires, contrat de travail, lettre d'invitation
- [x] Scoring automatique mis à jour avec les nouveaux critères
- [x] Mettre à jour les procédures tRPC createApplication pour accepter tous les nouveaux champs
- [x] Remplacer ScoringForm par FullDossierForm dans le tunnel Procedures et OpenDossier
- [x] Barre de progression claire avec noms d'étapes et indicateur de complétion

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
- [x] Ajouter colonnes DB : agreementSigned, agreementSignedAt, agreementSignatureName, agreementIpAddress
- [x] Procédure tRPC signAgreement : enregistrer la signature avec horodatage et IP
- [x] Composant AgreementProtocol : document d'accord complet (engagements agence + candidat, honoraires en référence discrète)
- [x] Signature électronique : champ nom + case à cocher + date auto + bouton "Je signe et accepte"
- [x] Intégrer AgreementProtocol dans le tunnel après l'évaluation positive (avant vérification email)
- [x] Afficher le récapitulatif de la signature dans le panneau admin (fiche PDF)
- [x] Tester le flux complet : évaluation → accord → signature → vérification email → paiement

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
- [x] Admin : bouton "Répondre" aux messages candidats depuis le panneau admin (procédure replyToCandidate disponible, UI créée)
- [x] Lien "Suivre mon dossier" dans la page /payment-success

## Bibliothèque de Ressources PDF (v14)
- [x] Upload de 212 fichiers PDF/DOCX sur S3 (Visa Travail, Études, Visiteur, Guides, Formulaires)
- [x] Fichier shared/pdfResources.ts avec catalogue complet et vraies URLs S3
- [x] Page /ressources avec recherche, filtres par catégorie, cartes de téléchargement (107 documents)
- [x] Lien "Télécharger les guides PDF" dans le menu déroulant Ressources (desktop)
- [x] Lien "Télécharger les guides PDF" dans le menu mobile
- [x] Route /ressources ajoutée dans App.tsx

## Chat en Direct — Support Client (v15)
- [x] Créer la table DB contact_messages pour stocker les conversations
- [x] Créer le routeur tRPC contact avec procédures sendMessage, getMessages, closeSession
- [x] Créer le composant ChatModal avec interface de chat
- [x] Intégrer ChatModal à la page Contact.tsx
- [x] Remplacer le lien "#" du "Chat en ligne" par un bouton qui ouvre la modale
- [x] Ajouter animations Framer Motion à la modale
- [x] Tester l'ouverture/fermeture de la modale


## Corrections de contenu et de liens (v16)
- [x] Corriger email footer : hello@3mtravelegency.com → hello@3mtravelagency.com (Footer.tsx, Home.tsx)
- [x] Modifier le lien "Destinations" : /destinations → /procedures (Navbar.tsx)
- [x] Commenter les liens légaux morts dans Home.tsx (à implémenter : /privacy et /terms)


## Filtrage et Recherche sur /visa-types (v17)
- [x] Ajouter une barre de recherche pour filtrer par nom de visa
- [x] Ajouter des filtres par catégories (Étude, Travail, Tourisme, etc.)
- [x] Ajouter des filtres par délai de traitement
- [x] Ajouter des filtres par coût estimé
- [x] Implémenter la logique de filtrage avec état React
- [x] Ajouter des animations de transition entre les résultats filtrés
- [x] Tester les filtres avec différentes combinaisons


## Corrections supplémentaires (v18)
- [x] Créer la page /politique-confidentialite avec le contenu fourni
- [x] Créer la page /conditions-utilisation avec le contenu fourni
- [x] Ajouter les routes /politique-confidentialite et /conditions-utilisation dans App.tsx
- [x] Corriger l'email hello@3mtravelegency.com → hello@3mtravelagency.com globalement (Footer.tsx)
- [x] Mettre à jour les liens légaux dans Home.tsx : pointer vers /politique-confidentialite et /conditions-utilisation
- [x] Transformer les pastilles destinations du footer en liens vers /procedures (déjà fait)
- [x] Tester les pages légales et les liens


## Formulaire de Contact Amélioré (v19)
- [x] Créer une procédure tRPC contact.sendEmail pour envoyer les demandes
- [x] Intégrer Resend pour l'envoi d'emails
- [x] Ajouter validation du formulaire (email, téléphone, message)
- [x] Implémenter la soumission du formulaire via tRPC
- [x] Ajouter les messages de succès/erreur
- [x] Tester l'envoi d'emails via Resend (test@resend.dev)
- [x] Améliorer le design du formulaire avec animations


## Nouveau Design Hero (v21)
- [x] Créer le composant HeroSection.tsx avec design optimisé
- [x] Remplacer la section hero du Home.tsx par le composant
- [x] Ajouter animations Framer Motion au hero
- [x] Implémenter les 2 CTAs distincts (Évaluer + WhatsApp)
- [x] Ajouter les statistiques de réassurance
- [x] Tester le responsive design (mobile + desktop)

## Soumission Complète de Dossier (v22)
- [x] Créer une procédure tRPC submitDossier avec génération de numéro unique
- [x] Ajouter des emails de confirmation au candidat et à l'équipe interne
- [x] Créer une page de confirmation avec affichage du numéro de dossier
- [x] Ajouter des boutons pour copier/télécharger le numéro de dossier
- [x] Améliorer FullDossierForm pour rediriger vers la page de confirmation
- [x] Tester le flux complet de soumission


## Fusion Template HTML avec Formulaire React (v23)
- [x] Analyser le template HTML fourni et identifier les éléments à fusionner
- [x] Améliorer le design du formulaire React avec les styles du template HTML
- [x] Ajouter la barre de progression visuelle du template
- [x] Améliorer les animations de transition entre étapes
- [x] Intégrer les statistiques de confiance du hero
- [x] Tester le formulaire amélioré sur mobile et desktop


## Espace Utilisateur Personnalisé (v24)
- [x] Étendre le schéma DB : table users avec email, password, profil, préférences
- [x] Créer les procédures tRPC : registerUser, loginUser, updateProfile, getUserDashboard
- [x] Créer la page /inscription avec formulaire complet (nom, email, mot de passe, téléphone)
- [x] Créer la page /connexion avec formulaire email/mot de passe
- [x] Créer la page /profil avec édition des informations personnelles
- [x] Améliorer le tableau de bord /mon-dossier avec timeline détaillée
- [x] Ajouter les notifications en temps réel pour les mises à jour de dossier
- [x] Ajouter l'historique des documents soumis avec dates
- [x] Ajouter la section "Prochaines étapes" personnalisée
- [x] Ajouter les statistiques du dossier (% complétude, étapes restantes)
- [x] Tester le flux complet : inscription → connexion → tableau de bord


## Amélioration du Système d'Analyse IA (v11)
- [x] Créer la table `ai_report_history` pour tracer les envois de rapports
- [x] Améliorer la procédure `evaluateCVWithAI` pour enregistrer l'historique d'envoi
- [x] Ajouter le statut d'envoi (pending → sent/failed) avec timestamps
- [x] Enregistrer les erreurs d'envoi pour diagnostic
- [x] Ajouter la procédure `getAIReportHistory` pour consulter l'historique
- [x] Ajouter la procédure `getAIReport` pour récupérer un rapport spécifique
- [x] Ajouter la procédure `retryAIReportSend` pour retenter les envois échoués

## Correction de l'Authentification Heartbeat (v12)
- [x] Identifier le problème : `ownerOpenId` vs `userSession` incompatibles
- [x] Corriger les procédures `createEvaluationJob`, `listJobs`, `deleteJob`
- [x] Utiliser `ctx.user.openId` correctement du contexte tRPC
- [x] Ajouter des messages d'erreur explicites pour le diagnostic


## Création des 3 Comptes Admin Spécialisés (v13)
- [x] Créer les 3 comptes admin en base de données (Evaluation, Accompagnement, Procédures)
- [x] Créer le dashboard AdminEvaluation.tsx pour gérer les CV et rapports IA
- [x] Créer le dashboard AdminAccompagnement.tsx pour gérer l'avancement des dossiers
- [x] Créer le dashboard AdminProcedures.tsx pour gérer les procédures par pays
- [x] Ajouter les procédures tRPC pour l'avancement rapide des dossiers
- [x] Ajouter les procédures tRPC pour la gestion des rapports IA
- [x] Ajouter les procédures tRPC pour la gestion des procédures
- [x] Implémenter les outils de filtrage et recherche pour chaque admin
- [x] Tester les 3 comptes admin avec des données réelles
- [x] Documenter les accès et les permissions pour chaque admin


## Phase A : Système d'Email Différé 48h avec Heartbeat
- [x] Créer une table `evaluation_emails` pour tracker les emails envoyés
- [x] Créer une procédure Heartbeat pour envoyer les bilans après 48h
- [x] Créer le template d'email "Bilan d'Admissibilité"
- [x] Tester l'envoi automatique des emails

## Phase B : Gestion Hybride (En ligne + Agence Physique)
- [x] Ajouter des champs admin pour enregistrer manuellement les documents
- [x] Ajouter des champs admin pour enregistrer manuellement les paiements cash
- [x] Créer les procédures tRPC pour l'admin de soumettre documents/paiements
- [x] Ajouter les validations et logs d'audit

## Phase C : Module de Génération de Factures PDF
- [x] Créer le template de facture PDF avec en-tête 3M
- [x] Créer la procédure de génération de factures
- [x] Ajouter les numéros de facture uniques
- [x] Tester la génération et l'envoi par email

## Phase D : Sections Client et Dashboard Admin Complet
- [x] Créer la section "Mes documents" dans l'espace client
- [x] Créer la section "Mes paiements" dans l'espace client
- [x] Créer le dashboard admin pour valider documents/paiements
- [x] Ajouter l'actualisation automatique côté client
- [x] Tester le flux complet client-admin


- [x] Formulaire multi-projets simplifié (Travail, Études, Tourisme) intégré sur la page d'accueil
- [x] Procédure tRPC submitEvaluation pour les évaluations multi-projets
- [x] Système d'email 48h avec Heartbeat pour les rapports d'admissibilité
- [x] Tests vitest pour le formulaire multi-projets et la procédure

## Fonctionnalités Complémentaires (v14)

### 1. Notification Double (Email + WhatsApp)
- [x] Intégrer l'API WhatsApp (Twilio ou autre)
- [x] Créer le service de notification WhatsApp
- [x] Ajouter le champ téléphone dans la table evaluations
- [x] Envoyer notification WhatsApp après 48h avec bilan
- [x] Tester l'envoi automatique

### 2. Impression Reçus A5
- [x] Créer le template HTML pour reçu A5
- [x] Ajouter la fonction d'impression au format A5
- [x] Intégrer le bouton d'impression dans le dashboard admin
- [x] Tester l'impression depuis navigateur
- [x] Optimiser pour imprimante thermique

### 3. Traçabilité des Documents
- [x] Ajouter le champ "source" dans client_documents
- [x] Modifier les procédures pour enregistrer la source
- [x] Afficher la source dans le dashboard client
- [x] Afficher la source dans le dashboard admin
- [x] Ajouter les filtres par source

### 4. Module de Prise de Rendez-vous
- [x] Créer la table appointments avec créneau horaire
- [x] Créer les procédures tRPC pour réserver/consulter
- [x] Créer le calendrier de réservation côté client
- [x] Créer la gestion des créneaux côté admin
- [x] Envoyer confirmation par email/WhatsApp
- [x] Tester le flux complet


## Module de Traduction Certifiée (v15)

### Phase 1 : Tables DB et Tarification
- [x] Créer la table `translation_requests` avec statuts (pending_payment, pending_translation, completed, rejected)
- [x] Créer la table `translation_pricing` avec tarifs par type de document et paire de langues
- [x] Créer la table `translation_languages` avec liste des langues supportées
- [x] Ajouter le rôle "translator" dans la table users

### Phase 2 : Procédures tRPC
- [x] Créer la procédure `createTranslationRequest` (sans paiement)
- [x] Créer la procédure `getTranslationPricing` pour tarification dynamique
- [x] Créer la procédure `getTranslationRequests` pour lister les demandes
- [x] Créer la procédure `validateTranslationPayment` (déclenche notification admin)
- [x] Créer la procédure `uploadTranslatedDocument` (traducteur)
- [x] Créer la procédure `downloadTranslatedDocument` (client)
- [x] Créer la procédure `getTranslationStatus` pour suivre l'état de la traduction

### Phase 3 : Dashboard Traducteur
- [x] Créer la page `/translator/dashboard` avec liste des traductions "À Traduire"
- [x] Ajouter la section "En Cours" et "Completées"
- [x] Ajouter le formulaire d'upload du document traduit
- [x] Ajouter les filtres par langue, type de document, date

### Phase 4 : Tunnel de Commande Client
- [x] Créer la page `/translation/order` avec sélection du type de document
- [x] Ajouter le sélecteur de langues source/cible
- [x] Ajouter l'upload des documents (PDF/JPG, max 5 Mo)
- [x] Afficher le tarif calculé en temps réel
- [x] Ajouter le bouton "Procéder au Paiement"

### Phase 5 : Paiement Obligatoire
- [x] Intégrer CinetPay pour le paiement (Mobile Money/Carte)
- [x] Créer le callback de validation du paiement
- [x] Déclencher la notification admin uniquement après paiement validé
- [x] Générer la facture PDF après paiement
- [ ] Envoyer confirmation par email/WhatsApp

### Phase 6 : Téléchargement Sécurisé
- [ ] Créer les URLs de téléchargement sécurisées (token temporaire)
- [x] Ajouter la section "Mes Traductions" dans l'Espace Client
- [x] Afficher le statut de chaque traduction
- [x] Permettre le téléchargement après complétion
- [x] Ajouter les logs de téléchargement

### Phase 7 : Tests et Validation
- [ ] Tester le flux complet : commande → paiement → notification admin → traduction → téléchargement
- [ ] Tester les cas d'erreur (paiement échoué, fichier invalide, etc.)
- [ ] Vérifier la sécurité des téléchargements
- [ ] Vérifier les notifications email/WhatsApp

### Phase 8 : Checkpoint Final
- [ ] Créer le checkpoint avec le module de traduction complet
- [ ] Documenter les étapes d'utilisation


## Améliorations UX — Animations et Footer (v25)
- [x] Ajouter des animations fluides de chargement pour les sections
- [x] Créer un composant AnimatedSection réutilisable
- [x] Ajouter des infobulles interactives au survol des cartes
- [x] Intégrer un bouton "Retour en haut" flottant avec icône d'avion
- [x] Personnaliser le pied de page avec réseaux sociaux et newsletter
- [x] Ajouter une section "Liens utiles" dans le footer
- [x] Intégrer les coordonnées directes (adresse, téléphone, email)
- [x] Rendre l'adresse cliquable pour Google Maps
- [x] Rendre le téléphone cliquable pour appels directs (tel:)
- [x] Rendre l'email cliquable pour messagerie (mailto:)
- [x] Optimiser l'espacement et l'alignement des sections
- [x] Vérifier et optimiser l'affichage mobile
- [x] Ajouter un lien de connexion admin dans la navbar
- [x] Rendre le lien admin accessible sur desktop et mobile
- [x] Ajouter des messages d'erreur clairs et stylisés sur la page de connexion
- [x] Afficher les messages d'erreur contextuels (email non autorisé, OTP incorrect)
- [x] Ajouter un compteur de tentatives échouées
- [x] Implémenter un bouton "Besoin d'aide ?" pour les conseils OTP
- [x] Rendre les adresses autorisées cliquables pour remplir automatiquement l'email

## Modules de Réassurance et Suivi Dynamique (v14)

### 1. Barre de Progression de Dossier
- [x] Créer la table `dossier_progress` pour tracker les étapes
- [x] Implémenter la procédure tRPC `getDossierProgress`
- [x] Créer le composant ProgressBar avec 5 étapes
- [x] Ajouter les timestamps et les statuts
- [x] Afficher la barre dans l'Espace Client

### 2. Système de Callback 15 min
- [x] Créer la table `callback_requests` pour les demandes
- [x] Implémenter la procédure tRPC `requestCallback`
- [x] Créer le bouton "Demander un rappel" dans l'Espace Client
- [ ] Envoyer notification admin + SMS/WhatsApp
- [x] Ajouter le formulaire de rappel avec horaires disponibles

### 3. Galerie de Visas Accordés
- [x] Créer la table `approved_visas` pour les visas accordés
- [x] Implémenter les procédures tRPC pour ajouter/modifier/supprimer
- [x] Créer le dashboard admin pour gérer les visas
- [x] Créer la galerie publique sur le site (anonymisée)
- [x] Ajouter les filtres par pays et date

### 4. Calculateur de Budget
- [x] Créer la table `country_costs` avec les frais par pays
- [x] Implémenter la procédure tRPC `calculateBudget`
- [x] Créer le formulaire du calculateur (pays, type visa, etc.)
- [x] Afficher le détail des frais (droits, garanties, visa)
- [x] Ajouter les graphiques de répartition des coûts


## Management des Dossiers en Agence (v26)

### Phase 1 : Schéma DB et Procédures
- [x] Créer la table `agency_dossiers` pour les dossiers ajoutés manuellement par les admins
- [x] Ajouter les champs : fullName, email, phone, destination, visaType, status, createdByAdmin, adminNotes
- [x] Créer la procédure tRPC `createAgencyDossier` (admin uniquement)
- [x] Créer la procédure tRPC `getAgencyDossiers` (filtrés par admin)
- [x] Créer la procédure tRPC `updateAgencyDossier` (modification du statut et notes)
- [x] Créer la procédure tRPC `deleteAgencyDossier` (suppression logique)

### Phase 2 : Interface Admin pour Ajout Manuel
- [x] Créer la page `/admin/agency-dossiers` avec liste des dossiers
- [x] Ajouter un bouton "Ajouter un Dossier" qui ouvre une modal
- [x] Créer le formulaire d'ajout avec validation
- [x] Implémenter la table avec colonnes : Nom, Email, Téléphone, Destination, Statut, Actions
- [x] Ajouter les filtres : par statut, par destination, par date

### Phase 3 : Gestion des Statuts
- [x] Implémenter les statuts : nouveau, en_cours, documents_requis, soumis, approuve, refuse
- [x] Ajouter les boutons d'action : Modifier, Changer Statut, Ajouter Notes, Supprimer
- [x] Créer les modales pour chaque action
- [x] Ajouter les transitions de statut avec validation

### Phase 4 : Notifications et Suivi
- [x] Envoyer un email au candidat lors de l'ajout du dossier
- [x] Ajouter un système de notes internes pour les admins
- [x] Créer un historique des modifications
- [x] Ajouter les logs d'audit pour tracer les actions

### Phase 5 : Dashboard Admin Amélioré
- [x] Ajouter un widget "Dossiers en Agence" au dashboard
- [x] Afficher les statistiques : total, en cours, approuvés, refusés
- [x] Créer un graphique de progression des dossiers
- [x] Ajouter les alertes pour les dossiers en attente
- [x] Ajouter des infobulles explicatives sur chaque étape de la barre de progression

### Phase 6 : Espace Client pour Dossiers en Agence
- [x] Créer la page `/candidate/agency-dossier` pour consulter le statut
- [x] Afficher la barre de progression du dossier
- [x] Ajouter la section "Messages de l'Agence"
- [x] Permettre le téléchargement des documents requis

### Phase 7 : Tests et Validation
- [ ] Tester l'ajout d'un dossier par l'admin
- [ ] Tester la modification du statut
- [ ] Tester les notifications email
- [ ] Tester l'affichage côté candidat


## Corrections et Améliorations (v26)
- [x] Corriger l'erreur "Erreur de chargement. Veuillez vous reconnecter."
- [x] Ajouter un indicateur visuel de l'étape de la procédure du candidat
- [x] Créer une barre de progression du dossier (Evaluation ➢ Bilan ➢ Traduction ➢ Soumission ➢ Visa)
- [x] Implémenter la synchronisation automatique des données dans l'espace admin
- [ ] Ajouter un système de cache pour optimiser les performances
- [ ] Créer des notifications en temps réel pour les mises à jour de dossier


## Processus de Visa Travail Automatisé (v27)

### Phase 1 : Schéma DB et Statuts
- [x] Ajouter 12 nouveaux statuts de dossier (nouveau → en_evaluation → bilan_envoye → en_attente_paiement → paye → en_attente_documents → documents_recus → soumis_agences → en_cours_recrutement → contrat_obtenu → visa_approuve → refuse)
- [x] Ajouter les champs pour le suivi de l'évaluation (evaluationStartedAt, evaluationCompletedAt, evaluationReportUrl, evaluationScore, evaluationBadge)
- [x] Ajouter les champs pour la gestion des documents (documentsSubmissionMethod, documentsReceivedAt, documentsVerifiedAt, documentsVerifiedBy)
- [x] Ajouter les champs pour la soumission aux agences de recrutement (submittedToAgenciesAt, agencyName, recruitmentStatus)
- [x] Migration DB appliquée via webdev_execute_sql

### Phase 2 : Job Heartbeat pour Délai 48h
- [x] Créer le fichier evaluationBilanJob.ts pour implémenter le délai de 48h
- [x] Récupérer les dossiers créés il y a 48h+
- [x] Générer les rapports d'éligibilité automatiquement
- [x] Envoyer les bilans par email
- [x] Passer automatiquement le dossier en "en_attente_paiement"
- [x] Intégrer le job Heartbeat dans le serveur Express (server/_core/index.ts)

### Phase 3 : Procédures tRPC pour Gestion des Documents
- [x] Créer documentSubmissionRouter avec procédures :
  - submitDocuments : soumettre les documents (en ligne ou agence)
  - getDocumentSubmissionStatus : récupérer le statut de soumission
  - verifyDocuments : vérifier et valider les documents (admin)
- [x] Intégrer le routeur dans server/routers.ts

### Phase 4 : Pages Frontend
- [x] Créer SubmitDocuments.tsx : page de dépôt des documents (en ligne ou agence)
- [x] Créer HowItWorks.tsx : page "Comment ça marche" avec 8 étapes
- [x] Créer AdminDocumentVerification.tsx : page de vérification des documents (admin)
- [x] Intégrer les routes dans App.tsx

### Phase 5 : Correction des Emails Automatiques
- [x] Supprimer les mentions de "Formule d'Accompagnement" dans admissibilityReportService.ts
- [x] Remplacer "accéder à nos services d'accompagnement" par "finaliser votre dossier"
- [x] Remplacer "commencer l'accompagnement personnalisé" par "soumettre votre dossier à nos agences partenaires"
- [x] Vérifier que tous les emails automatiques sont exempts de mentions d'accompagnement

### Phase 6 : Tests et Validation
- [ ] Tester le flux complet : création de compte → choix du pays → évaluation
- [ ] Vérifier que les résultats sont envoyés après 48h
- [ ] Tester le paiement obligatoire (65 000 XAF)
- [ ] Tester le dépôt des documents (en ligne et agence)
- [ ] Vérifier que les documents sont correctement vérifiés
- [ ] Tester la soumission aux agences partenaires
- [ ] Vérifier que les emails ne contiennent pas de mentions d'accompagnement
- [ ] Tester le suivi du dossier dans l'espace client

### Phase 7 : Déploiement Final
- [ ] Créer un checkpoint final avec le processus complet
- [ ] Vérifier que le site est accessible et fonctionne correctement
- [ ] Tester sur mobile et desktop
- [ ] Vérifier les performances et les temps de chargement


## Indicateur de Progression Visuel (v28)

### Phase 1 : Composant DossierProgressBar
- [x] Créer le composant DossierProgressBar.tsx avec :
  - Barre de progression linéaire animée (0-100%)
  - Timeline horizontale avec 12 étapes du processus
  - Icônes spécifiques pour chaque étape
  - Codes couleur pour les statuts (bleu actuel, vert complété, gris à venir)
  - Connecteurs animés entre les étapes
- [x] Implémenter les 12 statuts : nouveau, en_evaluation, bilan_envoye, en_attente_paiement, paye, en_attente_documents, documents_recus, soumis_agences, en_cours_recrutement, contrat_obtenu, visa_approuve, refuse

### Phase 2 : Intégration dans MonDossier
- [x] Importer le composant DossierProgressBar dans MonDossier.tsx
- [x] Ajouter la barre de progression en haut de la page de suivi
- [x] Passer les props status, createdAt, evaluationCompletedAt, documentsReceivedAt, submittedToAgenciesAt

### Phase 3 : Animations et Transitions
- [x] Ajouter animations Framer Motion :
  - Entrée progressive des étapes (whileInView)
  - Hover effects sur les cercles (scale 1.15)
  - Tap effects (scale 0.95)
  - Glow effect sur l'étape actuelle (box-shadow animée)
  - Transition des connecteurs (couleur animée)
- [x] Ajouter les animations des sections détails et CTA

### Phase 4 : Tests et Validation
- [x] Vérifier que la page MonDossier s'affiche correctement
- [x] Tester les animations au scroll
- [x] Vérifier la responsivité sur mobile et desktop
- [ ] Tester avec différents statuts de dossier
- [ ] Vérifier que les boutons d'action fonctionnent correctement

### Phase 5 : Déploiement
- [ ] Créer un checkpoint avec le composant de progression
- [ ] Vérifier que le site fonctionne correctement en production


## Bouton de Paiement Sécurisé dans la Progression (v29)

### Phase 1 : Analyse CinetPay
- [x] Analyser l'intégration CinetPay existante dans VerifyApplicationEmail.tsx
- [x] Identifier la procédure verifyApplicationOtp et initCinetPayTransaction

### Phase 2 : Composant PaymentModal
- [x] Créer le composant PaymentModal.tsx avec :
  - Modal animée avec Framer Motion
  - Affichage du montant (65 000 XAF)
  - Choix du mode de paiement (MTN, Orange Money, Carte Bancaire)
  - États : confirm, processing, success, error
  - Message de sécurité SSL
  - Boutons d'action (Annuler, Payer, Réessayer)

### Phase 3 : Intégration dans DossierProgressBar
- [x] Ajouter la procédure tRPC initiateCinetPayPayment dans application.ts
- [x] Importer PaymentModal dans DossierProgressBar.tsx
- [x] Ajouter les props dossierNumber, email, onPaymentSuccess
- [x] Remplacer le bouton "Procéder au Paiement" par un bouton vert avec icône
- [x] Intégrer le modal de paiement dans DossierProgressBar
- [x] Mettre à jour MonDossier.tsx pour passer les props

### Phase 4 : Tests et Validation
- [x] Vérifier que le site compile sans erreurs
- [x] Vérifier que la page MonDossier s'affiche correctement
- [x] Vérifier que le bouton de paiement s'affiche quand le statut est "en_attente_paiement"
- [ ] Tester l'ouverture du modal au clic
- [ ] Tester les modes de paiement
- [ ] Tester le flux complet avec CinetPay (en mode démo)

### Phase 5 : Déploiement
- [ ] Créer un checkpoint avec le bouton de paiement sécurisé
- [ ] Vérifier que le site fonctionne correctement en production


## Zone de Téléchargement Sécurisée (v30)

### Phase 1 : Analyse
- [x] Analyser l'étape 5 (Paiement Confirmé) et les besoins de téléchargement
- [x] Identifier les formats acceptés (PDF, JPEG, PNG, WebP)
- [x] Définir les limites de sécurité

### Phase 2 : Composant SecureDocumentUpload
- [x] Créer le composant SecureDocumentUpload.tsx avec :
  - Zone de glisser-déposer animée
  - Parcourir les fichiers
  - Validation des formats et tailles
  - Aperçu des fichiers avec icônes
  - Barre de progression du téléchargement
  - Gestion des erreurs
  - Message de sécurité SSL
  - Animations fluides avec Framer Motion

### Phase 3 : Intégration dans DossierProgressBar
- [x] Importer SecureDocumentUpload dans DossierProgressBar.tsx
- [x] Ajouter la zone de téléchargement aux statuts "en_attente_documents" et "paye"
- [x] Passer les props dossierNumber et onUploadComplete
- [x] Ajouter les animations d'entrée

### Phase 4 : Validation et Sécurité
- [x] Validation des formats (PDF, JPEG, PNG, WebP)
- [x] Limite de taille par fichier (10 MB)
- [x] Limite du nombre de fichiers (10 max)
- [x] Messages d'erreur clairs et informatifs
- [x] Chiffrement des données (message de sécurité)
- [x] Accès restreint aux administrateurs

### Phase 5 : Tests et Validation
- [x] Vérifier que le site compile sans erreurs
- [x] Vérifier que la zone s'affiche correctement
- [ ] Tester le glisser-déposer
- [ ] Tester le parcourir des fichiers
- [ ] Tester la validation des formats
- [ ] Tester la validation des tailles
- [ ] Tester le téléchargement

### Phase 6 : Déploiement
- [ ] Créer un checkpoint avec la zone de téléchargement
- [ ] Vérifier que le site fonctionne correctement en production


## Analyse IA de Lisibilité des Documents (v11)

- [x] Service d'analyse de lisibilité (documentReadabilityService.ts)
- [x] Procédure tRPC analyzeDocumentReadability
- [x] Composant SecureDocumentUploadWithAI avec feedback visuel
- [x] Intégration de la vision par IA (gpt-5-mini)
- [x] Affichage des résultats d'analyse en temps réel
- [x] Validation des documents avant acceptation
- [ ] Intégration du composant dans la progression
- [ ] Tests du flux complet d'analyse
- [ ] Documentation pour les utilisateurs


## Classification IA des Documents (v12)

- [x] Service documentClassificationService.ts avec vision par IA
- [x] 19 types de documents supportés (passeport, carte d'identité, diplôme, etc.)
- [x] Procédures tRPC classifyDocument et classifyMultipleDocuments
- [x] Composant SmartDocumentUpload avec classification en temps réel
- [x] Service documentManagementService.ts pour gestion des documents
- [x] Structure de dossiers organisée par type de document
- [x] Extraction automatique des données (numéro, dates, pays, titulaire)
- [x] Détection des avertissements et suggestions d'amélioration
- [x] Sauvegarde de la classification en base de données
- [x] Statistiques et rapports de classification
- [ ] Intégration du composant SmartDocumentUpload dans la progression
- [ ] Tests du flux complet de classification
- [ ] Documentation pour les utilisateurs


## Authentification Obligatoire (v13)

- [x] Boutons de connexion et d'inscription dans la barre de navigation
- [x] Affichage intelligent des boutons (Connexion/Inscription si non authentifié, Mon Espace si authentifié)
- [x] Pages de connexion et d'inscription existantes avec design professionnel
- [x] Composant AuthGuard pour protéger les routes
- [x] Protection de toutes les routes critiques (/open-dossier, /mon-dossier, /submit-documents, etc.)
- [x] Redirection automatique vers /login pour les utilisateurs non authentifiés
- [x] Messages personnalisés pour chaque route protégée
- [x] Composant ProtectedRoute créé comme alternative
- [ ] Tests du flux de connexion/inscription
- [ ] Tests de redirection automatique
- [ ] Tests d'accès aux routes protégées


## Corrections de Liens Cassés (Phase 6)
- [x] Corriger /signup → /register dans Navbar.tsx (2 occurrences)
- [x] Corriger /traduction → /traduction/order dans Home.tsx footer
- [x] Corriger /components → / dans ComponentShowcase.tsx
- [x] Corriger /evaluation-widget → / dans About.tsx
- [x] Tester tous les liens principaux (7/7 routes accessibles)
- [x] Redémarrer le serveur et vérifier la compilation


## Phase Finale - Validation et Déploiement de l'Interface Admin (v15)
- [x] Créer la table `bilans` en base de données pour stocker les bilans d'admissibilité
- [x] Ajouter les procédures admin manquantes : getPendingBilans, validateAndSendBilan, rejectBilan
- [x] Ajouter les procédures admin pour la gestion des dossiers : getAllApplications, updateApplicationStatus
- [x] Tester les procédures admin avec vitest
- [x] Créer un compte admin de test pour validation
- [x] Vérifier la connectivité de la base de données
- [x] Créer des données de test (application + bilan)
- [x] Valider le workflow complet : création bilan → validation → envoi
- [x] Tester l'interface admin avec les données de test
- [x] Vérifier que tous les tests passent (7/7 tests d'intégration réussis)
- [x] Confirmer que l'interface admin est fonctionnelle et prête pour le déploiement


## Espace Candidat Complet - Protocole d'Accord et Gestion des Documents (v16)
- [ ] Créer la table `agreement_protocols` pour stocker les protocoles d'accord signés
- [ ] Créer la table `document_submissions` pour tracker les documents soumis par les candidats
- [ ] Créer la page `/mon-espace` : tableau de bord candidat avec toutes les données
- [ ] Afficher les informations personnelles du candidat (nom, email, téléphone, destination, etc.)
- [ ] Afficher l'historique du dossier (dates clés, statuts, actions)
- [ ] Afficher les documents remis (avec dates et statuts)
- [ ] Afficher les sommes versées et l'historique des paiements
- [ ] Afficher l'avancement du dossier (WES, TCF, etc.)
- [ ] Créer le composant Protocole d'Accord avec signature numérique
- [ ] Implémenter la signature du protocole (checkbox + date)
- [ ] Après signature : transférer les documents aux admins
- [ ] Après signature : envoyer un message de confirmation au candidat
- [x] Créer la procédure tRPC : signAgreementProtocol
- [x] Créer la procédure tRPC : submitDocuments (après signature)
- [x] Créer la procédure tRPC : getMyDossierData (récupérer toutes les données du candidat)
- [x] Créer la procédure tRPC : getMyDocuments (lister les documents du candidat)
- [x] Créer la procédure tRPC : getMyPayments (lister les paiements du candidat)
- [ ] Implémenter l'évaluation IA du profil avec tous les documents
- [ ] Créer la procédure tRPC : evaluateProfileWithAI
- [ ] Afficher le rapport d'évaluation IA dans l'espace candidat
- [ ] Synchroniser les documents entre candidat et admin en temps réel
- [ ] Créer une notification admin quand les documents sont soumis
- [ ] Créer une notification candidat quand les documents sont reçus par l'admin
- [ ] Ajouter une barre de progression du dossier (Évaluation → Bilan → Traduction → Soumission → Visa)
- [ ] Tester le workflow complet : signature → soumission → évaluation IA → notification


## Espace Candidat Complet - Implémentation Complète (v17)
- [x] Créer les procédures tRPC pour le protocole d'accord
- [x] Créer les procédures tRPC pour la soumission de documents
- [x] Créer les procédures tRPC pour récupérer les données du dossier
- [x] Créer la page Mon Espace avec tous les onglets
- [x] Ajouter la route /mon-espace dans App.tsx
- [x] Mettre à jour la navigation pour pointer vers /mon-espace
- [ ] Tester le workflow complet : connexion → Mon Espace → signature → soumission
- [ ] Tester l'affichage des données du candidat
- [ ] Tester la synchronisation admin-candidat
- [ ] Tester les notifications email
- [ ] Vérifier que les documents sont visibles dans l'interface admin
- [ ] Vérifier que l'évaluation IA fonctionne correctement
- [ ] Tester les messages entre candidat et conseiller
- [ ] Créer un test vitest pour le workflow candidat complet
- [ ] Déployer et vérifier en production


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 : AMÉLIORATION COMPLÈTE DU SITE - PROFESSIONNALISME & CONVERSION
# ═══════════════════════════════════════════════════════════════════════════════

## Phase 1 : Audit et Planification
- [x] Analyser le site actuel et documenter l'état existant
- [x] Créer une stratégie de conversion basée sur les meilleures pratiques
- [x] Définir les KPIs à suivre (taux de conversion, temps de chargement, etc.)
- [x] Planifier l'architecture des nouvelles pages et fonctionnalités

## Phase 2 : Page d'Accueil - Statistiques & Atouts
- [x] Créer une section "Statistiques" avec compteurs animés (clients, visas, pays, années)
- [x] Ajouter une section "Pourquoi choisir 3M Travel & Services SARL" avec 6 atouts clés
- [x] Améliorer les CTA : "Demander un devis", "Prendre rendez-vous", "WhatsApp"
- [x] Ajouter des animations légères et professionnelles aux sections
- [x] Optimiser le hero section avec une meilleure hiérarchie visuelle

## Phase 3 : Preuves de Confiance
- [x] Créer une section d'avis clients avec système de notation (5 étoiles)
- [x] Implémenter un carousel d'avis avec photos et témoignages
- [x] Créer une galerie de réussites (cas d'études avec autorisation)
- [x] Ajouter une section "Certifications & Accréditations" avec logos/documents
- [x] Afficher clairement RCCM, NIU et autres documents officiels
- [x] Intégrer des badges de confiance (certifications, partenariats)

## Phase 4 : Pages de Services - Uniformisation
- [x] Créer un template unifié pour toutes les pages de services
- [x] Ajouter une FAQ spécifique à chaque service (5-8 questions)
- [x] Implémenter un formulaire de demande d'information sur chaque page
- [x] Ajouter des sections "Avantages", "Processus", "Tarifs" cohérentes
- [x] Intégrer des CTA visibles et contextuels sur chaque page

## Phase 5 : Blog/Actualités
- [x] Créer une section Blog avec gestion des articles
- [x] Implémenter un système de catégories (Visas, Études, Voyages, Immigration)
- [x] Ajouter un formulaire de création d'article pour l'admin
- [x] Créer des templates pour les articles de blog
- [ ] Ajouter un système de commentaires (modérés)
- [ ] Implémenter un système de partage social sur les articles

## Phase 6 : Système de Réservation en Ligne
- [x] Créer une page de réservation de rendez-vous
- [x] Intégrer un calendrier interactif avec disponibilités
- [x] Ajouter la sélection de l'heure et du type de service
- [ ] Implémenter la confirmation par email/SMS
- [ ] Créer un système de rappel (24h avant le RDV)
- [ ] Ajouter une intégration Google Calendar (optionnel)

## Phase 7 : Simulateur d'Éligibilité
- [x] Créer un questionnaire interactif multi-étapes
- [x] Ajouter des questions selon le type de projet (études, travail, tourisme, regroupement familial)
- [x] Implémenter un système de scoring automatique
- [x] Générer un rapport d'éligibilité personnalisé
- [x] Ajouter une CTA pour prendre rendez-vous après le résultat

## Phase 8 : Optimisation SEO
- [x] Auditer et améliorer les balises meta (title, description, keywords)
- [x] Implémenter les données structurées (Schema.org - LocalBusiness, Service, FAQPage)
- [x] Optimiser les images (compression, lazy loading, alt text)
- [x] Améliorer la vitesse du site (Core Web Vitals)
- [x] Créer un sitemap XML et robots.txt optimisés
- [x] Ajouter les balises Open Graph pour le partage social
- [ ] Implémenter le suivi Google Analytics 4 et Search Console

## Phase 9 : Présentation Entreprise
- [x] Créer une page "À Propos" avec histoire, mission, vision
- [x] Ajouter une page "Notre Équipe" avec photos et bios
- [ ] Créer une galerie photo des bureaux
- [ ] Ajouter une vidéo de présentation de l'entreprise (si disponible)
- [ ] Implémenter une section "Nos Partenaires"

## Phase 10 : UX/Design - Navigation & Animations
- [x] Simplifier la navigation principale (menu épuré)
- [x] Ajouter un breadcrumb sur toutes les pages
- [x] Rendre les boutons d'action plus visibles (contraste, taille)
- [x] Ajouter des animations légères (fade, slide, hover effects)
- [x] Optimiser les temps de chargement (< 3s)
- [ ] Tester et optimiser l'affichage mobile (responsive design)
- [x] Ajouter un footer amélioré avec liens utiles et contact

## Phase 11 : Tests, Optimisations Finales & Déploiement
- [ ] Tester tous les formulaires et CTA
- [ ] Vérifier la compatibilité cross-browser
- [ ] Tester les performances sur mobile et desktop
- [ ] Vérifier le SEO avec des outils (Lighthouse, SEMrush, etc.)
- [ ] Effectuer des tests A/B sur les CTA principaux
- [ ] Déployer en production et monitorer les performances
- [ ] Mettre en place un système de feedback utilisateur


## PHASE 12 : OPTIMISATIONS PERFORMANCES & UX (Nouvelle)

### Polices & Scripts
- [x] Optimiser chargement polices (font-display: swap)
- [x] Preload font weights critiques
- [x] Créer hook useLazyScript
- [x] Créer hook useLazyImage
- [x] Intégrer LazyImage dans Home.tsx
- [x] Intégrer LazyImage dans Dashboard.tsx
- [x] Intégrer LazyImage dans Login.tsx
- [x] Intégrer LazyImage dans ForgotPassword.tsx
- [x] Intégrer LazyImage dans Register.tsx
- [x] Intégrer LazyImage dans ResetPassword.tsx
- [x] Intégrer LazyImage dans VerifyEmail.tsx
- [x] Intégrer LazyImage dans VerifyEmailLink.tsx
- [x] Intégrer LazyImage dans AuthGuard.tsx
- [x] Intégrer LazyScript pour Google Maps
- [x] Code splitting par route (React.lazy)

### Images & Iframes
- [x] Créer composant LazyImage
- [x] Créer composant OptimizedImage (WebP)
- [x] Créer composant LazyIframe
- [ ] Convertir images en WebP
- [ ] Compresser toutes les images
- [ ] Ajouter srcset pour images responsives

### Cache & Service Worker
- [x] Créer Service Worker (sw.js)
- [x] Configurer cache headers (vercel.json)
- [x] Créer hook useServiceWorker
- [x] Créer notification de mise à jour
- [x] Intégrer useServiceWorker dans App.tsx
- [x] Ajouter ServiceWorkerUpdateNotification

### Tests & Validation
- [ ] Lighthouse audit complet
- [ ] Performance testing (WebPageTest)
- [ ] Mobile testing
- [ ] Accessibilité testing WCAG 2.1 AAA
- [ ] Tests de chargement des images
- [ ] Tests du service worker offline

### Monitoring
- [ ] Configurer Web Vitals monitoring
- [ ] Configurer error tracking
- [ ] Configurer performance monitoring
- [ ] Configurer analytics

### Documentation
- [x] Créer OPTIMISATIONS_IMPLEMENTEES.md
- [x] Créer OPTIMISATIONS_PERFORMANCES_UX.md
- [ ] Documenter utilisation des nouveaux composants
- [ ] Créer guide de performance

## PHASE 12 : OPTIMISATIONS PERFORMANCES & UX - FINALISÉ

### Polices & Scripts
- [x] Optimiser chargement polices (font-display: swap)
- [x] Preload font weights critiques
- [x] Créer hook useLazyScript
- [x] Créer hook useLazyImage
- [x] Intégrer LazyImage dans Home.tsx
- [x] Intégrer LazyScript pour Google Maps
- [ ] Code splitting par route (React.lazy)

### Images & Iframes
- [x] Créer composant LazyImage
- [x] Créer composant OptimizedImage (WebP)
- [x] Créer composant LazyIframe
- [x] Créer composant SkeletonImage
- [ ] Convertir images en WebP
- [ ] Compresser toutes les images
- [ ] Ajouter srcset pour images responsives

### Cache & Service Worker
- [x] Créer Service Worker (sw.js)
- [x] Configurer cache headers (vercel.json)
- [x] Créer hook useServiceWorker
- [x] Créer notification de mise à jour
- [x] Intégrer useServiceWorker dans App.tsx
- [x] Ajouter ServiceWorkerUpdateNotification

### Tests & Validation
- [x] Créer tests de performance (47 tests)
- [ ] Lighthouse audit complet
- [ ] Performance testing (WebPageTest)
- [ ] Mobile testing
- [ ] Accessibilité testing WCAG 2.1 AAA
- [ ] Tests de chargement des images
- [ ] Tests du service worker offline

### Monitoring
- [ ] Configurer Web Vitals monitoring
- [ ] Configurer error tracking
- [ ] Configurer performance monitoring
- [ ] Configurer analytics

### Documentation
- [x] Créer OPTIMISATIONS_IMPLEMENTEES.md
- [x] Créer OPTIMISATIONS_PERFORMANCES_UX.md
- [x] Créer RAPPORT_FINAL_OPTIMISATIONS.md
- [ ] Documenter utilisation des nouveaux composants
- [ ] Créer guide de performance
