# 3M Travel & Services — Roadmap

## Exportation iCal des Réservations (v253)
- [x] Ajouter la procédure tRPC `exportCalendarIcal` dans `server/routers/tourism.ts` pour générer un flux .ics sécurisé
- [x] Intégrer le bouton d’export iCal dans le composant `AdminCalendarView.tsx` avec téléchargement instantané du fichier
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Déclaration d’évaluation préalable à l’inscription
- [x] Analyser les champs d’inscription, les étapes d’évaluation et la fiche administrative existante.
- [x] Enregistrer de façon traçable l’indication « évaluation déjà effectuée » lors de la création de compte.
- [x] Marquer l’étape client comme évaluation reçue lorsque le candidat répond oui, sinon conserver « évaluation en cours ».
- [x] Afficher et traiter cette information dans le back-office sans validation automatique d’un résultat non vérifié.
- [x] Ajouter un test d’intégration du routeur d’inscription pour les réponses oui/non et la persistance attendue.
- [x] Ajouter un test tRPC réel de `listCandidates` pour le compte pré-dossier et son statut déclaré.
- [x] Ajouter un test tRPC réel de `getCandidateDetails` et de la fiche administrative pré-dossier.
- [x] Ajouter un test client de la timeline pour les états déclaré et en cours.
- [x] Rejouer les contrôles intégrés et les régressions avant publication.

## Sous-page de service 3M Digital
- [x] Remplacer l’orientation « communauté » par une sous-page de service 3M Digital fidèle à la référence fournie.
- [x] Centraliser les coordonnées 3M Digital/Yaoundé dans une source partagée réutilisée par la sous-page et le pied de page.
- [x] Ajouter une interface administrateur pour consulter et modifier les pôles et contenus publiés de la sous-page 3M Digital.
- [x] Ajouter un test d’intégration du flux création de demande → liste admin → mise à jour humaine de statut et de note.
- [x] Redémarrer et vérifier la disponibilité du routeur 3M Digital dans le serveur de développement.
- [x] Vérifier visuellement l’écran `/admin/digital-services` et l’éditeur de contenu après les derniers changements.
- [x] Vérifier visuellement la file de demandes et les actions de statut/notes de `/admin/digital-services`.
- [x] Effectuer sur le site publié un vrai test navigateur complet : soumettre une demande publique interne → la retrouver dans la file admin → enregistrer statut et note → vérifier la trace SQL associée.
- [x] Ajouter un scénario automatisé complet couvrant l’UI publique, la création de demande, la file admin et le traitement final.

## Persistance réelle des demandes 3M Digital
- [x] Vérifier la présence de demandes 3M Digital dans le registre publié et le lien formulaire → route serveur.
- [x] Corriger tout écart de persistance ou de filtrage entre la soumission publique et la file administrateur.
- [x] Valider une demande réelle créée par l’utilisateur jusqu’à sa visibilité dans la file administrateur.

## Session administrateur de traitement 3M Digital
- [x] Diagnostiquer la restauration du jeton de session dans l’écran `/admin/digital-services` publié.
- [x] Corriger le renouvellement ou l’erreur explicite lorsque la session administrateur est invalide.
- [x] Vérifier le traitement sécurisé d’une demande 3M Digital avec statut et note interne après correction.

## Schéma de suivi 3M Digital en production
- [x] Vérifier les colonnes de suivi réellement présentes dans le registre publié des demandes 3M Digital.
- [x] Confirmer que les colonnes de statut, note, conseiller et horodatage sont déjà présentes sans migration destructive.
- [x] Confirmer la persistance du statut et de la note sur la demande interne de vérification.

## Sauvegarde groupée de traitement 3M Digital
- [x] Diagnostiquer pourquoi la sélection de statut et la note interne ne sont pas envoyées ensemble.
- [x] Corriger l’action d’enregistrement pour soumettre le statut et la note choisis dans une même mutation.
- [x] Ajouter une intégration avec dépôt persistant qui relit statut, note, conseiller et horodatage après mise à jour.
- [x] Exécuter une vérification SQL post-correctif sur la demande interne 3M Digital après traitement administrateur.

## Actions directes de traitement administrateur
- [x] Auditer l’écran 3M Digital afin d’identifier pourquoi les contrôles de traitement ne sont pas accessibles sur une demande ouverte.
- [x] Rendre visible et utilisable, dans chaque demande 3M Digital ouverte, une action unique de statut et de note interne avec retour de succès ou d’erreur.
- [x] Auditer les fiches des nouveaux candidats pré-dossier afin d’identifier les contrôles de statut manquants ou masqués.
- [x] Ajouter des actions directes, sécurisées et traçables pour modifier le statut et activer ou faire progresser un dossier candidat depuis sa fiche administrative.
- [x] Ajouter des tests d’interface et d’autorisation couvrant les actions 3M Digital et les fiches candidat.
- [x] Ajouter un test DOM de la fiche pré-dossier couvrant la saisie, la confirmation et l’appel d’activation.
- [x] Vérifier le rejet lorsque ni cookie administrateur valide ni jeton de session valide ne sont disponibles.
- [x] Vérifier dans le navigateur administrateur que les actions sont accessibles, puis publier la correction.

## Grille tarifaire 3M Digital depuis ITINERAIRES PRO
- [x] Extraire les offres, prestations, prix et explications utiles du document de référence.
- [x] Adapter les niveaux de service à 3M Digital sans présenter les tarifs de référence comme des prix 3M confirmés.
- [x] Intégrer une grille tarifaire éditable dans la sous-page et le back-office 3M Digital.
- [x] Vérifier les contenus tarifaires, les demandes associées et les régressions avant publication.
- [x] Diagnostiquer et corriger l’absence de la grille tarifaire dans la version publique de `/3m-digital`.
- [x] Vérifier la grille tarifaire publique après publication et cache renouvelé.

## Restauration des contrats historiques après récupération
- [x] Cartographier les échecs de suite complète et identifier les fichiers de sauvegarde compatibles.
- [x] Restaurer les exports, routeurs et composants historiques manquants sans écraser la grille 3M Digital.
- [x] Réconcilier les contrats de session, d’administration et de tourisme avec les usages clients existants.
- [x] Rejouer TypeScript et la suite de régression complète jusqu’à suppression des échecs.

## Stabilisation du serveur après restauration
- [x] Corriger les imports et exports SMTP qui empêchent le démarrage du routeur de supervision.
- [x] Exercer la procédure de supervision SMTP après redémarrage et confirmer l’absence d’erreur d’import ou d’export dans les nouveaux journaux.

## Sauvegarde alternative avant publication
- [x] Diagnostiquer une méthode de sauvegarde non destructive malgré le conflit de synchronisation.
- [x] Préserver une copie vérifiable des changements locaux validés.
- [x] Synchroniser la version avec la branche principale sans écraser les changements existants.

## Mise en ligne du service 3M Digital
- [x] Diagnostiquer l’écart entre les routes locales 3M Digital et la version publique.
- [x] Préserver une version vérifiable des nouvelles routes avant synchronisation.
- [x] Vérifier le déploiement effectif de `/3m-digital` et corriger la publication tant que la route affiche 404.
- [x] Vérifier l’accès protégé de `/admin/digital-services` sur le domaine déployé après propagation du cache.
- [x] Renouveler le cache PWA afin de diffuser les nouvelles routes publiées.
- [x] Rejouer une vérification navigateur des deux routes déployées et consigner la preuve avant de clore la mise en ligne.

## Système Centralisé de Réservation Multi-Services & PNR / Référence Fournisseur (v254)
- [x] Étendre le schéma Drizzle et les types pour stocker le PNR / référence fournisseur, la catégorie de service et la quittance PDF de réservation
- [x] Créer les procédures d’administration pour enregistrer le PNR GDS / référence, joindre un justificatif PDF et notifier le client
- [x] Intégrer l’affichage des réservations multi-services, des statuts et des PNR originaux dans l’espace client et le back-office
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Tableau Récapitulatif des Paiements de Réservation (v256)
- [x] Ajouter la procédure tRPC `listReservationPayments` pour extraire tous les règlements (Agence, Orange Money) et ID de transaction
- [x] Créer le composant `AdminReservationPayments.tsx` avec recherche par ID de transaction / référence, filtres par mode et statut, et validation rapide
- [x] Intégrer le tableau des paiements en tant qu'onglet ou section dédiée dans le tableau de bord administrateur (`AdminDashboard.tsx`)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Envoi de Reçu de Paiement par E-mail depuis le Tableau Admin (v257)
- [x] Ajouter la procédure tRPC `sendPaymentReceiptEmail` pour envoyer le reçu de paiement et la quittance au client
- [x] Ajouter le bouton « Envoyer le reçu » dans le tableau admin `AdminReservationPayments.tsx` avec modale de confirmation
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Téléchargement de Reçu de Paiement PDF dans l’Espace Client (v258)
- [x] Ajouter une procédure tRPC pour générer ou récupérer le reçu de paiement PDF sécurisé d’une réservation client
- [x] Intégrer le bouton de téléchargement du reçu dans la liste des réservations de l’espace personnel du candidat
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Téléversement Admin du Document PNR et Alerte Visuelle Client (v259)
- [x] Ajouter une procédure tRPC d'administration pour téléverser et associer un document PDF PNR final à une réservation
- [x] Intégrer l'affichage du document PNR et un badge d'alerte visuelle de nouveau document dans l'espace personnel du client
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Prévisualisation Admin du Document PNR avant Envoi (v260)
- [x] Ajouter une modale de prévisualisation PDF intégrée pour l'administrateur avant de valider le téléversement du PNR final
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Synchronisation E-mail et Espace Client pour le Document PNR Final (v261)
- [x] Étendre la mutation d'administration pour envoyer automatiquement un e-mail au client avec le lien de téléchargement du PNR et les détails de référence dès le stockage réussi
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Indicateur Admin de Consultation et Téléchargement PNR par le Client (v262)
- [x] Étendre le schéma Drizzle et la table des réservations pour suivre l'état de consultation du PNR (`pnrViewedAt`)
- [x] Ajouter une procédure tRPC client pour enregistrer la consultation du PNR lors du clic ou du téléchargement
- [x] Afficher l'indicateur visuel et l'horodatage de lecture dans le tableau administrateur des paiements et réservations
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Audit et Rapport Complet de Synchronisation Client-Administrateur-E-mail (v263)
- [x] Exécuter la suite complète de tests unitaires et de contrats tRPC pour vérifier l'ensemble des flux
- [x] Éditer et enregistrer le rapport d'audit complet (`audit_synchronisation_3m.md`)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Relance Client, Audit PNR Exportable et Filtre Financier par Dates (v264)
- [x] Ajouter la relance client en un clic pour les PNR non consultés ou les paiements en attente avec notification e-mail
- [x] Créer la procédure d'exportation CSV du journal d'audit PNR pour l'administration
- [x] Intégrer le filtre par plage de dates dans le tableau des paiements de l'espace administrateur
- [x] Initialiser et formaliser la compétence réutilisable `prime-travel-case-management` avec `skill-creator`
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale et la compétence

## Boutons Spécifiques par Document et Vérification Admin (v265)
- [x] Transformer chaque élément de la checklist documentaire en un bouton d'action dédié (Passeport, Photo, Acte de naissance, Domicile, Ressources)
- [x] Assurer la transmission et la persistance immédiate de chaque type de document vers l'espace administrateur
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Intégration de la Page Facebook Officielle (v266)
- [x] Ajouter le lien officiel https://www.facebook.com/3mtravelcm dans le pied de page social du site
- [x] Vérifier l’accessibilité, l’ouverture dans un nouvel onglet et l’affichage responsive
- [x] Tester et publier la mise à jour

Votre page Facebook officielle à intégrer : https://www.facebook.com/3mtravelcm

Ce lien doit être utilisé dans la navigation, le pied de page ou les zones de contact sociales sans créer de faux contenu ni de témoignages.

## Enrichissement Réseau Social & QR Code Officiel (v267)
- [x] Ajouter des boutons d’appel à l’action Facebook bien visibles sur la page d’accueil et dans la section Contact
- [x] Créer un composant de flux de publications Facebook récentes de 3M Travel & Services sur la page d’accueil
- [x] Générer un QR code officiel pointant vers https://www.facebook.com/3mtravelcm et l'intégrer au pied de page et aux quittances/reçus PDF
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Parcours e-Visa Intelligent & Assisté par IA (v268)
- [x] Créer une page dédiée de lancement e-Visa par pays (`/evisa/lancer/:countryCode`) avec formulaire spécifique et checklist documentaire ciblée
- [x] Intégrer une assistance IA prudente pour analyser l'éligibilité et guider le candidat sur les pièces requises
- [x] Synchroniser les soumissions e-Visa avec le back-office et l'espace client (référence unique, pièces jointes, suivi de dossier)
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Suivi e-Visa en Direct dans l’Espace Client (v269)
- [x] Ajouter une section de suivi e-Visa dans l’espace personnel du candidat avec statut, étapes de progression et pièces jointes
- [x] Exposer les requêtes de suivi e-Visa synchronisées avec le back-office administrateur
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Barre de Progression Visuelle e-Visa (v270)
- [x] Intégrer une frise de progression à 3 étapes sur chaque carte e-Visa de l'espace client (Soumission ➔ Vérification pièces ➔ Traitement consulaire & Décision)
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Remise Automatique du e-Visa Final (v271)
- [x] Étendre le modèle de données et l'administration e-Visa pour téléverser et valider le document e-Visa final approuvé
- [x] Automatiser l'envoi simultané par e-mail au client et l'affichage avec bouton de téléchargement dans son espace personnel
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Envoi WhatsApp e-Visa Admin (v272)
- [x] Intégrer un bouton WhatsApp avec message prérempli et lien du document e-Visa final dans la gestion admin
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Envoi Automatique e-Mail PDF e-Visa (v273)
- [x] Configurer l'envoi automatique du PDF e-Visa par e-mail au client avec pièce jointe dès le téléversement admin
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Formulaires Intelligents Multi-Services, Liens Consulaires & IA Avancée (v274)
- [x] Étendre le système de formulaires dynamiques pour s'adapter à chaque service (e-Visa, Visa travail, Études, Tourisme, Vol, Hôtel)
- [x] Intégrer un répertoire admin des liens consulaires officiels par pays avec raccourcis de soumission
- [x] Documenter et configurer le support des modèles IA spécialisés (Claude / Perplexity / Forge LLM) pour l'assistance aux dossiers
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Assistant IA Aureol & Onglet Admin Consulats (v275)
- [x] Intégrer l'assistant conversationnel IA Aureol dans l'espace client pour répondre aux questions sur les procédures
- [x] Créer l'onglet administrateur « Consulats & Liens Officiels » avec recherche et accès rapide aux portails consulaires
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Correction Destination e-Visa Non Trouvée (v276)
- [x] Corriger la normalisation et la recherche des pays dans le registre e-Visa et le routeur tRPC
- [x] Assurer le repli automatique et le préremplissage robuste du formulaire même si le code pays diffère
- [x] Valider avec les tests et TypeScript puis publier la version corrigée

## Sauvegarde Brouillon, Exigences Consulaires et Prix Dynamique e-Visa (v277)
- [x] Ajouter la persistance des brouillons de demande e-Visa (enregistrement local ou base de données) avec bouton « Reprendre mon brouillon »
- [x] Intégrer un encadré dynamique dans l'en-tête du formulaire affichant les exigences consulaires, les délais et les documents requis pour le pays choisi
- [x] Calculer et afficher un indicateur de prix estimatif dynamique selon la nationalité sélectionnée par le candidat
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Synchronisation Brouillons Cloud, Sélecteur Devises et Récapitulatif PDF e-Visa (v278)
- [x] Ajouter une table ou table de stockage persistante et une procédure tRPC pour synchroniser les brouillons e-Visa dans le compte client
- [x] Intégrer un sélecteur de devises (XAF, EUR, USD) avec taux indicatifs automatiques sur le formulaire e-Visa
- [x] Générer un récapitulatif PDF téléchargeable (facture proforma / récapitulatif de demande) avant la validation finale
- [x] Mettre à jour la compétence réutilisable `prime-travel-case-management` avec `skill-creator`
- [x] Valider avec les tests et TypeScript puis publier la version finale

## Gestion Admin des Taux de Change, Assistant Passeport et Compétence Réutilisable (v279)
- [x] Créer la gestion administrateur des taux de change (XAF, EUR, USD) avec persistance et historique dans le tableau de bord
- [x] Intégrer un widget d'assistance en direct contextuel lors de la saisie des informations de passeport (exigences, validité, conseils)
- [x] Mettre à jour la compétence réutilisable `prime-travel-case-management` avec les derniers flux intelligents et le générateur `/skill-creator`
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

## Correction analyse passeport e‑Visa
- [x] Corriger l’erreur interne déclenchée après sélection/téléchargement du passeport dans le parcours e‑Visa.
- [x] Ajouter un test de non-régression pour l’analyse du passeport avec fichier PDF et image.
- [x] Vérifier le parcours e‑Visa dans le navigateur et publier la correction validée.

## Vérification manuelle des données passeport
- [x] Afficher les données extraites du passeport dans un formulaire éditable avant la validation e‑Visa.
- [x] Valider les champs obligatoires et conserver les corrections manuelles dans le formulaire.
- [x] Tester le parcours de correction sur ordinateur et mobile puis publier.

## Persistance complète des corrections passeport
- [x] Reporter tous les champs corrigés (numéro, émission, expiration, genre et lieu de naissance) dans l’étape de confirmation finale.
- [x] Vérifier la suite du parcours sur desktop et mobile après correction manuelle.
- [x] Couvrir le parcours upload → extraction → édition → confirmation par un test navigateur automatisé responsive.

## Aperçu, PDF et audit des corrections passeport
- [x] Ajouter une visionneuse miniature du passeport à côté du formulaire d’édition.
- [x] Générer et télécharger un PDF du récapitulatif des données validées.
- [x] Enregistrer les corrections manuelles et les rendre visibles dans l’administration.
- [x] Formaliser et valider le flux dans la compétence `prime-travel-case-management` avec `skill-creator`.

## Régression critique du traitement e‑Visa
- [x] Reproduire l’erreur interne réelle après sélection du passeport et identifier sa cause dans les logs.
- [x] Corriger le flux upload/analyse IA pour les fichiers PDF et image sans réponse générique.
- [x] Tester une soumission e‑Visa de bout en bout et publier uniquement après validation opérationnelle.
- [x] Tester explicitement le parcours corrigé avec un fichier PDF jusqu’à la validation et à la confirmation.
- [x] Couvrir la soumission finale e‑Visa après passeport, vérifier l’obtention d’une référence de dossier et le message de succès.
- [x] Publier un checkpoint seulement après les contrôles PDF et de soumission finale.

## Fiabilité des brouillons e‑Visa
- [x] Créer la table evisa_drafts avant toute lecture afin d’éliminer l’erreur cloud draft en production.

## Lien d’accès après évaluation différée
- [x] Identifier et corriger le lien erroné envoyé par e-mail après l’évaluation à 24 h.
- [x] Vérifier la redirection sécurisée vers l’espace client et le bilan associé.
- [x] Ajouter un test de non-régression du lien dans l’e-mail d’évaluation puis publier.
- [x] Vérifier par test que les modèles d’e-mail d’évaluation utilisent le lien de connexion canonique associé au dossier.
- [x] Vérifier par test le retour vers le bon dossier après connexion depuis le lien e-mail.
- [x] Ajouter un test d’intégration de connexion depuis le lien e-mail jusqu’au dossier ciblé.

## Poste de pilotage administrateur pleine largeur
- [x] Passer le tableau de bord administrateur en disposition PC pleine largeur, avec zones de travail adaptées aux grands écrans.
- [x] Centraliser la gestion des dossiers dans une fiche 360° accessible depuis la liste administrateur.
- [x] Étendre les actions administratives sur les procédures, documents, paiements, évaluations, communications et historique.
- [x] Vérifier les contrôles d’accès, les actions sensibles et l’expérience administrateur sur PC.
- [x] Ajouter un test navigateur desktop du poste dossier 360° et de ses raccourcis opérationnels.
- [x] Vérifier les contrôles d’accès administrateurs sur les procédures de pilotage sensibles.
- [x] Compléter les actions de procédure, communication et historique visibles depuis le poste 360° puis les couvrir par tests.
- [x] Ajouter un test d’autorisation exécutable prouvant qu’une session absente ou invalide est rejetée pour les actions sensibles du poste 360°.
- [x] Tester explicitement le rejet d’une session administrateur absente sur les actions sensibles du poste 360°.

