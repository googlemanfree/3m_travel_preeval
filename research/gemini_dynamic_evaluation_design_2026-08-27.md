# Évaluation dynamique assistée par Gemini — conception validée

## Objet

L’évaluation peut adapter les questions, les éléments à clarifier, les documents à préparer et les pistes à vérifier à partir du pays, du projet et des réponses volontairement fournies. Le service utilise le modèle serveur disponible `gemini-3-flash-preview` avec une sortie JSON stricte. Aucune clé n’est transmise au navigateur.

## Limites obligatoires

Le service produit un brouillon préparatoire, jamais une décision consulaire, d’admission, d’emploi, de visa ou de permis. Il ne formule ni score officiel, ni frais, salaire, délai garanti, ni promesse de résultat. Il ne reçoit pas les fichiers joints ; le consentement explicite couvre uniquement les réponses déclarées. Les informations à vérifier doivent rester séparées des faits déclarés.

## Parcours

1. Après choix du pays et du projet, le candidat peut demander une adaptation guidée après consentement.
2. Le serveur renvoie un nombre limité de questions complémentaires, d’éléments à clarifier, de priorités documentaires et de pistes autorisées.
3. Les réponses complémentaires sont ajoutées au dossier d’évaluation, puis un brouillon interne est préparé après la soumission uniquement si le consentement est toujours actif.
4. L’administrateur relit, modifie si nécessaire avec motif, puis valide explicitement avant tout envoi. L’espace client et l’e-mail n’affichent que le contenu validé.

## Continuité opérationnelle

La réception immédiate, la référence persistante et l’objectif de revue sous 24 heures demeurent actifs. Les échecs du service produisent un état de reprise ; le formulaire reste utilisable et l’équipe peut poursuivre la revue manuellement.
