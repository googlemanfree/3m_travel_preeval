import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, FileCheck2, Search, ShieldCheck, Upload } from "lucide-react";
import { procedures107Complete } from "@/data/procedures107Complete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DocumentCompliancePage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(procedures107Complete[0]?.id ?? "");
  const destinations = useMemo(() => procedures107Complete.filter((country) =>
    country.name.toLowerCase().includes(query.toLowerCase()) || country.region.toLowerCase().includes(query.toLowerCase())
  ), [query]);
  const country = procedures107Complete.find((item) => item.id === selectedId) ?? destinations[0] ?? procedures107Complete[0];

  if (!country) return null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_38%),linear-gradient(180deg,_#f8fbff,_#ffffff)] py-10">
      <div className="container max-w-7xl space-y-7">
        <header className="rounded-3xl border border-blue-100 bg-white/75 p-6 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:p-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[.16em] text-blue-700"><ShieldCheck className="h-4 w-4" /> Préparation du dossier</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Exigences documentaires par destination</h1>
              <p className="mt-3 text-slate-600">Sélectionnez un pays pour vérifier les pièces attendues avant le dépôt. Cette liste prépare votre dossier ; les autorités compétentes et l’équipe 3M conservent la décision finale.</p>
            </div>
            <Link href="/document-upload"><Button className="bg-blue-700 hover:bg-blue-800"><Upload className="mr-2 h-4 w-4" />Téléverser mes documents</Button></Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
          <Card className="border-blue-100 bg-white/80 shadow-lg shadow-blue-950/5">
            <CardHeader className="pb-3"><CardTitle className="text-base">Choisir une destination</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Pays ou région" /></div>
              <div className="max-h-[56vh] space-y-1 overflow-y-auto pr-1">
                {destinations.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${item.id === country.id ? "bg-blue-700 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}>
                    <span className="text-lg">{item.flag}</span><span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span><span className="text-[10px] opacity-75">{item.visaType}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="overflow-hidden border-blue-100 bg-white/90 shadow-xl shadow-blue-950/5">
              <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 p-6 text-white">
                <p className="text-4xl">{country.flag}</p><h2 className="mt-2 text-2xl font-black">{country.name}</h2>
                <p className="mt-1 text-sm text-blue-100">{country.region} · Visa {country.visaType} · Délai indicatif : {country.processingTime}</p>
              </div>
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Frais indicatifs</p><p className="mt-1 font-bold text-slate-900">{country.cost}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Niveau de dossier</p><p className="mt-1 font-bold capitalize text-slate-900">{country.difficulty}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Étapes</p><p className="mt-1 font-bold text-slate-900">{country.steps.length} étapes</p></div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {country.requiredDocuments.map((group) => (
                <Card key={group.category} className="border-slate-200 bg-white"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-blue-700" />{group.category}</CardTitle></CardHeader><CardContent><ul className="space-y-2">{group.documents.map((document) => <li key={document} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{document}</li>)}</ul></CardContent></Card>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/procedures/${country.id}`}><Button variant="outline" className="w-full">Voir la procédure complète</Button></Link>
              <Link href={`/evaluation?destination=${encodeURIComponent(country.id)}`}><Button className="w-full bg-orange-500 hover:bg-orange-600">Lancer la procédure</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
