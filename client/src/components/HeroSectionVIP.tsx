import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";

interface HeroSectionVIPProps {
  onEvalClick?: () => void;
  logoUrl?: string;
  whatsappNumber?: string;
}

const heroButtonSize = "w-full max-w-[22rem] min-h-14 sm:w-[300px]";

export default function HeroSectionVIP({
  logoUrl = "/logo-3m.webp",
  whatsappNumber = "237698104832",
}: HeroSectionVIPProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const hero = heroRef.current;
    const background = backgroundRef.current;
    if (!hero || !background || typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const updateParallax = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const heroCenter = rect.top + rect.height / 2;
      const progress = Math.max(-1, Math.min(1, (viewportCenter - heroCenter) / (window.innerHeight + rect.height)));
      const strength = window.innerWidth < 768 ? 10 : 24;

      background.style.transform = reduceMotion.matches
        ? "scale(1.04)"
        : `translate3d(0, ${progress * strength}px, 0) scale(1.08)`;
    };

    const requestUpdate = () => {
      if (frame === 0) frame = window.requestAnimationFrame(updateParallax);
    };

    const handleMotionPreference = () => requestUpdate();
    reduceMotion.addEventListener?.("change", handleMotionPreference);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    requestUpdate();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      reduceMotion.removeEventListener?.("change", handleMotionPreference);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  // Apparition en fondu au chargement : titre puis boutons, respect de prefers-reduced-motion.
  const fadeIn = {
    hidden: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 16,
      filter: prefersReducedMotion ? "none" : "blur(4px)",
    },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: 0.85,
            delay: 0.15 + i * 0.18,
            ease: [0.22, 1, 0.36, 1] as const,
          },
    }),
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[72vh] items-center overflow-hidden py-12 text-center text-white sm:min-h-[78vh] sm:py-16 md:min-h-[88vh] md:py-24"
      style={{
        background: "radial-gradient(circle at center, #1e3a8a 0%, #07162c 70%)",
      }}
      data-testid="home-hero"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <picture className="absolute inset-0 block">
          <source
            media="(max-width: 767px)"
            srcSet="/manus-storage/3m-hero-real-woman-man-mobile_335e606e.webp"
            type="image/webp"
          />
          <source
            srcSet="/manus-storage/3m-hero-real-woman-man_f9790b0e.webp"
            type="image/webp"
          />
          <img
            src="/manus-storage/agency_hero_real_woman_man_88aca943.png"
            alt="Voyageurs préparant un projet de mobilité internationale avec 3M TRAVEL AGENCY"
            ref={backgroundRef}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute -inset-[4%] h-[108%] w-[108%] object-cover object-center opacity-85 filter brightness-105 saturate-105 will-change-transform"
            style={{ transform: "translate3d(0, 0, 0) scale(1.08)" }}
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-[#07162c]/75 via-[#0a1d3a]/62 to-[#07162c]/88" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,22,44,.55)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-14 sm:pb-16 md:pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0}
          className="mb-6 flex justify-center"
        >
          <img
            src={logoUrl}
            alt="3M TRAVEL AGENCY"
            width={96}
            height={96}
            decoding="async"
            className="h-16 w-16 rounded-full border-2 border-white/50 bg-white object-cover shadow-xl md:h-24 md:w-24"
          />
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={1}
          className="mb-4 text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] will-change-[opacity,transform] sm:mb-5 sm:text-5xl md:mb-6 md:text-6xl lg:text-7xl xl:text-[6.5rem]"
          data-testid="hero-title"
        >
          3M TRAVEL AGENCY
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={2}
          className="premium-copy-on-dark mx-auto mb-7 max-w-2xl rounded-2xl bg-[#020C3B]/45 px-4 py-3 text-base font-medium !text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] ring-1 ring-white/10 backdrop-blur-[2px] sm:mb-10 sm:text-xl md:text-2xl"
        >
          Centre de préparation et de suivi de dossiers — études, travail, visas — avec des canaux de recrutement autorisés.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          data-testid="hero-cta-group"
        >
          <PublicEvaluationCTA
            project="travail"
            aria-label="Évaluer mon projet gratuitement"
            className={`group relative ${heroButtonSize} flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 px-6 py-4 text-center font-bold text-white shadow-lg shadow-orange-950/25 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.04] hover:from-orange-300 hover:via-orange-500 hover:to-amber-400 hover:shadow-[0_18px_40px_-8px_rgba(249,115,22,0.55)] hover:ring-2 hover:ring-orange-200/70 focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07162c] active:scale-[0.98] will-change-[opacity,transform]`}
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -inset-1 rounded-xl bg-orange-400/0 opacity-0 blur-md transition-all duration-300 group-hover:bg-orange-400/35 group-hover:opacity-100"
              aria-hidden="true"
            />
            <span className="relative z-10 text-sm transition-transform duration-300 group-hover:tracking-wide sm:text-base">
              ÉVALUER MON PROJET — GRATUIT
            </span>
          </PublicEvaluationCTA>
          <Button
            asChild
            variant="outline"
            className={`group relative ${heroButtonSize} flex items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white/5 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.04] hover:border-white/70 hover:bg-white/15 hover:shadow-[0_18px_40px_-10px_rgba(255,255,255,0.35)] hover:ring-2 hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07162c] active:scale-[0.98]`}
          >
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, je souhaite échanger avec un conseiller au sujet de mon projet.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                aria-hidden="true"
              />
              <span className="relative z-10 text-sm transition-transform duration-300 group-hover:tracking-wide sm:text-base">
                PARLER À UN CONSEILLER
              </span>
            </a>
          </Button>
        </motion.div>
      </div>

      <motion.a
        href="#quick-actions-title"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={4}
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-3 py-2 text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-10"
        aria-label="Défiler vers la suite de la page"
        data-testid="hero-scroll-cue"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Découvrir</span>
        <ChevronDown
          className="h-5 w-5 animate-bounce motion-reduce:animate-none"
          aria-hidden="true"
        />
      </motion.a>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          aria-hidden="true"
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
