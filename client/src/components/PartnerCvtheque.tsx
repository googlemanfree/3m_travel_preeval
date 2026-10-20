import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_VALUES,
  EDUCATION_LABELS,
  EDUCATION_LEVELS,
  VERIFICATION_FIELDS,
  VERIFICATION_LABELS,
  WORK_AUTHORIZATION_LABELS,
  WORK_AUTHORIZATION_VALUES,
  type Availability,
  type EducationLevel,
  type VerificationLevels,
  type WorkAuthorization,
} from "@shared/cvtheque";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { InterviewForm, NeedForm } from "@/components/PartnerRecruitment";

type Props = { sessionToken: string; mode: "search" | "selection" };

type Card = {
  cvthequeProfileId: number;
  profileCode: string;
  jobTitle: string | null;
  sector: string | null;
  skills: string[];
  educationLevel: string | null;
  experienceYears: number | null;
  languages: string[];
  availability: string | null;
  destinations: string[];
  residenceCountry: string | null;
  workAuthorization: string;
  verification: VerificationLevels;
  summary: string;
  inSelection: boolean;
  note?: string | null;
};

const FIELD_LABEL: Record<(typeof VERIFICATION_FIELDS)[number], string> = { skills: "Compétences", experience: "Expérience", education: "Formation", languages: "Langues" };

function ProfileCard({ card, onToggle, onOpen, onPropose, onInterview, busy }: { card: Card; onToggle: () => void; onOpen: () => void; onPropose: () => void; onInterview: () => void; busy: boolean }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4" data-testid="cvtheque-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-black text-slate-950">{card.jobTitle ?? "Profil professionnel"}</p>
          <p className="text-xs text-slate-500">{card.profileCode}{card.sector ? ` · ${card.sector}` : ""}</p>
        </div>
        <Button type="button" size="sm" variant={card.inSelection ? "default" : "outline"} disabled={busy} onClick={onToggle} aria-pressed={card.inSelection}>
          {card.inSelection ? <BookmarkCheck className="mr-1 h-4 w-4" aria-hidden="true" /> : <BookmarkPlus className="mr-1 h-4 w-4" aria-hidden="true" />}
          {card.inSelection ? "Dans ma sélection" : "Ajouter à ma sélection"}
        </Button>
      </div>
      {card.skills.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Compétences">{card.skills.slice(0, 8).map((skill) => <li key={skill} className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900">{skill}</li>)}</ul>}
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm text-slate-700 sm:grid-cols-2">
        {card.experienceYears !== null && <div><dt className="inline font-semibold">Expérience : </dt><dd className="inline">{card.experienceYears} an(s)</dd></div>}
        {card.languages.length > 0 && <div><dt className="inline font-semibold">Langues : </dt><dd className="inline">{card.languages.join(", ")}</dd></div>}
        {card.availability && <div><dt className="inline font-semibold">Disponibilité : </dt><dd className="inline">{AVAILABILITY_LABELS[card.availability as Availability]?.fr ?? card.availability}</dd></div>}
        {card.residenceCountry && <div><dt className="inline font-semibold">Résidence actuelle : </dt><dd className="inline">{card.residenceCountry}</dd></div>}
        {card.destinations.length > 0 && <div><dt className="inline font-semibold">Destinations souhaitées : </dt><dd className="inline">{card.destinations.join(", ")}</dd></div>}
        {card.educationLevel && <div><dt className="inline font-semibold">Formation : </dt><dd className="inline">{EDUCATION_LABELS[card.educationLevel as EducationLevel]?.fr ?? card.educationLevel}</dd></div>}
        <div className="sm:col-span-2"><dt className="inline font-semibold">Autorisation de travail : </dt><dd className="inline">{WORK_AUTHORIZATION_LABELS[card.workAuthorization as WorkAuthorization]?.fr ?? card.workAuthorization} <span className="text-xs text-slate-500">(déclarée par le candidat, non vérifiée)</span></dd></div>
      </dl>
      <p className="mt-2 text-xs text-slate-600" data-testid="cvtheque-verification">{VERIFICATION_FIELDS.map((field) => `${FIELD_LABEL[field]} : ${VERIFICATION_LABELS[card.verification[field]].fr}`).join(" · ")}</p>
      {card.summary && <p className="mt-2 text-sm leading-6 text-slate-700">{card.summary}</p>}
      {card.note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-950">Ma note : {card.note}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onOpen} className="text-sm font-bold text-indigo-800 underline underline-offset-2">Voir la fiche complète</button>
        <Button type="button" size="sm" variant="outline" onClick={onPropose} data-testid="cvtheque-propose">Proposer un poste</Button>
        <Button type="button" size="sm" variant="outline" onClick={onInterview} data-testid="cvtheque-interview">Demander un entretien</Button>
      </div>
    </li>
  );
}

