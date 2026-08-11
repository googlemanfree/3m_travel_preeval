# Configuration DNS Officielle pour 3mtravelagency.com (Resend & Fournisseur d'E-mail)

Pour garantir une délivrabilité optimale et authentifier les e-mails envoyés depuis `hello@3mtravelagency.com`, vous devez ajouter les enregistrements DNS suivants dans la zone DNS de votre hébergeur de domaine (`3mtravelagency.com`).

## 1. Enregistrement SPF (Sender Policy Framework)
Autorise les serveurs de votre fournisseur d'e-mail (ex: Resend) à envoyer des messages au nom de votre domaine.
- **Type :** `TXT`
- **Nom / Hôte :** `@` (ou laissez vide pour la racine)
- **Valeur :** `v=spf1 include:amazonses.com ~all` (ou l'include fourni par votre opérateur Resend/SMTP)

## 2. Enregistrement DKIM (DomainKeys Identified Mail)
Permet de signer numériquement les messages pour prouver qu'ils n'ont pas été altérés en transit.
- **Type :** `CNAME` (ou `TXT` selon Resend)
- **Nom / Hôte :** `resend._domainkey` (ou le sélecteur fourni par votre tableau de bord Resend)
- **Valeur :** `resend._domainkey.resend.com` (valeur fournie par votre dashboard Resend)

## 3. Enregistrement DMARC (Domain-based Message Authentication, Reporting, and Conformance)
Définit la politique à suivre si les vérifications SPF ou DKIM échouent.
- **Type :** `TXT`
- **Nom / Hôte :** `_dmarc`
- **Valeur :** `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@3mtravelagency.com; pct=100`

---

## Alertes automatiques de réception et Historique de délivrabilité

Le système intègre désormais :
1. Une table `email_delivery_logs` traçant chaque envoi, destinataire, sujet et statut de délivrabilité.
2. Un module d'historique consultable dans le tableau de bord administrateur.
3. Un déclencheur d'alerte en cas de réception de nouveaux messages sur `hello@3mtravelagency.com` (transférable vers le canal WhatsApp de l'agence).
