import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import { useLanguage } from "@/contexts/LanguageContext";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";

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
  const { t, language } = useLanguage();
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
      const progress = Math.max(
        -1,
        Math.min(1, (viewportCenter - heroCenter) / (window.innerHeight + rect.height)),
      );
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

  const fadeIn = {
    hidden: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 14,
    },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: 0.7,
            delay: 0.08 + i * 0.12,
            ease: [0.22, 1, 0.36, 1] as const,
          },
    }),
  };

  const advisorWhatsApp = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    t(
      "Bonjour 3M TRAVEL AGENCY, je souhaite échanger avec un conseiller au sujet de mon projet.",
      "Hello 3M TRAVEL AGENCY, I would like to speak with an advisor about my project.",
    ),
  )}`;

  return (
    <section
      key={language}
      ref={heroRef}
      className="relative flex min-h-[72vh] items-center justify-center overflow-hidden px-4 py-14 text-center sm:min-h-[78vh] sm:px-6 sm:py-16 md:min-h-[86vh] md:py-20"
      style={{
        background: "radial-gradient(circle at center, #1e3a8a 0%, #07162c 70%)",
      }}
      data-testid="home-hero"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            alt={t(
              "Voyageurs préparant un projet de mobilité internationale avec 3M TRAVEL AGENCY",
              "Travellers preparing an international mobility project with 3M TRAVEL AGENCY",
            )}
            ref={backgroundRef}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute -inset-[4%] h-[108%] w-[108%] object-cover object-center opacity-95 brightness-110 saturate-110 will-change-transform"
            style={{ transform: "translate3d(0, 0, 0) scale(1.08)" }}
            data-testid="hero-background-image"
          />
        </picture>
        {/* Voile léger : l’image reste visible autour de la carte maquette. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07162c]/48 via-[#0a1d3a]/38 to-[#07162c]/72" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,22,44,.58)_0%,rgba(7,22,44,.3)_46%,transparent_80%)]" />
      </div>

      <div className="group relative z-10 mx-auto w-full max-w-5xl px-5 py-10 text-white sm:px-10 sm:py-14 md:px-14">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0}
          className="mb-5 flex justify-center sm:mb-6"
        >
          <img
            src={logoUrl}
            alt="3M TRAVEL AGENCY"
            width={128}
            height={128}
            decoding="async"
            fetchPriority="high"
            className="h-20 w-20 rounded-full border-[3px] border-white/70 bg-white object-cover shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out group-hover:scale-[1.03] group-hover:rotate-1 motion-reduce:transition-none sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32"
            data-testid="hero-logo"
          />
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={0.5}
          className="text-4xl font-extrabold uppercase tracking-tight text-white drop-shadow-[0_3px_16px_rgba(0,0,0,0.55)] transition-[transform,text-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_5px_20px_rgba(0,0,0,0.7)] motion-reduce:transition-none sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.75rem]"
          data-testid="hero-title"
        >
          {INTERNATIONAL_BRAND.publicName}
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={1}
          className="mt-4 text-2xl font-black tracking-tight text-amber-200 drop-shadow-[0_3px_12px_rgba(0,0,0,0.5)] sm:text-3xl md:text-4xl lg:text-5xl"
          data-testid="hero-tagline"
        >
          {t(INTERNATIONAL_BRAND.slogan.fr, INTERNATIONAL_BRAND.slogan.en)}
        </motion.p>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={1.5}
          className="mt-3 text-lg font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-xl md:text-2xl"
          data-testid="hero-support"
        >
          {t(INTERNATIONAL_BRAND.headline.fr, INTERNATIONAL_BRAND.headline.en)}
        </motion.p>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={2}
          className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-xs md:text-sm"
          data-testid="hero-corridor"
        >
          {t(INTERNATIONAL_BRAND.categories.fr, INTERNATIONAL_BRAND.categories.en)}
        </motion.p>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={2.5}
          className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-base sm:leading-8"
          data-testid="hero-body"
        >
          {t(INTERNATIONAL_BRAND.heroBody.fr, INTERNATIONAL_BRAND.heroBody.en)}
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          data-testid="hero-cta-group"
        >
          <PublicEvaluationCTA
            project="travail"
            aria-label={t("Évaluer mon projet gratuitement", "Evaluate my project for free")}
            className={`group/cta relative ${heroButtonSize} flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 px-6 py-4 text-center font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-950/20 transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:from-orange-300 hover:via-orange-500 hover:to-amber-400 hover:shadow-[0_14px_32px_-10px_rgba(249,115,22,0.5)] hover:ring-2 hover:ring-orange-200/70 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none`}
          >
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 ease-out group-hover/cta:translate-x-full motion-reduce:transition-none"
              aria-hidden="true"
            />
            <span className="relative z-10 text-sm sm:text-base">
              {t(INTERNATIONAL_BRAND.cta.evaluate.fr, INTERNATIONAL_BRAND.cta.evaluate.en)}
            </span>
          </PublicEvaluationCTA>
          <Button
            asChild
            variant="outline"
            className={`group/cta relative ${heroButtonSize} flex items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-white px-6 py-4 text-center font-bold uppercase tracking-wide text-slate-900 shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:border-slate-400 hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none`}
          >
            <a href={advisorWhatsApp} target="_blank" rel="noopener noreferrer">
              <span className="relative z-10 text-sm sm:text-base">
                {t(INTERNATIONAL_BRAND.cta.advisor.fr, INTERNATIONAL_BRAND.cta.advisor.en)}
              </span>
            </a>
          </Button>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          custom={3.5}
          className="mx-auto mt-7 max-w-xl text-xs leading-5 text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-sm"
          data-testid="hero-trust"
        >
          {t(INTERNATIONAL_BRAND.heroTrust.fr, INTERNATIONAL_BRAND.heroTrust.en)}
        </motion.p>
      </div>

      <motion.a
        href="#home-talent-corridor"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={4}
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-3 py-2 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:bottom-10"
        aria-label={t("Défiler vers la suite de la page", "Scroll to the rest of the page")}
        data-testid="hero-scroll-cue"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{t("Découvrir", "Discover")}</span>
        <ChevronDown
          className="h-5 w-5 animate-bounce motion-reduce:animate-none"
          aria-hidden="true"
        />
      </motion.a>
    </section>
  );
}