/** CVthèque d'un partenaire : recherche multicritère (diplôme jamais obligatoire) et sélection personnelle. Aucune donnée d'identité. */
export function PartnerCvtheque({ sessionToken, mode }: Props) {
  const utils = trpc.useUtils();
  const [filters, setFilters] = useState({ q: "", experienceMin: "", availability: "" as "" | Availability, residenceCountry: "", destination: "", workAuthorization: "" as "" | WorkAuthorization });
  const [education, setEducation] = useState<EducationLevel[]>([]);
  const [applied, setApplied] = useState<typeof filters | null>(null);
  const [page, setPage] = useState(1);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [action, setAction] = useState<{ kind: "need" | "interview"; profileCode: string } | null>(null);

  const search = trpc.cvtheque.search.useQuery({
    sessionToken,
    q: applied?.q || undefined,
    experienceMin: applied?.experienceMin ? Number(applied.experienceMin) : undefined,
    availability: applied?.availability || undefined,
    residenceCountry: applied?.residenceCountry || undefined,
    destination: applied?.destination || undefined,
    workAuthorization: applied?.workAuthorization || undefined,
    educationLevels: education.length ? education : undefined,
    page,
  }, { enabled: mode === "search" && applied !== null, retry: false });
  const selection = trpc.cvtheque.selectionList.useQuery({ sessionToken }, { enabled: mode === "selection", retry: false });
  const detail = trpc.cvtheque.getProfile.useQuery({ sessionToken, profileCode: openCode ?? "" }, { enabled: Boolean(openCode), retry: false });
  const refresh = () => { void utils.cvtheque.search.invalidate(); void utils.cvtheque.selectionList.invalidate(); void utils.cvtheque.getProfile.invalidate(); };
  const add = trpc.cvtheque.selectionAdd.useMutation({ onSuccess: () => { toast.success("Ajouté à votre sélection"); refresh(); }, onError: (error) => toast.error("Sélection impossible", { description: error.message }) });
  const remove = trpc.cvtheque.selectionRemove.useMutation({ onSuccess: () => { toast.success("Retiré de votre sélection"); refresh(); }, onError: (error) => toast.error(error.message) });
  const toggle = (card: Card) => (card.inSelection ? remove.mutate({ sessionToken, profileCode: card.profileCode }) : add.mutate({ sessionToken, profileCode: card.profileCode }));
  const busy = add.isPending || remove.isPending;
  const set = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => setFilters((current) => ({ ...current, [key]: value }));

  const list = mode === "search" ? (search.data?.items as Card[] | undefined) : (selection.data as Card[] | undefined);
  const error = mode === "search" ? search.error : selection.error;
  const totalPages = search.data ? Math.max(1, Math.ceil(search.data.total / search.data.pageSize)) : 1;

  return (
    <section className="space-y-4" data-testid={mode === "search" ? "partner-cvtheque" : "partner-selection"}>
      <PrivacyNotice notice="cvtheque_search" />
      <p className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">Seuls les profils que le candidat a autorisés et que 3M a examinés apparaissent ici, sans nom, coordonnées, nationalité ni pièce d’identité. Une fiche n’indique ni admissibilité à un visa, ni emploi garanti. Vos recherches et consultations sont enregistrées.</p>
      {mode === "search" && (
        <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied({ ...filters }); }}>
          <label className="text-sm font-semibold text-slate-800 md:col-span-3">Métier, compétences, mots-clés
            <span className="relative mt-1 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><Input value={filters.q} onChange={(event) => set("q", event.target.value)} maxLength={120} className="pl-9" placeholder="Ex. : soudeur, soins aux personnes, logistique" data-testid="cvtheque-q" /></span>
          </label>
          <label className="text-sm font-semibold text-slate-800">Expérience minimale (années)
            <Input type="number" min={0} max={60} value={filters.experienceMin} onChange={(event) => set("experienceMin", event.target.value)} className="mt-1" />
          </label>
          <label className="text-sm font-semibold text-slate-800">Disponibilité
            <select value={filters.availability} onChange={(event) => set("availability", event.target.value as typeof filters.availability)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="">Toutes</option>{AVAILABILITY_VALUES.map((value) => <option key={value} value={value}>{AVAILABILITY_LABELS[value].fr}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-slate-800">Pays de résidence actuel
            <Input value={filters.residenceCountry} onChange={(event) => set("residenceCountry", event.target.value)} maxLength={120} className="mt-1" placeholder="Cameroun" />
          </label>
          <label className="text-sm font-semibold text-slate-800">Destination souhaitée
            <Input value={filters.destination} onChange={(event) => set("destination", event.target.value)} maxLength={120} className="mt-1" placeholder="Canada" />
          </label>
          <label className="text-sm font-semibold text-slate-800 md:col-span-2">Autorisation de travail déclarée
            <select value={filters.workAuthorization} onChange={(event) => set("workAuthorization", event.target.value as typeof filters.workAuthorization)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="">Toutes situations</option>{WORK_AUTHORIZATION_VALUES.map((value) => <option key={value} value={value}>{WORK_AUTHORIZATION_LABELS[value].fr}</option>)}</select>
          </label>
          <details className="md:col-span-3 rounded-lg border border-slate-200 p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-800">Filtrer par niveau de formation (facultatif — le diplôme n’est jamais obligatoire)</summary>
            <div className="mt-2 flex flex-wrap gap-3">{EDUCATION_LEVELS.map((level) => <label key={level} className="flex items-center gap-1.5"><input type="checkbox" checked={education.includes(level)} onChange={(event) => setEducation((current) => event.target.checked ? [...current, level] : current.filter((item) => item !== level))} />{EDUCATION_LABELS[level].fr}</label>)}</div>
          </details>
          <div className="md:col-span-3"><Button type="submit" className="bg-indigo-700 text-white hover:bg-indigo-800" disabled={search.isFetching}>{search.isFetching ? "Recherche…" : "Rechercher"}</Button></div>
        </form>
      )}
      {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{error.message}</p>}
      {mode === "search" && applied === null && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Lancez une recherche pour consulter les profils autorisés.</p>}
      {mode === "search" && search.data && <p className="text-sm text-slate-600" aria-live="polite">{search.data.total} profil(s) correspondant(s).</p>}
      {action?.kind === "need" && <NeedForm sessionToken={sessionToken} profileCode={action.profileCode} onDone={() => setAction(null)} onCancel={() => setAction(null)} />}
      {action?.kind === "interview" && <InterviewForm sessionToken={sessionToken} profileCode={action.profileCode} onDone={() => setAction(null)} onCancel={() => setAction(null)} />}
      <ul className="grid gap-3 lg:grid-cols-2">
        {(list ?? []).map((card) => <ProfileCard key={card.cvthequeProfileId} card={card} busy={busy} onToggle={() => toggle(card)} onOpen={() => setOpenCode(card.profileCode)} onPropose={() => setAction({ kind: "need", profileCode: card.profileCode })} onInterview={() => setAction({ kind: "interview", profileCode: card.profileCode })} />)}
      </ul>
      {mode === "selection" && !selection.isLoading && (list ?? []).length === 0 && !error && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Votre sélection est vide. Ajoutez des profils depuis la CVthèque.</p>}
      {mode === "search" && search.data && search.data.total > search.data.pageSize && (
        <div className="flex items-center justify-between"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Précédent</Button><span className="text-sm text-slate-600">Page {page} / {totalPages}</span><Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Suivant</Button></div>
      )}
      {openCode && (
        <div className="rounded-xl border border-indigo-200 bg-white p-4" role="region" aria-label="Fiche complète" data-testid="cvtheque-detail">
          <div className="flex items-center justify-between"><p className="font-black text-slate-950">Fiche {openCode}</p><Button type="button" size="sm" variant="ghost" onClick={() => setOpenCode(null)}>Fermer</Button></div>
          {detail.error && <p className="mt-2 text-sm text-amber-950" role="status">{detail.error.message}</p>}
          {detail.data && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{detail.data.summary}</p>}
        </div>
      )}
    </section>
  );
}
