# Interface et validation lors d’un changement de pays

## Objectif

Permettre au candidat de changer de pays ou de type de projet sans perdre les données communes, tout en rendant visibles les réponses devenues incompatibles, les champs à compléter et les conséquences sur le score et les documents.

Le parcours doit être utilisable sur mobile, accessible au clavier et compréhensible sans connaissance technique.

## 1. Sélecteur principal

Le formulaire affiche une barre de contexte persistante en haut de l’écran :

```text
Pays de destination       Type de projet       Procédure
[ France             v ]   [ Études       v ]   [ Programme universitaire v ]
```

Sur mobile, les trois choix deviennent une étape verticale :

```text
1. Pays       France                         [Modifier]
2. Projet     Études                         [Modifier]
3. Procédure  Programme universitaire        [Modifier]
```

Chaque sélecteur doit être un vrai contrôle accessible : `label`, `role=combobox`, recherche textuelle, navigation clavier, option « Destination à étudier » et message d’état annoncé par `aria-live`.

Le bouton de changement reste visible, mais le nouveau schéma n’est chargé qu’après sélection valide du pays et du projet.

## 2. Prévisualisation avant application

Après un nouveau choix, le système compare l’ancien et le nouveau schéma avant de remplacer l’écran. Une boîte de dialogue récapitule :

```text
Changer vers : France — Études

Le formulaire va être adapté.

Conservé automatiquement
✓ Identité et coordonnées
✓ Nationalité et pays de résidence
✓ Pièces déjà déposées dans le coffre

Nouvelles informations demandées
+ Parcours académique
+ Formation visée
+ Informations propres à la procédure

Réponses mises en archive pour l’ancien parcours
• Expérience professionnelle
• Informations liées à l’employeur

Le score et la checklist seront recalculés selon le nouveau schéma.

[Annuler]                         [Appliquer le changement]
```

Le bouton d’application doit indiquer clairement s’il existe des réponses spécifiques qui seront archivées. Aucune donnée n’est supprimée physiquement.

## 3. Cas sans impact significatif

Si seuls le pays ou la procédure changent sans réponse incompatible :

```text
Le nouveau parcours utilise les mêmes informations principales.
Les données communes seront conservées et le formulaire sera actualisé.

[Annuler] [Continuer]
```

Le changement peut alors être appliqué directement après confirmation courte, sans dialogue alarmant.

## 4. Cas de schéma indisponible ou non vérifié

### Pays connu, procédure non publiée

```text
Ce parcours n’est pas encore disponible en configuration publiée.

Nous pouvons enregistrer vos informations générales et transmettre le dossier
à une revue manuelle. Aucune exigence de visa ni aucun score automatique ne
sera présenté sans source officielle validée.

[Retour au choix] [Démarrer la collecte minimale]
```

### Pays hors catalogue

```text
Cette destination n’est pas encore présente dans le catalogue.

Vous pouvez demander une étude de destination. Le formulaire recueillera
uniquement les informations générales nécessaires à la revue.

[Choisir un autre pays] [Demander une étude]
```

### Source officielle manquante

```text
Les exigences détaillées de ce parcours sont en cours de vérification.
Les champs affichés sont indicatifs et ne constituent pas une décision de visa.

[Retour] [Continuer en revue manuelle]
```

Dans ces cas, aucun champ spécifique ne doit être marqué « obligatoire » sans source liée.

## 5. Affichage des erreurs de validation

Les erreurs apparaissent à quatre niveaux complémentaires.

### Niveau 1 — Erreur dans le champ

Le champ devient visuellement identifiable, avec un message directement sous le contrôle :

```text
Niveau de langue
[                         ]
Erreur : sélectionnez une valeur ou choisissez « À confirmer ».
```

Règles :

- le message doit être relié par `aria-describedby` ;
- le champ invalide reçoit `aria-invalid="true"` ;
- la couleur ne doit jamais être le seul signal ;
- le texte doit rester lisible sur mobile ;
- le focus est déplacé vers la première erreur après une soumission bloquée.

### Niveau 2 — Erreur de section

En haut de la section concernée :

```text
2 éléments à vérifier dans « Parcours académique ».
[Afficher les erreurs]
```

Le bouton « Afficher les erreurs » déplie la liste et permet d’accéder directement à chaque champ.

### Niveau 3 — Résumé global

Après clic sur « Enregistrer et continuer » :

```text
Votre brouillon n’est pas encore complet.

• Identité : 0 erreur
• Projet : 1 information manquante
• Documents : 2 éléments à confirmer

[Aller à la première erreur]
```

Le résumé doit être placé au début de la zone principale et recevoir le focus pour les utilisateurs clavier.

### Niveau 4 — Erreur technique ou serveur

```text
Impossible d’enregistrer ce changement pour le moment.
Votre dernière version locale est conservée sur cet appareil.
Aucune donnée n’a été supprimée.

[Réessayer] [Continuer hors connexion]
```

