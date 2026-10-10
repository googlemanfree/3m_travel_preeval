import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PremiumReveal } from '@/components/PremiumReveal';
import { CheckCircle, Globe, FileText, Clock, Shield, Zap, ArrowRight, AlertCircle, CreditCard, Camera, Plane, MessageCircle, Search, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Link } from 'wouter';
import { PremiumCoverImage } from '@/components/PremiumCoverImage';
import ProofGallerySection from '@/components/ProofGallerySection';
import { getServiceVisual } from '@/data/premiumVisuals';
import { setPageSeo } from '@/lib/pageSeo';

type Continent = 'tous' | 'afrique' | 'asie' | 'ameriques' | 'europe';
type Status = 'evisa' | 'arrivee' | 'consulaire' | 'sans_visa' | 'conditionnel';

interface Destination {
  emoji: string;
  country: string;
  continent: Exclude<Continent, 'tous'>;
  status: Status;
  detail: string;
}

// Statuts vérifiés spécifiquement pour les titulaires d'un passeport camerounais
// (source : registres de politique de visa par nationalité, juillet 2026).
// À reconfirmer ponctuellement, les règles pouvant évoluer.
const destinations: Destination[] = [
  // ── eVisa réel et rapide ──────────────────────────────────────────────
  { emoji: '🇦🇪', country: 'Émirats Arabes Unis / Dubaï', continent: 'asie', status: 'evisa', detail: '30 à 90 jours, entrées simples ou multiples · délai 24-48h' },
  { emoji: '🇮🇳', country: 'Inde', continent: 'asie', status: 'evisa', detail: 'e-Tourist Visa 30j à 5 ans · délai 3-5 jours ouvrables' },
  { emoji: '🇻🇳', country: 'Viêt Nam', continent: 'asie', status: 'evisa', detail: "Jusqu'à 90 jours, entrées multiples · délai 3-5 jours ouvrables" },
  { emoji: '🇹🇭', country: 'Thaïlande', continent: 'asie', status: 'evisa', detail: "Jusqu'à 60 jours · délai 3-5 jours ouvrables" },
  { emoji: '🇶🇦', country: 'Qatar', continent: 'asie', status: 'evisa', detail: 'Visa touristique électronique · délai 24-48h' },
  { emoji: '🇺🇿', country: 'Ouzbékistan', continent: 'asie', status: 'evisa', detail: "30 jours · délai 2-3 jours ouvrables" },
  { emoji: '🇨🇮', country: "Côte d'Ivoire", continent: 'afrique', status: 'evisa', detail: '90 jours · délai 48-72h' },
  { emoji: '🇿🇲', country: 'Zambie', continent: 'afrique', status: 'evisa', detail: "e-Visa touristique · délai 3 jours ouvrables" },
  { emoji: '🇿🇼', country: 'Zimbabwe', continent: 'afrique', status: 'evisa', detail: "e-Visa touristique (KAZA Univisa possible avec la Zambie) · délai 3 jours ouvrables" },
  { emoji: '🇲🇩', country: 'Moldavie', continent: 'europe', status: 'evisa', detail: '90 jours · délai 3-5 jours ouvrables' },
  { emoji: '🇸🇷', country: 'Suriname', continent: 'ameriques', status: 'evisa', detail: "e-Tourist Card · délai 2-3 jours ouvrables" },

  // ── Visa à l'arrivée (assistance de préparation de dossier) ─────────
  { emoji: '🇹🇿', country: 'Tanzanie & Zanzibar', continent: 'afrique', status: 'arrivee', detail: "Délivré à l'arrivée à l'aéroport, dossier à préparer en amont" },
  { emoji: '🇪🇹', country: 'Éthiopie', continent: 'afrique', status: 'arrivee', detail: "Délivré à l'arrivée, préparation recommandée avant le vol" },
  { emoji: '🇹🇬', country: 'Togo', continent: 'afrique', status: 'arrivee', detail: "Délivré à l'arrivée à l'aéroport de Lomé" },
  { emoji: '🇲🇿', country: 'Mozambique', continent: 'afrique', status: 'arrivee', detail: "Délivré à l'arrivée" },
  { emoji: '🇲🇬', country: 'Madagascar', continent: 'afrique', status: 'arrivee', detail: "Délivré à l'arrivée" },
  { emoji: '🇨🇻', country: 'Cap-Vert', continent: 'afrique', status: 'arrivee', detail: "Autorisation EASE délivrée à l'arrivée" },
  { emoji: '🇰🇭', country: 'Cambodge', continent: 'asie', status: 'arrivee', detail: "Délivré à l'arrivée à l'aéroport" },

  // ── Sans visa nécessaire ──────────────────────────────────────────────
  { emoji: '🇰🇪', country: 'Kenya', continent: 'afrique', status: 'sans_visa', detail: "Aucun visa ni eTA requis pour un passeport camerounais" },
  { emoji: '🇷🇼', country: 'Rwanda', continent: 'afrique', status: 'sans_visa', detail: "Aucun visa requis pour un passeport camerounais" },
  { emoji: '🇬🇦', country: 'Gabon', continent: 'afrique', status: 'sans_visa', detail: "Aucun visa requis pour un passeport camerounais" },

  // ── Visa consulaire classique (accompagnement dossier complet) ──────
  { emoji: '🇪🇬', country: 'Égypte', continent: 'afrique', status: 'consulaire', detail: "Visa à demander auprès du consulat, pas d'eVisa pour ce passeport" },
  { emoji: '🇲🇦', country: 'Maroc', continent: 'afrique', status: 'conditionnel', detail: "eVisa possible seulement si vous détenez déjà un visa/titre de séjour Schengen, USA, UK, Canada ou équivalent. Sinon, visa consulaire classique." },
  { emoji: '🇹🇷', country: 'Turquie', continent: 'asie', status: 'conditionnel', detail: "eVisa possible seulement si vous détenez déjà un visa Schengen / USA / UK / Irlande valide. Sinon, visa consulaire classique." },
  { emoji: '🇸🇦', country: 'Arabie Saoudite', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique (hors Oumrah/Hajj organisés)" },
  { emoji: '🇮🇩', country: 'Indonésie / Bali', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇴🇲', country: 'Oman', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇯🇵', country: 'Japon', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇰🇷', country: 'Corée du Sud', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇱🇰', country: 'Sri Lanka', continent: 'asie', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇨🇦', country: 'Canada', continent: 'ameriques', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇺🇸', country: 'États-Unis', continent: 'ameriques', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇲🇽', country: 'Mexique', continent: 'ameriques', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇨🇺', country: 'Cuba', continent: 'ameriques', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇧🇷', country: 'Brésil', continent: 'ameriques', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇬🇧', country: 'Royaume-Uni', continent: 'europe', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇷🇺', country: 'Russie', continent: 'europe', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇦🇺', country: 'Australie', continent: 'europe', status: 'consulaire', detail: "Visa consulaire classique" },
  { emoji: '🇳🇿', country: 'Nouvelle-Zélande', continent: 'europe', status: 'consulaire', detail: "Visa consulaire classique" },
];

const statusConfig: Record<Status, { label: string; color: string; ring: string; tooltip?: string }> = {
  evisa: { label: '💻 eVisa disponible', color: 'bg-blue-100 text-blue-800', ring: 'border-blue-200' },
  arrivee: { label: "🛬 Visa à l'arrivée", color: 'bg-amber-100 text-amber-800', ring: 'border-amber-200' },
  consulaire: { label: '📋 Visa consulaire requis', color: 'bg-gray-200 text-gray-700', ring: 'border-gray-300' },
  sans_visa: { label: '✅ Sans visa', color: 'bg-green-100 text-green-800', ring: 'border-green-200' },
  conditionnel: { label: '⚠️ eVisa sous condition', color: 'bg-purple-100 text-purple-800', ring: 'border-purple-200', tooltip: 'eVisa disponible uniquement si vous détenez déjà un visa valide (Schengen, USA, UK, Canada, Irlande ou équivalent)' },
};

const continentLabels: Record<Continent, string> = {
  tous: '🌐 Tous',
  afrique: '🌍 Afrique',
  asie: '🌏 Asie & Moyen-Orient',
  ameriques: '🌎 Amériques',
  europe: '🇪🇺 Europe & Océanie',
};

export default function Evisa() {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState<Continent>('tous');
  const reduceMotion = useReducedMotion();
  const heroVisual = getServiceVisual('evisa');

  useEffect(() => {
    setPageSeo({
      title: 'Annuaire e-Visa | 3M TRAVEL AGENCY',
      description:
        'Vérifiez eVisa, visa à l’arrivée ou visa consulaire pour un passeport camerounais, et lancez votre démarche avec 3M TRAVEL AGENCY.',
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      if (continent !== 'tous' && d.continent !== continent) return false;
      if (search && !normalize(d.country).includes(normalize(search))) return false;
      return true;
    });
  }, [search, continent]);

  const requirements = [
    {
      icon: FileText,
      title: 'Passeport valide',
      detail: "Au moins 6 mois de validité à la date d'entrée dans le pays, avec au moins 2 pages vierges",
    },
    {
      icon: Camera,
      title: "Photo d'identité numérique",
      detail: "Photo récente, couleur, fond blanc uni, format JPG/PNG",
    },
    {
      icon: Plane,
      title: 'Billet aller-retour',
      detail: "Billet d'avion aller-retour ou réservation confirmée",
    },
    {
      icon: FileText,
      title: "Réservation d'hôtel ou lettre d'invitation",
      detail: "Preuve d'hébergement sur place, exigée par la plupart des pays",
    },
    {
      icon: CreditCard,
      title: 'Moyen de paiement',
      detail: 'Le prix exact vous est confirmé par notre équipe avant tout paiement',
    },
  ];

  const faqs = [
    {
      question: 'Pourquoi certains pays affichent "Visa consulaire requis" et pas "eVisa" ?',
      answer: "L'accès à l'eVisa dépend de votre nationalité. Pour un passeport camerounais, certains pays qui proposent un eVisa à d'autres nationalités exigent encore un visa classique déposé au consulat. Nous vous orientons vers le bon service selon votre cas.",
    },
    {
      question: 'Le prix affiché inclut-il tous les frais ?',
      answer: "Les prix indiqués couvrent notre accompagnement (vérification du dossier, saisie, suivi). Les frais officiels varient selon le pays — notre équipe vous confirme le montant total exact avant tout paiement.",
    },
    {
      question: 'Combien de temps avant mon départ dois-je faire ma demande ?',
      answer: "Nous recommandons de démarrer votre demande au moins 2 à 3 semaines avant votre date de voyage pour les eVisas, et 4 à 6 semaines pour un visa consulaire classique.",
    },
    {
      question: 'Que se passe-t-il si ma demande est refusée ?',
      answer: "Un refus par les autorités reste possible, comme pour toute demande de visa. Notre équipe vérifie votre dossier en amont pour limiter ce risque, mais les frais consulaires déjà engagés ne sont généralement pas remboursables.",
    },
    {
      question: "Mon pays de destination n'est pas dans la liste, que faire ?",
      answer: 'Contactez-nous directement sur WhatsApp avec votre destination : nous pouvons étudier votre demande au cas par cas, y compris pour des pays non listés ici.',
    },
  ];

  const whatsappBase = 'https://wa.me/237698104832?text=';

  function ctaFor(d: Destination) {
    if (d.status === 'evisa') {
      return (
        <Link href="/evisa-demande">
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors text-sm">
            Demander mon eVisa
          </button>
        </Link>
      );
    }
    if (d.status === 'arrivee') {
      const msg = encodeURIComponent(`Bonjour, je souhaite une assistance pour préparer mon visa à l'arrivée pour ${d.country}.`);
      return (
        <a href={`${whatsappBase}${msg}`} target="_blank" rel="noopener noreferrer">
          <button className="w-full py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-semibold transition-colors text-sm">
            Assistance visa à l'arrivée
          </button>
        </a>
      );
    }
    if (d.status === 'consulaire') {
      const msg = encodeURIComponent(`Bonjour, je souhaite être accompagné pour un visa consulaire pour ${d.country}.`);
      return (
        <a href={`${whatsappBase}${msg}`} target="_blank" rel="noopener noreferrer">
          <button className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors text-sm">
            Accompagnement visa classique
          </button>
        </a>
      );
    }
    if (d.status === 'conditionnel') {
      const msg = encodeURIComponent(`Bonjour, je souhaite vérifier mon éligibilité à l'eVisa pour ${d.country}.`);
      return (
        <a href={`${whatsappBase}${msg}`} target="_blank" rel="noopener noreferrer">
          <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors text-sm">
            Vérifier mon éligibilité
          </button>
        </a>
      );
    }
    return (
      <Link href="/flights">
        <button className="w-full py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 font-semibold transition-colors text-sm">
          Besoin d'un billet d'avion ?
        </button>
      </Link>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-white sm:px-6 sm:pb-20 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/92 via-[#0a3264]/80 to-[#0e5b9f]/55" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-blue-100">
              Annuaire e-Visa · 3M TRAVEL AGENCY
            </p>

            <h1 className="mb-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Annuaire des e-Visas & autorisations de voyage
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-center text-lg leading-8 text-blue-50 sm:text-xl">
              Vérifiez ce qu’il vous faut réellement pour voyager avec un passeport camerounais — eVisa, visa à l’arrivée ou visa consulaire classique — et lancez votre démarche avec notre accompagnement.
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-center text-base leading-7 text-blue-100/90">
              Informations vérifiées pour les titulaires d’un passeport camerounais. Les règles évoluent : nous confirmons toujours votre cas exact avant toute soumission.
            </p>

            <div className="relative max-w-xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tapez le nom d'un pays (ex: Dubaï, Inde, Kenya, Canada...)"
                maxLength={200}
                className="pl-12 py-6 text-base rounded-full border-0 bg-white shadow-md text-slate-900"
                aria-label="Rechercher un pays"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  type="button"
                  aria-label="Effacer la recherche"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(Object.keys(continentLabels) as Continent[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setContinent(c)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    continent === c
                      ? 'bg-white text-blue-950'
                      : 'bg-white/15 text-blue-50 ring-1 ring-white/25 hover:bg-white/25'
                  }`}
                  aria-pressed={continent === c}
                >
                  {continentLabels[c]}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legend */}
      <section className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-center text-sm">
          {(Object.keys(statusConfig) as Status[]).map((s) => (
            <span key={s} className={`px-3 py-1 rounded-full font-semibold ${statusConfig[s].color}`}>
              {statusConfig[s].label}
            </span>
          ))}
        </div>
      </section>

      {/* Destinations grid */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-gray-500 mb-4">Aucune destination ne correspond à votre recherche.</p>
                <a href={`${whatsappBase}${encodeURIComponent(`Bonjour, je cherche des informations e-Visa pour : ${search}`)}`} target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2">
                    <MessageCircle size={18} />
                    Demander sur WhatsApp
                  </button>
                </a>
              </motion.div>
            ) : (
              <motion.div
                key={continent + search}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((d, index) => (
                  <motion.div
                    key={d.country}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.24), duration: 0.35 }}
                  >
                    <Card className={`p-6 hover:shadow-lg transition-all duration-300 h-full flex flex-col border ${statusConfig[d.status].ring}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{d.emoji}</div>
                        <div className="relative group">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-help ${statusConfig[d.status].color}`}>
                            {statusConfig[d.status].label}
                          </span>
                          {statusConfig[d.status].tooltip && (
                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-10">
                              {statusConfig[d.status].tooltip}
                              <div className="absolute top-full right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-black text-slate-950">{d.country}</h3>
                      <p className="premium-copy mb-4 flex-1 text-[0.95rem]">{d.detail}</p>
                      {ctaFor(d)}
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="bg-blue-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <PremiumReveal>
            <h2 className="premium-section-title mb-4 text-center text-3xl">
              Pièces générales requises pour un e-Visa
            </h2>
            <p className="premium-section-lead mx-auto mb-12 text-center">
              La liste exacte dépend du pays et vous est confirmée par notre équipe — voici ce qui est presque toujours demandé.
            </p>
          </PremiumReveal>
          <div className="grid gap-6 md:grid-cols-2">
            {requirements.map((req, index) => {
              const Icon = req.icon;
              return (
                <PremiumReveal key={req.title} delay={Math.min(index * 0.05, 0.2)}>
                  <Card className="flex h-full gap-4 p-6 sm:p-7">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <Icon className="text-blue-700" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-1 font-black text-slate-950">{req.title}</h3>
                      <p className="premium-copy text-[0.95rem]">{req.detail}</p>
                    </div>
                  </Card>
                </PremiumReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guarantee block */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <PremiumReveal className="mx-auto max-w-4xl">
          <Card className="flex gap-4 border-l-4 border-blue-600 bg-blue-50 p-6 sm:p-7">
            <Shield className="shrink-0 text-blue-700" size={32} />
            <div>
              <h3 className="mb-2 font-black text-slate-950">Contrôle de conformité 3M TRAVEL AGENCY</h3>
              <p className="premium-copy text-[0.95rem]">
                Nos experts vérifient la qualité de votre scan de passeport, la conformité de votre photo et l’exactitude de vos dates avant la soumission officielle, afin de limiter tout risque de rejet.
              </p>
            </div>
          </Card>
        </PremiumReveal>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <PremiumReveal>
            <h2 className="premium-section-title mb-10 text-center text-3xl">
              Questions fréquentes
            </h2>
          </PremiumReveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="rounded-xl border border-slate-200 bg-white px-4">
                <AccordionTrigger className="text-left text-base font-bold text-slate-950">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="premium-copy text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <ProofGallerySection
        initialFilter="visas"
        lockFilter
        collapsedCount={3}
        hideWhenEmpty
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        titleFr="Preuves de visas et autorisations"
        titleEn="Proofs of visas and authorisations"
        leadFr="Extraits anonymisés obtenus avec l’accompagnement 3M pour des projets de voyage."
        leadEn="Redacted excerpts obtained with 3M support for travel projects."
      />

      {/* CTA Section */}
      <section className="bg-blue-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <PremiumReveal className="mx-auto max-w-4xl text-center">
          <h2 className="premium-section-title mb-6 text-3xl">
            Besoin d’un e-Visa ?
          </h2>
          <p className="premium-section-lead mx-auto mb-8 text-center text-lg">
            Trouvez votre destination ci-dessus, ou contactez-nous directement pour toute autre demande.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/evisa-demande">
              <motion.button
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-600 hover:shadow-xl sm:w-auto"
              >
                Commander mon eVisa
                <ArrowRight size={20} />
              </motion.button>
            </Link>
            <a href={`${whatsappBase}${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, j'ai une question sur le service eVisa.")}`} target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-emerald-500 bg-white px-8 py-4 text-lg font-bold text-emerald-700 transition hover:bg-emerald-50 sm:w-auto"
              >
                <MessageCircle size={20} />
                Poser une question
              </motion.button>
            </a>
          </div>
        </PremiumReveal>
      </section>
    </main>
  );
}
