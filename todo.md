# 3M Travel & Services — Roadmap

## Exportation iCal des Réservations (v253)
- [x] Ajouter la procédure tRPC `exportCalendarIcal` dans `server/routers/tourism.ts` pour générer un flux .ics sécurisé
- [x] Intégrer le bouton d’export iCal dans le composant `AdminCalendarView.tsx` avec téléchargement instantané du fichier
- [x] Valider avec les tests unitaires et TypeScript puis publier la version finale

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
- [x] Créer un premier périmètre d’hôtels vérifiés, relié à la demande 3M Booking et au back-office — huit fiches validées et tracées par conseiller
- [x] Obtenir la confirmation humaine finale d’une fiche techniquement prête avant sa publication client
- [x] Rendre la file de précontrôle hôtelier visible avec une action rapide de confirmation dans Tourisme & Devis
- [x] Vérifier le rendu connecté de l’action rapide de confirmation hôtelier dans Tourisme & Devis
- [x] Alerter visuellement l’administrateur lorsqu’une fiche hôtel est techniquement prête à confirmer
- [x] Exporter en CSV l’historique complet des validations hôtelières, avec conseiller et date
- [x] Ajouter un filtre client n’affichant que les hôtels confirmés
- [x] Associer des visuels hôteliers propres à chaque fiche en respectant leur provenance et leurs droits d’usage
- [x] Tester les alertes, exports, filtre client et rendu des visuels avant publication
- [x] Conserver la confirmation humaine finale avant toute publication d’hôtel dans 3M Booking
- [x] Automatiser le précontrôle des fiches hôtel tout en conservant une confirmation humaine finale en un clic
- [x] Définir et automatiser le précontrôle technique des liens, coordonnées et provenance des fiches hôtel
- [x] Afficher les résultats de précontrôle sans transformer ces résultats en validation client automatique
- [x] Mettre en place des garde-fous pour éviter d’afficher des tarifs ou disponibilités non confirmés
- [x] Comparer les fournisseurs professionnels de contenu hôtelier et leurs possibilités d’accès pour 3M Booking
- [x] Vérifier si un connecteur ou des identifiants RateHawk sont déjà disponibles dans la session
- [x] Définir le contrat RateHawk pour recherche, tarifs, pré-vérification et transfert vers le back-office
- [x] Configurer des identifiants RateHawk de test et vérifier les recherches prioritaires d’Afrique centrale — écarté : solution payante non retenue
- [x] Identifier une source ouverte ou gratuite permettant de démarrer un catalogue hôtelier Cameroun et Afrique centrale
- [x] Concevoir la table de catalogue hôtelier avec source OSM, URL officielle, équipements et date de vérification
- [x] Importer de manière contrôlée les hôtels OpenStreetMap des neuf villes prioritaires
- [x] Créer les procédures administrateur de consultation, vérification et gestion du catalogue hôtelier
- [x] Permettre la sélection d’un hôtel du catalogue dans 3M Booking et transmettre sa provenance au back-office
- [x] Afficher l’attribution OpenStreetMap et exclure tout tarif ou disponibilité non vérifiés
- [x] Afficher le lien officiel de réservation de l’hôtel sélectionné dans chaque demande côté administration
- [x] Lancer l’import groupé des neuf villes prioritaires vers le catalogue hôtelier administrateur
- [x] Vérifier et consigner les volumes importés ainsi que les établissements sans lien officiel — 795 hôtels importés, dont 713 fiches à compléter ou vérifier avant publication client
- [x] Inspecter les connecteurs et les fournisseurs B2B hôteliers accessibles pour 3M Booking
- [x] Définir le parcours d’activation et les secrets nécessaires au fournisseur retenu
- [x] Activer le connecteur Jinko et finaliser l’autorisation OAuth professionnelle — écarté : solution payante non retenue
- [x] Vérifier une recherche hôtelière Jinko avant toute intégration dans le parcours client — écarté : parcours gratuit retenu
- [x] Cartographier les routes, procédures tRPC et zones administratives du site pour l’audit complet
- [x] Vérifier les parcours publics, l’espace client et l’administration sur ordinateur et mobile
- [x] Examiner les journaux, la PWA, les réponses API et les erreurs console reproductibles
- [x] Corriger les défauts confirmés, ajouter les tests de non-régression et publier le bilan d’audit
- [x] Corriger la route publique `/3m-booking` qui renvoie actuellement une page 404
- [x] Vérifier les attributs `src` vides détectés dans la console : non reproduits lors d’une session fraîche après correction de route
- [x] Vérifier la pile d’actions flottantes mobile : aucun chevauchement entre les commandes n’est reproduit sur les parcours publics contrôlés
- [x] Simplifier l’administration du catalogue hôtelier pour un usage gratuit sans fournisseur externe
- [x] Présenter clairement au client un devis à confirmer plutôt qu’une disponibilité ou réservation automatique
- [x] Vérifier le parcours gratuit de demande d’hôtel, de la sélection au back-office
- [x] Diagnostiquer l’écart entre la session administrateur visible et les appels du suivi e-mail
- [x] Corriger la propagation de session du module d’administration concerné
- [x] Tester la régression du suivi e-mail : jeton de session administrateur réutilisé et 467 tests réussis
- [x] Cartographier les routes, tests automatisés et contrôles de session à couvrir dans la vérification complète
- [x] Vérifier les parcours publics, client et administrateur accessibles sur ordinateur et mobile
- [x] Vérifier les API, journaux, PWA et protections d’accès puis corriger toute anomalie reproductible
- [x] Exécuter la régression complète et publier le bilan de vérification
- [x] Ajouter un indicateur de navigation fluide et respectueux des préférences d’accessibilité
- [x] Uniformiser les notifications de succès et d’erreur pour les actions administratives
- [x] Ajouter une recherche instantanée aux données administratives prioritaires et vérifier son accessibilité
- [x] Analyser la connexion administrateur, le jeton de session et la redirection du tableau de bord
- [x] Corriger la persistance de session administrateur entre connexion et navigation
- [x] Ajouter un test de non-régression du maintien de session administrateur — 474 tests réussis
- [x] Précontrôler les liens et la provenance des fiches hôtel sans modifier leur statut de validation humaine
- [x] Afficher une liste prioritaire de fiches techniquement prêtes à être vérifiées par un conseiller
- [x] Vérifier que le précontrôle ne permet aucune approbation automatique côté client ou administration — 476 tests réussis
- [x] Identifier les actions Tourisme encore dépendantes uniquement du cookie administrateur
- [x] Transmettre le jeton de repli sécurisé aux validations de catalogue hôtelier
- [x] Tester qu’une validation hôtel est enregistrée avec cookie ou jeton administrateur valide — 478 tests réussis
- [x] Identifier l’erreur de rendu responsable de la page blanche administrateur
- [x] Corriger le rendu de session ou de tableau concerné et ajouter un test de non-régression
- [x] Vérifier le retour du tableau administrateur sur ordinateur et mobile — 480 tests réussis et accès protégé contrôlé
- [x] Ajouter un export CSV et un export PDF traçable des fiches hôtels depuis Tourisme & Devis
- [x] Ajouter recherche instantanée et filtre par pays au Catalogue e-Visa
- [x] Ajouter des badges de couleur cohérents pour les statuts de précontrôle hôtelier
- [x] Tester les exports, filtres et badges administratifs avant publication — 482 tests réussis
- [x] Afficher les résultats de disponibilité de vols immédiatement sous le formulaire de recherche
- [x] Enrichir les cartes de résultats avec horaires, escales, bagages, cabine et conditions tarifaires disponibles
- [x] Vérifier le rendu des résultats de vols sur ordinateur et mobile, puis exécuter les régressions — 484 tests réussis
- [x] Empêcher une recherche de vols de rester indéfiniment en attente en prévoyant un repli explicite et rapide
- [x] Auditer la création de réservation de vol, la transmission à l’administration et les données opérationnelles disponibles
- [x] Renforcer la fiche administrateur avec les informations nécessaires à la réservation et au suivi PNR
- [x] Ajouter une action administrateur de relance PNR avec état de synchronisation e-mail et espace client
- [x] Vérifier ou fiabiliser la remise synchronisée du PNR dans l’espace client et par e-mail
- [x] Tester le parcours de réservation de bout en bout avec contrôles d’autorisation et de non-régression — 487 tests réussis
- [x] Retirer l’option obsolète de suppression de cookie Express sans modifier la portée de session
- [x] Clarifier le champ Tourisme : aucune destination n’est préremplie et le libellé est désormais neutre
- [x] Identifier et corriger les composants qui transmettent un attribut d’image `src` vide au navigateur
- [x] Retirer les mentions internes encore visibles dans le panneau d’assistance de la page Billets
- [x] Auditer les parcours assurance, vol, e‑Visa et procédures ainsi que leurs notifications, documents et synchronisations existantes
- [x] Créer le circuit assurance : demande, référence, coupon de réservation, traitement administrateur et remise du PDF au client
- [x] Harmoniser les confirmations e-mail et espace client des services soumis puis traités par l’administration
- [x] Corriger les boutons et liens sans destination opérationnelle dans les parcours de service prioritaires
- [x] Tester les circuits assurance, vol, e‑Visa et procédures de bout en bout avant publication
- [x] Préserver les sessions 24 heures publiées tout en intégrant les améliorations assurance et e‑Visa locales
- [x] Vérifier l’absence de perte de contenu, de route ou de contrôle d’accès après la fusion
- [x] Tester la synchronisation complète assurance et e‑Visa entre client, e-mail et back-office
- [x] Vérifier les sessions administrateur et client de 24 heures, leur expiration et la déconnexion manuelle
- [x] Parcourir les actions du back-office, corriger les liens ou boutons inactifs et consigner les contrôles
- [x] Exécuter les régressions et la vérification visuelle après les corrections
- [x] Contrôler l’accès administrateur connecté et la persistance de session dans le navigateur réel
- [x] Vérifier les actions opérationnelles prioritaires du back-office sans modifier de dossiers réels
- [x] Corriger et tester toute erreur de navigation ou de remise reproductible découverte
- [x] Cartographier les notifications et les actions de remise administratives à contrôler sans envoi réel
- [x] Vérifier les écrans, accès et retours d’erreur des notifications et remises
- [x] Corriger et tester toute anomalie reproductible avant publication
- [x] Créer une route directe sécurisée vers le suivi e-mail administrateur
- [x] Ajouter un tableau de santé SMTP réservé au back-office, sans exposer de secrets
- [x] Préparer un dossier de démonstration isolé pour les tests de remise e-mail réels
- [x] Créer et valider une compétence réutilisable pour le contrôle de remise e-mail
- [x] Tester les accès, la santé SMTP, le dossier de démonstration et les régressions avant publication
- [x] Ajouter un filtre par type de remise dans les journaux e-mail administratifs
- [x] Notifier les administrateurs lorsque le diagnostic SMTP signale une défaillance
- [x] Archiver manuellement le dossier de démonstration après test sans supprimer le journal de remise
- [x] Créer et valider une compétence réutilisable de supervision e-mail
- [x] Tester le filtrage, les alertes SMTP, l’archivage et les régressions avant publication
- [x] Ajouter l’export CSV des journaux e-mail selon les filtres actifs
- [x] Afficher la dernière remise réussie par type de service dans le centre e-mail
- [x] Ajouter une relance groupée des e-mails en échec avec confirmation administrative et suivi du résultat
- [x] Créer et valider une compétence réutilisable de pilotage des remises e-mail
- [x] Tester les exports, les indicateurs, la relance groupée et les régressions avant publication
- [x] Afficher un résumé détaillé des échecs d’e-mails de la journée dans le tableau de bord
- [x] Ajouter un graphique des taux de réussite de remise par service sur les 30 derniers jours
- [x] Permettre la sélection manuelle des e-mails en échec avant relance groupée
- [x] Tester les indicateurs, le graphique, les sélections et les relances ciblées avant publication
- [x] Ajouter un filtre de journaux e-mail par conseiller ayant déclenché la remise
- [x] Afficher une comparaison hebdomadaire des taux de réussite par service
- [x] Ajouter une prévisualisation du contenu d’un e-mail en échec avant sa relance
- [x] Afficher un indicateur de traitement et un bilan de succès ou d’erreur pour la relance groupée
- [x] Créer et valider une compétence réutilisable de pilotage avancé des remises e-mail
- [x] Tester les filtres, la comparaison, les prévisualisations et les relances avant publication
- [x] Ajouter des seuils personnalisés d’échecs e-mail par conseiller avec alertes administratives
- [x] Générer un export PDF hebdomadaire des statistiques de remise e-mail
- [x] Masquer automatiquement les données sensibles dans les aperçus d’e-mails en échec
- [x] Créer et valider une compétence réutilisable de supervision e-mail sécurisée
- [x] Tester les seuils, alertes, exports PDF, masquage et régressions avant publication
- [x] Créer une page sécurisée de paramètres des seuils d’alerte par conseiller
- [x] Journaliser les incidents de remise déclenchés et permettre leur accusé de réception par un administrateur
- [x] Inclure l’historique des alertes et accusés dans le rapport PDF hebdomadaire
- [x] Tester les paramètres, incidents, accusés et rapports avant publication
- [x] Ajouter une recherche client par nom d’hôtel avec autocomplétion des établissements confirmés
- [x] Créer un tableau administrateur pour identifier et filtrer les fiches sans visuel officiel
- [x] Formaliser et valider une compétence réutilisable pour le workflow de recherche et visuels hôteliers
- [x] Tester la recherche, les suggestions, le suivi des visuels et la compétence avant publication
- [x] Diagnostiquer les erreurs et les boutons inaccessibles du parcours d’envoi de billet administrateur
- [x] Corriger l’envoi de billet, les autorisations et les retours d’interface côté administrateur
- [x] Tester l’accès client au billet et la livraison e-mail après action administrateur
- [x] Garantir qu’une validation de billet publie le PDF dans l’espace client et déclenche l’e-mail de remise au client
- [x] Ajouter un renvoi explicite du billet par e-mail depuis le suivi administrateur
- [x] Afficher l’horodatage exact de chaque e-mail de billet transmis au client
- [x] Intégrer un aperçu PDF dans la modale avant la validation finale du billet
- [x] Créer et valider une compétence réutilisable de remise administrative de billet
- [x] Tester les renvois, horodatages, aperçu PDF et contrôles de remise avant publication
- [x] Recenser côté administration tous les comptes créés avant ouverture de dossier
- [x] Permettre à un conseiller d’activer un dossier après dépôt en agence et de synchroniser les étapes vers l’espace client
- [x] Ajouter des relances et notifications contrôlées pour les comptes pré-dossier et dossiers en attente
- [x] Maintenir la session administrateur active jusqu’à déconnexion pendant la journée et fiabiliser les raccourcis de navigation interne
- [x] Auditer et corriger les boutons inaccessibles et les synchronisations admin-espace client
- [x] Tester les comptes pré-dossier, activation, relances, session, navigation et autorisations avant publication
- [x] Afficher le drapeau, la destination confirmée et des visuels adaptés dans l’espace client des dossiers actifs
- [x] Ajouter une file administrateur des évaluations récemment reçues avant création de compte ou ouverture de dossier
- [x] Permettre au conseiller de valider une évaluation, de rattacher le compte créé ensuite et d’activer l’étape suivante du dossier
- [x] Synchroniser immédiatement la validation, les notifications et les étapes de procédure visibles dans l’espace client
- [x] Agréger les actions administratives et les changements d’étape visibles au client dans un journal chronologique sécurisé
- [x] Afficher une frise historique lisible dans le dossier client actif sans exposer les notes internes
- [x] Tester les droits, le tri chronologique et le rendu client avant publication
- [x] Harmoniser la persistance des sessions client et administrateur sur 24 heures avec déconnexion manuelle
- [x] Ajouter des raccourcis internes de retour et d’avancement dans les espaces client et administrateur
- [x] Tester les expirations de session, les déconnexions et la navigation sans bouton du navigateur avant publication
