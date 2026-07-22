import { useState } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, User, ArrowLeft, ArrowRight, Search,
  BookOpen, MessageCircle, Share2, Tag, ChevronRight
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Article {
  slug: string;
  title: string;
  category: string;
  categoryColor: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  excerpt: string;
  image: string;
  tags: string[];
  content: string;
}

// ─── Articles ──────────────────────────────────────────────────────────────
const ARTICLES: Article[] = [
  {
    slug: "tcf-canada-guide-complet-camerounais",
    title: "TCF Canada 2026 : Le Guide Complet pour les Candidats Camerounais",
    category: "Tests de Langue",
    categoryColor: "bg-blue-100 text-blue-700",
    date: "15 janvier 2026",
    readTime: "8 min",
    author: "Marie-Claire Ngo",
    authorRole: "Conseillère en Immigration",
    excerpt: "Tout ce que vous devez savoir sur le TCF Canada : format, scores requis pour Express Entry, centres d'examen à Yaoundé et Douala, et stratégies de préparation éprouvées.",
    image: "🇨🇦",
    tags: ["TCF Canada", "Express Entry", "Immigration Canada", "Tests de Langue"],
    content: `## Qu'est-ce que le TCF Canada ?

Le **Test de Connaissance du Français pour le Canada (TCF Canada)** est un examen officiel administré par France Éducation International (anciennement CIEP). Il évalue votre niveau de français selon le **Cadre Européen Commun de Référence pour les Langues (CECRL)** et est reconnu par Immigration, Réfugiés et Citoyenneté Canada (IRCC).

Contrairement au TCF standard, le TCF Canada comprend **4 épreuves obligatoires** : compréhension de l'oral, maîtrise des structures de la langue, compréhension de l'écrit, et expression écrite. L'expression orale est facultative mais fortement recommandée pour maximiser votre score CRS.

## Format de l'examen

| Épreuve | Durée | Questions | Score |
|---|---|---|---|
| Compréhension de l'oral | 35 min | 39 questions | 0-699 |
| Structures de la langue | 20 min | 40 questions | 0-699 |
| Compréhension de l'écrit | 60 min | 50 questions | 0-699 |
| Expression écrite | 60 min | 2 tâches | 0-699 |
| Expression orale | 12 min | 3 tâches | 0-699 |

## Scores requis pour Express Entry

Pour maximiser vos points CRS dans le cadre d'Express Entry, voici les scores cibles :

- **Niveau CLB 9** (score 549-698) : +32 points CRS pour la première langue officielle
- **Niveau CLB 10** (score 699) : +34 points CRS — score maximum
- **Niveau CLB 7** (score 453-548) : minimum requis pour la plupart des catégories

Pour les bilingues français-anglais, le TCF Canada combiné à un test d'anglais (IELTS ou CELPIP) peut vous rapporter jusqu'à **+50 points CRS supplémentaires**.

## Centres d'examen au Cameroun

**Yaoundé :**
- Alliance Française de Yaoundé (Avenue du Général de Gaulle)
- Institut Français du Cameroun (Plateau)

**Douala :**
- Alliance Française de Douala (Bonanjo)
- Centre de langue de l'Université de Douala

Les sessions sont organisées **tous les 2 mois** environ. Il est recommandé de s'inscrire **3 à 4 mois à l'avance** car les places sont limitées.

## Stratégie de préparation

### 6 semaines avant l'examen

1. **Évaluez votre niveau actuel** : passez un test blanc gratuit sur le site de France Éducation International
2. **Identifiez vos points faibles** : compréhension orale, vocabulaire, grammaire ?
3. **Inscrivez-vous à un cours de préparation** : 3M Travel propose des cours intensifs de 4 à 8 semaines

### 4 semaines avant

- Pratiquez l'écoute de **RFI, France 24, Radio Canada** quotidiennement
- Lisez **Le Monde, Le Devoir** pour enrichir votre vocabulaire
- Faites **2 tests blancs complets** par semaine

### 2 semaines avant

- Concentrez-vous sur les **structures grammaticales** les plus fréquentes
- Pratiquez l'expression écrite avec des sujets d'actualité
- Dormez suffisamment et gérez votre stress

## Tarif et inscription

Le TCF Canada coûte environ **80 000 à 100 000 FCFA** selon le centre. Les résultats sont disponibles **3 semaines** après l'examen et sont valables **2 ans**.

3M Travel propose une **préparation complète au TCF Canada** pour 80 000 FCFA, incluant cours intensifs, simulations d'examen et suivi personnalisé.`,
  },
  {
    slug: "tef-canada-vs-tcf-canada-lequel-choisir",
    title: "TEF Canada vs TCF Canada : Lequel Choisir pour Express Entry ?",
    category: "Tests de Langue",
    categoryColor: "bg-blue-100 text-blue-700",
    date: "8 janvier 2026",
    readTime: "6 min",
    author: "Jean-Baptiste Kamga",
    authorRole: "Expert Immigration",
    excerpt: "TEF Canada ou TCF Canada ? Comparaison complète des deux tests de français reconnus par l'IRCC pour votre dossier d'immigration canadienne.",
    image: "📝",
    tags: ["TEF Canada", "TCF Canada", "Immigration Canada", "Express Entry"],
    content: `## TEF Canada vs TCF Canada : Quelle différence ?

Les deux tests sont **officiellement reconnus par l'IRCC** pour les demandes d'immigration canadienne. Le choix entre les deux dépend de votre profil et de vos points forts.

## Comparaison détaillée

| Critère | TEF Canada | TCF Canada |
|---|---|---|
| Organisateur | CCIP (Chambre de Commerce de Paris) | France Éducation International |
| Durée totale | ~3h30 | ~3h (sans oral) |
| Format | QCM + expression | QCM + expression |
| Validité | 2 ans | 2 ans |
| Difficulté perçue | Légèrement plus difficile | Plus accessible |
| Disponibilité | Moins fréquent | Plus fréquent |

## Lequel choisir ?

**Choisissez le TCF Canada si :**
- Vous êtes plus à l'aise avec le format QCM
- Vous avez besoin de passer l'examen rapidement (plus de sessions disponibles)
- Vous préparez également le TCF Québec (même format)

**Choisissez le TEF Canada si :**
- Vous avez déjà passé le TEF standard et connaissez le format
- Vous souhaitez un test reconnu par davantage d'institutions
- Votre centre le plus proche propose uniquement le TEF

## Conversion des scores en CLB

Les deux tests utilisent la même grille de conversion CLB (Canadian Language Benchmarks). Un CLB 9 en TCF Canada équivaut à un CLB 9 en TEF Canada — les points CRS sont identiques.

## Notre recommandation

Pour la majorité des candidats camerounais, nous recommandons le **TCF Canada** pour sa plus grande disponibilité et son format légèrement plus accessible. Cependant, si vous avez déjà une préparation au TEF, continuez sur cette voie.

3M Travel propose des préparations pour les deux tests. Contactez-nous pour une évaluation de votre niveau actuel.`,
  },
  {
    slug: "express-entry-2026-guide-camerounais",
    title: "Express Entry 2026 : Ce qui Change et Comment en Profiter",
    category: "Immigration Canada",
    categoryColor: "bg-red-100 text-red-700",
    date: "2 janvier 2026",
    readTime: "10 min",
    author: "Marie-Claire Ngo",
    authorRole: "Conseillère en Immigration",
    excerpt: "Les changements majeurs d'Express Entry en 2026 : nouvelles catégories, scores CRS en baisse, avantages pour les francophones. Tout ce que les candidats camerounais doivent savoir.",
    image: "🍁",
    tags: ["Express Entry", "Immigration Canada", "CRS", "Résidence Permanente"],
    content: `## Express Entry 2026 : Les Grands Changements

L'année 2026 marque une nouvelle étape dans l'évolution d'Express Entry. L'IRCC a annoncé plusieurs modifications importantes qui **favorisent les candidats francophones** — une excellente nouvelle pour les Camerounais.

## Les nouvelles catégories de tirage

Depuis 2023, l'IRCC organise des **tirages catégoriels** en plus des tirages généraux. En 2026, les catégories prioritaires sont :

### 1. Catégorie Francophone
- Candidats avec **CLB 7 minimum en français** dans les 4 compétences
- **Bonus de +25 points CRS** pour les candidats francophones hors Québec
- Tirages dédiés avec des scores CRS plus bas (souvent 400-450 contre 480-520 pour les tirages généraux)

### 2. Catégorie Soins de Santé
- Infirmiers, médecins, pharmaciens, techniciens médicaux
- Score CRS moyen des tirages : 430-460
- Forte demande dans toutes les provinces

### 3. Catégorie Métiers Spécialisés
- Soudeurs, électriciens, plombiers, mécaniciens
- Score CRS moyen : 420-450
- Pénurie critique dans les provinces de l'Ouest

## Scores CRS actuels (janvier 2026)

| Type de tirage | Score CRS moyen | Fréquence |
|---|---|---|
| Tirage général | 480-510 | Bi-mensuel |
| Catégorie francophone | 410-440 | Mensuel |
| Catégorie santé | 430-460 | Mensuel |
| Catégorie métiers | 420-450 | Mensuel |

## Comment maximiser votre score CRS

### Facteurs les plus impactants

1. **Langue française (CLB 9-10)** : +32 à +34 points
2. **Langue anglaise (CLB 9-10)** : +32 à +34 points supplémentaires
3. **Diplôme canadien** : +15 à +30 points
4. **Offre d'emploi** : +50 à +200 points
5. **Nomination provinciale** : +600 points (accès quasi garanti)

### La stratégie gagnante pour les Camerounais

Les candidats camerounais ont un avantage unique : **la maîtrise du français**. En combinant un TCF Canada CLB 9+ avec un IELTS CLB 9+, il est possible d'obtenir **+60 à +70 points CRS** rien que sur les langues.

Ajoutez à cela un diplôme Bac+3 ou plus, une expérience professionnelle de 3+ ans, et vous atteignez facilement **450-480 points** — suffisant pour la plupart des tirages catégoriels.

## Plan d'action recommandé

1. **Mois 1-2** : Préparer et passer le TCF Canada (objectif CLB 9)
2. **Mois 2-3** : Préparer et passer l'IELTS (objectif CLB 9)
3. **Mois 3-4** : Faire évaluer vos diplômes (WES ou IQAS)
4. **Mois 4** : Créer votre profil Express Entry
5. **Mois 4-12** : Attendre l'ITA (Invitation to Apply)

3M Travel vous accompagne à chaque étape. Notre taux de succès Express Entry est de **94%** pour les dossiers complets.`,
  },
  {
    slug: "visa-schengen-cameroun-2026-guide",
    title: "Visa Schengen depuis le Cameroun en 2026 : Guide Pratique",
    category: "Visa Europe",
    categoryColor: "bg-purple-100 text-purple-700",
    date: "20 décembre 2025",
    readTime: "7 min",
    author: "Paul Essomba",
    authorRole: "Spécialiste Visa Europe",
    excerpt: "Comment obtenir un visa Schengen depuis Yaoundé ou Douala en 2026 : documents requis, ambassades, délais, taux d'acceptation et erreurs à éviter.",
    image: "🇪🇺",
    tags: ["Visa Schengen", "Europe", "Ambassade", "Cameroun"],
    content: `## Visa Schengen depuis le Cameroun : Ce qu'il Faut Savoir

L'espace Schengen regroupe **27 pays européens** accessibles avec un seul visa. Pour les Camerounais, l'obtention d'un visa Schengen reste possible mais nécessite une préparation rigoureuse.

## Ambassades disponibles à Yaoundé

| Pays | Centre de dépôt | Délai moyen |
|---|---|---|
| France | Ambassade de France (Bastos) | 15-21 jours |
| Allemagne | VFS Global | 10-15 jours |
| Belgique | Ambassade de Belgique | 15-25 jours |
| Espagne | VFS Global | 15-20 jours |
| Italie | VFS Global | 15-20 jours |

## Documents requis (liste standard)

### Documents personnels
- Passeport valide (6 mois après la date de retour prévue)
- Photos biométriques récentes (format Schengen)
- Formulaire de demande rempli et signé
- Assurance voyage (min. 30 000 EUR de couverture)

### Justificatifs financiers
- Relevés bancaires des 3 derniers mois (min. 500 000 FCFA recommandé)
- Attestation de travail ou de revenus
- Fiche de paie des 3 derniers mois

### Justificatifs du voyage
- **Réservation de vol confirmée** (sans paiement du billet — 3M Travel peut vous fournir ce document pour 5 000 FCFA)
- Réservation d'hôtel ou invitation d'un proche
- Itinéraire détaillé du voyage

## Erreurs fréquentes à éviter

1. **Relevés bancaires insuffisants** : moins de 3 mois ou solde trop faible
2. **Absence de réservation de vol** : beaucoup d'ambassades l'exigent maintenant
3. **Lettre de motivation vague** : soyez précis sur le but et la durée du voyage
4. **Passeport trop récent** : un passeport sans historique de voyages est un facteur de refus
5. **Demande trop tardive** : déposez votre dossier au moins 6 semaines avant le départ

## Taux d'acceptation 2025

Le taux d'acceptation des visas Schengen pour les Camerounais varie selon l'ambassade :
- France : ~65%
- Allemagne : ~70%
- Belgique : ~60%
- Espagne : ~72%

Avec un dossier bien préparé par 3M Travel, notre taux de succès est de **89%**.

## Conseil stratégique

Si vous avez un projet d'immigration à long terme en Europe, commencez par obtenir un visa visiteur. Un historique de voyages en Europe (séjours respectés, retours au Cameroun) renforce considérablement vos futures demandes de visa travail ou résidence.`,
  },
  {
    slug: "chancenkarte-allemagne-camerounais",
    title: "Chancenkarte Allemagne : La Nouvelle Opportunité pour les Camerounais",
    category: "Visa Europe",
    categoryColor: "bg-purple-100 text-purple-700",
    date: "10 décembre 2025",
    readTime: "8 min",
    author: "Jean-Baptiste Kamga",
    authorRole: "Expert Immigration",
    excerpt: "La Chancenkarte (Carte des Chances) allemande ouvre une nouvelle voie pour les travailleurs qualifiés camerounais. Découvrez le système de points, les conditions et comment postuler.",
    image: "🇩🇪",
    tags: ["Chancenkarte", "Allemagne", "Travail", "Immigration"],
    content: `## La Chancenkarte : Une Révolution pour l'Immigration en Allemagne

Entrée en vigueur en **juin 2024**, la Chancenkarte (littéralement "Carte des Chances") est un nouveau visa allemand qui permet aux travailleurs qualifiés de venir chercher un emploi en Allemagne **sans offre d'emploi préalable**. C'est une opportunité unique pour les Camerounais qualifiés.

## Le Système de Points

La Chancenkarte fonctionne sur un **système de points** (minimum 6 sur 10 requis) :

| Critère | Points |
|---|---|
| Diplôme reconnu en Allemagne (Bac+3 ou formation professionnelle) | 4 |
| Expérience professionnelle (5 ans ou plus) | 3 |
| Compétences en allemand (niveau A1 minimum) | 1 |
| Compétences en anglais (niveau B2 minimum) | 1 |
| Moins de 35 ans | 1 |
| Séjour antérieur en Allemagne | 1 |
| Conjoint qualifié | 1 |

**Exemple typique d'un candidat camerounais :**
- Ingénieur informatique (Bac+5) : 4 points
- 6 ans d'expérience : 3 points
- Niveau A2 en allemand : 1 point
- **Total : 8 points ✓**

## Conditions financières

Pour obtenir la Chancenkarte, vous devez prouver que vous pouvez **subvenir à vos besoins** pendant votre séjour de recherche d'emploi :
- Compte bancaire avec **minimum 12 000 EUR** (ou équivalent)
- OU garantie financière d'un tiers en Allemagne
- OU contrat de travail à temps partiel (20h/semaine maximum autorisé)

## Durée et renouvellement

- Durée initiale : **1 an**
- Renouvelable une fois pour 2 ans supplémentaires
- Conversion en permis de travail dès qu'un emploi est trouvé

## Secteurs qui recrutent

L'Allemagne manque de main-d'œuvre dans de nombreux secteurs :
- **Informatique et numérique** : développeurs, data scientists, cybersécurité
- **Santé** : infirmiers, aides-soignants, médecins
- **Ingénierie** : mécanique, électrique, génie civil
- **Artisanat** : électriciens, plombiers, menuisiers

## Apprendre l'allemand : par où commencer ?

Le niveau A1 minimum requis est accessible en **3 à 4 mois** d'apprentissage intensif. 3M Travel propose des cours de préparation TestDaF et des ressources pour débuter l'allemand depuis Yaoundé ou Douala.

## Notre accompagnement

3M Travel vous aide à :
1. Évaluer votre score de points
2. Faire reconnaître votre diplôme en Allemagne (procédure anabin)
3. Préparer votre dossier de demande de visa
4. Vous préparer à la recherche d'emploi en Allemagne`,
  },
  {
    slug: "ielts-toefl-canada-angleterre-guide",
    title: "IELTS ou TOEFL : Quel Test d'Anglais Choisir pour le Canada ou l'Angleterre ?",
    category: "Tests de Langue",
    categoryColor: "bg-blue-100 text-blue-700",
    date: "5 décembre 2025",
    readTime: "7 min",
    author: "Marie-Claire Ngo",
    authorRole: "Conseillère en Immigration",
    excerpt: "IELTS ou TOEFL ? Comparaison complète pour les candidats camerounais visant le Canada, le Royaume-Uni ou l'Australie. Scores requis, format, centres d'examen et conseils de préparation.",
    image: "🇬🇧",
    tags: ["IELTS", "TOEFL", "Anglais", "Canada", "Angleterre"],
    content: `## IELTS vs TOEFL : Quelle Différence ?

Pour immigrer au Canada, au Royaume-Uni ou en Australie, vous devez prouver votre niveau d'anglais. Les deux tests les plus reconnus sont l'**IELTS** (International English Language Testing System) et le **TOEFL iBT** (Test of English as a Foreign Language).

## Comparaison IELTS vs TOEFL

| Critère | IELTS Academic | TOEFL iBT |
|---|---|---|
| Organisateur | British Council / IDP | ETS (Educational Testing Service) |
| Format | Papier + oral en face à face | Entièrement sur ordinateur |
| Durée | 2h45 | 3h |
| Score | 0-9 (par bande) | 0-120 (total) |
| Validité | 2 ans | 2 ans |
| Coût (Cameroun) | ~100 000 FCFA | ~120 000 FCFA |
| Reconnaissance Canada | Oui (IRCC + universités) | Oui (universités surtout) |

## Scores requis pour le Canada (Express Entry)

Pour Express Entry, l'IRCC utilise le **CELPIP** ou l'**IELTS General Training** (pas Academic). Les scores CLB requis :

| CLB | IELTS General (score minimum) | Points CRS |
|---|---|---|
| CLB 7 | 6.0 dans chaque compétence | +6 |
| CLB 9 | 7.0 dans chaque compétence | +32 |
| CLB 10 | 8.0 dans chaque compétence | +34 |

**Note importante** : Pour Express Entry, utilisez l'**IELTS General Training**, pas l'IELTS Academic.

## Centres d'examen au Cameroun

**IELTS :**
- British Council Yaoundé (Bastos)
- IDP Yaoundé et Douala
- Sessions : 2-3 fois par mois

**TOEFL iBT :**
- Centres Prometric à Yaoundé et Douala
- Sessions : plusieurs fois par mois

## Notre recommandation

Pour le **Canada (Express Entry)** : IELTS General Training — plus reconnu par l'IRCC et format mieux adapté.

Pour les **universités canadiennes** : IELTS Academic ou TOEFL iBT — les deux sont acceptés.

Pour le **Royaume-Uni** : IELTS Academic — exigé par UK Visas and Immigration.

## Stratégie de préparation en 8 semaines

### Semaines 1-2 : Diagnostic
- Test blanc pour évaluer votre niveau actuel
- Identification des 2 compétences les plus faibles

### Semaines 3-6 : Préparation intensive
- Compréhension orale : podcasts BBC, CNN en anglais
- Expression écrite : 2 essays par semaine avec correction
- Compréhension écrite : articles The Guardian, The Economist
- Expression orale : entraînement avec un partenaire ou coach

### Semaines 7-8 : Simulations
- 2 tests blancs complets par semaine
- Révision des erreurs récurrentes
- Gestion du temps et du stress

3M Travel propose une **préparation IELTS complète** (90 000 FCFA) avec des formateurs certifiés.`,
  },
  {
    slug: "tcf-quebec-specificites-preparation",
    title: "TCF Québec : Spécificités et Préparation pour l'Immigration au Québec",
    category: "Tests de Langue",
    categoryColor: "bg-blue-100 text-blue-700",
    date: "28 novembre 2025",
    readTime: "6 min",
    author: "Jean-Baptiste Kamga",
    authorRole: "Expert Immigration",
    excerpt: "Le TCF Québec est différent du TCF Canada. Découvrez ses spécificités, les scores requis pour le PEQ et le PRTQ, et comment vous préparer efficacement depuis le Cameroun.",
    image: "🏔️",
    tags: ["TCF Québec", "Québec", "Immigration", "PEQ"],
    content: `## TCF Québec vs TCF Canada : Quelles Différences ?

Beaucoup de candidats confondent le **TCF Canada** et le **TCF Québec**. Ces deux tests sont distincts et servent des objectifs différents.

- **TCF Canada** : Pour les programmes fédéraux (Express Entry, PNP hors Québec)
- **TCF Québec** : Pour les programmes d'immigration du Québec (PEQ, PRTQ, PRTQ Travailleurs)

## Programmes d'immigration du Québec

### Programme de l'Expérience Québécoise (PEQ)
- Pour les diplômés d'établissements québécois ou travailleurs temporaires au Québec
- Exige un niveau **B2 minimum** (TCF Québec : score 549+)
- Traitement accéléré : 3-5 mois

### Programme Régulier des Travailleurs Qualifiés (PRTQ)
- Système de points basé sur l'âge, la formation, l'expérience et la langue
- Niveau de français requis : **B2 minimum** pour les points maximum
- Délai : 12-24 mois

## Scores TCF Québec et niveaux CECRL

| Niveau CECRL | Score TCF Québec | Points PRTQ |
|---|---|---|
| B1 | 453-548 | 4 points |
| B2 | 549-698 | 8 points |
| C1 | 699-833 | 12 points |
| C2 | 834-900 | 16 points |

## Format de l'examen TCF Québec

Le TCF Québec comprend les mêmes épreuves que le TCF Canada, mais avec des **thèmes et contextes spécifiques au Québec** : culture québécoise, vocabulaire local, accent québécois dans les épreuves orales.

**Conseil important** : Exposez-vous à l'accent québécois avant l'examen. Regardez des émissions québécoises (Tout le monde en parle, Infoman), écoutez Radio-Canada.

## Particularités du français québécois

Le français québécois présente des spécificités que vous devez connaître :
- Vocabulaire distinct (char = voiture, magasiner = faire du shopping, déjeuner = petit-déjeuner)
- Expressions idiomatiques propres
- Accent différent du français standard

Notre cours de préparation TCF Québec inclut un module spécifique sur le français québécois.`,
  },
  {
    slug: "cours-francais-yaounde-douala-immigration",
    title: "Cours de Français à Yaoundé et Douala pour l'Immigration : Guide 2026",
    category: "Conseils Pratiques",
    categoryColor: "bg-green-100 text-green-700",
    date: "20 novembre 2025",
    readTime: "5 min",
    author: "Paul Essomba",
    authorRole: "Spécialiste Visa Europe",
    excerpt: "Les meilleurs centres de langue à Yaoundé et Douala pour préparer vos tests TCF, TEF, DELF et DALF en vue d'une immigration au Canada, en France ou en Belgique.",
    image: "📚",
    tags: ["Cours de Français", "Yaoundé", "Douala", "TCF", "TEF", "DELF"],
    content: `## Où Apprendre le Français à Yaoundé et Douala pour l'Immigration ?

Si vous visez le Canada, la France, la Belgique ou la Suisse, votre niveau de français est un facteur déterminant. Voici les meilleurs centres de langue au Cameroun pour préparer vos tests officiels.

## Centres à Yaoundé

### Alliance Française de Yaoundé
- **Adresse** : Avenue du Général de Gaulle, Bastos
- **Cours proposés** : Tous niveaux A1 à C2, préparation TCF/DELF/DALF
- **Tarifs** : 80 000 à 150 000 FCFA selon le niveau
- **Atout** : Centre d'examen officiel TCF et DELF

### Institut Français du Cameroun (IFC)
- **Adresse** : Plateau, Yaoundé
- **Cours proposés** : Français général, préparation aux examens
- **Tarifs** : 70 000 à 130 000 FCFA
- **Atout** : Médiathèque et ressources numériques

### 3M Travel — Cours de Préparation
- **Format** : Cours intensifs en petits groupes (max 8 personnes)
- **Spécialité** : Préparation TCF Canada, TCF Québec, TEF Canada
- **Tarifs** : 80 000 FCFA (4-8 semaines)
- **Atout** : Formateurs spécialisés immigration, simulations d'examen

## Centres à Douala

### Alliance Française de Douala
- **Adresse** : Bonanjo, Douala
- **Cours proposés** : Tous niveaux, préparation TCF/DELF
- **Tarifs** : 80 000 à 140 000 FCFA
- **Atout** : Centre d'examen officiel

### Centre Culturel Français de Douala
- **Adresse** : Akwa, Douala
- **Cours proposés** : Français général et professionnel
- **Tarifs** : 75 000 à 120 000 FCFA

## Ressources en ligne gratuites

Pour compléter votre formation, utilisez ces ressources gratuites :

- **TV5Monde** (tv5monde.com) : cours de français gratuits, tous niveaux
- **RFI Savoirs** (savoirs.rfi.fr) : podcasts et exercices
- **Français Authentique** (YouTube) : méthode immersive populaire
- **Duolingo** : application mobile pour la pratique quotidienne
- **Anki** : flashcards pour le vocabulaire

## Planning recommandé selon votre objectif

| Objectif | Durée de préparation | Budget estimé |
|---|---|---|
| TCF Canada CLB 7 | 4-6 semaines | 80 000 FCFA |
| TCF Canada CLB 9 | 8-12 semaines | 120 000 FCFA |
| DELF B2 | 8-12 semaines | 100 000 FCFA |
| DALF C1 | 12-16 semaines | 130 000 FCFA |`,
  },
  {
    slug: "delf-dalf-visa-france-belgique",
    title: "DELF et DALF : Les Diplômes de Français pour Immigrer en France et en Belgique",
    category: "Tests de Langue",
    categoryColor: "bg-blue-100 text-blue-700",
    date: "15 novembre 2025",
    readTime: "6 min",
    author: "Marie-Claire Ngo",
    authorRole: "Conseillère en Immigration",
    excerpt: "DELF B2 ou DALF C1 pour votre visa étudiant ou travail en France ? Tout sur les diplômes officiels du CIEP, leur valeur pour l'immigration et comment les préparer au Cameroun.",
    image: "🎓",
    tags: ["DELF", "DALF", "France", "Belgique", "Visa Étudiant"],
    content: `## DELF et DALF : Diplômes à Vie pour le Français

Contrairement au TCF et au TEF, le **DELF** (Diplôme d'Études en Langue Française) et le **DALF** (Diplôme Approfondi de Langue Française) sont des **diplômes permanents** — ils n'expirent jamais. C'est un avantage considérable pour les candidats qui planifient leur immigration sur le long terme.

## Niveaux et équivalences

| Diplôme | Niveau CECRL | Utilisation immigration |
|---|---|---|
| DELF A1 | Débutant | Non pertinent pour l'immigration |
| DELF A2 | Élémentaire | Visa visiteur (certaines ambassades) |
| DELF B1 | Intermédiaire | Visa long séjour (minimum) |
| DELF B2 | Intermédiaire avancé | Visa étudiant France, Belgique |
| DALF C1 | Avancé | Visa travail qualifié, universités |
| DALF C2 | Maîtrise | Enseignement, professions libérales |

## Quand le DELF/DALF est-il requis ?

### Pour la France
- **Campus France** : le DELF B2 ou DALF C1 peut remplacer le TCF pour certaines universités
- **Visa travail** : le DALF C1 est apprécié pour les postes qualifiés
- **Naturalisation** : le DELF B1 minimum est exigé

### Pour la Belgique
- **Universités francophones** (UCLouvain, ULB, UNamur) : DELF B2 minimum
- **Visa travail** : DELF B2 recommandé

## Format des examens

### DELF B2 (le plus utile pour l'immigration)
- Compréhension de l'oral : 30 min
- Compréhension de l'écrit : 1h
- Production écrite : 1h
- Production orale : 20 min (préparation + passage)
- **Score minimum requis** : 50/100 avec minimum 5/25 par épreuve

### DALF C1
- Compréhension de l'oral : 40 min
- Compréhension de l'écrit : 1h
- Production écrite : 2h30
- Production orale : 30 min
- **Score minimum requis** : 50/100

## Centres d'examen au Cameroun

Les examens DELF/DALF sont organisés par l'**Alliance Française** et l'**Institut Français** à Yaoundé et Douala, 2 à 3 fois par an.

**Coût** : 60 000 à 100 000 FCFA selon le niveau.

## Notre conseil

Si vous visez la France ou la Belgique pour les études, investissez dans le **DELF B2** — c'est un diplôme permanent qui vous servira toute votre vie, contrairement au TCF qui expire après 2 ans.`,
  },
  {
    slug: "avi-attestation-virement-irrevocable-guide",
    title: "AVI pour Visa Étudiant : Tout Comprendre sur l'Attestation de Virement Irrévocable",
    category: "Conseils Pratiques",
    categoryColor: "bg-green-100 text-green-700",
    date: "8 novembre 2025",
    readTime: "7 min",
    author: "Paul Essomba",
    authorRole: "Spécialiste Visa Europe",
    excerpt: "L'AVI est obligatoire pour votre visa étudiant en France, au Canada ou en Belgique. Ce guide explique comment fonctionne l'Attestation de Virement Irrévocable, les montants requis et les banques partenaires au Cameroun.",
    image: "🏦",
    tags: ["AVI", "Visa Étudiant", "France", "Canada", "Banque"],
    content: `## L'AVI : La Clé de Votre Visa Étudiant

L'**Attestation de Virement Irrévocable (AVI)** est l'un des documents les plus importants de votre dossier de visa étudiant. Sans elle, votre demande sera automatiquement rejetée par la plupart des ambassades.

## Pourquoi l'AVI est-elle obligatoire ?

Les ambassades exigent la preuve que vous disposez des ressources financières suffisantes pour votre séjour. L'AVI est la forme la plus sécurisée de cette preuve car :

1. Les fonds sont **réellement bloqués** dans une banque
2. La banque certifie l'**authenticité** du virement
3. L'ambassade peut **vérifier directement** auprès de la banque
4. Les fonds ne peuvent être utilisés **qu'après votre arrivée**

## Montants requis par pays

| Pays | Montant minimum | Durée |
|---|---|---|
| France | 615 EUR × nombre de mois | Durée des études |
| Canada | 10 000 CAD | 1ère année |
| Belgique | 650 EUR × nombre de mois | Durée des études |
| Allemagne | 934 EUR × nombre de mois | Durée des études |
| Suisse | 21 000 CHF | 1 an |

**Exemple pour la France (Master 2 ans) :**
615 EUR × 24 mois = 14 760 EUR ≈ 9 700 000 FCFA

## Banques partenaires au Cameroun

Toutes les banques ne proposent pas le service de compte bloqué pour l'AVI. Voici les principales banques partenaires :

- **Afriland First Bank** : procédure bien rodée, délai 5-7 jours
- **SCB Cameroun** : partenaire officiel Campus France
- **UBA Cameroun** : service rapide, frais compétitifs
- **Ecobank** : présence dans plusieurs villes
- **BICEC** : banque historique, procédure fiable

## Processus étape par étape

### Étape 1 : Ouverture du compte bloqué (2-5 jours)
Rendez-vous à la banque avec votre pièce d'identité et votre lettre d'admission. La banque ouvre un compte spécial "compte bloqué immigration".

### Étape 2 : Virement des fonds (3-7 jours)
Effectuez le virement du montant requis depuis votre compte courant vers le compte bloqué. Conservez le reçu de virement.

### Étape 3 : Émission de l'AVI (24-48h)
La banque émet l'AVI — un document officiel signé et tamponné certifiant le blocage des fonds.

### Étape 4 : Intégration au dossier
Joignez l'AVI originale à votre dossier de demande de visa.

## Frais à prévoir

- **Frais de service 3M Travel** : 50 000 FCFA (accompagnement complet)
- **Frais d'ouverture de compte** : 5 000 à 15 000 FCFA (selon la banque)
- **Frais de virement** : 2 000 à 5 000 FCFA
- **Frais de gestion mensuelle** : 2 000 à 5 000 FCFA/mois

## Récupération des fonds

Une fois votre visa obtenu et votre arrivée dans le pays de destination, vous pouvez débloquer les fonds progressivement. La procédure varie selon la banque, mais en général vous recevez une carte bancaire internationale liée au compte bloqué.

3M Travel vous accompagne dans tout le processus AVI. Contactez-nous pour démarrer.`,
  },
];

