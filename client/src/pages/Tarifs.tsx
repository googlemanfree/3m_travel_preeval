import { useState, useCallback } from "react";
import { ChevronDown, Info, Star, ExternalLink, RefreshCw, ArrowLeftRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = "XAF" | "EUR" | "CAD";

interface FraisItem {
  label: string;
  /** Montant minimum en FCFA (XAF). null = variable/non chiffrable */
  minXAF: number | null;
  /** Montant maximum en FCFA (XAF). null = pas de max (montant fixe) */
  maxXAF: number | null;
  payable: string;
  obligatoire: boolean;
  note?: string;
}

interface Procedure {
  nom: string;
  frais: FraisItem[];
  delai: string;
  note?: string;
}

interface Category {
  id: string;
  name: string;
  flag: string;
  description: string;
  procedures: Procedure[];
}

// ─── Taux de change (indicatifs — juillet 2026) ───────────────────────────────
// 1 EUR = 655.957 XAF (taux fixe BEAC)
// 1 CAD ≈ 490 XAF (taux indicatif)

const RATES: Record<Currency, number> = {
  XAF: 1,
  EUR: 1 / 655.957,
  CAD: 1 / 490,
};

const CURRENCY_LABELS: Record<Currency, { symbol: string; name: string; flag: string }> = {
  XAF: { symbol: "FCFA", name: "Franc CFA", flag: "🇨🇲" },
  EUR: { symbol: "€", name: "Euro", flag: "🇪🇺" },
  CAD: { symbol: "CA$", name: "Dollar canadien", flag: "🇨🇦" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function convertAmount(amountXAF: number, currency: Currency): string {
  const converted = amountXAF * RATES[currency];
  const sym = CURRENCY_LABELS[currency].symbol;

  if (currency === "XAF") {
    return `${Math.round(converted).toLocaleString("fr-FR")} ${sym}`;
  }
  // EUR et CAD : arrondi à 5 EUR/CAD le plus proche pour lisibilité
  const rounded = Math.round(converted / 5) * 5;
  return `${rounded.toLocaleString("fr-FR")} ${sym}`;
}

function formatRange(item: FraisItem, currency: Currency): string {
  if (item.minXAF === null) return "Variable";
  if (item.maxXAF === null) return convertAmount(item.minXAF, currency);
  return `${convertAmount(item.minXAF, currency)} – ${convertAmount(item.maxXAF, currency)}`;
}

// ─── Données ──────────────────────────────────────────────────────────────────

const categories: Category[] = [
  {
    id: "canada",
    name: "Canada",
    flag: "🇨🇦",
    description: "Immigration permanente, études et travail temporaire au Canada",
    procedures: [
      {
        nom: "Résidence Permanente — Express Entry",
        delai: "6 à 12 mois",
        note: "Frais payables directement à IRCC (Immigration, Réfugiés et Citoyenneté Canada)",
        frais: [
          { label: "Frais de traitement — Demandeur principal", minXAF: 450000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "≈ 1 365 CAD" },
          { label: "Frais de traitement — Conjoint/Partenaire", minXAF: 450000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: false, note: "Si applicable — ≈ 1 365 CAD" },
          { label: "Frais de traitement — Enfant à charge", minXAF: 75000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: false, note: "Par enfant — ≈ 230 CAD" },
          { label: "Droit de résidence permanente (DRP)", minXAF: 170000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "Par adulte — ≈ 515 CAD, remboursable si refus" },
          { label: "Biométrie", minXAF: 28000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "Par personne — ≈ 85 CAD (max 170 CAD/famille)" },
          { label: "Examen médical (IME)", minXAF: 200000, maxXAF: 350000, payable: "Médecin désigné IRCC", obligatoire: true, note: "Variable selon le médecin" },
          { label: "Certificat de police (Cameroun)", minXAF: 5000, maxXAF: null, payable: "DGSN", obligatoire: true },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur agréé", obligatoire: true, note: "Par document" },
          { label: "TCF Canada (si requis)", minXAF: 80000, maxXAF: 100000, payable: "Centre d'examen agréé", obligatoire: false, note: "Selon profil" },
        ],
      },
      {
        nom: "Visa Étudiant (Permis d'études)",
        delai: "2 à 4 mois",
        note: "Frais payables directement à IRCC",
        frais: [
          { label: "Frais de traitement du permis d'études", minXAF: 49000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "≈ 150 CAD" },
          { label: "Biométrie", minXAF: 28000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "≈ 85 CAD" },
          { label: "CAQ Québec (si applicable)", minXAF: 37000, maxXAF: null, payable: "MIFI Québec", obligatoire: false, note: "≈ 114 CAD — Uniquement pour le Québec" },
          { label: "Examen médical (si requis)", minXAF: 200000, maxXAF: 300000, payable: "Médecin désigné IRCC", obligatoire: false, note: "Selon durée du séjour" },
          { label: "Certificat de police (Cameroun)", minXAF: 5000, maxXAF: null, payable: "DGSN", obligatoire: true },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur agréé", obligatoire: true, note: "Par document" },
          { label: "TCF/IELTS (selon établissement)", minXAF: 80000, maxXAF: 100000, payable: "Centre d'examen agréé", obligatoire: false },
        ],
      },
      {
        nom: "Permis de Travail Temporaire (LMIA)",
        delai: "3 à 6 mois",
        note: "Frais payables directement à IRCC et ESDC",
        frais: [
          { label: "Frais de traitement du permis de travail", minXAF: 51000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "≈ 155 CAD" },
          { label: "Biométrie", minXAF: 28000, maxXAF: null, payable: "IRCC (en ligne)", obligatoire: true, note: "≈ 85 CAD" },
          { label: "Frais LMIA (à la charge de l'employeur)", minXAF: 330000, maxXAF: null, payable: "ESDC Canada", obligatoire: true, note: "≈ 1 000 CAD — Payé par l'employeur canadien" },
          { label: "Examen médical", minXAF: 200000, maxXAF: 300000, payable: "Médecin désigné IRCC", obligatoire: true },
          { label: "Certificat de police (Cameroun)", minXAF: 5000, maxXAF: null, payable: "DGSN", obligatoire: true },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur agréé", obligatoire: true },
        ],
      },
    ],
  },
  {
    id: "france",
    name: "France",
    flag: "🇫🇷",
    description: "Visa long séjour, études et travail en France",
    procedures: [
      {
        nom: "Visa Long Séjour Étudiant (VLS-TS)",
        delai: "2 à 3 mois",
        note: "Frais payables à Campus France Cameroun et au Consulat de France",
        frais: [
          { label: "Frais Campus France (procédure CEF)", minXAF: 90000, maxXAF: null, payable: "Campus France Yaoundé/Douala", obligatoire: true },
          { label: "Frais de visa consulaire", minXAF: 33000, maxXAF: null, payable: "Consulat de France / VFS Global", obligatoire: true, note: "≈ 50 €" },
          { label: "Frais de service VFS Global", minXAF: 18000, maxXAF: null, payable: "VFS Global", obligatoire: true, note: "≈ 27 €" },
          { label: "Assurance voyage (si requis)", minXAF: 15000, maxXAF: 30000, payable: "Compagnie d'assurance", obligatoire: false },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur assermenté", obligatoire: true },
          { label: "TCF/DELF (selon établissement)", minXAF: 60000, maxXAF: 80000, payable: "Centre d'examen agréé", obligatoire: false },
        ],
      },
      {
        nom: "Visa Long Séjour Travail / Passeport Talent",
        delai: "2 à 4 mois",
        note: "Frais payables au Consulat de France",
        frais: [
          { label: "Frais de visa consulaire", minXAF: 65000, maxXAF: null, payable: "Consulat de France / VFS Global", obligatoire: true, note: "≈ 99 €" },
          { label: "Frais de service VFS Global", minXAF: 18000, maxXAF: null, payable: "VFS Global", obligatoire: true, note: "≈ 27 €" },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur assermenté", obligatoire: true },
          { label: "Légalisation/Apostille des diplômes", minXAF: 10000, maxXAF: 20000, payable: "Ministère des Affaires Étrangères", obligatoire: true },
        ],
      },
    ],
  },
  {
    id: "schengen",
    name: "Espace Schengen",
    flag: "🇪🇺",
    description: "Visa court séjour et long séjour pour l'espace Schengen (Allemagne, Belgique, Pays-Bas, etc.)",
    procedures: [
      {
        nom: "Visa Schengen Court Séjour (C — Tourisme/Affaires)",
        delai: "15 à 45 jours",
        note: "Frais payables à l'ambassade ou au centre de visa (VFS/TLS)",
        frais: [
          { label: "Frais de visa consulaire", minXAF: 53000, maxXAF: null, payable: "Ambassade / Centre de visa", obligatoire: true, note: "≈ 80 €" },
          { label: "Frais de service VFS/TLS Contact", minXAF: 16000, maxXAF: 23000, payable: "VFS Global / TLS Contact", obligatoire: true, note: "≈ 25 – 35 €" },
          { label: "Assurance voyage Schengen (min. 30 000 €)", minXAF: 10000, maxXAF: 25000, payable: "Compagnie d'assurance", obligatoire: true },
          { label: "Réservation d'hôtel / hébergement", minXAF: null, maxXAF: null, payable: "Hébergeur", obligatoire: true, note: "Preuve requise — montant variable" },
          { label: "Réservation de vol (billet non définitif)", minXAF: 5000, maxXAF: null, payable: "3M Travel", obligatoire: true, note: "Billet de réservation pour visa" },
        ],
      },
      {
        nom: "Visa National Allemagne (Chancenkarte / Travail qualifié)",
        delai: "2 à 4 mois",
        note: "Frais payables à l'Ambassade d'Allemagne",
        frais: [
          { label: "Frais de visa national", minXAF: 49000, maxXAF: null, payable: "Ambassade d'Allemagne", obligatoire: true, note: "≈ 75 €" },
          { label: "Frais de service VFS Global", minXAF: 16000, maxXAF: null, payable: "VFS Global", obligatoire: true, note: "≈ 25 €" },
          { label: "Reconnaissance des diplômes (anabin/ZAB)", minXAF: 131000, maxXAF: null, payable: "Anabin / ZAB Allemagne", obligatoire: false, note: "≈ 200 € — Si diplôme non reconnu" },
          { label: "Traduction assermentée des documents", minXAF: 15000, maxXAF: 30000, payable: "Traducteur assermenté", obligatoire: true },
          { label: "Test de langue (A1 minimum)", minXAF: 50000, maxXAF: 80000, payable: "Institut Goethe", obligatoire: false, note: "Selon le type de visa" },
        ],
      },
    ],
  },
  {
    id: "golfe",
    name: "Golfe & Moyen-Orient",
    flag: "🏜️",
    description: "Visa de travail et de résidence pour les Émirats Arabes Unis, l'Arabie Saoudite et le Qatar",
    procedures: [
      {
        nom: "Visa de Travail — Émirats Arabes Unis (Dubaï)",
        delai: "1 à 2 mois",
        note: "Frais payables aux autorités émiraties (ICP/MOHRE)",
        frais: [
          { label: "Frais de visa de travail (employment visa)", minXAF: 200000, maxXAF: 270000, payable: "ICP / MOHRE EAU", obligatoire: true, note: "Généralement à la charge de l'employeur" },
          { label: "Examen médical (obligatoire à l'arrivée)", minXAF: 55000, maxXAF: 90000, payable: "Centre médical agréé EAU", obligatoire: true },
          { label: "Emirates ID (carte d'identité résidente)", minXAF: 18000, maxXAF: 55000, payable: "ICP EAU", obligatoire: true },
          { label: "Certificat de police (Cameroun + apostille)", minXAF: 5000, maxXAF: 15000, payable: "DGSN + MAE", obligatoire: true },
          { label: "Traduction et légalisation des documents", minXAF: 20000, maxXAF: 40000, payable: "Traducteur agréé", obligatoire: true },
        ],
      },
      {
        nom: "Visa de Travail — Arabie Saoudite (Iqama)",
        delai: "2 à 3 mois",
        note: "Frais payables aux autorités saoudiennes (MLSD)",
        frais: [
          { label: "Frais de visa d'entrée de travail", minXAF: 75000, maxXAF: 120000, payable: "MLSD Arabie Saoudite", obligatoire: true, note: "Généralement à la charge de l'employeur" },
          { label: "Examen médical (avant départ)", minXAF: 50000, maxXAF: 80000, payable: "Centre médical agréé", obligatoire: true },
          { label: "Iqama (permis de résidence annuel)", minXAF: 100000, maxXAF: null, payable: "MLSD Arabie Saoudite", obligatoire: true, note: "≈ 650–800 SAR/an" },
          { label: "Certificat de police (Cameroun + apostille)", minXAF: 5000, maxXAF: 15000, payable: "DGSN + MAE", obligatoire: true },
        ],
      },
    ],
  },
  {
    id: "admin",
    name: "Services Administratifs",
    flag: "⚙️",
    description: "Documents complémentaires requis pour tout dossier de visa",
    procedures: [
      {
        nom: "AVI — Attestation de Virement Irrévocable",
        delai: "2 à 3 semaines",
        note: "Document bancaire officiel requis pour certains visas (Canada, USA, UK, Australie)",
        frais: [
          { label: "Frais bancaires de traitement (banque camerounaise)", minXAF: 20000, maxXAF: 50000, payable: "Votre banque au Cameroun", obligatoire: true, note: "Variable selon la banque" },
          { label: "Frais de légalisation du document", minXAF: 5000, maxXAF: 10000, payable: "Notaire / Ambassade", obligatoire: false, note: "Selon exigence du pays" },
        ],
      },
      {
        nom: "Réservation de Vol pour Visa",
        delai: "24 à 48h",
        note: "Billet de réservation (non définitif) accepté par les ambassades",
        frais: [
          { label: "Frais de réservation de vol (billet visa)", minXAF: 5000, maxXAF: null, payable: "3M Travel", obligatoire: true },
        ],
      },
      {
        nom: "Traduction Assermentée de Documents",
        delai: "3 à 5 jours ouvrables",
        note: "Traduction officielle acceptée par les ambassades et autorités étrangères",
        frais: [
          { label: "Traduction d'un document (1 page)", minXAF: 10000, maxXAF: 20000, payable: "Traducteur assermenté agréé", obligatoire: true, note: "Par page" },
          { label: "Légalisation de la traduction", minXAF: 5000, maxXAF: null, payable: "Ministère des Affaires Étrangères", obligatoire: false },
        ],
      },
      {
        nom: "Certificat de Police / Casier Judiciaire",
        delai: "3 à 7 jours",
        note: "Document obligatoire pour la quasi-totalité des visas d'immigration",
        frais: [
          { label: "Casier judiciaire (bulletin n°3)", minXAF: 1500, maxXAF: null, payable: "Tribunal de Grande Instance", obligatoire: true },
          { label: "Certificat de police (DGSN)", minXAF: 5000, maxXAF: null, payable: "Délégation Générale à la Sûreté Nationale", obligatoire: true },
          { label: "Apostille (si requis par le pays)", minXAF: 10000, maxXAF: 15000, payable: "Ministère des Affaires Étrangères", obligatoire: false },
        ],
      },
    ],
  },
  {
    id: "tests",
    name: "Tests de Langue",
    flag: "🧪",
    description: "Tests linguistiques officiels requis pour les visas d'immigration et d'études",
    procedures: [
      {
        nom: "TCF Canada (Test de Connaissance du Français)",
        delai: "Résultats en 3 à 4 semaines",
        note: "Obligatoire pour Express Entry, PEQ et programmes québécois",
        frais: [
          { label: "Frais d'inscription TCF Canada", minXAF: 82000, maxXAF: 95000, payable: "Centre d'examen agréé (Institut Français, Alliance Française)", obligatoire: true },
          { label: "Frais de report de session (si annulation)", minXAF: 15000, maxXAF: 20000, payable: "Centre d'examen", obligatoire: false },
        ],
      },
      {
        nom: "TEF Canada (Test d'Évaluation de Français)",
        delai: "Résultats en 3 à 4 semaines",
        note: "Alternative au TCF pour Express Entry et programmes canadiens",
        frais: [
          { label: "Frais d'inscription TEF Canada", minXAF: 80000, maxXAF: 100000, payable: "Centre d'examen agréé (CCIP)", obligatoire: true },
        ],
      },
      {
        nom: "IELTS (International English Language Testing System)",
        delai: "Résultats en 13 jours",
        note: "Requis pour le Canada (Express Entry), le Royaume-Uni, l'Australie et la Nouvelle-Zélande",
        frais: [
          { label: "Frais d'inscription IELTS Academic / General", minXAF: 90000, maxXAF: 110000, payable: "Centre d'examen agréé (British Council, IDP)", obligatoire: true },
        ],
      },
      {
        nom: "DELF / DALF (Diplôme de Langue Française)",
        delai: "Résultats en 6 à 8 semaines",
        note: "Requis pour certains programmes universitaires en France et en Belgique",
        frais: [
          { label: "Frais d'inscription DELF A2/B1/B2", minXAF: 30000, maxXAF: 60000, payable: "Centre d'examen agréé (Institut Français)", obligatoire: false, note: "Selon le niveau" },
          { label: "Frais d'inscription DALF C1/C2", minXAF: 70000, maxXAF: 90000, payable: "Centre d'examen agréé (Institut Français)", obligatoire: false, note: "Selon le niveau" },
        ],
      },
    ],
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Tarifs() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("canada");
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("XAF");

  const handleCurrencyChange = useCallback((c: Currency) => {
    setCurrency(c);
  }, []);

  const sym = CURRENCY_LABELS[currency];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#0f2460] via-[#1e3a8a] to-[#2563eb] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            Transparence totale — Aucun frais caché
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Frais Administratifs Officiels</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Tous les frais officiels liés à chaque procédure d'immigration — payables directement aux autorités compétentes (ambassades, gouvernements, centres d'examen).
          </p>

          {/* Encadré honoraires */}
          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-5 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">Nos honoraires d'accompagnement</p>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Les frais ci-dessous sont les <strong className="text-white">frais officiels</strong> payables aux autorités. Ils sont indépendants de nos honoraires d'agence.
                  <br /><br />
                  <strong className="text-yellow-300">Nos honoraires sont définis après évaluation gratuite de votre profil.</strong>
                  <a href="/evaluation-widget" className="ml-2 underline text-yellow-300 hover:text-yellow-200 inline-flex items-center gap-1">
                    Faire mon évaluation <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Barre de contrôle : légende + convertisseur ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Légende */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block flex-shrink-0" />
              Frais obligatoires
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block flex-shrink-0" />
              Frais conditionnels
            </span>
          </div>

          {/* Convertisseur de devises */}
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700 hidden sm:inline">Afficher en :</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              {(["XAF", "EUR", "CAD"] as Currency[]).map((c) => {
                const info = CURRENCY_LABELS[c];
                return (
                  <button
                    key={c}
                    onClick={() => handleCurrencyChange(c)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                      currency === c
                        ? "bg-[#2563eb] text-white shadow-inner"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{info.flag}</span>
                    <span>{info.symbol}</span>
                  </button>
                );
              })}
            </div>
            {currency !== "XAF" && (
              <span className="text-xs text-gray-400 hidden md:inline">
                1 {sym.symbol} ≈ {Math.round(1 / RATES[currency]).toLocaleString("fr-FR")} FCFA
              </span>
            )}
          </div>
        </div>

        {/* Bandeau taux indicatif */}
        {currency !== "XAF" && (
          <div className="bg-amber-50 border-t border-amber-100 px-4 py-1.5">
            <p className="max-w-4xl mx-auto text-xs text-amber-700 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 flex-shrink-0" />
              Taux indicatifs — {currency === "EUR" ? "1 EUR = 655,957 FCFA (taux fixe BEAC)" : "1 CAD ≈ 490 FCFA (taux variable)"} — Vérifiez les taux en vigueur avant tout paiement.
            </p>
          </div>
        )}
      </div>

      {/* ── Accordéon ── */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* En-tête catégorie */}
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === category.id ? null : category.id)
                  }
                  className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {category.flag} {category.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 ml-4 transition-transform duration-200 ${
                      expandedCategory === category.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Procédures */}
                {expandedCategory === category.id && (
                  <div className="divide-y divide-gray-100">
                    {category.procedures.map((proc, pIdx) => {
                      const procKey = `${category.id}-${pIdx}`;
                      const isOpen = expandedProcedure === procKey;
                      return (
                        <div key={pIdx} className="bg-white">
                          {/* En-tête procédure */}
                          <button
                            onClick={() => setExpandedProcedure(isOpen ? null : procKey)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50/50 transition-colors text-left"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{proc.nom}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Délai estimé : {proc.delai}</p>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-4 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {/* Tableau des frais */}
                          {isOpen && (
                            <div className="px-6 pb-6">
                              {proc.note && (
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm text-blue-800">
                                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                                  {proc.note}
                                </div>
                              )}
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                                        Nature du frais
                                      </th>
                                      <th className="text-right py-2 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                                        Montant ({sym.symbol})
                                      </th>
                                      <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                                        Payable à
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {proc.frais.map((frais, fIdx) => (
                                      <tr key={fIdx} className="hover:bg-gray-50 group">
                                        <td className="py-3 pr-4">
                                          <div className="flex items-start gap-2">
                                            <span
                                              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                                                frais.obligatoire ? "bg-red-500" : "bg-gray-300"
                                              }`}
                                            />
                                            <div>
                                              <span className="text-gray-800 font-medium">{frais.label}</span>
                                              {frais.note && (
                                                <p className="text-xs text-gray-400 mt-0.5">{frais.note}</p>
                                              )}
                                              {/* Payable à — visible mobile uniquement */}
                                              <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{frais.payable}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 pr-4 text-right align-top">
                                          <span className="font-bold text-[#1e3a8a] whitespace-nowrap tabular-nums">
                                            {formatRange(frais, currency)}
                                          </span>
                                          {/* Montant FCFA en sous-titre si devise différente */}
                                          {currency !== "XAF" && frais.minXAF !== null && (
                                            <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap tabular-nums">
                                              {formatRange(frais, "XAF")}
                                            </p>
                                          )}
                                        </td>
                                        <td className="py-3 text-gray-500 text-xs align-top hidden sm:table-cell">
                                          {frais.payable}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Encadré honoraires 3M ── */}
          <div className="mt-12 bg-gradient-to-br from-[#0f2460] to-[#2563eb] rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-extrabold mb-3">Nos honoraires d'accompagnement</h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-6 leading-relaxed">
              Les frais ci-dessus sont les frais officiels des autorités.{" "}
              <strong className="text-white">Nos honoraires d'agence sont déterminés après évaluation gratuite de votre profil</strong>, en tenant compte de la destination, du type de visa et de la complexité de votre dossier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/evaluation-widget"
                className="inline-block px-7 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors"
              >
                ⭐ Évaluation gratuite de mon profil
              </a>
              <a
                href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20j%27aimerais%20conna%C3%AEtre%20vos%20honoraires%20pour%20mon%20dossier."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-7 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
              >
                💬 Discuter avec un conseiller
              </a>
            </div>
          </div>

          {/* Note de bas de page */}
          <p className="text-center text-xs text-gray-400 mt-6 max-w-2xl mx-auto">
            <Info className="w-3.5 h-3.5 inline mr-1" />
            Les montants indiqués sont fournis à titre indicatif et peuvent évoluer. Les taux de conversion sont indicatifs. Consultez toujours le site officiel de l'ambassade ou de l'autorité concernée pour les tarifs en vigueur.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
