import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3, FileSignature, PenLine, ShieldCheck } from "lucide-react";

type SignableDocument = {
  id: number | string;
  documentName?: string | null;
  documentType?: string | null;
  documentUrl?: string | null;
  url?: string | null;
};

type ActiveDossier = {
  dossierNumber?: string | null;
  agreementSigned?: boolean | null;
  paymentStatus?: string | null;
} | null | undefined;

function isDocumentToSign(document: SignableDocument) {
  return /accord|protocole|autorisation|attestation|contrat|signature/i.test(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
}

export function SignableDocumentsPanel({
  activeDossier,
  documents,
  onOpenProtocol,
}: {
  activeDossier: ActiveDossier;
  documents: SignableDocument[];
  onOpenProtocol: () => void;
}) {
  const documentsToSign = documents.filter(isDocumentToSign);
  const paymentConfirmed = activeDossier?.paymentStatus === "SUCCESS";
  const protocolSigned = Boolean(activeDossier?.agreementSigned);
  const pendingCount = (paymentConfirmed && !protocolSigned ? 1 : 0) + documentsToSign.length;

  return (
    <section className="space-y-4" aria-labelledby="documents-to-sign-title">
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-blue-50 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Dossier actif · signature encadrée</p>
            <CardTitle id="documents-to-sign-title" className="mt-1 flex items-center gap-2 text-xl text-slate-950"><PenLine className="h-5 w-5 text-amber-700" /> Documents à signer</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Consultez uniquement les documents qui demandent votre signature. L’agence reste responsable de la vérification et de la suite du dossier.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{pendingCount} action{pendingCount > 1 ? "s" : ""}</span>
        </CardHeader>
      </Card>

      <Card className="border-amber-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`rounded-xl p-3 ${protocolSigned ? "bg-emerald-100 text-emerald-700" : paymentConfirmed ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                {protocolSigned ? <CheckCircle2 className="h-5 w-5" /> : paymentConfirmed ? <FileSignature className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">Protocole d’accord 3M Travel &amp; Services</p>
                {protocolSigned ? <p className="mt-1 text-sm text-emerald-800">Signé et enregistré pour le dossier {activeDossier?.dossierNumber ?? "actif"}.</p>
                  : paymentConfirmed ? <p className="mt-1 text-sm text-amber-900">Paiement confirmé : votre signature est maintenant requise avant le traitement humain.</p>
                  : <p className="mt-1 text-sm text-slate-600">Le protocole sera rendu signable après la confirmation du paiement.</p>}
              </div>
            </div>
            <Button type="button" onClick={onOpenProtocol} disabled={!activeDossier || protocolSigned || !paymentConfirmed} className="h-11 shrink-0 bg-blue-800 text-white hover:bg-blue-900 disabled:bg-slate-300">
              <ShieldCheck className="mr-2 h-4 w-4" /> {protocolSigned ? "Déjà signé" : paymentConfirmed ? "Lire et signer" : "En attente de paiement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {documentsToSign.length > 0 && <Card className="border-blue-100 bg-white shadow-sm"><CardHeader><CardTitle className="text-lg text-slate-950">Documents publiés par l’agence</CardTitle><p className="text-sm text-slate-600">Consultez le document, puis suivez l’instruction communiquée par votre conseiller.</p></CardHeader><CardContent><div className="space-y-3">{documentsToSign.map((document) => <div key={document.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-slate-900">{document.documentName ?? "Document à signer"}</p><p className="mt-1 text-xs text-slate-500">{document.documentType ?? "Document généré par l’agence"}</p></div>{document.documentUrl || document.url ? <a href={document.documentUrl ?? document.url ?? "#"} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-100">Consulter</a> : <span className="text-xs font-semibold text-amber-800">En préparation</span>}</div>)}</div></CardContent></Card>}
    </section>
  );
}
