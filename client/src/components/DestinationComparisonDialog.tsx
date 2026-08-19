import { useMemo, useState } from "react";
import { ArrowLeftRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PUBLIC_DESTINATION_DETAILS, type PublicDestinationDetail } from "@/lib/publicDestinationCatalog";

type DestinationComparisonDialogProps = { current: PublicDestinationDetail };

const DetailCell = ({ label, value }: { label: string; value: string | number }) => (
  <div className="border-b border-slate-100 py-3 last:border-0">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

export function DestinationComparisonDialog({ current }: DestinationComparisonDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selected = useMemo(() => PUBLIC_DESTINATION_DETAILS.find((detail) => detail.procedure.id === selectedId), [selectedId]);
  const available = useMemo(
    () => PUBLIC_DESTINATION_DETAILS.filter((detail) => detail.procedure.id !== current.procedure.id),
    [current.procedure.id],
  );

  const compareCells = (detail: PublicDestinationDetail) => [
    ["Procédure", detail.procedure.visaType],
    ["Délai indicatif", detail.procedure.processingTime],
    ["Coût indicatif", detail.procedure.cost],
    ["Documents demandés", detail.procedure.requiredDocuments.reduce((count, group) => count + group.documents.length, 0)],
    ["Portail", detail.consular.verificationStatus === "verifie" ? "Vérifié" : "À revalider"],
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-blue-200 text-blue-800 hover:bg-blue-50 font-bold py-3 rounded-xl">
          <ArrowLeftRight className="w-4 h-4 mr-2" /> Comparer une destination
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Comparer les destinations</DialogTitle>
          <DialogDescription>Sélectionnez une seconde destination pour comparer les exigences et repères de procédure.</DialogDescription>
        </DialogHeader>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger aria-label="Choisir une destination à comparer"><SelectValue placeholder="Choisir une destination" /></SelectTrigger>
          <SelectContent className="max-h-72">
            {available.map((detail) => (
              <SelectItem key={detail.procedure.id} value={detail.procedure.id}>{detail.procedure.flag} {detail.procedure.name} — {detail.procedure.visaType}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected ? (
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {[current, selected].map((detail) => (
              <section key={detail.procedure.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">{detail.procedure.flag} {detail.procedure.name}</h3>
                <p className="text-sm text-slate-500">{detail.procedure.visaType}</p>
                <div className="mt-3">
                  {compareCells(detail).map(([label, value]) => <DetailCell key={label} label={label} value={value} />)}
                </div>
                <a href={`/destinations/${detail.procedure.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
                  Voir la fiche <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </section>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
