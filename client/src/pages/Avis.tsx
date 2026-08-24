import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function Avis() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Transparence 3M Travel</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Retours d’expérience et qualité de service
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600">
          Nous ne publions pas de notes, statistiques ou témoignages attribués à des clients sans source vérifiable et autorisation adaptée. Pour évaluer un projet, échangez directement avec l’équipe ; pour transmettre un retour, utilisez le parcours prévu à cet effet.
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
          <Link
            href="/?project=travail#evaluation-multi"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
          >
            Commencer l’évaluation gratuite
          </Link>
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
    </main>
  );
}
