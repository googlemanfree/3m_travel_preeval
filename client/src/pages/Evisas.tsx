import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, MessageCircle, Globe, ShieldCheck, Clock, FileText, Sparkles, CheckCircle2, AlertTriangle, CheckSquare, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { evisasDatabaseComplete } from '@/data/evisasDatabaseComplete';

interface Evisa {
  country: string;
  flag: string;
  region: string;
  type: string;
  duration: string;
  delay: string;
  docs: string;
  fee: string;
  note: string;
  image: string;
}

interface DocumentDetail {
  title: string;
  description: string;
  tip: string;
}

const nationalitesList = [
  "Camerounaise",
  "Française",
  "Gabonaise",
  "Ivoirienne",
  "Sénégalaise",
  "Congolaise (RC)",
  "Congolaise (RDC)",
  "Tchadienne",
  "Malienne",
  "Burkinabé",
  "Béninoise",
  "Ghanéenne",
  "Guinéenne",
  "Marocaine",
  "Algérienne",
  "Tunisienne",
  "Autre nationalité"
];

const ultimateWorldEvisasDatabase: Evisa[] = [
  // ================= AFRIQUE (24 destinations) =================
  {
    country: "Égypte",
    flag: "🇪🇬",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "2-5 jours ouvrés",
    docs: "Passeport (+6 mois), Photo d'identité, Réservation d'hôtel, Billet A/R",
    fee: "25 USD",
    note: "Entrée simple ou multiple disponible via le portail officiel égyptien.",
    image: "https://images.unsplash.com/photo-1572252009286-2683c5fa7eb0?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Kenya",
    flag: "🇰🇪",
    region: "Afrique",
    type: "eTA Électronique",
    duration: "90 jours",
    delay: "24h - 72h",
    docs: "Passeport, Billet d'avion A/R, Justificatif d'hébergement ou invitation",
    fee: "34 USD",
    note: "Autorisation de Voyage Électronique (eTA) obligatoire pour tous les voyageurs.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Tanzanie & Zanzibar",
    flag: "🇹🇿",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "90 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Photo récente, Billet de retour",
    fee: "50 USD",
    note: "Valable pour le continent et l'île de Zanzibar.",
    image: "https://images.unsplash.com/photo-1538385203640-cac1c9c735d4?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Maroc",
    flag: "🇲🇦",
    region: "Afrique",
    type: "e-Visa (AEVM)",
    duration: "30 jours",
    delay: "24h - 72h",
    docs: "Passeport, Copie d'un visa ou titre de séjour valide (Schengen, US, UK, Canada)",
    fee: "770 MAD",
    note: "Réservé aux ressortissants éligibles disposant d'un visa ou titre de pays partenaires.",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Rwanda",
    flag: "🇷🇼",
    region: "Afrique",
    type: "e-Visa Entrée",
    duration: "30 jours",
    delay: "2-3 jours ouvrés",
    docs: "Passeport, Photo fond blanc, Réservation hôtel",
    fee: "50 USD",
    note: "Permet l'entrée par tous les postes frontaliers officiels.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Éthiopie",
    flag: "🇪🇹",
    region: "Afrique",
    type: "e-Visa Tourisme",
    duration: "30 à 90 jours",
    delay: "24h - 48h",
    docs: "Passeport (+6 mois), Photo récente",
    fee: "82 USD",
    note: "Valable pour les arrivées via l'Aéroport International Bole d'Addis-Abeba.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Gabon",
    flag: "🇬🇦",
    region: "Afrique",
    type: "e-Visa Électronique",
    duration: "30 à 90 jours",
    delay: "48h - 72h",
    docs: "Passeport, Autorisation d'entrée, Carnet de vaccination (Fièvre jaune)",
    fee: "85 EUR",
    note: "Autorisation d'atterrissage numérique à présenter à l'embarquement.",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Côte d'Ivoire",
    flag: "🇨🇮",
    region: "Afrique",
    type: "e-Visa Snedai",
    duration: "90 jours",
    delay: "48h",
    docs: "Passeport, Attestation d'hébergement, Carnet jaune",
    fee: "73 EUR",
    note: "Pré-enrôlement en ligne et retrait biométrique à l'Aéroport d'Abidjan.",
    image: "https://images.unsplash.com/photo-1589556264809-a7f71cbda247?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Togo",
    flag: "🇹🇬",
    region: "Afrique",
    type: "e-Visa Voyage",
    duration: "15 à 90 jours",
    delay: "24h - 48h",
    docs: "Passeport, Billet d'avion A/R, Photo",
    fee: "35 000 XOF",
    note: "Portail officiel de la police nationale togolaise.",
    image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Ouganda",
    flag: "🇺🇬",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "90 jours",
    delay: "2-4 jours ouvrés",
    docs: "Passeport, Photo, Carnet de vaccination",
    fee: "50 USD",
    note: "Possibilité de demander l'East Africa Tourist Visa.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Bénin",
    flag: "🇧🇯",
    region: "Afrique",
    type: "e-Visa Électronique",
    duration: "30 à 90 jours",
    delay: "24h - 48h",
    docs: "Passeport, Billet d'avion",
    fee: "50 EUR",
    note: "Procédure 100% en ligne sans dépôt physique.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Zambie & Zimbabwe",
    flag: "🇿🇲",
    region: "Afrique",
    type: "Kaza Univisa",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo, Itinéraire",
    fee: "50 USD",
    note: "Circulation libre entre la Zambie et le Zimbabwe.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Madagascar",
    flag: "🇲🇬",
    region: "Afrique",
    type: "e-Visa Séjour",
    duration: "30 à 60 jours",
    delay: "24h - 48h",
    docs: "Passeport, Billet de retour",
    fee: "35 EUR",
    note: "Enregistrement préalable sur le portail consulaire malgache.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Cap-Vert",
    flag: "🇨🇻",
    region: "Afrique",
    type: "Autorisation EASE",
    duration: "30 jours",
    delay: "24h",
    docs: "Passeport, Numéro de vol",
    fee: "31 EUR",
    note: "Pré-enregistrement obligatoire avant l'embarquement.",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Angola",
    flag: "🇦🇴",
    region: "Afrique",
    type: "e-Visa Pré-approbation",
    duration: "30 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Justificatif financier, Carnet jaune",
    fee: "120 USD",
    note: "Pré-autorisation en ligne avec formalités à l'arrivée.",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Mozambique",
    flag: "🇲🇿",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "2-4 jours ouvrés",
    docs: "Passeport, Réservation d'hôtel, Billet A/R",
    fee: "50 USD",
    note: "Simplification des formalités d'entrée au Mozambique.",
    image: "https://images.unsplash.com/photo-1538385203640-cac1c9c735d4?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Malawi",
    flag: "🇲🇼",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 à 90 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo, Réservation d'hébergement",
    fee: "50 USD",
    note: "Document PDF officiel à imprimer.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Djibouti",
    flag: "🇩🇯",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "31 jours",
    delay: "2-3 jours ouvrés",
    docs: "Passeport (+6 mois), Photo, Réservation d'hôtel",
    fee: "31 USD",
    note: "Délivré pour tourisme ou affaires.",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Seychelles",
    flag: "🇸🇨",
    region: "Afrique",
    type: "Travel Authorisation (ETA)",
    duration: "90 jours",
    delay: "24h",
    docs: "Passeport, Billet A/R, Hébergement validé, Assurance",
    fee: "10 EUR",
    note: "Autorisation électronique obligatoire des Seychelles.",
    image: "https://images.unsplash.com/photo-1578922718550-cae6c6fb891d?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Ghana",
    flag: "🇬🇭",
    region: "Afrique",
    type: "e-Visa Électronique",
    duration: "30 à 90 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Lettre d'invitation, Carnet de vaccination",
    fee: "60 USD",
    note: "Déploiement progressif des procédures numériques ghanéennes.",
    image: "https://images.unsplash.com/photo-1589556264809-a7f71cbda247?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Sao Tomé-et-Principe",
    flag: "🇸🇹",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Billet A/R, Réservation hôtelière",
    fee: "45 EUR",
    note: "Formalités simplifiées sur le portail officiel de STP.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Sierra Leone",
    flag: "🇸🇱",
    region: "Afrique",
    type: "e-Visa Séjour",
    duration: "30 jours",
    delay: "24h - 48h",
    docs: "Passeport, Carnet de vaccination, Photo",
    fee: "80 USD",
    note: "Autorisation numérique d'entrée à Lungi.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Soudan du Sud",
    flag: "🇸🇸",
    region: "Afrique",
    type: "e-Visa Entrée",
    duration: "30 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Lettre d'invitation, Photo",
    fee: "100 USD",
    note: "Approbation préalable requise.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Lesotho",
    flag: "🇱🇸",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "44 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Relevé bancaire, Réservation hôtel",
    fee: "150 USD",
    note: "Dépôt complet sur le portail officiel du Lesotho.",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },

  // ================= ASIE & MOYEN-ORIENT (25 destinations) =================
  {
    country: "Émirats Arabes Unis (Dubaï)",
    flag: "🇦🇪",
    region: "Asie",
    type: "e-Visa Tourisme",
    duration: "30 / 60 jours",
    delay: "24h - 48h",
    docs: "Scan passeport couleur, Photo d'identité",
    fee: "130 USD",
    note: "Prise en charge via partenaires accrédités.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Arabie Saoudite",
    flag: "🇸🇦",
    region: "Asie",
    type: "e-Visa Tourisme / Oumrah",
    duration: "90 jours",
    delay: "24h - 48h",
    docs: "Passeport, Photo, Assurance santé",
    fee: "140 USD",
    note: "Ouvert aux touristes et pèlerins pour l'Oumrah.",
    image: "https://images.unsplash.com/photo-1586724237569-f3d0257c6317?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Turquie",
    flag: "🇹🇷",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "30 à 90 jours",
    delay: "Instantané",
    docs: "Passeport, Carte bancaire",
    fee: "50 USD",
    note: "Portail officiel e-Visa République de Turquie.",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Inde",
    flag: "🇮🇳",
    region: "Asie",
    type: "e-Visa (Tourist / Business)",
    duration: "30 jours à 5 ans",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Photo format carré, Lettre de mission",
    fee: "25 à 100 USD",
    note: "Formulaire en ligne complet requis.",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Viêt Nam",
    flag: "🇻🇳",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "90 jours (multiples)",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Photo numérique",
    fee: "25 USD",
    note: "Valable pour tous les ports internationaux du Viêt Nam.",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Thaïlande",
    flag: "🇹🇭",
    region: "Asie",
    type: "e-Visa Officiel",
    duration: "60 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Relevé bancaire, Billet A/R",
    fee: "40 USD",
    note: "Centralisé sur le portail Thai E-Visa.",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Cambodge",
    flag: "🇰🇭",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo récente",
    fee: "36 USD",
    note: "Idéal pour le tourisme et les courts séjours.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Indonésie (Bali)",
    flag: "🇮🇩",
    region: "Asie",
    type: "e-VOA (Visa on Arrival)",
    duration: "30 jours (renouvelable)",
    delay: "Instantané",
    docs: "Passeport (+6 mois), Billet de sortie",
    fee: "35 USD",
    note: "Évite les files d'attente à l'arrivée en Indonésie.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Qatar",
    flag: "🇶🇦",
    region: "Asie",
    type: "e-Visa Hayya",
    duration: "30 jours",
    delay: "24h - 48h",
    docs: "Passeport, Réservation d'hôtel validée",
    fee: "Gratuit / Variable",
    note: "Plateforme unifiée Hayya pour le tourisme.",
    image: "https://images.unsplash.com/photo-1582672059310-41e1b1979402?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Oman",
    flag: "🇴🇲",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "10 à 30 jours",
    delay: "24h - 48h",
    docs: "Passeport, Photo d'identité",
    fee: "20 OMR",
    note: "Délivrance par la Royal Oman Police.",
    image: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Sri Lanka",
    flag: "🇱🇰",
    region: "Asie",
    type: "ETA Électronique",
    duration: "30 jours",
    delay: "24h",
    docs: "Passeport, Détails du vol",
    fee: "50 USD",
    note: "Autorisation de Voyage Électronique (ETA).",
    image: "https://images.unsplash.com/photo-1588598198397-23422a578634?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Ouzbékistan",
    flag: "🇺🇿",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo d'identité",
    fee: "20 USD",
    note: "Entrée simple pour séjours touristiques.",
    image: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Jordanie",
    flag: "🇯🇴",
    region: "Asie",
    type: "Jordan Pass / e-Visa",
    duration: "30 jours",
    delay: "24h",
    docs: "Passeport, Itinéraire",
    fee: "70 JOD",
    note: "Inclut l'accès à 40+ sites touristiques et exonération de visa.",
    image: "https://images.unsplash.com/photo-1565063068574-4299b870db13?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Laos",
    flag: "🇱🇦",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo",
    fee: "50 USD",
    note: "Valable aux principaux aéroports et frontières.",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Mongolie",
    flag: "🇲🇳",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo, Réservation hôtel",
    fee: "21.50 USD",
    note: "Plateforme officielle de e-Visa mongole.",
    image: "https://images.unsplash.com/photo-1569668345569-242b1d6d74b9?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Bahreïn",
    flag: "🇧🇭",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "14 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Billet d'avion, Relevé bancaire",
    fee: "29 BHD",
    note: "Vérification des conditions d'éligibilité.",
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Kirghizistan",
    flag: "🇰🇬",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "30 à 60 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Photo",
    fee: "50 USD",
    note: "Formalités simplifiées pour le tourisme.",
    image: "https://images.unsplash.com/photo-1609137144813-733c72c57c60?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Taïwan",
    flag: "🇹🇼",
    region: "Asie",
    type: "Travel Authorization Certificate",
    duration: "30 jours",
    delay: "24h - 48h",
    docs: "Passeport, Visa ou titre de séjour récent",
    fee: "Gratuit",
    note: "Certificat d'autorisation de voyage pour nationalités éligibles.",
    image: "https://images.unsplash.com/photo-1508804052814-cd3826529baf?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Pakistan",
    flag: "🇵🇰",
    region: "Asie",
    type: "e-Visa Tourisme",
    duration: "30 à 90 jours",
    delay: "7-10 jours ouvrés",
    docs: "Passeport, Lettre d'invitation ou hôtel",
    fee: "25 USD",
    note: "Traitement via le portail officiel NADRA pakistanais.",
    image: "https://images.unsplash.com/photo-1605648916361-9bc12ad6a566?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Philippines",
    flag: "🇵🇭",
    region: "Asie",
    type: "ETA / e-Travel",
    duration: "30 jours",
    delay: "Instantané à 24h",
    docs: "Passeport, Billet de retour",
    fee: "Variable",
    note: "Enregistrement numérique obligatoire avant l'arrivée.",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Azerbaïdjan",
    flag: "🇦🇿",
    region: "Asie",
    type: "ASAN e-Visa",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport (+6 mois), Formulaire en ligne",
    fee: "26 USD",
    note: "Système ASAN Visa officiel de la République d'Azerbaïdjan.",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Corée du Sud",
    flag: "🇰🇷",
    region: "Asie",
    type: "K-ETA Électronique",
    duration: "90 jours",
    delay: "24h - 72h",
    docs: "Passeport, Photo numérique, Adresse en Corée",
    fee: "10 000 KRW",
    note: "Autorisation électronique de voyage obligatoire pour la Corée.",
    image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Singapour",
    flag: "🇸🇬",
    region: "Asie",
    type: "SG Arrival Card / e-Visa",
    duration: "14 à 30 jours",
    delay: "24h - 48h",
    docs: "Passeport, Billet d'avion, Hébergement",
    fee: "Variable selon nationalité",
    note: "Déclaration d'arrivée électronique et e-Visa pour passeports éligibles.",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Iran",
    flag: "🇮🇷",
    region: "Asie",
    type: "e-Visa / Code d'approbation",
    duration: "30 jours",
    delay: "5-7 jours ouvrés",
    docs: "Passeport, Photo, Itinéraire détaillé",
    fee: "40 à 75 EUR",
    note: "Délivrance de l'accord préalable du Ministère des Affaires Étrangères.",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Tadjikistan",
    flag: "🇹🇯",
    region: "Asie",
    type: "e-Visa Pamir",
    duration: "45 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Photo d'identité",
    fee: "30 USD",
    note: "Option Permis GBAO disponible pour la région du Pamir.",
    image: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=800&q=80"
  },

  // ================= EUROPE & AMÉRIQUES (12 destinations) =================
  {
    country: "Russie",
    flag: "🇷🇺",
    region: "Europe",
    type: "e-Visa Unifié",
    duration: "16 jours",
    delay: "4 jours ouvrés",
    docs: "Passeport (+6 mois), Photo numérique, Assurance voyage",
    fee: "52 USD",
    note: "Valable sur toute l'étendue de la Fédération de Russie.",
    image: "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Moldavie",
    flag: "🇲🇩",
    region: "Europe",
    type: "e-Visa Touristique",
    duration: "90 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Assurance médicale, Justificatif financier",
    fee: "80 EUR",
    note: "Portail consulaire officiel moldave.",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Albanie",
    flag: "🇦🇱",
    region: "Europe",
    type: "e-Visa Électronique",
    duration: "90 jours",
    delay: "5-7 jours ouvrés",
    docs: "Passeport, Visa ou titre Schengen valide",
    fee: "50 EUR",
    note: "Pour les voyageurs ne bénéficiant pas de l'exemption de visa.",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Cuba",
    flag: "🇨🇺",
    region: "Amériques",
    type: "e-Visa Numérique (Tarjeta)",
    duration: "90 jours",
    delay: "24h",
    docs: "Passeport, Billet d'avion, Assurance médicale",
    fee: "35 EUR",
    note: "Remplace l'ancienne carte touristique cartonnée.",
    image: "https://images.unsplash.com/photo-1500759285584-2c5ff09ec4a3?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Suriname",
    flag: "🇸🇷",
    region: "Amériques",
    type: "e-Visa / E-Fee",
    duration: "90 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport, Billet A/R, Réservation hôtel",
    fee: "50 USD",
    note: "Géré via la plateforme officielle VFS Global / Suriname.",
    image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Antigua-et-Barbuda",
    flag: "🇦🇬",
    region: "Amériques",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "5 jours ouvrés",
    docs: "Passeport, Relevé bancaire, Hébergement",
    fee: "100 USD",
    note: "Autorisation électronique pour les Caraïbes.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Bahamas",
    flag: "🇧🇸",
    region: "Amériques",
    type: "e-Visa Touristique",
    duration: "90 jours",
    delay: "5-7 jours ouvrés",
    docs: "Passeport, Photo, Lettre employeur",
    fee: "100 USD",
    note: "Traitement par l'immigration des Bahamas.",
    image: "https://images.unsplash.com/photo-1548574505-5e92985f11a6?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Colombie",
    flag: "🇨🇴",
    region: "Amériques",
    type: "e-Visa Consulaire",
    duration: "90 à 180 jours",
    delay: "5-10 jours ouvrés",
    docs: "Passeport, Relevés bancaires, Lettre de motivation",
    fee: "52 USD",
    note: "Procédure entièrement numérique pour les nationalités requises.",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Équateur",
    flag: "🇪🇨",
    region: "Amériques",
    type: "Visa Électronique en ligne",
    duration: "90 jours",
    delay: "5 jours ouvrés",
    docs: "Passeport, Assurance santé, Justificatif de fonds",
    fee: "50 USD",
    note: "Demande de visa en ligne sur le portail consulaire équatorien.",
    image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Montserrat",
    flag: "🇲🇸",
    region: "Amériques",
    type: "e-Visa Touristique",
    duration: "12 mois (entrées multiples)",
    delay: "24h - 48h",
    docs: "Passeport, Photo",
    fee: "50 USD",
    note: "Territoire britannique d'outre-mer des Caraïbes.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Sainte-Hélène",
    flag: "🇸🇭",
    region: "Amériques",
    type: "e-Visa Électronique",
    duration: "183 jours",
    delay: "7 jours ouvrés",
    docs: "Passeport, Assurance médicale rapatriement",
    fee: "50 GBP",
    note: "Territoire britannique d'outre-mer de l'Atlantique Sud.",
    image: "https://images.unsplash.com/photo-1500759285584-2c5ff09ec4a3?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Canada (eTA)",
    flag: "🇨🇦",
    region: "Amériques",
    type: "eTA / AVE (Cas spécifiques)",
    duration: "5 ans",
    delay: "24h",
    docs: "Passeport, Ancien visa canadien (10 ans) ou US non-immigrant valide",
    fee: "7 CAD",
    note: "Autorisation de voyage électronique pour les voyageurs éligibles.",
    image: "https://images.unsplash.com/photo-1503614472348-2fd8f99b16f6?auto=format&fit=crop&w=800&q=80"
  },

  // ================= OCÉANIE (4 destinations) =================
  {
    country: "Australie",
    flag: "🇦🇺",
    region: "Océanie",
    type: "ETA / eVisitor (Subclass 600)",
    duration: "3 à 12 mois",
    delay: "24h - 48h",
    docs: "Passeport, Justificatifs financiers",
    fee: "20 à 190 AUD",
    note: "Demande en ligne officielle.",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Nouvelle-Zélande",
    flag: "🇳🇿",
    region: "Océanie",
    type: "NZeTA (Electronic Travel Authority)",
    duration: "2 ans",
    delay: "24h - 72h",
    docs: "Passeport en cours de validité, Photo",
    fee: "58 NZD (avec taxe IVL)",
    note: "Obligatoire pour l'embarquement.",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Papouasie-Nouvelle-Guinée",
    flag: "🇵🇬",
    region: "Océanie",
    type: "e-Visa Touristique",
    duration: "60 jours",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Billet de retour, Justificatif financier",
    fee: "50 USD",
    note: "Plateforme officielle de l'immigration de PNG.",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"
  },
  {
    country: "Fidji",
    flag: "🇫🇯",
    region: "Océanie",
    type: "e-Visa / Permis électronique",
    duration: "4 mois",
    delay: "3-5 jours ouvrés",
    docs: "Passeport, Billet A/R, Hébergement",
    fee: "95 FJD",
    note: "Demande électronique pour les nationalités soumises.",
    image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80"
  }
];

