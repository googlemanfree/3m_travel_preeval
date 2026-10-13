import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";
import { COMPANY_PROFILE } from "@/lib/companyContacts";

const WHATSAPP_HREF = `https://wa.me/${COMPANY_PROFILE.offices.cameroon.whatsappNumber}?text=${encodeURIComponent("Bonjour, je souhaite comprendre le parcours 3M TRAVEL AGENCY.")}`;

export default function HowItWorks() {
  const heroVisual = getServiceVisual("dossier");

  useEffect(() => {
    setPageSeo({
      title: "Comment ça marche : les étapes | 3M TRAVEL AGENCY",
      description:
        "Parcours transparent 3M TRAVEL AGENCY : évaluation gratuite, orientation, ouverture de dossier et suivi — sans promesse de visa, d’emploi ou d’admission.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  const steps = [
    {
      number: 1,
      title: "Évaluation gratuite de votre projet",
      description:
        "Indiquez destination et type de projet (travail, études, visite). Nous structurons les informations utiles — sans engagement et sans promesse de résultat.",
      icon: Sparkles,
    },
    {
      number: 2,
      title: "Orientation claire",
      description:
        "Vous recevez un cadrage des parcours réalistes, des pièces à préparer et des sources officielles à vérifier. La décision reste aux autorités et employeurs.",
      icon: FileText,
    },
    {
      number: 3,
      title: "Ouverture de dossier (si vous poursuivez)",
      description:
        "Après clarification, vous pouvez ouvrir un dossier suivi. Les honoraires sont confirmés par écrit avant tout paiement.",
      icon: ShieldCheck,
    },
    {
      number: 4,
      title: "Constitution et dépôt des pièces",
      description:
        "Vous déposez les documents dans votre espace ou à l’agence. Chaque pièce est vérifiée avant envoi aux interlocuteurs compétents.",
      icon: CheckCircle2,
    },
    {
      number: 5,
      title: "Suivi transparent jusqu’à la décision",
      description:
        "Vous voyez l’étape en cours. L’emploi, l’admission et le visa relèvent exclusivement des autorités et partenaires concernés.",
      icon: Clock,
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f1f5f9_45%,_#e2e8f0_100%)]">
      <section className="relative min-h-[58vh] overflow-hidden px-4 pb-14 pt-20 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041428]/94 via-[#0a3264]/74 to-[#0e5b9f]/40" />
        <div className="relative z-10 mx-auto flex min-h-[42vh] max-w-5xl flex-col justify-end">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl">
            3M TRAVEL AGENCY
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Comment ça marche ?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/95 sm:text-lg">
            Un parcours clair : évaluation → orientation → dossier suivi. Pas de promesse de visa, d’emploi ou d’admission.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/?project=travail#evaluation-multi"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
              data-testid="how-it-works-eval-cta"
            >
              Évaluer mon profil gratuitement
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500/25"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp {COMPANY_PROFILE.offices.cameroon.whatsappDisplay}
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">
        <ol className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="flex gap-5 border-b border-slate-200/80 pb-6">
                <div className="flex flex-col items-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-800 text-sm font-black text-white">
                    {step.number}
                  </span>
                  {index < steps.length - 1 ? <span className="mt-2 h-full w-px bg-blue-200" aria-hidden="true" /> : null}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <Icon className="h-6 w-6 text-blue-800" aria-hidden="true" />
                  <h2 className="mt-2 text-lg font-black text-slate-950">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <ProofGallerySection
          initialFilter="visas"
          lockFilter
          collapsedCount={3}
          hideWhenEmpty
          className="bg-white/70 px-0 py-10"
          titleFr="Preuves de dossiers accompagnés"
          titleEn="Proofs from supported cases"
          leadFr="Extraits anonymisés de pièces suivies depuis Yaoundé — pour illustrer le sérieux du suivi, sans garantir un résultat."
          leadEn="Redacted excerpts of files supported from Yaoundé — to illustrate serious follow-up, without guaranteeing an outcome."
        />

        <section aria-labelledby="faq-how-title" className="border-t border-slate-200/80 pt-8">
          <h2 id="faq-how-title" className="text-2xl font-black text-slate-950">Questions fréquentes</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950">Combien de temps prend le processus ?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                L’orientation initiale est rapide. Les délais consulaires, employeurs ou établissements varient selon le pays et la période — confirmeés au cas par cas.
              </p>
            </article>
            <article className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950">Dois-je payer avant l’évaluation ?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Non. L’évaluation initiale est gratuite. Les honoraires d’ouverture de dossier sont communiqués avant tout règlement.
              </p>
            </article>
            <article className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950">Puis-je déposer mes documents en ligne ?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Oui, via l’espace candidat sécurisé, ou en agence à Yaoundé selon votre situation.
              </p>
            </article>
            <article className="border-b border-slate-200 pb-4">
              <h3 className="font-bold text-slate-950">Garantissez-vous un visa ou un emploi ?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Non. 3M prépare et suit le dossier. La décision appartient aux autorités, employeurs et établissements compétents.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl bg-blue-900 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-black">Prêt à cadrer votre projet ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Commencez par l’évaluation gratuite — sans ouvrir de dossier tout de suite.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/?project=travail#evaluation-multi">
              <Button className="min-h-12 rounded-xl bg-white px-6 text-sm font-black text-blue-950 hover:bg-blue-50">
                Évaluer mon profil
              </Button>
            </Link>
            <Link href="/travail">
              <Button variant="outline" className="min-h-12 rounded-xl border-white/40 bg-transparent px-6 text-sm font-bold text-white hover:bg-white/10">
                Hub Travail
              </Button>
            </Link>
            <Link href="/etudes">
              <Button variant="outline" className="min-h-12 rounded-xl border-white/40 bg-transparent px-6 text-sm font-bold text-white hover:bg-white/10">
                Hub Études
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
