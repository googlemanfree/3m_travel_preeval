import { useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, CircleDollarSign, Copy, FileSignature, Link2, Loader2, Printer, ShieldAlert, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { formatXaf } from "@shared/openingFee";

const date = (value: string | Date | null | undefined) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—");
const monthLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
};

async function copy(text: string, ok: string, fail: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error(fail);
  }
}

/** Espace du partenaire (lien privé reçu à l'activation) : code, conditions, clients orientés et relevé de commissions. */
export default function PartnershipSpace() {
  const { t } = useLanguage();
  const token = useMemo(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""), []);
  const space = trpc.partnershipSpace.spaceGet.useQuery({ token }, { enabled: token.length >= 20, retry: false, refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [opening, setOpening] = useState(false);
  const data = space.data;

  const openProtocol = async () => {
    setOpening(true);
    try {
      const result = await utils.partnershipSpace.spaceProtocolPdfUrl.fetch({ token });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Le protocole n’est pas disponible.", "The agreement is not available."));
    } finally {
      setOpening(false);
    }
  };

  const invalid = token.length < 20 || space.isError;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12" data-testid="partnership-space">
      <div className="mx-auto max-w-5xl">
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950"><Wallet className="h-6 w-6 text-blue-800" aria-hidden="true" />{t("Mon espace partenaire", "My partner space")}</h1>

        {space.isLoading && token.length >= 20 ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("Chargement…", "Loading…")}</p>
        ) : invalid || !data ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950" role="alert" data-testid="partnership-space-invalid">
            <p className="flex items-center gap-2 font-black"><ShieldAlert className="h-5 w-5" aria-hidden="true" />{t("Lien non valable", "Link not valid")}</p>
            <p className="mt-1 text-sm">{space.error?.message ?? t("Ce lien n’est pas valable. Demandez-en un nouveau à 3M TRAVEL AGENCY.", "This link is not valid. Ask 3M TRAVEL AGENCY for a new one.")}</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-lg font-black text-slate-900">{data.partnerName}</span>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">{data.kindLabel}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${data.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`} data-testid="partnership-space-status">{data.statusLabel}</span>
              <span className="text-xs text-slate-500">{data.reference}</span>
            </div>
            {data.status === "suspended" ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-950" role="status" data-testid="partnership-space-suspended">
                {t("Votre partenariat est suspendu : plus aucune nouvelle commission ne court. Les commissions déjà acquises restent dues dans les conditions du protocole. Contactez 3M pour en savoir plus.", "Your partnership is suspended: no new commission accrues. Commissions already earned remain due under the agreement. Contact 3M to find out more.")}
              </p>
            ) : null}

            {data.totals ? (
              <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("Chiffres clés", "Key figures")} data-testid="partnership-space-totals">
                {[
                  { key: "referrals", label: t("Clients orientés", "Clients referred"), value: String(data.totals.referrals), helper: t("Dossiers rattachés à votre code", "Files linked to your code"), icon: Users, card: "border-blue-100 bg-blue-50/70", iconClass: "bg-blue-100 text-blue-800" },
                  { key: "payments", label: t("Paiements validés", "Validated payments"), value: String(data.totals.paidReferrals), helper: t("Paiements confirmés par 3M", "Payments confirmed by 3M"), icon: BadgeCheck, card: "border-emerald-100 bg-emerald-50/70", iconClass: "bg-emerald-100 text-emerald-800" },
                  { key: "earned", label: t("Commissions acquises", "Commissions earned"), value: formatXaf(data.totals.earnedXaf), helper: t("Sur les paiements éligibles", "On eligible payments"), icon: CircleDollarSign, card: "border-violet-100 bg-violet-50/70", iconClass: "bg-violet-100 text-violet-800" },
                  { key: "paid", label: t("Déjà versé", "Already paid"), value: formatXaf(data.totals.paidOutXaf), helper: t("Versements enregistrés", "Recorded payouts"), icon: CheckCircle2, card: "border-teal-100 bg-teal-50/70", iconClass: "bg-teal-100 text-teal-800" },
                  { key: "due", label: t("Reste à verser", "Still to be paid"), value: formatXaf(data.totals.dueXaf), helper: data.totals.overdueXaf > 0 ? t(`${formatXaf(data.totals.overdueXaf)} échu`, `${formatXaf(data.totals.overdueXaf)} overdue`) : t("À suivre dans le relevé", "Track it in the statement"), icon: Wallet, card: "border-amber-100 bg-amber-50/70", iconClass: "bg-amber-100 text-amber-800" },
                  { key: "link", label: t("Lien de recommandation", "Referral link"), value: data.referralLink ? t("Actif", "Active") : t("À créer", "To create"), helper: data.referralCode ? `${t("Code", "Code")} ${data.referralCode}` : t("Aucun code actif", "No active code"), icon: Link2, card: "border-sky-100 bg-sky-50/70", iconClass: "bg-sky-100 text-sky-800" },
                ].map(({ key, label, value, helper, icon: Icon, card, iconClass }) => (
                  <div key={key} className={`rounded-2xl border p-4 shadow-sm ${card}`} data-testid={`partnership-space-stat-${key}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
                        <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
                      </div>
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-600">{helper}</p>
                  </div>
                ))}
              </section>
            ) : null}
            {data.totals && data.totals.overdueXaf > 0 ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{t(`${formatXaf(data.totals.overdueXaf)} sont échus et pas encore versés. Si vous ne les avez pas reçus, écrivez-nous en rappelant votre référence.`, `${formatXaf(data.totals.overdueXaf)} are overdue and not yet paid. If you have not received them, write to us quoting your reference.`)}</p>
            ) : null}

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="partnership-space-code">
                <h2 className="text-lg font-black text-slate-950">{t("Mon code et mon lien", "My code and link")}</h2>
                {data.referralCode ? (
                  <>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t("Code partenaire", "Partner code")}</p>
                    <p className="font-mono text-2xl font-black tracking-widest text-blue-900">{data.referralCode}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t("Lien de recommandation", "Referral link")}</p>
                    <p className="break-all text-sm text-slate-800">{data.referralLink}</p>
                    <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => copy(data.referralLink ?? "", t("Lien copié.", "Link copied."), t("Copie impossible : sélectionnez le lien à la main.", "Copy failed: select the link manually."))}><Copy className="mr-2 h-4 w-4" aria-hidden="true" />{t("Copier le lien", "Copy the link")}</Button>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{t("Un client est rattaché à vous s’il ouvre son dossier avec ce lien, ou si vous l’avez déclaré par écrit à 3M avant l’ouverture.", "A client is linked to you if they open their file through this link, or if you declared them to 3M in writing beforehand.")}</p>
                  </>
                ) : <p className="mt-2 text-sm text-slate-600">{t("Aucun code n’est actif.", "No code is active.")}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="partnership-space-terms">
                <h2 className="text-lg font-black text-slate-950">{t("Mes conditions", "My terms")}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Commission", "Commission")}</dt><dd className="font-bold text-slate-900">{data.terms.commissionRate ?? "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("En vigueur depuis le", "In force since")}</dt><dd className="font-bold text-slate-900">{date(data.activeSince)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Jusqu’au", "Until")}</dt><dd className="font-bold text-slate-900">{date(data.termEndsAt)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Attribution d’un client", "Client attribution")}</dt><dd className="font-bold text-slate-900">{data.terms.attributionMonths ? `${data.terms.attributionMonths} ${t("mois", "months")}` : "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Versement", "Payment")}</dt><dd className="font-bold text-slate-900">{data.terms.paymentDelayDays ? `${data.terms.paymentDelayDays} ${t("jours après la fin du mois", "days after month end")}` : "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("Territoire", "Territory")}</dt><dd className="text-right font-bold text-slate-900">{data.terms.territory ?? "—"}</dd></div>
                </dl>
                {data.hasProtocolPdf ? (
                  <Button type="button" variant="outline" className="mt-4 min-h-11" onClick={openProtocol} disabled={opening} data-testid="partnership-space-protocol"><FileSignature className="mr-2 h-4 w-4" aria-hidden="true" />{t("Télécharger mon protocole signé", "Download my signed agreement")}</Button>
                ) : null}
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="space-statement-title" data-testid="partnership-space-statement">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="space-statement-title" className="text-lg font-black text-slate-950">{t("Relevé de commissions", "Commission statement")}</h2>
                <Button type="button" variant="outline" onClick={() => window.print()} className="min-h-10"><Printer className="mr-2 h-4 w-4" aria-hidden="true" />{t("Imprimer", "Print")}</Button>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t("Une commission naît quand un client que vous avez orienté a payé et que 3M a confirmé le paiement. Sont exclus les frais officiels et les frais de tiers. Aucun nom de client n’est affiché.", "A commission is earned when a client you referred has paid and 3M has confirmed the payment. Official and third-party fees are excluded. No client name is shown.")}</p>
              {data.months.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600" data-testid="partnership-space-empty">{t("Aucune commission pour le moment. Elles apparaîtront ici dès qu’un client orienté aura payé.", "No commission yet. They will appear here as soon as a referred client has paid.")}</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-2 pr-3">{t("Mois", "Month")}</th><th className="py-2 pr-3">{t("Paiements", "Payments")}</th><th className="py-2 pr-3">{t("Base", "Base")}</th><th className="py-2 pr-3">{t("Commission", "Commission")}</th><th className="py-2 pr-3">{t("Échéance", "Due")}</th><th className="py-2">{t("Statut", "Status")}</th></tr></thead>
                    <tbody>
                      {data.months.map((month) => (
                        <tr key={month.period} className="border-t border-slate-100" data-testid={`partnership-space-month-${month.period}`}>
                          <td className="py-2 pr-3 font-bold capitalize">{monthLabel(month.period)}</td>
                          <td className="py-2 pr-3">{month.paymentsCount}</td>
                          <td className="py-2 pr-3">{formatXaf(month.baseXaf)}</td>
                          <td className="py-2 pr-3 font-bold">{formatXaf(month.commissionXaf)}</td>
                          <td className="py-2 pr-3">{date(month.dueAt)}</td>
                          <td className="py-2">
                            {month.paid
                              ? <span className="inline-flex items-center gap-1 font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("Versé le", "Paid on")} {date(month.paidAt)}{month.paidReference ? ` · ${month.paidReference}` : ""}</span>
                              : new Date(month.dueAt).getTime() < Date.now() ? <span className="font-bold text-amber-800">{t("Échu, à verser", "Overdue")}</span> : <span className="text-slate-600">{t("À verser", "To be paid")}</span>}
                            {month.paid && month.deltaXaf !== 0 ? <span className="mt-0.5 block text-xs text-amber-800">{t(`Écart de ${formatXaf(Math.abs(month.deltaXaf))} avec le montant recalculé : 3M vous contactera.`, `Difference of ${formatXaf(Math.abs(month.deltaXaf))} with the recalculated amount: 3M will contact you.`)}</span> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {data.lines.length > 0 ? (
                <details className="mt-4 rounded-lg border border-slate-200 p-3 text-sm">
                  <summary className="cursor-pointer font-bold text-slate-900">{t("Détail par dossier", "Detail by file")} ({data.lines.length})</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-2 pr-3">{t("Dossier", "File")}</th><th className="py-2 pr-3">{t("Ouvert le", "Opened")}</th><th className="py-2 pr-3">{t("Payé le", "Paid")}</th><th className="py-2 pr-3">{t("Base", "Base")}</th><th className="py-2 pr-3">{t("Commission", "Commission")}</th><th className="py-2">{t("Statut", "Status")}</th></tr></thead>
                      <tbody>
                        {data.lines.map((line) => (
                          <tr key={line.reference} className="border-t border-slate-100"><td className="py-2 pr-3 font-bold">{line.reference}</td><td className="py-2 pr-3">{date(line.openedAt)}</td><td className="py-2 pr-3">{date(line.paidAt)}</td><td className="py-2 pr-3">{line.paidAt ? formatXaf(line.amountXaf) : "—"}</td><td className="py-2 pr-3">{line.eligible ? formatXaf(line.commissionXaf) : "—"}</td><td className="py-2 text-slate-600">{line.statusLabel}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}
            </section>

            <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm leading-6 text-slate-800">
              <h2 className="text-lg font-black text-slate-950">{t("Rappel des règles", "Reminder of the rules")}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{t("Vous ne promettez jamais un visa, un emploi ou une décision.", "You never promise a visa, a job or a decision.")}</li>
                <li>{t("Vous n’encaissez aucune somme au nom de 3M : le client paie 3M directement.", "You never collect money in 3M’s name: the client pays 3M directly.")}</li>
                <li>{t("Vous n’utilisez pas « partenaire officiel » sans l’autorisation écrite de 3M.", "You do not use “official partner” without 3M’s written permission.")}</li>
                <li>{t("Une question ou un désaccord sur un relevé : écrivez à hello@3mtravelagency.com sous 30 jours, avec votre référence.", "A question or a disagreement on a statement: write to hello@3mtravelagency.com within 30 days, quoting your reference.")}</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
