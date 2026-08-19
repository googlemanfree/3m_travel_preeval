# Inventaire initial — bibliothèque Ressources

Source consultée le 19 août 2026 : `https://www.3mtravelagency.com/ressources`.

La bibliothèque publique annonce **107 documents de destination** et les répartit en quatre ensembles : **34 guides Travail**, **22 guides Études**, **27 guides Visiteur / Tourisme** et **23 guides spécialisés**. La page propose également un filtre de formulaires.

Les guides exposent des destinations et procédures identifiables depuis leur titre et leur lien de téléchargement. Exemples constatés : Allemagne, Australie, Canada, Chypre, Croatie, Estonie, États-Unis, France, Hongrie, Irlande, Islande, Italie, Kenya, Lettonie, Liechtenstein, Lituanie, Luxembourg, Malaisie, Malte, Maurice, Norvège, Nouvelle-Zélande, Pologne, Portugal, Qatar, Roumanie, Royaume-Uni, Sénégal, Slovaquie, Slovénie, Suisse, République tchèque et Gabon pour le parcours Travail.

Les parcours Études et Visiteur / Tourisme apportent d’autres variantes pays-procédure, notamment Arménie et Émirats arabes unis (référence Dubaï / EAU). Les PDF et DOCX doivent être traités comme sources documentaires de travail ; les portails de dépôt, délais, frais et critères doivent être confirmés sur l’autorité compétente avant publication dans le registre administratif.

## Conséquence d’implémentation

Le futur catalogue doit distinguer **pays** et **procédure** : une destination peut contenir plusieurs guides, formulaires, pièces attendues et liens institutionnels selon qu’il s’agit d’un projet Travail, Études, Visiteur / Tourisme, e‑Visa ou Installation.

## Source applicative canonique

Le catalogue est aussi présent dans `shared/pdfResources.ts`, via `PDF_CATEGORIES`. Chaque entrée conserve un identifiant stable, un titre, le pays, le drapeau, le type de fichier, la catégorie et une URL `/manus-storage/...` vers sa ressource.

| Catégorie | Guides listés | Finalité de formulaire |
|---|---:|---|
| `travail` | 34 | Offre ou objectif professionnel, expérience pertinente, disponibilité, justificatifs de qualification et pièces employeur lorsqu’elles existent. |
| `etudes` | 22 | Programme, niveau, établissement, admission, financement, relevés et diplômes. |
| `visiteur` | 27 | Motif, dates, hébergement, itinéraire, budget, assurance et éléments de retour. |
| `guide` | 23 | Procédures spécialisées et pays : notamment Arménie, Azerbaïdjan, Géorgie, Australie, Nouvelle-Zélande, Canada et Schengen. |
| `formulaire` | 1 | Accompagnement d’enfant mineur dans l’espace Schengen. |

Les entrées source permettent de relier automatiquement la combinaison **pays + procédure** au guide téléchargeable correspondant. Elles ne constituent pas, à elles seules, une preuve à jour d’éligibilité individuelle ou de portail de dépôt : le registre administratif doit conserver séparément le lien de l’autorité, sa date de vérification et son statut de contrôle.
