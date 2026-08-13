import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PROCEDURE_VISUALS } from "@/data/procedureVisuals";

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
        {/* Visuel éditorial et filigranes de mobilité internationale */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/manus-storage/agency_hero_multicultural_ad8d81b1.png"
          alt="3M Travel Agency - Voyage et Mobilité Internationale"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-overlay filter brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07162c]/90 via-[#0a1d3a]/80 to-[#07162c]/95" />
        <div className="absolute -right-12 top-8 text-[8rem] leading-none opacity-[0.12] select-none">🇨🇦</div>
        <div className="absolute left-6 bottom-4 text-[7rem] leading-none opacity-[0.12] select-none">🇪🇺</div>
        <div className="absolute right-1/4 bottom-10 text-[7rem] leading-none opacity-[0.12] select-none">🇺🇸</div>
        <div className="absolute top-10 left-1/3 w-72 h-72 rounded-full bg-blue-500 blur-3xl opacity-15" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-indigo-500 blur-3xl opacity-15" />
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

        {/* Logo agrandi avec effet lumineux professionnel */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-6 relative inline-block"
        >
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400 opacity-75 blur-md animate-pulse" />
          <img
            src={logoUrl}
            alt="3M Travel Agency"
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/40 mx-auto shadow-2xl object-cover bg-white"
          />
        </motion.div>

        {/* Titre principal avec typographie moderne */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-blue-100 to-sky-200 bg-clip-text text-transparent drop-shadow-md"
        >
          3M Travel Agency
        </motion.h1>

        {/* Sous-titre percutant */}
        <motion.h2
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="text-xl md:text-2xl text-blue-200 font-medium mb-6"
        >
          Votre Avenir Commence Ici — <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">Voyages & Immigrations d'Exception</span>
        </motion.h2>

        {/* Description de marque haut de gamme */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="text-slate-200 text-base md:text-lg max-w-3xl mx-auto mb-8 leading-relaxed font-light"
        >
          Spécialistes de la mobilité internationale vers le <strong className="text-white font-semibold">Canada</strong>, l'<strong className="text-white font-semibold">Europe Schengen</strong> et les <strong className="text-white font-semibold">États-Unis</strong>. Nous transformons vos projets d'études, de carrière ou d'installation en réalité grâce à un accompagnement sur-mesure et une expertise reconnue.
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

        {/* Repères destinations */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5.8}
          className="flex flex-wrap justify-center gap-2 mb-7"
          aria-label="Destinations principales"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">🇨🇦 Canada</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">🇪🇺 Schengen</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">🌍 Mobilité internationale</span>
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
