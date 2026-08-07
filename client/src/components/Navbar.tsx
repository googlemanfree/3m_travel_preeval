import React, { useState } from 'react';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluationButton from './EvaluationButton';

const menuItems = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/vols', label: 'Vols', icon: '✈️' },
  { href: '/procedures', label: 'Procédures', icon: '📖' },
  { href: '/ressources', label: 'Ressources', icon: '🌐' },
  { href: '/evaluation-rapide-enhanced', label: 'Évaluation Rapide', icon: '⚡' },
  { href: '/mon-espace', label: 'Suivi de dossier', icon: '📂' },
  { href: '/evisas', label: 'E-Visa', icon: '📱', highlight: true },
];

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

  // Animation du hamburger
  const hamburgerVariants = {
    open: { rotate: 90 },
    closed: { rotate: 0 }
  };

  // Animation du menu mobile
  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  // Animation des items du menu
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 }
    })
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* 1. LOGO & BRANDING MODERNE */}
          <a href="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
            <img
              src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"
              alt="3M Travel & Services"
              className="h-12 w-auto object-contain"
            />
          </a>

          {/* 2. NAVIGATION DESKTOP ÉLÉGANTE */}
          <nav className="hidden lg:flex items-center space-x-1 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/80">
            {menuItems.map((item: any) => {
              const isHighlight = item.highlight;
              return isHighlight ? (
                <button 
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ) : (
                <button 
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-200 shadow-none hover:shadow-sm"
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              );
            })}
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

                    <button
                      onClick={() => { setLocation("/mon-espace"); setIsProfileOpen(false); }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                    >
                      <span>📂</span> Tableau de bord / Dossier
                    </button>
                    
                    <button
                      onClick={() => { setLocation("/evaluation"); setIsProfileOpen(false); }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition w-full text-left"
                    >
                      <span>⭐</span> Nouvelle Évaluation
                    </button>

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
                <EvaluationButton variant="primary" size="md" />
                <button 
                  onClick={() => setLocation("/login")}
                  className="bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
                >
                  👤 Mon Espace
                </button>
              </>
            )}
          </div>

          {/* 4. HAMBURGER MOBILE AVEC ANIMATION */}
          <div className="flex lg:hidden items-center">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-2xl bg-gray-50 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition focus:outline-none"
              animate={isMenuOpen ? "open" : "closed"}
              variants={hamburgerVariants}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>

        </div>
      </div>

      {/* 5. MENU MOBILE FLUIDE AVEC ANIMATIONS */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="lg:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 pt-3 pb-8 shadow-2xl"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Profil utilisateur */}
            {candidate && (
              <motion.div
                className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl mb-4 flex items-center gap-3 border border-blue-100/60"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="w-10 h-10 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                  {getInitial(candidate.fullName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a2540]">{candidate.fullName || 'Candidat'}</p>
                  <p className="text-xs text-blue-600 font-medium truncate">{candidate.email}</p>
                </div>
              </motion.div>
            )}

            {/* Items de navigation */}
            <div className="space-y-1 mb-4">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.href}
                  onClick={() => { setLocation(item.href); setIsMenuOpen(false); }}
                  className="block px-3 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={candidate ? index + 1 : index}
                >
                  <span>{item.icon}</span> {item.label}
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <motion.div
              className="border-t border-gray-100 my-3"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              custom={menuItems.length + 1}
            />

            {/* Boutons d'action */}
            {candidate ? (
              <motion.button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-center bg-rose-50 text-rose-600 py-3 rounded-xl font-bold transition hover:bg-rose-100"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={menuItems.length + 2}
              >
                🚪 Se déconnecter
              </motion.button>
            ) : (
              <motion.div
                className="space-y-2"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={menuItems.length + 2}
              >
                <button 
                  onClick={() => { setLocation("/evaluation"); setIsMenuOpen(false); }}
                  className="block w-full text-center bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all" 
                >
                  ⭐ Évaluer mon profil
                </button>
                <button 
                  onClick={() => { setLocation("/login"); setIsMenuOpen(false); }}
                  className="block w-full text-center bg-blue-50 text-blue-700 py-3 rounded-xl font-bold border border-blue-100 transition-all" 
                >
                  👤 Mon Espace
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
