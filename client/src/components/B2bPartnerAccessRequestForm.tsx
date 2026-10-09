import { useState } from "react";
import { Building2, Send, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { B2B_AUDIENCE_COPY, type B2bAudience } from "@shared/b2bPartnerPortals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = { audience: B2bAudience };

export function B2bPartnerAccessRequestForm({ audience }: Props) {
  const { language } = useLanguage();
  const copy = B2B_AUDIENCE_COPY[audience][language === "en" ? "en" : "fr"];
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [humanConfirm, setHumanConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requestAccess = trpc.placementPortal.requestPartnerAccess.useMutation({
    onSuccess: (result) => {
      setSubmitted(true);
      toast.success(result.message);
    },
    onError: (error) => toast.error(language === "en" ? "Request failed" : "Demande impossible", { description: error.message }),
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950" data-testid="b2b-access-request-success">
        <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5" />{language === "en" ? "Request received" : "Demande reçue"}</p>
        <p className="mt-2 text-sm leading-6">
          {language === "en"
            ? "Our team will verify your organisation before issuing any credentials. No automatic access is granted."
            : "Notre équipe vérifiera votre organisation avant tout identifiant. Aucun accès n’est accordé automatiquement."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid="b2b-access-request-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!humanConfirm) return;
        requestAccess.mutate({
          organizationType: audience,
          legalName: legalName.trim(),
          country: country.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          website: website.trim() || undefined,
          message: message.trim() || undefined,
          humanConfirm: true,
        });
      }}
    >
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 text-blue-700" />
        <div>
          <h3 className="font-bold text-slate-950">{copy.ctaRequest}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {language === "en"
              ? "Human verification by 3M TRAVEL AGENCY is mandatory. Profiles remain anonymised and consent-based."
              : "Vérification humaine obligatoire par 3M TRAVEL AGENCY. Profils anonymisés et fondés sur le consentement."}
          </p>
        </div>
      </div>
      <Input required maxLength={255} value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder={language === "en" ? "Legal company name" : "Raison sociale"} />
      <Input required maxLength={120} value={country} onChange={(e) => setCountry(e.target.value)} placeholder={language === "en" ? "Country of registration" : "Pays d’immatriculation"} />
      <Input required maxLength={255} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={language === "en" ? "Contact person" : "Nom du contact"} />
      <Input required type="email" maxLength={320} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={language === "en" ? "Business email" : "E-mail professionnel"} />
      <Input maxLength={64} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={language === "en" ? "Phone / WhatsApp (optional)" : "Téléphone / WhatsApp (facultatif)"} />
      <Input maxLength={320} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={language === "en" ? "Website (optional)" : "Site web (facultatif)"} />
      <Textarea maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={language === "en" ? "Roles sought, countries, volumes…" : "Métiers recherchés, pays, volumes…"} rows={4} />
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={humanConfirm} onChange={(e) => setHumanConfirm(e.target.checked)} />
        <span>
          {language === "en"
            ? "I confirm I represent a verified organisation and accept that 3M reviews every access request manually."
            : "Je confirme représenter une organisation réelle et accepte que 3M examine chaque demande manuellement."}
        </span>
      </label>
      <Button type="submit" className="w-full bg-[#0f2460] hover:bg-[#16357f]" disabled={!humanConfirm || requestAccess.isPending}>
        <Send className="mr-2 h-4 w-4" />
        {requestAccess.isPending ? (language === "en" ? "Sending…" : "Envoi…") : copy.ctaRequest}
      </Button>
    </form>
  );
}
