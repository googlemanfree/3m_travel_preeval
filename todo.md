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
- [x] Envoyer confirmation par email/WhatsApp

### Phase 6 : Téléchargement Sécurisé
- [x] Créer les URLs de téléchargement sécurisées (token temporaire)
- [x] Ajouter la section "Mes Traductions" dans l'Espace Client
- [x] Afficher le statut de chaque traduction
- [x] Permettre le téléchargement après complétion
- [x] Ajouter les logs de téléchargement

### Phase 7 : Tests et Validation
- [x] Tester le flux complet : commande → paiement → notification admin → traduction → téléchargement
- [x] Tester les cas d'erreur (paiement échoué, fichier invalide, etc.)
- [x] Vérifier la sécurité des téléchargements
- [x] Vérifier les notifications email/WhatsApp

### Phase 8 : Checkpoint Final
- [x] Créer le checkpoint avec le module de traduction complet
- [x] Documenter les étapes d'utilisation


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
- [x] Envoyer notification admin + SMS/WhatsApp
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
- [x] Tester l'ajout d'un dossier par l'admin
- [x] Tester la modification du statut
- [x] Tester les notifications email
- [x] Tester l'affichage côté candidat


## Corrections et Améliorations (v26)
- [x] Corriger l'erreur "Erreur de chargement. Veuillez vous reconnecter."
- [x] Ajouter un indicateur visuel de l'étape de la procédure du candidat
- [x] Créer une barre de progression du dossier (Evaluation ➢ Bilan ➢ Traduction ➢ Soumission ➢ Visa)
- [x] Implémenter la synchronisation automatique des données dans l'espace admin
- [x] Ajouter un système de cache pour optimiser les performances
- [x] Créer des notifications en temps réel pour les mises à jour de dossier


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
- [x] Tester le flux complet : création de compte → choix du pays → évaluation
- [x] Vérifier que les résultats sont envoyés après 48h
- [x] Tester le paiement obligatoire (65 000 XAF)
- [x] Tester le dépôt des documents (en ligne et agence)
- [x] Vérifier que les documents sont correctement vérifiés
- [x] Tester la soumission aux agences partenaires
- [x] Vérifier que les emails ne contiennent pas de mentions d'accompagnement
- [x] Tester le suivi du dossier dans l'espace client

### Phase 7 : Déploiement Final
- [x] Créer un checkpoint final avec le processus complet
- [x] Vérifier que le site est accessible et fonctionne correctement
- [x] Tester sur mobile et desktop
- [x] Vérifier les performances et les temps de chargement


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
- [x] Tester avec différents statuts de dossier
- [x] Vérifier que les boutons d'action fonctionnent correctement

### Phase 5 : Déploiement
- [x] Créer un checkpoint avec le composant de progression
- [x] Vérifier que le site fonctionne correctement en production


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
- [x] Tester l'ouverture du modal au clic
- [x] Tester les modes de paiement
- [x] Tester le flux complet avec CinetPay (en mode démo)

### Phase 5 : Déploiement
- [x] Créer un checkpoint avec le bouton de paiement sécurisé
- [x] Vérifier que le site fonctionne correctement en production


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
- [x] Tester le glisser-déposer
- [x] Tester le parcourir des fichiers
- [x] Tester la validation des formats
- [x] Tester la validation des tailles
- [x] Tester le téléchargement

### Phase 6 : Déploiement
- [x] Créer un checkpoint avec la zone de téléchargement
- [x] Vérifier que le site fonctionne correctement en production


## Analyse IA de Lisibilité des Documents (v11)

- [x] Service d'analyse de lisibilité (documentReadabilityService.ts)
- [x] Procédure tRPC analyzeDocumentReadability
- [x] Composant SecureDocumentUploadWithAI avec feedback visuel
- [x] Intégration de la vision par IA (gpt-5-mini)
- [x] Affichage des résultats d'analyse en temps réel
- [x] Validation des documents avant acceptation
- [x] Intégration du composant dans la progression
- [x] Tests du flux complet d'analyse
- [x] Documentation pour les utilisateurs


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
- [x] Intégration du composant SmartDocumentUpload dans la progression
- [x] Tests du flux complet de classification
- [x] Documentation pour les utilisateurs


## Authentification Obligatoire (v13)

- [x] Boutons de connexion et d'inscription dans la barre de navigation
- [x] Affichage intelligent des boutons (Connexion/Inscription si non authentifié, Mon Espace si authentifié)
- [x] Pages de connexion et d'inscription existantes avec design professionnel
- [x] Composant AuthGuard pour protéger les routes
- [x] Protection de toutes les routes critiques (/open-dossier, /mon-dossier, /submit-documents, etc.)
- [x] Redirection automatique vers /login pour les utilisateurs non authentifiés
- [x] Messages personnalisés pour chaque route protégée
- [x] Composant ProtectedRoute créé comme alternative
- [x] Tests du flux de connexion/inscription
- [x] Tests de redirection automatique
- [x] Tests d'accès aux routes protégées


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
- [x] Créer la table `agreement_protocols` pour stocker les protocoles d'accord signés
- [x] Créer la table `document_submissions` pour tracker les documents soumis par les candidats
- [x] Créer la page `/mon-espace` : tableau de bord candidat avec toutes les données
- [x] Afficher les informations personnelles du candidat (nom, email, téléphone, destination, etc.)
- [x] Afficher l'historique du dossier (dates clés, statuts, actions)
- [x] Afficher les documents remis (avec dates et statuts)
- [x] Afficher les sommes versées et l'historique des paiements
- [x] Afficher l'avancement du dossier (WES, TCF, etc.)
- [x] Créer le composant Protocole d'Accord avec signature numérique
- [x] Implémenter la signature du protocole (checkbox + date)
- [x] Après signature : transférer les documents aux admins
- [x] Après signature : envoyer un message de confirmation au candidat
- [x] Créer la procédure tRPC : signAgreementProtocol
- [x] Créer la procédure tRPC : submitDocuments (après signature)
- [x] Créer la procédure tRPC : getMyDossierData (récupérer toutes les données du candidat)
- [x] Créer la procédure tRPC : getMyDocuments (lister les documents du candidat)
- [x] Créer la procédure tRPC : getMyPayments (lister les paiements du candidat)
- [x] Implémenter l'évaluation IA du profil avec tous les documents
- [x] Créer la procédure tRPC : evaluateProfileWithAI
- [x] Afficher le rapport d'évaluation IA dans l'espace candidat
- [x] Synchroniser les documents entre candidat et admin en temps réel
- [x] Créer une notification admin quand les documents sont soumis
- [x] Créer une notification candidat quand les documents sont reçus par l'admin
- [x] Ajouter une barre de progression du dossier (Évaluation → Bilan → Traduction → Soumission → Visa)
- [x] Tester le workflow complet : signature → soumission → évaluation IA → notification


## Espace Candidat Complet - Implémentation Complète (v17)
- [x] Créer les procédures tRPC pour le protocole d'accord
- [x] Créer les procédures tRPC pour la soumission de documents
- [x] Créer les procédures tRPC pour récupérer les données du dossier
- [x] Créer la page Mon Espace avec tous les onglets
- [x] Ajouter la route /mon-espace dans App.tsx
- [x] Mettre à jour la navigation pour pointer vers /mon-espace
- [x] Tester le workflow complet : connexion → Mon Espace → signature → soumission
- [x] Tester l'affichage des données du candidat
- [x] Tester la synchronisation admin-candidat
- [x] Tester les notifications email
- [x] Vérifier que les documents sont visibles dans l'interface admin
- [x] Vérifier que l'évaluation IA fonctionne correctement
- [x] Tester les messages entre candidat et conseiller
- [x] Créer un test vitest pour le workflow candidat complet
- [x] Déployer et vérifier en production


## Grille des 6 Services Majeurs — Page d'Accueil (v26)
- [x] Créer le composant ServicesSection.tsx avec les 6 cartes (Visa, Vols, Hôtels, Assurance, Traduction, Procédures)
- [x] Liens internes (wouter Link) pour Visa → /evaluation, Vols → /vols, Procédures → /procedures
- [x] Liens externes WhatsApp pour Hôtels, Assurance, Traduction
- [x] Intégrer ServicesSection dans Home.tsx entre la section "Nos Services" et la section "Évaluation"
- [x] Grille responsive 1/2/3 colonnes avec hover shadow + translate

## Dashboard Admin Unifié — Gestion Centralisée des Dossiers (v25)
- [x] Procédure tRPC `admin.listCandidates` : liste paginée avec filtres (statut, recherche texte)
- [x] Procédure tRPC `admin.updateCandidateStatus` : mise à jour statut + notification email optionnelle
- [x] Procédure tRPC `admin.importAgencyDossier` : saisie manuelle d'un dossier agence avec email de bienvenue
- [x] Procédure tRPC `admin.getCandidateDetails` : fiche détaillée d'un candidat
- [x] Page AdminDashboard.tsx refondée : tableau unifié (dossiers en ligne + agence), recherche, filtres par statut
- [x] Statistiques rapides : 6 compteurs (Total, Éval. 48h, Bilan dispo, Documents, Soumis, Visa accordé)
- [x] Badges de source (En ligne / Agence) et badges de statut colorés
- [x] Modale Fiche Candidat : infos complètes, score, barre de progression, mise à jour statut
- [x] Modale Saisir dossier agence : formulaire complet avec statut initial configurable
- [x] Bouton déconnexion dans l'en-tête du dashboard

## Sécurisation Accès Admin — URL Secrète & OTP (v27)
- [x] Supprimer le bouton "🛡️ Admin" de la Navbar (desktop et mobile)
- [x] Ajouter la route /admin/access-secret pointant vers AdminLogin (URL secrète)
- [x] Rediriger /admin → / (window.location.replace) pour masquer l'existence du panneau
- [x] Renommer la route principale admin de /admin vers /admin/dashboard
- [x] Insérer les 2 comptes admin autorisés dans admin_accounts : aureoldonfack@gmail.com et 3mtravelandservices@gmail.com (INSERT IGNORE)
- [x] Le routeur adminAuth.ts rejette déjà tout email absent de admin_accounts (vérification DB existante)


## Tableau de Bord Utilisateur — Suivi Paiements & Documents (v27)
- [x] Créer procédures tRPC : getPaymentHistory, getDocumentsStatus, getDossierOverview
- [x] Créer composant PaymentHistory avec timeline et statuts
- [x] Créer composant DocumentsStatus avec badges et progression
- [x] Créer composant DossierOverview avec infos synthétiques
- [x] Intégrer tableau de bord dans /mon-espace
- [x] Ajouter graphiques de progression (Chart.js ou Recharts)
- [x] Ajouter bouton actualisation manuelle
- [x] Ajouter export PDF de l'historique
- [x] Tester et déployer


## Module 4 : Guichet Paiement + E-Signature + CV International + Ambassadeur

- [x] Interface de paiement 65K XAF (CinetPay) - Formulaire de paiement
- [x] Intégration webhook CinetPay pour confirmation paiement
- [x] Module E-Signature - Composant de signature électronique
- [x] Stockage signatures électroniques en base de données
- [x] Générateur CV International - Page de création CV
- [x] Export CV en PDF avec logo 3M
- [x] Programme Ambassadeur - Page d'inscription ambassadeur
- [x] Dashboard ambassadeur avec statistiques de parrainage
- [x] Système de commissions pour ambassadeurs
- [x] Notifications ambassadeur (nouveaux parrainages, commissions)


## Historique des Paiements — Module 5 (Complété)
- [x] Créer la table `transactions` dans la base de données MySQL
- [x] Ajouter les procédures tRPC `getPaymentHistory` et `getPaymentStats`
- [x] Créer le composant PaymentHistory avec affichage des transactions
- [x] Intégrer PaymentHistory dans l'espace candidat (MySpace.tsx)
- [x] Afficher les statistiques de paiement (total, réussis, montant payé, en attente)
- [x] Implémenter la pagination pour gérer plusieurs transactions
- [x] Ajouter les animations Framer Motion pour les transitions
- [x] Ajouter le bouton d'actualisation manuel
- [x] Formater les dates et montants en français
- [x] Afficher les états vides avec messages informatifs


## Module 6 - Système de Notifications Automatiques (Complété)
- [x] Service WhatsApp avec Twilio (8 templates)
- [x] Routeur tRPC notificationRouter (9 procédures)
- [x] Notifications doubles (Email + WhatsApp)
- [x] Intégration dans le routeur principal
- [x] Build production réussi


## Module 7 - Admin Dashboard Avancé (Complété)
- [x] Routeur adminDashboardStats (9 procédures tRPC)
- [x] Composant AdminDashboardAdvanced avec graphiques
- [x] KPIs principaux et statistiques globales
- [x] Graphiques interactifs (Recharts)
- [x] Listes des dossiers et transactions récentes
- [x] Intégration dans le routeur principal


