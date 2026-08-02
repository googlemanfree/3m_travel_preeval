# Modifications en cours - 3M Travel

## Tâches à compléter:

### 1. Améliorer le bouton "Renvoyer l'email" sur la page de connexion
- Ajouter un bouton visible si le compte n'est pas vérifié
- Intégrer une modale pour saisir l'email et renvoyer le lien de vérification
- Status: En cours

### 2. Page de validation d'email (VerifyEmailLink.tsx)
- Vérifier que la page fonctionne correctement
- Afficher un message de succès avec redirection vers login
- Status: À vérifier

### 3. Ajouter connexion Google et Facebook
- Sur la page Register.tsx: ajouter les boutons OAuth
- Sur la page Login.tsx: ajouter les boutons OAuth
- Implémenter les procédures tRPC pour OAuth
- Status: À faire

## Notes importantes:
- Formulaire d'inscription simplifié: 4 champs (fullName, email, password, confirmPassword)
- Requête SQL brute utilisée pour l'insertion minimale
- Email de confirmation envoyé après inscription
- Redirection vers /verify-email-sent après inscription
