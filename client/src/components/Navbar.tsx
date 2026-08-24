import React, { useState } from "react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { prefetchNavigation } from "@/lib/navigationCache";
import { notifyNavigationStart } from "./NavigationProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen,
  ChevronDown,
  FileText,
  FolderKanban,
  Globe2,
  Home,
  Languages,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  Plane,
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

const menuItems: { href: string; label: string; icon: LucideIcon; highlight?: boolean }[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/billets", label: "3M Booking", icon: Plane },
  { href: "/procedures", label: "Procédures", icon: BookOpen },
  { href: "/ressources", label: "Ressources", icon: Globe2 },
  { href: "/guide-procedures", label: "Guide PDF", icon: FileText },
  { href: "/#evaluation-multi", label: "Évaluation Rapide", icon: Zap },
  { href: "/mon-espace", label: "Suivi de dossier", icon: FolderKanban },
  { href: "/evisas", label: "E-Visa", icon: Smartphone, highlight: true },
  { href: "/3m-digital", label: "3M Digital", icon: UsersRound },
];

const nativeLinkClass = (highlight?: boolean) =>
  highlight
    ? "min-h-11 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-1"
    : "min-h-11 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 shadow-none hover:shadow-sm inline-flex items-center gap-1";

const authButtonClass = "inline-flex h-12 w-[148px] items-center justify-center rounded-xl px-4 text-center text-sm font-bold transition-all duration-200 active:scale-95";
const mobileAuthButtonClass = "flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-center font-bold transition-all duration-200";