## Module 9 - Optimisation Performance (Complété)
- [x] Code splitting et lazy loading
- [x] Minification avec Terser
- [x] Compression gzip
- [x] Séparation des chunks (vendor, ui-components, recharts)
- [x] Build production optimisé

## Module 10 - Corrections de Bugs Critiques (En cours)
- [x] Vérifier tous les liens de navigation
- [x] Tester les formulaires
- [x] Vérifier l'authentification
- [x] Tester le responsive design
- [x] Corriger les erreurs de console
- [x] Vérifier les pages d'erreur


## Fonctionnalité d'Export des Statistiques (Complétée)
- [x] Routeur exportRouter avec procédures tRPC
- [x] Export en CSV (données complètes)
- [x] Export en PDF (rapport formaté)
- [x] Procédure downloadExport pour récupérer les fichiers
- [x] Boutons d'export dans AdminDashboardAdvanced
- [x] Intégration complète dans le dashboard
- [x] Build production réussi (498.8 KB)


## Module E-Visa Complet (EN COURS)
- [x] Créer la table e-visas avec tous les pays du monde
- [x] Charger les données de tous les pays (200+ pays)
- [x] Créer les procédures tRPC pour gérer les e-visas
- [x] Créer la page E-Visas avec liste complète
- [x] Ajouter les filtres (région, prix, délai de traitement)
- [x] Créer le formulaire de création de dossier e-visa
- [x] Intégrer le paiement CinetPay pour les e-visas
- [x] Tester le système complet
- [x] Contenu des pages Destinations, HeroSection et ServicesSection mis à jour avec des textes plus attrayants et convaincants, et corrections d'accessibilité.
- [x] Contenu des pages Destinations, HeroSection et ServicesSection mis à jour avec des textes plus attrayants et convaincants, et corrections d'accessibilité.


## Fonctionnalité de Filtrage et Tri — Page Destinations (v10)
- [x] Ajouter des filtres avancés : continent, type de visa, coût de la vie, climat
- [x] Implémenter un système de tri : par nom, coût, popularité, type de visa
- [x] Créer un composant FilterPanel réutilisable avec checkboxes et sliders
- [x] Ajouter un composant SortDropdown pour sélectionner l'ordre d'affichage
- [x] Implémenter la logique de filtrage et tri côté client (useMemo)
- [x] Ajouter des badges visuels pour afficher les filtres actifs
- [x] Créer un bouton "Réinitialiser les filtres" pour revenir à l'état initial
- [x] Ajouter des animations de transition lors de l'application des filtres
- [x] Intégrer les filtres dans la barre de recherche existante
- [x] Tester le système complet de filtrage et tri


## Amélioration Page E-Visa — Données Complètes et Frais Standardisés (v11)
- [x] Vérifier que tous les pays du monde sont présents dans la base de données e-Visa
- [x] Utiliser l'IA (OpenAI) pour générer les informations complètes de chaque pays (description, exigences, délai, validité)
- [x] Créer une procédure tRPC pour charger les informations e-Visa de tous les pays via IA
- [x] Mettre à jour la base de données avec les informations générées par l'IA
- [x] Configurer les frais d'accompagnement à 25 000 XOF pour tous les pays e-Visa
- [x] Ajouter un champ "frais d'accompagnement" dans la table e-visas
- [x] Afficher les frais d'accompagnement sur chaque carte e-Visa
- [x] Créer une procédure tRPC pour récupérer les e-visas avec les frais d'accompagnement
- [x] Tester l'affichage de tous les pays avec leurs informations complètes
- [x] Vérifier que les frais d'accompagnement sont correctement affichés et appliqués au paiement


## Formulaire de Demande E-Visa avec Tarif Pré-affiché (v12)
- [x] Créer un formulaire de demande e-visa dédié (EvisaRequestForm.tsx)
- [x] Ajouter les champs du formulaire : nom complet, email, téléphone, nationalité, type de visa
- [x] Afficher le tarif de 25 000 XOF pré-rempli et non modifiable
- [x] Ajouter un bouton "Demander ce e-Visa" sur chaque carte e-visa
- [x] Intégrer le bouton pour rediriger vers le formulaire avec le code pays en paramètre
- [x] Créer une procédure tRPC pour soumettre la demande e-visa
- [x] Ajouter la validation du formulaire côté client et serveur
- [x] Envoyer un email de confirmation au candidat après la soumission
- [x] Créer une table pour stocker les demandes e-visa
- [x] Afficher un message de succès après la soumission
- [x] Tester le flux complet de demande e-visa


## Téléchargement de Passeport dans le Formulaire E-Visa (v13)
- [x] Ajouter un champ de téléchargement de fichier pour le passeport
- [x] Valider le type de fichier (PDF, JPG, PNG uniquement)
- [x] Valider la taille du fichier (max 5 MB)
- [x] Afficher un aperçu du fichier sélectionné
- [x] Implémenter le téléchargement vers le stockage S3
- [x] Ajouter un indicateur de progression du téléchargement
- [x] Stocker l'URL du fichier dans la base de données
- [x] Ajouter des instructions claires pour le téléchargement
- [x] Afficher les fichiers téléchargés avec la possibilité de les supprimer
- [x] Tester le téléchargement et le stockage des fichiers


## Extraction IA des Informations du Passeport (v14)
- [x] Créer une procédure tRPC pour analyser le passeport avec l'IA
- [x] Utiliser l'API OpenAI Vision pour extraire les informations du document
- [x] Extraire le nom complet, la date de naissance, la nationalité du passeport
- [x] Valider les données extraites avant de les retourner
- [x] Ajouter un bouton "Analyser le passeport" au formulaire
- [x] Pré-remplir automatiquement les champs avec les données extraites
- [x] Afficher un indicateur de progression pendant l'analyse
- [x] Gérer les erreurs d'extraction (document illisible, format invalide)
- [x] Afficher un message de confirmation après l'extraction réussie
- [x] Permettre à l'utilisateur de modifier les données extraites
- [x] Tester l'extraction avec différents types de passeports


## Étape de Validation des Informations Extraites (v15)
- [x] Créer un composant ValidationStep.tsx pour afficher les informations extraites
- [x] Ajouter des champs éditables pour chaque information extraite
- [x] Afficher un résumé visuel des données avant validation
- [x] Ajouter des boutons "Corriger" et "Confirmer" pour chaque champ
- [x] Implémenter une logique de validation côté client
- [x] Afficher des messages d'erreur pour les données invalides
- [x] Permettre de revenir à l'étape de téléchargement si nécessaire
- [x] Ajouter une barre de progression (Etape 1: Téléchargement, Etape 2: Validation, Etape 3: Confirmation)
- [x] Intégrer le composant ValidationStep dans EvisaRequestForm
- [x] Tester la validation avec différents scénarios


## Animation de Succès et Message de Confirmation Personnalisé (v16)
- [x] Créer un composant SuccessAnimation.tsx avec confettis et animations
- [x] Ajouter des animations CSS pour les confettis qui tombent
- [x] Créer un message de confirmation personnalisé avec les détails de la demande
- [x] Afficher le numéro de demande généré
- [x] Afficher la date et l'heure de soumission
- [x] Afficher le pays et les frais de la demande
- [x] Ajouter un bouton pour télécharger un reçu PDF
- [x] Ajouter un bouton pour partager la demande par email
- [x] Ajouter une timeline avec les prochaines étapes
- [x] Afficher un message de remerciement personnalisé
- [x] Ajouter des animations de transition fluides
- [x] Tester les animations sur différents navigateurs


## Synchronisation Admin pour E-Visas avec Notifications Email (v17)
- [x] Créer un système de numéro de dossier unique pour chaque demande e-visa
- [x] Ajouter un champ status à la table evisa_requests (pending, processing, approved, rejected)
- [x] Créer une page admin pour visualiser toutes les demandes e-visa (AdminEvisaDashboard.tsx)
- [x] Ajouter des filtres et tri pour les demandes (statut, date, pays, client)
- [x] Créer une page détail de demande pour l'admin avec tous les documents (AdminEvisaDetail.tsx)
- [x] Ajouter des boutons d'action pour l'admin (approuver, rejeter, demander infos)
- [x] Créer un système de commentaires/notes pour l'admin
- [x] Ajouter un historique des modifications pour chaque demande
- [x] Créer un tableau de bord admin avec statistiques
- [x] Implémenter l'assignation des demandes aux admins
- [x] Implémenter les notifications email automatiques pour l'admin
- [x] Implémenter les confirmations email pour le client à chaque étape
- [x] Créer une synchronisation en temps réel avec WebSockets ou polling
- [x] Ajouter un système de rappels automatiques par email
- [x] Implémenter un système de notifications en temps réel pour l'admin
- [x] Ajouter un système de téléchargement des documents pour l'admin
- [x] Tester la synchronisation complète entre client et admin

- [x] Ajouter un bouton visible de sélection de CV PDF dans le formulaire d’évaluation primaire, avec validation du format, de la taille et retour visuel
- [x] Tester le téléchargement du CV et la soumission du formulaire d’évaluation primaire
- [x] Créer un checkpoint après validation de la correction du champ CV

**Note de suivi — 2026-08-11 :** Demande utilisateur : rendre le bouton CV clairement visible dans l’évaluation primaire.

## Intégration du moteur IA de scoring par pays
- [x] Extraire et auditer le contenu de moteur-ia-scoring-pays.zip
- [x] Comparer ses règles avec le moteur d’évaluation IA existant
- [x] Intégrer uniquement les règles compatibles sans remplacer le système existant
- [x] Tester le scoring par pays et compiler le projet en production
- [x] Créer un checkpoint après validation de l’intégration


## Score IA, tri administrateur et routeur des avis
- [x] Ajouter une jauge colorée du score IA dans l’espace candidat
- [x] Afficher et permettre le tri/filtrage du score IA dans le dashboard administrateur
- [x] Corriger le routeur customer_reviews et vérifier sa synchronisation avec la base existante
- [x] Tester les flux candidat/admin et compiler la production
- [x] Créer un checkpoint après validation

## Correction critique : synchronisation du schéma evaluations
- [x] Auditer le schéma Drizzle et la structure active de la table evaluations
- [x] Générer et appliquer la migration SQL pour ajouter les colonnes manquantes
- [x] Mettre à jour la route de soumission si nécessaire
- [x] Tester la soumission d'une évaluation complète sans erreur interne
- [x] Valider la compilation de production et créer un checkpoint de correction

## Confirmation, exports et recherche des évaluations complètes
- [x] Ajouter une animation et un message de confirmation après soumission de l’évaluation
- [x] Ajouter les filtres et tris administrateurs sur les nouveaux critères
- [x] Ajouter l’export CSV des évaluations complètes
- [x] Ajouter l’export PDF des évaluations complètes
- [x] Tester le formulaire, les exports et la compilation de production
- [x] Créer un checkpoint après validation

## Dashboard admin : pagination, prévisualisation et historique
- [x] Auditer les composants et routes d’export existants
- [x] Ajouter une pagination robuste des évaluations
- [x] Ajouter des actions rapides pour modifier le statut depuis la liste
- [x] Ajouter une prévisualisation PDF avant téléchargement
- [x] Persister et afficher l’historique des exports et actions admin
- [x] Tester les flux et compiler la production

## Compétence réutilisable du processus dashboard admin
- [x] Initialiser la compétence avec skill-creator
- [x] Rédiger les instructions et ressources réutilisables
- [x] Valider la compétence avec quick_validate.py
- [x] Livrer le fichier SKILL.md à l’utilisateur

## Audit des boutons cachés
- [x] Extraire et auditer audit-boutons-caches.zip
- [x] Comparer les boutons signalés avec les composants et routes actuels
- [x] Corriger la visibilité, les états et l’accessibilité des boutons concernés
- [x] Tester les boutons sur les vues desktop et mobile et compiler la production
- [x] Créer un checkpoint après validation de l’audit

## Correctif avis 7ème fois et traçabilité migration evaluations
- [x] Extraire et inspecter correctif-avis-7eme-fois.zip
- [x] Remplacer les 2 fichiers en conservant les chemins et la logique d’authentification correcte
- [x] Vérifier la table evaluations en production et tracer la migration manquante
- [x] Compiler la production et sauvegarder le checkpoint final

## Widget statistiques par pays, filtres de documents par classification IA et export CSV des rapports d'activité
- [x] Créer une procédure tRPC pour agréger les statistiques par pays des candidats et évaluations
- [x] Intégrer un widget graphique / tableau interactif de répartition par pays dans le dashboard administrateur
- [x] Ajouter la recherche, les filtres et le tri par classification IA sur la page de gestion des documents admin
- [x] Implémenter une procédure tRPC et un bouton d'export CSV pour les rapports d'activité administrateur
- [x] Tester les nouvelles fonctionnalités, vérifier la compilation de production et créer un checkpoint final