// ─── Catégories ────────────────────────────────────────────────────────────
const CATEGORIES = ["Tous", "Tests de Langue", "Immigration Canada", "Visa Europe", "Conseils Pratiques"];

// ─── Composant Article Card ────────────────────────────────────────────────
function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${article.categoryColor}`}>
            {article.category}
          </span>
          <span className="text-4xl">{article.image}</span>
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{article.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {article.date}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {article.readTime}
          </span>
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold group-hover:gap-2 transition-all">
          Lire l'article <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Composant Article Detail ──────────────────────────────────────────────
function ArticleDetail({ article, onBack }: { article: Article; onBack: () => void }) {
  // Simple markdown-like renderer for the content
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        elements.push(<h2 key={key++} className="text-2xl font-black text-gray-900 mt-8 mb-4">{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={key++} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.slice(4)}</h3>);
      } else if (line.startsWith("| ")) {
        // Table
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].startsWith("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        i--;
        const rows = tableLines.filter(l => !l.match(/^\|[-\s|]+\|$/));
        elements.push(
          <div key={key++} className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
              {rows.map((row, ri) => {
                const cells = row.split("|").filter(c => c.trim() !== "");
                return (
                  <tr key={ri} className={ri === 0 ? "bg-blue-50" : "border-b border-gray-100 hover:bg-gray-50"}>
                    {cells.map((cell, ci) => (
                      ri === 0
                        ? <th key={ci} className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-200">{cell.trim()}</th>
                        : <td key={ci} className="px-3 py-2 text-gray-600 border border-gray-200">{cell.trim()}</td>
                    ))}
                  </tr>
                );
              })}
            </table>
          </div>
        );
      } else if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\* : (.+)$/);
        if (match) {
          elements.push(
            <li key={key++} className="flex items-start gap-2 text-gray-700 mb-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>{match[1]}</strong> : {match[2]}</span>
            </li>
          );
        } else {
          elements.push(<li key={key++} className="flex items-start gap-2 text-gray-700 mb-2"><span className="text-blue-500 mt-1">•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} /></li>);
        }
      } else if (line.match(/^\d+\. /)) {
        const text = line.replace(/^\d+\. /, "");
        elements.push(
          <li key={key++} className="flex items-start gap-2 text-gray-700 mb-2">
            <span className="text-blue-600 font-bold shrink-0">{line.match(/^\d+/)?.[0]}.</span>
            <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          </li>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={key++} className="h-2" />);
      } else {
        elements.push(
          <p key={key++} className="text-gray-700 leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
          />
        );
      }
    }
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au blog
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${article.categoryColor}`}>
              {article.category}
            </span>
            <span className="text-5xl">{article.image}</span>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <strong className="text-gray-700">{article.author}</strong>
              <span className="text-gray-400">— {article.authorRole}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {article.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readTime} de lecture
            </span>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed mb-8 italic border-l-4 border-blue-400 pl-4">
            {article.excerpt}
          </p>

          <div className="prose-content">
            {renderContent(article.content)}
          </div>

          {/* Tags */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] p-6 text-white">
          <h3 className="font-black text-lg mb-2">Prêt à démarrer votre projet d'immigration ?</h3>
          <p className="text-blue-200 text-sm mb-4">Obtenez une évaluation gratuite de votre profil par nos experts.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/#evaluation">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm">
                Évaluation gratuite
              </Button>
            </Link>
            <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white/50 text-white hover:bg-white/10 rounded-xl text-sm">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function Blog() {
  const params = useParams<{ slug?: string }>();
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // If slug in URL, show that article
  const slugArticle = params.slug ? ARTICLES.find(a => a.slug === params.slug) : null;
  const displayArticle = selectedArticle || slugArticle;

  const filteredArticles = ARTICLES.filter(a => {
    const matchCat = selectedCategory === "Tous" || a.category === selectedCategory;
    const matchSearch = searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  if (displayArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ArticleDetail article={displayArticle} onBack={() => setSelectedArticle(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#1D4ED8] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-amber-500 text-white mb-4 text-sm px-4 py-1">
              <BookOpen className="w-4 h-4 mr-1.5 inline" />
              Blog & Ressources
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Conseils Immigration & Tests de Langue
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-8">
              Guides pratiques rédigés par nos experts pour les candidats camerounais à l'immigration.
            </p>

            {/* Barre de recherche */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article (TCF, Express Entry, Schengen...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filtres catégories */}
      <section className="py-6 px-4 bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#1E3A8A] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">Aucun article trouvé</p>
              <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-6">
                {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""} trouvé{filteredArticles.length > 1 ? "s" : ""}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {filteredArticles.map(article => (
                  <ArticleCard
                    key={article.slug}
                    article={article}
                    onClick={() => setSelectedArticle(article)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-12 px-4 bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black mb-3">Restez informé des dernières actualités</h2>
          <p className="text-blue-200 mb-6">
            Rejoignez notre communauté WhatsApp pour recevoir les dernières actualités immigration, les ouvertures de programmes et les conseils de nos experts.
          </p>
          <a
            href="https://wa.me/237698104832?text=Bonjour%2C%20je%20souhaite%20rejoindre%20votre%20groupe%20WhatsApp%20d%27actualit%C3%A9s%20immigration."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl text-lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Rejoindre le groupe WhatsApp
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
