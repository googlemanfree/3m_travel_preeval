import { useEffect } from "react";
import { CheckCircle2, MessageCircle, ShieldCheck, Star } from "lucide-react";
import SubmitReview from "./SubmitReview";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import ApprovedReviewsSection from "@/components/ApprovedReviewsSection";
import { ReviewsErrorBoundary } from "@/components/ReviewsErrorBoundary";
import { trpc } from "@/lib/trpc";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { getServiceVisual } from "@/data/premiumVisuals";

const AGGREGATE_RATING_SCRIPT_ID = "avis-aggregate-rating-jsonld";

export default function Avis() {
  const { data: stats } = trpc.customerReview.getStats.useQuery();
  const { data: ratingBreakdown } = trpc.customerReview.getRatingBreakdown.useQuery();
  const visual = getServiceVisual("recrutement");

  useEffect(() => {
    const existing = document.getElementById(AGGREGATE_RATING_SCRIPT_ID);
    if (existing) existing.remove();

    // N'émettre AggregateRating que si des avis réellement approuvés existent :
    // pas de note fabriquée ni de volume gonflé.
    if (!stats || stats.approvedReviews <= 0) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = AGGREGATE_RATING_SCRIPT_ID;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${COMPANY_PROFILE.website}/#localbusiness`,
      name: COMPANY_PROFILE.legalName,
      url: COMPANY_PROFILE.website,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: stats.averageRating,
        reviewCount: stats.approvedReviews,
        bestRating: 5,
        worstRating: 1,
      },
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(AGGREGATE_RATING_SCRIPT_ID)?.remove();
    };
  }, [stats]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative mx-auto mb-4 max-w-4xl overflow-hidden rounded-3xl px-8 py-10 text-white shadow-xl sm:px-12">
        <PremiumCoverImage visual={visual} priority className="absolute inset-0" imgClassName="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/90 via-[#0a3264]/78 to-[#0e5b9f]/50" />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">Preuve sociale responsable</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Des retours vérifiés, pas des promesses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50">Chaque témoignage est soumis, vérifié et approuvé avant publication.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Transparence 3M TRAVEL AGENCY</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Retours d’expérience et qualité de service
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600">
          Nous ne publions pas de notes, statistiques ou témoignages attribués à des clients sans source vérifiable et autorisation adaptée. Les avis affichés ci-dessous sont des retours réellement soumis, vérifiés et approuvés par l’équipe avant publication, avec le consentement explicite de leur auteur.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <ShieldCheck className="h-7 w-7 text-blue-700" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black text-slate-950">Information vérifiable</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Les conditions, étapes et délais indicatifs affichés sur le site ne remplacent jamais une confirmation individuelle d’un conseiller.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <CheckCircle2 className="h-7 w-7 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-black text-slate-950">Votre dossier reste suivi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Les demandes soumises reçoivent une référence et sont traitées par l’équipe selon le parcours applicable.
            </p>
          </article>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <PublicEvaluationCTA
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
          >
            Commencer l’évaluation gratuite
          </PublicEvaluationCTA>
          <a
            href="https://wa.me/237698104832"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-800 hover:bg-blue-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Échanger avec l’agence
          </a>
        </div>
      </section>

      {stats && stats.approvedReviews > 0 && ratingBreakdown && (
        <section className="mx-auto mt-4 max-w-4xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-12" aria-labelledby="rating-breakdown-title">
          <h2 id="rating-breakdown-title" className="text-lg font-black text-slate-950">Répartition des notes</h2>
          <div className="mt-5 space-y-2.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const starCount = ratingBreakdown[star] ?? 0;
              const percent = stats.approvedReviews > 0 ? Math.round((starCount / stats.approvedReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="flex w-12 shrink-0 items-center gap-1 text-xs font-bold text-slate-600">
                    {star} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${star} étoiles : ${percent}%`}>
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-500">{starCount}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ReviewsErrorBoundary>
        <ApprovedReviewsSection />
      </ReviewsErrorBoundary>

      <section className="mx-auto mt-4 max-w-4xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-12">
        <section id="deposer-un-avis" aria-labelledby="deposer-un-avis-title">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Retour d’expérience</p>
            <h2 id="deposer-un-avis-title" className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
              Partagez votre expérience
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Votre retour est transmis à l’équipe pour modération. Il n’est jamais affiché automatiquement et ne peut être publié qu’après vérification et accord de publication.
            </p>
          </div>
          <SubmitReview embedded />
        </section>
      </section>
    </main>
  );
}
