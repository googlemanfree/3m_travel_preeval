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