const documentExplanations: Record<string, DocumentDetail> = {
  "Passeport": {
    title: "Passeport Biométrique Valide",
    description: "La page d'identification avec photo et signature doit être parfaitement lisible, sans reflets ni coupure.",
    tip: "Validité minimale requise : 6 mois après la date de retour prévue."
  },
  "Photo": {
    title: "Photo d'Identité Numérique",
    description: "Format passeport officiel, prise de face sur fond clair ou blanc uni, sans lunettes de soleil ni couvre-chef.",
    tip: "Moins de 6 mois, format JPEG ou PNG (minimum 600x600 pixels)."
  },
  "Billet": {
    title: "Billet d'Avion Aller-Retour",
    description: "Confirmation de réservation aérienne complète avec le numéro de vol et les dates de départ et de retour.",
    tip: "Un billet retour confirmant la sortie du territoire est exigé par les autorités."
  },
  "Hébergement": {
    title: "Justificatif d'Hébergement",
    description: "Réservation d'hôtel confirmée, voucher touristique ou attestation d'accueil officielle signée par l'hébergeant.",
    tip: "Doit couvrir l'intégralité du séjour dans le pays de destination."
  },
  "Vaccination": {
    title: "Carnet de Vaccination (Fièvre Jaune)",
    description: "Certificat international de vaccination exigé à l'entrée de nombreux pays tropicaux et africains.",
    tip: "Le vaccin doit avoir été administré au moins 10 jours avant le voyage."
  },
  "Financier": {
    title: "Justificatif de Ressources Financières",
    description: "Relevés bancaires des 3 derniers mois attestant d'fonds suffisants pour couvrir les frais de séjour.",
    tip: "Solde moyen recommandé : au moins 50 à 100 USD par jour de séjour."
  },
  "Titre": {
    title: "Visa ou Titre de Séjour Partenaire",
    description: "Copie d'un visa en cours de validité ou titre de séjour (Schengen, US, UK, Canada) pour les e-Visas conditionnels.",
    tip: "Le titre doit être valide au moment de l'entrée sur le territoire."
  },
  "Assurance": {
    title: "Assurance Voyage Internationale",
    description: "Police d'assurance couvrant les frais médicaux, d'hospitalisation et de rapatriement sanitaire à l'étranger.",
    tip: "Couverture minimale exigée de 30 000 EUR / USD selon la destination."
  }
};

