import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, ArrowLeft, CheckCircle2, ClipboardCheck, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminDossierVerification() {
  const [, navigate] = useLocation();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<ReturnType<typeof trpc.dossierVerification.verify.useMutation>["mutateAsync"]>> | null>(null);
  const normalizedReference = result && "normalizedReference" in result ? result.normalizedReference : null;
  const verifyMutation = trpc.dossierVerification.verify.useMutation({
    onSuccess: setResult,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedReference = reference.trim();
    if (!trimmedReference) return;
    setResult(null);
    verifyMutation.mutate({ reference: trimmedReference, ...(email.trim() ? { email: email.trim() } : {}) });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Button type="button" variant="ghost" className="mb-5 gap-2 text-slate-700" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft className="h-4 w-4" /> Retour au pilotage
        </Button>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-[#071b3d] to-[#123a7a] text-white">
            <CardTitle className="flex items-center gap-3 text-xl"><ClipboardCheck className="h-6 w-6 text-[#d4af37]" /> Vérifier une référence de dossier</CardTitle>
            <p className="text-sm text-blue-100">Contrôle réservé à l’administration. Il ne modifie pas le dossier et chaque recherche est auditée.</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1.25fr_1fr_auto] sm:items-end">
              <div className="space-y-2"><Label htmlFor="reference">Numéro de dossier</Label><Input id="reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="3M-2026-0001 ou 3M-AGN-0001" autoComplete="off" /></div>
              <div className="space-y-2"><Label htmlFor="matching-email">E-mail à contrôler <span className="font-normal text-slate-500">(facultatif)</span></Label><Input id="matching-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@exemple.com" autoComplete="off" /></div>
              <Button type="submit" className="gap-2 bg-[#123a7a] hover:bg-[#0b2f6f]" disabled={!reference.trim() || verifyMutation.isPending}><Search className="h-4 w-4" />{verifyMutation.isPending ? "Vérification…" : "Vérifier"}</Button>
            </form>

            {verifyMutation.error ? <div role="alert" className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{verifyMutation.error.message || "La vérification n’a pas pu être réalisée."}</div> : null}
            {result?.found ? <div className="mt-6 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold text-emerald-950"><CheckCircle2 className="h-5 w-5 text-emerald-700" /> Référence résolue</div><Badge className="bg-white text-emerald-800 ring-1 ring-emerald-200">{result.source === "agency" ? "Dossier agence" : "Dossier en ligne"}</Badge></div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Référence canonique</dt><dd className="mt-1 font-mono font-bold text-slate-900">{result.reference}</dd></div><div><dt className="text-slate-500">Statut</dt><dd className="mt-1 font-semibold text-slate-900">{result.status}</dd></div><div><dt className="text-slate-500">Destination / procédure</dt><dd className="mt-1 text-slate-900">{result.destination || "À préciser"}{result.visaType ? ` · ${result.visaType}` : ""}</dd></div><div><dt className="text-slate-500">Compte client</dt><dd className="mt-1 text-slate-900">{result.accountAssociation === "rattache" ? "Rattaché" : result.accountAssociation === "a_rattacher" ? "À rattacher" : "Non rattaché"}</dd></div>{result.emailAssociation !== null ? <div><dt className="text-slate-500">Association de l’e-mail saisi</dt><dd className={`mt-1 font-semibold ${result.emailAssociation ? "text-emerald-800" : "text-amber-800"}`}>{result.emailAssociation ? "Conforme" : "À corriger"}</dd></div> : null}</dl>
              <p className="flex items-start gap-2 text-xs text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />Utilisez la fiche dossier pour toute correction. Cette vérification ne révèle pas de document ni de note interne.</p>
            </div> : result ? <div role="status" className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><AlertCircle className="h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-bold">Référence non résolue</p><p className="mt-1">Vérifiez le format, l’e-mail associé ou rattachez le dossier depuis la fiche administrative. Aucun détail client n’est affiché.</p>{normalizedReference ? <p className="mt-2 font-mono text-xs text-amber-800">Référence normalisée : {normalizedReference}</p> : null}</div></div> : null}
          </CardContent>
        </Card>
        <p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><RefreshCw className="mt-0.5 h-3.5 w-3.5" />Les changements de dossier sont synchronisés par les procédures serveur ; actualisez ensuite le tableau de bord si une correction est réalisée.</p>
      </div>
    </main>
  );
}
