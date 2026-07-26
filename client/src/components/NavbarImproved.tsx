/**
 * Navbar Améliorée et Réorganisée
 * Meilleure hiérarchie, espacement, et accessibilité
 */

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, BookOpen, User, Menu, X, Star, Shield, Globe, Map, FileText, ChevronDown, Search, Download, CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface NavbarProps {
  onEvalClick?: () => void;
  activePage?: "home" | "flights" | "procedures" | "dashboard";
}

export default function NavbarImproved({ onEvalClick, activePage }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Détecteur de scroll pour l'effet de flou
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = isAuthenticated && user?.role === "admin";
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const active = activePage ?? (
    location === "/" ? "home" :
    location.startsWith("/flights") ? "flights" :
    location.startsWith("/procedures") ? "procedures" :
    location.startsWith("/dashboard") ? "dashboard" :
    location.startsWith("/visa-types") ? "visa-types" :
    location.startsWith("/destinations") ? "destinations" :
    location.startsWith("/guide") ? "guide" : undefined
  );

  const linkClass = (page: string) =>
    `text-sm font-bold transition-all duration-200 ${
      active === page
        ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A] pb-0.5"
        : "text-gray-700 hover:text-[#1E3A8A]"
    }`;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg'
        : 'bg-white border-b border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo Section ── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity">
          <img
            src={LOGO_URL}
            alt="3M Travel & Services"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#1E3A8A]/20 flex-shrink-0"
            onError={e => {
              const t = e.target as HTMLImageElement;
              t.style.display = "none";
              const fallback = t.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ display: "none" }}
          >
            3M
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#1E3A8A] text-sm leading-tight truncate">3M Travel</div>
            <div className="text-xs text-gray-500 font-medium truncate">Visa & Immigration</div>
          </div>
        </Link>

        {/* ── Navigation Desktop ── */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <Link href="/" className={linkClass("home")}>Accueil</Link>
          <Link href="/flights" className={linkClass("flights")}>
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Vols</span>
          </Link>
          <Link href="/procedures" className={linkClass("procedures")}>
            <span className="flex items-center gap-1 justify-center"><BookOpen className="w-3.5 h-3.5" />Procédures</span>
          </Link>

          {/* Ressources Dropdown */}
          <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
            <button className={`text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
              ["visa-types", "destinations", "guide", "tarifs", "avis", "blog"].includes(active ?? "")
                ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A] pb-0.5"
                : "text-gray-600 hover:text-[#1E3A8A]"
            }`}>
              <Globe className="w-3.5 h-3.5" />
              Ressources
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-56 z-50"
                >
                  <Link href="/visa-types" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <FileText className="w-4 h-4 text-[#1E3A8A]" />
                    Types de Visa
                  </Link>
                  <Link href="/destinations" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <Map className="w-4 h-4 text-[#1E3A8A]" />
                    Destinations
                  </Link>
                  <Link href="/guide" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
                    Guide Complet
                  </Link>
                  <Link href="/tarifs" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <FileText className="w-4 h-4 text-[#1E3A8A]" />
                    Tarifs & Garanties
                  </Link>
                  <Link href="/avis" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <Star className="w-4 h-4 text-[#1E3A8A]" />
                    Avis Clients
                  </Link>
                  <Link href="/blog" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors">
                    <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
                    Blog
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link href="/simulateur-eligibilite" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1E3A8A] hover:bg-blue-50 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                    Simulateur d'éligibilité
                  </Link>
                  <Link href="/comparateur-destinations" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1E3A8A] hover:bg-blue-50 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    Comparateur de destinations
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <Link href="/ressources" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1E3A8A] hover:bg-blue-50 transition-colors">
                    <Download className="w-4 h-4" />
                    Télécharger les guides PDF
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/mon-dossier" className={linkClass("suivi")}>
            <span className="flex items-center gap-1 justify-center"><Search className="w-3.5 h-3.5" />Suivi</span>
          </Link>
        </nav>

        {/* ── Actions Section ── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* Language Switcher */}
          <LanguageSwitcher showLabel={false} />

          {/* Evaluation Button - CTA Principal */}
          {onEvalClick && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onEvalClick}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm px-4 py-2 shadow-md rounded-lg transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-1.5" />
                Évaluation gratuite
              </Button>
            </motion.div>
          )}

          {/* Admin Section */}
          {!isAdmin && (
            <Link href="/admin/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-purple-700 text-purple-700 hover:bg-purple-50 font-semibold text-sm px-3 py-2 transition-all duration-200"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </Button>
              </motion.div>
            </Link>
          )}

          {/* Auth Section */}
          {isAuthenticated ? (
            <Link href="/mon-espace">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold text-sm px-4 py-2 shadow-md rounded-lg transition-all duration-200"
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Mon Espace
                </Button>
              </motion.div>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-semibold text-sm px-3 py-2 transition-all duration-200"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Connexion
                  </Button>
                </motion.div>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    className="bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold text-sm px-4 py-2 shadow-md rounded-lg transition-all duration-200"
                  >
                    Inscription
                  </Button>
                </motion.div>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Menu Button ── */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 flex flex-col gap-3 shadow-lg"
          >
            <Link href="/" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              Accueil
            </Link>
            <Link href="/flights" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <Plane className="w-4 h-4 text-[#1E3A8A]" /> Vols
            </Link>
            <Link href="/procedures" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <BookOpen className="w-4 h-4 text-[#1E3A8A]" /> Procédures
            </Link>
            <Link href="/visa-types" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <FileText className="w-4 h-4 text-[#1E3A8A]" /> Types de Visa
            </Link>
            <Link href="/destinations" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <Map className="w-4 h-4 text-[#1E3A8A]" /> Destinations
            </Link>
            <Link href="/guide" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <Globe className="w-4 h-4 text-[#1E3A8A]" /> Guide Complet
            </Link>
            <Link href="/mon-dossier" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 border-b border-gray-100 transition-colors">
              <Search className="w-4 h-4 text-[#1E3A8A]" /> Suivi
            </Link>

            {/* Mobile Auth */}
            {isAuthenticated ? (
              <Link href="/mon-espace" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-2 border-b border-gray-100 transition-colors">
                <User className="w-4 h-4" /> Mon Espace
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-2 border-b border-gray-100 transition-colors">
                  <User className="w-4 h-4" /> Connexion
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-2 border-b border-gray-100 transition-colors">
                  Inscription
                </Link>
              </>
            )}

            {/* Mobile Admin */}
            {!isAdmin && (
              <Link href="/admin/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 border-b border-gray-100 transition-colors">
                <Shield className="w-4 h-4" /> Connexion Admin
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 border-b border-gray-100 transition-colors">
                <Shield className="w-4 h-4" /> Administration
              </Link>
            )}

            {/* Mobile Evaluation */}
            {onEvalClick && (
              <Button
                onClick={() => { setMobileOpen(false); onEvalClick(); }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold mt-2 rounded-lg transition-all duration-200"
              >
                <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
              </Button>
            )}

            {/* Mobile Language Switcher */}
            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="text-xs font-semibold text-gray-600 mb-2">Langue</div>
              <LanguageSwitcher showLabel={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
