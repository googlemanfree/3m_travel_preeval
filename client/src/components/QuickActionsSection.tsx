import { ArrowRight } from "lucide-react";
import { QUICK_ACTIONS } from "@/data/serviceCatalog";

/** Grille d'intentions : chaque carte mène directement à l'action, sans passer par un menu. */
export function QuickActionsGrid({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`} data-testid="quick-actions">
      {QUICK_ACTIONS.map((action) => (
        <li key={action.id}>
          <a
            href={action.href}
            className="group flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-700 group-hover:text-white" aria-hidden="true">
              <action.icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black leading-5 text-slate-950">{action.title}</span>
              <span className="mt-0.5 block text-xs leading-4 text-slate-500">{action.hint}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function QuickActionsSection() {
  return (
    <section aria-labelledby="quick-actions-title" className="bg-white pb-6 pt-10 md:pt-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 text-center md:mb-8">
          <h2 id="quick-actions-title" className="text-2xl font-black text-slate-950 md:text-3xl">Que voulez-vous faire ?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">Choisissez votre besoin : nous vous orientons vers la bonne démarche, de la demande au suivi.</p>
        </div>
        <QuickActionsGrid />
        <p className="mt-5 text-center text-sm text-slate-600">
          Vous ne trouvez pas votre démarche ? <a href="/services" className="font-bold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Voir tous nos services</a>
        </p>
      </div>
    </section>
  );
}
