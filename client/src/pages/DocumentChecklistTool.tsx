import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { buildCountryProcedureDocumentChecklist } from "@shared/countryProcedureChecklist";
import { guideSlugForCode } from "@shared/countryGuides";
import { WORLD_COUNTRY_ROWS } from "@shared/worldCountries";
import { setPageSeo } from "@/lib/pageSeo";
import { trackEvent } from "@/lib/analytics";
import { ServicePageShell } from "@/components/ServicePageShell";

const PROJECTS = [
  { value: "travail", label: "Travail avec employeur" },
  { value: "etudes", label: "Études" },
  { value: "visiteur", label: "Visiteur ou tourisme" },
  { value: "evisa", label: "e-Visa" },
  { value: "residence", label: "Installation durable" },
  { value: "famille", label: "Regroupement familial" },
] as const;
const STORAGE_KEY = "3m-document-checklist-v1";
const selectClass = "mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base";

type Saved = Record<string, string[]>;
function readSaved(): Saved {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Outil gratuit : la liste des pièces à préparer pour un pays et un projet, à cocher et à copier. Sans compte, sans donnée personnelle. */
export default function DocumentChecklistTool() {
  const [code, setCode] = useState("CA");
  const [project, setProject] = useState<(typeof PROJECTS)[number]["value"]>("travail");
  const [done, setDone] = useState<Saved>({});
  const country = WORLD_COUNTRY_ROWS.find((row) => row[0] === code)?.[1] ?? "";

  useEffect(() => {
    setPageSeo({
      title: "Liste des pièces à préparer pour un visa | 3M TRAVEL AGENCY",
      description: "Choisissez un pays et un projet (travail, études, visiteur) : la liste des pièces à préparer, à cocher et à copier, gratuite et sans compte.",
    });
    setDone(readSaved());
  }, []);

  const key = `${code}|${project}`;
  const checklist = useMemo(() => buildCountryProcedureDocumentChecklist({ destination: country, procedureType: project }), [country, project]);
  const checked = new Set(done[key] ?? []);
  const guideSlug = guideSlugForCode(code);

  const toggle = (label: string) => {
    const next = new Set(checked);
    if (next.has(label)) next.delete(label); else next.add(label);
    const saved = { ...done, [key]: Array.from(next) };
    setDone(saved);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* navigation privée : la coche n'est pas conservée */ }
  };

  const copy = async () => {
    const text = `${country} : ${PROJECTS.find((item) => item.value === project)?.label}\n${checklist.documents.map((line) => `${checked.has(line.documentType) ? "[x]" : "[ ]"} ${line.documentType}`).join("\n")}`;
    trackEvent("document_checklist_copy", { country, project });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Liste copiée");
    } catch {
      toast.error("Copie impossible", { description: "Sélectionnez la liste et copiez-la manuellement." });
    }
  };

  return (
    <ServicePageShell
      eyebrow="Outil gratuit"
      title="Liste des pièces à préparer"
      introduction="Choisissez un pays et votre projet. Cochez les pièces que vous avez déjà : votre progression reste sur cet appareil, sans compte."
      primaryHref="/#evaluation-multi"
      primaryLabel="Évaluer mon profil"
      secondaryHref="/pays"
      secondaryLabel="Guides par pays"
      notice="Liste générale et indicative : l'autorité du pays peut demander d'autres pièces. Confirmez toujours sur son portail officiel."
    >
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-labelledby="checklist-tool-title" data-testid="document-checklist-tool">
        <h2 id="checklist-tool-title" className="sr-only">Votre liste</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800" htmlFor="checklist-country">Pays de destination
            <select id="checklist-country" className={selectClass} value={code} onChange={(event) => setCode(event.target.value)}>{WORLD_COUNTRY_ROWS.map((row) => <option key={row[0]} value={row[0]}>{row[1]}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-slate-800" htmlFor="checklist-project">Projet
            <select id="checklist-project" className={selectClass} value={project} onChange={(event) => setProject(event.target.value as typeof project)}>{PROJECTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" role="status">{checked.size} pièce{checked.size > 1 ? "s" : ""} prête{checked.size > 1 ? "s" : ""} sur {checklist.documents.length}</p>
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-900 hover:bg-blue-50"><ClipboardCopy className="h-4 w-4" aria-hidden="true" />Copier la liste</button>
        </div>

        <ul className="mt-4 space-y-2">
          {checklist.documents.map((line, index) => (
            <li key={line.documentType}>
              <label htmlFor={`checklist-item-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked.has(line.documentType) ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <input id={`checklist-item-${index}`} type="checkbox" className="mt-1 h-5 w-5" checked={checked.has(line.documentType)} onChange={() => toggle(line.documentType)} />
                <span className="min-w-0"><span className="block font-semibold text-slate-900">{line.documentType}</span><span className="block text-sm text-slate-600">{line.comment}</span></span>
                {checked.has(line.documentType) ? <Check className="ml-auto h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" /> : null}
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-slate-700">Pour {country}, {guideSlug ? <>consultez aussi le <Link href={`/pays/${guideSlug}`} className="font-semibold text-blue-800 underline">guide du pays</Link> s'il est publié, ou </> : null}les <Link href="/procedures" className="font-semibold text-blue-800 underline">procédures détaillées</Link>.</p>
      </section>
    </ServicePageShell>
  );
}
