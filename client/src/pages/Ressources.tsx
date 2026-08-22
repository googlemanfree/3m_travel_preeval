import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  Search, Download, FileText, Briefcase, GraduationCap,
  Globe, BookOpen, X, ExternalLink, Filter,
} from "lucide-react";
import { PDF_CATEGORIES, type PdfResource, type PdfCategory, getLocalizedPdfUrl } from "@shared/pdfResources";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDestinationDetailForResource } from "@/lib/publicDestinationCatalog";

// ─── Icônes par catégorie ─────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase, GraduationCap, Globe, BookOpen, FileText,
};

// ─── Couleurs par catégorie ───────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string; btn: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   btn: "bg-blue-700 hover:bg-blue-800" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  badge: "bg-green-100 text-green-700",  btn: "bg-green-700 hover:bg-green-800" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-700 hover:bg-purple-800" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",  btn: "bg-amber-700 hover:bg-amber-800" },
  rose:   { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",   btn: "bg-rose-700 hover:bg-rose-800" },
};

// ─── Composant carte ressource ────────────────────────────────────────────────
function ResourceCard({ resource, color }: { resource: PdfResource; color: string }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  const { language } = useLanguage();
  const displayTitle = language === 'en' && resource.titleEn ? resource.titleEn : resource.title;
  const displayCountry = language === 'en' && resource.countryEn ? resource.countryEn : resource.country;
  const destination = getDestinationDetailForResource(resource);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${c.border} ${c.bg} hover:shadow-sm transition-all duration-150`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl flex-shrink-0">{resource.flag}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{displayTitle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase ${c.badge}`}>
              {resource.type}
            </span>
            <span className="text-xs text-gray-500">{displayCountry}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {destination && (
          <a href={`/destinations/${destination.procedure.id}`} className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all duration-150 hover:bg-blue-50 active:scale-95" title="Voir la fiche destination">
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fiche</span>
          </a>
        )}
        <a
          href={getLocalizedPdfUrl(resource, language)}
          target="_blank"
          rel="noopener noreferrer"
          download
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all duration-150 active:scale-95 ${c.btn}`}
          title={language === 'en' ? `Download ${displayTitle}` : `Télécharger ${displayTitle}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{language === 'en' ? 'Download' : 'Télécharger'}</span>
        </a>
      </div>
    </motion.div>
  );
}

// ─── Composant section catégorie ──────────────────────────────────────────────
function CategorySection({ category, filteredResources }: { category: PdfCategory; filteredResources: PdfResource[] }) {
  const [expanded, setExpanded] = useState(true);
  const c = COLOR_MAP[category.color] ?? COLOR_MAP.blue;
  const Icon = CATEGORY_ICONS[category.icon] ?? FileText;

  if (filteredResources.length === 0) return null;

  return (
    <div className={`rounded-2xl border ${c.border} overflow-hidden`}>
      {/* En-tête de catégorie */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center justify-between p-4 ${c.bg} hover:brightness-95 transition-all duration-150`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.badge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className={`font-bold text-base ${c.text}`}>{category.label}</h2>
            <p className="text-xs text-gray-500">{filteredResources.length} document{filteredResources.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <svg className={`w-5 h-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Liste des ressources */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredResources.map((r) => (
                  <ResourceCard key={r.id} resource={r} color={category.color} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Ressources() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filtrage des ressources
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PDF_CATEGORIES.map((cat) => {
      let resources = cat.resources;
      if (activeCategory && cat.id !== activeCategory) return { ...cat, resources: [] };
      if (q) {
        resources = resources.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.country.toLowerCase().includes(q)
        );
      }
      return { ...cat, resources };
    });
  }, [search, activeCategory]);

  const totalVisible = filteredCategories.reduce((acc, c) => acc + c.resources.length, 0);
  const totalAll = PDF_CATEGORIES.reduce((acc, c) => acc + c.resources.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1e5fa8] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Download className="w-4 h-4" />
              {language === 'en' ? 'Resource Library' : 'Bibliothèque de ressources'}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {language === 'en' ? '3M Travel Guides & Procedures' : 'Guides & Procédures 3M Travel'}
            </h1>
            <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto">
              {language === 'en'
                ? `Download our official procedure sheets for ${totalAll} destinations — Work, Study, Visitor Visas and specialized guides.`
                : `Téléchargez nos fiches de procédures officielles pour ${totalAll} destinations — Visa Travail, Études, Visiteur et guides spécialisés.`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Barre de recherche + filtres */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-center">
          {/* Recherche */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search country, visa type...' : 'Rechercher un pays, un type de visa…'}
                className="pl-9 pr-9 h-10 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
              />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtres par catégorie */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === null
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tout ({totalAll})
            </button>
            {PDF_CATEGORIES.map((cat) => {
              const c = COLOR_MAP[cat.color] ?? COLOR_MAP.blue;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat.id
                      ? `${c.btn} text-white`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label.split(" ")[0]} ({cat.resources.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Résultat de recherche */}
        {search && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Search className="w-4 h-4" />
            <span>
              <strong>{totalVisible}</strong> résultat{totalVisible > 1 ? "s" : ""} pour «{" "}
              <em>{search}</em> »
            </span>
          </div>
        )}

        {/* Catégories */}
        <AnimatePresence>
          {filteredCategories.map((cat) =>
            cat.resources.length > 0 ? (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CategorySection category={cat} filteredResources={cat.resources} />
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {/* Aucun résultat */}
        {totalVisible === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Aucun document trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Essayez un autre mot-clé ou réinitialisez les filtres</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearch(""); setActiveCategory(null); }}
            >
              Réinitialiser
            </Button>
          </div>
        )}

        {/* Note de bas de page */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
          <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Vous ne trouvez pas votre destination ?</p>
            <p className="text-sm text-blue-700 mt-1">
              Notre bibliothèque s'enrichit progressivement. Contactez-nous sur WhatsApp pour obtenir
              la procédure complète pour votre pays de destination.
            </p>
            <a
              href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20je%20cherche%20la%20proc%C3%A9dure%20pour%20"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Demander une procédure sur WhatsApp
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
