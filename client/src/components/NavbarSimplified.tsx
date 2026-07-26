import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface NavbarSimplifiedProps {
  onEvalClick?: () => void;
}

export function NavbarSimplified({ onEvalClick }: NavbarSimplifiedProps) {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-lg'
          : 'bg-white shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src={LOGO_URL}
              alt="3M Travel & Services"
              className="h-10 w-10 rounded-full"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-sm text-[#1E3A8A]">
                3M Travel & Services
              </span>
              <span className="text-xs text-gray-600">
                Votre mobilité, notre expertise
              </span>
            </div>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          <Link href="/">
            <motion.div
              whileHover={{ color: '#1E3A8A' }}
              className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              Accueil
            </motion.div>
          </Link>
          <Link href="/flights">
            <motion.div
              whileHover={{ color: '#1E3A8A' }}
              className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              Vols
            </motion.div>
          </Link>
          <Link href="/procedures">
            <motion.div
              whileHover={{ color: '#1E3A8A' }}
              className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              Procédures
            </motion.div>
          </Link>

          {/* Resources Dropdown */}
          <div className="relative group">
            <motion.button
              whileHover={{ color: '#1E3A8A' }}
              className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] transition-colors flex items-center gap-1"
              onClick={() => setResourcesOpen(!resourcesOpen)}
            >
              Ressources
              <ChevronDown className="w-4 h-4" />
            </motion.button>

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            >
              <Link href="/visa-types">
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                  Types de Visa
                </div>
              </Link>
              <Link href="/destinations">
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                  Destinations
                </div>
              </Link>
              <Link href="/guide">
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                  Guide Complet
                </div>
              </Link>
              <Link href="/simulateur-eligibilite">
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                  Simulateur
                </div>
              </Link>
              <Link href="/comparateur-destinations">
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                  Comparateur
                </div>
              </Link>
            </motion.div>
          </div>

          <Link href="/mon-dossier">
            <motion.div
              whileHover={{ color: '#1E3A8A' }}
              className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] transition-colors cursor-pointer"
            >
              Suivre mon dossier
            </motion.div>
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <motion.div
                whileHover={{ color: '#9333EA' }}
                className="text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
              >
                Admin
              </motion.div>
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher showLabel={false} />

          {onEvalClick && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onEvalClick}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-4 py-2 rounded-lg transition-all duration-200"
              >
                ⭐ Évaluation gratuite
              </Button>
            </motion.div>
          )}

          {isAuthenticated ? (
            <Link href="/mon-espace">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold px-4 py-2 rounded-lg transition-all duration-200">
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
                    className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Connexion
                  </Button>
                </motion.div>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold px-4 py-2 rounded-lg transition-all duration-200">
                    Inscription
                  </Button>
                </motion.div>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden bg-gradient-to-b from-white to-gray-50 border-t-2 border-[#1E3A8A] px-4 py-4 flex flex-col gap-3 shadow-lg"
        >
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Accueil
            </div>
          </Link>
          <Link href="/flights" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Vols
            </div>
          </Link>
          <Link href="/procedures" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Procédures
            </div>
          </Link>
          <Link href="/visa-types" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Types de Visa
            </div>
          </Link>
          <Link href="/destinations" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Destinations
            </div>
          </Link>
          <Link href="/guide" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Guide Complet
            </div>
          </Link>
          <Link href="/mon-dossier" onClick={() => setMobileOpen(false)}>
            <div className="text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-2 transition-colors">
              Suivre mon dossier
            </div>
          </Link>

          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}>
              <div className="text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 transition-colors">
                Admin
              </div>
            </Link>
          )}

          <div className="border-t border-gray-200 pt-3 mt-3">
            {onEvalClick && (
              <Button
                onClick={() => {
                  setMobileOpen(false);
                  onEvalClick();
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all duration-200 mb-3"
              >
                ⭐ Évaluation gratuite
              </Button>
            )}

            {isAuthenticated ? (
              <Link href="/mon-espace" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold rounded-lg transition-all duration-200">
                  Mon Espace
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200 mb-2"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#1E3A8A] hover:bg-[#152E5F] text-white font-bold rounded-lg transition-all duration-200">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Langue
            </div>
            <LanguageSwitcher showLabel={false} />
          </div>
        </motion.div>
      )}
    </header>
  );
}
