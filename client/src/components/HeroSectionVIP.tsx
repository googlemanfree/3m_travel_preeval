import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface HeroSectionVIPProps {
  onEvalClick?: () => void;
  logoUrl?: string;
  whatsappNumber?: string;
}

export default function HeroSectionVIP({ 
  onEvalClick, 
  logoUrl = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg",
  whatsappNumber = "237698104832"
}: HeroSectionVIPProps) {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" as const },
    }),
  };

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden text-center text-white"
      style={{
        background: "radial-gradient(circle at center, #1e3a8a 0%, #07162c 70%)",
      }}
    >
      {/* Blobs décoratifs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#7cb9e8] blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Badge animé */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-6"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <Star className="w-4 h-4 text-yellow-300" />
          </motion.div>
          ⭐ Évaluation Gratuite en 24h : Votre Passeport pour le Monde !
        </motion.div>

        {/* Logo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-6"
        >
          <img
            src={logoUrl}
            alt="3M Travel & Services"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/30 mx-auto shadow-lg"
          />
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-3"
        >
          3M Travel & Services
        </motion.h1>

        {/* Sous-titre */}
        <motion.h2
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="text-xl md:text-2xl text-slate-300 mb-6"
        >
          Votre Avenir Commence Ici : <span className="text-blue-400 font-bold">Visa & Immigration Simplifiés</span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Découvrez les meilleures opportunités de mobilité internationale. Remplissez notre formulaire gratuit et laissez nos experts vous guider vers votre projet d'études, de travail ou d'immigration, avec un accompagnement personnalisé et des solutions adaptées à votre profil unique.
        </motion.p>

        {/* CTAs principales */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
        >
          <Button
            asChild
            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Link href="/evaluation-primaire">🚀 Démarrer mon Évaluation</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 rounded-lg"
          >
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour, j'aimerais être recontacté(e) par un conseiller 3M Travel.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Discuter avec un Expert (WhatsApp)
            </a>
          </Button>
        </motion.div>

        {/* Boutons Connexion/Inscription */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5.5}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          <Button
            asChild
            variant="outline"
            className="border-blue-400 text-blue-300 hover:bg-blue-500/20 font-semibold px-6 py-3 rounded-lg"
          >
            <a href="/login">🔑 Accès Client</a>
          </Button>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            <a href="/register">✨ Créez votre Compte Gratuit</a>
          </Button>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={6}
          className="flex flex-col sm:flex-row gap-8 justify-center border-t border-white/10 pt-8"
        >
          <div>
            <p className="text-2xl md:text-3xl font-bold">+1500</p>
            <p className="text-sm text-slate-400">Dossiers Traités avec Succès</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold">98%</p>
            <p className="text-sm text-slate-400">Clients Satisfaits</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold">24h</p>
            <p className="text-sm text-slate-400">Réponse Garantie</p>
          </div>
        </motion.div>
      </div>

      {/* Divider SVG */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