export default function Navbar() {
  const { candidate, logout } = useCandidateAuth();
  const { language, setLanguage } = useLanguage();
  const { totalItems } = useMultiServiceCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  return (
    <header className="glass-nav sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <a
            href="/"
            onMouseEnter={() => handleNavigationIntent("/")}
            onFocus={() => handleNavigationIntent("/")}
            onClick={handleNavigationClick}
            className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
          >
            <img
              src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"
              alt="Logo 3M Travel Agency"
              className="h-12 w-auto object-contain"
            />
          </a>

          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center space-x-1 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/80"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
              <a
                key={item.href}
                href={item.href}
                onMouseEnter={() => handleNavigationIntent(item.href)}
                onFocus={() => handleNavigationIntent(item.href)}
                onClick={handleNavigationClick}
                className={nativeLinkClass(item.highlight)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </a>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/panier"
              onMouseEnter={() => handleNavigationIntent("/panier")}
              onFocus={() => handleNavigationIntent("/panier")}
              onClick={handleNavigationClick}
              aria-label={`Panier multi-services${totalItems ? `, ${totalItems} élément${totalItems > 1 ? "s" : ""}` : " vide"}`}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 text-blue-700 transition hover:bg-blue-100"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {totalItems > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{totalItems > 9 ? "9+" : totalItems}</span>}
            </a>
            <div className="flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-slate-800 p-1 border border-blue-200/60 dark:border-blue-900/40" role="group" aria-label="Sélection de langue / Language selector">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                aria-label="Français"
                aria-pressed={language === 'fr'}
                className={`px-2 py-1.5 rounded-lg text-xs font-black transition ${language === 'fr' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-blue-700'}`}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" /><span>FR</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-label="English"
                aria-pressed={language === 'en'}
                className={`px-2 py-1.5 rounded-lg text-xs font-black transition ${language === 'en' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-blue-700'}`}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" /><span>EN</span>
              </button>
            </div>
            <ThemeToggle />
            {candidate ? (
              <div className="relative flex items-center gap-1">
                <a
                  href="/mon-espace"
                  onMouseEnter={() => handleNavigationIntent("/mon-espace")}
                  onFocus={() => handleNavigationIntent("/mon-espace")}
                  onClick={() => { handleNavigationClick(); closeProfile(); }}
                  aria-label={`Ouvrir l'espace de ${candidate.fullName || "votre compte"}`}
                  className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-slate-50 to-blue-50/50 p-1.5 pr-3 transition-all duration-200 hover:from-blue-50 hover:to-indigo-50 hover:shadow"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
                    {getInitial(candidate.fullName)}
                  </div>
                  <div className="text-left">
                    <span className="block max-w-[120px] truncate text-xs font-bold text-[#0a2540]">
                      {candidate.fullName || "Mon Compte"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connecté
                    </span>
                  </div>
                </a>
                <button
                  type="button"
                  aria-label="Ouvrir le menu du compte"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="touch-target rounded-xl p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200" role="menu">
                    <div className="p-3 bg-slate-50/80 rounded-2xl mb-1 border border-gray-100/60">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Espace Candidat</p>
                      <p className="text-sm font-bold text-[#0a2540] truncate mt-0.5">{candidate.email}</p>
                    </div>
                    <a
                      href="/mon-espace"
                      onMouseEnter={() => handleNavigationIntent("/mon-espace")}
                      onFocus={() => handleNavigationIntent("/mon-espace")}
                      onClick={() => { handleNavigationClick(); closeProfile(); }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                      role="menuitem"
                    >
                      <FolderKanban className="h-4 w-4" aria-hidden="true" /> Tableau de bord / Dossier
                    </a>
                    <a
                      href="/evaluation"
                      onMouseEnter={() => handleNavigationIntent("/evaluation")}
                      onFocus={() => handleNavigationIntent("/evaluation")}
                      onClick={() => { handleNavigationClick(); closeProfile(); }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                      role="menuitem"
                    >
                      <Star className="h-4 w-4" aria-hidden="true" /> Nouvelle Évaluation
                    </a>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
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
                  <UserRound className="h-4 w-4" aria-hidden="true" /> Accès Client
                </a>
                <a
                  href="/register"
                  onMouseEnter={() => handleNavigationIntent("/register")}
                  onFocus={() => handleNavigationIntent("/register")}
                  onClick={handleNavigationClick}
                  className={`${authButtonClass} bg-blue-600 text-white shadow-sm hover:bg-blue-700`}
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" /> Inscription
                </a>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-xl bg-blue-50 dark:bg-slate-800 p-1 border border-blue-200/60" role="group" aria-label="Sélection de langue / Language selector">
              <button type="button" onClick={() => setLanguage('fr')} aria-label="Français" aria-pressed={language === 'fr'} className={`touch-target inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs transition ${language === 'fr' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}><Languages className="h-3.5 w-3.5" aria-hidden="true" /><span>FR</span></button>
              <button type="button" onClick={() => setLanguage('en')} aria-label="English" aria-pressed={language === 'en'} className={`touch-target inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs transition ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}><Languages className="h-3.5 w-3.5" aria-hidden="true" /><span>EN</span></button>
            </div>
            <ThemeToggle compact />
            <motion.button
              type="button"
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="touch-target p-2.5 rounded-2xl bg-gray-50 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
              animate={isMenuOpen ? "open" : "closed"}
              variants={hamburgerVariants}
              transition={{ duration: 0.3 }}
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="lg:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-gray-100 dark:border-white/10 px-4 pt-3 pb-8 shadow-2xl"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {candidate && (
              <motion.a
                href="/mon-espace"
                onClick={() => { handleNavigationClick(); closeMenu(); }}
                className="flex items-center gap-3 rounded-2xl border border-blue-100/60 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 transition hover:bg-white"
                aria-label={`Ouvrir l'espace de ${candidate.fullName || "votre compte"}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-500/20">
                  {getInitial(candidate.fullName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a2540]">{candidate.fullName || "Candidat"}</p>
                  <p className="text-xs font-medium text-blue-600">Ouvrir mon espace</p>
                  <p className="max-w-[220px] truncate text-[11px] text-slate-500">{candidate.email}</p>
                </div>
              </motion.a>
            )}

            <a
              href="/panier"
              onMouseEnter={() => handleNavigationIntent("/panier")}
              onFocus={() => handleNavigationIntent("/panier")}
              onClick={() => { handleNavigationClick(); closeMenu(); }}
              className="mb-2 flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 font-bold text-blue-700"
              aria-label={`Panier multi-services${totalItems ? `, ${totalItems} élément${totalItems > 1 ? "s" : ""}` : " vide"}`}
            >
              <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" aria-hidden="true" /> Panier multi-services</span>
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">{totalItems}</span>
            </a>

            <nav aria-label="Navigation mobile" className="space-y-1 mb-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => handleNavigationIntent(item.href)}
                  onFocus={() => handleNavigationIntent(item.href)}
                  onClick={() => { handleNavigationClick(); closeMenu(); }}
                  className="flex min-h-11 items-center px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={candidate ? index + 1 : index}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
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
                className="w-full text-center bg-rose-50 text-rose-600 py-3 rounded-xl font-bold transition hover:bg-rose-100"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={menuItems.length + 2}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Se déconnecter
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
                  href="/evaluation"
                  onMouseEnter={() => handleNavigationIntent("/evaluation")}
                  onFocus={() => handleNavigationIntent("/evaluation")}
                  onClick={() => { handleNavigationClick(); closeMenu(); }}
                  className={`${mobileAuthButtonClass} bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30`}
                >
                  <Star className="h-4 w-4" aria-hidden="true" /> Évaluer mon profil
                </a>
                <a
                  href="/login"
                  onMouseEnter={() => handleNavigationIntent("/login")}
                  onFocus={() => handleNavigationIntent("/login")}
                  onClick={() => { handleNavigationClick(); closeMenu(); }}
                  className={`${mobileAuthButtonClass} bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100`}
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" /> Accès Client
                </a>
                <a
                  href="/register"
                  onMouseEnter={() => handleNavigationIntent("/register")}
                  onFocus={() => handleNavigationIntent("/register")}
                  onClick={() => { handleNavigationClick(); closeMenu(); }}
                  className={`${mobileAuthButtonClass} mt-2 bg-blue-600 text-white hover:bg-blue-700`}
                >
                  <PenLine className="h-4 w-4" aria-hidden="true" /> Inscription
                </a>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
