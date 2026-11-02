import { useState } from "react";
import { Copy, MailPlus, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { PARTNER_PERMISSION_KEYS, PARTNER_PERMISSION_LABELS, type PartnerPermissionKey } from "@shared/partnerModule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { sessionToken: string };

const stateLabel = (state: string, t: (fr: string, en: string) => string) =>
  state === "valid" ? t("En attente", "Pending") : state === "used" ? t("Activée", "Activated") : state === "revoked" ? t("Révoquée", "Revoked") : t("Expirée", "Expired");

/** Équipe d'une entreprise partenaire : invitations par lien personnel et permissions par utilisateur (gestionnaires). */
export function PartnerTeamPanel({ sessionToken }: Props) {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const team = trpc.partnerModule.employerTeam.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"reader" | "manager">("reader");
  const [permissions, setPermissions] = useState<Record<PartnerPermissionKey, boolean>>({ viewCvtheque: true, submitNeeds: false, requestInterviews: false, inviteUsers: false });
  const [lastLink, setLastLink] = useState<string | null>(null);
  const refresh = () => utils.partnerModule.employerTeam.invalidate();
  const invite = trpc.partnerModule.employerInviteColleague.useMutation({
    onSuccess: (result) => {
      setLastLink(result.link);
      setFullName("");
      setEmail("");
      toast.success(result.emailSent ? t("Invitation envoyée", "Invitation sent") : t("Invitation créée", "Invitation created"), {
        description: result.emailSent ? t("Un lien personnel valable 72 heures a été envoyé par e-mail.", "A personal link valid for 72 hours was emailed.") : t("L’e-mail n’a pas pu partir : copiez le lien ci-dessous.", "The email could not be sent: copy the link below."),
      });
      void refresh();
    },
    onError: (error) => toast.error(t("Invitation non envoyée", "Invitation not sent"), { description: error.message }),
  });
  const revoke = trpc.partnerModule.employerRevokeInvitation.useMutation({ onSuccess: () => void refresh(), onError: (error) => toast.error(error.message) });
  const setUserPermissions = trpc.partnerModule.employerSetPermissions.useMutation({
    onSuccess: () => { toast.success(t("Permissions mises à jour", "Permissions updated")); void refresh(); },
    onError: (error) => toast.error(t("Permissions non modifiées", "Permissions not updated"), { description: error.message }),
  });

  if (team.error) return <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{team.error.message}</p>;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2" data-testid="partner-team-panel-invitations">
      <p className="flex items-center gap-2 font-bold text-slate-900"><UserPlus className="h-4 w-4 text-indigo-700" aria-hidden="true" />{t("Utilisateurs et invitations", "Users and invitations")}</p>
      <p className="mt-1 text-xs text-slate-500">{t("Chaque collègue reçoit un lien personnel à usage unique et choisit son propre mot de passe. Vous choisissez ce qu’il peut faire.", "Each colleague receives a personal single-use link and chooses their own password. You choose what they can do.")}</p>
      <form
        className="mt-3 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          invite.mutate({ sessionToken, fullName, email, role, permissions: role === "reader" ? permissions : undefined });
        }}
      >
        <label className="text-sm font-semibold text-slate-800">{t("Nom complet", "Full name")}
          <Input required minLength={2} maxLength={255} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1" autoComplete="off" />
        </label>
        <label className="text-sm font-semibold text-slate-800">{t("E-mail professionnel", "Business email")}
          <Input required type="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1" autoComplete="off" />
        </label>
        <label className="text-sm font-semibold text-slate-800">{t("Rôle", "Role")}
          <select value={role} onChange={(event) => setRole(event.target.value as "reader" | "manager")} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="reader">{t("Lecteur (permissions au choix)", "Reader (permissions of your choice)")}</option>
            <option value="manager">{t("Gestionnaire (toutes les permissions)", "Manager (all permissions)")}</option>
          </select>
        </label>
        {role === "reader" && (
          <fieldset className="text-sm text-slate-800">
            <legend className="font-semibold">{t("Permissions", "Permissions")}</legend>
            <div className="mt-1 grid gap-1">
              {PARTNER_PERMISSION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={permissions[key]} onChange={(event) => setPermissions((current) => ({ ...current, [key]: event.target.checked }))} />{t(PARTNER_PERMISSION_LABELS[key].fr, PARTNER_PERMISSION_LABELS[key].en)}</label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="md:col-span-2">
          <Button type="submit" disabled={invite.isPending} aria-busy={invite.isPending} className="bg-indigo-700 text-white hover:bg-indigo-800"><MailPlus className="mr-2 h-4 w-4" aria-hidden="true" />{invite.isPending ? t("Envoi…", "Sending…") : t("Envoyer l’invitation", "Send invitation")}</Button>
        </div>
      </form>
      {lastLink && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-950" role="status">
          <span className="break-all">{lastLink}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(lastLink); toast.success(t("Lien copié", "Link copied")); }}><Copy className="mr-1 h-3 w-3" aria-hidden="true" />{t("Copier", "Copy")}</Button>
        </div>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="font-bold text-slate-900">{t("Membres", "Members")}</p>
          <ul className="mt-2 space-y-2">
            {(team.data?.members ?? []).map((member) => (
              <li key={member.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="flex flex-wrap items-center justify-between gap-2 font-medium text-slate-900"><span>{member.fullName} <span className="text-xs font-normal text-slate-500">· {member.email}</span></span><span className="inline-flex items-center gap-1 text-xs text-slate-600"><ShieldCheck className="h-3 w-3" aria-hidden="true" />{member.role === "manager" ? t("Gestionnaire", "Manager") : t("Lecteur", "Reader")}</span></p>
                {member.role === "reader" && (
                  <div className="mt-2 grid gap-1 text-xs text-slate-700">
                    {PARTNER_PERMISSION_KEYS.map((key) => (
                      <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={member.permissions[key]} disabled={setUserPermissions.isPending} onChange={(event) => setUserPermissions.mutate({ sessionToken, accountId: member.id, permissions: { ...member.permissions, [key]: event.target.checked } })} />{t(PARTNER_PERMISSION_LABELS[key].fr, PARTNER_PERMISSION_LABELS[key].en)}</label>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-900">{t("Invitations", "Invitations")}</p>
          <ul className="mt-2 space-y-2">
            {(team.data?.invitations ?? []).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                <span>{item.fullName} <span className="text-xs text-slate-500">· {item.email}</span></span>
                <span className="flex items-center gap-2 text-xs text-slate-600">{stateLabel(item.state, t)}{item.state === "valid" && <Button size="sm" variant="ghost" disabled={revoke.isPending} onClick={() => revoke.mutate({ sessionToken, invitationId: item.id })}>{t("Révoquer", "Revoke")}</Button>}</span>
              </li>
            ))}
            {(team.data?.invitations ?? []).length === 0 && <li className="text-sm text-slate-500">{t("Aucune invitation.", "No invitations.")}</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
