# Vérification en conditions réelles : bilan, espace client, suivi

Durée : environ 20 minutes. À faire sur le site de test (staging) avec un compte administrateur et **un compte candidat de test** (adresse e-mail que vous contrôlez). Ne jamais utiliser le compte d'un vrai candidat.

Pour chaque ligne : cochez si c'est conforme, sinon notez ce que vous voyez et envoyez une capture d'écran.

## A. Côté administrateur — saisir, valider, envoyer

| # | Action | Résultat attendu | OK |
|---|--------|------------------|----|
| 1 | Admin → Évaluations → « Saisir et envoyer mon bilan » sur le candidat de test | Une fenêtre s'ouvre avec un champ de saisie, un aperçu à droite, trois boutons (Enregistrer, Valider, Envoyer) et « M'envoyer un test » | ☐ |
| 2 | Choisir « Partir d'un modèle » (visa travail) | Un canevas apparaît ; la liste « À corriger » signale les zones « [À CONFIRMER] » | ☐ |
| 3 | Remplir les zones, la note, puis « Informations du dossier » : frais d'ouverture, date limite, conseiller | L'aperçu se met à jour pendant la frappe ; les variables {{montant}}, {{date_limite}}, {{conseiller}} sont remplacées | ☐ |
| 4 | Vérifier la fiche en haut de l'aperçu | Numéro de compte COMPTE-…, e-mail, téléphone, conseiller et date d'émission sont corrects | ☐ |
| 5 | Écrire « visa garanti » dans le texte | Un blocage rouge apparaît ; cliquer dessus place le curseur sur le mot ; Valider et Envoyer sont inactifs | ☐ |
| 6 | Coller un texte depuis Word ou Google Docs (titres, liste, tableau) | La structure est conservée (titres, puces, tableau) dans le champ et dans l'aperçu | ☐ |
| 7 | Fermer la fenêtre après une modification | Une confirmation apparaît ; rouvrir restitue la saisie | ☐ |
| 8 | « Enregistrer » | Message « Bilan enregistré » ; rien n'est envoyé au candidat | ☐ |
| 9 | « M'envoyer un test » | Vous recevez l'e-mail réel (en-tête de l'agence, bouton « Je valide et j'ouvre mon dossier ») ; le candidat ne reçoit rien | ☐ |
| 10 | « Imprimer / PDF » sous l'aperçu | Le document s'ouvre sur papier à en-tête, texte justifié | ☐ |
| 11 | « Envoyer » puis confirmer | Message de succès ; la fenêtre se ferme ; le bouton devient « Bilan déjà envoyé » (inactif) à la réouverture | ☐ |
| 12 | Cliquer deux fois très vite sur « Envoyer » (autre bilan de test) | Un seul e-mail reçu | ☐ |
| 13 | Notifications admin | « Évaluation effectuée : bilan envoyé » apparaît | ☐ |

## B. Côté candidat de test

| # | Action | Résultat attendu | OK |
|---|--------|------------------|----|
| 14 | Ouvrir l'e-mail reçu | Mise en forme soignée (en-tête, fiche d'identification, bilan justifié, bouton) ; lisible sur téléphone | ☐ |
| 15 | Se connecter à l'espace client | Le bilan est affiché identique à l'e-mail, avec Imprimer / Word / Copier | ☐ |
| 16 | Sous le bilan | « Je valide et j'ouvre mon dossier », « Parler à mon conseiller », « Je ne valide pas » ; aucun montant fixe ni promesse de résultat | ☐ |
| 17 | « Parler à mon conseiller » | La page défile jusqu'à la prise de rendez-vous | ☐ |
| 18 | « Je ne valide pas » → choisir un motif → envoyer | Message de confirmation ; l'admin reçoit « Bilan non validé : à rappeler » | ☐ |
| 19 | « Je valide et j'ouvre mon dossier » | Message de succès ; l'étape frais d'ouverture apparaît ; l'admin reçoit « Bilan validé : ouverture de dossier demandée » ; le dossier n'est PAS activé sans preuve de paiement | ☐ |

## C. Suivi administrateur

| # | Action | Résultat attendu | OK |
|---|--------|------------------|----|
| 20 | Admin → Outils → « Bilans à relancer » | Entonnoir (envoyés, ouverts, ouvertures demandées, payés, refusés), motifs de refus, taux par destination | ☐ |
| 21 | « Relancer » sur un bilan en attente | Confirmation, puis le candidat reçoit une notification et un e-mail ; le bouton devient « Relancé il y a moins de 24 h » | ☐ |
| 22 | « Proposer 2 versements » | Deux échéances créées (moitié maintenant, solde à 30 jours) ; le candidat est prévenu ; le montant total est inchangé | ☐ |

## Si quelque chose diffère

Envoyez la ligne concernée (numéro), une capture d'écran et, si possible, ce que vous attendiez. Ne contournez rien : un blocage affiché est voulu.
