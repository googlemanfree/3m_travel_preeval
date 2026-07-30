import React, { useState } from 'react';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';
import { useLocation } from 'wouter';

export default function Navbar() {
  const { candidate, logout } = useCandidateAuth();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Extrait la première lettre pour l'avatar
  const getInitial = (name: string | undefined) => name ? name.charAt(0).toUpperCase() : 'C';

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setLocation('/');
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. LOGO & BRANDING MODERNE */}
          <a href="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="h-11 w-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                3M
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="block text-lg font-black text-[#0a2540] tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                3M Travel <span className="text-blue-600">&</span> Services
              </span>
              <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                Votre mobilité, notre expertise
              </span>
            </div>
          </a>

          {/* 2. NAVIGATION DESKTOP ÉLÉGANTE */}
          <nav className="hidden lg:flex items-center space-x-1 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/80">
            <a href="/" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 shadow-none hover:shadow-sm">
              Accueil
            </a>
            <a href="/vols" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-none hover:shadow-sm">
              <span>✈️</span> Vols
            </a>
            <a href="/procedures" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-none hover:shadow-sm">
              <span>📖</span> Procédures
            </a>
            <a href="/ressources" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-none hover:shadow-sm">
              <span>🌐</span> Ressources
            </a>
            <a href="/mon-espace" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-none hover:shadow-sm">
              <span>📂</span> Suivi
            </a>

          </nav>

          {/* 3. ZONE D'ACTION / PROFIL CANDIDAT */}
          <div className="hidden lg:flex items-center space-x-3">
            {candidate ? (
              /* --- MENU CANDIDAT CONNECTÉ --- */
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-blue-50/50 hover:from-blue-50 hover:to-indigo-50 border border-blue-100/80 p-1.5 pr-4 rounded-2xl transition-all duration-200 shadow-sm hover:shadow"
                >
                  <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black rounded-xl flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                    {getInitial(candidate.fullName)}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-[#0a2540] truncate max-w-[120px]">
                      {candidate.fullName || 'Mon Compte'}
                    </span>
                    <span className="block text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connecté
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* CARD DROPDOWN PROFIL */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-slate-50/80 rounded-2xl mb-1 border border-gray-100/60">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Espace Candidat</p>
                      <p className="text-sm font-bold text-[#0a2540] truncate mt-0.5">{candidate.email}</p>
                    </div>

                    <a
                      href="/mon-espace"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span>📂</span> Tableau de bord / Dossier
                    </a>
                    
                    <a
                      href="/evaluation"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span>⭐</span> Nouvelle Évaluation
                    </a>

                    <div className="my-1 border-t border-gray-100"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                    >
                      <span>🚪</span> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* --- BOUTONS D'ACTION INVITÉ --- */
              <>
                <a 
                  href="/evaluation" 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-200 active:scale-95"
                >
                  ⭐ Évaluer mon profil
                </a>
                <a 
                  href="/login" 
                  className="bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
                >
                  👤 Mon Espace
                </a>
              </>
            )}
          </div>

          {/* 4. HAMBURGER MOBILE */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-2xl bg-gray-50 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* 5. MENU MOBILE FLUIDE */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 pt-3 pb-8 space-y-2 shadow-2xl animate-in slide-in-from-top-3 duration-200">
          {candidate && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl mb-3 flex items-center gap-3 border border-blue-100/60">
              <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {getInitial(candidate.fullName)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0a2540]">{candidate.fullName || 'Candidat'}</p>
                <p className="text-xs text-blue-600 font-medium truncate">{candidate.email}</p>
              </div>
            </div>
          )}

          <a href="/" className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Accueil</a>
          <a href="/vols" className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>✈️ Vols</a>
          <a href="/procedures" className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>📖 Procédures</a>
          <a href="/ressources" className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>🌐 Ressources</a>
          <a href="/mon-espace" className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>📂 Suivi de dossier</a>

          <div className="pt-3 border-t border-gray-100">
            {candidate ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-center bg-rose-50 text-rose-600 py-3 rounded-xl font-bold transition hover:bg-rose-100"
              >
                🚪 Se déconnecter
              </button>
            ) : (
              <div className="space-y-2">
                <a href="/evaluation" className="block w-full text-center bg-amber-500 text-white py-3 rounded-xl font-bold shadow-md shadow-amber-500/20" onClick={() => setIsMenuOpen(false)}>
                  ⭐ Évaluer mon profil
                </a>
                <a href="/login" className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold" onClick={() => setIsMenuOpen(false)}>
                  👤 Mon Espace
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