const getDocumentDetail = (docString: string): DocumentDetail => {
  const lower = docString.toLowerCase();
  if (lower.includes("passeport")) return documentExplanations["Passeport"];
  if (lower.includes("photo")) return documentExplanations["Photo"];
  if (lower.includes("billet")) return documentExplanations["Billet"];
  if (lower.includes("hôtel") || lower.includes("hébergement") || lower.includes("invitation")) return documentExplanations["Hébergement"];
  if (lower.includes("vaccin") || lower.includes("jaune")) return documentExplanations["Vaccination"];
  if (lower.includes("financier") || lower.includes("relevé")) return documentExplanations["Financier"];
  if (lower.includes("visa") || lower.includes("titre")) return documentExplanations["Titre"];
  if (lower.includes("assurance")) return documentExplanations["Assurance"];
  
  return {
    title: docString,
    description: "Pièce officielle exigée par les services d'immigration pour l'instruction de votre dossier e-Visa.",
    tip: "Assurez-vous que le document est clair, au format PDF ou image haute définition."
  };
};

interface ExpandedItem {
  [key: string]: boolean;
}

interface ChecklistState {
  [countryKey: string]: {
    [docIndex: number]: boolean;
  };
}

export default function Evisas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [selectedNationalite, setSelectedNationalite] = useState('Camerounaise');
  const [expandedItems, setExpandedItems] = useState<ExpandedItem>({});
  const [activeTooltipDoc, setActiveTooltipDoc] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});

  const regions = ['Tous', 'Afrique', 'Asie', 'Europe', 'Amériques', 'Océanie'];

  const getEligibilityStatus = (countryName: string, nationalite: string) => {
    if (countryName === "Maroc") {
      return { status: "condition", label: "Sous conditions (titre de séjour/visa requis)", color: "bg-amber-50 text-amber-800 border-amber-200", icon: AlertTriangle };
    }
    if (countryName === "Canada (eTA)" || countryName === "Australie") {
      return { status: "consulate", label: "Vérification conditionnelle (Visa précédent requis)", color: "bg-purple-50 text-purple-800 border-purple-200", icon: AlertTriangle };
    }
    return { status: "eligible", label: `Éligible e-Visa en ligne (${nationalite})`, color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 };
  };

  const getDynamicRequiredDocuments = (countryName: string, nationalite: string) => {
    const baseDocs = [
      "Passeport biométrique valide (minimum 6 mois)",
      "Photo d'identité couleur récente",
      "Billet d'avion aller-retour confirmé"
    ];

    if (countryName === "Gabon" || countryName === "Tanzanie & Zanzibar" || countryName === "Ouganda" || countryName === "Côte d'Ivoire") {
      baseDocs.push("Carnet international de vaccination (Fièvre jaune)");
    }
    if (countryName === "Maroc") {
      baseDocs.push("Visa ou titre de séjour valide (Schengen, US, UK, Canada)");
    }
    if (countryName === "Arabie Saoudite" || countryName === "Russie" || countryName === "Équateur") {
      baseDocs.push("Attestation d'assurance voyage internationale");
    }
    if (countryName === "Angola" || countryName === "Australie" || countryName === "Colombie") {
      baseDocs.push("Justificatif de ressources financières (relevés bancaires)");
    }
    if (countryName === "Émirats Arabes Unis (Dubaï)" || countryName === "Qatar") {
      baseDocs.push("Confirmation de réservation d'hôtel");
    }

    if (nationalite === "Camerounaise" || nationalite === "Gabonaise" || nationalite === "Congolaise (RC)" || nationalite === "Tchadienne") {
      baseDocs.push("Justificatif de situation professionnelle");
    }

    return baseDocs;
  };

  const toggleChecklistDoc = (country: string, docIndex: number) => {
    setChecklist(prev => {
      const countryState = prev[country] || {};
      return {
        ...prev,
        [country]: {
          ...countryState,
          [docIndex]: !countryState[docIndex]
        }
      };
    });
  };

  const unifiedEvisaCatalogue = useMemo(() => {
    const seen = new Set<string>();
    return [...ultimateWorldEvisasDatabase, ...evisasDatabaseComplete.map((entry) => ({
      country: entry.country,
      flag: entry.flag,
      region: entry.region,
      type: entry.type,
      duration: entry.duration,
      delay: entry.delay,
      docs: entry.docs,
      fee: entry.fee,
      note: entry.note,
      image: entry.image,
    }))].filter((entry) => {
      const key = entry.country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const filteredEvisas = useMemo(() => {
    return unifiedEvisaCatalogue.filter(evisa => {
      const matchesSearch = 
        evisa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.docs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.note.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = selectedRegion === 'Tous' || evisa.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion, unifiedEvisaCatalogue]);

  const toggleExpanded = (country: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [country]: !prev[country]
    }));
  };

  const openWhatsApp = (countryName: string) => {
    const text = encodeURIComponent(`Bonjour l'équipe 3M Travel, je suis de nationalité ${selectedNationalite} et je souhaite lancer la procédure d'e-Visa pour ${countryName}. Pouvez-vous me guider ?`);
    window.open(`https://wa.me/237698104832?text=${text}`, '_blank');
  };

  const handleLaunchProcedure = (countryName: string) => {
    const text = encodeURIComponent(`Bonjour, je suis de nationalité ${selectedNationalite} et je souhaite démarrer la procédure complète de demande d'e-Visa pour ${countryName} via 3M Travel & Services.`);
    window.open(`https://wa.me/237698104832?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Globe className="w-4 h-4" />
            Catalogue Mondial, Simulateur & Checklist Interactive
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Guide des e-Visas avec <span className="text-blue-600">Suivi de Préparation de Dossier</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            Cochez les pièces au fur et à mesure de leur obtention pour suivre votre barre de progression en temps réel avant de confier votre dossier à nos experts.
          </p>
        </div>

        {/* Simulator Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Simulateur & Checklist Active
              </div>
              <h2 className="text-2xl font-bold">Sélectionnez votre passeport / nationalité</h2>
              <p className="text-blue-200 text-sm mt-1">La checklist s'ajuste pour chaque pays selon votre profil.</p>
            </div>
            <div className="w-full md:w-auto min-w-[260px]">
              <label className="block text-xs font-medium text-blue-200 mb-1.5">Votre Nationalité :</label>
              <select
                value={selectedNationalite}
                onChange={(e) => setSelectedNationalite(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 [&>option]:text-gray-900"
              >
                {nationalitesList.map(nat => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par pays, type de visa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 w-full border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>

            {/* Region Filter Pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Results Count & Simulation Active Notice */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
          <p className="text-sm font-medium text-gray-500">
            Affichage de <span className="font-bold text-gray-900">{filteredEvisas.length}</span> destinations pour la nationalité <span className="text-blue-600 font-bold">{selectedNationalite}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>Cochez les pièces dans chaque carte pour suivre votre avancement</span>
          </div>
        </div>

        {/* Grid of Evisas with Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvisas.map((evisa) => {
            const eligibility = getEligibilityStatus(evisa.country, selectedNationalite);
            const StatusIcon = eligibility.icon;
            const dynamicDocs = getDynamicRequiredDocuments(evisa.country, selectedNationalite);
            
            const countryChecklist = checklist[evisa.country] || {};
            const completedCount = dynamicDocs.filter((_, idx) => countryChecklist[idx]).length;
            const progressPercent = Math.round((completedCount / dynamicDocs.length) * 100);

            return (
              <div
                key={evisa.country}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Destination Image Header */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  {evisa.image ? <img
                    src={evisa.image}
                    alt={evisa.country}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-700 text-7xl" role="img" aria-label={`Drapeau ${evisa.country}`}>{evisa.flag}</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
                    <span role="img" aria-label={`Drapeau ${evisa.country}`}>{evisa.flag}</span>
                    <span>{evisa.region}</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-xl font-extrabold text-white drop-shadow-md mb-0.5">{evisa.country}</h3>
                    <p className="text-xs font-semibold text-blue-200 drop-shadow">{evisa.type}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  
                  {/* Eligibility Badge */}
                  <div className={`mb-4 px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${eligibility.color}`}>
                    <StatusIcon className="w-4 h-4 shrink-0" />
                    <span>{eligibility.label}</span>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" /> Durée:
                      </span>
                      <span className="font-semibold text-gray-900">{evisa.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-gray-400" /> Délai:
                      </span>
                      <span className="font-semibold text-gray-900">{evisa.delay}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500">Frais officiels:</span>
                      <span className="font-bold text-blue-600">{evisa.fee}</span>
                    </div>
                  </div>

                  {/* Interactive Checklist & Progress Bar Section */}
                  <div className="border-t border-gray-100 pt-3 mb-5">
                    
                    {/* Progress Header */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => toggleExpanded(evisa.country)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                        <span>Checklist ({completedCount}/{dynamicDocs.length})</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedItems[evisa.country] ? 'rotate-180' : ''}`} />
                      </button>
                      <span className={`text-xs font-extrabold ${progressPercent === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Expanded Checklist Items */}
                    {expandedItems[evisa.country] && (
                      <div className="mt-3 space-y-2 text-xs text-gray-600 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
                        <p className="font-bold text-blue-900 mb-2">Cochez vos pièces préparées :</p>
                        
                        <div className="space-y-2">
                          {dynamicDocs.map((docText, idx) => {
                            const isChecked = !!countryChecklist[idx];
                            const detail = getDocumentDetail(docText);
                            const docKey = `${evisa.country}-${idx}`;
                            const isTooltipOpen = activeTooltipDoc === docKey;

                            return (
                              <div key={idx} className={`p-2.5 rounded-lg border transition-all ${isChecked ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-blue-100 shadow-xs'}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleChecklistDoc(evisa.country, idx)}
                                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className={`font-medium ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                      {docText}
                                    </span>
                                  </label>
                                  <button
                                    onClick={() => setActiveTooltipDoc(isTooltipOpen ? null : docKey)}
                                    className="text-blue-600 hover:text-blue-800 p-1 transition-colors shrink-0"
                                    title="Aide et conseils"
                                  >
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                </div>

                                {isTooltipOpen && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] bg-blue-50/80 p-2 rounded text-gray-700 space-y-1">
                                    <p className="font-bold text-blue-900">📌 {detail.title}</p>
                                    <p>{detail.description}</p>
                                    <p className="text-blue-700 font-medium italic">💡 Conseil 3M : {detail.tip}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-2.5 pt-2 border-t border-blue-200/60 text-[11px] italic text-gray-500">
                          {evisa.note}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleLaunchProcedure(evisa.country)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Lancer la procédure
                    </Button>
                    <Button
                      onClick={() => openWhatsApp(evisa.country)}
                      variant="outline"
                      className="w-full border-green-500 text-green-700 hover:bg-green-50 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      Conseiller WhatsApp
                    </Button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEvisas.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-800 text-lg font-semibold">Aucun e-Visa trouvé pour votre recherche</p>
            <p className="text-gray-500 text-sm mt-1">Essayez d'ajuster les filtres régionaux ou le terme de recherche.</p>
          </div>
        )}

      </div>
    </div>
  );
}
