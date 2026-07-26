# Système d'Auto-Évaluation Multi-Projets - Spécifications

## Structure Fonctionnelle

### Étape 1 : Informations Générales
- Nom & Prénom (texte)
- Email valide (obligatoire, validation format)
- Numéro WhatsApp (suivi secondaire)
- Ville actuelle
- Pays de destination (Canada, France, Allemagne, Belgique, USA, UK, etc.)
- **Type de Projet** (menu déroulant déclenchant les champs conditionnels)

### Étape 2 : Champs Spécifiques par Type

#### A. VISA TRAVAIL / PERMIS DE TRAVAIL
- Secteur d'activité (IT, Santé, BTP, Transport/Logistique, Hôtellerie, Mécanique, etc.)
- Années d'expérience (Moins de 2 ans, 2-5 ans, 5-10 ans, +10 ans)
- Dernier diplôme (BTS, Licence, Master, Diplôme Technique/Pro)
- Niveau de langues & Tests (Français, Anglais, Allemand / TEF, TCF, IELTS)
- **TÉLÉVERSEMENT OBLIGATOIRE DU CV** (PDF/Word < 5Mo)

#### B. VISA ÉTUDES / PERMIS D'ÉTUDES
- Dernier diplôme & Année d'obtention
- Moyenne générale / Mention
- Statut d'admission (Pas encore postulé / En cours / Lettre reçue)
- Disponibilité d'un garant financier avec preuves de revenus
- Téléversement optionnel du relevé de notes / diplôme (PDF < 5Mo)

#### C. VISA TOURISME / VISITEUR / AFFAIRES
- Motif principal (Visite familiale, Affaires, Découverte, Soins)
- Historique de voyage (Passeport vierge, Sous-région, Visas antérieurs)
- Historique de refus consulaire
- Preuves d'attaches socio-économiques (CDI, Entreprise, Propriété, Famille)

## Logique d'Expédition - 100% E-MAIL

### Écran de Fin
- Dossier N° #3M-[CodeAuto] enregistré
- Bilan d'Admissibilité Officiel envoyé par EMAIL sous 48h

### Email J+0 : Accusé de Réception
- Confirmation instantanée de prise en charge

### Email J+2 : Bilan d'Admissibilité (48h)
- Rapport de scoring
- Avis du comité d'experts
- Lien sécurisé vers Espace Client pour :
  1. Finaliser l'ouverture de dossier
  2. Régler les frais en ligne (Visa/MasterCard/MoMo/OM)
  3. Commander la traduction certifiée

## Spécifications Techniques

### Design
- Couleurs : #0a2540 (bleu foncé), #0066cc (bleu), #ff9800 (orange)
- Responsive
- Composants cohérents

### Email
- Compatibilité SMTP/LWS
- En-têtes HTML optimisés
- SPF, DKIM, DMARC compatibles
- Domaine : www.3mtravelagency.com
