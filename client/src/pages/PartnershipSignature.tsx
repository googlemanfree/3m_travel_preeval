import { useMemo, useState } from "react";
import { CheckCircle2, FileSignature, Loader2, Printer, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { scrollBehavior } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from "@/components/SignatureCanvas";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { PARTNERSHIP_ROUTES } from "@shared/partnershipProgram";
import { PARTNERSHIP_SIGNING_DECLARATIONS } from "@shared/partnershipProtocolContent";

const isHeading = (block: string) => /^(Article \d+|Annexe \d+|Préambule$|Entre les soussignés$)/.test(block) && !block.includes("\n") && block.length < 120;

/** Lecture et signature en ligne du protocole d'accord, depuis le lien personnel envoyé par e-mail. */
export default function PartnershipSignature() {
  const { t } = useLanguage();
  const token = useMemo(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""), []);
  const view = trpc.partnership.getForSigning.useQuery({ token }, { enabled: token.length >= 20, retry: false });
  const [signatureName, setSignatureName] = useState("");
  const [declarations, setDeclarations] = useState([false, false, false]);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const sign = trpc.partnership.sign.useMutation({
    onSuccess: (result) => { setDone(result.reference); setError(""); window.scrollTo({ top: 0, behavior: scrollBehavior() }); },
    onError: (mutationError) => setError(mutationError.message),
  });

  const data = view.data;
  const summary = data?.summary;
  const invalid = token.length < 20 || view.isError;
  const state = data?.state;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (signatureName.trim().length < 3) return setError(t("Saisissez votre nom complet pour signer.", "Enter your full name to sign."));
    if (!declarations.every(Boolean)) return setError(t("Cochez les trois déclarations pour signer.", "Tick the three declarations to sign."));
    setError("");
    sign.mutate({ token, signatureName: signatureName.trim(), declarations, signaturePng: signature ?? undefined });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12" data-testid="partnership-signature">
      <div className="mx-auto max-w-3xl">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950"><FileSignature className="h-6 w-6 text-blue-800" aria-hidden="true" />{t("Protocole d’accord de partenariat", "Partnership agreement")}</h1>

        {done ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950" role="status" data-testid="partnership-signed">
            <p className="flex items-center gap-2 text-lg font-black"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{t("Votre signature est enregistrée.", "Your signature has been recorded.")}</p>
            <p className="mt-2 text-sm leading-6">{t(`Référence ${done}. Vous recevez par e-mail l’exemplaire signé. Le protocole produit ses effets à la contresignature de 3M ; vous recevrez alors votre code et votre lien personnels.`, `Reference ${done}. You will receive the signed copy by email. The agreement takes effect when 3M countersigns; you will then receive your personal code and link.`)}</p>
          </div>
        ) : view.isLoading && token.length >= 20 ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("Vérification du lien…", "Checking the link…")}</p>
        ) : invalid ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950" role="alert" data-testid="partnership-signature-invalid">
            <p className="flex items-center gap-2 font-black"><ShieldAlert className="h-5 w-5" aria-hidden="true" />{t("Lien non valable", "Link not valid")}</p>
            <p className="mt-1 text-sm">{t("Ce lien n’est pas valable. Demandez-en un nouveau à 3M TRAVEL AGENCY.", "This link is not valid. Ask 3M TRAVEL AGENCY for a new one.")}</p>
            <a href={PARTNERSHIP_ROUTES.hub} className="mt-3 inline-flex min-h-11 items-center font-bold underline underline-offset-2">{t("Page du programme de partenariat", "Partnership programme page")}</a>
          </div>
        ) : state === "expired" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950" role="alert" data-testid="partnership-signature-expired">
            <p className="font-black">{t("Ce lien a expiré", "This link has expired")}</p>
            <p className="mt-1 text-sm">{t("Écrivez à hello@3mtravelagency.com en rappelant votre référence : nous vous enverrons un nouveau lien.", "Write to hello@3mtravelagency.com quoting your reference: we will send you a new link.")}</p>
          </div>
        ) : state === "unavailable" ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5" role="alert">
            <p className="font-black text-slate-900">{t("Ce protocole n’est plus disponible à la signature.", "This agreement is no longer available for signing.")}</p>
          </div>
        ) : (
          <>
            {summary ? (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={t("Résumé", "Summary")} data-testid="partnership-summary">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Référence", "Reference")}</dt><dd className="font-bold text-slate-900">{summary.reference}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Partenaire", "Partner")}</dt><dd className="font-bold text-slate-900">{summary.partnerName}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Commission", "Commission")}</dt><dd className="font-bold text-slate-900">{summary.commissionRate ?? "—"} {t("des honoraires d’accompagnement encaissés", "of the support fees collected")}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Durée", "Term")}</dt><dd className="font-bold text-slate-900">{summary.termMonths ? `${summary.termMonths} ${t("mois", "months")}` : "—"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("Territoire", "Territory")}</dt><dd className="font-bold text-slate-900">{summary.territory ?? "—"}</dd></div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-500">{t("Ce résumé ne remplace pas le protocole : lisez-le en entier avant de signer.", "This summary does not replace the agreement: read it in full before signing.")}</p>
              </section>
            ) : null}

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={t("Texte du protocole", "Agreement text")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950">{t("Texte du protocole", "Agreement text")}</h2>
                <Button type="button" variant="outline" onClick={() => window.print()} className="min-h-10"><Printer className="mr-2 h-4 w-4" aria-hidden="true" />{t("Imprimer", "Print")}</Button>
              </div>
              <div className="mt-3 max-h-[34rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800" tabIndex={0} data-testid="partnership-protocol-text">
                {(data?.protocolText ?? "").split(/\n\n/).map((block, index) => (isHeading(block)
                  ? <h3 key={index} className="mt-4 font-black text-blue-950 first:mt-0">{block}</h3>
                  : <p key={index} className="mt-2 whitespace-pre-line">{block}</p>))}
              </div>
            </section>

            {state === "signed" ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950" role="status" data-testid="partnership-already-signed">
                <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{t("Ce protocole a déjà été signé.", "This agreement has already been signed.")}</p>
                <p className="mt-1 text-sm">{t("L’exemplaire signé vous a été envoyé par e-mail.", "The signed copy was sent to you by email.")}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">{t("Signer le protocole", "Sign the agreement")}</h2>
                <PrivacyNotice notice="partnership_application" />
                <div>
                  <Label htmlFor="sig-name">{t("Votre nom complet (il vaut signature) *", "Your full name (it counts as your signature) *")}</Label>
                  <Input id="sig-name" value={signatureName} onChange={(event) => setSignatureName(event.target.value)} placeholder={summary?.representativeName ?? ""} maxLength={255} className="mt-1" autoComplete="name" data-testid="partnership-signature-name" />
                </div>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                  {PARTNERSHIP_SIGNING_DECLARATIONS.map((declaration, index) => (
                    <label key={declaration} className="flex gap-3">
                      <input type="checkbox" checked={declarations[index]} onChange={(event) => setDeclarations((current) => current.map((value, position) => (position === index ? event.target.checked : value)))} className="mt-1" data-testid={`partnership-declaration-${index}`} />
                      <span>{declaration}</span>
                    </label>
                  ))}
                </div>
                <SignatureCanvas onSignatureChange={setSignature} />
                {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900" role="alert" data-testid="partnership-signature-error">{error}</p> : null}
                <Button type="submit" disabled={sign.isPending} className="min-h-12 w-full text-base font-black" data-testid="partnership-sign-submit">
                  {sign.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t("Signature…", "Signing…")}</> : t("Je signe le protocole", "I sign the agreement")}
                </Button>
                <p className="text-xs leading-5 text-slate-500">{t("Votre signature est horodatée et rattachée à l’empreinte numérique du texte ci-dessus. Le protocole produit ses effets à la contresignature de 3M.", "Your signature is time-stamped and tied to the digital fingerprint of the text above. The agreement takes effect when 3M countersigns.")}</p>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
