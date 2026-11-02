import { useEffect } from "react";
import { Link } from "wouter";
import { ServicePageShell } from "@/components/ServicePageShell";
import { trpc } from "@/lib/trpc";
import { setPageSeo } from "@/lib/pageSeo";

/** « Quoi de neuf » : changements de règles et de contenu, datés, rédigés et publiés par l'équipe. */
export default function WhatsNew() {
  useEffect(() => {
    setPageSeo({ title: "Quoi de neuf : changements de règles et de contenu | 3M TRAVEL AGENCY", description: "Les derniers changements de règles, de procédures et de contenu relevés par 3M TRAVEL AGENCY, avec leur date et la page concernée." });
  }, []);
  const updates = trpc.adminContent.publicUpdates.useQuery(undefined, { retry: false });
  const items = updates.data ?? [];
  return (
    <ServicePageShell
      eyebrow="Mises à jour"
      title="Quoi de neuf"
      introduction="Les changements de règles, de procédures et de contenu que nous avons relevés, avec leur date. Vérifiez toujours auprès de l'autorité concernée avant de déposer un dossier."
      primaryHref="/#evaluation-multi"
      primaryLabel="Évaluer mon profil"
      secondaryHref="/faq"
      secondaryLabel="Questions fréquentes"
      notice="Ces mises à jour sont indicatives et ne remplacent pas les sources officielles. Elles ne garantissent ni visa ni délai."
    >
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-labelledby="whats-new-title" data-testid="whats-new">
        <h2 id="whats-new-title" className="sr-only">Dernières mises à jour</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-700">Aucune mise à jour publiée pour le moment. Consultez nos <Link href="/guides" className="font-semibold text-blue-800 underline">guides pratiques</Link>.</p>
        ) : (
          <ol className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
                {item.publishedAt && <time className="text-xs font-bold uppercase tracking-wide text-slate-500" dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time>}
                <h3 className="mt-1 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 leading-7 text-slate-700">{item.summary}</p>
                {item.pagePath && <Link href={item.pagePath} className="mt-2 inline-block text-sm font-semibold text-blue-800 underline">Voir la page concernée</Link>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </ServicePageShell>
  );
}
