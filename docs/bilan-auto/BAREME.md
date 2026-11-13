# Barème proposé — version récapitulative à approuver

Total 100 · seuil interne 65/100 · profil TRAVAIL. Le total est calculé par le système, jamais saisi. **Non approuvé** : `GRID_V1.approvedAt` est vide et la publication réelle est refusée tant qu'il l'est (fichier `shared/bilanAuto/grid.ts`).

Types : **essentiel** (absent = rubrique non calculable → complément demandé) · **facultatif** (absent = 0 point « non renseigné », sans effet sur le reste) · **preuve** (pas de pièce = 0 point « non justifié ») · **système** (calculé depuis le dossier).

| Rubrique | Sous-critère | Max | Type | Règle |
|---|---|---|---|---|
| Formation /15 | Niveau de diplôme | 6 | essentiel | Bac+5 et plus 6 · Bac+3/4 5 · Bac+2 (BTS, DUT) 4 · Bac 2 · inférieur 1 |
| | Pertinence métier/pays | 5 | essentiel | alignée 5 · proche 3 · éloignée 1 |
| | Diplôme dans une pièce | 4 | preuve | pièce examinée 4 · déclaré 1 · sinon 0 |
| Expérience /20 | Durée pertinente | 8 | essentiel | ≥10 ans 8 · 6–9 : 7 · 3–5 : 5 · 1–2 : 3 · <1 : 1 |
| | Responsabilité | 6 | essentiel | encadrement 6 · autonomie 4 · exécution 2 |
| | Cohérence chronologique | 3 | facultatif | cohérente 3 · lacunes expliquées 2 · incohérente 0 (signalée) |
| | Expérience dans une pièce | 3 | preuve | pièce 3 · déclarée 1 · sinon 0 |
| Compétences /20 | Techniques alignées au métier | 10 | essentiel | fort 10 · partiel 6 · faible 2 |
| | Certifications et outils | 5 | facultatif | ≥3 : 5 · 2 : 4 · 1 : 3 |
| | Compétences transférables | 5 | facultatif | ≥4 : 5 · 3 : 4 · 2 : 3 · 1 : 2 |
| Langues /15 | Langue de travail du pays | 8 | essentiel | C1+ 8 · B2 6 · B1 4 · A2 2 · A1/débutant 0 |
| | Autre langue utile | 4 | facultatif | B2+ 4 · B1 3 · A2 2 |
| | Preuve ou test | 3 | preuve | pièce 3 · déclaré 1 |
| Projet /10 | Métier et pays ciblés | 4 | essentiel | les deux 4 · un seul 2 |
| | Plan et calendrier | 3 | facultatif | plan+calendrier 3 · plan 2 · intention 1 |
| | Cohérence avec le parcours | 3 | facultatif | cohérent 3 · partiel 2 · incohérent 0 (signalé) |
| Administratif /10 | Identité cohérente | 3 | système | cohérente 3 · non vérifiable 2 · contradictoire 0 (**bloquant**) |
| | Coordonnées et passeport déclarés | 3 | système | les deux 3 · coordonnées 2 · passeport seul 1 |
| | Formulaire complet | 4 | système | ≥90 % 4 · ≥75 % 3 · ≥50 % 2 · sinon 1 |
| Justificatifs /10 | Pièces reçues et lisibles | 5 | preuve | 0:0 · 1:2 · 2:3 · 3:4 · ≥4:5 |
| | Cohérence avec le déclaré | 5 | preuve | cohérentes 5 · partielles 3 · contradictoires 0 (**bloquant**) · aucune 0 |

Principes appliqués (testés) : explication de chaque note · provenance déclaré / pièce examinée / vérifié par l'agence / non renseigné / contradictoire · une pièce lue n'est pas une pièce authentifiée · aucune photo, sexe, origine, nationalité ni situation familiale · l'âge n'entre pas dans la note · une absence n'est pas une compétence inexistante · pas de refus automatique.

Règles ajoutées après relecture du cahier des charges (code + tests) : la durée d'expérience est l'**union** des périodes d'emploi (deux emplois simultanés ne s'additionnent pas, périodes incohérentes ignorées et signalées) ; des **études en cours** ne sont jamais comptées comme un diplôme obtenu.

À décider avant approbation : poids de la preuve (4/3/3/5) ; seuils de durée d'expérience ; rôle de la « cohérence chronologique » (facultative aujourd'hui).
