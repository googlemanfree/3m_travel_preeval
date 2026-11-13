import React, { useEffect, useRef, useState } from "react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { prefetchNavigation } from "@/lib/navigationCache";
import { notifyNavigationStart } from "./NavigationProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import {
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  FolderKanban,
  Globe2,
  Home,
  MapPin,
  Languages,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  Plane,
  Search,
  ShoppingBag,
  Smartphone,
  Star,
  UsersRound,
  UserRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMultiServiceCart } from "@/contexts/MultiServiceCartContext";

type NavCopy = { fr: string; en: string };

const menuItems: {
  href: string;
  label: NavCopy;
  icon: LucideIcon;
  highlight?: boolean;
}[] = [
  { href: "/", label: { fr: "Accueil", en: "Home" }, icon: Home },
  {
    href: "/flights",
    label: { fr: "3M Booking", en: "3M Booking" },
    icon: Plane,
  },
  {
    href: "/procedures",
    label: { fr: "Procédures", en: "Procedures" },
    icon: BookOpen,
  },
  {
    href: "/destinations",
    label: { fr: "Destinations", en: "Destinations" },
    icon: MapPin,
  },
  {
    href: "/ressources",
    label: { fr: "Ressources", en: "Resources" },
    icon: Globe2,
  },
  {
    href: "/guide-procedures",
    label: { fr: "Guide PDF", en: "PDF guide" },
    icon: FileText,
  },
  {
    href: "/?project=travail#evaluation-multi",
    label: { fr: "Évaluation rapide", en: "Quick assessment" },
    icon: Zap,
  },
  {
    href: "/evisas",
    label: { fr: "E-Visa", en: "e-Visa" },
    icon: Smartphone,
    highlight: true,
  },
  {
    href: "/3m-solutions",
    label: { fr: "3M Solutions", en: "3M Solutions" },
    icon: UsersRound,
  },
  {
    href: "/partenaires",
    label: { fr: "Entreprises & partenaires", en: "Companies & partners" },
    icon: Building2,
  },
];

const destinationQuickLinks: { href: string; label: NavCopy }[] = [
  {
    href: "/destinations?search=Canada",
    label: { fr: "Canada", en: "Canada" },
  },
  {
    href: "/destinations?search=France",
    label: { fr: "France", en: "France" },
  },
  {
    href: "/destinations?search=Luxembourg",
    label: { fr: "Luxembourg", en: "Luxembourg" },
  },
  { href: "/destinations?search=Japon", label: { fr: "Japon", en: "Japan" } },
  {
    href: "/destinations?search=Allemagne",
    label: { fr: "Allemagne", en: "Germany" },
  },
];

const NAV_COPY = {
  mainNav: { fr: "Navigation principale", en: "Main navigation" },
  mobileNav: { fr: "Navigation mobile", en: "Mobile navigation" },
  languageGroup: { fr: "Sélection de langue", en: "Language selector" },
  cart: { fr: "Panier multi-services", en: "Multi-service cart" },
  empty: { fr: "vide", en: "empty" },
  item: { fr: "élément", en: "item" },
  items: { fr: "éléments", en: "items" },
  account: { fr: "Se connecter", en: "Sign in" },
  register: { fr: "Inscription", en: "Sign up" },
  accountSpace: { fr: "Espace Candidat", en: "Candidate space" },
  accountDashboard: { fr: "Tableau de bord / Dossier", en: "Dashboard / Case" },
  newAssessment: { fr: "Nouvelle évaluation", en: "New assessment" },
  logout: { fr: "Se déconnecter", en: "Sign out" },
  openAccount: { fr: "Ouvrir le menu du compte", en: "Open account menu" },
  openSpace: { fr: "Ouvrir mon espace", en: "Open my space" },
  connected: { fr: "Connecté", en: "Signed in" },
  evaluate: { fr: "Évaluer mon profil", en: "Assess my profile" },
  evaluateHint: {
    fr: "Compte gratuit, puis dépôt du CV",
    en: "Free account, then CV upload",
  },
  openMenu: { fr: "Ouvrir le menu", en: "Open menu" },
  closeMenu: { fr: "Fermer le menu", en: "Close menu" },
  searchDestinations: {
    fr: "Rechercher une destination ou une procédure",
    en: "Search a destination or procedure",
  },
  searchPlaceholder: {
    fr: "Canada, France, visa travail…",
    en: "Canada, France, work visa…",
  },
  searchSubmit: { fr: "Lancer la recherche", en: "Run search" },
  searchResults: { fr: "Résultats de navigation", en: "Navigation results" },
  recentSearches: { fr: "Recherches récentes", en: "Recent searches" },
  popularDestinations: {
    fr: "Destinations populaires",
    en: "Popular destinations",
  },
  searchEmpty: { fr: "Aucun lien correspondant", en: "No matching link" },
} satisfies Record<string, NavCopy>;

