import { useEffect, useState } from "react";
import { ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { clientText, type ClientLanguage } from "@shared/clientCase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type WhatsappChoice = "unset" | "yes" | "no";
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const selectClass = "mt-1 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base";

/** Mon compte : langue de l'espace, notifications (e-mail, WhatsApp avec accord, heures de silence) et sécurité (connexions, déconnexion partout). */
export function ClientAccount({ enabled = true }: { enabled?: boolean }) {
  const utils = trpc.useUtils();
  const { logout } = useCandidateAuth();
  const prefs = trpc.clientSpace.myPreferences.useQuery(undefined, { enabled, retry: false });
  const security = trpc.clientSpace.securityOverview.useQuery(undefined, { enabled, retry: false });
  const [language, setLanguage] = useState<ClientLanguage>("fr");
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState<WhatsappChoice>("unset");
  const [quietFrom, setQuietFrom] = useState("");
  const [quietTo, setQuietTo] = useState("");

  useEffect(() => {
    if (!prefs.data) return;
    setLanguage(prefs.data.language);
    setEmail(prefs.data.emailEnabled);
    setWhatsapp(prefs.data.whatsappOptIn === null ? "unset" : prefs.data.whatsappOptIn ? "yes" : "no");
    setQuietFrom(prefs.data.quietFrom === null ? "" : String(prefs.data.quietFrom));
    setQuietTo(prefs.data.quietTo === null ? "" : String(prefs.data.quietTo));
  }, [prefs.data]);

  const refresh = () => { void utils.clientSpace.myPreferences.invalidate(); void utils.clientSpace.myCaseOverview.invalidate(); void utils.clientSpace.myTimeline.invalidate(); };
  const save = trpc.clientSpace.savePreferences.useMutation({ onSuccess: () => { toast.success(clientText(language, "saved")); refresh(); }, onError: (error) => toast.error(error.message) });
  const leave = trpc.clientSpace.logoutEverywhere.useMutation({ onSuccess: () => { toast.success(language === "en" ? "Signed out everywhere." : "Vous êtes déconnecté de tous les appareils."); logout(); }, onError: (error) => toast.error(error.message) });

  if (!enabled || !prefs.data) return null;
  const hoursOk = (quietFrom === "") === (quietTo === "");
  const submit = () => save.mutate({ language, emailEnabled: email, whatsappOptIn: whatsapp === "unset" ? null : whatsapp === "yes", quietFrom: quietFrom === "" ? null : Number(quietFrom), quietTo: quietTo === "" ? null : Number(quietTo) });

  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-testid="client-account" role="region" aria-labelledby="client-account-title">
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center gap-2"><h2 id="client-account-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><UserCog className="h-5 w-5 text-blue-700" aria-hidden="true" />{clientText(language, "accountTitle")}</h2></summary>
        <div className="mt-4 space-y-5">
          <label className="block text-sm font-semibold text-slate-800">{clientText(language, "languageLabel")}
            <select className={selectClass} value={language} onChange={(event) => setLanguage(event.target.value as ClientLanguage)} data-testid="account-language"><option value="fr">Français</option><option value="en">English</option></select>
          </label>
          <fieldset className="space-y-3">
            <legend className="text-sm font-black uppercase tracking-wide text-slate-700">{clientText(language, "notificationsLabel")}</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm text-slate-900"><input type="checkbox" className="h-5 w-5" checked={email} onChange={(event) => setEmail(event.target.checked)} data-testid="account-email" />{clientText(language, "emailNotifications")}</label>
            <p className="text-xs text-slate-600">{language === "en" ? "Important messages (your assessment, security alerts) are always sent; everything else stays in this space if you turn e-mail off." : "Les messages indispensables (votre bilan, alertes de sécurité) sont toujours envoyés ; le reste reste dans cet espace si vous coupez l'e-mail."}</p>
            <label className="block text-sm font-semibold text-slate-800">{clientText(language, "whatsappNotifications")}
              <select className={selectClass} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value as WhatsappChoice)} data-testid="account-whatsapp">
                <option value="unset">{language === "en" ? "No preference" : "Pas de préférence"}</option><option value="yes">{language === "en" ? "Yes, WhatsApp is fine" : "Oui, WhatsApp me convient"}</option><option value="no">{language === "en" ? "No, do not use WhatsApp" : "Non, ne pas utiliser WhatsApp"}</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-800">{clientText(language, "quietHours")} — {language === "en" ? "from" : "de"}
                <select className={selectClass} value={quietFrom} onChange={(event) => setQuietFrom(event.target.value)} data-testid="account-quiet-from"><option value="">—</option>{HOURS.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")} h</option>)}</select>
              </label>
              <label className="block text-sm font-semibold text-slate-800">{language === "en" ? "to" : "à"}
                <select className={selectClass} value={quietTo} onChange={(event) => setQuietTo(event.target.value)} data-testid="account-quiet-to"><option value="">—</option>{HOURS.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")} h</option>)}</select>
              </label>
            </div>
            {!hoursOk && <p className="text-xs font-semibold text-rose-700" role="alert">{language === "en" ? "Choose both quiet-hour limits, or none." : "Choisissez les deux bornes des heures de silence, ou aucune."}</p>}
            <p className="text-xs text-slate-500">{language === "en" ? "Hours are in Cameroon time." : "Heures du Cameroun."}</p>
            <Button type="button" className="min-h-11" disabled={!hoursOk || save.isPending} onClick={submit} data-testid="account-save">{clientText(language, "save")}</Button>
          </fieldset>
          <section aria-label={clientText(language, "securityLabel")} className="space-y-3 border-t border-slate-100 pt-4" data-testid="account-security">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{clientText(language, "securityLabel")}</h3>
            <p className="text-sm font-semibold text-slate-800">{clientText(language, "recentLogins")}</p>
            <ul className="space-y-1 text-sm text-slate-700">{(security.data?.logins ?? []).map((login, index) => <li key={`${login.at}-${index}`}>{login.label} — {new Date(login.at).toLocaleString(language === "en" ? "en-GB" : "fr-FR")}</li>)}{security.data && security.data.logins.length === 0 && <li className="text-slate-500">—</li>}</ul>
            <Button type="button" variant="outline" className="min-h-11 border-rose-300 text-rose-800" disabled={leave.isPending} onClick={() => { if (window.confirm(language === "en" ? "Sign out of every device, including this one?" : "Vous déconnecter de tous les appareils, y compris celui-ci ?")) leave.mutate(); }} data-testid="account-logout-all">{clientText(language, "logoutEverywhere")}</Button>
          </section>
        </div>
      </details>
    </Card>
  );
}
