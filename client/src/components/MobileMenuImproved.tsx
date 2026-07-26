import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/button';
import {
  Home, Plane, BookOpen, FileText, Map, Globe, Search, User,
  Shield, Star, LogIn, UserPlus
} from 'lucide-react';

interface MobileMenuImprovedProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onEvalClick?: () => void;
}

export function MobileMenuImproved({
  mobileOpen,
  setMobileOpen,
  isAuthenticated,
  isAdmin,
  onEvalClick
}: MobileMenuImprovedProps) {
  return (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden bg-gradient-to-b from-white to-gray-50 border-t-2 border-[#1E3A8A] px-4 py-6 flex flex-col gap-0 shadow-lg"
        >
          {/* Navigation Section */}
          <div className="mb-6">
            <div className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3 px-2">
              Navigation
            </div>
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <Home className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Accueil</span>
              </motion.div>
            </Link>
            <Link href="/flights" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <Plane className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Vols</span>
              </motion.div>
            </Link>
          </div>

          {/* Resources Section */}
          <div className="mb-6 border-t border-gray-200 pt-4">
            <div className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3 px-2">
              Ressources
            </div>
            <Link href="/procedures" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <BookOpen className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Procédures</span>
              </motion.div>
            </Link>
            <Link href="/visa-types" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <FileText className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Types de Visa</span>
              </motion.div>
            </Link>
            <Link href="/destinations" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <Map className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Destinations</span>
              </motion.div>
            </Link>
            <Link href="/guide" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <Globe className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Guide Complet</span>
              </motion.div>
            </Link>
            <Link href="/mon-dossier" onClick={() => setMobileOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-[#1E3A8A] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <Search className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                <span>Suivi</span>
              </motion.div>
            </Link>
          </div>

          {/* Account Section */}
          <div className="mb-6 border-t border-gray-200 pt-4">
            <div className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3 px-2">
              Compte
            </div>
            {isAuthenticated ? (
              <Link href="/mon-espace" onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span>Mon Espace</span>
                </motion.div>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <LogIn className="w-5 h-5 flex-shrink-0" />
                    <span>Connexion</span>
                  </motion.div>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 text-sm font-semibold text-[#1E3A8A] hover:text-[#152E5F] py-3 px-2 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5 flex-shrink-0" />
                    <span>Inscription</span>
                  </motion.div>
                </Link>
              </>
            )}
          </div>

          {/* Admin Section */}
          {!isAdmin && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <Link href="/admin/login" onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-sm font-semibold text-purple-700 hover:text-purple-900 py-3 px-2 rounded-lg hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span>Admin</span>
                </motion.div>
              </Link>
            </div>
          )}
          {isAdmin && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 text-sm font-semibold text-purple-700 hover:text-purple-900 py-3 px-2 rounded-lg hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span>Administration</span>
                </motion.div>
              </Link>
            </div>
          )}

          {/* CTA Section */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            {onEvalClick && (
              <motion.div whileTap={{ scale: 0.95 }} className="mb-3">
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    onEvalClick();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all duration-200 py-3"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Évaluation gratuite
                </Button>
              </motion.div>
            )}

            {/* Language Switcher */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Langue
              </div>
              <LanguageSwitcher showLabel={false} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
