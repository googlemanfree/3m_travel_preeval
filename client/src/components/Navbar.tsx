import React, { useState } from 'react';
import { useLocation } from 'wouter';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. LOGO */}
          <a href="/" className="flex items-center gap-3">
            <img 
              src="/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg" 
              alt="3M Travel & Services" 
              className="h-12 w-auto" 
            />
            <div className="hidden sm:block">
              <span className="block text-lg font-bold text-[#0a2540] leading-tight">3M Travel & Services</span>
              <span className="block text-xs text-blue-600 font-medium">Votre mobilité, notre expertise</span>
            </div>
          </a>

          {/* 2. NAVIGATION DESKTOP (Alignée horizontalement, masquée sur mobile) */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <a 
              href="/" 
              className={`hover:text-blue-600 transition ${isActive('/') ? 'text-blue-600' : ''}`}
            >
              Accueil
            </a>
            <a 
              href="/flights" 
              className={`hover:text-blue-600 transition flex items-center gap-1 ${isActive('/flights') ? 'text-blue-600' : ''}`}
            >
              ✈️ Vols
            </a>
            <a 
              href="/procedures" 
              className={`hover:text-blue-600 transition flex items-center gap-1 ${isActive('/procedures') ? 'text-blue-600' : ''}`}
            >
              📖 Procédures
            </a>
            <a 
              href="/ressources" 
              className={`hover:text-blue-600 transition flex items-center gap-1 ${isActive('/ressources') ? 'text-blue-600' : ''}`}
            >
              🌐 Ressources
            </a>
            <a 
              href="/mon-dossier" 
              className={`hover:text-blue-600 transition flex items-center gap-1 ${isActive('/mon-dossier') ? 'text-blue-600' : ''}`}
            >
              📂 Suivi
            </a>
            <a 
              href="/admin/login" 
              className={`hover:text-blue-600 transition flex items-center gap-1 text-gray-500 ${isActive('/admin/login') ? 'text-blue-600' : ''}`}
            >
              🛡️ Admin
            </a>
          </nav>

          {/* 3. BOUTONS D'ACTION DESKTOP */}
          <div className="hidden lg:flex items-center space-x-4">
            <a 
              href="/open-dossier" 
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"
            >
              ⭐ Évaluation gratuite
            </a>
            <a 
              href="/mon-espace" 
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2"
            >
              👤 Mon Espace
            </a>
          </div>

          {/* 4. BOUTON HAMBURGER (Visible uniquement sur mobile < lg) */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg focus:outline-none"
              aria-label="Toggle Menu"
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

      {/* 5. MENU MOBILE DÉROULANT (S'affiche UNIQUEMENT au clic sur mobile) */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <a 
            href="/" 
            className="block py-2 text-gray-700 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            Accueil
          </a>
          <a 
            href="/flights" 
            className="block py-2 text-gray-700 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            ✈️ Vols
          </a>
          <a 
            href="/procedures" 
            className="block py-2 text-gray-700 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            📖 Procédures
          </a>
          <a 
            href="/ressources" 
            className="block py-2 text-gray-700 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            🌐 Ressources
          </a>
          <a 
            href="/mon-dossier" 
            className="block py-2 text-gray-700 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            📂 Suivi
          </a>
          <a 
            href="/admin/login" 
            className="block py-2 text-gray-500 font-medium hover:text-blue-600" 
            onClick={() => setIsMenuOpen(false)}
          >
            🛡️ Admin
          </a>
          
          <div className="pt-4 space-y-2 border-t border-gray-100">
            <a 
              href="/open-dossier" 
              className="block w-full text-center bg-amber-500 text-white py-3 rounded-xl font-bold"
              onClick={() => setIsMenuOpen(false)}
            >
              ⭐ Évaluation gratuite
            </a>
            <a 
              href="/mon-espace" 
              className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold"
              onClick={() => setIsMenuOpen(false)}
            >
              👤 Mon Espace
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