## Pré-remplissage IA de l’évaluation depuis le CV
- [x] Inspecter et intégrer les trois fichiers fournis aux chemins indiqués.
- [x] Pré-remplir les champs pertinents de l’évaluation après analyse IA d’un CV déposé.
- [x] Afficher l’état d’analyse et le nombre de champs automatiquement complétés.
- [x] Tester les parcours PDF/image, les erreurs et la sécurité des données CV avant publication.
- [x] Tester le contrat serveur d’extraction CV pour un PDF valide et le rejet des formats non autorisés.
- [x] Confirmer le périmètre « CV PDF uniquement » et tester le message visible lors du dépôt d’une image.

## CV OCR et contrôle du pré-remplissage IA
- [x] Ajouter l’extraction OCR sécurisée pour les CV image (PNG, JPG, JPEG) en complément du PDF.
- [x] Mettre en évidence chaque champ ajouté par l’IA sans masquer la possibilité de correction manuelle.
- [x] Ajouter les actions « Réanalyser le CV » et « Annuler le pré-remplissage » sans effacer les saisies manuelles.
- [x] Formaliser le flux dans la compétence réutilisable `prime-travel-case-management` avec `skill-creator`.
- [x] Tester les parcours PDF, image OCR, réanalyse, annulation et erreurs puis publier.
- [x] Vérifier par test qu’une correction manuelle reste intacte après l’annulation du pré-remplissage IA.

## Ciblage du CV avant OCR
- [x] Ajouter un recadrage interactif et réversible pour les CV image avant OCR.
- [x] Permettre de sélectionner les pages pertinentes d’un CV PDF avant analyse.
- [x] Appliquer le recadrage ou les pages sélectionnées au traitement serveur sans conserver de copie intermédiaire.
- [x] Tester les parcours image, PDF multi-pages, annulation et erreurs de sélection avant publication.

## Test réel d’évaluation IA et de livraison
- [x] Créer un dossier de démonstration isolé pour aureoldonfack@gmail.com.
- [x] Générer un bilan IA de test depuis un profil non sensible et le publier dans l’espace associé.
- [x] Envoyer le bilan de test à l’adresse autorisée puis vérifier la livraison et l’accès dans l’espace candidat.

## Modèle professionnel de bilan d’évaluation
- [x] Produire un exemple détaillé de bilan d’évaluation 3M Travel à partir d’un profil fictif transparent.
- [x] Créer un prompt réutilisable pour générer des bilans structurés, auditables et sans promesse de visa.
- [x] Présenter les règles de calcul et les limites de l’automatisation pour validation humaine.

## Bilan IA par destination avec validation conseiller
- [x] Ajouter la sélection Canada, Luxembourg ou Europe et appliquer un modèle d’évaluation adapté.
- [x] Intégrer la grille de score cohérente sur 100 points dans la génération du brouillon IA.
- [x] Rendre la modification et la validation par conseiller obligatoires avant tout envoi client.
- [x] Formaliser le cycle dans la compétence réutilisable `prime-travel-case-management` avec `skill-creator`.
- [x] Tester le cycle complet génération, modification, validation et envoi avant publication.

## Sécurité et catalogue e‑Visa
- [x] Remplacer le routeur e‑Visa fourni et vérifier strictement chaque session administrateur avant approbation ou téléversement.
- [x] Ajouter les destinations e‑Visa demandées avec un avertissement d’éligibilité à confirmer avant toute démarche ou paiement.
- [x] Finaliser le workflow de bilan IA administrable interrompu sans affaiblir les contrôles serveur.
- [x] Tester les autorisations e‑Visa, les nouveaux pays et les parcours principaux avant publication.
- [x] Corriger le rendu du poste dossier 360° lorsqu’une prochaine action est absente.
- [x] Corriger le rendu du poste dossier 360° lorsqu’aucun état opérationnel n’est encore créé.
- [x] Corriger l’éditeur de bilan lorsqu’aucun brouillon n’a encore été chargé.

## Références e‑Visa et pilotage des bilans
- [x] Ajouter les liens consulaires officiels et dates de vérification aux destinations e‑Visa du catalogue.
- [x] Créer une file « Bilans à valider aujourd’hui » filtrée et sécurisée pour les conseillers.
- [x] Ajouter l’historique des validations et modifications dans les PDF de bilan.
- [x] Tester les liens, la file conseiller, le contenu PDF et les contrôles d’accès avant publication.
- [x] Corriger le contraste du contexte professionnel sur les fiches e‑Visa afin de garantir une lecture confortable.

## Optimisation de compilation de production
- [x] Réduire le pic mémoire de rendu Vite sans dégrader le fonctionnement du site.
- [x] Rejouer la compilation complète avant publication.
- [x] Extraire les données e‑Visa dupliquées et charger les modules lourds uniquement au besoin.
- [x] Vérifier le découpage des routes principales et le chargement différé des fonctionnalités PDF ou IA.

## Bureau de traitement Administrateur & Synchronisation Espace Client
- [x] Cartographier et vérifier l'ensemble des mutations tRPC admin pour la mise à jour des dossiers, étapes, statuts et documents.
- [x] Implémenter et tester la génération/envoi de documents PDF (attestations, bilans, PNR, quittances) directement depuis le poste admin 360°.
- [x] Valider le passage synchrone des étapes de dossier (nouveau -> evaluation -> documents -> traitement -> soumis -> approuve) côté client et admin.
- [x] Vérifier la génération automatique de quittances de paiement, de bilans et de reçus visibles immédiatement dans l'espace client.
- [x] Exécuter la suite complète des tests Vitest et valider la compilation de production.

## Synchronisation workflow admin-client — 17 août 2026
- [x] Synchroniser chaque changement d’étape du poste 360° vers `applications` ou `agency_dossiers`.
- [x] Créer une notification dans l’espace client lors d’un changement d’étape ou d’un commentaire administratif.
- [x] Afficher une confirmation Sonner après enregistrement du pilotage.
- [x] Ajouter les tests unitaires du mapping et le scénario navigateur de synchronisation.
- [x] Valider le typage, 382 tests Vitest et 4 scénarios navigateur du bureau administrateur.

## Workflow central CV → validation Admin → dossier client
- [x] Transformer chaque CV reçu en brouillon IA structuré visible uniquement dans la file administrateur.
- [x] Permettre à l’administrateur d’éditer les données CV, le score, les recommandations et le texte d’accompagnement dans des formulaires propres et prévisualisables.
- [x] Conserver l’historique des versions et l’identité de l’administrateur ayant modifié ou validé le bilan.
- [x] Générer automatiquement le numéro de dossier uniquement au moment de la validation finale administrateur, avec rattachement à l’e-mail du candidat.
- [x] Envoyer après validation le bilan PDF dans l’espace candidat et le lien sécurisé par e-mail avec le même numéro de dossier.
- [x] Permettre depuis le back-office de faire évoluer la progression, les documents, les remarques, les paiements et les prochaines actions visibles côté client.
- [x] Ajouter une assistance IA d’autocomplétion contrôlée, sans écraser les corrections humaines ni inventer les informations manquantes.
- [x] Déclencher après huit heures une alerte interne de relance et de priorité, sans jamais envoyer au client un bilan qui n’a pas été validé par un administrateur.
- [x] Ajouter des tests de bout en bout du parcours CV → brouillon → modification → validation → numéro de dossier → espace client/e-mail.

## Lot e‑Visa sécurité et catalogue vérifié
- [x] Inspecter les deux fichiers fournis et confirmer leurs chemins de remplacement.
- [x] Conserver le routeur e‑Visa renforcé actuel et vérifier qu’il couvre le correctif de contrôle d’autorisation demandé.
- [x] Fusionner uniquement les destinations absentes du catalogue fourni, sans supprimer les fiches déjà vérifiées.
- [x] Vérifier la cohérence des liens officiels, dates de vérification et informations de chaque destination ajoutée.
- [x] Exécuter les tests d’autorisation e‑Visa, du catalogue et des parcours concernés avant publication.

## Insertion e‑Visa dans les messages administrateur
- [x] Réutiliser le catalogue normalisé pour proposer les destinations e‑Visa dans la modale de message de la fiche 360°.
- [x] Insérer dans le message modifiable le portail officiel, la date de vérification, les exigences principales et le lien de procédure de la destination sélectionnée.
- [x] Conserver les contrôles administrateur, la traçabilité du message et la possibilité d’éditer le contenu avant envoi.
- [x] Ajouter les tests de contenu, de sélection et de sécurité, puis vérifier le parcours administrateur concerné.

## Historique des exigences e‑Visa partagées
- [x] Enregistrer l’instantané normalisé de la destination e‑Visa au moment de l’envoi du message administrateur.
- [x] Associer l’instantané au message et l’afficher dans l’historique de communication du dossier.
- [x] Préserver le portail, la date de vérification, les exigences, frais, délai et lien de procédure réellement partagés.
- [x] Ajouter les tests d’audit et vérifier que les évolutions futures du catalogue ne modifient pas les anciens messages.

## Export PDF de l’historique de communication
- [x] Ajouter un export PDF administrateur de l’historique complet des messages, notifications et pièces jointes référencées du dossier.
- [x] Inclure dans le PDF les instantanés e‑Visa archivés et leurs métadonnées de partage.
- [x] Réserver l’export aux sessions administrateur valides et journaliser la génération dans l’historique du dossier.
- [x] Vérifier le contenu PDF, les contrôles d’accès et le parcours de téléchargement avant publication.

## Documentation technique e‑Visa et back-office
- [x] Cartographier les routes, composants, tables et services actifs de l’intégration e‑Visa et du poste administrateur.
- [x] Rédiger un récapitulatif technique des flux, autorisations, intégrations IA, e-mail, PDF et audit.
- [x] Inclure les procédures de test, les dépendances opérationnelles et les limites connues pour la reprise par l’équipe.

## Centre de gestion administrateur e‑Visa
- [x] Créer une source de catalogue e‑Visa persistante et compatible avec les fiches normalisées déjà publiées.
- [x] Ajouter des procédures administrateur sécurisées pour lister, créer, modifier, désactiver et supprimer une destination e‑Visa.
- [x] Journaliser les créations, corrections, désactivations et suppressions avec l’administrateur, la date et le résumé du changement.
- [x] Ajouter une interface back-office avec recherche, formulaire de destination, validation des URLs officielles et confirmation de suppression.
- [x] Tester les autorisations, l’audit, les validations de données et les parcours administrateur avant publication.

## Assistance IA du formulaire e‑Visa administrateur
- [x] Ajouter une procédure IA réservée aux administrateurs pour suggérer des exigences, frais, délais, étapes et précautions à partir du pays sélectionné.
- [x] Utiliser une sortie JSON structurée avec garde-fous : aucune éligibilité garantie, aucune source non vérifiée présentée comme officielle.
- [x] Ajouter un bouton d’assistance IA dans la modale d’édition et laisser l’administrateur appliquer ou modifier chaque suggestion avant enregistrement.
- [x] Tester les autorisations, la validation de sortie, les erreurs IA et le parcours de formulaire avant publication.

## Comparaison visuelle des suggestions IA e‑Visa
- [x] Afficher côte à côte les valeurs actuelles et les propositions IA pour les exigences, frais, délais, étapes et précautions.
- [x] Mettre en évidence les changements détectés et préciser que toute proposition reste à confirmer sur le portail officiel.
- [x] Permettre à l’administrateur d’appliquer l’ensemble des suggestions ou de conserver et modifier manuellement la version actuelle.
- [x] Ajouter les tests de calcul des différences et vérifier le parcours du formulaire avant publication.

## Restauration des versions du catalogue e‑Visa
- [x] Exposer l’historique des instantanés de création, mise à jour, désactivation et suppression dans le centre e‑Visa.
- [x] Ajouter une prévisualisation sécurisée d’une version antérieure avant sa restauration.
- [x] Permettre à un administrateur valide de restaurer une version avec confirmation explicite et journaliser l’action de restauration.
- [x] Tester les autorisations, les données restaurées, l’audit et le parcours administrateur avant publication.

## Audit des chemins, liens et actions inactifs
- [x] Inventorier les routes publiques, client et administrateur ainsi que leurs actions, redirections et liens sortants critiques.
- [x] Exécuter les scénarios de navigation et analyser les erreurs de route, appels réseau, boutons sans effet et chargements bloqués.
- [x] Corriger les chemins inaccessibles, redirections défectueuses, routes manquantes et actions de formulaire non réactives détectés.
- [x] Ajouter ou renforcer les tests de régression des parcours corrigés, puis valider les routes critiques sur ordinateur et mobile.

## Nettoyage App.tsx, page 404 et vérification des liens externes
- [x] Comparer le App.tsx fourni avec les routes réellement montées et retirer uniquement les imports de pages jamais routées.
- [x] Ajouter une configuration 404 administrable avec titre, message et liens de redirection utiles, protégée et auditée.
- [x] Enregistrer les erreurs 404 avec chemin demandé, référent, date et compteur, puis ajouter un tableau de surveillance administrateur.
- [x] Ajouter un vérificateur de liens externes avec statut HTTP, date du dernier contrôle, erreur et relance manuelle sécurisée.
- [x] Intégrer les centres 404/liens au back-office sans modifier les parcours existants.
- [x] Ajouter les tests de sécurité, routes, validations, vérification de liens et régression complète avant publication.
- [x] Ajouter un callback Heartbeat idempotent pour vérifier périodiquement les liens externes et enregistrer les statuts, sans timer en processus.
- [x] Préparer la création du cron projet après publication du callback et confirmer la procédure de déploiement avec le propriétaire.

## Assistance IA pour les liens brisés
- [x] Ajouter une procédure tRPC d’assistance IA pour suggérer des URL de remplacement aux liens brisés.
- [x] Intégrer le bouton et le panneau de suggestion dans l’interface de gestion des liens externes.
- [x] Valider l’application manuelle de l’URL suggérée et consigner l’action dans l’audit.
- [x] Exécuter les tests unitaires, de sécurité et le build de production.

## Éditeur riche de type Word pour le back-office
- [x] Créer un composant d’édition riche réutilisable avec titres, gras, italique, listes, liens et aperçu.
- [x] Assainir le HTML avant stockage et conserver une version texte compatible avec les e-mails et l’historique.
- [x] Intégrer l’éditeur aux messages administrateur et au contenu d’accompagnement des évaluations, tout en conservant les listes structurées e‑Visa.
- [x] Valider l’accessibilité clavier, la prévisualisation, les exports PDF et les parcours administrateur avant publication.

## Éditeur Word enrichi et compétence réutilisable
- [x] Ajouter une bibliothèque de modèles pré-formatés permettant la création, la sauvegarde et l’insertion rapide de contenus administratifs.
- [x] Ajouter une assistance IA pour corriger l’orthographe et améliorer la formulation, avec application uniquement après validation explicite.
- [x] Nettoyer le collage depuis Microsoft Word en supprimant les styles, balises et attributs superflus avant insertion.
- [x] Créer, valider et livrer une compétence réutilisable du workflow d’édition riche sécurisé.
- [x] Tester les modèles, l’assistance IA, le collage Word, les contrôles d’accès et les régressions avant publication.

## Gestionnaire de fichiers administratif
- [x] Inventorier les vues documentaires admin, les statuts, les actions de validation et la synchronisation client existante.
- [x] Ajouter recherche, filtres par statut/type/source et compteur de complétude dans le gestionnaire de fichiers.
- [x] Améliorer la prévisualisation, le téléchargement, la validation/refus avec commentaire, les annotations et l’envoi au candidat.
- [x] Tester les autorisations, les transitions de statut, les documents PDF/images et les notifications synchronisées avant publication.
- [x] Ajouter une chaîne explicite de versions de remplacement pour relier l’ancien document à la nouvelle soumission du candidat.
- [x] Générer une attestation globale de remise lorsque tous les documents requis sont validés et la rendre disponible côté client.

## Dépôt, comparaison et rapport documentaire
- [x] Ajouter une zone de glisser-déposer sécurisée dans le gestionnaire administratif avec contrôle de type, taille et destination du fichier.
- [x] Ajouter une comparaison visuelle de deux versions liées d’un document PDF ou image, avec navigation claire entre l’ancienne et la nouvelle version.
- [x] Générer un tableau mensuel de complétude par dossier à partir des statuts réels des documents, avec filtres de période et indicateurs d’avancement.
- [x] Tester les autorisations, le dépôt, la comparaison, les données de rapport et les régressions de l’espace client avant publication.

## Exports, IA et alertes du gestionnaire documentaire
- [x] Ajouter les exports PDF et CSV du rapport mensuel de complétude, fondés sur les statuts réels affichés dans le back-office.
- [x] Analyser automatiquement les fichiers déposés par IA afin de suggérer le type, le dossier et les métadonnées sans déclencher d’enregistrement automatique.
- [x] Ajouter des filtres et alertes visuelles pour les dossiers incomplets depuis plus de sept jours, avec date de dernière activité.
- [x] Créer, valider et livrer une compétence réutilisable pour la gestion documentaire administrative sécurisée.
- [x] Tester les exports, l’IA, les alertes, les autorisations et les régressions avant publication.

## Poste de commande de pilotage des dossiers
- [x] Cartographier les données et mutations de pilotage synchronisées avec l’espace client.
- [x] Recomposer le bloc de pilotage en interface pleine largeur avec hiérarchie visuelle, statut, priorité, conseiller, échéance et prochaine action.
- [x] Ajouter des actions rapides de relance, attribution, suivi, annotations, étiquettes et accès aux centres documents/paiements/communications.
- [x] Préserver les formulaires complets, l’historique, les contrôles d’accès et l’enregistrement explicite des modifications.
- [x] Tester l’affichage PC/mobile, les actions de pilotage et les régressions avant publication.

## Confidentialité des assistances internes
- [x] Rechercher les mentions client-visible d’IA, d’analyse IA ou de suggestion IA dans les pages, e-mails, notifications et PDF.
- [x] Remplacer ces mentions par des formulations neutres et professionnelles sans modifier les capacités internes du back-office.
- [x] Vérifier que les messages, pièces jointes, exports et parcours candidat ne divulguent aucun détail technique interne.
- [x] Ajouter des tests de régression de contenu et valider les canaux client avant publication.

## Aperçu, modèles et validation des communications
- [x] Cartographier les éditeurs de bilan et de message ainsi que les modèles e-mail déjà utilisés.
- [x] Ajouter un aperçu fidèle de l’e-mail final avant l’envoi, avec rendu du contenu, objet, destinataire et pièces jointes référencées.
- [x] Créer des modèles de messages standardisés et personnalisables par type de procédure.
- [x] Empêcher toute diffusion automatique de bilan sans validation humaine explicite et journalisée.
- [x] Tester les aperçus, modèles, verrouillages de diffusion et parcours administrateur avant publication.

## Test interne, signature et suivi d’ouverture des bilans
- [x] Cartographier l’envoi de bilan, les conseillers responsables et les métadonnées de consultation existantes.
- [x] Ajouter un envoi de test réservé aux adresses internes autorisées, sans modifier le statut du dossier ni notifier le client.
- [x] Ajouter une signature dynamique du conseiller responsable à chaque modèle de bilan et e-mail final.
- [x] Ajouter un suivi d’ouverture de l’e-mail de bilan avec image de suivi signée, journalisation et affichage dans le back-office.
- [x] Désactiver ou aligner tout flux legacy qui enverrait un bilan sans validation humaine et planification explicite.
- [x] Créer, valider et livrer une compétence réutilisable de communication de dossier contrôlée.
- [x] Tester les accès, les envois, les pixels de lecture et les régressions avant publication.

## Test interne, signature et suivi d’ouverture des bilans
- [x] Cartographier l’envoi de bilan, les conseillers responsables et les métadonnées de consultation existantes.
- [x] Ajouter un envoi de test réservé aux adresses internes autorisées, sans modifier le statut du dossier ni notifier le client.
- [x] Ajouter une signature dynamique du conseiller responsable à chaque modèle de bilan et e-mail final.
- [x] Ajouter un suivi d’ouverture de l’e-mail de bilan avec image de suivi signée, journalisation et affichage dans le back-office.
- [x] Créer, valider et livrer une compétence réutilisable de communication de dossier contrôlée.
- [x] Tester les accès, les envois, les pixels de lecture et les régressions avant publication.

## Routes simplifiées, modèles bilingues et relances de bilan
- [x] Examiner l’archive fournie et confirmer que `client/src/App.tsx` contient déjà exactement le nettoyage des imports non routés, sans modifier les routes actives.
- [x] Créer des modèles de communication partagés français–anglais, avec accès administrateur, sauvegarde et insertion dans l’éditeur riche.
- [x] Ajouter un tableau de suivi des bilans envoyés non consultés, avec filtres, métriques et relance e-mail manuelle sécurisée.
- [x] Tester les contrôles d’accès, les relances, les modèles bilingues, TypeScript et le build de production avant publication.

