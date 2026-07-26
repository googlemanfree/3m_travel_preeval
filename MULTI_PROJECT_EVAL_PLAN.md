# Plan de Déploiement - Système d'Évaluation Multi-Projets

## État Actuel
- ✅ Checkpoint 2062d9ed : Site compile sans erreurs
- ✅ Authentification correcte : pages publiques accessibles, pages protégées sécurisées
- ✅ Pages créées : /tarifs, /avis, /blog (routes existantes)
- ✅ Boutons admin corrigés (un seul bouton)

## Prochaines Phases

### Phase 2 : Créer le Formulaire Dynamique Multi-Projets
Créer un composant `MultiProjectEvaluationForm.tsx` avec :
- Étape 1 : Infos générales (nom, email, WhatsApp, ville, pays, type de projet)
- Étape 2 : Champs conditionnels selon le type choisi

**Types de Projets :**
1. **VISA TRAVAIL** : Secteur, expérience, diplôme, langues, CV obligatoire
2. **VISA ÉTUDES** : Diplôme, moyenne, admission, garant financier, relevé notes optionnel
3. **VISA TOURISME** : Motif, historique voyage, refus consulaire, attaches socio-économiques

### Phase 3 : Procédures tRPC
- `submitEvaluation` : Créer une évaluation
- `getEvaluationStatus` : Récupérer le statut

### Phase 4 : Système d'Email
- Email J+0 : Accusé de réception instantané
- Email J+2 : Bilan d'Admissibilité (via job Heartbeat)

### Phase 5 : Intégration Home
Remplacer le formulaire actuel par le nouveau sur la page d'accueil

## Domaines
- www.3mtravelagency.click
- 3mtravelagency.click
- 3mtravelpre-gebuu8iq.manus.space

## Couleurs
- #0a2540 (bleu foncé)
- #0066cc (bleu)
- #ff9800 (orange)
