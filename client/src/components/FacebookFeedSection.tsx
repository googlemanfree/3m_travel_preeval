import { ExternalLink, Facebook, Mail, MessageCircle, ShieldCheck } from "lucide-react";

export default function FacebookFeedSection() {
  return (
    <section className="bg-gradient-to-b from-blue-50/60 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3.5 py-1.5 text-xs font-semibold text-blue-800">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>Informations et échanges vérifiables</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Restons en contact avec 3M Travel
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-600">
            Consultez nos canaux publics ou contactez directement l’agence. Les publications, avis et statistiques provenant de plateformes tierces ne sont affichés ici que lorsqu’une source vérifiable est disponible.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <Facebook className="h-8 w-8 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black text-slate-950">Page Facebook</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Retrouvez les informations publiées directement sur la page Facebook de 3M Travel.
            </p>
            <a
              href="https://www.facebook.com/3mtravelcm"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900"
            >
              Ouvrir Facebook <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <MessageCircle className="h-8 w-8 text-emerald-700" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black text-slate-950">Échange direct</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Posez une question générale à l’agence via WhatsApp ; un conseiller confirme ensuite les éléments applicables à votre situation.
            </p>
            <a
              href="https://wa.me/237698104832"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900"
            >
              Écrire sur WhatsApp <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <Mail className="h-8 w-8 text-blue-700" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black text-slate-950">Recevoir une réponse</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Utilisez le formulaire de contact pour toute demande nécessitant une réponse par e-mail ou un suivi administratif.
            </p>
            <a
              href="/contact"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900"
            >
              Ouvrir le contact <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