## Mesure d’audience Google Analytics 4
- [x] Vérifier le point d’entrée HTML, les balises de mesure existantes et les contraintes de chargement du site.
- [x] Intégrer le tag Google Analytics 4 `G-4HBHHH37VL` sans doublonner les scripts de suivi existants.
- [x] Vérifier le build, le chargement du tag et publier la version validée.

## Simulateur CRS : transition, partage et rapport PDF détaillé
- [x] Ajouter une transition fluide et accessible lorsque l’indicateur d’écart passe du rouge au vert ou inversement.
- [x] Ajouter un bouton de copie sécurisé pour partager le score, l’écart, la catégorie et les rondes comparées.
- [x] Générer un véritable rapport PDF incluant le score total, les sous-scores, le seuil sélectionné, l’écart et les rondes affichées.
- [x] Mettre à jour, valider et livrer la compétence réutilisable `crs-immigration-workflow`.
- [x] Exécuter les tests Vitest, la compilation TypeScript et les vérifications de rendu avant publication.

## Simulateur CRS : historique six mois, prévisualisation et checklist
- [x] Vérifier et intégrer les données de seuils CRS sur les six derniers mois avec source et date de vérification.
- [x] Ajouter un graphique d’évolution lisible des seuils historiques au comparateur CRS.
- [x] Ajouter une modale de prévisualisation du rapport PDF avant son téléchargement effectif.
- [x] Rendre les recommandations actionnables avec une checklist interactive persistante.
- [x] Tester TypeScript, Vitest, le responsive et les parcours d’export avant publication.

## Évaluations contextualisées, registre consulaire et traitement administratif
- [x] Auditer les formulaires d’évaluation existants, leurs pré-remplissages et les données reçues côté administration.
- [x] Définir des parcours et exigences spécifiques pour Travail, Études, Tourisme, e-Visa et autres procédures.
- [x] Compléter le registre des Consulats & Liens officiels à partir des 107 guides de la bibliothèque, avec type de procédure, source, date de vérification et état de disponibilité.
- [x] Enrichir les outils administratifs de recherche, filtrage, consultation des exigences, actions dossier et suivi de traitement.
- [x] Tester les formulaires par projet, les contrôles d’accès administratifs, les routes et la qualité des données avant publication.

## Réorganisation des pages de services et contenu
- [x] Auditer les routes et pages existantes pour les services Canada, Schengen, études, billets, formation, blog et contact.
- [x] Définir les routes canoniques et les redirections nécessaires sans créer de pages statiques ou de contenus dupliqués.
- [x] Intégrer à la page Canada le contenu détaillé du flyer : parcours, accompagnement en emploi, contacts et avertissements de conformité.
- [x] Créer ou consolider les pages demandées avec les règles éditoriales, la navigation et les appels à l’action existants.
- [x] Tester les chemins, redirections, affichage mobile et build avant publication.

## Articles SEO des destinations d’études
- [x] Créer un article détaillé, source officielle et métadonnées SEO pour chacune des dix destinations d’études.
- [x] Ajouter une navigation dédiée depuis le Blog vers les dix articles et vers les parcours d’études existants.
- [x] Tester la présence des dix destinations, le responsive, TypeScript, la suite Vitest et les bundles client et serveur de production.

---

## Optimisation SEO technique
- [x] Auditer les métadonnées et titres de pages publiques.
- [x] Mettre à jour `sitemap.xml` avec toutes les routes canoniques et les dix articles d’études.
- [x] Valider l’intégration par test automatisé Vitest et compilation de production.

---

## Hiérarchie Accueil et Procédures
- [x] Centraliser dans Procédures les blocs distincts Canada, Schengen, Études et le simulateur de score canadien.
- [x] Placer l’évaluation multi-projets au premier niveau de l’accueil, juste après le héros.
- [x] Vérifier les routes, le responsive, TypeScript et les tests avant publication.

---

## Comparatif des parcours
- [x] Ajouter dans Procédures un comparatif visuel Travail / Études / Tourisme avec repères distincts et prudents.
- [x] Relier chaque parcours à une action dédiée sans mélanger les formulaires.
- [x] Permettre aux boutons d’action du comparatif de préremplir automatiquement le formulaire d’évaluation.
- [x] Tester l’accessibilité, le responsive, TypeScript et les régressions avant publication.

---

## Présélection de destination dans le formulaire d’évaluation
- [x] Permettre au formulaire d’évaluation d’accepter et de pré-remplir la destination choisie depuis les articles d’études ou les guides de pays.
- [x] Tester l’accessibilité, le responsive, TypeScript et les tests avant publication.

## Bouton de partage WhatsApp du projet pré-rempli
- [x] Intégrer un bouton WhatsApp dans le formulaire d’évaluation pour transmettre le récapitulatif du projet au conseiller.
- [x] Valider par les tests, TypeScript et publier la version finale.

## Test automatisé de robustesse du formulaire et des redirections
- [x] Configurer un test Vitest dédié pour vérifier la robustesse des paramètres de projet, de destination et du lien de partage WhatsApp.
- [x] Valider par les tests unitaires et publier la version finale.

## Option d’envoi des détails par e-mail
- [x] Ajouter un bouton d’envoi par e-mail (mailto) avec récapitulatif pré-rempli vers `hello@3mtravelagency.com` dans le formulaire d’évaluation.
- [x] Valider par les tests et publier la version finale.

## Animation de confirmation visuelle sur les boutons de partage
- [x] Ajouter un feedback visuel temporaire (changement de couleur, icône de succès et effet de relief) sur les boutons WhatsApp et e-mail.
- [x] Valider par les tests et publier la version finale.

## Bouton de copie rapide du récapitulatif
- [x] Ajouter un bouton dédié pour copier le récapitulatif du projet dans le presse-papier, avec solution de repli (fallback textarea) et notification visuelle.
- [x] Valider par les tests et publier la version finale.

## Recentrage du calculateur Canada
- [x] Déplacer le simulateur de score CRS de la page Procédures vers la section /canada dédiée.
- [x] Imposer une étape d’évaluation du score avant d’explorer les voies détaillées (Entrée express, provinces, etc.).
- [x] Mettre à jour les tests de contrat et valider la suite complète de 436 tests Vitest.

## Barres de progression par critère
- [x] Calculer les points par sous-critère (Âge, Études, Expérience, Langues) dans le simulateur Canada.
- [x] Ajouter des barres de progression visuelles et accessibles pour chaque critère.
- [x] Tester les calculs, le responsive, TypeScript et les tests avant publication.

## Bouton de réservation de consultation Canada
- [x] Ajouter un appel à l’action sous les barres de progression du simulateur Canada pour réserver directement une consultation avec un conseiller.
- [x] Valider par les tests, TypeScript et publier la version finale.

## Évaluations contextualisées, registre consulaire et traitement administratif
- [x] Finaliser les parcours et exigences spécifiques pour Travail, Études, Tourisme, e‑Visa et Installation.
- [x] Synchroniser les réponses contextualisées vers les dossiers et les vues administratives.
- [x] Enrichir les outils de recherche, filtrage, exigences et actions de traitement administratif.
- [x] Tester les formulaires par projet, les routes et les contrôles d’accès avant publication.

## Base documentaire des 107 destinations
- [x] Inventorier les PDF de destination présents dans les ressources et extraire les pays, procédures, exigences et portails institutionnels cités.
- [x] Vérifier et normaliser les liens officiels disponibles avant leur publication dans le registre administratif.
- [x] Produire la couverture des 107 guides de la bibliothèque avec un statut explicite : vérifié ou à compléter.

## Formulaires par pays et procédure
- [x] Cartographier chaque PDF de la bibliothèque Ressources vers une destination et ses procédures disponibles.
- [x] Définir les champs, validations et pièces attendues spécifiques à chaque couple pays-procédure.
- [x] Adapter le formulaire public à la destination et à la procédure choisies, avec transmission structurée vers le dossier administratif.

## Registre éditable, fiche Client 360° et recherche de destination
- [x] Ajouter l’édition rapide, la validation et la traçabilité des liens institutionnels dans le registre administrateur.
- [x] Afficher le contexte pays-procédure et une progression visuelle exploitable dans la fiche Client 360°.
- [x] Ajouter une recherche de destination avec autocomplétion, drapeaux et clavier dans le formulaire.
- [x] Mettre à jour et valider la compétence réutilisable associée à ce workflow.
- [x] Exécuter les tests Vitest, TypeScript et une vérification visuelle avant publication.

## Procédures, revalidation consulaire et analyse des destinations
- [x] Auditer et compléter la page Procédures avec les composants publics déjà disponibles, sans altérer son style.
- [x] Vérifier l’intégration Google Analytics sans créer de doublon ; Facebook Pixel reste volontairement inactif.
- [x] Ajouter ou relier le calculateur CRS, les listes documentaires par visa et le contact WhatsApp vers +237698104832.
- [x] Créer une file de liens consulaires à revalider avec échéances et alertes administratives.
- [x] Automatiser le préremplissage de la checklist Client 360° selon le contexte pays-procédure.
- [x] Créer un tableau de bord de tendances des destinations demandées pour l’administration.
- [x] Tester TypeScript, Vitest, les droits et le responsive avant publication.

## Décision de mesure d’audience
- [x] Conserver Facebook Pixel inactif, conformément à la décision actuelle de ne pas l’intégrer.

## Fiches détaillées des destinations
- [x] Créer une route dynamique ouvrant une fiche dédiée pour chaque destination présente dans les guides 3M.
- [x] Afficher les procédures, documents, guides PDF, sources officielles et état de vérification associés à la destination.
- [x] Relier chaque liste ou carte de destination à sa fiche détaillée et au formulaire approprié.
- [x] Tester les liens, les données manquantes, les redirections et le responsive avant publication.

## 107 pages destination premium synchronisées
- [x] Normaliser les 107 identifiants de destination et garantir une URL publique dédiée par fiche.
- [x] Construire un modèle premium unique affichant guides, procédures, documents, portail officiel et appel à l’action adapté.
- [x] Synchroniser les changements du registre administratif vers les pages publiques de destination.
- [x] Tester systématiquement les 107 URL, les liens de démarrage et le comportement mobile avant publication.

## Fiches destination : rappel, comparaison et mises à jour
- [x] Ajouter un bouton de demande de rappel rapide contextualisé sur chaque fiche destination.
- [x] Ajouter un comparateur permettant de sélectionner et comparer deux destinations.
- [x] Afficher la date de dernière mise à jour de la fiche et de chaque guide PDF associé.
- [x] Créer et valider une compétence réutilisable pour le workflow des fiches destination premium.
- [x] Tester TypeScript, Vitest et les interactions responsive avant publication.

## Rappels planifiés, comparaisons sauvegardées et mises à jour récentes
- [x] Ajouter la sélection de date et de créneau à la demande de rappel destination.
- [x] Permettre aux utilisateurs connectés de sauvegarder et consulter leurs comparaisons de destinations.
- [x] Afficher un badge « Mis à jour » pour les fiches et guides récemment actualisés.
- [x] Mettre à jour et valider la compétence réutilisable des fiches destination.
- [x] Tester TypeScript, Vitest, les droits d’accès et le responsive avant publication.

## Synchronisation des réservations de vols vers l’administration
- [x] Tracer la confirmation de vol côté client, la création persistante et le chargement dans le tableau admin.
- [x] Corriger la cause empêchant l’arrivée ou l’affichage des réservations de vols côté administration.
- [x] Ajouter un test de non-régression client → administration pour les réservations de vols.
- [x] Vérifier TypeScript, Vitest et publier le correctif après contrôle des droits administratifs.

## File de vols : urgence, filtres, actions rapides et notification
- [x] Calculer automatiquement la priorité selon la date de départ et afficher une urgence visible.
- [x] Ajouter des filtres par compagnie, trajet et statut dans la file de réservations.
- [x] Ajouter des actions rapides par ligne pour affecter un conseiller et changer le statut.
- [x] Envoyer une notification e-mail au conseiller lorsque la réservation est créée ou affectée.
- [x] Tester TypeScript, Vitest et le flux client → conseiller → admin avant publication.

## Calendrier de vols, e-mails de statut et notes rapides
- [x] Ajouter une vue calendrier interactive des départs de vols imminents dans l’administration.
- [x] Envoyer un e-mail au client quand le statut de sa réservation de vol change.
- [x] Ajouter une action rapide pour enregistrer une note interne sur chaque réservation.
- [x] Tester TypeScript, Vitest, les droits et le responsive avant publication.

## Fiche administrative détaillée de réservation de vol
- [x] Auditer les données de vol, passager, paiement et suivi actuellement présentes dans la réservation.
- [x] Afficher ces données dans une fiche opérationnelle structurée et lisible côté administration.
- [x] Ajouter un test de non-régression garantissant la visibilité des champs essentiels.
- [x] Vérifier TypeScript, Vitest et le responsive avant publication.

