import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ServicePageShell } from "@/components/ServicePageShell";
import { PrintBrandedButton } from "@/components/PrintBrandedButton";
import { setPageSeo } from "@/lib/pageSeo";
import { trackEvent } from "@/lib/analytics";
import { BUDGET_CURRENCIES, BUDGET_LINES, computeBudget, formatAmountPlain, formatTotals, type BudgetEntry } from "@shared/budgetSimulator";

const NOTICE = "Ce simulateur ne propose aucun montant : vous saisissez les vôtres, relevés sur les sites officiels et sur vos devis. Il n'additionne que des montants de même devise et ne fait aucune conversion. Il ne garantit ni visa ni délai.";

/** Simulateur de budget de mobilité : calcul sur l'appareil, rien n'est enregistré ni envoyé. */
export default function BudgetSimulatorTool() {
  const [entries, setEntries] = useState<Record<string, BudgetEntry | undefined>>({});
  const [months, setMonths] = useState(3);
  useEffect(() => {
    setPageSeo({ title: "Simulateur de budget de mobilité | 3M TRAVEL AGENCY", description: "Estimez le budget de votre projet de mobilité avec vos propres montants : visa, dossier, traductions, billet, logement, frais de vie et fonds à justifier. Gratuit, sans compte." });
  }, []);
  const totals = useMemo(() => computeBudget({ entries, months }), [entries, months]);
  const set = (id: string, patch: Partial<BudgetEntry>) => setEntries((current) => ({ ...current, [id]: { amount: current[id]?.amount ?? 0, currency: current[id]?.currency ?? "XAF", ...patch } }));
  const filled = BUDGET_LINES.filter((line) => Number(entries[line.id]?.amount) > 0);

  return (
    <ServicePageShell
      eyebrow="Outil gratuit"
      title="Simulateur de budget de mobilité"
      introduction="Renseignez vos propres montants, ligne par ligne. Le total se calcule sur votre appareil : rien n'est enregistré ni envoyé."
      primaryHref="/#evaluation-multi"
      primaryLabel="Évaluer mon profil"
      secondaryHref="/outils/liste-de-pieces"
      secondaryLabel="Liste des pièces"
      notice={NOTICE}
    >
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-labelledby="budget-title" data-testid="budget-tool">
        <h2 id="budget-title" className="sr-only">Votre budget</h2>
        <ul className="space-y-4">
          {BUDGET_LINES.map((line) => (
            <li key={line.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-bold text-slate-900" htmlFor={`budget-${line.id}`}>{line.label}</label>
              <p className="mt-1 text-xs text-slate-600">{line.help}</p>
              <div className="mt-2 grid grid-cols-[1fr_6.5rem] gap-2">
                <input id={`budget-${line.id}`} type="number" inputMode="decimal" min={0} className="h-12 w-full rounded-lg border border-slate-300 px-3 text-base" value={entries[line.id]?.amount ? String(entries[line.id]?.amount) : ""} onChange={(event) => set(line.id, { amount: Number(event.target.value) })} placeholder="Montant" data-testid={`budget-amount-${line.id}`} />
                <select aria-label={`Devise : ${line.label}`} className="h-12 rounded-lg border border-slate-300 bg-white px-2 text-base" value={entries[line.id]?.currency ?? "XAF"} onChange={(event) => set(line.id, { currency: event.target.value })}>
                  {BUDGET_CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </div>
              {line.kind === "monthly" && (
                <label className="mt-3 flex items-center gap-3 text-sm text-slate-800">Nombre de mois
                  <input type="number" inputMode="numeric" min={1} max={60} className="h-11 w-24 rounded-lg border border-slate-300 px-3" value={months} onChange={(event) => setMonths(Number(event.target.value) || 1)} data-testid="budget-months" />
                </label>
              )}
            </li>
          ))}
        </ul>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5" aria-live="polite" data-testid="budget-result">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Votre budget</p>
          <p className="mt-2 text-lg font-black text-slate-950">À dépenser : <span data-testid="budget-spend">{formatTotals(totals.spend)}</span></p>
          <p className="mt-1 text-base font-bold text-slate-900">À justifier (non dépensé) : <span data-testid="budget-proof">{formatTotals(totals.proof)}</span></p>
          <p className="mt-2 text-xs text-slate-600">Les devises ne sont jamais converties : un total par devise.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <PrintBrandedButton
              label="Imprimer mon budget"
              onPrint={() => trackEvent("budget_simulator_print", { lines: filled.length })}
              build={() => ({
                title: "Mon budget de mobilité",
                intro: "Récapitulatif établi à partir des montants que vous avez saisis.",
                sections: [
                  { title: "Postes saisis", rows: filled.map((line) => ({ label: `${line.label}${line.kind === "monthly" ? ` (× ${months} mois)` : ""}`, value: formatAmountPlain((entries[line.id]!.amount) * (line.kind === "monthly" ? months : 1), entries[line.id]!.currency) })) },
                  { title: "Totaux", rows: [{ label: "À dépenser", value: formatTotals(totals.spend), strong: true }, { label: "À justifier (non dépensé)", value: formatTotals(totals.proof), strong: true }] },
                ],
                note: NOTICE,
              })}
            />
            <button type="button" onClick={() => { setEntries({}); setMonths(3); }} className="min-h-11 text-sm font-semibold text-blue-800 underline">Tout effacer</button>
          </div>
          <p className="mt-4 text-sm text-slate-700">Pour confirmer le montant des frais de votre dossier, <Link href="/contact" className="font-semibold text-blue-800 underline">contactez un conseiller</Link> : il vous le confirme par écrit avant tout paiement.</p>
        </section>
      </section>
    </ServicePageShell>
  );
}
