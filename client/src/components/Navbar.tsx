import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';
import { startLogin } from '@/const';
import { LogOut, User, Settings, ChevronDown, Menu, X, Plane, BookOpen, Globe, FolderOpen, Shield, Info, Mail, FileText, MoreHorizontal } from 'lucide-react';
import { AutoBreadcrumb } from './Breadcrumb';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated: isOAuthAuthenticated, logout: oauthLogout } = useAuth();
  const { candidate, isAuthenticated: isCandidateAuthenticated, logout: candidateLogout } = useCandidateAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Le candidat connecté (JWT) est prioritaire sur l'utilisateur OAuth (admin)
  // On affiche le candidat si connecté, sinon l'utilisateur OAuth admin
  const isAuthenticated = isCandidateAuthenticated || isOAuthAuthenticated;
  const displayName = isCandidateAuthenticated ? candidate?.fullName : user?.name;
  const displayEmail = isCandidateAuthenticated ? candidate?.email : user?.email;
  const isAdmin = !isCandidateAuthenticated && user?.role === 'admin';
  const isCandidate = isCandidateAuthenticated;

  const handleLogout = () => {
    setIsProfileOpen(false);
    if (isCandidateAuthenticated) {
      candidateLogout();
      window.location.href = '/login';
    } else {
      oauthLogout();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => location === path;

  const navLinks = [
    { href: '/flights', label: 'Vols', icon: Plane },
    { href: '/procedures', label: 'Procédures', icon: BookOpen },
    { href: '/ressources', label: 'Ressources', icon: Globe },
    { href: '/mon-dossier', label: 'Suivi', icon: FolderOpen },
  ];

  const adminLink = { href: '/admin/login', label: 'Admin', icon: Shield, subtle: true };

  return (
    <div>
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg"
              alt="3M Travel & Services"
              className="h-10 lg:h-12 w-auto"
            />
            <div className="hidden sm:block">
              <span className="block text-base lg:text-lg font-bold text-[#0a2540] leading-tight">3M Travel & Services</span>
              <span className="block text-xs text-blue-600 font-medium">Votre mobilité, notre expertise</span>
            </div>
          </a>

          {/* Navigation desktop */}
          <nav className="hidden lg:flex items-center gap-5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600 ${
                  isActive(href) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
            {/* Menu Plus */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                <MoreHorizontal className="w-4 h-4" /> Plus
              </button>
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="/eligibility-simulator" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition rounded-t-xl">
                  <Shield className="w-4 h-4 text-green-500" /> Simulateur
                </a>
                <a href="/budget-calculator" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <FileText className="w-4 h-4 text-orange-500" /> Calculateur Budget
                </a>
                <a href="/visa-gallery" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <Globe className="w-4 h-4 text-purple-500" /> Galerie Visas
                </a>
                <a href="/schedule-agency" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <Mail className="w-4 h-4 text-teal-500" /> Prendre RDV
                </a>
                <a href="/blog" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <FileText className="w-4 h-4 text-blue-500" /> Blog
                </a>
                <a href="/about" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <Info className="w-4 h-4 text-blue-500" /> À Propos
                </a>
                <a href="/contact" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition">
                  <Mail className="w-4 h-4 text-blue-500" /> Contact
                </a>
                <div className="border-t border-gray-100">
                  <a href="/admin/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition rounded-b-xl">
                    <Shield className="w-4 h-4" /> Admin
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && displayName ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-semibold text-sm transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-sm text-gray-500 truncate">{displayEmail}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {isAdmin ? '👑 Administrateur' : '👤 Candidat'}
                      </span>
                    </div>
                    <div className="py-1">
                      {isCandidate && (
                        <a href="/mon-espace" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                          <User className="w-4 h-4 text-blue-500" /> Mon Espace
                        </a>
                      )}
                      <a href="/mon-dossier" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                        <FolderOpen className="w-4 h-4 text-blue-500" /> Mes Dossiers
                      </a>
                      {isAdmin && (
                        <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                          <Settings className="w-4 h-4 text-amber-500" /> Panneau Admin
                        </a>
                      )}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/open-dossier" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition">
                  ⭐ Évaluation gratuite
                </a>
                <button onClick={() => startLogin()} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm transition">
                  Connexion
                </button>
              </>
            )}
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                isActive(href) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </a>
          ))}
          {/* Liens secondaires */}
          <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
            <a href="/eligibility-simulator" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <Shield className="w-4 h-4 text-green-400" /> Simulateur
            </a>
            <a href="/budget-calculator" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <FileText className="w-4 h-4 text-orange-400" /> Calculateur Budget
            </a>
            <a href="/visa-gallery" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <Globe className="w-4 h-4 text-purple-400" /> Galerie Visas
            </a>
            <a href="/blog" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <FileText className="w-4 h-4 text-blue-400" /> Blog
            </a>
            <a href="/about" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <Info className="w-4 h-4 text-blue-400" /> À Propos
            </a>
            <a href="/contact" className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              <Mail className="w-4 h-4 text-blue-400" /> Contact
            </a>
          </div>
          <div className="pt-2 space-y-2 border-t border-gray-100 mt-2">
            {isAuthenticated && displayName ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayEmail}</p>
                    <span className={`text-xs font-medium ${
                      isAdmin ? 'text-amber-600' : 'text-blue-600'
                    }`}>
                      {isAdmin ? '👑 Admin' : '👤 Candidat'}
                    </span>
                  </div>
                </div>
                {isCandidate && (
                  <a href="/mon-espace" className="flex items-center gap-2 py-2.5 px-3 text-blue-700 text-sm font-medium hover:bg-blue-50 rounded-lg transition" onClick={() => setIsMenuOpen(false)}>
                    <User className="w-4 h-4" /> Mon Espace
                  </a>
                )}
                {isAdmin && (
                  <a href="/admin" className="flex items-center gap-2 py-2.5 px-3 text-amber-700 text-sm font-medium hover:bg-amber-50 rounded-lg transition" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="w-4 h-4" /> Panneau Admin
                  </a>
                )}
                <button
                  onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 py-2.5 px-3 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <a href="/open-dossier" className="block w-full text-center bg-amber-500 text-white py-3 rounded-xl font-bold text-sm" onClick={() => setIsMenuOpen(false)}>
                  ⭐ Évaluation gratuite
                </a>
                <button onClick={() => { setIsMenuOpen(false); startLogin(); }} className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold text-sm">
                  Connexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
      {/* Breadcrumb automatique sous le header */}
      <div className="bg-gray-50 border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <AutoBreadcrumb />
        </div>
      </div>
    </div>
  );
}
