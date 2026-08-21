import { Compass, MapPin, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

const COUNTRY_FLAGS: Record<string, string> = {
  canada: "🇨🇦", france: "🇫🇷", luxembourg: "🇱🇺", pologne: "🇵🇱", allemagne: "🇩🇪", belgique: "🇧🇪", espagne: "🇪🇸", italie: "🇮🇹", portugal: "🇵🇹", suisse: "🇨🇭", royaumeuni: "🇬🇧", "royaume-uni": "🇬🇧", emirats: "🇦🇪", "emirats-arabes-unis": "🇦🇪", qatar: "🇶🇦", australie: "🇦🇺", nouvellezelande: "🇳🇿", "nouvelle-zelande": "🇳🇿" };

function destinationId(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ActiveDossierDestinationPanel({ destination, dossierNumber, isActive }: { destination?: string | null; dossierNumber?: string | null; isActive: boolean }) {
  const label = destination?.trim() || "Destination à confirmer";
  const id = destinationId(label);
  const media = trpc.destinationMedia.getByDestination.useQuery({ destinationId: id || "autre" }, { enabled: Boolean(isActive && id), staleTime: 5 * 60 * 1000 });
  if (!isActive) return null;
  const fallbackFlag = COUNTRY_FLAGS[id] || "🌍";
  return <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-950 via-blue-800 to-sky-600 px-5 py-6 text-white shadow-sm">
    {media.data?.imageUrl ? <img src={media.data.imageUrl} alt={media.data.imageAlt || `Présentation de ${label}`} className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-blue-600/65" />
    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-4xl ring-1 ring-white/30">{media.data?.flagUrl ? <img src={media.data.flagUrl} alt={media.data.flagAlt || `Drapeau de ${label}`} className="h-full w-full object-cover" /> : fallbackFlag}</div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Destination de votre dossier actif</p><h2 className="mt-1 text-2xl font-extrabold">{label}</h2><p className="mt-1 text-sm text-blue-50">Dossier {dossierNumber || "en cours de préparation"} · L’équipe 3M suit vos prochaines étapes.</p></div></div>
      <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm"><ShieldCheck className="mb-1 h-4 w-4 text-cyan-200" />Suivi activé</div><div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm"><MapPin className="mb-1 h-4 w-4 text-cyan-200" />Parcours ciblé</div><div className="col-span-2 rounded-xl bg-white/10 p-3 backdrop-blur-sm"><Compass className="mr-1 inline h-4 w-4 text-cyan-200" />Les documents et étapes ci-dessous sont adaptés à votre procédure.</div></div>
    </div>
  </section>;
}