## Assistance Aureol, boutons flottants séparés et lien partageable des procédures
- [x] Séparer visuellement et fonctionnellement les boutons WhatsApp et assistant IA flottants sur desktop et mobile
- [x] Renommer les libellés de l’assistant IA en « Aureol » dans les composants actifs
- [x] Ajouter un champ de questions IA accessible depuis la page d’accueil et les interfaces pertinentes
- [x] Créer une page ou un lien partageable regroupant les procédures et ressources PDF existantes
- [x] Ajouter la page partageable à la navigation et proposer un bouton de copie/partage du lien
- [x] Tester la responsivité, les interactions et la compilation de production
- [x] Créer un checkpoint final

## Statistiques par pays, filtres documents IA et export CSV — suivi
- [x] Créer une procédure tRPC pour agréger les statistiques par pays des candidats et évaluations
- [x] Intégrer un widget graphique / tableau interactif de répartition par pays dans le dashboard administrateur
- [x] Ajouter la recherche, les filtres et le tri par classification IA sur la page de gestion des documents admin
- [x] Implémenter une procédure tRPC et un bouton d’export CSV pour les rapports d’activité administrateur
- [x] Tester les nouvelles fonctionnalités, vérifier la compilation de production et créer un checkpoint final

## Système d'enregistrement et d'analyse des questions fréquentes Aureol
- [x] Créer la table `aureol_questions` dans Drizzle pour stocker les questions posées, la réponse d'Aureol, l'adresse email optionnelle, le contexte de la page et le timestamp
- [x] Générer et appliquer la migration SQL pour la table `aureol_questions`
- [x] Étendre le routeur tRPC `aiCopilot` pour enregistrer automatiquement chaque question et réponse
- [x] Ajouter une procédure tRPC d'analyse pour regrouper et trier les questions fréquentes par occurrence
- [x] Créer un widget ou une section d'administration pour consulter les questions posées et les sujets fréquents
- [x] Tester le stockage et l'agrégation via Vitest et compiler la production
- [x] Créer le checkpoint final

## Transition vers hello@3mtravelagency.com pour l'expéditeur et les réceptions CV/évaluations
- [x] Rechercher et remplacer les occurrences opérationnelles de hello@3mtravelagency.click par hello@3mtravelagency.com dans les services d'envoi d'emails et routeurs
- [x] Mettre à jour les destinataires administratifs des CV, soumissions d'évaluation et formulaires de contact vers hello@3mtravelagency.com
- [x] Valider l'intégrité des services Resend / SMTP et exécuter les tests ciblés
- [x] Compiler la production et enregistrer le checkpoint final

## Configuration DNS (SPF, DKIM, DMARC), Alertes de Réception et Historique Admin
- [x] Documenter les enregistrements DNS exacts (SPF, DKIM, DMARC) pour 3mtravelagency.com
- [x] Créer la table `email_delivery_logs` dans Drizzle pour tracer chaque envoi (destinataire, sujet, statut, fournisseur, erreur)
- [x] Étendre le service `sendEmail` pour consigner automatiquement chaque tentative d'envoi et son statut dans `email_delivery_logs`
- [x] Implémenter un mécanisme d'alerte (WhatsApp / webhook) déclenché lorsqu'un message est reçu sur hello@3mtravelagency.com
- [x] Créer l'interface administrateur pour l'historique de délivrabilité et les statistiques d'envoi
- [x] Tester les routeurs et les logs via Vitest, puis compiler la production
- [x] Créer le checkpoint final

## Intégration de l'API de vols (api-vols-gratuite.zip) dans la page Vols
- [x] Extraire et inspecter le contenu de api-vols-gratuite.zip dans un dossier temporaire
- [x] Analyser l'endpoints, le format des données et la configuration d'authentification de l'API
- [x] Implémenter un routeur tRPC ou un service backend pour interroger l'API de vols de manière sécurisée
- [x] Mettre à jour la page `client/src/pages/Flights.tsx` pour intégrer le formulaire de recherche et l'affichage des résultats en temps réel
- [x] Tester les requêtes, valider la compilation de production et enregistrer le checkpoint final

## Nouvelles fonctionnalités Vols (Email récapitulatif, Historique & Commission Admin)
- [x] Créer la table `flight_search_history` pour stocker les recherches de vols des utilisateurs
- [x] Créer la table `agency_settings` pour stocker le taux de commission dynamique de l'agence
- [x] Ajouter la procédure tRPC pour envoyer le récapitulatif du vol par e-mail via hello@3mtravelagency.com
- [x] Ajouter l'historique des recherches dans le profil / espace candidat
- [x] Ajouter le module de configuration de la commission dans le dashboard administrateur
- [x] Tester les procédures, valider la compilation de production et enregistrer le checkpoint final

## Intégration de la vraie recherche de vols SearchAPI (SEARCHAPI_KEY)
- [x] Enregistrer SEARCHAPI_KEY via webdev_request_secrets sans l'exposer dans le code source
- [x] Extraire et analyser les archives `audit-boutons-caches.zip` et `api-vols-searchapi.zip`
- [x] Mettre en place le service d'interrogation de l'API Google Flights (SearchAPI.io) dans le serveur
- [x] Connecter le routeur `flights` à SearchAPI avec repli sur le mock si la clé ou le service est indisponible
- [x] Tester la recherche réelle, compiler la production et enregistrer le checkpoint final

## Optimisation SearchAPI (Cache mémoire, filtres avancés, badges et compétence)
- [x] Mettre en place un cache mémoire en-mémoire TTL (5 minutes) pour les requêtes SearchAPI
- [x] Ajouter les filtres par alliance aérienne (SkyTeam, Star Alliance, Oneworld) dans le routeur et l'UI
- [x] Intégrer les badges « En direct de Google Flights » et les indicateurs visuels de vols directs
- [x] Ajouter une animation de chargement fluide et immersive pendant la recherche en temps réel
- [x] Créer la compétence réutilisable `searchapi-flights-integration` avec skill-creator
- [x] Valider la compétence, compiler le projet et enregistrer le checkpoint final

## Refonte du Design Global (Style Ease.travel)
- [x] Auditer le design system actuel (typographie, espacements, cartes, boutons, header)
- [x] Moderniser le Navbar et les cartes principales avec des styles épurés, des effets de verre (glassmorphism) et des micro-animations fluides
- [x] Refondre la page d'accueil avec une hiérarchie visuelle premium, des sections aérées et des CTA marqués
- [x] Harmoniser l'ensemble des pages et des espaces utilisateurs pour reflter l'identité visuelle moderne
- [x] Tester la responsivité, valider la compilation de production et enregistrer le checkpoint final

## Mode Sombre Glassmorphism, Transitions Fluides et Compétence
- [x] Étendre `client/src/index.css` pour définir les variables du mode sombre (classes `.dark`) avec effet verre
- [x] Créer un composant ou un bouton de bascule du mode sombre (ThemeToggle) accessible dans la navigation
- [x] Intégrer des transitions de page fluides basées sur Framer Motion respectant `prefers-reduced-motion`
- [x] Créer la compétence réutilisable `glass-theme-transitions` avec `init_skill.py` et `quick_validate.py`
- [x] Compiler la production et enregistrer le checkpoint final

## Modales Glassmorphism, Thème Système et Micro-interactions Vols
- [x] Mettre à jour `ThemeContext.tsx` pour supporter le mode `"system"` avec écouteur `prefers-color-scheme`
- [x] Mettre à jour `ThemeToggle.tsx` pour permettre de basculer entre Clair, Sombre et Système avec un menu déroulant ou des icônes cycliques
- [x] Appliquer les classes `glass-card`, `backdrop-blur-xl` et des animations Framer Motion aux modales et aux composants du dashboard admin
- [x] Ajouter des animations de survol (hover scale, lueur subtile, transition douce) sur les cartes de vols et les boutons principaux
- [x] Compiler la production et sauvegarder le checkpoint final

## Tableaux Admin Glassmorphism, Chargements Animés et Vitesse des Animations
- [x] Extraire et analyser l'archive `analyse-vols-securite.zip`
- [x] Créer le contexte et les helpers de vitesse des animations utilisateur (vitesse normale, rapide, désactivée)
- [x] Intégrer l'option de réglage des animations dans l'espace / profil utilisateur
- [x] Appliquer les styles glassmorphism et des squelettes de chargement animés aux tableaux du dashboard administrateur
- [x] Créer la compétence réutilisable `glassmorphism-admin-dashboard` via `init_skill.py` et la valider avec `quick_validate.py`
- [x] Compiler la production, tester les interactions et enregistrer le checkpoint final

## Actualisation manuelle du dashboard administrateur
- [x] Ajouter un bouton d'actualisation manuelle avec icône de synchronisation dans l'en-tête du dashboard admin
- [x] Afficher la date et l'heure exactes de la dernière synchronisation réussie
- [x] Invalider les requêtes tRPC correspondantes lors du clic pour forcer le rechargement des données sans rafraîchir la page
- [x] Compiler le projet, vérifier la responsivité et enregistrer le checkpoint final

## Audit global et correction de toutes les pages et bugs
- [x] Vérifier la compilation et l'absence d'erreurs de routage ou d'imports manquants dans `App.tsx`
- [x] S'assurer que chaque page publique, utilisateur et administrateur gère correctement les états de chargement et d'erreur
- [x] Unifier le style glassmorphism et les préférences d'animation sur l'ensemble des écrans
- [x] Valider le build de production complet et enregistrer le checkpoint final

## Section FAQ interactive des réservations sur l'accueil
- [x] Créer un composant FAQ accordéon avec le style glassmorphism pour répondre aux questions de réservation de vols
- [x] Intégrer la section FAQ sur la page d'accueil (`Home.tsx`) juste avant le pied de page
- [x] Tester les interactions d'ouverture/fermeture, vérifier le build de production et enregistrer le checkpoint final

## Votes Utile / Non utile sur la FAQ de l'accueil
- [x] Ajouter la table `faq_feedback` dans `drizzle/schema.ts` pour stocker les votes des utilisateurs sur les questions FAQ
- [x] Créer la procédure tRPC de vote dans le routeur backend
- [x] Intégrer les boutons « Utile / Non utile » interactifs et animés dans le composant `FlightBookingFAQ.tsx`
- [x] Tester les votes via Vitest, valider le build de production et enregistrer le checkpoint final

## Graphique de satisfaction FAQ dans le dashboard administrateur
- [x] Créer une procédure tRPC admin pour agréger les votes `faq_feedback` (total, utiles, non utiles, taux de satisfaction et par question)
- [x] Intégrer un graphique de satisfaction (barres/camembert ou indicateurs Recharts) dans le dashboard administrateur
- [x] Ajouter un tableau récapitulatif par question FAQ avec les scores respectifs
- [x] Tester les requêtes, valider le build de production et enregistrer le checkpoint final

## Correction de sécurité : authentification admin sur updateCommission (vols)
- [x] Auditer le routeur `server/routers/flights.ts` pour identifier le comportement d'updateCommission
- [x] Importer `requireValidAdminSession` depuis `./adminAuth` et l'appliquer à `updateCommission`
- [x] Tester la compilation et vérifier le build de production
- [x] Enregistrer le checkpoint final sécurisé

## Analyse et correction ciblée des 4 fichiers (Auth, PDG, getFrequentQuestions)
- [x] Analyser les pages de login/register (`Login.tsx`, `Register.tsx`, `AdminLogin.tsx`, etc.) pour identifier le bug d'authentification récurrent
- [x] Localiser et retirer toute fausse donnée ou mention de « PDG » dans les composants ou pages de présentation
- [x] Inspecter le routeur Aureol / `aiCopilot.ts` pour sécuriser `getFrequentQuestions` avec `requireValidAdminSession`
- [x] Mettre à jour les fichiers ciblés en conservant leurs chemins exacts, compiler la production et enregistrer le checkpoint

## Suggestions de réponses IA pour les questions fréquentes d'Aureol
- [x] Ajouter une procédure tRPC admin `generateAiFrequentAnswers` dans `server/routers/aiCopilot.ts` protégée par `requireValidAdminSession` pour analyser les questions fréquentes et générer des suggestions structurées
- [x] Créer un composant ou un onglet dédié dans le dashboard administrateur pour déclencher la génération IA, prévisualiser et copier les suggestions de réponses
- [x] Valider le build de production, tester les flux et enregistrer le checkpoint final

## Amélioration des connaissances d'Aureol avec les 107 PDF de destination (RAG)
- [x] Inventorier et structurer les guides PDF des 107 destinations pour l'IA
- [x] Créer un index de connaissances vectoriel / textuel unifié pour les procédures de visa et d'études
- [x] Mettre à jour le routeur `aiCopilot.ts` pour injecter automatiquement les extraits pertinents des PDF dans le prompt d'Aureol
- [x] Tester les réponses d'Aureol sur plusieurs destinations clés (Canada, France, Belgique, Luxembourg, etc.)
- [x] Valider le build de production et enregistrer le checkpoint final

