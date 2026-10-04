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

### Tâches planifiées manquantes (aucun identifiant de tâche enregistré)

Sans tâche planifiée externe qui les appelle, **ces routes ne s'exécutent jamais** : ni erreur ni alerte visible, les relances, évaluations automatiques et vérifications correspondantes ne partent simplement jamais. Chacune exige l'en-tête `Authorization: Bearer <CRON_SECRET>` (même secret que ci-dessus), en `POST`, corps vide.

| Route | Fréquence conseillée (indiquée dans le code) | Effet si jamais déclenchée |
| --- | --- | --- |
| `/api/scheduled/document-reminders` | Tous les jours, `0 0 10 * * *` (10:00 UTC) | **La plus critique** : relances des pièces manquantes (J+3/J+7/J+14), suivi des demandes de vol impayées ou avant départ, et alertes de baisse de tarif — tout est regroupé dans ce seul appel. |
| `/api/scheduled/evaluation-job` | Tous les jours, `0 0 8 * * *` (08:00 UTC) | Évaluation automatique des nouveaux dossiers. |
| `/api/scheduled/passport-pending-weekly-alert` | Chaque lundi, `0 0 9 * * 1` (09:00 UTC) | Alerte hebdomadaire des passeports en attente de vérification humaine. |
| `/api/scheduled/evaluation-bilan-job` | Fréquence non documentée dans le code — à confirmer avant d'en choisir une | Génération et envoi des bilans d'évaluation finalisés. |

Pour chacune, créer une tâche planifiée (même mécanisme que celle déjà active pour le rapport mensuel) ciblant l'URL complète (`https://www.3mtravelagency.com` + la route), avec le `CRON_SECRET` déjà enregistré.

**Cas à part — `/api/scheduled/external-link-check` et `/api/scheduled/evaluation-review-deadline-alerts`** : ces deux routes ne vérifient pas `CRON_SECRET` mais l'identité interne de tâche planifiée de la plateforme (`sdk.authenticateRequest` → `user.isCron`/`user.taskUid`), un mécanisme distinct des « Heartbeat callbacks » déjà utilisé ailleurs sur ce projet. Impossible de confirmer depuis le code seul si une tâche de ce type existe déjà : à vérifier directement avec Manus plutôt qu'à planifier comme les routes ci-dessus.
