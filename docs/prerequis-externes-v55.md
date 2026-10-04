# Prérequis externes — v55

## E-mails transactionnels

La clé `RESEND_API_KEY` est disponible, mais le domaine `3mtravelagency.com` doit être validé dans Resend avant la mise en production des confirmations, OTP et liens de réinitialisation. Les enregistrements SPF, DKIM et DMARC fournis par Resend doivent être publiés chez le gestionnaire DNS. L’adresse d’expédition applicative reste `hello@3mtravelagency.com`.

Le test d’envoi réel est désormais volontairement opt-in : exécuter `RUN_EXTERNAL_EMAIL_TESTS=true pnpm vitest run server/contact.sendEmail.test.ts` uniquement après la validation du domaine, avec une adresse de test autorisée.

## Paiement CinetPay

Configurer exclusivement dans les variables d’environnement serveur :

- `CINETPAY_SITE_ID`
- `CINETPAY_API_KEY`
- `APP_BASE_URL` avec `https://www.3mtravelagency.com`

Le callback CinetPay doit cibler l’URL HTTPS publique `/api/cinetpay/webhook`. Le paiement est désormais refusé côté application si les identifiants ne sont pas configurés : aucun succès simulé ni montant fourni par le navigateur n’est accepté.

## Documents et tâches planifiées

Le stockage privé s’appuie sur les identifiants S3 déjà injectés par la plateforme ; aucun secret ne doit être ajouté au code source. Le secret `CRON_SECRET` a été enregistré pour protéger les déclencheurs planifiés. Tout ordonnanceur externe doit l’envoyer uniquement côté serveur dans l’en-tête `Authorization: Bearer <CRON_SECRET>`.

Le rapport mensuel de conformité est activé sous l’identifiant de tâche `Z4qm8uHwqSCzUY2vngb6te`. Il s’exécute le premier jour de chaque mois à 08:00 UTC et appelle `/api/scheduled/compliance-monthly-report`.

### Planificateur interne (`server/cron/scheduledJobsCron.ts`)

Mise à jour du 2026-10-04 : plutôt que de créer une tâche planifiée externe par route, le serveur peut désormais déclencher
lui-même les 5 tâches ci-dessous (document-reminders, evaluation-job, evaluation-bilan-job, passport-pending-weekly-alert,
compliance-monthly-report — celle-ci fait doublon, sans risque, avec la tâche Manus déjà active `Z4qm8uHwqSCzUY2vngb6te`),
sur la cadence documentée dans le code. Contrôlé par la variable d'environnement serveur `SCHEDULED_JOBS_MODE` :

- absente ou `off` (défaut) : rien ne se déclenche, comme aujourd'hui.
- `dry-run` : aperçu sans effet de bord (n'envoie aucun e-mail), à utiliser en premier.
- `live` : exécute réellement les 5 tâches. **Avant de l'activer**, lire l'avertissement dans le fichier : `evaluation-job`
  et `evaluation-bilan-job` traitent jusqu'à 100 dossiers par passage et envoient un e-mail réel à chacun — si des dossiers
  se sont accumulés sans jamais être traités, le premier déclenchement peut envoyer bien plus d'e-mails qu'un jour normal.

**Restent hors de ce module** : `/api/scheduled/external-link-check` et `/api/scheduled/evaluation-review-deadline-alerts`.
Elles exigent, en plus de `CRON_SECRET`, un vrai jeton de session Manus (`sdk.authenticateRequest`, openId `cron_…`) —
seule une tâche planifiée créée côté Manus peut les déclencher ; `CRON_SECRET` seul y échoue toujours. À confirmer
directement avec Manus plutôt qu'à planifier comme les 5 autres.
