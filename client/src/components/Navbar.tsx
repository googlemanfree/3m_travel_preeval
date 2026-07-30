import { useState } from "react";
import { useLocation } from "wouter";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { ChevronDown, LogOut, FileText, Star } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [, navigate] = useLocation();
  const { candidateUser, candidateLogout } = useCandidateAuth();

  // Extrait la première lettre pour l'Avatar
  const getInitial = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    candidateLogout();
    setIsProfileDropdownOpen(false);
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO & TITRE */}
          <a href="/" className="flex items-center gap-3 shrink-0">
            <img 
              src="/manus-storage/logo_3m_d0e23210.jpeg" 
              alt="3M Travel & Services" 
              className="h-12 w-auto" 
            />
            <div>
              <span className="block text-base font-bold text-[#0a2540] leading-tight">3M Travel & Services</span>
              <span className="block text-xs text-blue-600 font-medium">Votre mobilité, notre expertise</span>
            </div>
          </a>

          {/* NAVIGATION DESKTOP */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-gray-700">
            <a href="/" className="hover:text-blue-600 transition">Accueil</a>
            <a href="/vols" className="hover:text-blue-600 transition flex items-center gap-1">✈️ Vols</a>
            <a href="/procedures" className="hover:text-blue-600 transition flex items-center gap-1">📖 Procédures</a>
            <a href="/ressources" className="hover:text-blue-600 transition flex items-center gap-1">🌐 Ressources</a>
            <a href="/mon-espace" className="hover:text-blue-600 transition flex items-center gap-1">📂 Suivi</a>
            <a href="/admin" className="hover:text-blue-600 transition flex items-center gap-1 text-gray-500">🛡️ Admin</a>
          </nav>

          {/* ZONE DROITE : UTILISATEUR CONNECTÉ OU BOUTONS D'ACTION */}
          <div className="hidden lg:flex items-center space-x-4 shrink-0">
            {candidateUser ? (
              /* --- UTILISATEUR CONNECTÉ : AVATAR ET NOM --- */
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-full flex items-center justify-center text-sm shadow-sm">
                    {getInitial(candidateUser.fullName)}
                  </div>
                  <span className="text-sm font-bold text-[#0a2540]">
                    {candidateUser.fullName || "Mon Compte"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* DROPDOWN MENU UTILISATEUR */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Connecté en tant que</p>
                      <p className="text-sm font-bold text-[#0a2540] truncate">{candidateUser.email}</p>
                    </div>
                    <a
                      href="/mon-espace"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition flex items-center gap-2"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <FileText className="w-4 h-4" />
                      📂 Mon Espace / Mon Dossier
                    </a>
                    <a
                      href="/evaluation"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition flex items-center gap-2"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Star className="w-4 h-4" />
                      ⭐ Nouvelle Évaluation
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold transition border-t border-gray-100 mt-1 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      🚪 Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* --- MODE DÉCONNECTÉ : BOUTONS CLASSIQUES --- */
              <>
                <a 
                  href="/evaluation" 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
                >
                  ⭐ Évaluation gratuite
                </a>
                <a 
                  href="/login" 
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  👤 Se connecter
                </a>
              </>
            )}
          </div>

          {/* BOUTON MENU HAMBURGER MOBILE */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* MENU MOBILE DÉROULANT */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          {candidateUser && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-full flex items-center justify-center">
                {getInitial(candidateUser.fullName)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0a2540]">{candidateUser.fullName || "Mon Compte"}</p>
                <p className="text-xs text-blue-600 font-medium">Connecté</p>
              </div>
            </div>
          )}

          <a href="/" className="block py-2 text-gray-700 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Accueil</a>
          <a href="/vols" className="block py-2 text-gray-700 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>✈️ Vols</a>
          <a href="/procedures" className="block py-2 text-gray-700 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>📖 Procédures</a>
          <a href="/ressources" className="block py-2 text-gray-700 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>🌐 Ressources</a>
          <a href="/mon-espace" className="block py-2 text-gray-700 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>📂 Suivi</a>
          <a href="/admin" className="block py-2 text-gray-500 font-medium hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>🛡️ Admin</a>
          
          <div className="pt-4 space-y-2 border-t border-gray-100">
            {candidateUser ? (
              <>
                <a 
                  href="/mon-espace" 
                  className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📂 Mon Espace
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center bg-red-100 text-red-600 py-3 rounded-xl font-bold"
                >
                  🚪 Se déconnecter
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/evaluation" 
                  className="block w-full text-center bg-amber-500 text-white py-3 rounded-xl font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ⭐ Évaluation gratuite
                </a>
                <a 
                  href="/login" 
                  className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  👤 Se connecter
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
