import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Search, Filter, Clock, DollarSign, FileText, CheckCircle,
  AlertTriangle, Briefcase, GraduationCap, Eye, Globe,
  ChevronDown, ChevronUp, Download, ArrowRight, Info,
  Building, Users, Star
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { procedureData, type ProcedureInfo } from "@shared/procedureData";
import { getAllResources, type PdfResource } from "@shared/pdfResources";
import { useLocation } from "wouter";

const VISA_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "Travail": {
    label: "Visa Travail",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <Briefcase className="w-4 h-4" />,
  },
  "Études": {
    label: "Visa Études",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <GraduationCap className="w-4 h-4" />,
  },
  "Visiteur": {
    label: "Visa Visiteur",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Eye className="w-4 h-4" />,
  },
  "Résidence Permanente": {
    label: "Résidence Permanente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Globe className="w-4 h-4" />,
  },
  "Procédure Complète": {
    label: "Procédure Complète",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: <FileText className="w-4 h-4" />,
  },
  "Autre": {
    label: "Guide / Info",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
    icon: <Info className="w-4 h-4" />,
  },
};

const COUNTRY_FLAGS: Record<string, string> = {
  "Luxembourg": "🇱🇺", "Allemagne": "🇩🇪", "France": "🇫🇷", "Canada": "🇨🇦",
  "Pologne": "🇵🇱", "Portugal": "🇵🇹", "Italie": "🇮🇹", "Malte": "🇲🇹",
  "Hongrie": "🇭🇺", "Roumanie": "🇷🇴", "Bulgarie": "🇧🇬", "Chypre": "🇨🇾",
  "Croatie": "🇭🇷", "Estonie": "🇪🇪", "Islande": "🇮🇸", "Lettonie": "🇱🇻",
  "Liechtenstein": "🇱🇮", "Lituanie": "🇱🇹", "Norvège": "🇳🇴", "Slovaquie": "🇸🇰",
  "Slovénie": "🇸🇮", "Suisse": "🇨🇭", "République Tchèque": "🇨🇿", "Australie": "🇦🇺",
  "Nouvelle-Zélande": "🇳🇿", "Royaume-Uni": "🇬🇧", "États-Unis": "🇺🇸", "Qatar": "🇶🇦",
  "Île Maurice": "🇲🇺", "Gabon": "🇬🇦", "Kenya": "🇰🇪", "Malaisie": "🇲🇾",
  "Sénégal": "🇸🇳", "Irlande": "🇮🇪", "Belgique": "🇧🇪", "Espagne": "🇪🇸",
  "Finlande": "🇫🇮", "Danemark": "🇩🇰", "Autriche": "🇦🇹", "Pays-Bas": "🇳🇱",
  "Suède": "🇸🇪", "Dubaï (EAU)": "🇦🇪", "Turquie": "🇹🇷", "Arménie": "🇦🇲",
  "Azerbaïdjan": "🇦🇿", "Géorgie": "🇬🇪", "Grèce": "🇬🇷",
};

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\(cid:\d+\)/g, "•")
    .replace(/\s{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

interface FicheCardProps {
  proc: ProcedureInfo;
  pdfUrl?: string;
}

function FicheCard({ proc, pdfUrl }: FicheCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();
  const config = VISA_TYPE_CONFIG[proc.visaType] ?? VISA_TYPE_CONFIG["Autre"];
  const flag = COUNTRY_FLAGS[proc.country] ?? "🌍";

  const sections = [
    { label: "Conditions d'éligibilité", icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, content: cleanText(proc.eligibilityConditions) },
    { label: "Documents requis", icon: <FileText className="w-4 h-4 text-blue-600" />, content: cleanText(proc.requiredDocuments) },
    { label: "Étapes de la procédure", icon: <ArrowRight className="w-4 h-4 text-indigo-600" />, content: cleanText(proc.procedureSteps) },
    { label: "Coûts & Budget", icon: <DollarSign className="w-4 h-4 text-amber-600" />, content: cleanText(proc.costs) },
    { label: "Secteurs couverts", icon: <Building className="w-4 h-4 text-purple-600" />, content: cleanText(proc.sectors) },
    { label: "Conseils pratiques", icon: <AlertTriangle className="w-4 h-4 text-orange-600" />, content: cleanText(proc.practicalTips) },
  ].filter(s => s.content && s.content.length > 20);

  return (
    <Card className={`border ${config.bg} hover:shadow-md transition-all duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl flex-shrink-0">{flag}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{proc.country}</h3>
                <Badge variant="outline" className={`text-xs ${config.color} border-current flex items-center gap-1`}>
                  {config.icon}
                  {config.label}
                </Badge>
              </div>
              {proc.processingTime && proc.processingTime !== "Sur demande" && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{truncate(proc.processingTime, 60)}</span>
                </div>
              )}
              {proc.salaryMin && (
                <div className="flex items-center gap-1 mt-0.5 text-sm text-emerald-700 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{truncate(proc.salaryMin, 80)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
              </a>
            )}
            <Button
              size="sm"
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1"
              onClick={() => navigate("/open-dossier")}
            >
              <ArrowRight className="w-3 h-3" />
              Démarrer
            </Button>
          </div>
        </div>
      </CardHeader>

      {sections.length > 0 && (
        <CardContent className="pt-0">
          {/* Aperçu — toujours visible */}
          {sections[0] && (
            <div className="mb-3 p-3 bg-white/70 rounded-lg border border-white">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {sections[0].icon}
                {sections[0].label}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {truncate(cleanText(sections[0].content), 300)}
              </p>
            </div>
          )}

          {/* Sections détaillées — expandables */}
          {expanded && (
            <div className="space-y-3 mt-3 border-t pt-3">
              {sections.slice(1).map((section, i) => (
                <div key={i} className="p-3 bg-white/70 rounded-lg border border-white">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {section.icon}
                    {section.label}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {truncate(section.content, 600)}
                  </p>
                </div>
              ))}

              {/* Texte brut (début du document) */}
              {proc.rawText && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5" />
                    Extrait du document officiel
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-line">
                    {truncate(cleanText(proc.rawText), 800)}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="w-4 h-4" /> Réduire</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Voir tous les détails ({sections.length - 1} sections)</>
            )}
          </button>
        </CardContent>
      )}
    </Card>
  );
}

export default function Fiches() {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string>("Tous");
  const [activeCountry, setActiveCountry] = useState<string>("Tous");

  // Dédupliquer : garder la fiche la plus complète par pays+type
  const dedupedData = useMemo(() => {
    const seen = new Map<string, ProcedureInfo>();
    for (const p of procedureData) {
      const key = `${p.country}|${p.visaType}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, p);
      } else {
        // Garder la plus complète (plus de texte)
        const existingLen = (existing.eligibilityConditions + existing.requiredDocuments + existing.procedureSteps).length;
        const newLen = (p.eligibilityConditions + p.requiredDocuments + p.procedureSteps).length;
        if (newLen > existingLen) seen.set(key, p);
      }
    }
    return Array.from(seen.values());
  }, []);

  const countries = useMemo(() => {
    return ["Tous", ...Array.from(new Set(dedupedData.map(p => p.country))).sort()];
  }, [dedupedData]);

  const visaTypes = useMemo(() => {
    return ["Tous", ...Array.from(new Set(dedupedData.map(p => p.visaType))).sort()];
  }, [dedupedData]);

  const filtered = useMemo(() => {
    return dedupedData.filter(p => {
      const matchSearch = !search ||
        p.country.toLowerCase().includes(search.toLowerCase()) ||
        p.visaType.toLowerCase().includes(search.toLowerCase()) ||
        p.sectors.toLowerCase().includes(search.toLowerCase()) ||
        p.eligibilityConditions.toLowerCase().includes(search.toLowerCase());
      const matchType = activeType === "Tous" || p.visaType === activeType;
      const matchCountry = activeCountry === "Tous" || p.country === activeCountry;
      return matchSearch && matchType && matchCountry;
    });
  }, [dedupedData, search, activeType, activeCountry]);

  // Trouver le PDF correspondant à une procédure
  function findPdf(proc: ProcedureInfo): string | undefined {
    const countryNorm = proc.country.toLowerCase()
      .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e")
      .replace(/à/g, "a").replace(/â/g, "a").replace(/ô/g, "o")
      .replace(/î/g, "i").replace(/û/g, "u").replace(/ç/g, "c")
      .replace(/ï/g, "i").replace(/œ/g, "oe").replace(/æ/g, "ae")
      .replace(/\s+/g, "").replace(/[^a-z]/g, "");

    const typeMap: Record<string, string> = {
      "Travail": "visatravail",
      "Études": "visaetudes",
      "Visiteur": "visavisiteur",
      "Résidence Permanente": "rp",
    };
    const typeNorm = typeMap[proc.visaType] ?? "";

    const allResources = getAllResources();
  const match = allResources.find((r: PdfResource) => {
      const titleNorm = (r.title as string).toLowerCase()
        .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e")
        .replace(/à/g, "a").replace(/â/g, "a").replace(/ô/g, "o")
        .replace(/î/g, "i").replace(/û/g, "u").replace(/ç/g, "c")
        .replace(/ï/g, "i").replace(/\s+/g, "");
      return titleNorm.includes(countryNorm) && (typeNorm === "" || titleNorm.includes(typeNorm));
    });
    return match?.url;
  }

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const p of dedupedData) {
      stats[p.visaType] = (stats[p.visaType] ?? 0) + 1;
    }
    return stats;
  }, [dedupedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-200" />
            <span className="text-blue-200 font-semibold text-sm uppercase tracking-wider">Fiches officielles 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Procédures détaillées par pays
          </h1>
          <p className="text-lg text-blue-100 max-w-3xl mb-6">
            Toutes les informations extraites de nos documents officiels — conditions d'éligibilité,
            documents requis, étapes, délais, coûts et conseils pratiques pour{" "}
            <strong className="text-white">{dedupedData.length} procédures</strong> dans{" "}
            <strong className="text-white">{countries.length - 1} pays</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(typeStats).map(([type, count]) => {
              const cfg = VISA_TYPE_CONFIG[type] ?? VISA_TYPE_CONFIG["Autre"];
              return (
                <div key={type} className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-2">
                  {cfg.icon}
                  {cfg.label} ({count})
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un pays, un secteur, une condition..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  ×
                </button>
              )}
            </div>

            {/* Filtre type */}
            <div className="flex flex-wrap gap-1.5">
              {["Tous", "Travail", "Études", "Visiteur", "Résidence Permanente", "Procédure Complète", "Autre"].map(type => {
                const cfg = VISA_TYPE_CONFIG[type] ?? { label: "Tous", color: "text-gray-700", bg: "bg-gray-100", icon: null };
                const count = type === "Tous" ? dedupedData.length : (typeStats[type] ?? 0);
                if (type !== "Tous" && count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      activeType === type
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    {type === "Tous" ? `Tous (${count})` : `${type} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Filtre pays */}
            <select
              value={activeCountry}
              onChange={e => setActiveCountry(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {countries.map(c => (
                <option key={c} value={c}>
                  {c === "Tous" ? "Tous les pays" : `${COUNTRY_FLAGS[c] ?? "🌍"} ${c}`}
                </option>
              ))}
            </select>
          </div>

          {/* Résultats */}
          <div className="mt-2 text-xs text-gray-500">
            {filtered.length} fiche{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
            {(search || activeType !== "Tous" || activeCountry !== "Tous") && (
              <button
                onClick={() => { setSearch(""); setActiveType("Tous"); setActiveCountry("Tous"); }}
                className="ml-3 text-blue-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grille des fiches */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune fiche trouvée</p>
            <p className="text-sm mt-1">Essayez d'autres termes de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((proc, i) => (
              <FicheCard key={`${proc.country}-${proc.visaType}-${i}`} proc={proc} pdfUrl={findPdf(proc)} />
            ))}
          </div>
        )}
      </section>

      {/* CTA bas de page */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Star className="w-10 h-10 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-3">Votre projet de mobilité commence ici</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Nos conseillers analysent votre profil gratuitement et vous orientent vers la procédure la plus adaptée à votre situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/open-dossier">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 text-base">
                Ouvrir mon dossier
              </Button>
            </a>
            <a href="/ressources">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-bold px-8 py-3 text-base">
                <Download className="w-4 h-4 mr-2" />
                Télécharger les guides PDF
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
