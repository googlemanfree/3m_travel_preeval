import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Plane, BookOpen, User, Menu, X, Star, FolderOpen, Shield, Globe, Map,
  FileText, ChevronDown, Search, Download, Briefcase, GraduationCap,
  Camera, Home as HomeIcon, ArrowRight, Phone, Mail, MapPin
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface NavbarProps {
  onEvalClick?: () => void;
  activePage?: string;
}

// Mega-menu data
const SERVICES_MENU = [
  {
    category: "Visa Travail",
    icon: Briefcase,
    color: "text-blue-700 bg-blue-50",
    items: [
      { label: "Europe (Schengen)", href: "/procedures?type=travail&zone=europe", desc: "Allemagne, France, Luxembourg…" },
      { label: "Canada & USA", href: "/procedures?type=travail&zone=amerique", desc: "Permis de travail, Express Entry" },
      { label: "Golfe & Asie", href: "/procedures?type=travail&zone=golfe", desc: "Qatar, EAU, Malaisie…" },
      { label: "Afrique & Océanie", href: "/procedures?type=travail&zone=afrique", desc: "Australie, Nouvelle-Zélande…" },
    ],
  },
  {
    category: "Visa Études",
    icon: GraduationCap,
    color: "text-emerald-700 bg-emerald-50",
    items: [
      { label: "Europe (Schengen)", href: "/procedures?type=etudes&zone=europe", desc: "Belgique, Allemagne, Luxembourg…" },
      { label: "Canada", href: "/procedures?type=etudes&zone=canada", desc: "Permis d'études, CAQ" },
      { label: "Pays de l'Est", href: "/procedures?type=etudes&zone=est", desc: "Pologne, Roumanie, Hongrie…" },
      { label: "Arménie & Géorgie", href: "/procedures?type=etudes&zone=caucase", desc: "Voies alternatives" },
    ],
  },
  {
    category: "Visa Visiteur",
    icon: Camera,
    color: "text-amber-700 bg-amber-50",
    items: [
      { label: "Zone Schengen", href: "/procedures?type=visiteur&zone=schengen", desc: "Court séjour 90 jours" },
      { label: "Dubaï & Golfe", href: "/procedures?type=visiteur&zone=golfe", desc: "Visa tourisme" },
      { label: "Royaume-Uni", href: "/procedures?type=visiteur&zone=uk", desc: "Standard Visitor Visa" },
      { label: "Stratégie Arménie", href: "/fiches?type=Autre", desc: "Visa Schengen via Arménie" },
    ],
  },
  {
    category: "Immigration",
    icon: HomeIcon,
    color: "text-purple-700 bg-purple-50",
    items: [
      { label: "Résidence Permanente", href: "/procedures?type=immigration", desc: "Canada, Australie, NZ" },
      { label: "Regroupement familial", href: "/procedures?type=famille", desc: "Rejoindre un proche à l'étranger" },
      { label: "Fiches détaillées", href: "/fiches", desc: "95 procédures complètes" },
      { label: "Guides PDF", href: "/ressources", desc: "Télécharger les documents" },
    ],
  },
];

const DESTINATIONS_MENU = [
  { flag: "🇫🇷", name: "France", href: "/destinations?pays=france" },
  { flag: "🇩🇪", name: "Allemagne", href: "/destinations?pays=allemagne" },
  { flag: "🇱🇺", name: "Luxembourg", href: "/destinations?pays=luxembourg" },
  { flag: "🇧🇪", name: "Belgique", href: "/destinations?pays=belgique" },
  { flag: "🇨🇦", name: "Canada", href: "/destinations?pays=canada" },
  { flag: "🇮🇹", name: "Italie", href: "/destinations?pays=italie" },
  { flag: "🇵🇹", name: "Portugal", href: "/destinations?pays=portugal" },
  { flag: "🇦🇺", name: "Australie", href: "/destinations?pays=australie" },
  { flag: "🇦🇪", name: "Dubaï", href: "/destinations?pays=dubai" },
  { flag: "🇬🇧", name: "Royaume-Uni", href: "/destinations?pays=uk" },
];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return { open, setOpen, ref };
}