## Émission de vol : aperçu, impression et contrôle
- [x] Ajouter l’aperçu intégré du PNR ou PDF émis dans la fiche de réservation.
- [x] Ajouter une impression propre de la fiche opérationnelle détaillée.
- [x] Ajouter une checklist de contrôle interne avant émission d’un document de voyage.
- [x] Créer et valider une compétence réutilisable du workflow de traitement des vols.
- [x] Tester TypeScript, Vitest, les droits administratifs et le responsive avant publication.
- [x] Implémenter l'export PDF du journal d'audit des validations et initiales pour les réservations de vols
- [x] Ajouter les filtres de période, le logo, le filigrane de sécurité et le téléchargement direct au rapport PDF d'audit des vols
- [x] Moderniser le système de réservation de vols style Air France (parcours multi-étapes, classes de cabine, familles de tarifs, options bagages et interface premium)
- [x] Intégrer une carte interactive de cabine pour la sélection de siège, la gestion des favoris d'itinéraire, le partage simplifié et le récapitulatif flottant du panier en temps réel
- [x] Ajouter les options bagages et repas au panier, la carte cabine à codes couleurs, le compte à rebours de maintien tarifaire et les logos harmonisés des compagnies
- [x] Permettre l'attribution individuelle de sièges et repas pour chaque passager d'un groupe avec infobulles de suppléments tarifaires sur la carte cabine
- [x] Ajouter le récapitulatif final multi-passagers, l'e-mail de confirmation avec billet QR, la carte cabine enrichie (toilettes, issues de secours) et la compétence réutilisable flight-booking-experience
- [x] Ajouter l'export PDF du plan de cabine avec les passagers assignés et la section de recherche par numéro de réservation pour consulter ou modifier les choix
- [x] Intégrer l'enregistrement en ligne (check-in) avec carte d'embarquement définitive et la barre de progression du statut du vol dans l'espace de gestion de réservation
- [x] Ajouter la barre de recherche, les filtres rapides, les badges de statut colorés et la section de notes internes pour les conseillers dans le tableau de bord administrateur des réservations de vols
- [x] Ajouter l'export CSV/Excel des réservations filtrées, l'historique détaillé des actions conseillers, l'e-mail automatique de changement de statut et la compétence flight-admin-workflow
- [x] Intégrer le tableau de bord analytique des ventes par compagnie et classe de cabine, ainsi que l'envoi automatique de SMS de confirmation avec PNR et lien de billet
- [x] Exiger l'inscription et la connexion du candidat avant de finaliser toute réservation de vol, avec conservation du panier d'itinéraire
- [x] Créer le tableau de bord personnel client (historique de réservations et préférences), ajouter les connexions sociales (Google/Facebook) et la récupération de mot de passe par e-mail, automatiser les alertes SMS PNR à l'émission et permettre l'export PDF du plan de cabine groupe pour l'embarquement
- [x] Ajouter le sélecteur de devises global (EUR, USD, XAF) avec mise à jour automatique des prix et options, et intégrer la section de téléchargement de factures et billets PDF dans le tableau de bord personnel client
- [x] Refondre complètement la page /flights avec un design haut de gamme inspiré des standards des grandes compagnies aériennes (en-tête immersif, barres de recherche avancées, distinction élégante des classes de cabine et cartes de vol premium)
- [x] Ajouter le bouton "Détails du vol" (escales et bagages), l'auto-complétion IATA pour les aéroports, le curseur de prix interactif et les filtres par compagnie aérienne sur la page /flights, et créer la compétence réutilisable flight-search-experience
- [x] Intégrer les alertes e-mail de baisse de prix sur les vols (abonnement, suivi par l'utilisateur, notifications et désinscription sécurisée)
- [x] Configurer l'application en Progressive Web App (PWA) avec manifeste, service worker et cache sécurisé pour l'accès hors ligne aux billets sur mobile
- [x] Intégrer les notifications push natives pour alerter les utilisateurs des changements d'horaires de vol sur mobile (consentement, service worker push et envoi ciblé)
- [x] Améliorer l'interface hors ligne de la PWA pour afficher automatiquement les prochains vols mis en cache pour l'utilisateur, avec statut de connexion et date de synchronisation
- [x] Intégrer le support multilingue pour l'espagnol et l'allemand dans l'interface, le parcours de réservation, les messages PWA et les notifications de vol
- [x] Améliorer la page d'accueil (design plus premium, lisibilité renforcée, accès directs aux services clés, réassurance et conversion optimisée)
- [x] Intégrer un widget de chatbot intelligent en bas de l'écran pour guider les utilisateurs dans leurs réservations et procédures (assistant virtuel, suggestions rapides et transfert conseiller)
- [x] Configurer le chatbot pour qu'il traduise et réponde automatiquement dans la langue actuellement sélectionnée par l'utilisateur sur le site (français, anglais, espagnol, allemand)
- [x] Mettre en place un programme de fidélité pour voyageurs fréquents et un comparateur de prix fondé sur les devis réels d'agences partenaires approuvées
- [x] Corriger l’alignement responsive des actions flottantes pour rendre WhatsApp, le chatbot et les raccourcis entièrement visibles
- [x] Créer dans Billets une expérience originale 3M Booking de recherche d’hébergement, inspirée des bonnes pratiques des grandes plateformes sans reprendre leur design ou leurs contenus
- [x] Permettre aux utilisateurs d'utiliser leurs points de fidélité pour obtenir des réductions directes sur leurs réservations de vol (vérification du solde, taux de conversion, plafond de réduction et trace d'audit)
- [x] Afficher une notification claire lors de la réservation de vol indiquant le nombre de points fidélité estimés à gagner (avec précision que le crédit intervient après l'émission validée)
- [x] Améliorer l'expérience 3M Booking (hébergement) et renforcer la synchronisation avec le back-office administrateur (file de demandes, affectation, statuts et validation)
- [x] Vérifier et garantir que les réservations 3M Booking arrivent instantanément et sans obstacle dans le back-office administrateur (tourisme / hébergement)
- [x] Intégrer l'export des confirmations de réservation et cartes d'embarquement vers Apple Wallet et Google Wallet, avec contrôle des données de vol et repli PDF
- [x] Intégrer un graphique interactif dans l'espace client pour afficher clairement l'évolution du cumul des points de fidélité au fil du temps
- [x] Permettre aux utilisateurs de télécharger leur confirmation de réservation au format PDF directement depuis leur espace client (avec suivi de l'état d'émission)
- [x] Mettre en place l'envoi automatique de la confirmation PDF par e-mail dès la validation et l'émission de la réservation de vol (depuis hello@3mtravelagency.com)
- [x] Traduire à la demande les avis clients authentiques dans la langue active, avec conservation de leur source et de leur langue originale
- [x] Corriger la connexion WebSocket Vite et la réponse HTML inattendue reçue par le client tRPC
- [x] Corriger l’affichage du graphique de fidélité lorsque son conteneur est masqué et supprimer l’avertissement de taille
- [x] Ajouter dans l’espace client un bouton pour exporter le relevé détaillé 3M Rewards au format PDF
- [x] Corriger globalement les contenus obsolètes, le cache PWA et le WebSocket Vite afin que les modifications publiées soient réellement visibles
- [x] Supprimer définitivement l’injection du client HMR Vite qui provoque l’erreur WebSocket dans la prévisualisation
- [x] Ajouter une bannière de nouvelle version, la réinitialisation manuelle du cache dans l’espace client, un indicateur hors ligne et la compétence réutilisable PWA
- [x] Identifier et supprimer le dernier chargement résiduel du client HMR Vite dans les sessions de prévisualisation
- [x] Ajouter une page d’état système, un diagnostic réseau réservé aux administrateurs, un indicateur de connectivité temps réel et une compétence réutilisable
- [x] Réaliser un audit complet des routes, parcours, console, API, PWA et synchronisations client-admin, puis corriger les erreurs reproductibles
- [x] Supprimer le double en-tête de la page legacy `/evisa` en s’appuyant uniquement sur la navigation globale
- [x] Réespacer la pile mobile WhatsApp, assistant de vol et messagerie pour empêcher tout chevauchement visuel
- [x] Corriger les avertissements serveur résiduels identifiés par l’audit (santé tRPC et suppression de cookie Express)
- [x] Exécuter les tests, le contrôle TypeScript, les validations des routes prioritaires et la revue console finale
- [x] Retirer les mentions d’outils internes encore visibles dans les textes publics identifiés par la revue des pages
- [x] Vérifier la visibilité et le point d’entrée de 3M Booking dans le parcours Billets, puis renforcer son accès si nécessaire
- [x] Auditer les contrats de synchronisation entre demandes client et espaces administrateurs pour les services prioritaires
- [x] Revalider les tests et les parcours améliorés avant la prochaine publication
- [x] Ajouter une procédure sécurisée permettant au client connecté de consulter uniquement ses demandes 3M Booking
- [x] Relier les nouvelles demandes 3M Booking au compte candidat afin de garantir la propriété du suivi
- [x] Afficher un suivi hôtel clair dans l’espace client avec statut, dates, établissement et prochaine étape
- [x] Vérifier la synchronisation des changements de statut administrateur vers le suivi hôtel client
- [x] Couvrir le suivi hôtel par des tests d’accès, de propriété et de statut
- [x] Remplacer l’entrée publique « Billets » par « 3M Booking » et revoir sa hiérarchie visuelle
- [x] Intégrer des visuels hôteliers premium et des contenus de prestations sans créer de fausses disponibilités
- [x] Afficher les offres tarifaires disponibles juste sous le formulaire de demande de disponibilité
- [x] Vérifier la nouvelle expérience 3M Booking sur ordinateur et mobile, puis valider les régressions
- [x] Ajouter les filtres piscine, Wi‑Fi et parking dans les résultats 3M Booking
- [x] Synchroniser les équipements choisis avec la demande transmise au back-office
- [x] Vérifier les filtres d’équipements sur ordinateur et mobile, avec tests de non-régression
- [x] Cartographier les sources officielles et partenaires vérifiables pour les hôtels du Cameroun et d’Afrique centrale
- [x] Définir un catalogue hôtelier administrable avec provenance, date de vérification, équipements et conditions tarifaires
- [x] Créer un premier périmètre d’hôtels vérifiés, relié à la demande 3M Booking et au back-office
- [x] Mettre en place des garde-fous pour éviter d’afficher des tarifs ou disponibilités non confirmés
- [x] Comparer les fournisseurs professionnels de contenu hôtelier et leurs possibilités d’accès pour 3M Booking
- [x] Vérifier si un connecteur ou des identifiants RateHawk sont déjà disponibles dans la session
- [x] Définir le contrat RateHawk pour recherche, tarifs, pré-vérification et transfert vers le back-office
- [x] Consigner le report de RateHawk à la demande de l’utilisateur, dans l’attente d’une activation API officielle ; aucune recherche, clé, réservation ou paiement RateHawk n’est engagé à ce stade.

## Recherche hôtelière Jinko contrôlée
- [x] Auditer le contrat Jinko actif et le formulaire 3M Booking avant intégration.
- [x] Créer une procédure serveur Jinko limitée à la recherche, protégée contre réservation, paiement, création de voyage et annulation.
- [x] Afficher les résultats Jinko avec provenance, date de recherche et message de confirmation humaine des tarifs et disponibilités.
- [x] Permettre au client de transmettre volontairement une offre recherchée dans sa demande 3M Booking, sans réservation automatique.
- [x] Tester les validations d’entrée, les autorisations, l’absence d’actions transactionnelles et le parcours de sélection.
- [x] Vérifier la suite complète puis publier uniquement après contrôle final.

## Audit transversal des parcours opérationnels
- [x] Auditer le parcours 3M Booking, le catalogue hôtelier et le transfert vers le back-office.
- [x] Auditer le parcours de recherche et de traitement des réservations de vol.
- [x] Auditer les demandes e‑Visa, leurs documents et leur suivi client-administrateur.
- [x] Auditer les demandes d’assurance, la remise des documents et la synchronisation e-mail.
- [x] Auditer l’espace candidat, les sessions, les suivis et les accès aux documents.
- [x] Auditer le back-office, les actions directes, les sessions et les erreurs opérationnelles récentes.
- [x] Prioriser et corriger les blocages confirmés, avec tests de régression avant publication.
- [x] Diagnostiquer et corriger le chargement vide observé sur la route publique `/3m-booking`.
- [x] Restaurer ou rediriger la route publique `/insurance` vers le parcours d’assurance réellement actif.
- [x] Restaurer ou rediriger l’accès candidat attendu sur `/candidate/login` vers le parcours d’authentification actif.
- [x] Diagnostiquer et corriger l’erreur de lecture `customerReview.listApproved` détectée dans les journaux récents, sans jamais créer de faux avis.
- [x] Identifier une source ouverte ou gratuite permettant de démarrer un catalogue hôtelier Cameroun et Afrique centrale
- [x] Concevoir la table de catalogue hôtelier avec source OSM, URL officielle, équipements et date de vérification
- [x] Importer de manière contrôlée les hôtels OpenStreetMap des neuf villes prioritaires
- [x] Créer les procédures administrateur de consultation, vérification et gestion du catalogue hôtelier
- [x] Permettre la sélection d’un hôtel du catalogue dans 3M Booking et transmettre sa provenance au back-office
- [x] Afficher l’attribution OpenStreetMap et exclure tout tarif ou disponibilité non vérifiés
- [x] Afficher le lien officiel de réservation de l’hôtel sélectionné dans chaque demande côté administration
- [x] Lancer l’import groupé des neuf villes prioritaires vers le catalogue hôtelier administrateur
- [x] Vérifier et consigner les volumes importés ainsi que les établissements sans lien officiel
- [x] Inspecter les connecteurs et les fournisseurs B2B hôteliers accessibles pour 3M Booking
- [x] Définir le parcours d’activation et les secrets nécessaires au fournisseur retenu
- [x] Activer le connecteur Jinko et finaliser l’autorisation OAuth professionnelle
- [x] Vérifier une recherche hôtelière Jinko avant toute intégration dans le parcours client

## Renforcement opérationnel de l’intégration Jinko
- [x] Auditer les limites de la recherche Jinko publiée et le transfert actuel vers 3M Booking.
- [x] Ajouter des métadonnées de recherche, un identifiant de traçabilité et des limites de volume côté serveur.
- [x] Renforcer l’affichage des résultats vides, des erreurs temporaires et de la date de recherche sans masquer la confirmation humaine obligatoire.
- [x] Structurer la sélection Jinko dans la demande 3M Booking pour qu’elle soit immédiatement exploitable côté administration.
- [x] Ajouter une vue ou des indicateurs administratifs de provenance Jinko, sans créer de réservation fournisseur.
- [x] Couvrir par tests les échecs réseau, la sélection, la traçabilité et l’interdiction d’actions transactionnelles.
- [x] Vérifier le parcours dans le navigateur, puis publier la version validée.

## Parcours Jinko sélection vers devis administrateur
- [x] Auditer le transfert actuel d’une offre Jinko sélectionnée vers la demande 3M Booking et la fiche administrative.
- [x] Rendre la demande de devis issue de Jinko plus explicite pour le client, avec référence, tarif indicatif et rappel de revalidation.
- [x] Ajouter au back-office une lecture opérationnelle de l’offre Jinko, de sa fraîcheur et de l’action de revalidation attendue.
- [x] Préserver une traçabilité de l’action conseiller sans créer de réservation, de paiement ou de voyage fournisseur.
- [x] Couvrir la sélection, le transfert, les états de revalidation et les contrôles de non-transactionnalité par tests.
- [x] Publier la version validée du parcours Jinko sélection-vers-devis.

## Suivi Jinko dans les espaces client et administrateur
- [x] Auditer les données de demandes 3M Booking visibles dans l’espace client et le back-office.
- [x] Ajouter une carte client de suivi de demande Jinko avec référence, offre sélectionnée, fraîcheur et prochaine action humaine.
- [x] Ajouter un filtre et des indicateurs administratifs dédiés aux demandes Jinko à revalider.
- [x] Rendre visible la revalidation conseiller et son horodatage dans les deux espaces selon les droits d’accès.
- [x] Ajouter des actions de communication prudentes vers le client, sans promettre une disponibilité ni créer de réservation.
- [x] Tester les droits, le filtrage, les états et la synchronisation client-administration.
- [x] Vérifier les deux espaces et publier la version validée.
- [x] Corriger l’ordre de rendu de la page Vols afin que 3M Booking et la recherche Jinko apparaissent avant le pied de page.
- [x] Renouveler le cache PWA puis confirmer que la version publiée affiche 3M Booking avant le pied de page.
- [x] Diagnostiquer et corriger le bouton « Vérifier » de la recherche Jinko lorsque la requête ne démarre pas ou ne produit aucun retour visible.
- [x] Cartographier les routes, procédures tRPC et zones administratives du site pour l’audit complet
- [x] Vérifier les parcours publics, l’espace client et l’administration sur ordinateur et mobile
- [x] Examiner les journaux, la PWA, les réponses API et les erreurs console reproductibles
- [x] Corriger les défauts confirmés, ajouter les tests de non-régression et publier le bilan d’audit
- [x] Corriger la route publique `/3m-booking` qui renvoie actuellement une page 404
- [x] Vérifier les attributs `src` vides détectés dans la console : non reproduits lors d’une session fraîche après correction de route
- [x] Vérifier la pile d’actions flottantes mobile : aucun chevauchement entre les commandes n’est reproduit sur les parcours publics contrôlés
- [x] Retirer les mentions internes encore visibles dans le panneau d’assistance de la page Billets

## Parcours Procédures côté client et administration
- [x] Auditer les pages client, les formulaires et les données de procédure déjà synchronisées avec le back-office.
- [x] Clarifier le choix pays-procédure et la prochaine action dans le parcours client, sans promettre d’éligibilité ni de visa.
- [x] Rendre le suivi de procédure et les documents attendus plus lisibles dans l’espace candidat.
- [x] Ajouter ou renforcer les actions directes de traitement, de statut et de note pour les conseillers dans le back-office.
- [x] Assurer la synchronisation sécurisée des étapes, commentaires et prochaines actions entre client et administration.
- [x] Synchroniser chaque mise à jour de statut via l’administration avec le dossier 360°, son historique et la notification client associée.
- [x] Tester les droits, formulaires, parcours et synchronisations de procédure.
- [x] Vérifier les vues publiées côté client et administration, puis publier la version validée.

## Évaluations pré-inscription et validations administratives
- [x] Auditer la déclaration « évaluation déjà effectuée », les données de dossier et les validations existantes.
- [x] Distinguer côté client l’évaluation déclarée de l’évaluation effectivement validée par un administrateur.
- [x] Définir les transitions de dossier autorisées après chaque validation humaine, avec historique obligatoire.
- [x] Ajouter des commandes administratives explicites pour valider, corriger ou refuser une évaluation externe avant de faire avancer le dossier.
- [x] Synchroniser de manière sécurisée l’état validé, les notes autorisées et la prochaine action dans l’espace candidat.
- [x] Tester les droits, les validations, les refus, les transitions et l’historique sans valider automatiquement un résultat.
- [x] Vérifier les parcours client et administrateur, puis publier la version validée.

## Renforcement du poste de travail administrateur
- [x] Auditer les compteurs, les listes, les filtres et les actions de traitement actuellement disponibles.
- [x] Ajouter une vue de priorités opérationnelles avec dossiers nécessitant une action humaine, sans actualisation automatique.
- [x] Rendre les actions directes de traitement, notes, communication et navigation plus accessibles depuis la fiche 360°.
- [x] Renforcer la traçabilité des actions critiques et la synchronisation vers le dossier client.
- [x] Tester les permissions, les contrôles de transition et les actions rapides administratives.
- [x] Vérifier le poste publié, puis publier la version validée.
- [x] Remplacer toute simulation d’envoi de reçu de paiement par une mutation serveur réelle, traçable et soumise à confirmation explicite.
- [x] Ajouter une file de priorités manuelle pour les dossiers, revalidations et paiements nécessitant une action humaine.
- [x] Diagnostiquer l’écart entre le checkpoint dd988fc8 et le bundle administrateur servi publiquement, puis revalider visuellement la file de priorités avant de la déclarer disponible.

## Stabilisation contact et pilotage administrateur
- [x] Placer `OfficeContactProvider` dans le layout global et vérifier l’absence d’erreur de contexte sur `/contact`, `/about`, `/panier` et `/login`.
- [x] Ajouter des échéances calculées et des indicateurs visuels explicites à la file de priorités manuelle, sans déclenchement automatique.
- [x] Renforcer la recherche et les filtres de tri du registre administrateur, avec des critères stables et accessibles.
- [x] Effectuer l’envoi réel d’un reçu de paiement uniquement sur une transaction de test `SUCCESS` validée manuellement, après confirmation explicite de l’identifiant et de l’adresse de réception contrôlée.
- [x] Corriger le retour vers l’accueil après authentification administrateur et préserver la session vérifiée jusqu’à son expiration réelle ou une déconnexion explicite.

## Suivi des reçus et échéances administratives
- [x] Créer et valider une compétence réutilisable pour la validation manuelle de paiement, l’envoi de reçu et la traçabilité d’audit.
- [x] Ajouter au registre de paiements un filtre « reçu envoyé » et l’horodatage SMTP exact par dossier.
- [x] Afficher les échecs de remise de reçu et permettre une relance manuelle explicitement confirmée, sans contournement des contrôles de paiement.
- [x] Créer une vue administrative des échéances de traitement regroupées par conseiller, sans notification ni transition automatique.

## Exports et supervision administrative
- [x] Mettre à jour la compétence réutilisable de suivi sécurisé des paiements avec l’export et la supervision SMTP.
- [x] Ajouter un export CSV limité aux données administratives nécessaires du registre des paiements.
- [x] Ajouter un filtre de priorité à la vue des échéances par conseiller.
- [x] Afficher un widget SMTP avec taux de réussite et dernières erreurs de remise, sans exposer de contenu d’e-mail sensible.

## Analytique d’échéances et SMTP
- [x] Mettre à jour la compétence de supervision des paiements avec l’export d’échéances, les badges de priorité et la tendance SMTP.
- [x] Ajouter un export CSV filtré de la vue des échéances par conseiller.
- [x] Ajouter des badges de couleur accessibles pour chaque priorité d’échéance.
- [x] Ajouter un graphique de taux de réussite SMTP sur 30 jours à partir des journaux réels de remise.

## Accès public à l’évaluation gratuite
- [x] Auditer les routes publiques et les deux liens d’évaluation de la page d’accueil.
- [x] Diriger le hero et le menu vers le formulaire d’évaluation gratuit sans compte.
- [x] Tester les redirections et vérifier la version publiée du formulaire public.
- [x] Diagnostiquer l’écart entre le checkpoint 90f891f2 et le bundle servi par le domaine de déploiement, puis revalider les anciennes URLs d’évaluation.

## Expérience du formulaire d’évaluation gratuite
- [x] Ajouter une confirmation visuelle accessible après la soumission réussie du formulaire gratuit.
- [x] Activer un défilement fluide vers le formulaire et préremplir le type de projet selon le bouton d’entrée.
- [x] Valider en temps réel les champs Email et WhatsApp avant soumission.

## Audit exhaustif du site public et du back-office
- [x] Inventorier les routes publiques du sitemap, les routes protégées et les composants fonctionnels critiques.
- [x] Vérifier le chargement, les CTA, les liens internes et les formulaires des pages publiques listées par l’utilisateur, sans soumettre de données de test externes.
- [x] Identifier et consolider les routes, composants ou contenus réellement redondants sans retirer de parcours utile.
- [x] Vérifier les vues et actions du back-office sans déclencher d’opération sensible.
- [x] Tester, publier et documenter les corrections réellement vérifiées.
- [x] Diagnostiquer le bundle obsolète encore servi sur `/avis` après le checkpoint dcc5e2a5 et revalider la transparence publique.
- [x] Corriger le CTA du Blog qui dirige encore vers `/evaluation` afin qu’il ouvre le formulaire gratuit public.
- [x] Retirer les témoignages, notes et statistiques clients non vérifiés de la page `/avis` et rétablir une page d’information non trompeuse.
- [x] Corriger le CTA de la section de confiance de l’accueil afin qu’il ouvre le formulaire gratuit public.
- [x] Retirer les publications, avis, métriques sociales et confirmation d’inscription e-mail simulés de l’accueil, puis conserver uniquement des actions transparentes et réelles.
- [x] Corriger l’état de synchronisation admin qui reste « initial » quand une lecture secondaire tarde, sans masquer les données principales disponibles.
- [x] Retirer ou remplacer les indicateurs de réussite et satisfaction non sourcés affichés dans le hero public.
- [x] Retirer les composants publics d’évaluation, hero, assistant et procédures non référencés après confirmation statique de leur absence de route active.
- [x] Corriger les liens d’évaluation restants du pied de page, de la navigation et du suivi candidat lorsqu’ils doivent ouvrir le formulaire gratuit public.
- [x] Poursuivre les corrections d’audit sans supprimer de route, page, composant ou fonctionnalité supplémentaire sans confirmation explicite de l’utilisateur.

## Avis modérés, CTA partagés et FAQ publique
- [x] Créer un formulaire de recueil d’avis sans publication automatique et une modération administrateur autorisée.
- [x] Centraliser les CTA publics dans un composant réutilisable accessible et cohérent.
- [x] Remplacer les sections de témoignages de l’accueil par une FAQ dynamique et interactive sans contenu client inventé.
- [x] Tester les contrôles de modération, les CTA et la FAQ avant publication.

## Transparence À propos, Tarifs et footer unique
- [x] Vérifier les chiffres, garanties, certifications et reconnaissances mentionnés dans `/about` avant de les conserver.
- [x] Reformuler les contenus non vérifiables de `/about` selon le principe de transparence appliqué à `/avis` et `/canada`.
- [x] Identifier les trois footers rendus sur l’accueil et les consolider en un seul pied de page partagé.
- [x] Auditer les promesses de remboursement et de frais de `/tarifs`, puis les reformuler avec une information de politique vérifiable.
- [x] Tester et publier les pages À propos, Tarifs et Accueil corrigées.
- [x] Forcer une révision de cache du bundle public et revalider `/about`, `/tarifs` et le footer unique sur le domaine de déploiement.
- [x] Surveiller le rétablissement du domaine publié, puis vérifier les pages transparentes sans supprimer de route ni de composant fonctionnel supplémentaire.

## Coordonnées centralisées et transparence documentaire
- [x] Centraliser les coordonnées légales et de contact dans une configuration partagée, puis migrer les composants publics concernés.
- [x] Créer la page `/sources-officielles` avec des liens institutionnels vérifiés par destination et les limites d’information associées.
- [x] Ajouter une FAQ interactive complète sur `/tarifs` concernant les frais tiers et les limites de remboursement.
- [x] Tester et publier les coordonnées centralisées, les sources officielles et la FAQ tarifaire.
- [x] Diagnostiquer la route `/sources-officielles` absente du bundle publié et revalider les pages publiques associées.
- [x] Remplacer l’affichage résiduel « Heure de Douala » par le fuseau horaire du bureau sélectionné dans la configuration centralisée.

## Maintenance interactive des sources officielles
- [x] Créer et valider une compétence réutilisable de maintenance des sources institutionnelles et signalements documentaires.
- [x] Ajouter un filtre interactif par destination et la date de dernière vérification à chaque source officielle.
- [x] Ajouter un bouton de signalement de lien expiré qui n’altère aucune source sans validation humaine.
- [x] Ajouter des infobulles accessibles expliquant les termes techniques de la FAQ tarifaire.
- [x] Tester les interactions documentaires et tarifaires vérifiées avant publication.

## Coordonnées Ottawa dans le pied de page
- [x] Afficher le fixe du bureau Ottawa dans le pied de page partagé, sans remplacer le WhatsApp principal Yaoundé.
- [x] Vérifier et publier les sources interactives ainsi que les coordonnées Ottawa du footer.
- [x] Forcer une révision de diffusion afin que `/sources-officielles` ne présente plus l’écran de mise à jour sur le domaine public.
- [x] Corriger le formatage des dates de vérification des sources afin que la page ne bascule plus vers l’écran de secours.

## Footer unique et complet
- [x] Inventorier tous les composants de footer et les pages qui les montent actuellement.
- [x] Conserver un seul footer partagé complet avec les coordonnées Yaoundé et Ottawa, les liens légaux et les services.
- [x] Tester les routes publiques représentatives pour confirmer l’absence de footer dupliqué, puis publier la correction.
- [x] Fusionner visuellement l’alerte anti-fraude, l’appel de contact et les colonnes du footer en une seule surface continue, sans sections perçues comme plusieurs pieds de page.
- [x] Monter le footer canonique au niveau global et retirer son rendu local de l’accueil afin d’afficher exactement un footer complet sur chaque route publique.
- [x] Réduire les sections de coordonnées de l’accueil qui dupliquent visuellement le footer, en conservant des liens fonctionnels vers Contact et Sources officielles.
- [x] Forcer la diffusion du bundle d’accueil compact et du footer global, puis revalider le domaine public.

## Mini-plan du site dans le footer
- [x] Auditer les raccourcis de navigation essentiels à exposer dans le footer unique.
- [x] Ajouter un mini-plan de site accessible et responsive dans le footer partagé.
- [x] Tester et publier le mini-plan de site sur le domaine public.
- [x] Réviser le cache PWA pour évacuer le bundle public obsolète et diffuser le mini-plan.

## Interactions du footer
- [x] Concevoir des animations de survol fluides, discrètes et respectueuses de la préférence de mouvement réduit.
- [x] Appliquer les animations aux raccourcis du mini-plan et vérifier leur accessibilité.
- [x] Tester, publier et vérifier le rendu des interactions du footer.
- [x] Réviser la PWA pour évacuer le bundle public antérieur ne contenant pas les animations de raccourcis.

## Enrichissement interactif du footer
- [x] Auditer le routage public et la structure actuelle des raccourcis du footer.
- [x] Créer une page `/plan-du-site` complète, structurée et accessible.
- [x] Ajouter des infobulles descriptives accessibles aux raccourcis du footer.
- [x] Enrichir les icônes sociales de micro-animations interactives respectueuses du mouvement réduit.
- [x] Tester, publier et vérifier publiquement le plan du site et les interactions du footer.
- [x] Réviser la PWA pour évacuer le bundle public qui conserve l’ancien plan du site.
- [x] Basculer la révision de diffusion vers le service worker statique principal, car le nouveau chemin v15 est réécrit en HTML en production.

## Navigation bilingue et engagement du footer
- [x] Auditer les composants de plan du site, footer et les mécanismes d’analytique existants.
- [x] Créer une compétence réutilisable pour les évolutions de footer, les preuves de diffusion et les garde-fous PWA.
- [x] Ajouter une recherche interactive et accessible au plan du site.
- [x] Ajouter une bascule linguistique français-anglais au plan du site et aux infobulles du footer.
- [x] Ajouter un suivi léger et respectueux de la vie privée des clics sur les raccourcis du footer.
- [x] Tester, publier et vérifier publiquement la navigation bilingue et le suivi d’engagement.
- [x] Rétablir l’alias de routeur Jinko attendu par le composant de recherche d’hôtels afin de valider TypeScript.
- [x] Réviser la diffusion PWA pour évacuer le bundle public précédant la navigation bilingue.

## Tableau de bord d’engagement, recherche et navigation bilingue
- [x] Auditer l’analytique, l’administration, la recherche et la navigation existantes.
- [x] Vérifier l’accessibilité publiée de la page /plan-du-site et de son lien dans le footer.
- [x] Ajouter une interface admin protégée pour visualiser les statistiques d’engagement du footer.
- [x] Étendre la recherche du plan du site avec un dictionnaire de synonymes bilingue.
- [x] Traduire l’intégralité du menu principal de navigation selon la langue sélectionnée.
- [x] Mettre à jour la compétence réutilisable avec ce workflow et ses contrôles de confidentialité.
- [x] Tester, publier et vérifier les droits admin et les parcours publics.
- [x] Aligner les régressions de navigation sur les libellés bilingues centralisés.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur aux statistiques et au menu bilingue.

## Traitement agence, statuts de procédure et remise d’évaluation
- [x] Diagnostiquer et corriger les actions « Rattacher » et « Activer » inactives pour les nouveaux comptes pré-dossier.
- [x] Auditer les dossiers, documents, statuts par pays et remises d’évaluation existants.
- [x] Autoriser les administrateurs à enregistrer de manière traçable les documents déposés physiquement en agence.
- [x] Ajouter les statuts « Recherche d’employeur » et « Validation de l’ADEM » pour les procédures luxembourgeoises, sans les exposer aux dossiers non concernés.
- [x] Permettre la validation humaine d’une évaluation dans le dossier d’un candidat, y compris après création de compte.
- [x] Permettre l’envoi contrôlé de l’évaluation validée à la fois dans l’espace client et par e-mail, avec trace de remise.
- [x] Tester les droits, synchronisations et déclenchements sensibles avant publication.
- [x] Protéger la route d’interface des dossiers agence afin de ne jamais exposer les informations candidats hors session administrateur.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur au parcours pré-dossier corrigé.

## Cockpit de pilotage des dossiers
- [x] Auditer les vues admin, priorités, échéances et données de blocage existantes.
- [x] Ajouter un cockpit de priorités avec prochaines actions, échéances et raisons de blocage explicites.
- [x] Ajouter des filtres et une actualisation manuelle pour orienter le traitement sans automatiser les décisions sensibles.
- [x] Tester, publier et vérifier le pilotage des dossiers côté administrateur.

## Parcours mobilité candidats, partenaires et employeurs
- [x] Auditer les consentements, profils candidats, partenaires de placement et transmissions de dossier existants.
- [x] Ajouter un suivi administratif traçable des étapes évaluation, soumission partenaire, sélection employeur et procédure.
- [x] Améliorer l’espace client avec le suivi lisible des retours de placement et des pièces attendues.
- [x] Créer un portail employeur réservé aux organisations vérifiées, limité aux profils autorisés par les candidats et l’administration.
- [x] Tester les droits, consentements, historiques et synchronisations avant publication.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur au parcours de placement sécurisé.

## Crédibilité, indexabilité et sécurité publique
- [x] Auditer le rendu initial, les métadonnées, les sitemaps et les preuves légales du site public.
- [x] Mettre en place un pré-rendu statique des pages publiques prioritaires et des métadonnées uniques par route.
- [x] Rendre les références légales RC/YAO/2019/A/2567 et NIU M112417203369H visibles en continu sur les pages publiques.
- [x] Créer sur l’accueil un module de vérification transparent sans statistiques non sourcées.
- [x] Ajouter au portail employeur des filtres de profils et des indicateurs reposant uniquement sur des données vérifiées.
- [x] Auditer la 2FA et documenter clairement la couverture effective pour les accès admin et employeur.
- [x] Étendre la bascule FR/EN à l’ensemble des pages publiques prioritaires.
- [x] Tester, publier et vérifier le rendu indexable, les protections et les parcours bilingues.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur à la passe de crédibilité.
- [x] Réviser la diffusion PWA pour diffuser la couverture bilingue du module de vérification.

## 2FA, favoris employeur et bilinguisme secondaire
- [x] Auditer les sessions admin et employeur, les profils, les traductions secondaires et les contrôles existants.
- [x] Mettre en place un enrôlement 2FA TOTP administrateur et employeur avec codes de récupération à usage unique.
- [x] Exiger une preuve TOTP ou un code de récupération pour les nouvelles authentifications sans écourter les sessions 24 h valides.
- [x] Ajouter des favoris privés pour les employeurs vérifiés sans révéler de profils ni de documents supplémentaires.
- [x] Traduire les contenus secondaires et infobulles de l’accueil et des espaces publics prioritaires.
- [x] Mettre à jour et valider une compétence réutilisable dédiée à la sécurité TOTP et au bilinguisme.
- [x] Tester, publier et vérifier les protections, favoris et parcours bilingues.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur à la 2FA et aux favoris.

## Notes et export des favoris employeur
- [x] Auditer les favoris employeur et les contrôles d’organisation existants.
- [x] Ajouter des notes privées par profil favori, limitées à l’organisation employeur propriétaire.
- [x] Ajouter un export CSV des favoris autorisés, sans documents, coordonnées ou identifiants candidats.
- [x] Tester les droits, l’isolement organisationnel et le contenu de l’export.
- [x] Publier et vérifier l’espace employeur enrichi.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur aux notes et à l’export.

## Partage collaboratif des favoris employeur
- [x] Auditer les comptes employeurs, favoris et limites d’organisation existantes.
- [x] Ajouter un partage de favoris limité aux collaborateurs actifs de la même organisation.
- [x] Afficher les favoris partagés avec l’auteur et l’horodatage, sans exposer de nouveaux profils.
- [x] Tester l’isolement des organisations, la traçabilité et les droits de partage.
- [x] Publier et vérifier le partage collaboratif des favoris.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur au partage collaboratif.

## Partage collaboratif avancé
- [x] Auditer les partages, collaborateurs, notifications et contrôles de rôles existants.
- [x] Ajouter la révocation ciblée d’un partage par son auteur ou un gestionnaire d’organisation.
- [x] Ajouter des notifications internes pour les nouveaux partages reçus dans la même organisation.
- [x] Ajouter les rôles lecteur et gestionnaire aux collaborateurs et appliquer leurs droits au partage.
- [x] Mettre à jour et valider une compétence réutilisable dédiée au partage collaboratif sécurisé.
- [x] Tester, publier et vérifier les rôles, révocations et notifications internes.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur aux rôles et notifications.

## Gouvernance collaborative et journal d’activité
- [x] Auditer les journaux, collaborateurs et notifications internes existants.
- [x] Ajouter un journal d’activité exportable des partages, révocations et changements de rôles.
- [x] Permettre aux gestionnaires de suspendre puis réactiver un collaborateur sans supprimer son compte.
- [x] Ajouter un indicateur de notifications non lues et une action pour toutes les marquer comme lues.
- [x] Mettre à jour et valider une compétence réutilisable de gouvernance collaborative.
- [x] Tester, publier et vérifier l’export, la suspension et les notifications.
- [x] Réviser la diffusion PWA pour évacuer le bundle public antérieur à la gouvernance collaborative.

## Suivi et révision collaborative des accès
- [x] Auditer les contrats d’événements, les accès suspendus et les libellés bilingues existants.
- [x] Ajouter une vue filtrable des événements d’audit, limitée à l’organisation et aux données non sensibles.
- [x] Créer une révision manuelle des accès suspendus réservée aux gestionnaires, sans réactivation automatique ni suppression de compte.
- [x] Enrichir les libellés FR/EN des contrôles collaboratifs, états et messages d’erreur.
- [x] Créer et valider une compétence réutilisable du suivi et de la révision collaborative.
- [x] Tester, publier et vérifier les filtres, droits, bilinguisme et diffusion PWA.

## Passe d’accessibilité et de cohérence premium
- [x] Cartographier les parcours et boutons critiques des espaces public, administrateur, client et employeur.
- [x] Auditer les contrastes, focus clavier, libellés, retours d’erreur et affichages mobile des interfaces critiques.
- [x] Définir puis appliquer une palette premium accessible et cohérente aux composants partagés.
- [x] Corriger les boutons, liens ou états inaccessibles identifiés sans modifier les protections ni les parcours sensibles.
- [x] Valider les routes, contrôles d’accès, boutons critiques, TypeScript, tests et build avant publication.
- [x] Publier et vérifier la diffusion de la passe d’accessibilité et de style premium.

## Harmonisation des microcopies publiques FR/EN
- [x] Inventorier les libellés publics résiduels affichés dans une langue incohérente.
- [x] Traduire les microcopies prioritaires de navigation, footer, connexion et états d’aide.
- [x] Vérifier la bascule FR/EN sur desktop et mobile sans modifier les contenus légaux ou les données de dossiers.
- [x] Valider, publier et vérifier la diffusion de l’harmonisation bilingue.

## Domaine officiel et signaux SEO
- [x] Auditer les canoniques, sitemap, métadonnées, robots et redirections associés à .click et .com.
- [x] Définir www.3mtravelagency.com comme domaine officiel dans les signaux publics contrôlables par le site.
- [x] Vérifier les réponses HTTP, canoniques et sitemap publiés sans promettre le délai de réindexation Google.
- [x] Publier et consigner la correction de domaine officiel.
- [x] Configurer dans Manus une redirection permanente de .click vers https://www.3mtravelagency.com et vérifier la réponse HTTP 301 publique.

## Audit exhaustif des boutons et contrôles interactifs
- [x] Cartographier les routes et les contrôles prioritaires du site public, des espaces client, employeur et administrateur.
- [x] Tester les boutons, liens, modales et navigations non sensibles, y compris au clavier et sur mobile.
- [x] Corriger les contrôles inaccessibles ou sans retour clair identifiés lors de l’audit.
- [x] Couvrir les régressions des contrôles corrigés et vérifier les parcours protégés sans déclencher d’action métier.
- [x] Publier et vérifier la diffusion de la passe d’accessibilité fonctionnelle.

## Incident — écran de maintenance public
- [x] Comparer les réponses et contenus publics des variantes .com, .click et du domaine de prévisualisation.
- [x] Identifier puis corriger la source confirmée de la page de maintenance, sans modification DNS non justifiée.
- [x] Vérifier le retour de la page publique et des entrées protégées après correction.
- [x] Publier et consigner la résolution de l’incident.

## Page d’état publique
- [x] Auditer les routes, composants partagés et contenus de maintenance existants pour définir la page d’état.
- [x] Créer une page d’état accessible présentant les services, une maintenance planifiée et les contacts de support.
- [x] Ajouter un accès public cohérent sans exposer de détails techniques ou de données internes.
- [x] Tester, publier et vérifier la page d’état publique.

## Écran de chargement premium
- [x] Auditer le fallback de chargement et identifier la fuite de contenu non stylé.
- [x] Créer un écran de chargement premium, léger et accessible avec identité 3M.
- [x] Vérifier la réduction de mouvement, le rendu mobile et les transitions de routes.
- [x] Publier et vérifier l’écran de chargement premium.

## Réorganisation premium du bandeau légal
- [x] Déplacer le bandeau RC/NIU du haut de page vers le footer légal unique.
- [x] Rééquilibrer l’en-tête et l’accueil avec une composition premium, aérée et accessible.
- [x] Tester le rendu mobile et desktop, puis publier la réorganisation premium.

## Résumé d’erreurs de formulaire
- [x] Inventorier les formulaires publics et protégés concernés.
- [x] Intégrer le résumé d’erreurs avec liens vers les champs invalides.
- [x] Tester les états invalides et l’accessibilité clavier/lecteur d’écran.
- [x] Publier et vérifier le résumé d’erreurs.

## Écran de chargement premium
- [x] Auditer le fallback de chargement et identifier la fuite de contenu non stylé.
- [x] Créer un écran de chargement premium, léger et accessible avec identité 3M.
- [x] Vérifier la réduction de mouvement, le rendu mobile et les transitions de routes.
- [x] Publier et vérifier l’écran de chargement premium.

## Réorganisation premium du bandeau légal
- [x] Déplacer le bandeau RC/NIU du haut de page vers le footer légal unique.
- [x] Rééquilibrer l’en-tête et l’accueil avec une composition premium, aérée et accessible.
- [x] Tester le rendu mobile et desktop, puis publier la réorganisation premium.

## Résumé d’erreurs de formulaire
- [x] Inventorier les formulaires publics et protégés concernés.
- [x] Intégrer le résumé d’erreurs avec liens vers les champs invalides.
- [x] Tester les états invalides et l’accessibilité clavier/lecteur d’écran.
- [x] Publier et vérifier le résumé d’erreurs.

## Incident public urgent — rétablissement du site
- [x] Contrôler immédiatement le statut HTTP des domaines officiels et des routes publiques critiques.
- [x] Identifier la cause reproductible de toute erreur bloquante sans modifier les DNS à l’aveugle.
- [x] Corriger et tester la page d’état, le shell public et les entrées protégées.
- [x] Publier le correctif et confirmer honnêtement les routes réellement opérationnelles.

## Transitions premium entre pages
- [x] Auditer le composant de transition global et les préférences de mouvement existantes.
- [x] Intégrer une transition courte, fluide et non bloquante entre les routes.
- [x] Respecter la réduction de mouvement, le clavier, le mobile et les performances.
- [x] Tester, publier et vérifier le rendu public des transitions.

## Modernisation design premium
- [x] Auditer le système visuel, les composants partagés et les pages clés.
- [x] Définir une direction artistique premium et des tokens de couleur accessibles.
- [x] Améliorer les interfaces publiques et protégées prioritaires sans modifier les droits ni les actions métier.
- [x] Vérifier le responsive, les contrastes, la cohérence et les régressions.
- [x] Publier et vérifier la modernisation visuelle.

## Modernisation design premium
- [x] Auditer le système visuel, les composants partagés et les pages clés.
- [x] Définir une direction artistique premium et des tokens de couleur accessibles.
- [x] Améliorer les interfaces publiques et protégées prioritaires sans modifier les droits ni les actions métier.
- [x] Vérifier le responsive, les contrastes, la cohérence et les régressions.
- [x] Publier et vérifier la modernisation visuelle.

## Harmonisation des pages secondaires
- [x] Inventorier les pages secondaires et leurs composants visuels sans modifier les routes.
- [x] Définir les règles communes de composition, couleur, typographie et états d’interface.
- [x] Appliquer la nouvelle charte aux pages secondaires et composants concernés.
- [x] Vérifier responsive, accessibilité, liens, formulaires et régressions.
- [x] Publier et vérifier l’harmonisation des pages secondaires.

## Micro-interactions premium des pages secondaires
- [x] Auditer les cartes, boutons et états interactifs des pages secondaires.
- [x] Définir des animations de survol courtes, subtiles et compatibles avec l’accessibilité.
- [x] Intégrer les micro-interactions aux composants partagés et pages concernées.
- [x] Vérifier clavier, mobile, réduction de mouvement et régressions.
- [x] Publier et vérifier les animations de survol.

## Micro-interactions et finition typographique v34
- [x] Rafraîchir ou republier la diffusion publique v34 sans modifier les DNS à l’aveugle.
- [x] Améliorer la typographie, les espacements et la respiration des pages secondaires.
- [x] Ajouter un fondu d’apparition accessible aux cartes partagées.
- [x] Tester la diffusion publique réelle de v34 après publication.
- [x] Créer et valider la compétence réutilisable de finition premium.

## Incident /mon-dossier — écran de maintenance
- [x] Vérifier les réponses HTTP et le routage public de `/mon-dossier`.
- [x] Corriger le fallback afin qu’un visiteur non connecté reçoive un accès clair sans données.
- [x] Vérifier le parcours d’un utilisateur connecté sans exposer de données client.
- [x] Tester la diffusion publique et publier uniquement après preuve HTTP/rendu.

- [x] Ajouter un handler serveur explicite pour `/mon-dossier` afin d’éviter le 404 de la couche publique avant le fallback SPA.

## Incident multi-routes — pages blanches et navigation protégée
- [x] Vérifier `/document-upload`, `/mes-vols-favoris`, `/flights`, `/mon-espace?section=profile` et `/flights#3m-booking` en public et en preview.
- [x] Corriger les fallbacks privés et empêcher les pages blanches ou boucles de redirection sans exposer de données.
- [x] Corriger l’ancre et le rendu de la section 3M Booking sur `/flights`.
- [x] Tester chaque URL signalée, publier et confirmer les réponses réellement servies.

## Compétence et amélioration des parcours protégés
- [x] Créer et valider une compétence réutilisable pour diagnostiquer et corriger les routes protégées, le pré-rendu, les caches et les erreurs 503/404.
- [x] Ajouter un skeleton premium lors du chargement des routes protégées, notamment `/flights` et `/mon-espace`.
- [x] Ajouter un export PDF sécurisé de la liste des vols favoris, sans données sensibles inutiles.
- [x] Ajouter des notifications toast de succès ou d’erreur après le téléversement d’un document sur `/document-upload`.
- [x] Tester, publier et livrer la compétence avec la version du projet.

## Audit de régression du site
- [x] Établir la matrice des routes publiques, protégées et administratives à contrôler.
- [x] Vérifier les statuts HTTP, shells pré-rendus, erreurs console et navigation des routes critiques.
- [x] Corriger les erreurs effectivement reproduites et ajouter des tests de régression.
- [x] Rejouer l’audit local/public, publier si nécessaire et livrer l’état de chaque route.

## Correction de positionnement visuel
- [x] Identifier les pages et composants présentant des décalages, superpositions ou débordements.
- [x] Corriger les conteneurs, espacements, alignements et points de rupture responsive concernés.
- [x] Vérifier le rendu desktop/mobile et publier la correction.

## Correction visuelle ciblée — positionnement
- [x] Stabiliser le layout global afin d’éviter les décalages de hauteur, les espacements incohérents et les débordements desktop/mobile.
- [x] Vérifier les pages publiques et protégées après correction et publier la version validée.

## Incident global — faux écran « mise à jour requise »
- [x] Diagnostiquer le fallback qui remplace `/flights` malgré une session connectée.
- [x] Corriger la récupération de chunks, le service worker et la détection de version sans rediriger inutilement l’utilisateur.
- [x] Vérifier `/flights` et les routes protégées avec une session restaurée, puis publier la correction.
- [x] Rejouer les contrôles publics et confirmer l’absence de faux écran de cache sur les routes critiques.

## En-tête responsive — boutons masqués
- [x] Identifier les contrôles comprimés ou recouverts dans le header selon la largeur d’écran.
- [x] Réorganiser la navigation, les actions, la langue, le panier, le thème et le profil sans supprimer de fonctionnalité.
- [x] Vérifier desktop/tablette/mobile, l’accessibilité clavier et publier la correction.
- [x] Réorganiser le header en deux rangées : navigation principale puis actions utilisateur, avec repli mobile accessible.

## Compétence responsive accessible et confort mobile
- [x] Créer et valider une compétence réutilisable pour les headers responsives, les contrôles clavier et les boutons flottants.
- [x] Éloigner les boutons flottants des CTA sur mobile sans perdre l’accès aux actions.
- [x] Ajouter un mode compact de header pour les écrans tablette.
- [x] Renforcer l’ordre de tabulation, les focus visibles et les annonces ARIA du header.
- [x] Tester les breakpoints et publier les corrections avec la compétence.

## Préférences des widgets et feedback du header
- [x] Ajouter un réglage utilisateur pour masquer ou réafficher les widgets flottants.
- [x] Améliorer la transition du mode compact du header sur tablette en respectant les préférences de mouvement.
- [x] Harmoniser les états hover, focus-visible et active/clic de tous les boutons du header.
- [x] Mettre à jour et valider la compétence responsive accessible, tester et publier.

## Tests responsive et audit WCAG du header
- [x] Ajouter un test navigateur automatisé du bouton de masquage des widgets.
- [x] Mémoriser séparément la visibilité des widgets pour mobile et tablette, avec migration sûre de l’ancienne préférence.
- [x] Exécuter un audit automatisé des contrastes hover/focus/clic du header et corriger les écarts confirmés.
- [x] Mettre à jour et valider la compétence responsive accessible, tester et publier.

## Lisibilité premium — Vérification des profils
- [x] Identifier les textes et surfaces à faible contraste dans la section de vérification.
- [x] Renforcer la palette navy/or/blanc et la hiérarchie typographique sans changer le contenu.
- [x] Vérifier les contrastes desktop/mobile et publier la correction.

## Harmonisation premium et contraste élevé
- [x] Inventorier les surfaces secondaires, le footer et les formulaires publics à harmoniser.
- [x] Ajouter un mode contraste élevé persistant dans les paramètres utilisateurs.
- [x] Appliquer les tokens navy/or/blanc aux sections secondaires, au footer et aux formulaires concernés.
- [x] Auditer automatiquement les contrastes WCAG du footer et des formulaires, corriger les écarts confirmés.
- [x] Mettre à jour et valider la compétence de design accessible, tester et publier.

## Enrichissement espace procédure Canada

- [x] Ajouter des visuels Canada premium, originaux et accessibles dans la page `/canada`.
- [x] Détailler les principaux parcours Canada à partir des sources IRCC et du contenu fourni, sans promesse de résultat.
- [x] Ajouter une section ressources officielles et une présentation responsive avec tests de régression.

## FAQ dynamique — procédures Canada

- [x] Définir des réponses FAQ exactes, transparentes et alignées sur les sources officielles canadiennes.
- [x] Intégrer des menus déroulants accessibles et dynamiques dans `/canada`.
- [x] Tester l’ouverture, la fermeture, le clavier, le responsive et publier la FAQ.

## Écran de chargement premium

- [x] Remplacer le petit monogramme de chargement par le logo 3M complet, agrandi et correctement cadré.
- [x] Moderniser l’indicateur de progression avec une hiérarchie visuelle plus premium et une alternative accessible.
- [x] Vérifier desktop/mobile, la réduction de mouvement et publier la correction globale.

## Modernisation espace administrateur

- [x] Inventorier les écrans admin, les actions de traitement, les états de chargement et les erreurs d’accessibilité.
- [x] Améliorer l’organisation, la lisibilité et l’accès aux actions sans modifier les autorisations ni exposer de données sensibles.
- [x] Vérifier les parcours admin, la synchronisation client, les contrôles clavier et publier les corrections confirmées.

## Recherche globale espace administrateur

- [x] Définir les destinations admin recherchables sans exposer de données sensibles.
- [x] Ajouter une palette de recherche globale avec raccourci Ctrl/Cmd+K et navigation clavier.
- [x] Tester la recherche, les autorisations, l’accessibilité et publier la fonctionnalité.

## Pilotage synchronisé admin-client-partenaire

- [x] Cartographier les statuts, rôles, sources de vérité et actions existantes pour chaque espace.
- [x] Définir un contrat de synchronisation commun, sécurisé et traçable entre dossier admin, espace client et espace partenaire.
- [x] Améliorer le centre de pilotage, les alertes, les échéances et la visibilité partenaire sans exposer les notes ou documents privés.
- [x] Tester la cohérence des statuts, les autorisations, la confidentialité et les parcours de traitement avant publication.

## Vue Kanban dossiers clients

- [x] Cartographier les statuts Kanban et réutiliser la mutation de synchronisation existante.
- [x] Ajouter une vue Kanban avec glisser-déposer, alternative clavier et confirmation des changements sensibles.
- [x] Conserver l’historique, les notifications client et les autorisations lors d’un déplacement.
- [x] Tester le Kanban, la confidentialité, l’accessibilité et publier la fonctionnalité.

## Architecture de routes inspirée de la référence ease.travel

- [x] Analyser la navigation, les parcours et les regroupements de services visibles sur `ease.travel/fr`.
- [x] Comparer cette structure aux routes 3M Travel existantes et repérer les doublons ou impasses.
- [x] Définir puis implémenter une architecture de routes originale, premium, bilingue et cohérente avec les guards existants.
- [x] Tester les routes, CTA, formulaires, redirections, accès protégés et affichages responsive avant publication.

## Audit global routes, boutons et synchronisation

- [x] Construire une matrice de toutes les routes publiques, protégées et administratives à contrôler.
- [x] Vérifier les CTA, boutons, raccourcis clavier, redirections, formulaires et erreurs console.
- [x] Vérifier la synchronisation des statuts, documents, notifications et échéances entre client et administrateur.
- [x] Corriger les erreurs confirmées, ajouter les régressions, rejouer l’audit local et publier un bilan ; la validation production reste conditionnée au rétablissement de l’hébergement.

## Corrections issues de l’audit global — 26 août 2026

- [x] Corriger les contrastes WCAG insuffisants des boutons bleus restants sur `/contact`.
- [x] Rejouer les tests navigateur publics et vérifier que les routes et CTA restent fonctionnels après correction.

## Reprise après suspension d’hébergement

- [x] Vérifier la disponibilité publique à plusieurs reprises sans effectuer d’action sensible ; une surveillance continue nécessite une fréquence et un canal de notification à définir.
- [x] Relancer l’audit complet local dès que le domaine de preview répond normalement ; la reprise production reste bloquée par la suspension d’hébergement.
- [x] Documenter puis corriger les régressions confirmées avant publication.

## Contrôle ciblé admin-client

- [x] Vérifier la disponibilité et l’accès contrôlé des routes `/admin`, `/admin/dossiers` et des vues admin associées.
- [x] Vérifier la cohérence des statuts, documents, notifications, échéances, paiements et historiques avec l’espace client.
- [x] Rejouer les tests ciblés et documenter séparément les blocages d’hébergement et les erreurs applicatives.

## Recontrôle admin-client — 26 août 2026

- [x] Recontrôler les réponses des routes `/admin`, `/admin/dossiers` et des vues administratives associées ; le domaine répond 200 mais sert encore la page de suspension d’hébergement.
- [x] Rejouer les tests de synchronisation des dossiers clients, statuts, documents, notifications et historiques ; 7 tests ciblés passent.
- [x] Documenter précisément les résultats production et preview, sans exposer de données privées.

## Kanban admin enrichi

- [x] Étendre la compétence réutilisable avec les règles d’historique, de filtrage et d’échéance.
- [x] Afficher l’historique visuel des déplacements sur chaque carte Kanban.
- [x] Ajouter les filtres par destination et conseiller assigné.
- [x] Ajouter les échéances, alertes de proximité et contrôles d’autorisation associés.
- [x] Tester les interactions, la confidentialité et publier la version enrichie.

## Vérification Kanban enrichi
- [x] Vérifier le Kanban enrichi : historique visuel, filtres destination/conseiller et alertes SLA
- [x] Ajouter et exécuter les tests de filtrage Kanban et de calcul des échéances
- [x] Vérifier la disponibilité du domaine public : contrôle effectué le 26/08/2026, domaine encore suspendu pour facturation ; audit HTTP complet reporté jusqu’au rétablissement


## Échéances persistantes et timeline serveur
- [x] Créer une compétence réutilisable de pilotage des dossiers avec règles SLA, historique et validation humaine
- [x] Ajouter une échéance métier persistante au schéma et aux procédures administrateur — le champ opérationnel `cases.dueAt` existant est réutilisé, sans migration destructive
- [x] Permettre la modification sécurisée de l’échéance depuis la fiche détaillée du dossier
- [x] Alimenter la timeline visuelle avec l’historique serveur des statuts
- [x] Ajouter des infobulles accessibles pour les alertes SLA proches ou dépassées
- [x] Écrire et exécuter les tests, vérifier le rendu, puis publier


## SEO page d’accueil — métadonnées strictes
- [x] Ajouter 3 à 8 mots-clés ciblés dans la meta keywords de `/`
- [x] Ajouter un titre H2 descriptif de 80 caractères maximum sur `/`
- [x] Définir un document.title compris entre 30 et 60 caractères
- [x] Ajouter une meta description comprise entre 50 et 160 caractères
- [x] Tester les longueurs, le HTML initial et le rendu local, puis publier


## SEO structuré et partage social
- [x] Créer ou enrichir la compétence réutilisable de contrôle SEO pré-rendu et de données structurées
- [x] Ajouter les JSON-LD Organization et WebSite sur la page d’accueil
- [x] Harmoniser les titres, descriptions et mots-clés de `/canada`, `/procedures` et `/contact`
- [x] Ajouter Open Graph et Twitter Cards avec une image par défaut locale et durable
- [x] Tester le HTML initial, les longueurs, le JSON-LD et les cartes sociales, puis publier


## SEO dynamique, sitemap et FAQ structurée
- [x] Mettre à jour la compétence réutilisable avec les contrôles d’images sociales, sitemap, robots et FAQPage
- [x] Générer dynamiquement une image Open Graph/Twitter selon le titre de chaque page
- [x] Générer automatiquement sitemap.xml et robots.txt depuis les routes publiques indexables
- [x] Ajouter les données structurées JSON-LD FAQPage sur `/procedures`
- [x] Tester les routes, les URLs, les balises sociales et les données structurées, puis publier


## Partage social et navigation structurée
- [x] Mettre à jour la compétence SEO réutilisable avec les règles de secours d’image, partage et fil d’Ariane
- [x] Ajouter une image Open Graph/Twitter de secours lorsque le titre est absent
- [x] Ajouter des boutons Facebook, Twitter et LinkedIn sur les pages de contenu
- [x] Ajouter un JSON-LD BreadcrumbList sur les sous-pages publiques
- [x] Tester l’accessibilité, les URLs de partage, le HTML initial et publier


## Partage enrichi et contenu éditorial structuré
- [x] Mettre à jour la compétence SEO réutilisable avec copie de lien, animations et Article/BlogPosting
- [x] Ajouter un bouton « Copier le lien » avec confirmation visuelle de succès
- [x] Ajouter des animations de survol fluides et compatibles avec la réduction de mouvement
- [x] Ajouter un JSON-LD Article ou BlogPosting aux pages de contenu éditorial
- [x] Tester les interactions, le JSON-LD et le rendu, puis publier


## Évaluation adaptative par pays et projet
- [x] Auditer le formulaire public lié à `#evaluation-multi` et son pré-remplissage `project=travail`
- [x] Cartographier les champs et critères par pays, destination et type de projet
- [x] Implémenter des questions, documents et garde-fous adaptatifs sans promesse de résultat
- [x] Synchroniser les réponses structurées avec l’espace administrateur
- [x] Ajouter les tests client/serveur et vérifier les parcours avant publication

## Formulaire d’évaluation guidé par destination
- [x] Créer un catalogue documentaire dynamique selon le pays et le projet sélectionnés
- [x] Ajouter une étape de questions spécifiques pour le Canada et le Luxembourg
- [x] Transformer l’évaluation en parcours à étapes avec contrôle de validation progressif
- [x] Ajouter une barre de progression et des transitions accessibles entre les étapes
- [x] Tester les parcours, la persistance et le rendu, puis publier

## Formulaire d’évaluation guidé par destination
- [x] Créer un catalogue documentaire dynamique selon le pays et le projet sélectionnés
- [x] Ajouter une étape de questions spécifiques pour le Canada et le Luxembourg
- [x] Transformer l’évaluation en parcours à étapes avec contrôle de validation progressif
- [x] Ajouter une barre de progression et des transitions accessibles entre les étapes
- [x] Tester les parcours, la persistance et le rendu, puis publier

## Dépendance de test et état de maintenance
- [x] Inspecter le correctif joint sans exécuter son contenu et vérifier les dépendances existantes
- [x] Ajouter `@testing-library/dom` aux dépendances de développement et mettre à jour le verrouillage
- [x] Exécuter les validations de test après installation
- [x] Vérifier l’origine de l’écran de maintenance sur le domaine public
- [x] Publier la mise à jour technique et documenter le diagnostic
## Dépendance de test et état de maintenance
- [x] Inspecter le correctif joint sans exécuter son contenu et vérifier les dépendances existantes
- [x] Ajouter `@testing-library/dom` aux dépendances de développement et mettre à jour le verrouillage
- [x] Exécuter les validations de test après installation
- [x] Vérifier l’origine de l’écran de maintenance sur le domaine public
- [x] Publier la mise à jour technique et documenter le diagnostic

## Évaluation documentaire sécurisée et contrôle final
- [x] Mettre à jour la compétence réutilisable du parcours d’évaluation documentaire contrôlé
- [x] Ajouter les exigences et questions ciblées pour la France, la Belgique et l’Allemagne
- [x] Ajouter un récapitulatif modifiable avant la soumission finale
- [x] Ajouter un dépôt de documents sécurisé et relié au dossier d’évaluation
- [x] Configurer Gemini pour une analyse assistée structurée avec validation humaine obligatoire
- [x] Tester les autorisations, la persistance, les parcours et publier

## Orientation Gemini comparative en temps réel
- [x] Auditer les scores, seuils et affirmations non vérifiés du modèle fourni
- [x] Définir des suggestions comparatives sans conclusion réglementaire ni redirection automatique
- [x] Ajouter un aperçu Gemini de destinations alternatives dans le récapitulatif d’évaluation
- [x] Exiger la validation humaine et l’affichage de limites explicites avant toute utilisation administrative
- [x] Tester le temps réel, les garde-fous et les erreurs Gemini, puis publier

## Sources, historique et PDF des orientations
- [x] Associer chaque destination alternative à une source gouvernementale officielle vérifiable
- [x] Afficher les liens officiels dans les suggestions Gemini sans présenter une décision comme acquise
- [x] Créer un historique protégé des évaluations et comparaisons pour les candidats connectés
- [x] Ajouter un export PDF du récapitulatif et des recommandations Gemini
- [x] Mettre à jour la compétence, tester les autorisations et publier

## Pilotage admin et synchronisation CV-premier
- [x] Auditer les routes admin et le parcours d’évaluation actuel
- [x] Ajouter des raccourcis et liens de retour contextuels dans l’espace administrateur
- [x] Imposer la création de compte avant l’évaluation et rendre le CV prioritaire
- [x] Synchroniser le dépôt documentaire progressif avec l’espace candidat
- [x] Encadrer Gemini comme assistant de préparation avec validation humaine obligatoire

## Expérience de suivi candidat et navigation admin
- [x] Ajouter un indicateur de chargement clair pendant l’analyse CV par Gemini
- [x] Afficher le statut d’évaluation et les documents optionnels manquants au tableau de bord candidat
- [x] Ajouter un fil d’Ariane et des raccourcis administrateur accessibles au clavier
- [x] Augmenter la taille et la lisibilité de la typographie hero
- [x] Tester les interactions, l’accessibilité et les affichages responsive, puis publier

## Pilotage des validations CV et correction de dossiers
- [x] Créer ou mettre à jour une compétence réutilisable de pilotage admin-candidat auditable
- [x] Notifier le candidat lorsque son CV est validé et enregistrer l’événement
- [x] Ajouter un filtre admin pour les dossiers avec documents manquants
- [x] Permettre au conseiller de définir un délai de revue visible côté candidat
- [x] Ajouter des raccourcis admin accessibles et contextuels
- [x] Permettre la modification encadrée et la suppression confirmée de dossiers mal créés
- [x] Tester les autorisations, notifications, traçabilité et publier

## Poste 360° : corbeille, export et relances
- [x] Ajouter une corbeille de dossiers restaurables pendant une période limitée avec audit
- [x] Exporter en CSV les dossiers filtrés avec documents manquants
- [x] Ajouter une relance manuelle candidate sécurisée depuis la fiche dossier
- [x] Fiabiliser l’activation du pré-dossier avec validation explicite des champs requis
- [x] Enrichir les raccourcis et actions du poste 360° sans exposer de données sensibles
- [x] Tester les rôles, restauration, export et actions de la fiche puis publier

## Audit Canada : écrans blancs et actions inactives
- [x] Reproduire les défauts signalés sur `/canada` et les routes accessibles depuis cette page
- [x] Identifier les liens statiques, boutons inactifs et composants qui affichent une page vide
- [x] Corriger les destinations, états d’erreur et retours utilisateur concernés
- [x] Tester les routes, CTA et formulaires Canada avant publication

## Chargement progressif et CTA des procédures
- [x] Mettre à jour la compétence réutilisable avec la vérification des simulateurs et CTA publics
- [x] Auditer les liens, boutons et composants lourds des pages Schengen et Études
- [x] Ajouter les états de chargement progressif aux simulateurs lourds concernés
- [x] Corriger les liens statiques et CTA inactifs de Schengen et Études
- [x] Ajouter des tests de navigation automatisés pour les CTA Canada
- [x] Tester les pages, les liens et le rendu avant publication

## Lisibilité, reprise de simulateur et CTA mobile
- [x] Agrandir et clarifier la navigation et les zones interactives de l’en-tête
- [x] Ajouter un bouton de réessai accessible pour les erreurs de chargement des simulateurs
- [x] Signaler les erreurs de chargement de simulateur dans l’espace administrateur
- [x] Ajouter des tests navigateur mobile pour les CTA publics
- [x] Tester la lisibilité, l’accessibilité et les parcours de reprise avant publication

## Santé des simulateurs et CTA tablette
- [x] Créer une compétence réutilisable pour le suivi admin des simulateurs et les CTA responsive
- [x] Ajouter un indicateur de santé des simulateurs au tableau de bord administrateur
- [x] Ajouter un historique détaillé, filtrable et respectueux de la vie privée des incidents
- [x] Optimiser les zones de clic et les libellés CTA sur tablette
- [x] Ajouter des tests navigateur spécifiques au format tablette
- [x] Tester les contrôles admin, les routes et les régressions, puis publier

## Procédures pays : routes fiables et contenus documentés
- [x] Recenser les PDF fournis et les routes de détail de procédures actuellement accessibles
- [x] Corriger les pages blanches et fournir un fallback utile pour toute destination non encore enrichie
- [x] Extraire et vérifier les étapes, documents et sources de procédure depuis les PDF disponibles
- [x] Construire des pages pays avec emblème, visuel, étapes et liens officiels sans inventer de conditions
- [x] Relier chaque sélection ou bouton Détails à une route canonique fonctionnelle
- [x] Tester les pages, liens et CTA sur mobile/tablette/desktop, puis publier

## Annuaire de procédures enrichi
- [x] Créer ou mettre à jour une compétence réutilisable de recherche et présentation de procédures pays
- [x] Ajouter une recherche et des filtres par pays et type de visa dans l’annuaire
- [x] Harmoniser les emblèmes nationaux et visuels représentatifs des fiches destination
- [x] Afficher une date de mise à jour et une source officielle vérifiable sur chaque fiche
- [x] Tester la recherche, les filtres, la navigation et les rendus responsive, puis publier

## Indexation, données structurées et présence de marque
- [x] Vérifier l’accès Search Console, valider la propriété de domaine et consigner l’état initial de collecte des données
- [x] Auditer les JSON-LD et balises sémantiques pour les moteurs de recherche et conversationnels
- [x] Définir un plan d’optimisation Google Business Profile et annuaires professionnels de confiance
- [x] Documenter les mesures, responsabilités et priorités sans publier de profil externe sans confirmation
- [x] Inclure les fiches destination canoniques dans le sitemap public
- [x] Retirer les liens sociaux non vérifiés dans le footer et les données structurées, en conservant uniquement la page Facebook confirmée
- [x] Harmoniser les FAQ publiques et les données structurées avec la règle compte/CV obligatoire
- [x] Harmoniser le libellé du raccourci d’évaluation du footer avec la règle compte/CV obligatoire

## Annuaire, contact Yaoundé et export des fiches pays
- [x] Créer une compétence réutilisable pour la recherche de procédures, la carte de contact et l’export PDF prudent
- [x] Vérifier et améliorer la recherche accessible des 107 fiches par pays, région et type de visa
- [x] Intégrer une carte interactive de l’adresse confirmée de Yaoundé sur la page Contact
- [x] Ajouter un export PDF des informations publiques et vérifiables de chaque fiche pays
- [x] Tester les parcours, l’accessibilité, la carte et le contenu des PDF, puis publier

## Synonymes, comparaison et portail vérifié
- [x] Créer une compétence réutilisable pour la recherche par synonymes, la comparaison de deux destinations et les sources vérifiées
- [x] Ajouter des synonymes normalisés aux recherches de fiches pays
- [x] Ajouter un filtre accessible limitant les résultats aux portails institutionnels vérifiés
- [x] Permettre de sélectionner puis comparer exactement deux destinations côte à côte
- [x] Tester les filtres, la comparaison, les contrôles clavier et les routes, puis publier

## Suivi de dossier, navigation et persistance de session
- [x] Auditer les numéros de dossier, routes de suivi et contrôles d’accès client et administrateur existants
- [x] Rendre les numéros de dossier visibles et directement exploitables dans l’espace client
- [x] Ajouter un suivi par numéro de dossier et e-mail avec réponse non divulguante et accès contrôlé
- [x] Ajouter des raccourcis internes accessibles dans les espaces client et administrateur
- [x] Configurer ou confirmer la persistance de session à 24 heures avec déconnexion manuelle immédiate
- [x] Tester les autorisations, la navigation, l’expiration et la déconnexion, puis publier

## Changement d’adresse e-mail sécurisé
- [x] Auditer les identités candidat, les données liées et les vérifications existantes
- [x] Ajouter une demande de changement d’e-mail liée à la session candidat et au nouvel e-mail
- [x] Envoyer une confirmation à durée limitée vers la nouvelle adresse, sans révéler d’informations sensibles
- [x] Mettre à jour l’identité, les dossiers liés et l’audit uniquement après validation du lien
- [x] Ajouter les contrôles d’interface du profil, l’annulation et les messages de sécurité
- [x] Tester les autorisations, le doublon, l’expiration, la confirmation et publier

## Assistance pour perte d’accès à l’adresse e-mail
- [x] Auditer les formulaires, routes et contrôles administratifs d’assistance existants
- [x] Créer une demande publique minimale de récupération d’accès, sans changement automatique d’identité
- [x] Créer une file d’administration avec validation humaine, décision, motif et audit
- [x] Protéger la demande contre l’énumération, le spam et l’exposition de données de dossier
- [x] Ajouter les tests d’autorisation, de validation et de cycle de traitement, puis publier

## Pilotage complet de l’espace client
- [x] Auditer les dossiers, statuts, documents, communications, échéances et raccourcis réellement visibles au client
- [x] Unifier les priorités et prochaines actions client à partir des données synchronisées du serveur
- [x] Renforcer les états vides, erreurs, reprises et actualisation manuelle sans effacer les données existantes
- [x] Ajouter ou corriger les raccourcis client nécessaires vers le dossier, les documents, les messages et l’aide
- [x] Vérifier la cohérence des mises à jour administrateur vers l’espace client sans décision automatique
- [x] Tester les rôles, synchronisations, routes et affichages responsive, puis publier

## Prise de rendez-vous depuis l’espace client
- [x] Auditer les demandes de rendez-vous, calendriers et routes existants
- [x] Ajouter un module client lié au dossier avec motifs, créneaux préférés et canal de contact
- [x] Afficher le statut de la demande sans présenter la réservation comme confirmée avant revue humaine
- [x] Rendre la demande visible et actionnable dans la file administrative existante avec audit
- [x] Tester les autorisations, les validations, les états de confirmation et publier
- [x] Corriger le chevauchement des widgets flottants avec les actions d’accès client sur mobile

## Vérification des références et suivi de dossier
- [x] Auditer les références de dossiers, les e-mails associés et les recherches client existantes
- [x] Créer une interface administrateur de vérification de référence avec statut et diagnostic limité
- [x] Corriger les règles de résolution du suivi client sans révéler l’existence d’un dossier à un tiers
- [x] Ajouter des repères de pilotage administrateur pour les références non résolues ou non rattachées
- [x] Tester les cas de dossier, les autorisations, les erreurs génériques et publier
- [x] Rendre le formulaire numéro + e-mail réellement accessible sans compte, tout en conservant le contrôle serveur
- [x] Fiabiliser la détection des routes d’accès afin que les widgets flottants restent masqués sur mobile

## Simplification de l’accès au dossier et hero
- [x] Identifier les CTA publics « Suivre mon dossier » du header et du hero sans supprimer la route de suivi
- [x] Conserver un accès direct au dossier dans l’espace client connecté sans redemande d’identifiants
- [x] Retirer les CTA publics de suivi confirmés et renforcer la navigation interne de l’espace client
- [x] Agrandir la typographie principale du hero et vérifier son contraste responsive
- [x] Tester les parcours connecté, public, clavier et mobile, puis publier

## Accès client et inscription
- [x] Auditer le libellé « Accès client » et la route d’inscription qui affiche un message de maintenance
- [x] Renommer l’accès client en « Se connecter » dans les interfaces publiques
- [x] Corriger la route ou le chargement d’inscription sans supprimer le parcours existant
- [x] Tester connexion, inscription, erreurs et accessibilité mobile, puis publier

## Soumission d’inscription lisible et sûre
- [x] Auditer le bouton et la mutation d’inscription existants
- [x] Ajouter une progression de soumission, un bouton bloqué et une annonce accessible
- [x] Prévenir les doubles soumissions sans masquer les messages d’erreur
- [x] Tester la soumission, les erreurs et le rendu mobile, puis publier
- [x] Masquer les widgets flottants sur les parcours de connexion et d’inscription mobile afin de libérer tous les champs

## Inscription conditionnelle et évaluation par destination
- [x] Auditer le choix « évaluation déjà effectuée », les redirections et les configurations pays existantes
- [x] Orienter les candidats sans évaluation vers le formulaire complet après activation du compte
- [x] Orienter les candidats avec évaluation déclarée vers leur espace sans re-soumission
- [x] Renforcer les questionnaires par pays avec les éléments administratifs pertinents et sources officielles
- [x] Tester les deux parcours, les préremplissages pays et les limites de confidentialité, puis publier
- [x] Masquer les widgets flottants sur l’évaluation mobile afin de dégager tous les champs du formulaire

## Évaluation sous 24 heures et réponses validées
- [x] Auditer le modèle transmis, les scores, les délais, les messages et la file de validation actuels
- [x] Définir une réception immédiate et un objectif de revue sous 24 heures sans décision automatique
- [x] Créer des modèles e-mail, espace client et admin cohérents, sans promesse ni donnée non vérifiée
- [x] Renforcer la file de validation immédiate côté administrateur avec état, responsable, échéance et audit
- [x] N’envoyer toute réponse finale qu’après validation humaine explicite
- [x] Permettre à un administrateur autorisé de modifier une évaluation avant validation avec motif et audit
- [x] Tester les délais, les autorisations, les synchronisations et les modèles, puis publier
- [x] Persister chaque référence d’évaluation avant son envoi et la rendre résoluble dans le suivi client

## Évaluation dynamique assistée par Gemini
- [x] Auditer le modèle transmis et les appels Gemini existants avec leurs garde-fous
- [x] Définir les informations dynamiques utilisables, le consentement explicite et les interdictions de décision automatique
- [x] Générer un brouillon structuré d’analyse, de questions complémentaires et de pistes sourcées par destination
- [x] Présenter les brouillons dans l’administration pour modification et validation humaines avant diffusion
- [x] Afficher au client uniquement les informations validées et les prochaines actions réellement confirmées
- [x] Tester les consentements, les erreurs Gemini, les autorisations et les flux de validation, puis publier

## Fiabilité des références d’évaluation
- [x] Éliminer les collisions de références lors de soumissions simultanées ou multi-processus, puis couvrir le comportement par un test.

## Pilotage dynamique des évaluations 2026
- [x] Étendre la compétence réutilisable de pilotage admin-candidat avec les brouillons structurés, modèles de réponse, relances et indicateurs SLA.
- [x] Ajouter une relance manuelle administrateur du brouillon préparatoire avec session, motif, journal et sans diffusion candidate.
- [x] Intégrer des modèles de réponses internes par type de projet, toujours éditables avant validation humaine.
- [x] Ajouter un tableau de bord analytique interne des délais de revue, centré sur l’objectif opérationnel de 24 heures.
- [x] Ajouter la grille Luxembourg comme indicateur interne de préparation vérifiable, sans inéligibilité ou réorientation automatiques.
- [x] Tester droits, audits, modèles, relances, indicateurs SLA et garde-fous Luxembourg avant publication.
- [x] Corriger le doublon de navigation constaté sur la vue administrateur d’évaluations, sans modifier les parcours publics.

## Alertes de revue et gestion des modèles
- [x] Auditer les travaux planifiés, les notifications internes et les modèles administratifs existants.
- [x] Alerter les conseillers autorisés avant les échéances de revue à 24 heures, sans communication candidate automatique.
- [x] Permettre aux administrateurs de créer, modifier et supprimer des modèles de réponse de manière auditée.
- [x] Vérifier les autorisations, l’idempotence des alertes, l’assainissement des modèles et les parcours administratifs.

## Incident prioritaire — inscription et suivi de dossier
- [x] Reproduire et corriger le repli « maintenance » sur les liens de confirmation d’adresse.
- [x] Reproduire et corriger l’échec du suivi sécurisé par numéro de dossier et adresse e-mail.
- [x] Simplifier l’activation de compte et le renvoi de confirmation sans contourner la vérification de l’adresse.
- [x] Tester les parcours d’inscription, confirmation, suivi et les réponses non divulguantes avant publication.

## Parcours candidat pré-évalué et pièces justificatives
- [x] Auditer l’activation après évaluation préalable, la restitution dans l’espace candidat et le dépôt documentaire.
- [x] Activer et orienter le compte du candidat déclarant une évaluation préalable, avec un état de revue explicite mais non auto-validant.
- [x] Présenter les pièces demandées dans l’espace candidat et rappeler le dépôt sécurisé sans envoyer de décision automatique.
- [x] Corriger la remontée des pièces déposées vers la file administrative et assurer leur traçabilité.
- [x] Tester les flux d’activation, dépôt, accès administratif et confidentialité avant publication.

## Checklist documentaire dynamique de l’espace candidat
- [x] Auditer les règles documentaires par dossier et les composants de checklist existants.
- [x] Calculer les pièces requises, déposées, à compléter et à revoir à partir des données accessibles au candidat, sans exposer de données internes.
- [x] Afficher la checklist dynamique et ses raccourcis de dépôt dans l’espace candidat.
- [x] Tester les statuts de pièces, les raccourcis et l’accès candidat avant publication.

## Demandes de pièces spécifiques par conseiller
- [x] Auditer les droits administratifs, le dossier client et la checklist documentaire.
- [x] Réutiliser le registre audité de demandes de pièces propres à un candidat.
- [x] Permettre au conseiller de créer, modifier ou retirer une demande depuis l’administration.
- [x] Afficher les demandes actives dans la checklist candidate avec un raccourci de dépôt.
- [x] Tester les autorisations, l’audit, les statuts et la confidentialité avant publication.

## Domaine .com et fiches de procédures
- [x] Auditer les redirections, canoniques, métadonnées, sitemap et références résiduelles au domaine .click.
- [x] Renforcer les signaux techniques qui désignent exclusivement www.3mtravelagency.com comme domaine canonique.
- [x] Inventorier les ressources disponibles des 107 destinations et relier chaque fiche à son contenu vérifiable.
- [x] Enrichir les fiches de procédure sans inventer de règles ni présenter de décision ou de garantie.
- [x] Vérifier les 107 routes, les rendus publics et les documents SEO avant publication.
- [x] Éliminer l’écran de chargement transitoire des fiches pays publiques afin que leur contenu s’affiche immédiatement.

## Enrichissement institutionnel des procédures
- [x] Cartographier les 107 fiches, leurs portails institutionnels et le statut de vérification des sources.
- [x] Définir un format éditorial sourcé indiquant clairement les informations à confirmer par l’autorité compétente.
- [x] Collecter et intégrer des contenus institutionnels vérifiables pour chaque procédure publiée.
- [x] Vérifier les liens, dates de consultation, contenus et rendus des fiches enrichies avant publication.

## Badge de vérification des procédures
- [x] Auditer la date de source disponible et les emplacements d’affichage de chaque fiche.
- [x] Ajouter un badge accessible de dernière vérification dans la fiche et le pré-rendu de procédure.
- [x] Tester les 107 dates, les badges et l’absence de message de garantie avant publication.

## Revue éditoriale des indicateurs de procédure
- [x] Auditer les champs de coûts, délais, salaires et budgets affichés sur les fiches afin de retirer ou sourcer les données volatiles.

## Suivi administratif de révision des procédures
- [x] Auditer les sources, les dates et les interfaces administratives existantes.
- [x] Définir des états de révision explicites et leurs seuils de priorité.
- [x] Ajouter une vue ou un indicateur filtrable des procédures à réviser, avec accès direct au contrôle de la fiche.
- [x] Tester les calculs de dates, les filtres et les droits administratifs avant publication.

## Progression de la checklist documentaire
- [x] Auditer les statuts documentaires et le composant de checklist candidat.
- [x] Calculer un pourcentage de progression uniquement à partir des pièces réellement requises et de leurs statuts.
- [x] Afficher une barre de progression accessible dans l’espace client avec un libellé explicite.
- [x] Tester les cas vide, en cours, complet et les états à remplacer avant publication.

## Clarification d’une pièce documentaire
- [x] Auditer la checklist, la messagerie sécurisée et les files internes déjà disponibles.
- [x] Créer une demande de clarification liée à une pièce et au dossier du candidat.
- [x] Afficher une action de clarification accessible dans la checklist et un suivi de traitement côté client.
- [x] Diriger la demande vers l’équipe autorisée sans divulguer de notes internes.
- [x] Tester les autorisations, les réponses non divulguantes et le parcours complet avant publication.

## Suivi des clarifications documentaires
- [x] Auditer les messages, notifications et modèles administratifs utilisés par les clarifications.
- [x] Ajouter l’état client « en attente de réponse » pour une pièce faisant l’objet d’une clarification.
- [x] Ajouter des réponses rapides administrables et applicables par les conseillers aux clarifications documentaires.
- [x] Notifier visuellement le candidat lorsque l’agence répond à une clarification.
- [x] Tester les autorisations, les statuts, les notifications et la confidentialité avant publication.
- [x] Étendre et valider une compétence réutilisable pour ce cycle de clarification documentaire.

## Accessibilité SEO de l’accueil
- [x] Identifier l’image publique de l’accueil sans texte alternatif et lui attribuer une alternative descriptive adaptée.
- [x] Vérifier que les images informatives de l’accueil possèdent une alternative et que les images décoratives restent correctement masquées.

## Cycle avancé de clarification documentaire
- [x] Auditer le registre de clarification, les échéances, l’historique et les parcours de dépôt actuels.
- [x] Ajouter une échéance interne et un état de priorité aux demandes de clarification en attente.
- [x] Afficher l’historique complet et sécurisé des échanges pour chaque pièce dans l’espace candidat.
- [x] Permettre le dépôt direct de la pièce depuis une réponse de clarification reçue.
- [x] Tester les droits, échéances, historique, dépôt et confidentialité avant publication.
- [x] Étendre et valider la compétence réutilisable de clarification documentaire.

## Priorité domaine affiché dans Google
- [x] Vérifier les redirections, balises canoniques, `noindex`, sitemap et données structurées des domaines `.click` et `.com`.
- [x] Éliminer tout signal technique résiduel pouvant présenter le domaine `.click` comme indexable ou principal.
- [x] Vérifier la propriété Search Console, demander l’exploration de l’accueil canonique et soumettre le sitemap officiel.

## Incident — repli erroné de chargement des routes protégées
- [x] Reproduire et identifier la cause du message « Cette page n’a pas pu être chargée » sur `/mon-espace?section=dossier`.
- [x] Corriger le mécanisme de reprise sans effacer la session candidat valide.
- [x] Auditer les autres routes protégées pour le même repli de cache ou de chargement.
- [x] Ajouter des régressions, vérifier TypeScript et les parcours concernés avant publication.

## Incident — contenu public générique après déploiement
- [x] Reproduire le contenu générique servi sous le marqueur `route-hotfix-c6a2c54a` sur les routes publiques signalées.
- [x] Restaurer le pré-rendu et les contenus réels, en priorité pour `/contact` et `/sources-officielles`.
- [x] Vérifier les huit routes publiques signalées, leurs métadonnées et les coordonnées statiques avant publication.
- [x] Améliorer le chargement global avec une présentation premium, accessible et sans repli trompeur.
- [x] Ajouter les régressions nécessaires, vérifier TypeScript et publier la correction après contrôle visuel.

## Incident — réponse HTML reçue par tRPC sur l’accueil
- [x] Reproduire l’erreur `Unexpected token '<'` et identifier l’endpoint tRPC concerné.
- [x] Empêcher tout fallback HTML de répondre aux chemins `/api/trpc`.
- [x] Ajouter un garde-fou client pour signaler une réponse non JSON sans masquer l’erreur serveur.
- [x] Ajouter les régressions, vérifier TypeScript, tester l’accueil et publier le correctif.

## FAQ, transitions et newsletter publique
- [x] Auditer la FAQ existante, les transitions globales et le footer partagé.
- [x] Ajouter une FAQ dynamique, accessible et spécifique à l’accueil.
- [x] Consolider les transitions fluides entre routes avec respect de la réduction de mouvement.
- [x] Ajouter une inscription newsletter sécurisée dans le footer avec consentement, validation et anti-doublon.
- [x] Ajouter les tests, vérifier TypeScript, l’accessibilité et publier la version validée.

## Priorités — espace client et inscription
- [x] Reproduire l’erreur déclenchée par le bouton « Mon dossier » et identifier le contrat ou module fautif.
- [x] Corriger le chargement de la section dossier sans perdre la session ni exposer de données d’un autre candidat.
- [x] Vérifier les appels partagés responsables des erreurs visibles sur les autres pages.
- [x] Simplifier l’inscription avec un parcours clair, validation explicite et redirection fiable vers l’espace client.
- [x] Ajouter les régressions, vérifier TypeScript, tester les parcours et publier après validation.

## Priorités — évaluation admin, nouvelle évaluation et audit global
- [x] Auditer la file admin des candidats sans évaluation et le contrat d’édition/envoi existant.
- [x] Permettre à un administrateur habilité d’éditer, reformuler, prévisualiser et envoyer une évaluation validée dans l’espace client et par e-mail.
- [x] Corriger le bouton « Nouvelle évaluation » et le parcours préalable des candidats non évalués.
- [x] Parcourir les routes et CTA publics/protégés pour retirer les liens cassés vers maintenance ou actualisation forcée.
- [x] Ajouter les régressions de droits, persistance, envoi et navigation ; vérifier TypeScript et publier.

## Prévisualisation du bilan par e-mail
- [x] Auditer l’éditeur d’évaluation, le contenu sauvegardé et la mutation d’envoi.
- [x] Ajouter un aperçu fidèle de l’objet et du corps avant envoi définitif.
- [x] Garantir que l’aperçu ne déclenche aucune notification ni envoi SMTP.
- [x] Ajouter les tests d’autorisation, de contenu et de non-envoi, puis publier.

## Communication d’évaluation multilingue et traçabilité
- [x] Auditer les langues disponibles, l’aperçu e-mail et les événements d’envoi/ouverture existants.
- [x] Ajouter des modèles d’évaluation en français et en anglais, sélectionnables par le conseiller.
- [x] Ajouter l’impression directe de l’aperçu e-mail sans déclencher d’envoi.
- [x] Afficher dans le profil candidat un historique détaillé et sécurisé des envois, tests et ouvertures.
- [x] Ajouter les tests de confidentialité, de langue, d’impression et de traçabilité, puis publier.

## Incident prioritaire — Mon dossier et suivi candidat
- [x] Reproduire l’erreur de `/mon-espace?section=dossier` et la cible incorrecte du bouton « Mon dossier ».
- [x] Corriger la route de suivi candidat et synchroniser l’onglet dossier sans perte de session.
- [x] Remplacer les liens `/evaluation` en maintenance par le parcours d’évaluation réellement opérationnel.
- [x] Auditer les autres CTA et routes pour les mêmes replis maintenance/actualisation.
- [x] Ajouter les régressions, vérifier TypeScript, tester les routes et publier la correction.

## Suivi dossier et fiabilisation des parcours — nouvelle demande
- [x] Ajouter un filtre administrateur « dossiers sans évaluation » avec comptage et état vide explicite.
- [x] Ajouter une progression visuelle cohérente sur `/mon-dossier` à partir des données serveur, sans inventer d’étape.
- [x] Ajouter des skeleton loaders accessibles sur la page de suivi et préserver les erreurs récupérables.
- [x] Remplacer le test avec un compte candidat réel par une validation automatisée de contrat et une vérification publique sans données privées, conformément à la demande de ne pas prendre le contrôle.
- [x] Vérifier les anciennes URL `.click` et les chemins mémorisés par Cloudflare sans action destructive.
- [x] Étendre et valider la compétence réutilisable, puis tester TypeScript et publier.

## Régression publique — `/mon-dossier`
- [x] Reproduire l’écran d’erreur sur le domaine `.com` et isoler le module ou appel qui échoue.
- [x] Corriger la cause racine du chargement sans masquer une erreur d’autorisation ou de session.
- [x] Vérifier les variantes `/mon-dossier`, `/mon-espace?section=dossier` et les liens associés.
- [x] Ajouter les régressions et tests de rendu public, puis publier seulement après validation.

## Régression répétée — `/mon-dossier` après publication
- [x] Comparer le build public et la prévisualisation pour la route dédiée.
- [x] Capturer l’exception exacte du navigateur et la requête qui la déclenche.
- [x] Corriger la cause commune sans remplacer un état de session par un écran générique.
- [x] Vérifier la diffusion officielle, les anciennes URL et publier une nouvelle révision si nécessaire.

## Protocole d’accord obligatoire et validation des paiements
- [x] Cartographier les tables, procédures et écrans existants pour l’accord, les paiements et le passage en traitement.
- [x] Ajouter la persistance sécurisée de la signature du protocole avec horodatage, identité et version du document.
- [x] Afficher le protocole dans l’espace client et empêcher le traitement tant qu’il n’est pas signé.
- [x] Ajouter côté administrateur une validation simple et traçable des paiements effectués en agence ou déjà réglés en ligne.
- [x] Synchroniser le statut de signature, le statut de paiement et le déblocage documentaire entre client et administration.
- [x] Écrire les tests d’autorisation et de règles métier, vérifier TypeScript et publier après validation.

## Contrôles visibles protocole, paiement agence et évaluation déjà reçue
- [x] Ajouter un bouton client pour visualiser ou télécharger le protocole signé et accéder à l’étape suivante autorisée.
- [x] Ajouter un bouton admin explicite « Valider paiement en agence » avec note et audit.
- [x] Ajouter un bouton admin « Évaluation déjà reçue » avec note candidate déjà évalué et synchronisation côté client.
- [x] Tester les trois parcours et publier la correction.

## Régression connexion — réponse serveur incompatible
- [x] Reproduire et identifier la procédure ou réponse qui déclenche « Unable to transform response from server ».
- [x] Rendre le contrat de synchronisation tolérant aux réponses partielles ou anciennes sans perdre la session.
- [x] Vérifier les actions Réessayer et Conserver ma session avec une session de 24 heures.
- [x] Ajouter les tests de régression, publier et vérifier le domaine officiel.

## Connexion — correction sans contrôle manuel
- [x] Remplacer le contrôle candidat manuel par des tests automatisés de contrat et une vérification publique sans données privées.
- [x] Vérifier qu’aucune réponse incompatible ne produit l’écran « Votre espace ne répond pas encore » pour une session conservée.
- [x] Publier la correction finale de connexion.

## Confirmation paiement agence et PDF protocole signé
- [x] Afficher une notification visuelle de succès après validation admin d’un paiement manuel en agence.
- [x] Ajouter un téléchargement PDF direct et sécurisé du protocole d’accord signé côté client.
- [x] Ajouter les tests de régression, vérifier TypeScript et publier la mise à jour.

## Simplification évaluation, protocole visible et paiement agence
- [x] Remplacer l’interface d’évaluation admin dépendante de l’IA par un champ de saisie manuelle et une action d’envoi.
- [x] Vérifier que l’espace client affiche systématiquement le protocole à signer lorsqu’il est requis, avec accès clair à la signature.
- [x] Ajouter ou rendre visible l’action admin de validation du paiement en agence pour chaque candidat.
- [x] Tester la synchronisation client-admin, vérifier TypeScript et publier la mise à jour.

## Évaluation bloc-notes et progression séquentielle
- [x] Agrandir l’éditeur admin en bloc-notes confortable avec rédaction manuelle et conservation du brouillon.
- [x] Garantir l’envoi du bilan rédigé dans l’espace client et par e-mail après validation humaine.
- [x] Bloquer tout dossier non évalué ou non validé avant l’étape suivante.
- [x] Faire avancer explicitement l’étape après validation de l’évaluation, sans sauter d’étape.
- [x] Ajouter les tests de progression, vérifier TypeScript et publier.

## Validation manuelle du paiement et des étapes administratives
- [x] Vérifier l’accessibilité et le fonctionnement du bouton admin de validation du paiement en agence.
- [x] Afficher une action claire de validation pour l’étape courante de chaque candidat.
- [x] Permettre à l’administrateur de faire avancer le dossier uniquement vers l’étape suivante, avec confirmation et audit.
- [x] Synchroniser immédiatement le statut validé dans l’espace client.
- [x] Tester les autorisations, les prérequis et les transitions, puis publier.

## Annulation sécurisée d’une validation administrative
- [x] Limiter l’annulation à la dernière étape validée et calculer automatiquement l’étape précédente.
- [x] Exiger un motif explicite et une confirmation avant toute annulation.
- [x] Journaliser l’auteur, l’ancien statut, le nouveau statut et le motif sans supprimer l’historique.
- [x] Synchroniser le retour d’étape dans l’espace client et notifier le candidat si demandé.
- [x] Ajouter les tests d’autorisation et de non-contournement, vérifier TypeScript et publier.

## Rendu initial — flash footer et écran bleu
- [x] Identifier le composant ou HTML de chargement qui affiche le footer avant le header.
- [x] Garantir l’ordre de rendu header → contenu principal → footer au rechargement.
- [x] Supprimer l’écran bleu d’informations d’agence pendant le chargement initial.
- [x] Ajouter les tests de rechargement, vérifier le rendu public et publier.

## Évaluation rapide obligatoire et édition admin unifiée
- [x] Rendre le bouton et le formulaire d’évaluation rapide visibles dans l’espace des candidats non évalués.
- [x] Bloquer l’étape suivante tant que l’évaluation obligatoire n’est pas validée humainement.
- [x] Valider automatiquement et tracer le cas « évaluation déjà reçue » lors de la création du dossier.
- [x] Ajouter un accès admin direct à un grand bloc-notes d’édition d’évaluation.
- [x] Permettre l’envoi contrôlé de l’évaluation par e-mail et WhatsApp, avec audit et consentement approprié.
- [x] Tester les deux parcours d’inscription, vérifier TypeScript et publier.

## Parcours candidat dynamique par pays et type de visa
- [x] Auditer les référentiels pays, types de visa, sous-parcours Canada et statuts synchronisés existants.
- [x] Documenter les sources institutionnelles disponibles par destination et type de visa, avec statut `verified`, `partial` ou `unverified` lorsque l’exigence détaillée reste à contrôler.
- [x] Définir un catalogue d’étapes et de champs de formulaire par combinaison pays/visa.
- [x] Afficher dans l’espace candidat uniquement les étapes et questions correspondant à son dossier.
- [x] Synchroniser les étapes, validations, documents et statuts avec l’espace administrateur.
- [x] Ajouter les tests des parcours Canada, Luxembourg et autres destinations, puis publier progressivement.

### Constat de couverture à traiter
- [x] Corriger l’écart de présentation : le catalogue contient 91 fiches sur 42 pays, et cette couverture réelle ainsi que les 16 fiches absentes sont désormais documentées sans les présenter comme disponibles.
- [x] Ne pas attribuer de portail officiel à une destination non vérifiée ; afficher « source institutionnelle à vérifier » tant que la source n’est pas validée.

## Couverture de toutes les destinations
- [x] Inventorier la liste complète des destinations réellement disponibles dans les ressources du projet.
- [x] Recenser les variantes visiteur, études, travail et sous-parcours spécifiques pour chaque destination.
- [x] Comparer la couverture réelle avec l’objectif annoncé de 107 fiches sans inventer de destinations.

## Référentiel mondial et centre documentaire par étape
- [x] Définir un modèle mondial pays-visa-étape-document sans inventer d’exigences officielles.
- [x] Enrichir le modèle Canada avec WES, Arrima/PNP et les documents générés par étape.
- [x] Créer un centre client pour visualiser, télécharger et suivre chaque document généré.
- [x] Ajouter côté administration la génération, validation, remplacement et publication contrôlée des documents.
- [x] Synchroniser statuts, formulaires, documents et notifications entre les espaces candidat et admin.
- [x] Tester le modèle Canada et le repli mondial, puis publier progressivement.

## Plateforme mondiale d’accompagnement et pilotage terrain
- [x] Définir le modèle mondial pays–visa–étape–document–validation.
- [x] Ajouter des étapes d’accompagnement propres à chaque pays et type de visa, avec repli prudent pour les destinations non vérifiées.
- [x] Créer un centre client pour les documents générés à chaque étape, incluant consultation et téléchargement.
- [x] Étendre le pilotage admin : étapes, validations, documents, notes, échéances et actions terrain.
- [x] Garantir la synchronisation bidirectionnelle des statuts, formulaires, documents et notifications.
- [x] Tester Canada, Luxembourg, Schengen, autres destinations et repli mondial, puis publier par paliers.

## Audit exhaustif des parcours et de la synchronisation
- [x] Auditer chaque fiche pays-visa du catalogue contre la présence d’au moins une étape et d’un document attendu.
- [x] Auditer les variantes visiteur, études et travail ainsi que le repli des destinations non détaillées.
- [x] Vérifier que le même pays, visa, étape et statut sont transmis au candidat et à l’administration.
- [x] Tester les actions de pilotage admin : validation, progression, annulation et journalisation.
- [x] Corriger les écarts détectés, rejouer les tests et publier un rapport d’audit.

## Prévisualisation des documents générés par étape
- [x] Remplacer le lien direct des documents d’étape par une action d’aperçu accessible.
- [x] Réutiliser la fenêtre de prévisualisation sécurisée existante pour les PDF, images et formats non pris en charge.
- [x] Vérifier les permissions, les états sans document et les actions d’ouverture/téléchargement, puis publier.

## Cockpit candidat ciblé et allégé
- [x] Afficher uniquement les services, étapes et documents demandés dans le dossier actif.
- [x] Rendre visible l’évaluation obligatoire pour les candidats non évalués et guider vers son formulaire.
- [x] Afficher le protocole d’accord à signer après le paiement confirmé, avec un état clair avant/après signature.
- [x] Corriger le bouton de suivi de dossier et son accès au dossier synchronisé.
- [x] Réduire la surcharge en donnant la priorité à l’action suivante et aux informations utiles.
- [x] Tester les états évaluation, paiement, protocole et suivi, puis publier.

## Documents à signer dans l’espace candidat
- [x] Identifier les documents d’accord, autorisation et validation nécessitant une signature dans le dossier actif.
- [x] Créer une section dédiée avec statut « à signer », « signé » ou « en attente ».
- [x] Permettre la consultation, la signature guidée et le téléchargement des documents signés selon les droits.
- [x] Synchroniser la liste et les états de signature avec le pilotage administrateur.
- [x] Ajouter les tests d’accès et de statut, vérifier TypeScript et publier.

## Condition d’évaluation et envoi admin — reprise après restauration
- [x] Afficher le message d’évaluation obligatoire uniquement pour un dossier sans évaluation.
- [x] Conserver l’envoi admin du résultat vers l’espace candidat et par e-mail avec accès direct.
- [x] Ajouter la régression de condition, vérifier TypeScript et publier.

## Fichiers déposés en agence dans l’espace candidat
- [x] Ajouter un formulaire admin de téléversement ciblant un candidat précis.
- [x] Stocker le fichier avec origine `scanned_agency` ou `manual_admin`, type, nom et auteur admin.
- [x] Publier le fichier dans l’espace candidat après contrôle admin, sans exposer les autres dossiers.
- [x] Générer ou rattacher la décharge de dépôt et journaliser l’opération.
- [x] Tester les droits, le stockage et la synchronisation, puis publier.

## Documents remis en main propre et décharge PDF
- [x] Ajouter la catégorie `document_remis_main_propre` dans les contrats et sélecteurs documentaires.
- [x] Afficher clairement cette catégorie côté administration et espace candidat.
- [x] Générer automatiquement une décharge PDF lors du dépôt admin en agence.
- [x] Rattacher la décharge au dossier, au document source et à l’historique d’audit.
- [x] Tester les droits, le PDF et la synchronisation, puis publier.

## Pré-dossier agence avant inscription
- [x] Permettre à l’administration de créer ou compléter un pré-dossier sans compte candidat.
- [x] Ajouter et classer les documents remis en agence sur ce pré-dossier.
- [x] Rattacher de façon sécurisée le pré-dossier au compte lors de l’inscription, par identité, e-mail et numéro de dossier.
- [x] Rendre les documents et statuts visibles dans l’espace candidat après rattachement.
- [x] Tester les doublons, les erreurs de rattachement et les droits d’accès, puis publier.

## Pré-dossier agence avant inscription — synchronisation documentaire
- [x] Ajouter une interface admin pour créer et éditer un pré-dossier autonome avec identité, contact, destination et type de visa.
- [x] Permettre le dépôt sécurisé de documents physiques sur un pré-dossier sans compte candidat, avec catégorie, reçu PDF et journal d’audit.
- [x] Durcir le rattachement par e-mail lors de l’inscription et vérifier que les documents agence restent visibles dans l’espace candidat.
- [x] Ajouter des tests du parcours agence → dépôt → inscription → synchronisation et vérifier TypeScript, tests et build.

## Recherche et synchronisation visuelle des pré-dossiers
- [x] Ajouter une recherche admin par numéro de dossier ou identité, avec état vide et compteur de résultats.
- [x] Afficher le rattachement du compte candidat dans la fiche admin avec lien direct vers son espace.
- [x] Mettre en évidence le statut actuel et les documents synchronisés par l’agence dans l’espace candidat.
- [x] Ajouter les tests de régression, vérifier accessibilité, TypeScript et build, puis publier.

## Évaluations nouveaux candidats et formats documentaires
- [x] Simplifier l’envoi et la validation humaine des évaluations des candidats nouvellement inscrits.
- [x] Autoriser les images PNG dans les téléversements candidats et admin avec vérification de signature.
- [x] Autoriser les fichiers PDF valides quel que soit leur nom, sans désactiver les limites de taille et les contrôles de contenu.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Prévisualisation d’évaluation et confirmation documentaire
- [x] Ajouter un aperçu de l’e-mail d’évaluation avant validation et envoi admin.
- [x] Afficher une confirmation détaillée après dépôt réussi d’un PNG ou PDF côté candidat.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Assistance IA avec validation humaine obligatoire
- [x] Réactiver la génération IA de brouillons pour les évaluations éligibles, sans décision automatique.
- [x] Afficher clairement la provenance IA du brouillon et conserver la modification humaine avant envoi.
- [x] Garantir côté serveur qu’aucun e-mail ni changement d’étape ne part sans validation admin explicite.
- [x] Ajouter les tests de régression IA/admin, vérifier TypeScript et build, puis publier.

## Validation renforcée des évaluations IA
- [x] Afficher l’historique des modifications humaines du brouillon IA avant validation.
- [x] Imposer une seconde validation admin pour les évaluations sensibles ou défavorables.
- [x] Afficher date et conseiller de validation dans l’espace candidat.
- [x] Rendre opérationnel l’envoi validé et synchroniser la progression de l’étape Évaluation côté candidat.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Seconde validation et historique candidat
- [x] Ajouter un filtre admin dédié aux évaluations en attente de seconde validation.
- [x] Refuser côté serveur un second validateur identique au premier conseiller.
- [x] Afficher une timeline simplifiée des étapes validées dans l’espace candidat.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Correction envoi bilan et espace candidat
- [x] Rendre le bouton « Valider et envoyer » opérationnel par e-mail et dans l’espace candidat.
- [x] Agrandir l’éditeur de bilan sur ordinateur et téléphone avec une mise en page responsive.
- [x] Corriger l’erreur de synchronisation et de chargement de /mon-espace.
- [x] Ajouter les tests de régression, vérifier TypeScript, build et rendu responsive, puis publier.

## Pilotage admin des bilans et expérience applicative
- [x] Ajouter un indicateur visuel pendant la génération du PDF et l’envoi de l’e-mail.
- [x] Ajouter le renvoi sécurisé de l’e-mail d’évaluation depuis le profil candidat.
- [x] Prévisualiser le PDF généré dans l’interface admin avant l’envoi définitif.
- [x] Moderniser l’espace admin en application de traitement complète, responsive et accessible.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Suivi des relances et archivage PDF admin
- [x] Afficher dans l’administration si chaque e-mail de bilan ou de relance a été ouvert, avec date de lecture.
- [x] Permettre de personnaliser le texte d’accompagnement juste avant une relance.
- [x] Ajouter le téléchargement direct du PDF depuis la fenêtre d’aperçu admin.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Réorganisation et actions du traitement admin
- [x] Réduire la saturation visuelle et séparer clairement édition, aperçu, validation et diffusion.
- [x] Corriger les conditions de désactivation et les enchaînements des boutons d’action.
- [x] Garantir une mise en page utilisable sans débordement horizontal sur mobile.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Barre d’actions et pilotage des dossiers sensibles
- [x] Agrandir l’espace de préparation sur toute la fenêtre disponible, sans débordement mobile.
- [x] Ajouter une barre d’actions fixe en bas avec validation et envoi toujours visibles.
- [x] Afficher un toast de succès temporaire après chaque action réussie.
- [x] Ajouter un filtre rapide pour les dossiers sensibles nécessitant une double validation.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Correctif chargement éditeur de bilan
- [x] Diagnostiquer la requête ou l’erreur qui laisse l’éditeur sur « Chargement du brouillon ».
- [x] Ajouter un état d’erreur visible avec bouton Réessayer et sortie sûre.
- [x] Rendre les actions disponibles dès que les données minimales sont prêtes, sans contourner les validations métier.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.

## Documents agence et fiabilité du pilotage admin
- [x] Permettre le dépôt des documents remis en agence dans le bon dossier et les afficher dans admin et espace client sans mélange entre candidats.
- [x] Réparer les boutons admin sans action et ajouter un signalement support après plusieurs échecs de Réessayer.
- [x] Sauvegarder automatiquement le brouillon pendant la rédaction du bilan.
- [x] Distinguer visuellement les sections générées par IA des modifications humaines.
- [x] Ajouter les tests de droits et de synchronisation, vérifier TypeScript et build, puis publier.

## Documents agence et activation de l’évaluation
- [x] Ajouter un filtre « Documents remis en agence » dans le centre documentaire.
- [x] Afficher date, origine et conseiller pour chaque document dans l’espace candidat.
- [x] Prévisualiser les documents déposés par l’administration avant validation définitive.
- [x] Corriger l’envoi de l’évaluation et activer l’étape Évaluation côté candidat après validation humaine.
- [x] Ajouter les tests de synchronisation, vérifier TypeScript et build, puis publier.

## Correction évaluation introuvable et documents exploitables
- [x] Corriger la résolution du dossier transmis à l’éditeur afin de supprimer « Dossier d’évaluation introuvable ».
- [x] Permettre à l’admin d’ouvrir et télécharger les CV et PDF du candidat avec URL sécurisée et provenance claire.
- [x] Permettre le dépôt admin de tous les documents remis en agence dans le dossier candidat ou pré-dossier sélectionné.
- [x] Vérifier que l’envoi du bilan active l’évaluation côté candidat sans mélange documentaire.
- [x] Ajouter les tests de régression, vérifier TypeScript et build, puis publier.
