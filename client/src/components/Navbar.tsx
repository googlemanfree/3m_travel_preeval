import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { startLogin } from '@/const';
import { LogOut, User, Settings, ChevronDown, Menu, X, Plane, BookOpen, Globe, FolderOpen, Shield } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
    { href: '/admin/login', label: 'Admin', icon: Shield, subtle: true },
  ];

  return (
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
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(({ href, label, icon: Icon, subtle }) => (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-blue-600 ${
                  isActive(href) ? 'text-blue-600' : subtle ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-semibold text-sm transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? '👑 Administrateur' : '👤 Utilisateur'}
                      </span>
                    </div>
                    <div className="py-1">
                      <a href="/mon-espace" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                        <User className="w-4 h-4 text-blue-500" /> Mon Espace
                      </a>
                      <a href="/mon-dossier" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                        <FolderOpen className="w-4 h-4 text-blue-500" /> Mes Dossiers
                      </a>
                      {user.role === 'admin' && (
                        <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition" onClick={() => setIsProfileOpen(false)}>
                          <Settings className="w-4 h-4 text-amber-500" /> Panneau Admin
                        </a>
                      )}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => { setIsProfileOpen(false); logout(); }}
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
          <div className="pt-3 space-y-2 border-t border-gray-100 mt-2">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsMenuOpen(false); logout(); }}
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
  );
}