const nativeLinkClass = (highlight?: boolean) =>
  highlight
    ? "min-h-11 w-auto shrink-0 justify-start px-1.5 py-2.5 text-[12px] xl:text-[13px] font-black xl:px-2 text-white bg-gradient-to-r from-[#c39231] to-[#e8c56f] hover:from-[#b1832b] hover:to-[#d5a84b] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md inline-flex items-center gap-1 whitespace-nowrap 2xl:w-auto 2xl:justify-start 2xl:px-3"
    : "min-h-11 w-auto shrink-0 justify-start px-1.5 py-2.5 text-[12px] xl:text-[13px] font-bold xl:px-2 text-slate-900 hover:text-[#0a2b5c] hover:bg-white rounded-xl transition-all duration-200 shadow-none hover:shadow-sm inline-flex items-center gap-1 whitespace-nowrap 2xl:w-auto 2xl:justify-start 2xl:px-3";

const authButtonClass =
  "inline-flex h-12 w-[104px] xl:w-[132px] items-center justify-center rounded-xl px-3 text-center text-sm font-black transition-all duration-200 active:scale-95 whitespace-nowrap";
const mobileAuthButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-bold transition-all duration-200";

export default function Navbar() {
  const { candidate, logout } = useCandidateAuth();
  const { language, setLanguage } = useLanguage();
  // Sous 480 px, le sélecteur de langue n’affiche que « FR » / « EN » : sinon le bouton du menu sort de l’écran.
  const [compactLanguage, setCompactLanguage] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 479px)");
    const sync = () => setCompactLanguage(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const copy = (value: NavCopy) => value[language];
  const { totalItems } = useMultiServiceCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [searchShortcutActive, setSearchShortcutActive] = useState(false);
  const [recentSearchHrefs, setRecentSearchHrefs] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // En-tête qui se resserre dès qu'on quitte le haut de page (seuil avec hystérésis : pas de scintillement).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(previous =>
        previous ? window.scrollY > 4 : window.scrollY > 48
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const desktopNavSearchRef = useRef<HTMLInputElement>(null);
  const mobileNavSearchRef = useRef<HTMLInputElement>(null);

  const getInitial = (name: string | undefined) =>
    name ? name.charAt(0).toUpperCase() : "C";

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    // Les liens utilisent la navigation native ; ce repli est réservé à la
    // déconnexion, qui est une mutation et non une destination de page.
    window.location.assign("/");
  };

  const hamburgerVariants = {
    open: { rotate: 90 },
    closed: { rotate: 0 },
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  const closeMenu = () => setIsMenuOpen(false);
  const closeProfile = () => setIsProfileOpen(false);
  const handleNavigationIntent = (href: string) => prefetchNavigation(href);
  const handleNavigationClick = () => notifyNavigationStart();
  const normalizedSearch = menuSearch.trim().toLocaleLowerCase();
  const filteredMenuItems = normalizedSearch
    ? menuItems.filter(item =>
        `${item.label.fr} ${item.label.en}`
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      )
    : menuItems;
  const matchingDestinations = normalizedSearch
    ? destinationQuickLinks.filter(item =>
        `${item.label.fr} ${item.label.en}`
          .toLocaleLowerCase()
          .includes(normalizedSearch)
      )
    : destinationQuickLinks;
  const recentDestinations = recentSearchHrefs.map(href => {
    const knownDestination = destinationQuickLinks.find(
      item => item.href === href
    );
    if (knownDestination) return knownDestination;
    const encodedTerm = href.match(/[?&]search=([^&]+)/)?.[1];
    const term = encodedTerm
      ? decodeURIComponent(encodedTerm.replace(/\+/g, " "))
      : href;
    return { href, label: { fr: term, en: term } };
  });
  const suggestionDestinations = normalizedSearch
    ? matchingDestinations
    : [
        ...recentDestinations,
        ...destinationQuickLinks.filter(
          item => !recentSearchHrefs.includes(item.href)
        ),
      ];
  const desktopMenuItems = filteredMenuItems.filter(
    item => item.href !== "/evisas"
  );
  const searchSuggestions = suggestionDestinations.slice(0, 5);
  const desktopSuggestions = suggestionDestinations.slice(0, 5);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        "3m-recent-destination-searches"
      );
      if (stored) setRecentSearchHrefs(JSON.parse(stored));
    } catch {
      // Le header reste utilisable si le stockage local est indisponible.
    }
  }, []);

  const rememberSearch = (href: string) => {
    setRecentSearchHrefs(previous => {
      const next = [href, ...previous.filter(item => item !== href)].slice(
        0,
        5
      );
      try {
        window.localStorage.setItem(
          "3m-recent-destination-searches",
          JSON.stringify(next)
        );
      } catch {
        // Le stockage local peut être bloqué par le navigateur.
      }
      return next;
    });
  };

  const selectSuggestion = (href: string) => {
    rememberSearch(href);
    handleNavigationClick();
    window.location.assign(href);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    suggestions: typeof searchSuggestions
  ) => {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex(index => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex(index =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestionIndex].href);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = menuSearch.trim();
    if (!term) return;
    selectSuggestion(`/destinations?search=${encodeURIComponent(term)}`);
  };

  const focusSearchFromShortcut = () => {
    setSearchShortcutActive(true);
    window.setTimeout(() => setSearchShortcutActive(false), 650);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      desktopNavSearchRef.current?.focus();
      return;
    }
    setIsMenuOpen(true);
    window.requestAnimationFrame(() => mobileNavSearchRef.current?.focus());
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeMenu();
      closeProfile();
      if (isMenuOpen) menuTriggerRef.current?.focus();
      if (isProfileOpen) profileTriggerRef.current?.focus();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen, isProfileOpen]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']"))
        return;
      event.preventDefault();
      focusSearchFromShortcut();
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  return (
    <header
      data-testid="site-header"
      data-scrolled={scrolled ? "true" : "false"}
      className="glass-nav premium-header tablet-compact-header sticky top-0 z-50 transition-all duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-nowrap items-center gap-x-2 py-2.5 sm:gap-x-3 sm:py-3 lg:flex-wrap lg:gap-x-4 lg:gap-y-2">
          <a
            href="/"
            onMouseEnter={() => handleNavigationIntent("/")}
            onFocus={() => handleNavigationIntent("/")}
            onClick={handleNavigationClick}
            className="group order-1 flex shrink-0 items-center justify-start gap-2 rounded-xl transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:gap-3"
            data-testid="navbar-brand-wordmark"
          >
            <img
              src="/logo-3m.webp"
              alt=""
              aria-hidden="true"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
              className={`h-10 w-10 origin-center object-contain transition-[opacity,transform,filter] duration-300 ease-out motion-reduce:transition-none sm:h-12 sm:w-12 ${logoLoaded ? "opacity-100 blur-0" : "opacity-0 blur-[3px]"} group-hover:scale-105 group-focus-visible:scale-105 motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100`}
            />
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="font-[family-name:Sora,Manrope,sans-serif] text-sm font-extrabold tracking-tight text-[#071b3d] sm:text-base">
                3M TRAVEL
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700/80">
                Agency
              </span>
            </span>
            <span className="sr-only">3M TRAVEL AGENCY</span>
          </a>

          <form
            action="/destinations"
            method="get"
            onSubmit={handleSearchSubmit}
            className={`relative order-2 hidden min-w-0 max-w-[24rem] flex-1 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-1.5 transition duration-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200 md:flex ${searchShortcutActive ? "scale-[1.02] border-[#c39231] shadow-[0_0_0_5px_rgba(195,146,49,0.18)]" : "shadow-sm"}`}
          >
            <Search
              className="h-4 w-4 shrink-0 text-blue-700"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="desktop-nav-search">
              {copy(NAV_COPY.searchDestinations)}
            </label>
            <input
              ref={desktopNavSearchRef}
              id="desktop-nav-search"
              name="search"
              value={menuSearch}
              onChange={event => {
                setMenuSearch(event.target.value);
                setActiveSuggestionIndex(-1);
              }}
              onKeyDown={event =>
                handleSearchKeyDown(event, desktopSuggestions)
              }
              onFocus={() => {
                setIsDesktopSearchFocused(true);
                setActiveSuggestionIndex(-1);
              }}
              onBlur={() =>
                window.setTimeout(() => setIsDesktopSearchFocused(false), 120)
              }
              placeholder={copy(NAV_COPY.searchPlaceholder)}
              aria-keyshortcuts="/"
              aria-controls={isDesktopSearchFocused ? "desktop-nav-suggestions" : undefined}
              aria-activedescendant={
                activeSuggestionIndex >= 0
                  ? `desktop-nav-suggestion-${activeSuggestionIndex}`
                  : undefined
              }
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-black text-blue-700 xl:inline">
              /
            </kbd>
            <button
              type="submit"
              aria-label={copy(NAV_COPY.searchSubmit)}
              className="touch-target inline-flex h-9 min-h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            {isDesktopSearchFocused && (
              <div
                role="listbox"
                id="desktop-nav-suggestions"
                aria-label={copy(NAV_COPY.searchResults)}
                className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[60] rounded-2xl border border-blue-100 bg-white/98 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <p className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  {menuSearch
                    ? copy(NAV_COPY.searchResults)
                    : recentDestinations.length
                      ? copy(NAV_COPY.recentSearches)
                      : copy(NAV_COPY.popularDestinations)}
                </p>
                {desktopSuggestions.map((item, index) => (
                  <a
                    key={item.href}
                    id={`desktop-nav-suggestion-${index}`}
                    role="option"
                    aria-selected={activeSuggestionIndex === index}
                    href={item.href}
                    onMouseDown={event => event.preventDefault()}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={() => {
                      rememberSearch(item.href);
                      handleNavigationClick();
                    }}
                    className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition duration-150 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-800 active:scale-[0.98] ${activeSuggestionIndex === index ? "bg-blue-50 text-blue-800 ring-1 ring-blue-200" : ""}`}
                  >
                    <span>{copy(item.label)}</span>
                    <MapPin
                      className="h-4 w-4 text-blue-500"
                      aria-hidden="true"
                    />
                  </a>
                ))}
                {!desktopSuggestions.length && (
                  <span className="block px-2 py-2 text-sm font-semibold text-slate-500">
                    {copy(NAV_COPY.searchEmpty)}
                  </span>
                )}
              </div>
            )}
          </form>

          <nav
            aria-label={copy(NAV_COPY.mainNav)}
            className="order-4 hidden min-w-0 basis-full items-center justify-between gap-0.5 overflow-x-auto rounded-2xl border border-gray-100/80 bg-gray-50/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex"
          >
            {desktopMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => handleNavigationIntent(item.href)}
                  onFocus={() => handleNavigationIntent(item.href)}
                  onClick={handleNavigationClick}
                  aria-label={copy(item.label)}
                  title={copy(item.label)}
                  className={nativeLinkClass(item.highlight)}
                >
                  <Icon
                    className="hidden h-[18px] w-[18px] shrink-0 xl:block"
                    aria-hidden="true"
                  />
                  <span className="inline">{copy(item.label)}</span>
                </a>
              );
            })}
          </nav>

          <div className="order-3 ml-auto hidden flex-wrap items-center justify-end gap-1.5 lg:flex">
            <a
              href="/evisas"
              onMouseEnter={() => handleNavigationIntent("/evisas")}
              onFocus={() => handleNavigationIntent("/evisas")}
              onClick={handleNavigationClick}
              aria-label={copy({ fr: "E-Visa", en: "e-Visa" })}
              className="group inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b98525] via-[#d5a84b] to-[#f0d88f] px-3 text-sm font-black text-white shadow-[0_8px_18px_-10px_rgba(195,146,49,0.85)] ring-1 ring-[#f4dc9c]/70 transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:from-[#9f6f16] hover:via-[#c39231] hover:to-[#e8c56f] hover:shadow-[0_12px_24px_-10px_rgba(159,111,22,0.9)] focus-visible:ring-2 focus-visible:ring-[#c39231] active:scale-[0.98]"
            >
              <Smartphone
                className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6"
                aria-hidden="true"
              />{" "}
              E-Visa
            </a>
            <a
              href="/panier"
              onMouseEnter={() => handleNavigationIntent("/panier")}
              onFocus={() => handleNavigationIntent("/panier")}
              onClick={handleNavigationClick}
              aria-label={`${copy(NAV_COPY.cart)}${totalItems ? `, ${totalItems} ${copy(totalItems > 1 ? NAV_COPY.items : NAV_COPY.item)}` : ` ${copy(NAV_COPY.empty)}`}`}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 text-blue-700 transition hover:bg-blue-100"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-700 px-1 text-[10px] font-black text-white">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </a>
            <label
              className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-blue-200/60 bg-blue-50 px-2.5 text-sm font-black text-blue-900 transition hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 dark:border-blue-900/40 dark:bg-slate-800 dark:text-blue-100"
              title={copy(NAV_COPY.languageGroup)}
            >
              <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">{copy(NAV_COPY.languageGroup)}</span>
              <select
                value={language}
                onChange={event =>
                  setLanguage(event.target.value as "fr" | "en")
                }
                aria-label={copy(NAV_COPY.languageGroup)}
                className="min-h-10 cursor-pointer appearance-none bg-transparent pr-1 outline-none"
              >
                <option value="fr">FR · Français</option>
                <option value="en">EN · English</option>
              </select>
            </label>
            <ThemeToggle />
            {candidate ? (
              <div className="relative flex items-center gap-1">
                <a
                  href="/mon-espace"
                  onMouseEnter={() => handleNavigationIntent("/mon-espace")}
                  onFocus={() => handleNavigationIntent("/mon-espace")}
                  onClick={() => {
                    handleNavigationClick();
                    closeProfile();
                  }}
                  aria-label={`${copy(NAV_COPY.openSpace)} : ${candidate.fullName || copy(NAV_COPY.accountSpace)}`}
                  className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-slate-50 to-blue-50/50 p-1.5 pr-3 transition-all duration-200 hover:from-blue-50 hover:to-indigo-50 hover:shadow"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
                    {getInitial(candidate.fullName)}
                  </div>
                  <div className="text-left">
                    <span className="block max-w-[120px] truncate text-sm font-bold text-[#0a2540]">
                      {candidate.fullName || copy(NAV_COPY.accountSpace)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                      {copy(NAV_COPY.connected)}
                    </span>
                  </div>
                </a>
                <button
                  type="button"
                  aria-label={copy(NAV_COPY.openAccount)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileOpen(open => !open)}
                  aria-controls="candidate-account-menu"
                  ref={profileTriggerRef}
                  className="touch-target rounded-xl p-2 text-gray-500 transition hover:bg-blue-50 hover:text-[#0b2f6f]"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isProfileOpen && (
                  <div
                    id="candidate-account-menu"
                    className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    role="menu"
                  >
                    <div className="p-3 bg-slate-50/80 rounded-2xl mb-1 border border-gray-100/60">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                        {copy(NAV_COPY.accountSpace)}
                      </p>
                      <p className="text-sm font-bold text-[#0a2540] truncate mt-0.5">
                        {candidate.email}
                      </p>
                    </div>
                    <a
                      href="/mon-espace"
                      onMouseEnter={() => handleNavigationIntent("/mon-espace")}
                      onFocus={() => handleNavigationIntent("/mon-espace")}
                      onClick={() => {
                        handleNavigationClick();
                        closeProfile();
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                      role="menuitem"
                    >
                      <FolderKanban className="h-4 w-4" aria-hidden="true" />{" "}
                      {copy(NAV_COPY.accountDashboard)}
                    </a>
                    <a
                      href="/evaluation"
                      onMouseEnter={() => handleNavigationIntent("/evaluation")}
                      onFocus={() => handleNavigationIntent("/evaluation")}
                      onClick={() => {
                        handleNavigationClick();
                        closeProfile();
                      }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                      role="menuitem"
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />{" "}
                      {copy(NAV_COPY.newAssessment)}
                    </a>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />{" "}
                      {copy(NAV_COPY.logout)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  href="/login"
                  onMouseEnter={() => handleNavigationIntent("/login")}
                  onFocus={() => handleNavigationIntent("/login")}
                  onClick={handleNavigationClick}
                  className={`${authButtonClass} bg-blue-50/80 text-blue-700 border border-blue-100 hover:bg-blue-100/80`}
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.account)}
                </a>
                <a
                  href="/register"
                  onMouseEnter={() => handleNavigationIntent("/register")}
                  onFocus={() => handleNavigationIntent("/register")}
                  onClick={handleNavigationClick}
                  className={`${authButtonClass} premium-action text-white shadow-sm hover:shadow-md`}
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.register)}
                </a>
              </>
            )}
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
            <label
              className="inline-flex min-h-12 items-center gap-1.5 rounded-xl border border-blue-200/60 bg-blue-50 px-2.5 text-sm font-bold text-blue-900 transition focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-100"
              title={copy(NAV_COPY.languageGroup)}
            >
              <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">{copy(NAV_COPY.languageGroup)}</span>
              <select
                value={language}
                onChange={event =>
                  setLanguage(event.target.value as "fr" | "en")
                }
                aria-label={copy(NAV_COPY.languageGroup)}
                className="min-h-10 max-w-[8.5rem] cursor-pointer appearance-none bg-transparent pr-1 outline-none"
              >
                <option value="fr">{compactLanguage ? "FR" : "FR · Français"}</option>
                <option value="en">{compactLanguage ? "EN" : "EN · English"}</option>
              </select>
            </label>
            <ThemeToggle compact />
            {!candidate && (
              <a
                href="/register"
                onMouseEnter={() => handleNavigationIntent("/register")}
                onFocus={() => handleNavigationIntent("/register")}
                onClick={handleNavigationClick}
                aria-label={copy(NAV_COPY.register)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-blue-600 px-2.5 text-[11px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:scale-95 sm:px-3 sm:text-xs"
              >
                <PenLine className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="max-[359px]:sr-only">{copy(NAV_COPY.register)}</span>
              </a>
            )}
            <motion.button
              type="button"
              aria-label={
                isMenuOpen ? copy(NAV_COPY.closeMenu) : copy(NAV_COPY.openMenu)
              }
              aria-expanded={isMenuOpen}
              aria-controls="mobile-main-navigation"
              ref={menuTriggerRef}
              onClick={() => setIsMenuOpen(open => !open)}
              className="touch-target rounded-2xl bg-gray-50 p-2.5 text-gray-700 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              animate={isMenuOpen ? "open" : "closed"}
              variants={hamburgerVariants}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-100/70 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/90">
        <form
          action="/destinations"
          method="get"
          onSubmit={handleSearchSubmit}
          className={`flex min-h-12 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md ${searchShortcutActive ? "scale-[1.015] border-[#c39231] shadow-[0_0_0_5px_rgba(195,146,49,0.18)]" : "shadow-sm"}`}
        >
          <Search
            className="h-4 w-4 shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="mobile-visible-nav-search">
            {copy(NAV_COPY.searchDestinations)}
          </label>
          <input
            id="mobile-visible-nav-search"
            name="search"
            value={menuSearch}
            onChange={event => {
              setMenuSearch(event.target.value);
              setActiveSuggestionIndex(-1);
            }}
            placeholder={copy(NAV_COPY.searchPlaceholder)}
            aria-keyshortcuts="/"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label={copy(NAV_COPY.searchSubmit)}
            className="touch-target inline-flex h-10 min-h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition duration-200 hover:bg-blue-800 active:scale-95"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-main-navigation"
            className="mobile-scroll-region max-h-[min(70dvh,calc(100dvh-4.5rem))] overflow-y-auto overscroll-contain border-t border-blue-100 bg-white/95 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            {candidate && (
              <motion.a
                href="/mon-espace"
                onClick={() => {
                  handleNavigationClick();
                  closeMenu();
                }}
                className="mb-2 flex min-h-14 items-center gap-3 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-50 to-sky-50 p-3.5 transition hover:bg-white"
                aria-label={`${copy(NAV_COPY.openSpace)} : ${candidate.fullName || copy(NAV_COPY.accountSpace)}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-500/20">
                  {getInitial(candidate.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0a2540]">
                    {candidate.fullName || copy(NAV_COPY.accountSpace)}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    {copy(NAV_COPY.openSpace)}
                  </p>
                  <p className="max-w-[220px] truncate text-[11px] text-slate-500">
                    {candidate.email}
                  </p>
                </div>
              </motion.a>
            )}

            <a
              href="/panier"
              onMouseEnter={() => handleNavigationIntent("/panier")}
              onFocus={() => handleNavigationIntent("/panier")}
              onClick={() => {
                handleNavigationClick();
                closeMenu();
              }}
              className="mb-2 flex min-h-12 w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 font-bold text-blue-700"
              aria-label={`${copy(NAV_COPY.cart)}${totalItems ? `, ${totalItems} ${copy(totalItems > 1 ? NAV_COPY.items : NAV_COPY.item)}` : ` ${copy(NAV_COPY.empty)}`}`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />{" "}
                {copy(NAV_COPY.cart)}
              </span>
              <span className="rounded-full bg-orange-700 px-2 py-0.5 text-[10px] font-black text-white">
                {totalItems}
              </span>
            </a>

            <nav
              aria-label={copy(NAV_COPY.mobileNav)}
              className="mb-4 space-y-1"
            >
              <form
                action="/destinations"
                method="get"
                onSubmit={handleSearchSubmit}
                className={`mb-4 space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 transition duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md ${searchShortcutActive ? "scale-[1.015] border-[#c39231] shadow-[0_0_0_5px_rgba(195,146,49,0.18)]" : "shadow-sm"}`}
              >
                <label
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em] text-blue-900"
                  htmlFor="mobile-nav-search"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.searchDestinations)}
                </label>
                <div className="flex min-h-12 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 transition duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                  <input
                    ref={mobileNavSearchRef}
                    id="mobile-nav-search"
                    name="search"
                    value={menuSearch}
                    onChange={event => {
                      setMenuSearch(event.target.value);
                      setActiveSuggestionIndex(-1);
                    }}
                    onKeyDown={event =>
                      handleSearchKeyDown(event, searchSuggestions)
                    }
                    onFocus={() => {
                      setIsMobileSearchFocused(true);
                      setActiveSuggestionIndex(-1);
                    }}
                    onBlur={() =>
                      window.setTimeout(
                        () => setIsMobileSearchFocused(false),
                        120
                      )
                    }
                    placeholder={copy(NAV_COPY.searchPlaceholder)}
                    aria-keyshortcuts="/"
                    aria-controls={isMobileSearchFocused || normalizedSearch ? "mobile-nav-suggestions" : undefined}
                    aria-activedescendant={
                      activeSuggestionIndex >= 0
                        ? `mobile-nav-suggestion-${activeSuggestionIndex}`
                        : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    aria-label={copy(NAV_COPY.searchSubmit)}
                    className="touch-target inline-flex h-10 min-h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 active:scale-95"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {(isMobileSearchFocused || normalizedSearch) && (
                  <div
                    id="mobile-nav-suggestions"
                    role="listbox"
                    aria-live="polite"
                    aria-label={copy(NAV_COPY.searchResults)}
                    className="flex flex-wrap gap-2"
                  >
                    {suggestionDestinations.map((item, index) => (
                      <a
                        key={item.href}
                        id={`mobile-nav-suggestion-${index}`}
                        role="option"
                        aria-selected={activeSuggestionIndex === index}
                        href={item.href}
                        onClick={() => {
                          rememberSearch(item.href);
                          handleNavigationClick();
                          closeMenu();
                        }}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        className={`min-h-11 rounded-full border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-800 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 active:scale-95 ${activeSuggestionIndex === index ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : ""}`}
                      >
                        {copy(item.label)}
                      </a>
                    ))}
                    {!matchingDestinations.length &&
                      !filteredMenuItems.length && (
                        <span className="px-1 text-sm font-semibold text-slate-500">
                          {copy(NAV_COPY.searchEmpty)}
                        </span>
                      )}
                  </div>
                )}
              </form>

              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => handleNavigationIntent(item.href)}
                    onFocus={() => handleNavigationIntent(item.href)}
                    onClick={() => {
                      handleNavigationClick();
                      closeMenu();
                    }}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-semibold text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={candidate ? index + 1 : index}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{copy(item.label)}</span>
                  </motion.a>
                );
              })}
            </nav>

            <motion.div
              className="border-t border-gray-100 my-3"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              custom={menuItems.length + 1}
            />

            {candidate ? (
              <motion.button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-3 text-center font-bold text-rose-600 transition hover:bg-rose-100"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={menuItems.length + 2}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />{" "}
                {copy(NAV_COPY.logout)}
              </motion.button>
            ) : (
              <motion.div
                className="space-y-2"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={menuItems.length + 2}
              >
                <a
                  href="/?project=travail#evaluation-multi"
                  onMouseEnter={() =>
                    handleNavigationIntent("/?project=travail#evaluation-multi")
                  }
                  onFocus={() =>
                    handleNavigationIntent("/?project=travail#evaluation-multi")
                  }
                  onClick={() => {
                    handleNavigationClick();
                    closeMenu();
                  }}
                  className={`${mobileAuthButtonClass} bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30`}
                >
                  <Star className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.evaluate)}
                </a>
                <p
                  className="px-1 text-center text-[11px] leading-4 text-slate-500"
                  data-testid="mobile-eval-hint"
                >
                  {copy(NAV_COPY.evaluateHint)}
                </p>
                <a
                  href="/login"
                  onMouseEnter={() => handleNavigationIntent("/login")}
                  onFocus={() => handleNavigationIntent("/login")}
                  onClick={() => {
                    handleNavigationClick();
                    closeMenu();
                  }}
                  className={`${mobileAuthButtonClass} bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100`}
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.account)}
                </a>
                <a
                  href="/register"
                  onMouseEnter={() => handleNavigationIntent("/register")}
                  onFocus={() => handleNavigationIntent("/register")}
                  onClick={() => {
                    handleNavigationClick();
                    closeMenu();
                  }}
                  className={`${mobileAuthButtonClass} mt-2 bg-blue-600 text-white hover:bg-blue-700`}
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" />{" "}
                  {copy(NAV_COPY.register)}
                </a>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
