import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Search, Download, Filter, MapPin, Clock, DollarSign, FileText, ChevronDown, Star, Eye, EyeOff, ArrowUpDown, Calculator, CheckSquare, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { procedures107Complete } from '@/data/procedures107Complete';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedPdfUrl } from '@shared/pdfResources';
import { getProcedureVisualSources } from '@/data/procedureVisuals';
import { getPublicDestinationDetail, getPublicDestinationPath } from '@/lib/publicDestinationCatalog';
import { trpc } from '@/lib/trpc';
// CanadaScoreSimulator déplacé vers la section /canada dédiée

const REGIONS = ['Tous', 'Europe', 'Asie', 'Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Océanie', 'Moyen-Orient'];

const VISA_DOCUMENT_CHECKLISTS = {
  travail: ["Passeport valide", "CV adapté au poste", "Diplômes et certifications", "Justificatifs d’expérience", "Offre ou projet professionnel, si disponible", "Preuves de ressources selon la procédure"],
  etudes: ["Passeport valide", "Diplômes et relevés", "Lettre d’admission ou projet académique", "Preuves de ressources et prise en charge", "Projet d’études", "Justificatifs demandés par l’établissement ou le consulat"],
  visiteur: ["Passeport valide", "Itinéraire et réservations cohérents", "Hébergement ou lettre d’invitation", "Assurance voyage, si requise", "Preuves de ressources", "Justificatifs du retour et du motif de séjour"],
} as const;

const visaChecklistLabels = { travail: "Travail", etudes: "Études", visiteur: "Visiteur / tourisme" } as const;

