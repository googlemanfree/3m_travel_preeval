# Contrôle réel de remise d’évaluation

Date du contrôle : 2026-09-02.

Le test a été exécuté depuis l’interface administrateur sur le dossier `COMPTE-1110001`, après connexion admin et confirmation explicite avant diffusion. Le destinataire affiché était `fabienbah203@gmail.com`. Le contenu était explicitement marqué comme test et ne contenait aucune décision d’éligibilité.

Le formulaire admin a confirmé la validation humaine. L’interface a ensuite affiché l’évaluation comme validée. Les logs de production ont confirmé une remise SMTP réussie avec un identifiant fournisseur, sans exception postérieure liée au dossier. Le chemin serveur génère le PDF avant la remise e-mail et enregistre la clé et l’URL PDF dans le dossier lorsque la séquence aboutit.

Le suivi d’ouverture repose sur un pixel signé et idempotent. Les relances automatiques sont exécutées par le job Heartbeat existant toutes les cinq minutes, après 72 heures sans ouverture, avec une réservation atomique et au maximum une relance par dossier.

Aucun secret SMTP ni contenu complet du bilan n’est conservé dans cette note.
