import { useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { PARTNER_ROUTES, partnerPasswordProblem } from "@shared/partnerModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrivacyNotice } from "@/components/PrivacyNotice";

/** Activation d'un compte partenaire depuis un lien d'invitation personnel (usage unique, durée limitée). */
export default function PartnerInvitationActivation() {
  const { t } = useLanguage();
  const token = useMemo(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""), []);
  const invitation = trpc.partnerModule.getInvitation.useQuery({ token }, { enabled: token.length >= 20, retry: false });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ organizationName: string } | null>(null);
  const activate = trpc.partnerModule.activateInvitation.useMutation({
    onSuccess: (result) => setDone({ organizationName: result.organizationName }),
    onError: (mutationError) => setError(mutationError.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = partnerPasswordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirmation) return setError(t("Les deux mots de passe ne sont pas identiques.", "The two passwords do not match."));
    setError("");
    activate.mutate({ token, password, fullName: fullName.trim() || undefined });
  };

  const state = invitation.data?.state;
  const valid = invitation.data && "organizationName" in invitation.data ? invitation.data : null;
  const invalid = token.length < 20 || state === "invalid" || state === "used" || state === "revoked" || state === "expired" || invitation.isError;
  const reason = state === "used"
    ? t("Cette invitation a déjà été utilisée. Connectez-vous avec votre mot de passe.", "This invitation has already been used. Sign in with your password.")
    : state === "expired"
      ? t("Ce lien a expiré. Demandez-en un nouveau à 3M TRAVEL AGENCY ou au gestionnaire de votre organisation.", "This link has expired. Ask 3M TRAVEL AGENCY or your organisation’s manager for a new one.")
      : state === "revoked"
        ? t("Cette invitation a été annulée. Contactez 3M TRAVEL AGENCY.", "This invitation was cancelled. Please contact 3M TRAVEL AGENCY.")
        : t("Ce lien d’invitation n’est pas valable.", "This invitation link is not valid.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16" data-testid="partner-activation">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-black text-slate-950"><KeyRound className="h-5 w-5 text-indigo-700" aria-hidden="true" />{t("Activer mon accès partenaire", "Activate my partner access")}</h1>
        {done ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status" data-testid="partner-activation-success">
            <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("Votre accès est activé.", "Your access is active.")}</p>
            <p className="mt-1 text-sm">{t(`Vous pouvez maintenant vous connecter à l’espace de ${done.organizationName}. Activez ensuite la double authentification dans l’onglet Sécurité.`, `You can now sign in to ${done.organizationName}’s workspace. Then enable two-factor authentication in the Security tab.`)}</p>
            <a href={PARTNER_ROUTES.login} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-800">{t("Se connecter", "Sign in")}</a>
          </div>
        ) : invitation.isLoading && token.length >= 20 ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("Vérification du lien…", "Checking the link…")}</p>
        ) : invalid ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950" role="alert" data-testid="partner-activation-invalid">
            <p className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" aria-hidden="true" />{t("Lien non valable", "Link not valid")}</p>
            <p className="mt-1 text-sm">{reason}</p>
            <a href={PARTNER_ROUTES.login} className="mt-3 inline-flex min-h-11 items-center font-bold underline underline-offset-2">{t("Aller à la connexion", "Go to sign in")}</a>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <PrivacyNotice notice="partner_invitation" />
            <p className="text-sm leading-6 text-slate-600">
              {t(`${valid?.organizationName ?? "Votre organisation"} vous invite. Choisissez votre mot de passe personnel : il ne sera jamais demandé par e-mail.`, `${valid?.organizationName ?? "Your organisation"} has invited you. Choose your personal password: it will never be requested by email.`)}
            </p>
            <div>
              <Label>{t("E-mail professionnel", "Business email")}</Label>
              <Input value={valid?.email ?? ""} readOnly className="mt-1 bg-slate-50" autoComplete="username" />
            </div>
            <div>
              <Label>{t("Nom complet", "Full name")}</Label>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={valid?.fullName ?? ""} maxLength={255} className="mt-1" autoComplete="name" />
            </div>
            <div>
              <Label>{t("Mot de passe", "Password")}</Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} className="mt-1" autoComplete="new-password" data-testid="partner-activation-password" />
              <p className="mt-1 text-xs text-slate-500">{t("12 caractères minimum, avec au moins une lettre et un chiffre.", "At least 12 characters, with at least one letter and one digit.")}</p>
            </div>
            <div>
              <Label>{t("Confirmer le mot de passe", "Confirm password")}</Label>
              <Input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} maxLength={128} className="mt-1" autoComplete="new-password" />
            </div>
            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert" data-testid="partner-activation-error">{error}</p>}
            <Button type="submit" className="w-full bg-indigo-700 text-white hover:bg-indigo-800" disabled={activate.isPending} aria-busy={activate.isPending}>
              {activate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />}
              {activate.isPending ? t("Activation…", "Activating…") : t("Activer mon accès", "Activate my access")}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