## Gestion Documentaire RAG & Sources Aureol (Import PDF, Cache, Sources et Téléchargement)
- [x] Créer la table `destination_documents` dans Drizzle pour stocker les métadonnées et le contenu des PDF de destination importés par les admins
- [x] Implémenter le service d'indexation avec cache mémoire/BD et upload sécurisé des PDF
- [x] Ajouter les procédures tRPC admin pour lister, uploader et supprimer les documents de destination
- [x] Mettre à jour le routeur `aiCopilot.ts` pour injecter les sources officielles, les liens de téléchargement et les citations dans les réponses du chatbot
- [x] Créer l'interface administrateur dans le dashboard pour gérer les PDF des destinations
- [x] Créer la compétence réutilisable `rag-document-management` via `init_skill.py` et la valider
- [x] Compiler la production, tester les flux et enregistrer le checkpoint final

## Widget de recherche multi-services style Ease.travel & Transmission automatique
- [x] Extraire et analyser les archives `api-vols-searchapi.zip`, `audit-boutons-caches.zip`, `api-vols-gratuite.zip`, `pasted_file_eEimmG_ease-style-v2.zip` et `pasted_file_HoWvyt_widget-recherche-ease-style.zip`
- [x] Intégrer le widget multi-services sur la page d'accueil façon Ease.travel
- [x] Enrichir le widget de vol (aller-retour, voyageurs, classe, moyens de paiement) et transmettre tous les paramètres vers `/flights`
- [x] Implémenter le lancement automatique de la recherche sur la page `/flights` à la réception des paramètres de l'URL ou du state
- [x] Tester la compilation de production, vérifier le rendu responsif et enregistrer le checkpoint final

## Intégration de verification-complete-v2.zip (Analyse et Correctifs)
- [x] Extraire et inspecter l'archive `verification-complete-v2.zip` dans un dossier temporaire
- [x] Auditer les fichiers extraits pour identifier les correctifs d'authentification et de sécurité
- [x] Intégrer les fichiers dans le projet en conservant leurs chemins d'origine sans régression
- [x] Lancer les tests unitaires et la compilation de production
- [x] Enregistrer le checkpoint final

## Favoris de vols, États de recherche et Journal d'audit de paiement
- [x] Créer les tables `favorite_flights` et `payment_audit_logs` dans `drizzle/schema.ts`
- [x] Mettre en place les procédures tRPC pour sauvegarder/consulter les favoris de vols et enregistrer/exporter le journal d'audit de paiement
- [x] Intégrer le bouton de favoris et les états de recherche fluides dans `/flights`
- [x] Intégrer l'affichage et l'export CSV du journal d'audit dans le tableau de bord administrateur
- [x] Intégrer la liste des favoris de vols dans le tableau de bord candidat / profil
- [x] Tester les flux, valider le build de production et enregistrer le checkpoint final

## Fiabilité des tarifs vols et supervision SearchAPI
- [x] Ajouter un badge explicite sur chaque carte lorsque le tarif affiché est simulé ou issu du cache
- [x] Renforcer le cache SearchAPI avec métriques de hit/miss, durée de conservation et nettoyage maîtrisé
- [x] Créer une procédure d’état SearchAPI protégée pour le tableau de bord administrateur, sans jamais exposer la clé API
- [x] Ajouter un panneau de supervision vols dans l’administration avec état, dernier incident, cache et accès sécurisé à la mise à jour de la clé
- [x] Ajouter les tests unitaires, vérifier les vues desktop/mobile, compiler et publier la version vérifiée

## Audit et Correction des éléments inactifs (v27)
- [x] Auditer les routes principales et liens de navigation dans `App.tsx` et les composants de navigation
- [x] Vérifier les formulaires (contact, recherche vols, évaluation rapide, ouverture de dossier) pour éliminer les boutons sans gestionnaire de clic ou formulaires non soumis
- [x] Identifier et corriger les pages potentiellement vides ou non routées
- [x] Tester les pages clés du site pour garantir une navigation 100% active et fonctionnelle
- [x] Valider le build de production et publier la version corrigée

## Infobulles explicatives sur les formulaires (v28)
- [x] Créer ou intégrer des infobulles (Tooltip / Popover) sur les champs complexes des formulaires (FullDossierForm, FlightSearch, Evaluation)
- [x] Tester les infobulles au survol et au clic pour garantir l'accessibilité mobile et desktop
- [x] Valider le build de production et publier la version avec infobulles

## Barre de progression dans les formulaires longs (v29)
- [x] Créer un composant de barre de progression visuelle globale et par étapes pour les formulaires longs (FullDossierForm, PremiumEvaluationForm)
- [x] Vérifier la mise à jour dynamique du pourcentage d'avancement lors de la saisie
- [x] Valider le build de production et publier la version avec barre de progression enrichie

## Sauvegarde automatique locale des formulaires (v30)
- [x] Implémenter la sauvegarde automatique dans le localStorage pour FullDossierForm avec notification discrète
- [x] Ajouter une invite de restauration de brouillon lors de l'ouverture du formulaire
- [x] Effacer le brouillon automatiquement après soumission réussie
- [x] Valider le build de production et publier la version avec sauvegarde locale

## Export PDF du brouillon inachevé (v31)
- [x] Ajouter une fonction d'export PDF dans FullDossierForm pour télécharger le brouillon en cours
- [x] Inclure les informations saisies et un bandeau "Brouillon inachevé - Non soumis" dans le PDF généré via jsPDF
- [x] Valider le build de production et publier la version avec export PDF du brouillon

## Amélioration du design du PDF de brouillon (v32)
- [x] Refondre la fonction handleExportDraftPdf dans FullDossierForm avec un design professionnel, des tableaux structurés et le logo officiel
- [x] Valider le build de production et publier la version avec PDF amélioré

## Intégration d'un QR code dans le PDF de brouillon (v33)
- [x] Installer ou utiliser une bibliothèque de génération de QR code (comme qrcode) dans FullDossierForm
- [x] Ajouter le QR code pointant vers l'URL de l'agence ou la page de suivi dans le PDF professionnel
- [x] Valider le build de production et publier la version avec QR code

## Bouton d'impression directe du récapitulatif (v34)
- [x] Ajouter une fonction handlePrintDraft dans FullDossierForm pour ouvrir la boîte de dialogue d'impression
- [x] Ajouter le bouton d'impression à côté du bouton de téléchargement PDF dans l'en-tête du formulaire
- [x] Valider le build de production et publier la version avec impression directe

## Fenêtre modale d'aperçu avant impression (v35)
- [x] Créer un état d'affichage de la modale d'aperçu dans FullDossierForm
- [x] Concevoir la boîte modale affichant le récapitulatif stylisé aux couleurs de l'agence avec QR code
- [x] Ajouter les boutons "Fermer" et "Lancer l'impression" directement dans l'aperçu
- [x] Valider le build de production et publier la version avec aperçu avant impression

## Amélioration de la page Procédures (v36)
- [x] Auditer ProceduresAdvanced.tsx et l'intégration des 107 destinations
- [x] Refondre l'interface visuelle avec des cartes glassmorphism modernes, des badges de délai/coût et un accès direct "Lancer ma procédure"
- [x] Valider le build de production et publier la version améliorée de la page procédures

## Pages de Destination Individuelles pour les 107 Pays (v37)
- [x] Créer un composant dynamique de page pays (`CountryDetailPage.tsx`) affichant la culture, le travail, les emblèmes, les photos emblématiques, les informations administratives et la procédure complète
- [x] Configurer la route dynamique `/procedures/:countryId` dans `App.tsx`
- [x] Mettre à jour les liens des cartes de pays dans `ProceduresAdvanced.tsx` pour pointer vers `/procedures/:countryId`
- [x] Valider le build de production et publier le répertoire complet des 107 destinations

## Vérification du parcours de détail pays (v38)
- [x] S'assurer que chaque carte de destination dans la page Procédures propose un bouton explicite "Détails de la procédure" pointant vers `/procedures/:countryId`
- [x] Vérifier que la page pays détaille les atouts, la culture, le travail et un bouton bien visible "Lancer la procédure" en bas de page
- [x] Valider le build de production et publier la version finale optimisée

## Sauvegarde des destinations favorites (v39)
- [x] Ajouter une table ou persistance pour les destinations favorites des utilisateurs dans la base de données ou le localStorage
- [x] Intégrer un bouton "Ajouter aux favoris / Retirer des favoris" avec icône cœur sur chaque page pays (`CountryDetailPage.tsx`)
- [x] Afficher la liste des destinations favorites dans le tableau de bord candidat
- [x] Valider le build de production et publier la version avec gestion des destinations favorites

## Comparaison côte à côte des destinations favorites (v40)
- [x] Créer la page de comparaison `CountryComparisonPage.tsx` pour lister et comparer les pays favoris enregistrés dans localStorage
- [x] Ajouter la route `/procedures/comparaison` dans `App.tsx` et un lien d'accès rapide depuis la page Procédures et le tableau de bord
- [x] Valider le build de production et publier la version avec comparateur de favoris

## Bouton Lancer la procédure dans le comparateur (v41)
- [x] Vérifier CountryComparisonPage.tsx et s'assurer que chaque carte dispose d'un bouton bien visible "🚀 Lancer la procédure" pointant vers `/evaluation-primaire?destination={country.id}`
- [x] Valider le build de production et publier la version optimisée du comparateur

