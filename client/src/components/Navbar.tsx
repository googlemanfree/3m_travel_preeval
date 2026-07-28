import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, BookOpen, User, Menu, X, Star, FolderOpen, Shield, Globe, Map, FileText, ChevronDown, Search, Download } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface NavbarProps {
  onEvalClick?: () => void;
  activePage?: "home" | "flights" | "procedures" | "dashboard";
}

export default function Navbar({ onEvalClick, activePage }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = isAuthenticated && user?.role === "admin";

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
    `text-sm font-semibold transition-colors ${
      active === page
        ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
        : "text-gray-600 hover:text-blue-700"
    }`;

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
          <img
            src={LOGO_URL}
            alt="3M Travel & Services"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 flex-shrink-0"
            onError={e => {
              const t = e.target as HTMLImageElement;
              t.style.display = "none";
              const fallback = t.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Fallback si logo indisponible */}
          <div
            className="w-10 h-10 rounded-full bg-blue-700 items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ display: "none" }}
          >
            3M
          </div>
          <div className="min-w-0">
            <div className="font-black text-blue-800 text-sm leading-tight truncate">3M Travel & Services</div>
            <div className="text-xs text-blue-500 font-medium truncate">Votre mobilité, notre expertise</div>
          </div>
        </Link>

        {/* ── NAV DESKTOP (Visible uniquement sur écran >= md) ── */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={linkClass("home")}>Accueil</Link>
          <Link href="/flights" className={linkClass("flights")}>
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Vols</span>
          </Link>
          <Link href="/procedures" className={linkClass("procedures")}>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Procédures</span>
          </Link>

          {/* Menu déroulant Ressources */}
          <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
            <button className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
              ["visa-types", "destinations", "guide", "tarifs", "avis", "blog"].includes(active ?? "")
                ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
                : "text-gray-600 hover:text-blue-700"
            }`}>
              <Globe className="w-3.5 h-3.5" />
              Ressources
              <ChevronDown className={`w-3 h-3 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            {resourcesOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-blue-100 rounded-lg shadow-lg py-2 min-w-48 z-50">
                <Link href="/visa-types" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Types de Visa
                </Link>
                <Link href="/destinations" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Map className="w-4 h-4 text-blue-600" />
                  Destinations
                </Link>
                <Link href="/guide" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Guide Complet
                </Link>
              </div>
            )}
          </div>

          <Link href="/mon-dossier" className={linkClass("dashboard")}>
            <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" />Suivi</span>
          </Link>

          {isAdmin && (
            <Link href="/admin/login" className={linkClass("admin")}>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />Admin</span>
            </Link>
          )}
        </nav>

        {/* ── Boutons CTA Desktop ── */}
        <div className="hidden md:flex items-center gap-3">
          <Button onClick={onEvalClick} variant="default" size="sm" className="bg-amber-500 hover:bg-amber-600">
            <Star className="w-3.5 h-3.5 mr-1" />
            Évaluation gratuite
          </Button>
          {isAuthenticated ? (
            <Link href="/mon-espace">
              <Button variant="outline" size="sm">
                <User className="w-3.5 h-3.5 mr-1" />
                Mon Espace
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Se connecter
              </Button>
            </Link>
          )}
        </div>

        {/* ── BOUTON HAMBURGER (Visible uniquement sur mobile < md) ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── NAV MOBILE (Déroulante uniquement si mobileOpen === true) ── */}
      {mobileOpen && (
        <nav className="md:hidden bg-gray-50 border-t border-blue-100 px-4 py-4 flex flex-col gap-3">
          <Link href="/" onClick={closeMobileMenu} className="text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-200">
            Accueil
          </Link>
          <Link href="/flights" onClick={closeMobileMenu} className="text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-200">
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Vols</span>
          </Link>
          <Link href="/procedures" onClick={closeMobileMenu} className="text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-200">
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Procédures</span>
          </Link>

          {/* Ressources Mobile */}
          <div className="py-2 border-b border-gray-200">
            <button onClick={() => setResourcesOpen(!resourcesOpen)} className="text-sm font-semibold text-gray-700 hover:text-blue-700 flex items-center gap-1 w-full">
              <Globe className="w-3.5 h-3.5" />
              Ressources
              <ChevronDown className={`w-3 h-3 transition-transform ml-auto ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            {resourcesOpen && (
              <div className="mt-2 pl-4 flex flex-col gap-2">
                <Link href="/visa-types" onClick={closeMobileMenu} className="text-sm text-gray-600 hover:text-blue-700 py-1">
                  Types de Visa
                </Link>
                <Link href="/destinations" onClick={closeMobileMenu} className="text-sm text-gray-600 hover:text-blue-700 py-1">
                  Destinations
                </Link>
                <Link href="/guide" onClick={closeMobileMenu} className="text-sm text-gray-600 hover:text-blue-700 py-1">
                  Guide Complet
                </Link>
              </div>
            )}
          </div>

          <Link href="/mon-dossier" onClick={closeMobileMenu} className="text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-200">
            <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" />Suivi</span>
          </Link>

          {isAdmin && (
            <Link href="/admin/login" onClick={closeMobileMenu} className="text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-200">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />Admin</span>
            </Link>
          )}

          {/* CTA Mobile */}
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => { onEvalClick?.(); closeMobileMenu(); }} variant="default" size="sm" className="w-full bg-amber-500 hover:bg-amber-600">
              <Star className="w-3.5 h-3.5 mr-1" />
              Évaluation gratuite
            </Button>
            {isAuthenticated ? (
              <Link href="/mon-espace" onClick={closeMobileMenu}>
                <Button variant="outline" size="sm" className="w-full">
                  <User className="w-3.5 h-3.5 mr-1" />
                  Mon Espace
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={closeMobileMenu}>
                <Button variant="outline" size="sm" className="w-full">
                  Se connecter
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
