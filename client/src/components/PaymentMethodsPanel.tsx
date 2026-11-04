import { useState } from "react";
import { Banknote, Building2, Check, Clock, CreditCard, Landmark, MessageCircle, Smartphone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import {
  EMPTY_PAYMENT_INSTRUCTIONS,
  MANUAL_METHOD_LABELS,
  OPERATOR_LABELS,
  configuredMobileMoney,
  describePaymentMethods,
  isBankConfigured,
  type AgencyFacts,
  type ManualMethodId,
  type MethodView,
  type PaymentInstructions,
} from "@shared/paymentMethods";

const office = COMPANY_PROFILE.offices.cameroon;
export const CLIENT_AGENCY_FACTS: AgencyFacts = {
  address: office.addressLines.join(", "),
  hours: office.openingHours.join(" · "),
  whatsappNumber: office.whatsappNumber,
  whatsappDisplay: office.whatsappDisplay,
  phoneDisplay: office.phoneDisplay,
};

const METHOD_ICONS: Record<MethodView["id"], typeof CreditCard> = { card: CreditCard, mobile_money_online: Smartphone, bank_transfer: Landmark, mobile_money_deposit: Banknote, cash_agency: Building2 };
const STATUS_STYLES: Record<MethodView["status"], string> = { available: "bg-emerald-100 text-emerald-800", soon: "bg-slate-100 text-slate-600", on_request: "bg-amber-100 text-amber-900" };

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(`Copiez ${label} :`, value);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="break-all font-mono text-sm font-bold text-slate-900">{value}</p>
      </div>
      <button type="button" onClick={copy} aria-label={`Copier ${label}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : null}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

/** Coordonnées d'un moyen de paiement manuel : uniquement celles saisies par l'agence, sinon « communiquées sur demande ». */
export function PaymentDetails({ instructions, method, agency = CLIENT_AGENCY_FACTS }: { instructions: PaymentInstructions; method: ManualMethodId; agency?: AgencyFacts }) {
  const onRequest = (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="details-on-request">
      Les coordonnées de ce mode de paiement vous sont communiquées par l’agence : écrivez-nous sur WhatsApp au {agency.whatsappDisplay} en indiquant votre référence. Ne payez sur aucun autre compte ou numéro.
    </p>
  );
  if (method === "bank_transfer") {
    if (!isBankConfigured(instructions)) return onRequest;
    const bank = instructions.bankTransfer;
    return (
      <div data-testid="bank-details">
        <CopyValue label="Banque" value={bank.bankName} />
        <CopyValue label="Titulaire du compte" value={bank.accountHolder} />
        {bank.iban && <CopyValue label="IBAN" value={bank.iban} />}
        {bank.bic && <CopyValue label="BIC / SWIFT" value={bank.bic} />}
        {bank.accountNumber && <CopyValue label="Numéro de compte" value={bank.accountNumber} />}
        {bank.note && <p className="mt-2 text-xs text-slate-600">{bank.note}</p>}
      </div>
    );
  }
  if (method === "mobile_money_deposit") {
    const accounts = configuredMobileMoney(instructions);
    if (accounts.length === 0) return onRequest;
    return (
      <div data-testid="mobile-money-details">
        {accounts.map((account, index) => (
          <div key={`${account.operator}-${account.number}-${index}`} className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-black text-slate-900">{OPERATOR_LABELS[account.operator]}</p>
            <CopyValue label="Numéro" value={account.number} />
            <p className="pt-2 text-xs text-slate-600">Titulaire du compte : <strong className="text-slate-900">{account.accountName}</strong> — vérifiez ce nom avant d’envoyer.</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div data-testid="agency-details" className="space-y-1 text-sm text-slate-700">
      <p><strong>Adresse :</strong> {instructions.agency.address || agency.address}</p>
      <p><strong>Horaires :</strong> {instructions.agency.hours || agency.hours}</p>
      {instructions.agency.note && <p className="text-xs text-slate-600">{instructions.agency.note}</p>}
    </div>
  );
}

/** Tous les moyens de paiement, avec leur état réel (disponible, bientôt, coordonnées sur demande). */
export default function PaymentMethodsPanel() {
  const query = trpc.paymentInstructions.getPublic.useQuery(undefined, { retry: 1, staleTime: 60_000 });
  const instructions = query.data?.instructions ?? EMPTY_PAYMENT_INSTRUCTIONS;
  const agency = query.data?.agency ?? CLIENT_AGENCY_FACTS;
  const methods = describePaymentMethods(instructions, Boolean(query.data?.onlineEnabled));
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div data-testid="payment-methods">
      <ul className="grid gap-3 md:grid-cols-2">
        {methods.map((method) => {
          const Icon = METHOD_ICONS[method.id];
          const manual = method.kind === "manual";
          const open = openId === method.id;
          return (
            <li key={method.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-testid={`method-${method.id}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-950">{method.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[method.status]}`}>{method.status === "soon" && <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" />}{method.statusLabel}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{method.description}</p>
                  {manual && (
                    <>
                      <button type="button" onClick={() => setOpenId(open ? null : method.id)} aria-expanded={open} className="mt-2 inline-flex min-h-9 items-center text-xs font-bold text-blue-700 hover:underline">{open ? "Masquer les coordonnées" : "Voir les coordonnées"}</button>
                      {open && <div className="mt-2"><PaymentDetails instructions={instructions} method={method.id as ManualMethodId} agency={agency} /></div>}
                    </>
                  )}
                  {!manual && method.status === "soon" && <p className="mt-2 text-xs text-slate-500">En attendant, réglez par virement, dépôt Mobile Money ou en agence.</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Après un virement ou un dépôt, envoyez la preuve sur WhatsApp au {agency.whatsappDisplay} avec votre référence. Le paiement n’est pris en compte qu’après confirmation de réception par l’agence.
      </p>
      {instructions.generalNote && <p className="mt-3 text-xs text-slate-600">{instructions.generalNote}</p>}
    </div>
  );
}

export { MANUAL_METHOD_LABELS };
