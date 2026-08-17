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