export default function ProceduresAdvanced() {
  const { language } = useLanguage();
  const { data: destinationMediaOverrides } = trpc.destinationMedia.listPublic.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const mediaByDestination = useMemo(() => {
    const map = new Map<string, { imageUrl?: string | null; flagUrl?: string | null }>();
    for (const media of destinationMediaOverrides ?? []) {
      if (media.destinationId) map.set(media.destinationId, media);
    }
    return map;
  }, [destinationMediaOverrides]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [visaType, setVisaType] = useState<'travail' | 'etudes' | 'visiteur' | 'tous'>('tous');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showBudgetCalculator, setShowBudgetCalculator] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'time' | 'salary'>('name');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  
  // Advanced filters
  const [minSalaryFilter, setMinSalaryFilter] = useState(0);
  const [maxCostFilter, setMaxCostFilter] = useState(10000);
  const [maxTimeFilter, setMaxTimeFilter] = useState(52);
  const [difficultyFilter, setDifficultyFilter] = useState<'tous' | 'facile' | 'moyen' | 'difficile'>('tous');
  const [documentVisaType, setDocumentVisaType] = useState<keyof typeof VISA_DOCUMENT_CHECKLISTS>('travail');

  // Budget calculator state
  const [selectedCountryForBudget, setSelectedCountryForBudget] = useState<string | null>(null);
  const [servicesFee, setServicesFee] = useState(2500);

  // Filter countries
  const filteredCountries = useMemo(() => {
    let filtered = procedures107Complete.filter(country => {
      const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fr');
      const searchableVisa = visaChecklistLabels[country.visaType as keyof typeof visaChecklistLabels] ?? country.visaType;
      const matchesSearch = !normalizedQuery || [
        country.name,
        country.id,
        country.region,
        country.visaType,
        searchableVisa,
      ].some((value) => value.toLocaleLowerCase('fr').includes(normalizedQuery));
      const matchesRegion = selectedRegion === 'Tous' || country.region === selectedRegion;
      const matchesVisaType = visaType === 'tous' || country.visaType === visaType;
      const matchesDifficulty = difficultyFilter === 'tous' || country.difficulty === difficultyFilter;
      
      // Salary filter
      const salaryNum = country.minSalary ? parseInt(country.minSalary.split(' ')[0]) : 0;
      const matchesSalary = salaryNum >= minSalaryFilter;
      
      // Cost filter
      const costNum = parseInt(country.cost.split('-')[1] || country.cost.split('-')[0]);
      const matchesCost = costNum <= maxCostFilter;
      
      // Time filter
      const timeNum = parseInt(country.processingTime.split('-')[1] || country.processingTime.split('-')[0]);
      const matchesTime = timeNum <= maxTimeFilter;

      return matchesSearch && matchesRegion && matchesVisaType && matchesDifficulty && matchesSalary && matchesCost && matchesTime;
    });

    // Sort
    if (sortBy === 'cost') {
      filtered.sort((a, b) => {
        const costA = parseInt(a.cost.split('-')[0]);
        const costB = parseInt(b.cost.split('-')[0]);
        return costA - costB;
      });
    } else if (sortBy === 'time') {
      filtered.sort((a, b) => {
        const timeA = parseInt(a.processingTime.split('-')[0]);
        const timeB = parseInt(b.processingTime.split('-')[0]);
        return timeA - timeB;
      });
    } else if (sortBy === 'salary') {
      filtered.sort((a, b) => {
        const salaryA = a.minSalary ? parseInt(a.minSalary.split(' ')[0]) : 0;
        const salaryB = b.minSalary ? parseInt(b.minSalary.split(' ')[0]) : 0;
        return salaryB - salaryA;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [searchQuery, selectedRegion, visaType, sortBy, minSalaryFilter, maxCostFilter, maxTimeFilter, difficultyFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'difficile':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleComparison = (countryId: string) => {
    setSelectedForComparison(prev =>
      prev.includes(countryId)
        ? prev.filter(id => id !== countryId)
        : [...prev, countryId].slice(-3)
    );
  };

  const comparisonCountries = selectedForComparison
    .map(id => procedures107Complete.find(c => c.id === id))
    .filter(Boolean);

  const selectedCountryBudget = selectedCountryForBudget 
    ? procedures107Complete.find(c => c.id === selectedCountryForBudget)
    : null;

  const calculateBudget = (country: typeof procedures107Complete[0]) => {
    const costNum = parseInt(country.cost.split('-')[1] || country.cost.split('-')[0]);
    const totalCostNum = parseInt(country.totalCost?.split('-')[1] || '0');
    return costNum + totalCostNum + servicesFee;
  };

  const getEvaluationHref = (country: typeof procedures107Complete[0]) =>
    `/?project=${encodeURIComponent(country.visaType)}&destination=${encodeURIComponent(country.id)}#evaluation-multi`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            📋 Procédures Avancées - 107 Destinations
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Filtres avancés, comparaisons interactives et calculateur de budget pour trouver la meilleure destination.
          </p>
        </motion.div>

        {/* Blocs distincts des services et du score canadien */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-blue-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-3xl" aria-hidden="true">🇨🇦</span>
            <h2 className="mt-3 text-lg font-black text-slate-900">Canada : Résidence & Emploi</h2>
            <p className="mt-2 text-sm text-slate-600">Entrée express, programmes provinciaux, volets régionaux et accompagnement emploi rigoureux.</p>
            <Link href="/canada" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900">Découvrir le guide Canada →</Link>
          </Card>
          <Card className="p-6 border-blue-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-3xl" aria-hidden="true">🇪🇺</span>
            <h2 className="mt-3 text-lg font-black text-slate-900">Visa Schengen & Court Séjour</h2>
            <p className="mt-2 text-sm text-slate-600">Tourisme, affaires, visite familiale, études courtes ou transit à travers les 29 pays de l’espace Schengen.</p>
            <Link href="/schengen" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900">Découvrir le guide Schengen →</Link>
          </Card>
          <Card className="p-6 border-blue-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-3xl" aria-hidden="true">🎓</span>
            <h2 className="mt-3 text-lg font-black text-slate-900">Études Internationales</h2>
            <p className="mt-2 text-sm text-slate-600">10 destinations de référence (Canada, France, Belgique, Allemagne, USA, UK, etc.) et accompagnement rentrée.</p>
            <Link href="/etudes" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900">Explorer les 10 destinations →</Link>
          </Card>
        </div>

        {/* Outils d’orientation : le simulateur CRS reste volontairement dans la section Canada pour éviter toute confusion. */}
        <section className="mb-12 grid gap-6 lg:grid-cols-2" aria-label="Outils de préparation du dossier">
          <Card className="border-blue-200 !bg-gradient-to-br !from-blue-700 !to-indigo-800 p-6 text-white shadow-lg">
            <div className="flex items-start gap-4"><div className="rounded-xl bg-white/15 p-3"><Calculator className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Projet Canada</p><h2 className="mt-1 text-2xl font-black">Vérifier votre score CRS</h2><p className="mt-2 max-w-xl text-sm leading-6 text-blue-50">Le calculateur Canada compare votre profil, les seuils historiques et les actions utiles. Il s’agit d’un repère d’orientation, non d’une décision d’immigration.</p></div></div>
            <Link href="/canada" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-blue-800 hover:bg-blue-50">Ouvrir le calculateur CRS <ExternalLink className="h-4 w-4" /></Link>
          </Card>
          <Card className="border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><MessageCircle className="h-6 w-6" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Besoin d’orientation</p><h2 className="mt-1 text-2xl font-black text-slate-950">Parler à un conseiller</h2><p className="mt-2 text-sm leading-6 text-slate-600">Partagez votre destination, votre procédure et les pièces déjà disponibles pour recevoir une orientation adaptée.</p></div></div>
            <a href={`https://wa.me/237698104832?text=${encodeURIComponent("Bonjour, je consulte les procédures 3M Travel et souhaite être orienté(e) sur mon projet.")}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700">WhatsApp +237 698 104 832 <ExternalLink className="h-4 w-4" /></a>
          </Card>
        </section>

        <section className="mb-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="documents-par-visa">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-2xl"><span className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Préparer son dossier</span><h2 id="documents-par-visa" className="mt-2 flex items-center gap-2 text-2xl font-black text-slate-950"><CheckSquare className="h-6 w-6 text-blue-700" />Documents par type de visa</h2><p className="mt-2 text-sm leading-6 text-slate-600">Utilisez cette liste comme repère de préparation. Les exigences finales dépendent du pays, de la nationalité, du motif et du portail officiel concerné.</p></div><div className="flex flex-wrap gap-2">{(Object.keys(VISA_DOCUMENT_CHECKLISTS) as Array<keyof typeof VISA_DOCUMENT_CHECKLISTS>).map((type) => <Button key={type} type="button" variant={documentVisaType === type ? "default" : "outline"} onClick={() => setDocumentVisaType(type)} className={documentVisaType === type ? "bg-blue-700 hover:bg-blue-800" : "border-slate-200 text-slate-700"}>{visaChecklistLabels[type]}</Button>)}</div></div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{VISA_DOCUMENT_CHECKLISTS[documentVisaType].map((document) => <li key={document} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"><CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /><span>{document}</span></li>)}</ul>
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">Après l’évaluation, la checklist détaillée est adaptée au pays et à la procédure sélectionnés dans votre dossier.</p>
        </section>

        {/* Comparatif visuel des parcours */}
        <section aria-labelledby="parcours-comparatif" className="mb-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 max-w-3xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Choisir son parcours</span>
            <h2 id="parcours-comparatif" className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Travail, Études ou Tourisme ?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Comparez les objectifs, les pièces à préparer et les prochaines étapes. Ces repères orientent votre choix ; l’admission, le visa, le permis ou l’emploi restent soumis aux autorités et organismes compétents.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm">
              <caption className="sr-only">Comparaison des parcours Travail, Études et Tourisme</caption>
              <thead>
                <tr className="bg-slate-50">
                  <th scope="col" className="w-[18%] px-4 py-4 font-black text-slate-700">Repère</th>
                  <th scope="col" className="w-[27%] border-l border-slate-200 px-4 py-4 align-top"><span className="text-xl" aria-hidden="true">💼</span><span className="mt-1 block font-black text-slate-950">Travail</span><span className="mt-1 block font-normal text-slate-500">Projet professionnel</span></th>
                  <th scope="col" className="w-[27%] border-l border-slate-200 px-4 py-4 align-top"><span className="text-xl" aria-hidden="true">🎓</span><span className="mt-1 block font-black text-slate-950">Études</span><span className="mt-1 block font-normal text-slate-500">Projet académique</span></th>
                  <th scope="col" className="w-[28%] border-l border-slate-200 px-4 py-4 align-top"><span className="text-xl" aria-hidden="true">✈️</span><span className="mt-1 block font-black text-slate-950">Tourisme</span><span className="mt-1 block font-normal text-slate-500">Séjour temporaire</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <th scope="row" className="bg-slate-50 px-4 py-4 font-bold text-slate-700">Objectif</th>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Explorer une voie liée à une compétence, une offre admissible ou un programme de travail.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Choisir un établissement, un programme et préparer l’admission puis le statut d’étudiant.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Préparer un court séjour pour tourisme, visite familiale, affaires ou motif autorisé.</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-slate-50 px-4 py-4 font-bold text-slate-700">Dossier à préparer</th>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">CV, expériences, compétences, justificatifs professionnels et, si nécessaire, éléments liés à une offre.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Passeport, diplômes, relevés, admission ou projet académique, ressources et justificatifs demandés.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Passeport, itinéraire, ressources, hébergement, assurance et justificatifs du motif du séjour.</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-slate-50 px-4 py-4 font-bold text-slate-700">Parcours 3M</th>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Compte → sélection du pays → évaluation → pièces et paiement selon le dossier → orientation vers les étapes admissibles.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Compte → choix de destination → évaluation → recherche de programme → admission et préparation du dossier.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Compte → motif et destination → checklist → réservation ou justificatifs → demande selon le consulat compétent.</td>
                </tr>
                <tr>
                  <th scope="row" className="bg-slate-50 px-4 py-4 font-bold text-slate-700">Repère important</th>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">Aucun emploi, contrat ou permis n’est garanti. Les agences et employeurs décident séparément.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">L’établissement décide de l’admission et l’autorité compétente décide du visa ou permis.</td>
                  <td className="border-l border-slate-200 px-4 py-4 leading-6 text-slate-600">La décision appartient au consulat ou à l’autorité compétente ; les réservations ne garantissent pas le visa.</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-blue-50">
                  <th scope="row" className="px-4 py-4 font-black text-blue-950">Commencer</th>
                  <td className="border-l border-blue-100 px-4 py-4"><Link href="/?project=travail#evaluation-multi" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Évaluer mon projet Travail</Link></td>
                  <td className="border-l border-blue-100 px-4 py-4"><Link href="/?project=etudes#evaluation-multi" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Évaluer mon projet Études</Link></td>
                  <td className="border-l border-blue-100 px-4 py-4"><Link href="/?project=tourisme#evaluation-multi" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">Évaluer mon projet Tourisme</Link></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Les documents, délais, frais et critères varient selon la destination, la nationalité, le motif et l’autorité compétente. Vérifiez toujours les exigences officielles avant dépôt.</p>
        </section>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher un pays, une région..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Type de Visa Tabs & Comparateur */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Tabs value={visaType} onValueChange={(v) => setVisaType(v as any)} className="w-full sm:w-auto flex-1">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100">
                  <TabsTrigger value="tous">Tous (107)</TabsTrigger>
                  <TabsTrigger value="travail">Travail (34)</TabsTrigger>
                  <TabsTrigger value="etudes">Études (22)</TabsTrigger>
                  <TabsTrigger value="visiteur">Visiteur (27)</TabsTrigger>
                </TabsList>
              </Tabs>
              <a href="/procedures/comparaison" className="w-full sm:w-auto shrink-0">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow flex items-center justify-center gap-2">
                  ⭐ Comparer mes favoris
                </Button>
              </a>
            </div>

            {/* Region Filter */}
            <div className="flex flex-wrap gap-2">
              <Filter className="w-5 h-5 text-slate-500 my-auto" />
              {REGIONS.map(region => (
                <motion.button
                  key={region}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </motion.button>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className="grid md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Salaire minimum (EUR)</label>
                <Input
                  type="range"
                  min="0"
                  max="7000"
                  step="100"
                  value={minSalaryFilter}
                  onChange={(e) => setMinSalaryFilter(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-600 mt-1">{minSalaryFilter}€/mois</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Coût max (EUR)</label>
                <Input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={maxCostFilter}
                  onChange={(e) => setMaxCostFilter(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-600 mt-1">{maxCostFilter}€</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Délai max (semaines)</label>
                <Input
                  type="range"
                  min="0"
                  max="52"
                  step="1"
                  value={maxTimeFilter}
                  onChange={(e) => setMaxTimeFilter(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-600 mt-1">{maxTimeFilter} semaines</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">Difficulté</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded border border-slate-200 text-sm bg-white"
                >
                  <option value="tous">Tous</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>
            </div>

            {/* Sort and Controls */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:border-blue-500 transition-colors"
                >
                  <option value="name">Trier par: Nom</option>
                  <option value="cost">Trier par: Coût</option>
                  <option value="time">Trier par: Délai</option>
                  <option value="salary">Trier par: Salaire</option>
                </select>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBudgetCalculator(!showBudgetCalculator)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showBudgetCalculator
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  Budget
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowComparison(!showComparison)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    showComparison
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Comparer ({selectedForComparison.length}/3)
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Budget Calculator */}
        <AnimatePresence>
          {showBudgetCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden border border-purple-200"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-purple-600" /> Calculateur de Budget
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-3">Sélectionner un pays</label>
                    <select
                      value={selectedCountryForBudget || ''}
                      onChange={(e) => setSelectedCountryForBudget(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    >
                      <option value="">-- Choisir un pays --</option>
                      {procedures107Complete.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-3">Frais de services 3M (EUR)</label>
                    <Input
                      type="number"
                      value={servicesFee}
                      onChange={(e) => setServicesFee(parseInt(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                </div>

                {selectedCountryBudget && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-white rounded-lg p-4 border-l-4 border-purple-600"
                  >
                    <h3 className="text-lg font-bold text-slate-900 mb-4">{selectedCountryBudget.flag} {selectedCountryBudget.name}</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-600 font-medium">Frais visa</p>
                        <p className="text-lg font-bold text-slate-900">{selectedCountryBudget.cost}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-600 font-medium">Frais documents</p>
                        <p className="text-lg font-bold text-slate-900">{selectedCountryBudget.totalCost}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-600 font-medium">Services 3M</p>
                        <p className="text-lg font-bold text-slate-900">{servicesFee}€</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-3 rounded border-2 border-purple-600">
                        <p className="text-xs text-purple-700 font-bold">COÛT TOTAL</p>
                        <p className="text-2xl font-bold text-purple-900">{calculateBudget(selectedCountryBudget)}€</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Table */}
        <AnimatePresence>
          {showComparison && comparisonCountries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-6 h-6" /> Tableau Comparatif
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-bold text-slate-900">Pays</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Région</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Type</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Délai</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Coût</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Salaire min</th>
                        <th className="text-center py-3 px-4 font-bold text-slate-900">Difficulté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonCountries.map((country, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {country.flag} {country.name}
                          </td>
                          <td className="text-center py-3 px-4 text-slate-600">{country.region}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline" className="capitalize">{country.visaType}</Badge>
                          </td>
                          <td className="text-center py-3 px-4 text-slate-600 font-medium">{country.processingTime}</td>
                          <td className="text-center py-3 px-4 text-slate-600 font-medium">{country.cost}</td>
                          <td className="text-center py-3 px-4 text-slate-600 font-medium">{country.minSalary || '-'}</td>
                          <td className="text-center py-3 px-4">
                            <Badge className={getDifficultyColor(country.difficulty)}>
                              {country.difficulty}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="mb-6 text-slate-600 font-medium">
          {filteredCountries.length} destination{filteredCountries.length !== 1 ? 's' : ''} trouvée{filteredCountries.length !== 1 ? 's' : ''}
          {selectedForComparison.length > 0 && ` • ${selectedForComparison.length} sélectionnée(s) pour comparaison`}
        </div>

        {/* Countries Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredCountries.map((country) => {
              const isExpanded = expandedCountry === country.id;
              const isSelected = selectedForComparison.includes(country.id);
              const destinationMedia = mediaByDestination.get(country.id);
              const procedureVisual = getProcedureVisualSources(country);
              const destinationDetail = getPublicDestinationDetail(country.id);
              const procedureImage = destinationMedia?.imageUrl ?? procedureVisual.desktop;
              const procedureMobileImage = destinationMedia?.imageUrl ? undefined : procedureVisual.mobile;
              const officialPortal = destinationDetail?.consular.officialPortalUrl;
              const officialPortalLabel = destinationDetail?.consular.officialPortalLabel ?? 'Portail institutionnel';
              const verifiedAt = destinationDetail?.consular.officialVerifiedAt ?? destinationDetail?.lastUpdatedAt;

              return (
                <motion.div
                  key={country.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                      isExpanded ? 'ring-2 ring-blue-500' : ''
                    } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {/* Card Header */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                      <picture className="absolute inset-0 block" aria-hidden="true">
                        {procedureMobileImage && (
                          <source media="(max-width: 767px)" srcSet={procedureMobileImage} type="image/webp" />
                        )}
                        <img
                          src={procedureImage}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover opacity-25"
                        />
                      </picture>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-800/90 via-blue-700/75 to-blue-600/50" />
                      <div className="relative z-10 flex items-center justify-between mb-3">
                        <Link href={getPublicDestinationPath(country.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700">
                          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-4xl">
                            {destinationMedia?.flagUrl ? <img src={destinationMedia.flagUrl} alt={`Drapeau de ${country.name}`} loading="lazy" decoding="async" className="h-full w-full object-contain" /> : country.flag}
                          </span>
                          <div>
                            <h3 className="text-xl font-bold hover:underline flex items-center gap-1.5">{country.name} ↗</h3>
                            <p className="text-blue-100 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {country.region} • Voir la page complète
                            </p>
                          </div>
                        </Link>
                        <div className="flex gap-2">
                          {showComparison && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComparison(country.id);
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              ✓
                            </button>
                          )}
                          <ChevronDown
                            className={`w-5 h-5 transition-transform cursor-pointer`}
                            onClick={() => setExpandedCountry(isExpanded ? null : country.id)}
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <p className="text-slate-700 text-sm font-medium">{country.description}</p>

                      {/* Quick Info */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Délai</p>
                          <p className="text-slate-900 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {country.processingTime}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Coût</p>
                          <p className="text-slate-900 font-bold flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {country.cost}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-500 font-medium">Difficulté</p>
                          <Badge className={`text-xs mt-1 ${getDifficultyColor(country.difficulty)}`}>
                            {country.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="flex flex-wrap gap-1">
                        {country.highlights.slice(0, 3).map((highlight, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Clock className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                          {verifiedAt ? `Dernière vérification : ${verifiedAt}` : 'Date de vérification à confirmer'}
                        </div>
                        {officialPortal ? (
                          <a
                            href={officialPortal}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-1 inline-flex items-center gap-1 font-bold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                          >
                            Source officielle : {officialPortalLabel} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : (
                          <p className="mt-1 text-amber-800">Source officielle en cours de vérification par l’administration.</p>
                        )}
                      </div>

                      {/* Buttons Container */}
                      <div className="space-y-2 pt-2">
                        <Link href={getPublicDestinationPath(country.id)} className="block">
                          <Button
                            variant="outline"
                            className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                          >
                            👁️ Détails de la procédure & Culture
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          {/* Launch Procedure Button */}
                          <Link href={getEvaluationHref(country)} className="flex-1">
                            <Button
                              className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg text-xs"
                              aria-label={`Préparer une évaluation ${visaChecklistLabels[country.visaType as keyof typeof visaChecklistLabels] ?? country.visaType} pour ${country.name}`}
                            >
                              🚀 Préparer mon dossier
                            </Button>
                          </Link>

                          {/* Download Button */}
                          {country.pdfUrl ? (
                            <a
                              href={getLocalizedPdfUrl(country, language)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1"
                            >
                              <Button
                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg text-xs"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </Button>
                            </a>
                          ) : (
                            <Button
                              disabled
                              title="Document en cours de préparation"
                              className="flex-1 bg-slate-100 text-slate-400 font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed text-xs"
                            >
                              <Download className="w-3.5 h-3.5" /> Bientôt
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-200 p-4 bg-slate-50 space-y-4 max-h-96 overflow-y-auto"
                        >
                          {/* Detailed Description */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2">📝 Description détaillée</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{country.detailedDescription}</p>
                          </div>

                          {/* Budget Info */}
                          {country.minSalary && (
                            <div className="bg-white p-3 rounded border border-slate-200">
                              <p className="text-xs font-semibold text-slate-700 mb-2">💰 Informations financières</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-slate-600">Salaire minimum</p>
                                  <p className="font-bold text-slate-900">{country.minSalary}</p>
                                </div>
                                <div>
                                  <p className="text-slate-600">Coût total estimé</p>
                                  <p className="font-bold text-slate-900">{country.totalCost}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Steps */}
                          <div>
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Étapes
                            </h4>
                            <ol className="space-y-1 text-sm text-slate-700">
                              {country.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="font-bold text-blue-600 flex-shrink-0">{idx + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredCountries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-slate-600">Aucune destination trouvée avec ces critères. Essayez d\'ajuster les filtres.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