export default function Navbar({ onEvalClick, activePage }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileDestOpen, setMobileDestOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const services = useDropdown();
  const destinations = useDropdown();
  const ressources = useDropdown();

  const active = activePage ?? (
    location === "/" ? "home" :
    location.startsWith("/vols") || location.startsWith("/flights") ? "flights" :
    location.startsWith("/procedures") ? "procedures" :
    location.startsWith("/visa-types") ? "visa-types" :
    location.startsWith("/destinations") ? "destinations" :
    location.startsWith("/guide") ? "guide" :
    location.startsWith("/fiches") ? "fiches" :
    location.startsWith("/ressources") ? "ressources" :
    location.startsWith("/mon-dossier") ? "mon-dossier" :
    location.startsWith("/dashboard") ? "dashboard" : undefined
  );

  const linkClass = (page: string) =>
    `text-[15px] font-bold transition-colors duration-150 ${
      active === page
        ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
        : "text-gray-700 hover:text-blue-700"
    }`;

  const dropdownBtnClass = (pages: string[]) =>
    `text-[15px] font-bold transition-colors duration-150 flex items-center gap-1 ${
      pages.includes(active ?? "")
        ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
        : "text-gray-700 hover:text-blue-700"
    }`;

  // Search suggestions (simple)
  const suggestions = searchQuery.length >= 2 ? [
    { label: `Visa travail ${searchQuery}`, href: `/procedures?q=${searchQuery}` },
    { label: `Visa études ${searchQuery}`, href: `/procedures?q=${searchQuery}&type=etudes` },
    { label: `Fiche ${searchQuery}`, href: `/fiches?q=${searchQuery}` },
  ] : [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 min-w-0 group">
          <div className="relative flex-shrink-0">
            <img
              src={LOGO_URL}
              alt="3M Travel & Services"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-300 shadow-md group-hover:ring-blue-500 transition-all duration-200 flex-shrink-0"
              onError={e => {
                const t = e.target as HTMLImageElement;
                t.style.display = "none";
                const fallback = t.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 items-center justify-center text-white font-black text-base flex-shrink-0 shadow-md" style={{ display: "none" }}>3M</div>
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="font-black text-blue-900 text-base leading-tight tracking-tight truncate">3M Travel & Services</div>
            <div className="text-xs text-blue-500 font-semibold tracking-wide truncate uppercase">Votre mobilité, notre expertise</div>
          </div>
        </Link>

        {/* ── Nav desktop ── */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/" className={linkClass("home")}>Accueil</Link>

          {/* Menu Services */}
          <div ref={services.ref} className="relative"
            onMouseEnter={() => services.setOpen(true)}
            onMouseLeave={() => services.setOpen(false)}
          >
            <button className={dropdownBtnClass(["procedures", "visa-types", "fiches"])}>
              <Briefcase className="w-3.5 h-3.5" />
              Services
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${services.open ? "rotate-180" : ""}`} />
            </button>

            {services.open && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] bg-white border border-blue-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ animation: "fadeInScale 150ms cubic-bezier(0.23,1,0.32,1)" }}>
                <div className="grid grid-cols-4 gap-0 p-4">
                  {SERVICES_MENU.map((cat) => (
                    <div key={cat.category} className="px-3">
                      <div className={`flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg ${cat.color} w-fit`}>
                        <cat.icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{cat.category}</span>
                      </div>
                      <ul className="space-y-1">
                        {cat.items.map((item) => (
                          <li key={item.href}>
                            <Link href={item.href}
                              onClick={() => services.setOpen(false)}
                              className="block px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors group">
                              <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">{item.label}</div>
                              <div className="text-xs text-gray-400 leading-tight">{item.desc}</div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 bg-blue-50 px-6 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Voir toutes les procédures →</span>
                  <Link href="/procedures" onClick={() => services.setOpen(false)}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Toutes les procédures
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Menu Destinations */}
          <div ref={destinations.ref} className="relative"
            onMouseEnter={() => destinations.setOpen(true)}
            onMouseLeave={() => destinations.setOpen(false)}
          >
            <button className={dropdownBtnClass(["destinations"])}>
              <Globe className="w-3.5 h-3.5" />
              Destinations
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${destinations.open ? "rotate-180" : ""}`} />
            </button>

            {destinations.open && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-blue-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                style={{ animation: "fadeInScale 150ms cubic-bezier(0.23,1,0.32,1)" }}>
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Destinations populaires</p>
                  <div className="grid grid-cols-2 gap-1">
                    {DESTINATIONS_MENU.map((d) => (
                      <Link key={d.href} href={d.href}
                        onClick={() => destinations.setOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
                        <span className="text-lg leading-none">{d.flag}</span>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">{d.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-100 bg-blue-50 px-4 py-2.5">
                  <Link href="/destinations" onClick={() => destinations.setOpen(false)}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
                    <Map className="w-3.5 h-3.5" /> Toutes les destinations <ArrowRight className="w-3 h-3 ml-auto" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Vols */}
          <Link href="/vols" className={linkClass("flights")}>
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Vols</span>
          </Link>

          {/* Menu Ressources */}
          <div ref={ressources.ref} className="relative"
            onMouseEnter={() => ressources.setOpen(true)}
            onMouseLeave={() => ressources.setOpen(false)}
          >
            <button className={dropdownBtnClass(["guide", "fiches", "ressources"])}>
              <BookOpen className="w-3.5 h-3.5" />
              Ressources
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${ressources.open ? "rotate-180" : ""}`} />
            </button>

            {ressources.open && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-blue-100 rounded-2xl shadow-2xl z-50 py-2"
                style={{ animation: "fadeInScale 150ms cubic-bezier(0.23,1,0.32,1)" }}>
                <Link href="/services" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Nos Tarifs & Services
                </Link>
                <Link href="/passeport" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Globe className="w-4 h-4 text-blue-500" /> Index Passeport
                </Link>
                <Link href="/guide" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Guide Complet
                </Link>
                <Link href="/fiches" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FileText className="w-4 h-4 text-blue-500" /> Fiches par pays
                </Link>
                <Link href="/visa-types" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FileText className="w-4 h-4 text-blue-500" /> Types de Visa
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <Link href="/ressources" onClick={() => ressources.setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4 text-blue-600" /> Télécharger les PDFs
                </Link>
              </div>
            )}
          </div>

          <Link href="/mon-dossier" className={linkClass("mon-dossier")}>
            <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" />Mon dossier</span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className="text-sm font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors">
              <Shield className="w-3.5 h-3.5" />Admin
            </Link>
          )}
        </nav>

        {/* ── Actions desktop ── */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {/* Recherche globale */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-700 transition-colors"
              aria-label="Rechercher"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-blue-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rechercher un visa, pays, procédure…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          <Search className="w-3.5 h-3.5 text-gray-400" />
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.length >= 2 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Aucun résultat pour "{searchQuery}"</p>
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recherches populaires</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Visa travail Canada", "Visa Schengen", "Études Luxembourg", "Visa Dubaï"].map(q => (
                        <button key={q} onClick={() => setSearchQuery(q)}
                          className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {onEvalClick && (
            <Button onClick={onEvalClick} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[15px] px-5 py-2.5 h-10 shadow-md rounded-xl">
              <Star className="w-4 h-4 mr-1.5" />Évaluation gratuite
            </Button>
          )}
          <Link href="/open-dossier">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-[15px] px-5 py-2.5 h-10 shadow-md rounded-xl">
              <FolderOpen className="w-4 h-4 mr-1.5" />Ouvrir un dossier
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold text-[15px] px-5 py-2.5 h-10 rounded-xl">
              <User className="w-4 h-4 mr-1.5" />Mon Espace
            </Button>
          </Link>
        </div>

        {/* ── Mobile: search + burger ── */}
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile search bar ── */}
      {searchOpen && (
        <div className="lg:hidden border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher un visa, pays, procédure…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-blue-100 px-4 py-4 flex flex-col gap-1 shadow-lg max-h-[80vh] overflow-y-auto">
          <Link href="/" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5 border-b border-gray-100">
            Accueil
          </Link>

          {/* Services accordion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5"
            >
              <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-600" /> Services</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileServicesOpen && (
              <div className="pb-2 pl-4 space-y-1">
                {SERVICES_MENU.map(cat => (
                  <div key={cat.category}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider py-1">{cat.category}</p>
                    {cat.items.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                        className="block text-sm text-gray-600 hover:text-blue-700 py-1.5 pl-2">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destinations accordion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setMobileDestOpen(!mobileDestOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5"
            >
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600" /> Destinations</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileDestOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileDestOpen && (
              <div className="pb-2 pl-4 grid grid-cols-2 gap-1">
                {DESTINATIONS_MENU.map(d => (
                  <Link key={d.href} href={d.href} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 py-1.5">
                    <span>{d.flag}</span> {d.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/vols" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5 border-b border-gray-100">
            <Plane className="w-4 h-4 text-blue-600" /> Vols
          </Link>
          <Link href="/guide" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5 border-b border-gray-100">
            <BookOpen className="w-4 h-4 text-blue-600" /> Guide Complet
          </Link>
          <Link href="/fiches" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5 border-b border-gray-100">
            <FileText className="w-4 h-4 text-blue-600" /> Fiches par pays
          </Link>
          <Link href="/ressources" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2.5 border-b border-gray-100">
            <Download className="w-4 h-4" /> Télécharger les PDFs
          </Link>
          <Link href="/mon-dossier" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2.5 border-b border-gray-100">
            <Search className="w-4 h-4 text-blue-600" /> Suivre mon dossier
          </Link>
          <Link href="/open-dossier" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2.5 border-b border-gray-100">
            <FolderOpen className="w-4 h-4" /> Ouvrir un dossier
          </Link>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2.5 border-b border-gray-100">
            <User className="w-4 h-4" /> Mon Espace
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2.5 border-b border-gray-100">
              <Shield className="w-4 h-4" /> Administration
            </Link>
          )}
          {onEvalClick && (
            <Button onClick={() => { setMobileOpen(false); onEvalClick(); }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold mt-2">
              <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
            </Button>
          )}
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1)    translateY(0);   }
        }
      `}</style>
    </header>
  );
}
