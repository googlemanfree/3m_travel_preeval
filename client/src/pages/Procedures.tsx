import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import ProcedureDetailModal from "@/components/ProcedureDetailModal";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import FullDossierForm from "@/components/FullDossierForm";
import type { ProcedureInfo } from "@/components/ProcedureDetailModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle, ChevronDown, ChevronUp,
  FileText, Globe, Star, Clock, DollarSign, CheckCircle,
  ArrowRight, Briefcase, GraduationCap, Eye, Home,
  Search, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Procedure {
  id: string;
  type: "travail" | "etudes" | "visiteur" | "residence";
  title: string;
  budget: string;
  delai: string;
  points: string[];
  whatsappMsg: string;
}

interface Destination {
  id: string;
  pays: string;
  flag: string;
  tagline: string;
  highlight: string;
  procedures: Procedure[];
}

interface Region {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  badge: string;
  destinations: Destination[];
}

// ─── Données complètes extraites des PDFs ─────────────────────────────────────
const REGIONS: Region[] = [
  {
    id: "canada",
    name: "🍁 Canada",
    subtitle: "Notre destination phare — Avantage francophone décisif",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_canada-5FXYWbUqwtBsoi8XsjZmJ2.webp",
    badge: "⭐ Recommandé",
    destinations: [
      {
        id: "canada-rp",
        pays: "Canada",
        flag: "🍁",
        tagline: "Résidence Permanente — Express Entry, PNP, Famille",
        highlight: "500 000 RP/an · Avantage bilingue +16 pts CRS",
        procedures: [
          {
            id: "ca-t1",
            type: "travail",
            title: "Express Entry — Travailleurs qualifiés fédéraux",
            budget: "À partir de 2 500 000 FCFA",
            delai: "6 mois après ITA",
            points: [
              "Résidence permanente directe — voie la plus rapide",
              "Score CRS calculé sur diplôme, expérience, langue, âge",
              "Avantage +16 pts CRS pour bilingues FR/EN camerounais",
              "Secteurs en tension : santé, BTP, IT, transport, hôtellerie",
              "Citoyenneté accessible après 3 ans de résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par Express Entry Canada (résidence permanente). Pouvez-vous évaluer mon profil ?",
          },
          {
            id: "ca-t2",
            type: "travail",
            title: "Programme Candidats des Provinces (PNP)",
            budget: "À partir de 2 500 000 FCFA",
            delai: "6–18 mois",
            points: [
              "10 provinces disponibles avec quotas spécifiques",
              "Québec : porte d'entrée privilégiée pour francophones",
              "Ontario, Colombie-Britannique, Alberta : très actifs",
              "Nomination provinciale = +600 pts CRS automatiques",
              "Voie directe vers la résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le PNP Canada. Pouvez-vous m'informer ?",
          },
          {
            id: "ca-t3",
            type: "travail",
            title: "Volet Métiers Spécialisés — Soudure, Logistique, Transport",
            budget: "À partir de 2 200 000 FCFA",
            delai: "6–12 mois",
            points: [
              "Soudure & Chaudronnerie (SCIAN 7237, 7238) — pénurie critique",
              "Chauffeurs poids lourds Classe 1 — forte demande nationale",
              "Logistique & Gestion chaîne d'approvisionnement",
              "Vente B2B & Représentation commerciale",
              "Certification via Red Seal ou équivalent provincial",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le volet Métiers Spécialisés Canada. Mon métier : ",
          },
          {
            id: "ca-e1",
            type: "etudes",
            title: "Study Permit — Permis d'études",
            budget: "À partir de 2 000 000 FCFA",
            delai: "6–12 mois avant rentrée",
            points: [
              "1ère destination mondiale étudiants : 800 000 étudiants étrangers",
              "Niveaux : Secondaire, DEC Cégep, Bac, Master, Doctorat, DEP",
              "Provinces : Québec, Ontario, Colombie-Britannique, Alberta",
              "PGWP (Post-Graduation Work Permit) : travailler 1–3 ans après diplôme",
              "Voie directe vers Express Entry et résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Study Permit Canada. Pouvez-vous m'accompagner ?",
          },
          {
            id: "ca-r1",
            type: "residence",
            title: "Regroupement Familial — Parrainage conjoint/parent",
            budget: "À partir de 1 500 000 FCFA",
            delai: "12–24 mois",
            points: [
              "Parrainage par conjoint, partenaire, enfant ou parent résident/citoyen",
              "Résidence permanente directe pour le parrainé",
              "Parrainage parents & grands-parents : Super Visa ou RP",
              "Engagement financier du parrain sur 3 ans minimum",
              "Traitement prioritaire pour conjoints et enfants",
            ],
            whatsappMsg: "Bonjour 3M Travel, j'ai un proche au Canada et je souhaite le rejoindre. Pouvez-vous m'informer sur le regroupement familial ?",
          },
        ],
      },
    ],
  },
  {
    id: "europe",
    name: "🇪🇺 Europe Schengen",
    subtitle: "30+ pays — Visa, Travail, Études, Résidence, Alternance",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_europe_schengen-axNNPzgDevQha8zjXRX6ed.webp",
    badge: "30+ pays",
    destinations: [
      {
        id: "luxembourg",
        pays: "Luxembourg",
        flag: "🇱🇺",
        tagline: "PIB/habitant le plus élevé au monde — Destination élite 3M",
        highlight: "Salaire min. 2 570 €/mois · Trilingue FR/DE/LU",
        procedures: [
          {
            id: "lu-t1",
            type: "travail",
            title: "Carte Bleue UE — Salarié Hautement Qualifié",
            budget: "À partir de 2 800 000 FCFA",
            delai: "3–5 mois",
            points: [
              "Salaire brut minimum exigé : 3 165 EUR/mois (seuil légal 2026)",
              "Contrat de travail visé par le Ministère des Affaires Étrangères (MAEE)",
              "Diplôme universitaire Bac+3 minimum ou 5 ans d'expérience",
              "Autorisation de séjour et de travail — Direction de l'Immigration",
              "Voie vers résidence permanente après 5 ans",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Carte Bleue UE Luxembourg. Pouvez-vous auditer mon profil ?",
          },
          {
            id: "lu-t2",
            type: "travail",
            title: "Visa Travailleur Salarié Standard — Validation ADEM",
            budget: "À partir de 2 500 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Offre d'emploi validée par l'ADEM (test du marché du travail)",
              "Secteurs en tension : BTP, hôtellerie-restauration, IT, finance",
              "Regroupement familial possible dès l'obtention du titre de séjour",
              "Audit préalable de vos diplômes et certifications par 3M Travel",
              "Accès frontalier France, Belgique, Allemagne — 3 pays en 30 min",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail Luxembourg (standard). Pouvez-vous m'accompagner ?",
          },
          {
            id: "lu-e1",
            type: "etudes",
            title: "Visa Études — Université du Luxembourg",
            budget: "À partir de 1 500 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Université du Luxembourg — classée top 200 mondial",
              "Cours en français, anglais et allemand",
              "Bourses d'études disponibles pour étudiants africains",
              "Travail autorisé 15h/semaine pendant les études",
              "Voie vers résidence permanente après 5 ans",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études au Luxembourg. Pouvez-vous m'informer ?",
          },
        ],
      },
      {
        id: "france",
        pays: "France",
        flag: "🇫🇷",
        tagline: "350 000 postes vacants · 185 métiers en tension · DOM-TOM",
        highlight: "SMIC 1 767 €/mois · Diaspora camerounaise 100 000+",
        procedures: [
          {
            id: "fr-t1",
            type: "travail",
            title: "Visa Travail — Métiers en Tension (185 métiers exemptés)",
            budget: "À partir de 2 600 000 FCFA",
            delai: "2–4 mois",
            points: [
              "185 métiers exemptés d'opposabilité de l'emploi",
              "Infirmiers, maçons, chauffeurs SPL, électriciens, développeurs IT",
              "SMIC 1 767 €/mois · Secteurs qualifiés : 2 500–6 000 €/mois",
              "EU Blue Card : diplôme Bac+3 + salaire ≥ 44 000 €/an",
              "DOM-TOM (Martinique, Guadeloupe, Guyane) : forte demande",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail France. Pouvez-vous m'accompagner ?",
          },
          {
            id: "fr-e1",
            type: "etudes",
            title: "Visa Études — BTS, Licence, Master, Alternance",
            budget: "À partir de 1 800 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Universités publiques, grandes écoles, BTS, IUT",
              "Alternance : contrat d'apprentissage rémunéré pendant les études",
              "Droit au travail 20h/semaine pendant les études",
              "Passerelle vers titre de séjour salarié après diplôme",
              "Campus France Cameroun — procédure bien codifiée",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en France. Pouvez-vous m'accompagner ?",
          },
          {
            id: "fr-v1",
            type: "visiteur",
            title: "Visa Visiteur Schengen — France",
            budget: "À partir de 400 000 FCFA",
            delai: "2–4 semaines",
            points: [
              "Ambassade directe à Yaoundé — procédure bien codifiée",
              "Court séjour 90 jours — tourisme, famille, affaires",
              "Accès à tout l'espace Schengen (27 pays)",
              "Stratégie : historique de séjour pour futur visa travail",
              "Délais prévisibles — traitement rapide",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur France. Pouvez-vous m'aider ?",
          },
        ],
      },
      {
        id: "allemagne",
        pays: "Allemagne",
        flag: "🇩🇪",
        tagline: "Chancenkarte · Ausbildung · 1ère économie d'Europe",
        highlight: "Salaire min. 12,41 €/h · Chancenkarte 2024",
        procedures: [
          {
            id: "de-t1",
            type: "travail",
            title: "Chancenkarte — Carte des Opportunités (2024)",
            budget: "À partir de 2 400 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Nouveau visa 2024 : chercher un emploi qualifié en Allemagne",
              "Système à points : diplôme (4), expérience (2), langue (2), âge (1)",
              "Score minimum 6/10 requis — travail partiel 20h/semaine autorisé",
              "Salaire min. 12,41 €/h · Secteurs IT, santé, ingénierie",
              "Voie vers résidence permanente après 4 ans",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Chancenkarte Allemagne. Pouvez-vous évaluer mes points ?",
          },
          {
            id: "de-f1",
            type: "travail",
            title: "Ausbildung — Formation Professionnelle Duale",
            budget: "À partir de 1 800 000 FCFA",
            delai: "6–12 mois",
            points: [
              "Formation rémunérée 700–1 200 €/mois pendant 2–3 ans",
              "Secteurs : soins infirmiers, mécanique, électronique, IT, BTP",
              "Diplôme reconnu dans toute l'Union Européenne",
              "Contrat de travail garanti à la fin de la formation",
              "Cours d'allemand obligatoire — niveau B1 minimum requis",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par l'Ausbildung en Allemagne. Pouvez-vous m'informer ?",
          },
          {
            id: "de-e1",
            type: "etudes",
            title: "Visa Études — Universités allemandes (frais quasi nuls)",
            budget: "À partir de 1 500 000 FCFA",
            delai: "3–5 mois",
            points: [
              "Universités publiques : frais quasi nuls (150–350 €/semestre)",
              "Top universités : TU Munich, Heidelberg, Berlin, Hambourg",
              "Cours en anglais disponibles dans de nombreux masters",
              "Travail autorisé 120 jours/an pendant les études",
              "Visa chercheur d'emploi 18 mois après obtention du diplôme",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en Allemagne. Pouvez-vous m'accompagner ?",
          },
          {
            id: "de-v1",
            type: "visiteur",
            title: "Visa Visiteur Schengen — Allemagne",
            budget: "À partir de 350 000 FCFA",
            delai: "2–5 semaines",
            points: [
              "Via VFS Global Yaoundé — centre de dépôt Allemagne",
              "Court séjour 90 jours — tourisme, affaires, famille",
              "Accès à tout l'espace Schengen (27 pays)",
              "Stratégie : 1er visa pour constituer un historique de voyages",
              "Berlin, Munich, Hambourg, Cologne — villes dynamiques",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur Allemagne. Pouvez-vous m'aider ?",
          },
        ],
      },
      {
        id: "pologne",
        pays: "Pologne",
        flag: "🇵🇱",
        tagline: "Recrutement direct · 25,36–25,50 PLN/h · Hébergement inclus",
        highlight: "6ème économie UE · Hub tech : Google, Microsoft, Samsung",
        procedures: [
          {
            id: "pl-t1",
            type: "travail",
            title: "Permis de Travail Type D — Industrie & Logistique",
            budget: "À partir de 2 200 000 FCFA",
            delai: "4–6 semaines",
            points: [
              "Contrat de travail signé avant le départ du Cameroun",
              "Salaire 25,36–25,50 PLN/h (≈ 5 500 PLN/mois brut)",
              "Hébergement entièrement pris en charge par l'employeur",
              "Secteurs : logistique lourde, manutention, production industrielle",
              "Via VFS Global Yaoundé — représentation Pologne par Allemagne",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail Pologne. Pouvez-vous m'accompagner ?",
          },
          {
            id: "pl-t2",
            type: "travail",
            title: "Placement Direct — Plateformes Logistiques (ID Logistics, Amazon)",
            budget: "À partir de 2 200 000 FCFA",
            delai: "4–6 semaines",
            points: [
              "Partenariat direct avec opérateurs logistiques majeurs",
              "Contrat à durée déterminée renouvelable (12 à 24 mois)",
              "Encadrement sur place à l'arrivée par un référent 3M Travel",
              "Possibilité de renouvellement et de régularisation après 2 ans",
              "Hub tech Wrocław, Cracovie, Varsovie — Silicon Tatra",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Placement Direct en Pologne. Pouvez-vous m'informer ?",
          },
          {
            id: "pl-e1",
            type: "etudes",
            title: "Visa Études — Universités polonaises",
            budget: "À partir de 1 200 000 FCFA",
            delai: "2–4 mois",
            points: [
              "Frais de scolarité très bas comparés à l'Europe occidentale",
              "Universités reconnues dans l'espace européen (Erasmus+)",
              "Cours disponibles en anglais dans de nombreux programmes",
              "Coût de la vie parmi les plus bas d'Europe",
              "Voie vers résidence permanente UE après diplôme",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en Pologne. Pouvez-vous m'informer ?",
          },
          {
            id: "pl-v1",
            type: "visiteur",
            title: "Visa Visiteur Schengen — Pologne",
            budget: "À partir de 350 000 FCFA",
            delai: "2–5 semaines",
            points: [
              "Via VFS Global Yaoundé — représentation par Allemagne",
              "Cracovie UNESCO, Auschwitz-Birkenau, Varsovie reconstituée",
              "Prix bien inférieurs à l'Europe occidentale",
              "Très bon rapport qualité/prix pour 1er visa Schengen",
              "Accès à tout l'espace Schengen",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur Pologne. Pouvez-vous m'aider ?",
          },
        ],
      },
      {
        id: "belgique",
        pays: "Belgique",
        flag: "🇧🇪",
        tagline: "Cœur de l'UE · Siège de la Commission Européenne · Francophone",
        highlight: "Salaire min. 1 994 €/mois · Bilingue FR/NL",
        procedures: [
          {
            id: "be-e1",
            type: "etudes",
            title: "Visa Études — UCLouvain, ULB, ULiège",
            budget: "À partir de 1 400 000 FCFA",
            delai: "3–5 mois",
            points: [
              "Universités francophones de rang mondial : UCLouvain, ULB, ULiège",
              "Frais modérés : 800–1 500 €/an pour étudiants hors-UE",
              "Bruxelles : capitale de l'UE — réseau professionnel unique",
              "Travail autorisé 20h/semaine pendant les études",
              "Voie vers résidence permanente après diplôme",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en Belgique. Pouvez-vous m'informer ?",
          },
          {
            id: "be-v1",
            type: "visiteur",
            title: "Visa Visiteur Schengen — Belgique",
            budget: "À partir de 350 000 FCFA",
            delai: "2–4 semaines",
            points: [
              "Ambassade de Belgique à Yaoundé — représentation Luxembourg incluse",
              "Bruxelles, Bruges, Gand — patrimoine UNESCO",
              "Accès à tout l'espace Schengen (27 pays)",
              "Stratégie : historique de voyages pour futur visa études",
              "Traitement rapide — délais prévisibles",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur Belgique. Pouvez-vous m'aider ?",
          },
        ],
      },
      {
        id: "autres-europe",
        pays: "Autres pays Schengen",
        flag: "🌍",
        tagline: "Portugal, Espagne, Italie, Pays-Bas, Suisse, Malte, Estonie, Hongrie...",
        highlight: "20+ pays couverts — Visiteur, Travail, Études",
        procedures: [
          {
            id: "eu-v1",
            type: "visiteur",
            title: "Visa Visiteur Schengen — Tous pays",
            budget: "À partir de 350 000 FCFA",
            delai: "2–6 semaines",
            points: [
              "Autriche, Danemark, Espagne, Finlande, Grèce, Hongrie",
              "Islande, Italie, Lettonie, Liechtenstein, Lituanie, Malte",
              "Pays-Bas, Portugal, Slovaquie, Slovénie, Suède, Suisse",
              "Turquie (visa électronique e-Visa disponible en ligne)",
              "Un seul visa Schengen = accès à 27 pays européens",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par un Visa Visiteur Schengen. Pouvez-vous m'accompagner ?",
          },
          {
            id: "eu-t1",
            type: "travail",
            title: "Visa Travail — Europe centrale & orientale",
            budget: "À partir de 1 800 000 FCFA",
            delai: "2–4 mois",
            points: [
              "Estonie : visa travail numérique — hub tech balte",
              "Hongrie : visa travail — salaire min. 232 000 HUF/mois",
              "Malte : visa travail — anglophone, hub financier méditerranéen",
              "Roumanie, Bulgarie, Croatie : recrutement direct disponible",
              "République Tchèque, Slovaquie : industrie automobile en tension",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par un Visa Travail en Europe centrale. Pouvez-vous m'informer ?",
          },
          {
            id: "eu-e1",
            type: "etudes",
            title: "Visa Études — Europe du Sud & Est",
            budget: "À partir de 1 000 000 FCFA",
            delai: "3–5 mois",
            points: [
              "Portugal : frais modérés, langue latine proche du français",
              "Espagne : universités reconnues, vie abordable",
              "Italie : art, design, gastronomie — universités historiques",
              "Danemark, Finlande : masters en anglais, bourses disponibles",
              "Malte : cours en anglais, passerelle vers Royaume-Uni",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par des Études en Europe du Sud. Pouvez-vous m'accompagner ?",
          },
        ],
      },
    ],
  },
  {
    id: "uk-usa",
    name: "🇬🇧🇺🇸 Royaume-Uni & États-Unis",
    subtitle: "Skilled Worker Visa · H-1B · NHS · Silicon Valley",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_uk_usa-AexsjiW7S4Up8p43DfNrkW.webp",
    badge: "Profils qualifiés",
    destinations: [
      {
        id: "uk",
        pays: "Royaume-Uni",
        flag: "🇬🇧",
        tagline: "Post-Brexit : Camerounais à égalité avec les Européens",
        highlight: "Skilled Worker Visa · NHS recrute massivement",
        procedures: [
          {
            id: "uk-t1",
            type: "travail",
            title: "Skilled Worker Visa — Royaume-Uni",
            budget: "À partir de 2 800 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Post-Brexit : plus de distinction UE/hors-UE — égalité totale",
              "NHS : recrutement massif infirmiers et médecins africains",
              "Secteur IT Londres : salaires 40 000–100 000 £/an",
              "Finance City of London : 1ère place financière mondiale",
              "Salaire min. 26 200 £/an (seuil Skilled Worker 2024)",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Skilled Worker Visa Royaume-Uni. Pouvez-vous m'accompagner ?",
          },
          {
            id: "uk-e1",
            type: "etudes",
            title: "Student Visa — Universités britanniques",
            budget: "À partir de 2 000 000 FCFA",
            delai: "3–5 mois",
            points: [
              "Oxford, Cambridge, Imperial, UCL — top universités mondiales",
              "Cours en anglais — atout pour Camerounais anglophones",
              "Graduate Route Visa : travailler 2 ans après le diplôme",
              "Travail autorisé 20h/semaine pendant les études",
              "Voie vers Skilled Worker Visa après diplôme",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études au Royaume-Uni. Pouvez-vous m'informer ?",
          },
        ],
      },
      {
        id: "usa",
        pays: "États-Unis",
        flag: "🇺🇸",
        tagline: "Silicon Valley · H-1B · Green Card · 1ère économie mondiale",
        highlight: "Salaires tech 150 000–300 000 USD/an",
        procedures: [
          {
            id: "us-t1",
            type: "travail",
            title: "Visa Travail H-1B — Profils IT, Ingénierie, Médecine",
            budget: "À partir de 3 200 000 FCFA",
            delai: "6–12 mois",
            points: [
              "Silicon Valley : salaires tech les plus élevés du monde",
              "H-1B : profils IT, ingénierie, médecine, finance",
              "Green Card après H-1B : résidence permanente",
              "Tirage au sort annuel H-1B — préparation dossier cruciale",
              "Visa O-1 (talent exceptionnel) : alternative sans tirage au sort",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa H-1B États-Unis. Pouvez-vous m'informer ?",
          },
          {
            id: "us-v1",
            type: "visiteur",
            title: "Visa Visiteur B1/B2 — Tourisme & Affaires",
            budget: "À partir de 600 000 FCFA",
            delai: "1–3 mois",
            points: [
              "B1 : affaires, conférences, négociations commerciales",
              "B2 : tourisme, famille, traitement médical",
              "Durée de séjour : jusqu'à 6 mois",
              "Entretien obligatoire à l'Ambassade de Yaoundé",
              "Stratégie : constitution d'un dossier solide pour maximiser les chances",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur USA (B1/B2). Pouvez-vous m'aider ?",
          },
        ],
      },
    ],
  },
  {
    id: "golfe",
    name: "🌙 Golfe & Moyen-Orient",
    subtitle: "0% impôt · Qatar · Dubaï · Île Maurice · Salaires compétitifs",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_golfe_moyen_orient-6T7Rz3aV2LexKUQihpNqoQ.webp",
    badge: "0% impôt",
    destinations: [
      {
        id: "qatar",
        pays: "Qatar",
        flag: "🇶🇦",
        tagline: "Qatar National Vision 2030 · 0% impôt sur le revenu",
        highlight: "QatarEnergy · Hamad Medical · IT Smart Qatar",
        procedures: [
          {
            id: "qa-t1",
            type: "travail",
            title: "Visa Travail — Qatar (Parrainage Employeur)",
            budget: "À partir de 2 600 000 FCFA",
            delai: "2–4 mois",
            points: [
              "0% impôt sur le revenu — salaire net = salaire brut",
              "Qatar National Vision 2030 : IT, santé, éducation, infrastructure",
              "QatarEnergy : 1ère réserve LNG mondiale — ingénieurs recherchés",
              "Hamad Medical Corporation : recrutement massif soignants",
              "Logement et transport souvent pris en charge par l'employeur",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail Qatar. Pouvez-vous m'accompagner ?",
          },
        ],
      },
      {
        id: "dubai",
        pays: "Dubaï (EAU)",
        flag: "🇦🇪",
        tagline: "Hub mondial · Freelance Visa · Nomade Digital · 0% impôt",
        highlight: "0% impôt · DIFC · Zones franches · Visa Nomade Digital",
        procedures: [
          {
            id: "ae-t1",
            type: "travail",
            title: "Visa Travail par Parrainage — EAU",
            budget: "À partir de 2 200 000 FCFA",
            delai: "1–3 mois",
            points: [
              "Système de parrainage (kafala) — l'employeur sponsor le visa",
              "Secteurs : hôtellerie 5 étoiles, sécurité, BTP, restauration, finance",
              "Emirates ID inclus dans le package employeur",
              "Logement et transport souvent pris en charge",
              "Salaire net exonéré d'impôt sur le revenu",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail Dubaï/EAU. Pouvez-vous m'informer ?",
          },
          {
            id: "ae-f1",
            type: "travail",
            title: "Freelance Visa & Nomade Digital — EAU",
            budget: "À partir de 1 500 000 FCFA",
            delai: "2–4 semaines",
            points: [
              "Freelance Visa : exercer en indépendant dans les zones franches (DMCC, DIFC)",
              "Visa Nomade Digital : résider aux EAU en travaillant pour un employeur étranger",
              "Visa de recherche d'emploi : 60 à 120 jours pour trouver un poste",
              "Pas de taxe sur le revenu, pas de TVA sur les services personnels",
              "Accès à un système bancaire international de premier rang",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Freelance Visa ou Nomade Digital Dubaï. Pouvez-vous m'informer ?",
          },
          {
            id: "ae-v1",
            type: "visiteur",
            title: "Visa Visiteur — Dubaï (30 jours extensibles)",
            budget: "À partir de 400 000 FCFA",
            delai: "1–2 semaines",
            points: [
              "Visa électronique disponible en ligne — simple et rapide",
              "30 jours extensibles à 60 jours",
              "Hub commercial mondial — networking exceptionnel",
              "Expo City Dubai, Burj Khalifa, Palm Jumeirah",
              "Stratégie : exploration avant visa travail ou résidence",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Visiteur Dubaï. Pouvez-vous m'aider ?",
          },
        ],
      },
      {
        id: "maurice",
        pays: "Île Maurice",
        flag: "🇲🇺",
        tagline: "Paradis fiscal africain · Résidence permanente accessible",
        highlight: "Impôt flat 15% · Bilingue FR/EN · Océan Indien",
        procedures: [
          {
            id: "mu-t1",
            type: "travail",
            title: "Occupation Permit — Travail & Résidence combinés",
            budget: "À partir de 1 500 000 FCFA",
            delai: "1–3 mois",
            points: [
              "Fiscalité très avantageuse — impôt flat 15%",
              "Bilingue anglais/français — intégration facile pour Camerounais",
              "Secteurs : tourisme, finance, IT, BPO (centres d'appels)",
              "Occupation Permit : travail + résidence combinés en un seul titre",
              "Résidence permanente après 3 ans",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par l'Occupation Permit Île Maurice. Pouvez-vous m'informer ?",
          },
        ],
      },
    ],
  },
  {
    id: "oceanie",
    name: "🌏 Océanie",
    subtitle: "Australie & Nouvelle-Zélande — Résidence Permanente",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_australia_nz-N2VuG4Tq6mjyiEWTQAi4tJ.webp",
    badge: "RP disponible",
    destinations: [
      {
        id: "australie",
        pays: "Australie",
        flag: "🇦🇺",
        tagline: "Résidence Permanente — Employeur, Indépendant, Famille, Régional",
        highlight: "Salaire min. 23,23 AUD/h · Mines, Santé, IT, BTP",
        procedures: [
          {
            id: "au-rp1",
            type: "residence",
            title: "Résidence Permanente — Voie Employeur (subclass 186/187)",
            budget: "À partir de 2 500 000 FCFA",
            delai: "6–24 mois",
            points: [
              "Sponsorisé par une entreprise australienne accréditée",
              "Subclass 186 (métropole) et 187 (régional) disponibles",
              "Secteurs en tension : santé, mines, IT, construction, agriculture",
              "Salaire min. 23,23 AUD/h (2024) — parmi les plus élevés au monde",
              "Citoyenneté accessible après 4 ans de résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Résidence Permanente Australie (voie employeur). Pouvez-vous m'accompagner ?",
          },
          {
            id: "au-rp2",
            type: "residence",
            title: "Résidence Permanente — Voie Indépendante (Points)",
            budget: "À partir de 2 200 000 FCFA",
            delai: "12–24 mois",
            points: [
              "Système à points : diplôme, expérience, anglais, âge",
              "Score minimum 65 points requis",
              "Skilled Nominated Visa (subclass 190) — nomination d'un État",
              "Voie régionale (subclass 491) : zones rurales — quotas plus faciles",
              "Working Holiday Visa (18–35 ans) : explorer et travailler",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Résidence Permanente Australie (voie indépendante). Pouvez-vous évaluer mes points ?",
          },
          {
            id: "au-e1",
            type: "etudes",
            title: "Student Visa — Universités australiennes",
            budget: "À partir de 2 000 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Universités du Groupe des 8 : Melbourne, Sydney, ANU, Queensland",
              "Cours en anglais — atout pour Camerounais anglophones",
              "Travail autorisé 48h/quinzaine pendant les études",
              "Post-Study Work Visa : travailler 2–4 ans après diplôme",
              "Passerelle vers la résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en Australie. Pouvez-vous m'informer ?",
          },
        ],
      },
      {
        id: "nouvelle-zelande",
        pays: "Nouvelle-Zélande",
        flag: "🇳🇿",
        tagline: "Green List · Skilled Migrant · Qualité de vie top 5 mondial",
        highlight: "Green List · SMC Points · Famille · Affaires",
        procedures: [
          {
            id: "nz-rp1",
            type: "residence",
            title: "Résidence Permanente — Green List & Skilled Migrant",
            budget: "À partir de 2 000 000 FCFA",
            delai: "6–18 mois",
            points: [
              "Green List : métiers en pénurie — résidence directe ou accélérée",
              "Skilled Migrant Category (SMC) : système à points",
              "Voie familiale : rejoindre un proche résident ou citoyen",
              "Voie affaires : investissement minimum requis",
              "Qualité de vie classée top 5 mondial — nature préservée",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Résidence Permanente Nouvelle-Zélande. Pouvez-vous m'accompagner ?",
          },
          {
            id: "nz-t1",
            type: "travail",
            title: "Accredited Employer Work Visa (AEWV)",
            budget: "À partir de 2 000 000 FCFA",
            delai: "3–6 mois",
            points: [
              "Salaire min. 22,70 NZD/h (2024)",
              "Secteurs en tension : santé, IT, construction, agriculture",
              "Employeur accrédité par Immigration New Zealand",
              "Working Holiday Visa (18–35 ans) disponible",
              "Passerelle vers résidence permanente",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Travail Nouvelle-Zélande. Pouvez-vous m'informer ?",
          },
        ],
      },
    ],
  },
  {
    id: "caucase",
    name: "🌿 Caucase & Stratégie Schengen",
    subtitle: "Arménie · Géorgie · Azerbaïdjan — Entrée libre, stratégie visa",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663571863877/GebUu8iQdw8TShCpTwPjnX/dest_caucase-MT44CPwLLTnPY8e8htrQTC.webp",
    badge: "Sans visa",
    destinations: [
      {
        id: "armenie",
        pays: "Arménie",
        flag: "🇦🇲",
        tagline: "Entrée libre 180j · 20–40 USD/jour · Stratégie Schengen documentée",
        highlight: "Aucun visa requis · 1er voyage international idéal",
        procedures: [
          {
            id: "am-v1",
            type: "visiteur",
            title: "Séjour Arménie — Entrée libre (aucun visa)",
            budget: "À partir de 300 000 FCFA",
            delai: "Immédiat",
            points: [
              "Entrée libre 180 jours — aucun visa requis pour Camerounais",
              "Coût de la vie : 20–40 USD/jour — très abordable",
              "Erevan : capitale moderne, gastronomie exceptionnelle",
              "Stratégie 3M : construire historique voyages pour visa Schengen",
              "Guide VisaSchengen via Arménie — stratégie documentée dans nos PDFs",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la stratégie Arménie pour obtenir un visa Schengen. Pouvez-vous m'expliquer ?",
          },
          {
            id: "am-e1",
            type: "etudes",
            title: "Visa Études — Arménie (médecine, ingénierie, IT)",
            budget: "À partir de 800 000 FCFA",
            delai: "1–2 mois",
            points: [
              "Universités reconnues — frais très bas (500–2 000 USD/an)",
              "Médecine, ingénierie, informatique — formations solides",
              "Diplôme reconnu dans l'espace post-soviétique",
              "Stratégie : études + constitution dossier Schengen",
              "Communauté africaine croissante à Erevan",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en Arménie. Pouvez-vous m'informer ?",
          },
        ],
      },
      {
        id: "georgie",
        pays: "Géorgie",
        flag: "🇬🇪",
        tagline: "Entrée libre · Hub numérique · Tbilissi cosmopolite",
        highlight: "Sans visa · Coût de vie bas · Économie en croissance",
        procedures: [
          {
            id: "ge-v1",
            type: "visiteur",
            title: "Séjour Géorgie — Entrée libre (aucun visa)",
            budget: "À partir de 300 000 FCFA",
            delai: "Immédiat",
            points: [
              "Entrée libre pour Camerounais — pas de visa requis",
              "Tbilissi : ville cosmopolite, gastronomie unique, architecture",
              "Coût de vie très bas — idéal pour nomades numériques",
              "Hub tech émergent — startups en croissance",
              "Stratégie : constitution historique voyages pour Schengen",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par un séjour en Géorgie. Pouvez-vous m'accompagner ?",
          },
        ],
      },
      {
        id: "azerbaidjan",
        pays: "Azerbaïdjan",
        flag: "🇦🇿",
        tagline: "Bakou moderne · Pétrole & Gaz · e-Visa disponible",
        highlight: "e-Visa simple · Économie pétrolière · Pont Europe-Asie",
        procedures: [
          {
            id: "az-v1",
            type: "visiteur",
            title: "e-Visa Azerbaïdjan — En ligne, 3–5 jours",
            budget: "À partir de 250 000 FCFA",
            delai: "3–5 jours",
            points: [
              "e-Visa en ligne — simple et rapide",
              "Bakou : architecture futuriste, Vieille Ville UNESCO",
              "Carrefour Europe-Asie — position géostratégique unique",
              "Secteur pétrolier et gazier — opportunités pour ingénieurs",
              "Coût de vie modéré — bonne qualité de vie",
            ],
            whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le e-Visa Azerbaïdjan. Pouvez-vous m'aider ?",
          },
        ],
      },
    ],
  },
];

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  travail: { icon: Briefcase, label: "Travail", color: "bg-blue-100 text-blue-700" },
  etudes: { icon: GraduationCap, label: "Études", color: "bg-purple-100 text-purple-700" },
  visiteur: { icon: Eye, label: "Visiteur", color: "bg-green-100 text-green-700" },
  residence: { icon: Home, label: "Résidence", color: "bg-amber-100 text-amber-700" },
};

// ─── ProcedureCard ────────────────────────────────────────────────────────────
function ProcedureCard({ proc, dest, onStartProcedure }: {
  proc: Procedure;
  dest: Destination;
  onStartProcedure: (info: ProcedureInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CONFIG[proc.type];
  const Icon = cfg.icon;

  const handleStart = () => {
    onStartProcedure({
      id: proc.id,
      type: proc.type,
      title: proc.title,
      budget: proc.budget,
      delai: proc.delai,
      points: proc.points,
      destination: dest.pays,
      flag: dest.flag,
    });
  };

  return (
    <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 flex-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 mt-0.5 ${cfg.color}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
            <h4 className="text-sm font-semibold text-gray-800 leading-tight">{proc.title}</h4>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0 mt-0.5"
            aria-label={open ? "Réduire" : "Voir les détails"}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" />{proc.budget}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" />{proc.delai}</span>
        </div>

        {open && (
          <ul className="space-y-1.5 mb-3 border-t pt-3">
            {proc.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleStart}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-all duration-200 active:scale-[0.97]"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Démarrer ma procédure
        </button>
      </CardContent>
    </Card>
  );
}

// ─── DestinationSection ───────────────────────────────────────────────────────
function DestinationSection({ dest, onStartProcedure }: {
  dest: Destination;
  onStartProcedure: (info: ProcedureInfo) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div id={`dest-${dest.id}`} className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dest.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{dest.pays}</h3>
              <Badge variant="outline" className="text-xs">
                {dest.procedures.length} procédure{dest.procedures.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{dest.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-blue-600 font-medium max-w-xs text-right">{dest.highlight}</span>
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-gray-50 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dest.procedures.map(proc => (
            <ProcedureCard key={proc.id} proc={proc} dest={dest} onStartProcedure={onStartProcedure} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RegionCard ───────────────────────────────────────────────────────────────
function RegionCard({ region, onSelect }: { region: Region; onSelect: () => void }) {
  const totalProcedures = region.destinations.reduce((sum, d) => sum + d.procedures.length, 0);

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={region.image}
          alt={region.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
            {region.badge}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-black text-lg leading-tight">{region.name}</h3>
          <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{region.subtitle}</p>
        </div>
      </div>
      <div className="bg-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{region.destinations.length} pays</span>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{totalProcedures} procédures</span>
        </div>
        <span className="text-blue-600 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Explorer <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// ─── Search index ────────────────────────────────────────────────────────────
interface SearchResult {
  regionId: string;
  regionName: string;
  destinationId: string;
  pays: string;
  flag: string;
  procedureTitle: string;
  procedureType: string;
  keywords: string;
}

const SEARCH_INDEX: SearchResult[] = REGIONS.flatMap(region =>
  region.destinations.flatMap(dest =>
    dest.procedures.map(proc => ({
      regionId: region.id,
      regionName: region.name,
      destinationId: dest.id,
      pays: dest.pays,
      flag: dest.flag,
      procedureTitle: proc.title,
      procedureType: proc.type,
      keywords: `${dest.pays} ${region.name} ${proc.title} ${proc.type}`.toLowerCase(),
    }))
  )
);

// Quick-access country tags
const QUICK_TAGS = [
  { label: "🍁 Canada", regionId: "canada" },
  { label: "🇫🇷 France", regionId: "europe" },
  { label: "🇩🇪 Allemagne", regionId: "europe" },
  { label: "🇱🇺 Luxembourg", regionId: "europe" },
  { label: "🇵🇱 Pologne", regionId: "europe" },
  { label: "🇬🇧 Royaume-Uni", regionId: "uk-usa" },
  { label: "🇺🇸 États-Unis", regionId: "uk-usa" },
  { label: "🇶🇦 Qatar", regionId: "golfe" },
  { label: "🇦🇪 Dubaï", regionId: "golfe" },
  { label: "🇦🇺 Australie", regionId: "oceanie" },
  { label: "🇳🇿 N.-Zélande", regionId: "oceanie" },
  { label: "🇦🇲 Arménie", regionId: "caucase" },
];

export default function Procedures() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // ─── États du tunnel de conversion ────────────────────────────────────────────────────────────
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalStep, setEvalStep] = useState(1);
  const [evalData, setEvalData] = useState({ nom: "", email: "", tel: "", destination: "", type: "", niveau: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureInfo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScoringForm, setShowScoringForm] = useState(false);

  // Rediriger si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login?redirect=/procedures");
    }
  }, [user, authLoading, setLocation]);

  // Afficher un écran de chargement pendant la vérification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre authentification...</p>
        </div>
      </div>
    );
  }

  // Ne pas afficher le contenu si non authentifié
  if (!user) {
    return null;
  }

  const handleStartProcedure = (info: ProcedureInfo) => {
    setSelectedProcedure(info);
    setShowDetailModal(true);
  };

  const handleContinueToScoring = () => {
    setShowDetailModal(false);
    setShowScoringForm(true);
  };

  // Mapper le type de procédure vers le type de visa FullDossierForm
  const getProcedureVisaType = (type?: string) => {
    if (!type) return undefined;
    const map: Record<string, string> = {
      travail: "travail", etudes: "etude", visiteur: "tourisme", residence: "residence"
    };
    return map[type] ?? undefined;
  };

  const handleCloseTunnel = () => {
    setShowDetailModal(false);
    setShowScoringForm(false);
    setSelectedProcedure(null);
  };

  const selectedRegion = REGIONS.find(r => r.id === activeRegion);
  const totalProcedures = REGIONS.reduce((s, r) => s + r.destinations.reduce((ss, d) => ss + d.procedures.length, 0), 0);

  // Filtered search results (max 12)
  const searchResults = searchQuery.trim().length >= 2
    ? SEARCH_INDEX.filter(item => item.keywords.includes(searchQuery.toLowerCase())).slice(0, 12)
    : [];

  // Group results by region
  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.regionId]) acc[item.regionId] = [];
    acc[item.regionId].push(item);
    return acc;
  }, {});

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectResult = (regionId: string, destinationId?: string) => {
    setActiveRegion(regionId);
    setSearchQuery("");
    setSearchFocused(false);
    // Scroll to content then optionally to specific destination
    setTimeout(() => {
      if (destinationId) {
        const el = document.getElementById(`dest-${destinationId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.classList.add("ring-2", "ring-sky-400", "ring-offset-2");
          setTimeout(() => el.classList.remove("ring-2", "ring-sky-400", "ring-offset-2"), 2500);
        }
      } else {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    }, 100);
  };

  const handleEvalSubmit = () => {
    const msg = `Bonjour 3M Travel & Services,\n\nJe souhaite une évaluation de mon dossier :\n\n👤 Nom : ${evalData.nom}\n📧 Email : ${evalData.email}\n📱 Téléphone : ${evalData.tel}\n🌍 Destination : ${evalData.destination}\n📋 Type de visa : ${evalData.type}\n🎓 Niveau d'études : ${evalData.niveau}\n\nMerci de me contacter pour la suite de la procédure.`;
    window.open(`https://wa.me/237698104832?text=${encodeURIComponent(msg)}`, "_blank");
    setShowEvalModal(false);
    setEvalStep(1);
    setEvalData({ nom: "", email: "", tel: "", destination: "", type: "", niveau: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
            🌍 {totalProcedures} procédures officielles · {REGIONS.length} grandes régions · Mis à jour 2026
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Nous vous accompagnons<br />
            <span className="text-sky-300">partout dans le monde</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Canada, Europe Schengen, Royaume-Uni, États-Unis, Golfe & Moyen-Orient, Océanie, Caucase…
            Choisissez votre destination et découvrez toutes les procédures disponibles.
          </p>
          {/* ── Barre de recherche ── */}
          <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6">
            <div className={`flex items-center bg-white rounded-2xl shadow-xl transition-all duration-200 ${searchFocused ? "ring-4 ring-sky-300/50" : ""}`}>
              <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Rechercher un pays, un visa, une procédure..."
                className="flex-1 px-4 py-4 text-gray-800 bg-transparent outline-none text-base placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="mr-3 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown résultats */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun résultat pour <strong>"{searchQuery}"</strong></p>
                    <p className="text-xs text-gray-400 mt-1">Essayez : Canada, France, Qatar, Australie...</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedResults).map(([regionId, items]) => (
                      <div key={regionId}>
                        <div className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
                          {items[0].regionName}
                        </div>
                        {items.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectResult(item.regionId, item.destinationId)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                          >
                            <span className="text-xl">{item.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 truncate">{item.pays}</div>
                              <div className="text-xs text-gray-500 truncate">{item.procedureTitle}</div>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {item.procedureType === "travail" ? "💼 Travail" : item.procedureType === "etudes" ? "🎓 Études" : item.procedureType === "residence" ? "🏠 Résidence" : "👁️ Visiteur"}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ))}
                    <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                      {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} trouvé{searchResults.length > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags rapides */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag.label}
                onClick={() => handleSelectResult(tag.regionId)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-full border border-white/20 transition-all duration-150 hover:scale-105"
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => setShowEvalModal(true)} className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-6">
              <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
            </Button>
            <a href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20je%20souhaite%20des%20informations%20sur%20vos%20destinations" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* ── Conformité ── */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <p className="max-w-5xl mx-auto text-xs text-amber-800 text-center">
          ⚖️ <strong>3M Travel & Services SARL</strong> — RC/YAO/2019/A/2567 | NIU : M112417203369H — Rôle de conseil et d'accompagnement. Les décisions d'octroi de visa appartiennent exclusivement aux autorités consulaires.
        </p>
      </div>

      {/* ── Contenu principal ── */}
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Vue régions (grille) - Masquée avec CSS quand activeRegion est défini */}
        <div className={activeRegion ? "hidden" : ""}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Choisissez votre région de destination</h2>
            <p className="text-gray-500 text-sm">Cliquez sur une région pour explorer toutes les procédures disponibles</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REGIONS.map(region => (
              <RegionCard key={region.id} region={region} onSelect={() => setActiveRegion(region.id)} />
            ))}
          </div>

          {/* Stats rapides */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Procédures", value: `${totalProcedures}+`, icon: FileText, color: "text-blue-600" },
              { label: "Pays couverts", value: "30+", icon: Globe, color: "text-green-600" },
              { label: "Dossiers traités", value: "1 247+", icon: CheckCircle, color: "text-purple-600" },
              { label: "Taux de succès", value: "89%", icon: Star, color: "text-amber-600" },
            ].map(stat => (
              <Card key={stat.label} className="text-center p-4">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Vue détail région - Masquée avec CSS quand activeRegion n'est pas défini */}
        <div className={!activeRegion || !selectedRegion ? "hidden" : ""}>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveRegion(null)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Toutes les régions
            </button>
            <span className="text-gray-300">|</span>
            <h2 className="text-xl font-black text-gray-900">{selectedRegion?.name}</h2>
          </div>

          {/* Hero région */}
          {selectedRegion && (
            <div className="relative rounded-2xl overflow-hidden mb-8 h-48">
              <img src={selectedRegion.image} alt={selectedRegion.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
                <div>
                  <h3 className="text-white text-2xl font-black">{selectedRegion.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{selectedRegion.subtitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Destinations */}
          {selectedRegion && (
            <div className="space-y-3">
              {selectedRegion.destinations.map(dest => (
                <DestinationSection key={dest.id} dest={dest} onStartProcedure={handleStartProcedure} />
              ))}
            </div>
          )}

          {/* CTA bas de page */}
          <div className="mt-10 bg-blue-700 rounded-2xl p-6 text-white text-center">
            <h3 className="text-xl font-black mb-2">Vous ne savez pas quelle procédure choisir ?</h3>
            <p className="text-blue-100 text-sm mb-4">Nos conseillers analysent votre profil gratuitement et vous orientent vers la meilleure voie.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setShowEvalModal(true)} className="bg-white text-blue-800 hover:bg-blue-50 font-bold">
                <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
              </Button>
              <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp direct
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Évaluation ── */}
      <Dialog open={showEvalModal} onOpenChange={setShowEvalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-800 font-black">
              {evalStep === 1 ? "📋 Évaluation gratuite — Étape 1/3" :
               evalStep === 2 ? "🌍 Votre projet — Étape 2/3" :
               "✅ Confirmation — Étape 3/3"}
            </DialogTitle>
          </DialogHeader>

          {evalStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Vos informations personnelles</p>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nom complet *" value={evalData.nom} onChange={e => setEvalData({ ...evalData, nom: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Email *" type="email" value={evalData.email} onChange={e => setEvalData({ ...evalData, email: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Téléphone (WhatsApp) *" value={evalData.tel} onChange={e => setEvalData({ ...evalData, tel: e.target.value })} />
              <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={() => setEvalStep(2)} disabled={!evalData.nom || !evalData.tel}>
                Suivant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {evalStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Votre projet de mobilité</p>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={evalData.destination} onChange={e => setEvalData({ ...evalData, destination: e.target.value })}>
                <option value="">Destination souhaitée *</option>
                <optgroup label="🍁 Canada">
                  <option>Canada — Express Entry (Résidence Permanente)</option>
                  <option>Canada — Études (Study Permit)</option>
                  <option>Canada — Travail temporaire</option>
                </optgroup>
                <optgroup label="🇪🇺 Europe Schengen">
                  <option>Luxembourg</option>
                  <option>France</option>
                  <option>Allemagne</option>
                  <option>Pologne</option>
                  <option>Belgique</option>
                  <option>Autre pays Schengen</option>
                </optgroup>
                <optgroup label="🇬🇧🇺🇸 UK & USA">
                  <option>Royaume-Uni</option>
                  <option>États-Unis</option>
                </optgroup>
                <optgroup label="🌙 Golfe">
                  <option>Qatar</option>
                  <option>Dubaï (EAU)</option>
                  <option>Île Maurice</option>
                </optgroup>
                <optgroup label="🌏 Océanie">
                  <option>Australie</option>
                  <option>Nouvelle-Zélande</option>
                </optgroup>
                <optgroup label="🌿 Caucase">
                  <option>Arménie</option>
                  <option>Géorgie</option>
                  <option>Azerbaïdjan</option>
                </optgroup>
              </select>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={evalData.type} onChange={e => setEvalData({ ...evalData, type: e.target.value })}>
                <option value="">Type de visa *</option>
                <option>Visa Travail</option>
                <option>Visa Études</option>
                <option>Visa Visiteur / Tourisme</option>
                <option>Résidence Permanente</option>
                <option>Regroupement Familial</option>
                <option>Je ne sais pas encore</option>
              </select>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={evalData.niveau} onChange={e => setEvalData({ ...evalData, niveau: e.target.value })}>
                <option value="">Niveau d'études *</option>
                <option>BEPC / Brevet</option>
                <option>Baccalauréat</option>
                <option>BTS / DUT (Bac+2)</option>
                <option>Licence (Bac+3)</option>
                <option>Master (Bac+5)</option>
                <option>Doctorat</option>
                <option>Formation professionnelle / CAP / BEP</option>
              </select>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEvalStep(1)}>← Retour</Button>
                <Button className="flex-1 bg-blue-700 hover:bg-blue-800" onClick={() => setEvalStep(3)} disabled={!evalData.destination || !evalData.type}>
                  Suivant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {evalStep === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
                <p><strong>Nom :</strong> {evalData.nom}</p>
                <p><strong>Téléphone :</strong> {evalData.tel}</p>
                <p><strong>Destination :</strong> {evalData.destination}</p>
                <p><strong>Type :</strong> {evalData.type}</p>
                <p><strong>Niveau :</strong> {evalData.niveau}</p>
              </div>
              <p className="text-xs text-gray-500 text-center">En cliquant sur Envoyer, vous serez redirigé vers WhatsApp pour finaliser votre demande.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEvalStep(2)}>← Retour</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleEvalSubmit}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Envoyer sur WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Tunnel de conversion : Fiche détail + Formulaire scoring ── */}
      <ProcedureDetailModal
        procedure={selectedProcedure}
        open={showDetailModal}
        onClose={handleCloseTunnel}
        onContinue={handleContinueToScoring}
      />
      {/* Formulaire complet de constitution de dossier */}
      {showScoringForm && (
        <Dialog open={showScoringForm} onOpenChange={(o) => !o && handleCloseTunnel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-bold">
                  Constitution de dossier
                  {selectedProcedure && (
                    <span className="text-blue-600 ml-2 text-base font-normal">
                      — {selectedProcedure.title}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              <FullDossierForm
                initialVisaType={getProcedureVisaType(selectedProcedure?.type) as import('@/components/FullDossierForm').VisaCategory}
                initialDestination={selectedProcedure?.destination ?? ""}
                procedureId={selectedProcedure?.id}
                procedureTitle={selectedProcedure?.title}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── SECTION CRÉDIBILITÉ ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Confiance & Transparence</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Nos Certifications & Coordonnées</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nous sommes une agence officiellement enregistrée et transparente. Consultez nos informations de certification et nos coordonnées de contact.
            </p>
          </div>
          <CredibilityBadge />
        </div>
      </section>

      <Footer />
    </div>
  );
}