Ne jamais afficher une erreur technique brute, une stack trace ou une réponse interne au candidat.

## 6. Erreurs spécifiques au changement de pays

### Réponse devenue incompatible

```text
Cette réponse appartient à l’ancien parcours et ne s’applique pas automatiquement
à la nouvelle procédure. Elle a été conservée dans l’historique précédent.

Action : laissez ce champ vide, complétez-le pour le nouveau parcours ou revenez
à l’ancienne évaluation.
```

### Document non réutilisable

```text
Le document « Justificatif financier » est conservé dans votre coffre, mais
son statut doit être vérifié pour cette nouvelle procédure.

[Voir le document] [Marquer comme à vérifier]
```

### Réponse commune à confirmer

Certaines données communes peuvent nécessiter une confirmation si elles sont anciennes :

```text
Votre numéro de téléphone date de plus de 12 mois.
Confirmez-vous qu’il est toujours valable ?

[Modifier] [Confirmer]
```

### Changement après soumission

```text
Cette évaluation a déjà été envoyée.
Le changement créera une nouvelle évaluation et ne modifiera pas le bilan déjà transmis.

[Conserver l’ancienne] [Créer une nouvelle évaluation]
```

## 7. Résumé après application

Une fois le nouveau schéma chargé, une bannière non bloquante confirme le résultat :

```text
Parcours mis à jour : France — Études

✓ 6 informations communes conservées
✓ 3 sections adaptées
• 2 anciennes réponses archivées
• 4 documents à vérifier ou à fournir

Votre brouillon est enregistré.
```

La bannière doit être annoncée par `aria-live="polite"` et disparaître sans masquer les contrôles.

## 8. Indicateur de progression

La progression doit distinguer les états suivants :

```text
Identité             Terminé
Projet               Terminé
Parcours académique  À compléter
Documents            2 à vérifier
Revue                Non commencée
```

Il ne faut pas présenter ce pourcentage comme une probabilité d’obtention du visa ou une décision consulaire.

Le changement de pays recalcule la progression à partir du nouveau schéma. L’ancien pourcentage reste visible uniquement dans l’historique de l’ancienne évaluation.

## 9. Sauvegarde et reprise

Pendant un changement de schéma :

1. enregistrer l’état courant du brouillon ;
2. calculer la compatibilité des champs ;
3. présenter le résumé d’impact ;
4. demander confirmation si des réponses deviennent inactives ;
5. créer la nouvelle version de brouillon ;
6. sauvegarder `schemaId`, `schemaVersion`, pays et projet ;
7. afficher la confirmation de sauvegarde.

En cas de panne pendant l’opération, l’ancien brouillon reste récupérable. Le nouveau brouillon n’est activé qu’après écriture complète et validation serveur.

## 10. Synchronisation avec l’administration

La fiche 360° doit afficher un encart identique au contexte candidat :

```text
Évaluation active
France · Études · Programme universitaire
Schéma 1.2.0 · Dernière modification : 20/10/2026

6 champs communs conservés · 2 réponses archivées · 4 documents à vérifier
```

L’administration voit également :

- la liste des anciennes évaluations ;
- le schéma et sa version pour chacune ;
- les réponses inactives, en lecture seule ;
- les erreurs de validation non résolues ;
- les documents requis par le nouveau parcours ;
- les sources officielles associées aux règles.

Un admin ne doit pas pouvoir faire passer une réponse archivées pour une réponse du nouveau visa simplement en changeant un libellé dans l’interface.

## 11. États à tester

| État | Résultat attendu |
|---|---|
| Changement sans incompatibilité | Confirmation courte, données communes conservées |
| Changement avec réponses spécifiques | Résumé d’impact et archivage des anciennes réponses |
| Champ commun invalide | Erreur inline, focus et résumé global |
| Procédure non publiée | Revue manuelle, aucun score ou document imposé |
| Pays hors catalogue | Collecte minimale et demande d’étude |
| Erreur réseau | Brouillon local préservé, aucune suppression |
| Évaluation déjà envoyée | Nouvelle évaluation, ancienne immuable |
| Document réutilisable | Conservation dans le coffre, nouvelle vérification contextuelle |
| Utilisateur mobile | Contrôles larges, dialogue accessible, pas de débordement |
| Utilisateur clavier/lecteur d’écran | Focus, labels, `aria-invalid`, `aria-describedby`, `aria-live` corrects |

## Décisions proposées

1. Utiliser une confirmation avant tout changement qui archive des réponses spécifiques.
2. Conserver automatiquement les données communes marquées réutilisables.
3. Ne jamais supprimer physiquement une réponse ou une pièce lors d’un changement de parcours.
4. Bloquer uniquement les champs obligatoires du schéma publié et sourcé.
5. Utiliser la revue manuelle pour les pays ou procédures sans configuration officielle validée.
6. Afficher le même résumé de changement dans l’espace candidat et la fiche administrative.
