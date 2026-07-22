import { useState } from "react";
import { ChevronDown, Info, Star, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type FraisItem = {
  label: string;
  montant: string;
  payable: string;
  obligatoire: boolean;
  note?: string;
};

type Category = {
  id: string;
  name: string;
  flag: string;
  description: string;
  procedures: {
    nom: string;
    frais: FraisItem[];
    delai: string;
    note?: string;
  }[];
};

export default function Tarifs() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("canada");
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);

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
            { label: "Frais de traitement — Demandeur principal", montant: "1 365 CAD", payable: "IRCC (en ligne)", obligatoire: true },
            { label: "Frais de traitement — Conjoint/Partenaire", montant: "1 365 CAD", payable: "IRCC (en ligne)", obligatoire: false, note: "Si applicable" },
            { label: "Frais de traitement — Enfant à charge", montant: "230 CAD", payable: "IRCC (en ligne)", obligatoire: false, note: "Par enfant" },
            { label: "Frais de droit de résidence permanente (DRP)", montant: "515 CAD", payable: "IRCC (en ligne)", obligatoire: true, note: "Par adulte, remboursable si refus" },
            { label: "Biométrie", montant: "85 CAD", payable: "IRCC (en ligne)", obligatoire: true, note: "Par personne (max 170 CAD/famille)" },
            { label: "Examen médical (IME)", montant: "200 000 – 350 000 FCFA", payable: "Médecin désigné IRCC", obligatoire: true, note: "Variable selon le médecin" },
            { label: "Certificat de police (Cameroun)", montant: "5 000 FCFA", payable: "Délégation Générale à la Sûreté Nationale", obligatoire: true },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur agréé", obligatoire: true, note: "Par document" },
            { label: "TCF Canada (si requis)", montant: "80 000 – 100 000 FCFA", payable: "Centre d'examen agréé", obligatoire: false, note: "Selon profil" },
          ],
        },
        {
          nom: "Visa Étudiant (Permis d'études)",
          delai: "2 à 4 mois",
          note: "Frais payables directement à IRCC",
          frais: [
            { label: "Frais de traitement du permis d'études", montant: "150 CAD", payable: "IRCC (en ligne)", obligatoire: true },
            { label: "Biométrie", montant: "85 CAD", payable: "IRCC (en ligne)", obligatoire: true },
            { label: "Lettre d'acceptation (CAQ Québec si applicable)", montant: "114 CAD", payable: "MIFI Québec", obligatoire: false, note: "Uniquement pour le Québec" },
            { label: "Examen médical (si requis)", montant: "200 000 – 300 000 FCFA", payable: "Médecin désigné IRCC", obligatoire: false, note: "Selon durée du séjour" },
            { label: "Certificat de police (Cameroun)", montant: "5 000 FCFA", payable: "DGSN", obligatoire: true },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur agréé", obligatoire: true, note: "Par document" },
            { label: "TCF/IELTS (selon établissement)", montant: "80 000 – 100 000 FCFA", payable: "Centre d'examen agréé", obligatoire: false },
          ],
        },
        {
          nom: "Permis de Travail Temporaire (LMIA)",
          delai: "3 à 6 mois",
          note: "Frais payables directement à IRCC et ESDC",
          frais: [
            { label: "Frais de traitement du permis de travail", montant: "155 CAD", payable: "IRCC (en ligne)", obligatoire: true },
            { label: "Biométrie", montant: "85 CAD", payable: "IRCC (en ligne)", obligatoire: true },
            { label: "Frais LMIA (à la charge de l'employeur)", montant: "1 000 CAD", payable: "ESDC Canada", obligatoire: true, note: "Payé par l'employeur canadien" },
            { label: "Examen médical", montant: "200 000 – 300 000 FCFA", payable: "Médecin désigné IRCC", obligatoire: true },
            { label: "Certificat de police (Cameroun)", montant: "5 000 FCFA", payable: "DGSN", obligatoire: true },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur agréé", obligatoire: true },
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
            { label: "Frais Campus France (procédure CEF)", montant: "90 000 FCFA", payable: "Campus France Yaoundé/Douala", obligatoire: true },
            { label: "Frais de visa consulaire", montant: "50 € (≈ 33 000 FCFA)", payable: "Consulat de France / VFS Global", obligatoire: true },
            { label: "Frais de service VFS Global", montant: "27 € (≈ 18 000 FCFA)", payable: "VFS Global", obligatoire: true },
            { label: "Assurance voyage (si requis)", montant: "15 000 – 30 000 FCFA", payable: "Compagnie d'assurance", obligatoire: false },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur assermenté", obligatoire: true },
            { label: "TCF/DELF (selon établissement)", montant: "60 000 – 80 000 FCFA", payable: "Centre d'examen agréé", obligatoire: false },
          ],
        },
        {
          nom: "Visa Long Séjour Travail / Passeport Talent",
          delai: "2 à 4 mois",
          note: "Frais payables au Consulat de France",
          frais: [
            { label: "Frais de visa consulaire", montant: "99 € (≈ 65 000 FCFA)", payable: "Consulat de France / VFS Global", obligatoire: true },
            { label: "Frais de service VFS Global", montant: "27 € (≈ 18 000 FCFA)", payable: "VFS Global", obligatoire: true },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur assermenté", obligatoire: true },
            { label: "Légalisation/Apostille des diplômes", montant: "10 000 – 20 000 FCFA", payable: "Ministère des Affaires Étrangères", obligatoire: true },
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
            { label: "Frais de visa consulaire", montant: "80 € (≈ 53 000 FCFA)", payable: "Ambassade / Centre de visa", obligatoire: true },
            { label: "Frais de service VFS/TLS Contact", montant: "25 – 35 € (≈ 16 000 – 23 000 FCFA)", payable: "VFS Global / TLS Contact", obligatoire: true },
            { label: "Assurance voyage Schengen (min. 30 000 €)", montant: "10 000 – 25 000 FCFA", payable: "Compagnie d'assurance", obligatoire: true },
            { label: "Réservation d'hôtel / hébergement", montant: "Variable", payable: "Hébergeur", obligatoire: true, note: "Preuve requise" },
            { label: "Réservation de vol (billet non définitif)", montant: "5 000 FCFA", payable: "3M Travel", obligatoire: true, note: "Billet de réservation pour visa" },
          ],
        },
        {
          nom: "Visa National Allemagne (Chancenkarte / Travail qualifié)",
          delai: "2 à 4 mois",
          note: "Frais payables à l'Ambassade d'Allemagne",
          frais: [
            { label: "Frais de visa national", montant: "75 € (≈ 49 000 FCFA)", payable: "Ambassade d'Allemagne", obligatoire: true },
            { label: "Frais de service VFS Global", montant: "25 € (≈ 16 000 FCFA)", payable: "VFS Global", obligatoire: true },
            { label: "Reconnaissance des diplômes (anabin/ZAB)", montant: "200 € (≈ 131 000 FCFA)", payable: "Anabin / ZAB Allemagne", obligatoire: false, note: "Si diplôme non reconnu" },
            { label: "Traduction assermentée des documents", montant: "15 000 – 30 000 FCFA", payable: "Traducteur assermenté", obligatoire: true },
            { label: "Test de langue (A1 minimum)", montant: "50 000 – 80 000 FCFA", payable: "Institut Goethe", obligatoire: false, note: "Selon le type de visa" },
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
            { label: "Frais de visa de travail (employment visa)", montant: "1 100 – 1 500 AED (≈ 200 000 – 270 000 FCFA)", payable: "ICP / MOHRE EAU", obligatoire: true, note: "Généralement à la charge de l'employeur" },
            { label: "Examen médical (obligatoire à l'arrivée)", montant: "300 – 500 AED (≈ 55 000 – 90 000 FCFA)", payable: "Centre médical agréé EAU", obligatoire: true },
            { label: "Emirates ID (carte d'identité résidente)", montant: "100 – 300 AED (≈ 18 000 – 55 000 FCFA)", payable: "ICP EAU", obligatoire: true },
            { label: "Certificat de police (Cameroun + apostille)", montant: "5 000 – 15 000 FCFA", payable: "DGSN + MAE", obligatoire: true },
            { label: "Traduction et légalisation des documents", montant: "20 000 – 40 000 FCFA", payable: "Traducteur agréé", obligatoire: true },
          ],
        },
        {
          nom: "Visa de Travail — Arabie Saoudite (Iqama)",
          delai: "2 à 3 mois",
          note: "Frais payables aux autorités saoudiennes (MLSD)",
          frais: [
            { label: "Frais de visa d'entrée de travail", montant: "500 – 800 SAR (≈ 75 000 – 120 000 FCFA)", payable: "MLSD Arabie Saoudite", obligatoire: true, note: "Généralement à la charge de l'employeur" },
            { label: "Examen médical (avant départ)", montant: "50 000 – 80 000 FCFA", payable: "Centre médical agréé", obligatoire: true },
            { label: "Iqama (permis de résidence)", montant: "650 – 800 SAR/an (≈ 100 000 FCFA)", payable: "MLSD Arabie Saoudite", obligatoire: true },
            { label: "Certificat de police (Cameroun + apostille)", montant: "5 000 – 15 000 FCFA", payable: "DGSN + MAE", obligatoire: true },
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
            { label: "Frais bancaires de traitement (banque camerounaise)", montant: "20 000 – 50 000 FCFA", payable: "Votre banque au Cameroun", obligatoire: true, note: "Variable selon la banque" },
            { label: "Frais de légalisation du document", montant: "5 000 – 10 000 FCFA", payable: "Notaire / Ambassade", obligatoire: false, note: "Selon exigence du pays" },
          ],
        },
        {
          nom: "Réservation de Vol pour Visa",
          delai: "24 à 48h",
          note: "Billet de réservation (non définitif) accepté par les ambassades",
          frais: [
            { label: "Frais de réservation de vol (billet visa)", montant: "5 000 FCFA", payable: "3M Travel", obligatoire: true },
          ],
        },
        {
          nom: "Traduction Assermentée de Documents",
          delai: "3 à 5 jours ouvrables",
          note: "Traduction officielle acceptée par les ambassades et autorités étrangères",
          frais: [
            { label: "Traduction d'un document (1 page)", montant: "10 000 – 20 000 FCFA", payable: "Traducteur assermenté agréé", obligatoire: true, note: "Par page" },
            { label: "Légalisation de la traduction", montant: "5 000 FCFA", payable: "Ministère des Affaires Étrangères", obligatoire: false },
          ],
        },
        {
          nom: "Certificat de Police / Casier Judiciaire",
          delai: "3 à 7 jours",
          note: "Document obligatoire pour la quasi-totalité des visas d'immigration",
          frais: [
            { label: "Casier judiciaire (bulletin n°3)", montant: "1 500 FCFA", payable: "Tribunal de Grande Instance", obligatoire: true },
            { label: "Certificat de police (DGSN)", montant: "5 000 FCFA", payable: "Délégation Générale à la Sûreté Nationale", obligatoire: true },
            { label: "Apostille (si requis par le pays)", montant: "10 000 – 15 000 FCFA", payable: "Ministère des Affaires Étrangères", obligatoire: false },
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
            { label: "Frais d'inscription TCF Canada", montant: "82 000 – 95 000 FCFA", payable: "Centre d'examen agréé (Institut Français, Alliance Française)", obligatoire: true },
            { label: "Frais de report de session (si annulation)", montant: "15 000 – 20 000 FCFA", payable: "Centre d'examen", obligatoire: false },
          ],
        },
        {
          nom: "TEF Canada (Test d'Évaluation de Français)",
          delai: "Résultats en 3 à 4 semaines",
          note: "Alternative au TCF pour Express Entry et programmes canadiens",
          frais: [
            { label: "Frais d'inscription TEF Canada", montant: "80 000 – 100 000 FCFA", payable: "Centre d'examen agréé (CCIP)", obligatoire: true },
          ],
        },
        {
          nom: "IELTS (International English Language Testing System)",
          delai: "Résultats en 13 jours",
          note: "Requis pour le Canada (Express Entry), le Royaume-Uni, l'Australie et la Nouvelle-Zélande",
          frais: [
            { label: "Frais d'inscription IELTS Academic / General", montant: "90 000 – 110 000 FCFA", payable: "Centre d'examen agréé (British Council, IDP)", obligatoire: true },
          ],
        },
        {
          nom: "DELF / DALF (Diplôme de Langue Française)",
          delai: "Résultats en 6 à 8 semaines",
          note: "Requis pour certains programmes universitaires en France et en Belgique",
          frais: [
            { label: "Frais d'inscription DELF A2/B1/B2", montant: "30 000 – 60 000 FCFA", payable: "Centre d'examen agréé (Institut Français)", obligatoire: false, note: "Selon le niveau" },
            { label: "Frais d'inscription DALF C1/C2", montant: "70 000 – 90 000 FCFA", payable: "Centre d'examen agréé (Institut Français)", obligatoire: false, note: "Selon le niveau" },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
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

          {/* Encadré important */}
          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-5 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">Nos honoraires d'accompagnement</p>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Les frais ci-dessous sont les <strong className="text-white">frais officiels</strong> payables aux autorités (ambassades, gouvernements, banques, centres d'examen). Ils sont indépendants de nos honoraires d'agence.
                  <br /><br />
                  <strong className="text-yellow-300">Nos honoraires sont définis après évaluation gratuite de votre profil</strong>, en fonction de la complexité de votre dossier et de la destination choisie.
                  <a href="/evaluation-widget" className="ml-2 underline text-yellow-300 hover:text-yellow-200 inline-flex items-center gap-1">
                    Faire mon évaluation <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Légende */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            Frais obligatoires
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
            Frais conditionnels (selon profil)
          </span>
          <span className="flex items-center gap-1.5 ml-auto text-gray-400 italic">
            Montants indicatifs — vérifier auprès des autorités compétentes
          </span>
        </div>
      </div>

      {/* Contenu accordéon */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* En-tête catégorie */}
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {category.flag} {category.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 ml-4 transition-transform ${
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
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-4 transition-transform ${
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
                                      <th className="text-left py-2 pr-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Nature du frais</th>
                                      <th className="text-right py-2 pr-4 font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">Montant</th>
                                      <th className="text-left py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">Payable à</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {proc.frais.map((frais, fIdx) => (
                                      <tr key={fIdx} className="hover:bg-gray-50">
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
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                          <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{frais.montant}</span>
                                        </td>
                                        <td className="py-3 text-gray-500 text-xs">{frais.payable}</td>
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

          {/* Encadré honoraires 3M */}
          <div className="mt-12 bg-gradient-to-br from-[#0f2460] to-[#2563eb] rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-extrabold mb-3">Nos honoraires d'accompagnement</h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-6 leading-relaxed">
              Les frais ci-dessus sont les frais officiels des autorités. <strong className="text-white">Nos honoraires d'agence sont déterminés après évaluation gratuite de votre profil</strong>, en tenant compte de la destination, du type de visa et de la complexité de votre dossier.
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
            Les montants indiqués sont fournis à titre indicatif et peuvent évoluer. Consultez toujours le site officiel de l'ambassade ou de l'autorité concernée pour les tarifs en vigueur.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
