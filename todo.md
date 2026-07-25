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
- [ ] Créer la procédure `createTranslationRequest` (sans paiement)
- [ ] Créer la procédure `getTranslationPricing` pour tarification dynamique
- [ ] Créer la procédure `getTranslationRequests` pour lister les demandes
- [ ] Créer la procédure `validateTranslationPayment` (déclenche notification admin)
- [ ] Créer la procédure `uploadTranslatedDocument` (traducteur)
- [ ] Créer la procédure `downloadTranslatedDocument` (client)
- [ ] Créer la procédure `getTranslationStatus` pour suivre l'état de la traduction

### Phase 3 : Dashboard Traducteur
- [ ] Créer la page `/translator/dashboard` avec liste des traductions "À Traduire"
- [ ] Ajouter la section "En Cours" et "Completées"
- [ ] Ajouter le formulaire d'upload du document traduit
- [ ] Ajouter les filtres par langue, type de document, date

### Phase 4 : Tunnel de Commande Client
- [ ] Créer la page `/translation/order` avec sélection du type de document
- [ ] Ajouter le sélecteur de langues source/cible
- [ ] Ajouter l'upload des documents (PDF/JPG, max 5 Mo)
- [ ] Afficher le tarif calculé en temps réel
- [ ] Ajouter le bouton "Procéder au Paiement"

### Phase 5 : Paiement Obligatoire
- [ ] Intégrer CinetPay pour le paiement (Mobile Money/Carte)
- [ ] Créer le callback de validation du paiement
- [ ] Déclencher la notification admin uniquement après paiement validé
- [ ] Générer la facture PDF après paiement
- [ ] Envoyer confirmation par email/WhatsApp

### Phase 6 : Téléchargement Sécurisé
- [ ] Créer les URLs de téléchargement sécurisées (token temporaire)
- [ ] Ajouter la section "Mes Traductions" dans l'Espace Client
- [ ] Afficher le statut de chaque traduction
- [ ] Permettre le téléchargement après complétion
- [ ] Ajouter les logs de téléchargement

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

## Modules de Réassurance et Suivi Dynamique (v14)

### 1. Barre de Progression de Dossier
- [ ] Créer la table `dossier_progress` pour tracker les étapes
- [ ] Implémenter la procédure tRPC `getDossierProgress`
- [ ] Créer le composant ProgressBar avec 5 étapes
- [ ] Ajouter les timestamps et les statuts
- [ ] Afficher la barre dans l'Espace Client

### 2. Système de Callback 15 min
- [ ] Créer la table `callback_requests` pour les demandes
- [ ] Implémenter la procédure tRPC `requestCallback`
- [ ] Créer le bouton "Demander un rappel" dans l'Espace Client
- [ ] Envoyer notification admin + SMS/WhatsApp
- [ ] Ajouter le formulaire de rappel avec horaires disponibles

### 3. Galerie de Visas Accordés
- [ ] Créer la table `approved_visas` pour les visas accordés
- [ ] Implémenter les procédures tRPC pour ajouter/modifier/supprimer
- [ ] Créer le dashboard admin pour gérer les visas
- [ ] Créer la galerie publique sur le site (anonymisée)
- [ ] Ajouter les filtres par pays et date

### 4. Calculateur de Budget
- [ ] Créer la table `country_costs` avec les frais par pays
- [ ] Implémenter la procédure tRPC `calculateBudget`
- [ ] Créer le formulaire du calculateur (pays, type visa, etc.)
- [ ] Afficher le détail des frais (droits, garanties, visa)
- [ ] Ajouter les graphiques de répartition des coûts
