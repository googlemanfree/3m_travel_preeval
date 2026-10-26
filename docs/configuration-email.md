# Configuration des e-mails du site

Tous les messages envoyés par le site (candidats, partenaires, agences, équipe) passent par une seule boîte LWS.

## Variables d'application (Manus → Paramètres → Secrets)

| Variable | Valeur | Remarque |
|---|---|---|
| `SMTP_HOST` | `mail.3mtravelagency.com` | Serveur sortant indiqué par LWS (alternative : `mail85.lwspanel.com`) |
| `SMTP_PORT` | `587` (STARTTLS) ou `465` (SSL) | Les deux sont acceptés par LWS |
| `SMTP_USER` | `noreply@3mtravelagency.com` | Boîte réelle créée chez LWS (type Standard) |
| `SMTP_PASS` | mot de passe de cette boîte | Saisi uniquement par le propriétaire, jamais dans un chat ni dans le code |
| `SMTP_FROM` | `noreply@3mtravelagency.com` | Toute boîte `@3mtravelagency.com` est acceptée ; une autre adresse est remplacée par `hello@` |

## Ce que fait le code (`server/_core/email.ts`)

- L'expéditeur affiché est « 3M TRAVEL AGENCY ».
- Les réponses des destinataires vont toujours vers `hello@3mtravelagency.com` (redirigé vers la boîte lue par l'équipe).
- `getSmtpHealth` (centre e-mail de l'admin) indique si l'expéditeur a été corrigé et si le compte SMTP correspond à l'expéditeur.

## Vérifier qu'un changement de secret est bien appliqué

Un changement de secret n'est lu qu'au démarrage du serveur de production **après un vrai nouveau déploiement** (un redémarrage ou une republication à l'identique peut ne pas suffire).

1. Envoyer un message avec le formulaire public `/contact`.
2. Dans la boîte qui reçoit `hello@`, ouvrir le message : l'expéditeur doit être `noreply@3mtravelagency.com`, pas un compte Gmail.
3. Si l'expéditeur est encore un compte Gmail, le serveur utilise toujours les anciens secrets.

## Limites à connaître

- Le pack LWS Mail Standard limite le volume d'envoi (environ 120 messages par heure et 1 200 par jour, à confirmer dans le panneau LWS) : à surveiller avant d'activer les relances automatiques (`SCHEDULED_JOBS_MODE=live`).
- SPF, DKIM et DMARC du domaine sont actifs chez LWS (panneau « État de la messagerie »).