## Indicateur de compatibilité du profil dans le comparateur (v42)
- [x] Mettre à jour CountryComparisonPage.tsx pour calculer ou afficher un score de compatibilité estimé (ou basé sur le dernier score d'évaluation stocké) pour chaque pays
- [x] Intégrer un badge de compatibilité visuel et progressif sous chaque pays dans le tableau comparatif
- [x] Valider le build de production et publier la version avec indicateur de compatibilité

## Formulaire de profil interactif dans le comparateur (v43)
- [x] Ajouter des états de profil utilisateur (niveau d'études, expérience, budget) dans CountryComparisonPage.tsx avec stockage localStorage
- [x] Créer un panneau de configuration de profil au-dessus du tableau comparatif pour ajuster les critères en temps réel
- [x] Mettre à jour dynamiquement la formule de compatibilité pour refléter les choix du candidat
- [x] Valider le build de production et publier la version avec profil interactif

## Infobulle détaillée sur le score de compatibilité (v44)
- [x] Enrichir CountryComparisonPage.tsx pour générer un détail textuel des critères (type de visa, niveau d'études, expérience, difficulté pays)
- [x] Intégrer une infobulle (Tooltip ou popover au survol) affichant les points forts et points d'attention du profil par pays
- [x] Valider le build de production et publier la version avec infobulle de compatibilité explicable

## Recommandations personnalisées dans l'infobulle (v45)
- [x] Mettre à jour getCompatibilityDetails dans CountryComparisonPage.tsx pour ajouter des conseils d'amélioration ciblés (langue, diplôme, budget, expérience)
- [x] Adapter la structure de l'infobulle au survol pour inclure une section "Actions recommandées"
- [x] Valider le build de production et publier la version avec recommandations personnalisées

## Parcours e-Visa filtré et pages détaillées par destination (v46)
- [x] Créer ou auditer la page e-Visa pour ne conserver que les pays éligibles à l'e-Visa (exclure l'ambassade directe)
- [x] Créer un composant dédié `EvisaDetailPage.tsx` ou adapter CountryDetailPage pour les procédures e-Visa avec drapeau, culture, emblèmes et procédure e-Visa complète
- [x] Configurer la route dynamique `/evisa/:countryId` dans `App.tsx`
- [x] Valider le build de production et publier la version e-Visa enrichie

## Améliorations e-Visa avancées (v47)
- [x] Ajouter un filtre par délai d'obtention (24h, 48h, 3-5 jours, autres) dans l'annuaire e-Visa (EvisasAdvanced.tsx)
- [x] Intégrer un parcours de paiement direct des frais consulaires e-Visa depuis la fiche pays (EvisaDetailPage.tsx)
- [x] Créer une vue de suivi et validation administrative des demandes e-Visa dans le dashboard admin
- [x] Valider le build de production et publier la version avec e-Visa avancé

## Automatisation complète du parcours e-Visa (v48)
- [x] Auditer les flux de demande, de paiement, de reçu et de notification e-Visa
- [x] Implémenter la génération automatique de facture/reçu après le paiement des frais consulaires e-Visa
- [x] Configurer l'envoi d'e-mails automatiques de confirmation et de mise à jour de statut via hello@3mtravelagency.com
- [x] Synchroniser les demandes e-Visa entre l'espace candidat et le tableau de bord administrateur
- [x] Valider le build de production et publier la version e-Visa 100% opérationnelle

## Analyse automatique des scans de passeport (v49)
- [x] Concevoir le module d'analyse de documents (vérification de format, contrôle de netteté/lisibilité, détection des zones biographiques et vérification de validité)
- [x] Intégrer l'analyse automatique lors du téléversement de passeport dans l'espace client (DocumentUploadPage.tsx / SubmitDocuments.tsx)
- [x] Afficher un retour instantané au candidat (score de lisibilité, avertissement d'expiration éventuelle)
- [x] Transmettre le rapport d'analyse dans le tableau de bord administrateur pour validation finale
- [x] Valider le build de production et publier la version avec analyse de passeport

## Marqueurs visuels et aperçu annoté des passeports (v50)
- [x] Enrichir passportAnalyzer.ts pour générer des coordonnées de zones annotées (reflets, zones floues, marges coupées)
- [x] Mettre à jour DocumentUploadPage.tsx pour afficher l'image du document avec des cadres colorés interactifs sur les zones problématiques
- [x] Ajouter une légende détaillée expliquant chaque marqueur visuel pour guider le candidat
- [x] Valider le build de production et publier la version avec marqueurs visuels sur les scans

## Transmission du rapport annoté au dashboard admin (v51)
- [x] Étendre la table clientDocuments ou stocker les métadonnées d'analyse de passeport (zones annotées et score)
- [x] Mettre à jour la procédure de soumission de document pour enregistrer le résultat de l'analyse automatique
- [x] Intégrer l'affichage du rapport annoté et des marqueurs visuels dans l'interface de vérification des documents de l'administrateur
- [x] Valider le build de production et publier la version avec synchronisation admin du rapport de passeport

## Commentaires et prévalidation des passeports (v52)
- [x] Permettre aux administrateurs d’ajouter un commentaire textuel ciblé à chaque marqueur visuel de passeport
- [x] Mettre en place une prévalidation automatique traçable des scans dont le score dépasse 95 %, sans remplacer la décision finale du dossier
- [x] Ajouter un bouton de renvoi immédiat du document refusé avec ses annotations et sa notification au candidat
- [x] Tester les droits, les statuts et la notification, puis publier la version validée

## Conformité documentaire avancée et réutilisable (v53)
- [x] Créer et valider une compétence réutilisable de conformité documentaire (analyse, annotations, prévalidation, retours candidat et rapports)
- [x] Ajouter l’historique horodaté des commentaires échangés pour chaque marqueur visuel
- [x] Intégrer un recadrage guidé local avant nouveau téléversement de passeport, avec prévisualisation et contrôles de cadrage
- [x] Créer un tableau d’exigences documentaires par pays de destination, exploitable par candidats et administrateurs
- [x] Appliquer la prévalidation seulement si le score dépasse 95 % et si la zone biographique est explicitement valide
- [x] Ajouter un rapport mensuel agrégé de conformité documentaire par pays pour les auditeurs, avec envoi planifié et contrôlé
- [x] Fournir les destinataires d’audit autorisés et créer l’exécution mensuelle en production
- [x] Tester les autorisations, les données sensibles, les notifications et publier la version validée

## Correctifs prioritaires de sécurité, fiabilité et SEO (v54)
- [x] Cartographier les accès sensibles, tâches planifiées, paiements CinetPay et téléversements exposés
- [x] Retirer les secrets de secours et sécuriser les sessions administratives uniquement côté serveur
- [x] Protéger les endpoints planifiés avec une authentification serveur robuste et idempotente
- [x] Fiabiliser l’initialisation, la vérification et le traitement unique des paiements CinetPay
- [x] Restreindre, valider et sécuriser les dépôts de documents privés
- [x] Corriger les routes dupliquées ou ambiguës et définir les redirections canoniques
- [x] Corriger l’encodage UTF-8, les métadonnées, le plan de site et les aperçus sociaux
- [x] Réduire le chargement initial, optimiser l’interface mobile et masquer les widgets non essentiels sur les parcours critiques
- [x] Ajouter les tests automatisés critiques, exécuter les contrôles et publier une version validée

## Correctifs internes sans modification visuelle (v55)
- [x] Sauvegarder la version de référence avant toute remédiation interne
- [x] Préserver strictement les pages, contenus, menus, structure et styles pendant les corrections
- [x] Corriger les sessions, paiements, téléversements et tâches planifiées exposés
- [x] Retirer la restauration de session candidat basée sur localStorage et s’appuyer sur la session serveur
- [x] Corriger les routes, l’encodage, les erreurs TypeScript, console et réseau
- [x] Vérifier les boutons, formulaires, liens et redirections existants sur mobile et bureau
- [x] Supprimer la duplication de l’en-tête sur les pages de procédure mobile sans modifier le design global
- [x] Corriger l’avertissement console des options de sélection sans modifier les formulaires
- [x] Remplacer les dépôts et réenvois de documents simulés par des actions serveur réelles
- [x] Rendre le téléchargement de reçu de paiement réellement fonctionnel
- [x] Corriger les liens et formulaires publics inactifs sans modifier leur apparence
- [x] Corriger le débordement mobile du badge de niveau sur les fiches pays, sans modifier la charte visuelle
- [x] Corriger l’unicité et les statistiques du service central de numérotation des dossiers
- [x] Exécuter les tests et le build, puis documenter les correctifs et prérequis externes

## Automatisation des documents et gestion candidats (v56)
- [x] Créer et valider une compétence réutilisable pour les correctifs internes sécurisés et la gestion administrative des candidats
- [x] Envoyer une alerte e-mail à l’administration lors d’un nouveau dépôt de document candidat
- [x] Ajouter un export CSV sécurisé des données candidats depuis le tableau de bord administrateur
- [x] Ajouter recherche, filtres et tri avancés dans la liste administrative des candidats
- [x] Tester les alertes, l’export, les autorisations et publier la version validée

## Pagination serveur des candidats (v57)
- [x] Ajouter une pagination serveur sécurisée qui conserve les filtres et le tri
- [x] Ajouter les contrôles de navigation et le total de résultats au tableau candidats existant
- [x] Tester la pagination, l’export filtré, les autorisations et publier la version validée

## Pagination persistante des candidats (v58)
- [x] Créer et valider une compétence réutilisable de pagination administrative persistante
- [x] Ajouter les tailles de page 10, 25, 50 et 100 à la liste candidats
- [x] Remplacer la navigation simple par une numérotation de pages cliquable
- [x] Synchroniser filtres, tri, taille de page et page courante dans l’URL
- [x] Tester les paramètres URL, la pagination et publier la version validée

## Intégration sélective de l’archive fonctions complétées (v59)
- [x] Comparer les fichiers fournis avec les versions actives et repérer les améliorations compatibles
- [x] Intégrer uniquement les correctifs qui préservent les protections de session, paiement et documents
- [x] Tester les intégrations retenues avec la pagination persistante et publier la version validée

## Vues administratives sauvegardées (v60)
- [x] Créer et valider une compétence réutilisable de vues administratives persistantes
- [x] Permettre la sauvegarde sécurisée de vues favorites de filtres candidats par compte administrateur
- [x] Ajouter la copie de l’URL des filtres actifs pour le partage entre administrateurs
- [x] Afficher un compteur dynamique des dossiers correspondant aux filtres appliqués
- [x] Tester les vues, le partage, les autorisations et publier la version validée

## Demande d’assurance voyage (v61)
- [x] Créer un formulaire complet de demande d’assurance voyage depuis le point d’entrée existant
- [x] Enregistrer la demande de manière sécurisée et la rendre visible aux administrateurs
- [x] Notifier l’administration et préparer un message WhatsApp récapitulatif pour l’agence
- [x] Tester les validations, la soumission et le parcours de consultation admin

## Devis et attestation d’assurance (v62)
- [x] Générer automatiquement un devis PDF après la soumission d’une demande d’assurance
- [x] Permettre à l’administration de téléverser une attestation finalisée sécurisée sur la demande client
- [x] Ajouter une progression visuelle par étapes au formulaire d’assurance
- [x] Unifier progressivement coordonnées, preuves sociales, services, formulaire principal, bloc légal, footer et demande de vol sans refonte
- [x] Tester les flux d’assurance, l’affichage mobile et publier la version validée

## Audit métier et architecture dossiers (v63)
- [x] Inventorier le schéma, les migrations, les relations et les index existants sans modifier les données
- [x] Vérifier les tables réelles de la base et leur utilisation par les routeurs et interfaces
- [x] Cartographier les parcours client, admin, documents, paiements, messages, notifications et création en agence
- [x] Comparer l’existant au modèle métier cible et identifier les écarts, doublons et risques de migration
- [x] Produire un rapport d’audit détaillé avec priorités, SQL de migration proposé et plan de tests, sans l’appliquer

## Dossier canonique et suivi client sécurisé (v64)
- [x] Créer et appliquer les migrations additives pour les dossiers, historiques, notifications et exigences documentaires
- [x] Mettre en place les index et relations nécessaires sans supprimer les tables historiques
- [x] Contrôler la propriété serveur de chaque lecture de dossier, document et attestation client
- [x] Créer l’espace client de suivi fondé sur les structures canoniques, avec actualisation manuelle
- [x] Tester les migrations, les accès isolés, les documents et les parcours mobile/bureau avant publication

## Audit des interactions et boutons inaccessibles (v65)
- [x] Inventorier les boutons, liens, formulaires et routes interactives du site
- [x] Identifier les boutons sans action, liens morts, actions bloquées ou modales inaccessibles
- [x] Corriger les interactions confirmées sans modifier le design ni les contenus
- [x] Ajouter ou mettre à jour les tests de fiabilité des interactions critiques
- [x] Vérifier mobile/bureau, TypeScript, build et publier la correction

## Restauration des CTA du héros et des pages cibles (v66)
- [x] Cartographier tous les boutons et liens présents dans le héros avec leurs routes cibles
- [x] Identifier les pages presque vides ou incorrectement associées aux CTA Procédures, E‑Visa et services associés
- [x] Restaurer le contenu existant attendu et reconnecter les routes sans modifier le design
- [x] Vérifier les CTA sur desktop et mobile avec états de chargement et pages de retour utilisables
- [x] Exécuter TypeScript, tests et build puis publier la restauration

## Correctif ciblé des CTA héros Procédure et e‑design (v67)
- [x] Identifier les éléments exacts « Procédure » et « e‑design » du héros et leurs routes actuelles
- [x] Corriger leurs destinations vers les pages de contenu officielles
- [x] Tester les clics desktop/mobile et les pages cibles
- [x] Valider TypeScript, tests et build puis publier

## Audit complet dossiers candidats et administration (v68)
- [x] Cartographier les pages, routes, rôles et étapes du dossier candidat
- [x] Vérifier le dépôt réel, la persistance et l’accès aux documents côté candidat et administrateur
- [x] Vérifier la visualisation, le téléchargement, les annotations et les statuts documentaires côté admin
- [x] Vérifier la gestion administrative des étapes, paiements, statuts et synchronisation avec l’espace candidat
- [x] Vérifier que les administrateurs peuvent modifier les données et l’avancement autorisés du candidat
- [x] Rechercher et corriger les pages blanches, erreurs console, routes mortes et boutons inactifs
- [x] Tester desktop/mobile, TypeScript, tests et build puis publier le correctif

## Adresse d’envoi Resend officielle (v69)
- [x] Repérer toutes les adresses de test `example.com` et la configuration d’envoi Resend
- [x] Remplacer les adresses de test par `hello@3mtravelagency.com` sans exposer de secret
- [x] Adapter les tests e-mail pour utiliser l’adresse de test officielle autorisée
- [x] Valider tests, TypeScript, build et état du déploiement

## Suivi des e-mails et renvoi de confirmations (v70)
- [x] Auditer les journaux e-mail, les procédures d’envoi et les pages admin/candidat concernées
- [x] Ajouter le widget administrateur de statut, erreurs et historique des e-mails
- [x] Ajouter une procédure admin sécurisée pour renvoyer l’e-mail de confirmation
- [x] Afficher une confirmation visuelle côté candidat après l’envoi réussi ou échoué
- [x] Ajouter les tests de sécurité et de fiabilité des notifications
- [x] Vérifier responsive, TypeScript, tests, build et publier

## Infobulle des erreurs d’envoi e-mail (v71)
- [x] Auditer l’affichage actuel des erreurs dans le widget e-mail admin
- [x] Ajouter une infobulle accessible expliquant les erreurs d’adresse invalide
- [x] Afficher une recommandation de correction adaptée au type d’erreur
- [x] Vérifier responsive, TypeScript, tests et build puis publier

## Correction et relance des e-mails échoués (v72)
- [x] Auditer les journaux, identifiants candidats et mutations admin existantes
- [x] Ajouter l’édition persistante de l’adresse e-mail depuis une ligne d’erreur
- [x] Ajouter les filtres par statut et type d’erreur
- [x] Ajouter le renvoi manuel sécurisé après correction de l’adresse
- [x] Journaliser la correction et le nouvel envoi sans exposer de secret
- [x] Vérifier autorisations, responsive, TypeScript, tests, build et publier

## Suivi renforcé de vérification humaine des passeports (v73)
- [x] Auditer les tables, routes et composants actuels de vérification documentaire
- [x] Ajouter un journal d’audit des validations et rejets manuels de documents
- [x] Afficher un indicateur visuel de vérification humaine dans l’administration
- [x] Configurer une alerte hebdomadaire sécurisée des documents en attente
- [x] Tester permissions, responsive, migrations, TypeScript, tests, build et publier

## Navigation robuste depuis Navbar.tsx (v74)
- [x] Comparer l’archive navigation-robuste.zip avec le Navbar actuel et cartographier les routes
- [x] Remplacer la navigation JavaScript par de vrais liens avec repli automatique
- [x] Vérifier les clics, routes, mobile, TypeScript, tests et build puis publier

## Correction des écrans blancs après navigation publique (v75)
- [x] Reproduire le blanc sur `/procedures` et les principales routes publiques après retour arrière ou retour
- [x] Relever les erreurs console, réseau, routes et états React responsables
- [x] Corriger la cause commune sans modifier les contenus ni le design
- [x] Tester tous les liens publics, les retours arrière et le responsive desktop/mobile
- [x] Valider TypeScript, tests, build et publier le correctif

## Navigation instantanée et transitions (v76)
- [x] Auditer Navbar, routes et shell de transition existants
- [x] Ajouter le préchargement intelligent au survol et au focus clavier des liens principaux
- [x] Ajouter un cache mémoire limité aux routes publiques fréquentes, sans données sensibles
- [x] Ajouter une barre de progression subtile lors des changements de route
- [x] Tester accessibilité, allers-retours, responsive, TypeScript, tests et build puis publier

## Refonte complète du catalogue e-Visa et fiches détaillées pays (v77)
- [x] Auditer la page e-Visa actuelle et les composants de la page Procédures à réutiliser
- [x] Constituer un catalogue rigoureux de 35+ destinations nécessitant un e-Visa pour les Camerounais/Africains
- [x] Implémenter les fiches de détail e-Visa individuelles avec visuels de capitale, formalités, documents et CTA « Lancer ma procédure e-visa »
- [x] Tester les filtres, la recherche, les liens, le responsive, TypeScript, tests et build puis publier

## Version bilingue Français / Anglais (v78)
- [x] Auditer l’architecture linguistique actuelle, les composants d’interface et les guides PDF
- [x] Implémenter le contexte et le sélecteur de langue persistants (FR/EN)
- [x] Traduire et adapter le Navbar, l’accueil, l’annuaire des procédures, les e-Visas et le suivi client en anglais
- [x] Générer et relier les guides PDF en anglais pour chaque destination et procédure
- [x] Tester les changements de langue, la persistance, le responsive, TypeScript, tests et build puis publier

## Sélecteur de langue avec drapeaux et détection navigateur (v79)
- [x] Auditer le contexte LanguageProvider et le sélecteur Navbar
- [x] Ajouter les drapeaux FR/EN avec libellés accessibles
- [x] Détecter la langue du navigateur uniquement lors de la première visite
- [x] Préserver toute préférence mémorisée et mettre à jour l’attribut lang
- [x] Tester clavier, mobile, persistance, TypeScript, tests et build puis publier

## Persistance de préférence de langue (v80)
- [x] Auditer le contexte de langue, l’authentification et le profil utilisateur
- [x] Persister le choix manuel dans un cookie sécurisé pour les visiteurs
- [x] Synchroniser la langue avec le profil serveur des utilisateurs connectés
- [x] Respecter la priorité du choix manuel sur la détection navigateur
- [x] Tester reconnexion, responsive, TypeScript, tests et build puis publier

## Internationalisation des erreurs, toasts et pop-ups (v81)
- [x] Auditer les systèmes de toast, erreurs, dialogues et dictionnaire bilingue
- [x] Centraliser les messages FR/EN et adapter les composants globaux et locaux
- [x] Tester les deux langues, erreurs, toasts, confirmations, responsive, TypeScript, tests et build puis publier

## Traduction automatique des erreurs API (v82)
- [x] Auditer le transport tRPC, les erreurs backend et le dictionnaire bilingue existant
- [x] Créer le catalogue de traduction et le normalisateur d’erreurs API bilingue
- [x] Brancher la traduction dans le client tRPC et les notifications d’erreur
- [x] Valider avec des tests unitaires, TypeScript, tests globaux et build de production

## Visuels professionnels accueil et procédures (v83)
- [x] Auditer les emplacements d’images, le design actuel et les assets existants
- [x] Préparer des visuels cohérents de mobilité internationale pour l’accueil et Canada/Schengen
- [x] Intégrer les images et drapeaux dans l’accueil et les fiches procédures
- [x] Vérifier rendu, performance, responsive, accessibilité, TypeScript, tests et build puis publier

## Gestion admin des images et drapeaux par destination (v84)
- [x] Auditer les modèles, routes et écrans existants pour les destinations et les médias
- [x] Ajouter une structure persistante et sécurisée pour les médias de chaque destination
- [x] Créer l’interface admin de recherche, prévisualisation, import, remplacement et suppression contrôlée
- [x] Synchroniser les images et drapeaux des fiches publiques avec les médias administrés
- [x] Ajouter validations de type, taille, accès privé et états d’erreur/chargement
- [x] Écrire et exécuter les tests, valider TypeScript, responsive et build de production
- [x] Sauvegarder et publier la version après vérification finale

## Import en masse par glisser-déposer des visuels de destination (v85)
- [x] Définir le flux d’import en masse et les règles d’association aux destinations
- [x] Étendre l’API sécurisée pour traiter plusieurs médias administrés avec protection contre les doublons
- [x] Construire l’interface glisser-déposer, file d’attente, prévisualisation et progression
- [x] Tester les validations, erreurs, responsive, sécurité, TypeScript, suite Vitest et build puis publier

## Modernisation du héros 3M Travel Agency (v86)
- [x] Auditer le héros actuel, le logo, les textes et les contraintes d’affichage
- [x] Concevoir et produire la nouvelle direction visuelle et le visuel héro inclusif avec Canada/Schengen/Amérique
- [x] Intégrer le nom 3M Travel Agency, le logo agrandi, l’accroche raffinée et le nouveau visuel
- [x] Vérifier responsive, accessibilité, TypeScript, suite Vitest, build et publier

## CTA héros vers l’évaluation gratuite (v87)
- [x] Auditer le CTA existant et confirmer la route du formulaire d’évaluation gratuite
- [x] Ajouter le bouton CTA avec effet de survol élégant et navigation robuste
- [x] Vérifier le clic, le responsive, l’accessibilité, TypeScript, les tests et le build puis publier

## Correction bilingue globale et héros amélioré 3M Travel Agency (v88)
- [x] Auditer le sélecteur de langue, les textes non traduits et la structure du héros
- [x] Produire et intégrer le nouveau visuel d’accueil inclusif représentant la réussite de voyageurs diversifiés
- [x] Corriger l’application globale FR/EN, centrer le logo et harmoniser le héros
- [x] Vérifier le changement de langue, le responsive, l’accessibilité, TypeScript, la suite de tests et le build puis publier

## Parallaxe de l’image du héros (v89)
- [x] Auditer le héros et définir une intensité de parallaxe compatible desktop et mobile
- [x] Implémenter le parallaxe avec animation optimisée et repli pour mouvement réduit
- [x] Vérifier le rendu, la fluidité, le responsive, TypeScript, les tests et le build puis publier

## Système d’avatar et photo de profil obligatoire à l’inscription (v90)
- [x] Auditer le schéma candidat, les tables d’inscription et le stockage des fichiers
- [x] Ajouter la colonne avatar_url avec migration additive et endpoint de mise à jour sécurisée
- [x] Intégrer l’étape obligatoire d’upload d’avatar lors de l’inscription et l’affichage dans l’espace client
- [x] Vérifier les restrictions de type/taille, la sécurité, TypeScript, la suite de tests et le build puis publier

## Correction image d’arrière-plan invisible du héros (v91)
- [x] Auditer la référence d’image, le stockage, le composant héros et les logs réseau
- [x] Corriger la source ou les styles de l’image sans altérer la structure visuelle
- [x] Vérifier le chargement réel, le responsive, TypeScript, les tests et le build puis publier

## Animation d’apparition du héros (v92)
- [x] Auditer les animations existantes et définir une séquence d’apparition accessible
- [x] Implémenter le fondu progressif du texte principal et du CTA avec respect du mouvement réduit
- [x] Vérifier le rendu initial desktop/mobile, l’accessibilité, TypeScript, les tests et le build puis publier

## Refonte visuel HD professionnel et épuré du héros (v93)
- [x] Auditer le visuel actuel, son emplacement et les contraintes de lisibilité du héros
- [x] Générer un nouveau visuel éditorial HD avec visages différenciés, identité 3M et repères Canada/Europe
- [x] Intégrer le nouveau visuel et ajuster les calques pour préserver contraste et parallaxe
- [x] Vérifier rendu HD, responsive, accessibilité, TypeScript, tests, build et publier

## Widget d’actualités officielles des ambassades Canada et Europe (v94)
- [x] Définir les sources officielles, le périmètre éditorial et la stratégie de récupération des actualités
- [x] Mettre en place la récupération sécurisée, le cache et la traduction FR/EN des actualités
- [x] Construire et intégrer le widget sous l’accueil avec sources, filtres et états de chargement
- [x] Vérifier exactitude, sécurité, responsive, accessibilité, TypeScript, tests, build et publier

## Badge animé pour annonces urgentes des ambassades (v95)
- [x] Définir les critères de priorité et le modèle de données des annonces majeures
- [x] Intégrer le badge important ou urgent avec animation accessible dans les cartes d’actualités
- [x] Vérifier le rendu, les états bilingues, le mouvement réduit, TypeScript, les tests, le build et publier

## Refonte visuelle Canada/Schengen et services (v96)
- [x] Auditer les pages, services, images, emblèmes, routes et bugs visuels prioritaires
- [x] Produire une image de héros douce et des visuels éditoriaux pour les services clés (assurance, e-visa)
- [x] Intégrer le nouveau héros à deux personnes, les emblèmes et les images par service
- [x] Corriger les bugs prioritaires et vérifier navigation, états, responsive et accessibilité
- [x] Valider visuellement, TypeScript, tests, build et publier la refonte

## Nouvelles fonctionnalités d’accueil (v97)
- [x] Auditer les composants d’accueil, les témoignages, les données de score et les options de taux de change
- [x] Construire le simulateur Canada avec calcul transparent, limites et avertissement non officiel
- [x] Ajouter le filtre de témoignages et le widget de conversion monétaire robuste
- [x] Intégrer les trois modules à l’accueil avec états de chargement, erreurs et responsive
- [x] Valider calculs, confidentialité, accessibilité, TypeScript, tests, build et publier

## Suppression de l’identité tierce du visuel héros (v98)
- [x] Auditer la source du visuel actuel et confirmer les calques d’identité à retirer
- [x] Générer un nouveau visuel de héros sans logos ni textes de marques tierces
- [x] Remplacer l’asset et vérifier contraste, parallaxe, responsive, TypeScript, tests, build et publier

## Refonte réaliste, drapeaux 107 pays et arrière-plans par service (v99)
- [x] Auditer les pages, services, fiches destination, catalogue des 107 pays et système de drapeaux existant
- [x] Produire un nouveau héros photoréaliste avec une femme et un homme distincts, sans marque tierce
- [x] Structurer les badges de drapeaux et les priorités Canada, Schengen, Chine et autres destinations
- [x] Appliquer des arrière-plans par service et par fiche destination avec fallbacks et chargement fiable
- [x] Vérifier cohérence visuelle, performance, responsive, accessibilité, TypeScript, tests, build et publier

## Filtrage des témoignages par destination (v100)
- [x] Auditer le composant des témoignages, les données de destination et le statut d’approbation
- [x] Finaliser les filtres Canada, Espace Schengen et toutes les destinations avec états bilingues
- [x] Vérifier l’affichage responsive, l’accessibilité, les données approuvées, TypeScript, les tests, le build et publier

## Recherche textuelle des témoignages (v101)
- [x] Auditer le composant de témoignages et définir les champs de recherche
- [x] Intégrer la barre de recherche avec filtrage combiné et états bilingues
- [x] Vérifier accessibilité, responsive, résultats approuvés, TypeScript, les tests, le build et publier

## Optimisation des images pour le mobile (v102)
- [x] Auditer les assets, références d’images, dimensions et points de chargement critiques
- [x] Préparer les variantes WebP/AVIF et la stratégie de chargement priorisé du héros et des pages
- [x] Intégrer lazy loading, sources responsives, préchargement critique et fallbacks fiables
- [x] Mesurer le rendu mobile, la visibilité, la performance, l’accessibilité, TypeScript, les tests, le build et publier

## Optimisation automatique des uploads admin (v103)
- [x] Auditer le flux d’upload admin, les validations existantes, le stockage et les dépendances d’image
- [x] Implémenter l’optimisation serveur des images avec redimensionnement, WebP et limites de poids
- [x] Brancher les uploads simples et en masse sur le pipeline optimisé avec métadonnées et fallback
- [x] Tester sécurité, qualité visuelle, stockage, responsive, TypeScript, suite Vitest, build et publier

## Bibliothèque de médias admin (v104)
- [x] Auditer le schéma, le stockage, les références existantes et l’écran admin des médias
- [x] Ajouter le modèle persistant et les procédures admin de bibliothèque avec protection contre la suppression utilisée
- [x] Construire l’interface de bibliothèque avec recherche, filtres, aperçu, sélection et suppression confirmée
- [x] Brancher la réutilisation dans l’éditeur destination/service et valider sécurité, responsive, TypeScript, tests, build et publication

## Boutons du héros uniformisés (v105)
- [x] Auditer les boutons actuels du héros et leurs actions
- [x] Appliquer une base visuelle et dimensionnelle commune aux boutons du héros
- [x] Vérifier clics, lisibilité, mobile, accessibilité, TypeScript, tests, build et publier

## Amélioration espace admin et affichage obligatoire photo de profil (v106)
- [x] Auditer le dashboard admin, les fiches dossier, les documents, le profil candidat et les modèles e-mail
- [x] Renforcer l’affichage candidat et avatar dans les espaces admin/client avec contrôle de propriété
- [x] Améliorer la gestion admin des dossiers avec actions rapides, documents, statuts, historique et prévisualisation
- [x] Ajouter l’avatar aux e-mails opérationnels avec accès sécurisé, fallback et respect de la confidentialité
- [x] Tester obligatoire, sécurité, responsive, accessibilité, TypeScript, tests, build et publier

## Outil de recadrage et prévisualisation d’avatar (v107)
- [x] Auditer l’étape avatar obligatoire, les validations et le flux de stockage
- [x] Construire l’interface de prévisualisation et de recadrage avec zoom et déplacement accessibles
- [x] Envoyer le portrait recadré, conserver les validations serveur et afficher le résultat dans les espaces autorisés
- [x] Vérifier qualité du rendu, confidentialité, responsive, accessibilité, TypeScript, tests, build et publier

## Gestion des statuts de documents par l’administrateur (v108)
- [x] Auditer les documents candidats, les statuts existants, les droits admin et les modèles d’e-mail
- [x] Ajouter la mutation serveur de changement de statut avec validation, note et journal d’audit
- [x] Intégrer les actions Validé, Rejeté et En attente dans la fiche admin et l’espace client
- [x] Ajouter les e-mails bilingues, tester les erreurs, les droits, le responsive, TypeScript, Vitest, build et publier

## Alerte de rejet de document côté candidat (v109)
- [x] Auditer l’affichage des statuts documents et le flux de réimport candidat
- [x] Intégrer l’alerte de rejet, le motif administrateur et le bouton d’action rapide côté candidat
- [x] Vérifier propriété, téléchargement, responsive, accessibilité, TypeScript, tests, build et publier

## Libellé Inscription et dimensions uniformes des boutons (v110)
- [x] Auditer les boutons de navigation, du héros et d’inscription ainsi que leurs variantes responsive
- [x] Remplacer le libellé par « Inscription » et appliquer une base de dimensions uniformes
- [x] Vérifier alignement, textes longs, mobile, accessibilité, TypeScript, tests, build et publier

## Phase 1 : Correction des logos d'authentification (v114)
- [x] Identifier les fichiers de pages d'authentification utilisant une URL de logo obsolète ou erronée (`Dashboard.tsx`, `ForgotPassword.tsx`, `Login.tsx`, `Register.tsx`, `ResetPassword.tsx`)
- [x] Remplacer par l’URL officielle validée du logo 3M (`/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg`)
- [x] Valider avec la suite de 121 tests unitaires et le build de production réussi

## Phase 2 : Uniformisation des champs et libellés d'inscription (v115)
- [x] Uniformiser Input, Select et Textarea avec une hauteur et un rayon cohérents
- [x] Remplacer les occurrences restantes de « Créer un compte » par « Inscription »
- [x] Vérifier que les boutons d'inscription gardent une largeur et un alignement cohérents sur desktop et mobile
- [x] Relancer les tests, le build et les captures d’aperçu

## Phase 4 : Positionnement mobile des boutons flottants (v116)
- [x] Définir un espacement mobile commun pour les boutons Chat/Aureol et WhatsApp
- [x] Respecter la zone sûre des appareils mobiles avec encoche ou barre système
- [x] Vérifier les captures 375×812 et les interactions sans superposition gênante

## Phase 5 : Liens fonctionnels du footer (v117)
- [x] Auditer tous les liens utilitaires du footer et leurs routes cibles
- [x] Remplacer les href génériques ou inactifs par des routes accessibles
- [x] Vérifier chaque lien en desktop et mobile sans page vide

## Phase 6 : Performance et découpage des bundles (v118)
- [x] Auditer les imports statiques responsables des gros chunks de production
- [x] Découper les modules lourds sans modifier les routes ni le comportement
- [x] Vérifier le build, les tailles de chunks et le rendu des pages principales

## Phase 7 : Dates et valeurs de recherche de vols (v119)
- [x] Auditer les valeurs initiales et les contraintes de dates dans Flights.tsx
- [x] Empêcher les dates passées et garantir un retour postérieur au départ
- [x] Ajouter ou vérifier les tests de validation des dates sans modifier l’API de recherche

## Phase 8 : Accessibilité et textes alternatifs (v120)
- [x] Auditer les boutons, images, labels et éléments interactifs principaux
- [x] Ajouter les attributs ARIA et textes alternatifs manquants sans modifier le design
- [x] Vérifier la navigation clavier et les captures desktop/mobile

## Phase 9 : Régression et parcours de bout en bout (v121)
- [x] Vérifier les routes publiques principales et les nouvelles pages du footer
- [x] Vérifier les parcours d’authentification et la recherche de vols avec des paramètres valides
- [x] Contrôler les logs console/réseau et l’absence de page blanche sur desktop et mobile
- [x] Confirmer que les tests et le build restent verts après la campagne

## Amélioration des retours visuels de chargement (v122)
- [x] Auditer les formulaires d'inscription et de recherche de vols
- [x] Intégrer les indicateurs de chargement animés et anti-double-soumission sur Register.tsx, SignUp.tsx et Flights.tsx
- [x] Valider la fluidité, les tests unitaires et le build de production
- [x] Publier la version optimisée avec animations de chargement

## Fiabilité des Tarifs de Vol et Module Passagers GDS (v123)
- [x] Auditer le routeur de vols et le service SearchAPI / fallback simulé
- [x] Améliorer la sélection détaillée des passagers (Adultes, Enfants 2-11 ans, Bébés < 2 ans) avec ventilations tarifaires
- [x] Enrichir les détails de vol (classes tarifaires, bagages inclus, conditions de modification, taxes et frais GDS estimés)
- [x] Ajouter un badge et une note de revalidation tarifaire en temps réel
- [x] Testé avec succès : 127 tests unitaires passants et build de production optimisé
- [x] Sauvegarder et publier la version enrichie GDS et passagers

## Panier Multi-Services Unifié : Vols, Hôtels & Véhicules (v124)
- [x] Créer le contexte et le store de panier multi-services (`client/src/contexts/MultiServiceCartContext.tsx`)
- [x] Créer la page dédiée `/panier` pour gérer, modifier et valider les prestations combinées
- [x] Ajouter les boutons « Ajouter au panier » sur les cartes de vol (`Flights.tsx`)
- [x] Créer les fiches de simulation d’hôtels et véhicules avec ajout au panier direct
- [x] Intégrer l’icône de panier avec badge dynamique dans la barre de navigation principale (`Navbar.tsx`)
- [x] Valider avec TypeScript, 127 tests, le build de production et les aperçus desktop/mobile ; publier la version

## Réservation Principale de Vols & Passeport (v125)
- [x] Créer la page de réservation et de saisie des passeports passagers (`client/src/pages/FlightBookingCheckout.tsx`)
- [x] Ajouter les options de contact direct par les 3 canaux (WhatsApp, e-mail direct, appel téléphonique) sur la page de vol et de confirmation
- [x] Relier les cartes de vols au nouveau flux de réservation en ligne
- [x] Maintenir les hôtels et véhicules en tant que services auxiliaires optionnels dans le panier
- [x] Validé avec TypeScript, 127 tests unitaires réussis et build de production optimisé

## Modale de Confirmation de Réservation de Vol (v126)
- [x] Intégrer la fenêtre modale de récapitulatif dans `FlightBookingCheckout.tsx`
- [x] Afficher les détails complets du passager, du numéro de passeport, des dates et des options de contact
- [x] Permettre au client de confirmer la réservation ou de revenir modifier ses informations
- [x] Validé avec TypeScript, 127 tests unitaires réussis et build de production optimisé

## Barre de Progression du Tunnel de Vol (v127)
- [x] Créer le composant de jauge d’étapes dans `FlightBookingCheckout.tsx`
- [x] Diviser le parcours en 4 étapes claires : Sélection, Passeport, Confirmation Finale, Réservation confirmée
- [x] Validé avec TypeScript, 127 tests unitaires, build de production et captures desktop/mobile

## Téléchargement PDF du Billet Électronique (v128)
- [x] Créer le générateur de PDF client pour la confirmation de vol dans `FlightBookingCheckout.tsx`
- [x] Ajouter le bouton « Télécharger mon billet (PDF) » sur la vue de confirmation finale
- [x] Validé avec TypeScript, 127 tests unitaires réussis et build de production optimisé

## Intégration Apple Wallet & Google Wallet (v129)
- [x] Créer le composant de bouton d’enregistrement portefeuille avec détection d’appareil et modal de repli sécurisé dans `FlightBookingCheckout.tsx`
- [x] Configurer la vérification des clés de signature de pass et le repli automatique vers le téléchargement PDF et l’e-mail de confirmation
- [x] Validé avec TypeScript, 127 tests unitaires réussis et build de production optimisé

## Partage, Calendrier et Optimisation Mobile (v130)
- [x] Ajouter les boutons de partage direct (WhatsApp, Telegram, SMS) dans `FlightBookingCheckout.tsx`
- [x] Intégrer les options d’export de vol vers Google Agenda (lien URL) et Apple Calendar (fichier `.ics`)
- [x] Réorganiser la disposition mobile des boutons Wallet, PDF et actions pour une ergonomie parfaite sans défilement excessif
- [x] Validé avec TypeScript, 127 tests unitaires réussis et build de production optimisé

## Envoi à un proche, Suggestions Auxiliaires et Copie de Lien (v131)
- [x] Ajouter un champ de saisie pour envoyer le récapitulatif par e-mail à un tiers sur la page de confirmation
- [x] Créer une section dynamique de suggestions d'hôtels et de véhicules adaptée à la destination
- [x] Ajouter un bouton « Copier le lien » avec toast de confirmation visuelle
- [x] Validé avec TypeScript, 127 tests unitaires, build de production et capture mobile

## Dates de Séjour, Validation E-mail et Filtres Rapides (v132)
- [x] Ajouter les sélecteurs de dates de séjour (Check-in / Check-out) pour les suggestions d'hôtels
- [x] Mettre en place une validation en temps réel de l'e-mail du proche avec badge de confirmation visuelle
- [x] Intégrer des filtres rapides par gamme de prix et note pour affiner les suggestions dynamiques
- [x] Validé avec TypeScript, 127 tests unitaires réussis, build de production et publication

## Correctif Anti-Page-Blanche et Récupération de Chunk (v133)
- [x] Extraire et inspecter l'archive `fix-page-blanche-chunk.zip` pour identifier les 2 fichiers exacts
- [x] Remplacer les 2 fichiers aux chemins requis sans altérer le reste de l'application
- [x] Intégrer le gestionnaire de rechargement automatique en cas d’échec de chargement de chunk différé
- [x] Validé avec TypeScript, 127 tests unitaires réussis, build de production et publication

## Notification de Rechargement et Écran de Secours (v134)
- [x] Ajouter un toast temporaire informant l'utilisateur du rechargement automatique suite à une mise à jour
- [x] Créer une interface de secours conviviale dans ErrorBoundary avec bouton de rafraîchissement manuel
- [x] Implémenter un endpoint ou signal léger de télémétrie des erreurs de chunk vers le backend
- [x] Validé avec TypeScript, 127 tests unitaires réussis, build de production et publication

## Résilience Avancée, Support, Mode Hors-Ligne et Préchargement (v135)
- [x] Ajouter un bouton de contact support direct (WhatsApp / Téléphone) dans l'écran de secours d'ErrorBoundary
- [x] Implémenter un mécanisme de réessai automatique (retry) avec backoff exponentiel pour l'envoi de la télémétrie des chunks
- [x] Enrichir le toast de rechargement avec une barre de progression visuelle du compte à rebours
- [x] Créer un tableau de bord administrateur pour consulter les incidents de chargement de chunks et les stats réseau
- [x] Intégrer un mode hors-ligne de secours avec bannière d'alerte et accès aux pages en cache
- [x] Intégrer un mode hors-ligne de secours avec bannière d'alerte et accès aux pages en cache
- [x] Validé avec TypeScript, 127 tests unitaires réussis, build de production et publication

- [x] Phase 3 : repositionner les boutons flottants WhatsApp et chat sur mobile sans recouvrir les CTA ni les contrôles de formulaire
- [x] Phase 3 : vérifier et rendre fonctionnels les liens du footer (Mentions légales, Plan du site, Accessibilité)
- [x] Phase 4 : réduire les bundles lourds sur mobile et valider l’accessibilité clavier/ARIA
- [x] Phase 4 : exécuter les tests de régression, vérifier le build et contrôler l’aperçu desktop/mobile

- [x] Afficher une progression visuelle pendant le chargement différé et la génération de l’export PDF
- [x] Afficher un toast de confirmation après la réussite du téléchargement PDF et couvrir le parcours par un test

- [x] Tester le parcours de réservation de vols : recherche, sélection et ouverture du checkout
- [x] Vérifier les catégories de passagers, les champs passeport, la validation et le récapitulatif
- [x] Vérifier la confirmation, les contacts agence, les exports et les états d’erreur desktop/mobile
- [x] Corriger les anomalies découvertes, ajouter les tests nécessaires et valider le build

- [x] Intégrer `client/src/lib/lazyWithTimeout.ts` et remplacer `client/src/App.tsx` avec le délai maximal de 15 secondes pour les pages différées
- [x] Vérifier que la récupération automatique des erreurs de chunk se déclenche après expiration sans rester sur l’écran de chargement
- [x] Exécuter TypeScript, les tests, le build et les contrôles desktop/mobile avant publication

- [x] Afficher un compte à rebours visuel pendant les 15 secondes du chargement différé
- [x] Ajouter un bouton de réessai manuel sur l’écran d’erreur après expiration du délai
- [x] Afficher un toast réseau lors d’un rechargement automatique déclenché par un problème de chunk

- [x] Diagnostiquer le blocage persistant sur « Chargement de la page… » et identifier l’erreur de montage ou de chunk
- [x] Corriger le mécanisme pour afficher la page ou déclencher une récupération explicite sans attente indéfinie
- [x] Revalider les routes publiques sur desktop/mobile, les logs console et le build avant publication

- [x] Vérifier la date et le contenu du dernier déploiement réellement servis par les domaines publics
- [x] Forcer une nouvelle publication du correctif de chargement et invalider le cache si nécessaire
- [x] Recontrôler le bundle, le loader et les en-têtes du domaine public après publication

- [x] Inspecter et intégrer le `client/index.html` fourni dans l’archive de correction
- [x] Vérifier le filet de sécurité JavaScript autonome avec délai maximal de 15 secondes
- [x] Valider TypeScript, tests, build et affichage des routes avant publication

- [x] Identifier pourquoi l’écran de chargement reste identique après la publication 32def9b5
- [x] Reproduire le blocage sur le domaine réellement utilisé et corriger sa cause effective
- [x] Revalider le bootstrap, le timeout de 15 secondes et le démarrage des routes publiques

- [x] Corriger le cycle d’import production entre `react-vendor` et `radix-vendor` qui provoque `forwardRef` undefined
- [x] Rebuild et tester le bundle principal après regroupement sûr des dépendances UI

- [x] Forcer une nouvelle publication observable du build `react-ui-vendor` et vérifier que le domaine ne sert plus `index-6IE05yMO.js`

- [x] Supprimer le manual chunk React UI responsable de `Cannot set properties of undefined (setting 'Activity')` avec React 19
- [x] Vérifier en production que l’évaluation du bundle principal réussit et que l’accueil s’affiche réellement

- [x] Publier un marker unique du build sans manual chunk et confirmer que le domaine sert le nouveau bundle `index-DJkXq_JR.js` (le marker HTML précédent reste temporairement servi par le CDN)

- [x] Rédiger les recommandations d’amélioration pour le système de réservation de vols en ligne

- [x] Ajouter un scan optique de passeport avec préremplissage contrôlé des informations passagers
- [x] Créer un tableau de bord agent pour suivre et gérer les dossiers de vols en attente
- [x] Couvrir le scan, les permissions agent, les statuts de dossier et le parcours mobile par des tests

- [x] Ajouter un lien direct depuis le nom du client connecté vers son espace personnel
- [x] Ajouter un lien de retour depuis l’espace client vers le site et la réservation de vols
- [x] Vérifier que dossiers, documents, favoris, demandes de vols et profil restent accessibles dans l’espace client

- [x] Créer une page dédiée pour afficher et gérer les vols favoris du client
- [x] Afficher le numéro de dossier actif dans l’en-tête de l’espace client
- [x] Ajouter des filtres par statut et par date dans le suivi des demandes de vols

- [x] Ajouter la gestion des priorités et l’export CSV dans l’espace agent des demandes de vols
- [x] Mettre en place les notifications automatiques par e-mail et WhatsApp lors des changements de statut de vol — reportée à la demande de l’utilisateur, en attente des identifiants Meta

- [x] Conserver les mêmes tâches pour tous les Administrateurs et ajouter un rôle Super administrateur pour les opérations sensibles
- [x] Vérifier les gardes serveur, la traçabilité individuelle et les permissions des comptes administrateurs

- [x] Promouvoir `aureoldonfack@gmail.com` en Super administrateur après ajout de la permission côté serveur

- [x] Créer le service de notification Resend + Meta Cloud API avec repli sécurisé — reporté, aucun secret Meta fictif n’a été créé
- [x] Brancher l’envoi sur les changements de statut des demandes de vol — reporté avec la configuration Meta
- [x] Obtenir les vrais identifiants Meta Cloud API avant d’activer l’envoi WhatsApp en production — en attente de fourniture

- [x] Créer un tableau de bord global réservé au Super administrateur avec statistiques réelles
- [x] Ajouter ou renforcer les badges colorés pour les niveaux de priorité dans la file agent

- [x] Mettre à jour le test des routes différées pour compter la nouvelle page Super administrateur

- [x] Remplacer les quatre fichiers fournis de l’espace client aux mêmes chemins
- [x] Afficher la vraie photo de profil du client dans `/mon-espace`
- [x] Synchroniser une timeline réelle à cinq étapes avec le statut administrateur

- [x] Corriger le contrat de test de l’espace client après le marqueur EOF parasite

- [x] Ajouter un badge et une notification visuelle lorsqu’une nouvelle étape de dossier est détectée
- [x] Mémoriser l’étape déjà consultée pour éviter de répéter l’alerte

- [x] Créer un centre documentaire centralisé et synchronisé par dossier pour l’agence et le candidat
- [x] Permettre à l’administrateur de téléverser et scanner les pièces fournies en agence
- [x] Rendre tous les documents visibles, téléchargeables et vérifiables dans l’espace candidat et le back-office

- [x] Conserver la référence privée de chaque document et ne délivrer les liens signés qu’après contrôle de propriété

- [x] Remplacer le faux dépôt de documents candidat par l’upload réel vers le stockage privé
- [x] Synchroniser les dépôts candidats avec le centre documentaire et supprimer l’identifiant candidat fourni par le navigateur

- [x] Permettre aux clients situés à distance de téléverser directement leurs pièces justificatives depuis leur espace candidat
- [x] Synchroniser instantanément ces dépôts distants pour qu’ils soient téléchargeables et visualisables par l’administrateur
- [x] Ajouter une checklist dynamique des pièces requises selon la destination (Canada, Schengen, etc.)
- [x] Générer automatiquement une décharge PDF de remise des documents pour chaque dossier
- [x] Notifier l’administrateur et le candidat lors d’un nouveau dépôt distant

- [x] Ajouter les champs d’annotation et de correction aux documents d’agence dans la base de données
- [x] Permettre à l’administrateur d’ajouter des annotations précises lors du rejet d’un document
- [x] Afficher clairement les corrections demandées et l’alerte de refus dans l’espace candidat
- [x] Permettre au candidat de remplacer ou de soumettre à nouveau un document annoté

- [x] Réunifier les espaces sous « Espace client » unique et rediriger l’ancien /dashboard vers /mon-espace
- [x] Synchroniser la messagerie candidat-admin pour que les messages soient immédiatement consultables et traités dans le back-office
- [x] Permettre à l’administrateur de modifier les informations candidat et déclencher une notification dans l’espace client
- [x] Permettre aux anciens clients d’accéder directement à leur dossier agence préexistant à l’aide de leur numéro de dossier
- [x] Vérifier tous les boutons, liens et soumissions de l’espace client sur desktop et mobile

## Phase 2 — Espace client unifié
- [x] Définir `/mon-espace` comme entrée canonique et rediriger les anciens espaces clients sans casser les liens existants
- [x] Fusionner dans l’espace canonique le suivi réel du dossier, les documents candidat/agence, l’avatar et l’historique des évaluations
- [x] Intégrer une messagerie bidirectionnelle candidate ↔ administrateur dans l’espace client canonique avec compteur de messages non lus
- [x] Synchroniser le statut réel du dossier et les notifications de changement avec l’espace client
- [x] Ajouter un accès sécurisé aux dossiers historiques par numéro de dossier, sans permettre l’accès aux dossiers d’un autre candidat
- [x] Ajouter dans le back-office les contrôles de consultation, réponse et synchronisation associés aux dossiers clients
- [x] Vérifier les boutons, soumissions, redirections et responsive desktop/mobile de l’espace unifié
- [x] Écrire et exécuter les tests Vitest de contrat pour les routes et la synchronisation de l’espace client

## Extraction automatique des informations clés des documents (v120)
- [x] Étendre le schéma de stockage ou la table des documents pour stocker les métadonnées extraites (JSON)
- [x] Créer le service d’analyse automatique des documents téléversés (passeport, diplômes, contrats, pièces d’identité)
- [x] Exposer une procédure tRPC d’extraction et de consultation des données structurées extraites
- [x] Afficher les informations clés extraites dans le centre documentaire de l’espace candidat et du back-office administrateur
- [x] Écrire les tests unitaires et de contrat associés, valider le build et publier la version

## Filtrage et tri des documents par métadonnées extraites (v121)
- [x] Ajouter les options de filtrage par type détecté et statut d’expiration dans le centre documentaire
- [x] Permettre le tri dynamique des pièces (par date de dépôt, par score d’authenticité, par ordre alphabétique)
- [x] Mettre à jour l’interface dans l’espace candidat et dans le back-office administrateur
- [x] Valider l’ergonomie responsive et le bon fonctionnement des filtres

## Prévisualisation rapide des documents (v122)
- [x] Créer le composant modal de prévisualisation (pour PDF, images et textes)
- [x] Intégrer le bouton d’aperçu rapide dans le centre documentaire de l’espace candidat (`AgencyDocumentsPanel.tsx`)
- [x] Intégrer le bouton d’aperçu rapide dans le gestionnaire documentaire administrateur (`AdminDocumentsManagement.tsx`)
- [x] Valider la sécurité des liens signés et le rendu responsive

## Tableau de bord client unifié complet (v123)
- [x] Créer une agrégation serveur tRPC complète pour regrouper profil, vols réservés, dossiers, documents, démarches, messages et notifications
- [x] Refondre `/mon-espace` en un tableau de bord modulaire hautement professionnel avec barre de progression de complétion du profil, widgets par activité et actualisation asynchrone
- [x] Vérifier la synchronisation bidirectionnelle complète avec le back-office administrateur
- [x] Valider les tests, le build et le rendu responsive

## Opérationnalisation complète et synchronisation GDS (v124)
- [x] Ajouter les champs de référence de réservation GDS et de numéros de dossier administrables dans le schéma Drizzle et appliquer la migration SQL
- [x] Étendre le routeur administrateur pour permettre l’attribution directe des numéros de dossier et des PNR/références GDS aux candidats
- [x] Permettre au client d’ouvrir son dossier et de consulter ses références de réservation et numéros de vol GDS dans `/mon-espace`
- [x] Ajouter les tests de contrat, valider le build et publier la version opérationnelle

## Traçabilité et cache des tarifs de vol (v125)
- [x] Ajouter les indicateurs de source de tarif (tarif GDS libre / estimation / source gratuite en ligne) sur les cartes de vol
- [x] Enrichir le stockage des favoris et réservations de vol pour inclure la source, l’horodatage et le statut de confirmation
- [x] Permettre à l’administrateur de voir la provenance du tarif d’un vol favori client dans le back-office
- [x] Valider les tests et publier la mise à jour
