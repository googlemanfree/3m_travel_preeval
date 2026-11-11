import React from "react";
import { AlertCircle, ExternalLink, Loader2, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { digitalWhatsAppUrl } from "@/lib/companyContacts";
import { OFFICIAL_MAIL_SENDER, maskEmail, supportMessage, webmailShortcut, type EmailKind } from "@/lib/emailDeliveryHelp";

interface EmailDeliveryHelpProps {
  email: string;
  kind: EmailKind;
  onResend: () => void;
  isSending: boolean;
  /** Secondes avant le prochain envoi autorisé (0 = prêt). */
  secondsLeft: number;
  /** Heure (ms) du dernier envoi accepté par le serveur. */
  sentAt?: number | null;
  /** Message d'erreur du dernier essai ; un échec ne démarre jamais le délai d'attente. */
  errorMessage?: string | null;
  /** Permet de corriger une adresse mal saisie. */
  onChangeEmail?: () => void;
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Bloc commun « je n'ai rien reçu » : renvoi avec délai visible, raccourci vers la messagerie, vérifications utiles
 * et solution de repli (WhatsApp). Il ne dit jamais « envoyé » avant que le serveur ait accepté la demande.
 */
export default function EmailDeliveryHelp({ email, kind, onResend, isSending, secondsLeft, sentAt, errorMessage, onChangeEmail }: EmailDeliveryHelpProps) {
  const masked = maskEmail(email);
  const webmail = webmailShortcut(email);
  const waiting = secondsLeft > 0;
  const disabled = isSending || waiting || !email.trim();
  const resendLabel = kind === "verification" ? "Renvoyer l’e-mail de confirmation" : "Renvoyer le lien";

  return (
    <section className="space-y-4 text-left" data-testid="email-delivery-help" aria-label="Aide si vous ne recevez pas l’e-mail">
      {sentAt ? (
        <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" data-testid="email-sent-status">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            E-mail envoyé{masked ? <> à <strong>{masked}</strong></> : null} à {clock(sentAt)}.
          </span>
        </p>
      ) : null}

      {errorMessage ? (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert" data-testid="email-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onResend}
          disabled={disabled}
          aria-disabled={disabled}
          data-testid="email-resend-button"
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {isSending ? "Envoi en cours…" : waiting ? `Renvoyer dans ${secondsLeft} s` : resendLabel}
        </button>
        {webmail ? (
          <a
            href={webmail.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="email-webmail-link"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-blue-700 px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {webmail.label}
          </a>
        ) : null}
      </div>
      {waiting ? (
        <p className="text-xs text-slate-600" aria-live="polite" data-testid="email-cooldown-note">
          Chaque nouvel envoi remplace le précédent : patientez un instant avant de redemander.
        </p>
      ) : null}

      <ul className="space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700" data-testid="email-checklist">
        <li>
          Cherchez un message de <strong>3M TRAVEL AGENCY</strong> (<span className="whitespace-nowrap">{OFFICIAL_MAIL_SENDER}</span>) et regardez aussi dans
          <strong> Spams</strong>, <strong>Courrier indésirable</strong> ou <strong>Promotions</strong>.
        </li>
        <li>
          Le message peut mettre quelques minutes à arriver
          {masked ? <> sur <strong>{masked}</strong></> : null}.
          {onChangeEmail ? (
            <>
              {" "}
              Adresse incorrecte ?{" "}
              <button type="button" onClick={onChangeEmail} className="font-semibold text-blue-800 underline underline-offset-2" data-testid="email-change-button">
                La modifier
              </button>
              .
            </>
          ) : null}
        </li>
        {kind === "verification" ? <li>Si vous avez demandé plusieurs envois, utilisez le <strong>dernier</strong> e-mail reçu : les liens précédents ne fonctionnent plus.</li> : null}
        <li>Ajoutez {OFFICIAL_MAIL_SENDER} à vos contacts pour que nos prochains messages arrivent bien en boîte de réception.</li>
      </ul>

      <a
        href={digitalWhatsAppUrl(supportMessage(kind, email))}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="email-whatsapp-support"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Toujours rien ? Écrire au support sur WhatsApp
      </a>
    </section>
  );
}
