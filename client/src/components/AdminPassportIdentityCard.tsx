import React, { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fieldClass = "mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900";

const STATUS_STYLE: Record<string, string> = {
  expired: "border-rose-300 bg-rose-50 text-rose-900",
  too_short: "border-amber-300 bg-amber-50 text-amber-900",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
  unknown: "border-slate-300 bg-slate-50 text-slate-700",
};
const STATUS_LABEL: Record<string, string> = {
  expired: "Passeport expiré",
  too_short: "Validité insuffisante",
  ok: "Validité conforme",
  unknown: "Validité non contrôlée",
};

/**
 * Données du passeport saisies par un agent (jamais lues automatiquement) : contrôle de validité et de cohérence
 * avec la fiche. Les signalements sont une aide : l'agent décide de valider, corriger ou renvoyer la pièce.
 */
export default function AdminPassportIdentityCard({ sessionToken, candidateId }: { sessionToken: string; candidateId: number }) {
  const base = useId();
  const id = (name: string) => `${base}-${name}`;
  const enabled = Boolean(sessionToken) && candidateId > 0;
  const query = trpc.adminPassportIdentity.get.useQuery({ sessionToken, candidateId }, { enabled, retry: false });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ surname: "", givenNames: "", dateOfBirth: "", passportNumber: "", expiryDate: "", plannedTravelDate: "" });

  const identity = query.data?.identity ?? null;
  useEffect(() => {
    if (!identity) return;
    setForm({
      surname: identity.surname,
      givenNames: identity.givenNames,
      dateOfBirth: identity.dateOfBirth,
      passportNumber: identity.passportNumber,
      expiryDate: identity.expiryDate,
      plannedTravelDate: identity.plannedTravelDate ?? "",
    });
  }, [identity?.enteredAt]);

  const save = trpc.adminPassportIdentity.save.useMutation({
    onSuccess: () => {
      toast.success("Données du passeport enregistrées.");
      setOpen(false);
      void query.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (!enabled) return null;
  const file = query.data?.file ?? null;
  const expiry = query.data?.expiry ?? null;
  const discrepancies = query.data?.discrepancies ?? [];
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const complete = form.surname.trim() && form.givenNames.trim() && form.dateOfBirth && form.passportNumber.trim().length >= 5 && form.expiryDate;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby={id("title")} data-testid="passport-identity-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 id={id("title")} className="font-semibold text-slate-900">Contrôle du passeport</h4>
          <p className="mt-0.5 text-xs text-slate-600">Données relevées par un agent sur la pièce : validité par rapport au voyage et cohérence avec la fiche du candidat.</p>
        </div>
        {expiry && <Badge variant="outline" className={STATUS_STYLE[expiry.status]} data-testid="passport-expiry-badge">{STATUS_LABEL[expiry.status]}</Badge>}
      </div>

      {query.isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Chargement…</p>
      ) : !file ? (
        <p className="mt-3 text-sm text-slate-600" data-testid="passport-missing">Aucun passeport déposé : rien à contrôler pour l’instant.</p>
      ) : (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-slate-700">Pièce contrôlée : <strong>{file.fileName}</strong></p>
          {identity ? (
            <p className="text-xs text-slate-600">
              {identity.givenNames} {identity.surname} · né(e) le {identity.dateOfBirth} · n° {identity.passportNumber} · expire le {identity.expiryDate}
              {identity.plannedTravelDate ? ` · voyage prévu le ${identity.plannedTravelDate}` : ""} · saisi par {identity.enteredBy || "un agent"}
            </p>
          ) : (
            <p className="text-xs text-amber-800" data-testid="passport-not-entered">Données du passeport non saisies : validité et cohérence non contrôlées.</p>
          )}
          {expiry && <p className="text-xs text-slate-700" data-testid="passport-expiry-message">{expiry.message}</p>}
          {discrepancies.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900" data-testid="passport-discrepancies">
              {discrepancies.map((item) => <li key={item.field}>{item.message}</li>)}
            </ul>
          )}
          <Button type="button" size="sm" variant="outline" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-testid="passport-identity-toggle">
            {open ? "Fermer" : identity ? "Corriger les données du passeport" : "Saisir les données du passeport"}
          </Button>
          {open && (
            <form
              className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!complete || !file) return;
                save.mutate({
                  sessionToken,
                  candidateId,
                  fileId: file.id,
                  surname: form.surname.trim(),
                  givenNames: form.givenNames.trim(),
                  dateOfBirth: form.dateOfBirth,
                  passportNumber: form.passportNumber.trim(),
                  expiryDate: form.expiryDate,
                  plannedTravelDate: form.plannedTravelDate || null,
                });
              }}
            >
              <label htmlFor={id("surname")} className="text-xs font-semibold text-slate-700">Nom de famille (passeport)
                <input id={id("surname")} required className={fieldClass} value={form.surname} onChange={set("surname")} maxLength={100} />
              </label>
              <label htmlFor={id("given")} className="text-xs font-semibold text-slate-700">Prénoms (passeport)
                <input id={id("given")} required className={fieldClass} value={form.givenNames} onChange={set("givenNames")} maxLength={150} />
              </label>
              <label htmlFor={id("birth")} className="text-xs font-semibold text-slate-700">Date de naissance
                <input id={id("birth")} required type="date" className={fieldClass} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </label>
              <label htmlFor={id("number")} className="text-xs font-semibold text-slate-700">Numéro de passeport
                <input id={id("number")} required className={fieldClass} value={form.passportNumber} onChange={set("passportNumber")} maxLength={20} />
              </label>
              <label htmlFor={id("expiry")} className="text-xs font-semibold text-slate-700">Date d’expiration
                <input id={id("expiry")} required type="date" className={fieldClass} value={form.expiryDate} onChange={set("expiryDate")} />
              </label>
              <label htmlFor={id("travel")} className="text-xs font-semibold text-slate-700">Voyage prévu (facultatif)
                <input id={id("travel")} type="date" className={fieldClass} value={form.plannedTravelDate} onChange={set("plannedTravelDate")} />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" disabled={!complete || save.isPending} data-testid="passport-identity-save">
                  {save.isPending ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
