# Changement d’adresse e-mail candidat — contrôles de sécurité

## Parcours mis en œuvre

Le changement est initié uniquement par un candidat déjà authentifié, depuis son profil. La nouvelle adresse est normalisée et contrôlée contre les adresses déjà associées à un autre compte. L’interface ne modifie jamais directement l’adresse de connexion.

Une demande crée deux jetons aléatoires distincts. Seules leurs empreintes SHA-256 sont conservées dans le registre `candidate_email_change_requests`. Un lien est envoyé à l’adresse actuelle et un second à la nouvelle adresse ; chaque lien expire au bout d’une heure. La page de destination nécessite une confirmation volontaire, pour éviter qu’un préchargement automatique d’e-mail ne finalise l’action.

## Finalisation et protection des données

La modification de l’adresse et l’alignement des dossiers liés ne surviennent qu’après confirmation des deux liens. Une demande antérieure active est annulée lorsqu’une nouvelle demande est créée. Une demande en attente peut être annulée depuis le profil et les demandes expirées sont marquées comme telles. Les réponses d’erreur ne révèlent pas si une adresse appartient à un tiers.

La page portant le jeton (`/confirm-email-change`) est servie avec `noindex,follow` et n’entre pas dans le sitemap. Aucun jeton ni contenu de dossier n’est inscrit dans les journaux applicatifs. Les messages de confirmation ne sont envoyés qu’à la suite d’une demande réelle de l’utilisateur ; aucun e-mail de test n’a été envoyé pendant les vérifications.
