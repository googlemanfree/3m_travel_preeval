import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const EVENT_LABEL: Record<string, string> = {
  login: "Connexion réussie",
  login_failed: "Échec de connexion",
  login_blocked: "Connexion refusée (compte désactivé)",
  twofactor_failed: "Code de vérification en deux étapes incorrect",
  login_attempts_reset: "Compteur de tentatives réinitialisé",
  revoked_all: "Sessions révoquées",
};
const EVENT_TONE: Record<string, string> = {
  login: "bg-emerald-50 text-emerald-800",
  login_failed: "bg-rose-50 text-rose-900",
  login_blocked: "bg-rose-50 text-rose-900",
  twofactor_failed: "bg-amber-50 text-amber-900",
  login_attempts_reset: "bg-blue-50 text-blue-800",
  revoked_all: "bg-slate-100 text-slate-700",
};

/**
 * Journal de sécurité de toute l'équipe admin : connexions, échecs de mot de passe ou de code à deux étapes, comptes
 * désactivés qu'on a quand même tenté d'utiliser. Repérer plusieurs échecs d'affilée sur un même compte est le signal
 * qui compte le plus ici ; le mot de passe et le code lui-même ne sont jamais enregistrés.
 */
export default function AdminSecurityJournal({ sessionToken }: { sessionToken: string }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(30);
  const query = trpc.adminAuth.listSecurityEvents.useQuery({ sessionToken, days }, { enabled: Boolean(sessionToken), retry: false });
  const events = query.data ?? [];
  const failures = events.filter((event) => ["login_failed", "login_blocked", "twofactor_failed"].includes(event.eventType)).length;
  const alerts = events.filter((event) => ["login_failed", "login_blocked", "twofactor_failed"].includes(event.eventType)).length;
  const successfulLogins = events.filter((event) => event.eventType === "login").length;

  return (
    <Card className="border border-slate-200 bg-white p-5 shadow-sm" data-testid="admin-security-journal">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-950"><ShieldAlert className="h-4 w-4 text-blue-700" aria-hidden="true" />Journal de sécurité de l’équipe</h2>
          <p className="mt-1 text-sm text-slate-600" data-testid="security-summary">{query.isLoading ? "Chargement…" : query.error ? "Journal indisponible pour le moment." : failures > 0 ? `${failures} événement${failures > 1 ? "s" : ""} à regarder sur ${days} jours.` : `Rien d’anormal sur ${days} jours.`}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="security-period" className="font-semibold text-slate-700">Période</label>
            <select id="security-period" value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1">
              {[7, 30, 90].map((value) => <option key={value} value={value}>{value} jours</option>)}
            </select>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Synthèse de sécurité">
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3"><p className="text-xs font-semibold text-rose-800">Échecs / alertes</p><p className="mt-1 text-2xl font-black text-rose-950">{alerts}</p></div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs font-semibold text-emerald-800">Connexions réussies</p><p className="mt-1 text-2xl font-black text-emerald-950">{successfulLogins}</p></div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">Événements suivis</p><p className="mt-1 text-2xl font-black text-slate-950">{events.length}</p></div>
          </div>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Aucun événement sur cette période.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm" data-testid="security-event-row">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900">{event.adminFullName || event.adminEmail}</span>
                    <span className="ml-2 text-xs text-slate-500">{event.adminEmail}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${EVENT_TONE[event.eventType] ?? "bg-slate-100 text-slate-700"}`}>{EVENT_LABEL[event.eventType] ?? event.eventType}</span>
                  <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
