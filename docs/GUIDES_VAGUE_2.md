# Guides pays : vague 2 (visiteur, 25 pays de l'espace Schengen)

Préparés le 2026-11-19. Fichier : `shared/countryCatalogDraftsWave2.ts` ; test : `server/countryCatalogDraftsWave2.test.ts`.

## Ce qui est prêt

Le parcours « Visiteur » des 25 pays Schengen que la vague 1 ne couvrait pas : Autriche, Bulgarie, Croatie, Tchéquie, Danemark, Estonie, Finlande, Grèce, Hongrie, Islande, Italie, Lettonie, Liechtenstein, Lituanie, Malte, Pays-Bas, Norvège, Pologne, Portugal, Roumanie, Slovaquie, Slovénie, Espagne, Suède, Suisse.

Chaque brouillon reprend les règles du court séjour communes à tout l'espace Schengen, déjà relues pour la France, l'Allemagne, la Belgique et le Luxembourg (visa C, 90 jours sur toute période de 180 jours, frais de dossier, dépôt en personne pour les empreintes, décision jamais garantie). **Rien de propre à un pays n'est écrit** (poste de dépôt, prestataire, délais locaux, pièces supplémentaires) : le texte renvoie à la source officielle du pays et à votre conseiller.

## Ce qui n'est PAS fait (et pourquoi)

- **Rien n'est publié.** Les brouillons s'importent en « À confirmer », avec une source « à confirmer ». Un administrateur doit ouvrir la source, la marquer « vérifiée », puis publier la fiche.
- **Les 25 sources n'ont pas toutes pu être lues par un robot.** Lues le 2026-11-19 : AT, CZ, EE, HR, LV, MT, NL, PL, SI, CH. Les portails des 15 autres pays (BG, DK, FI, GR, HU, IS, IT, LI, LT, NO, PT, RO, SK, ES, SE) refusent la lecture automatique (protection anti-robot, erreur 403 ou captcha) : leur adresse vient de la liste des portails officiels déjà relus le 14 octobre 2026, mais elle est à ouvrir à la main.
- **Les pays hors Schengen** (États-Unis, Turquie, Qatar, Arabie saoudite, Maroc, Afrique du Sud, Australie, Nouvelle-Zélande, Irlande, etc.) ne sont pas dans cette vague : leurs règles (frais, durée, pièces) sont propres à chaque pays et doivent être lues sur chaque portail officiel. Le catalogue de départ les contient déjà en « À confirmer ».
- Les parcours **travail et études** des 25 pays ne sont pas rédigés : aucun fait ne doit y être inventé.

## Comment les importer et les publier (administration)

1. Administration, catalogue pays : bouton **« Importer les brouillons (32 pays) »**. L'import ne touche jamais une fiche déjà publiée ni déjà détaillée, ne marque aucune source « vérifiée » et ne publie rien.
2. Pour chaque pays : ouvrir la source, vérifier que la page décrit bien le visa de court séjour, la marquer **vérifiée** (la date du jour est enregistrée).
3. Relire le texte puis **publier** la fiche. Le guide apparaît dans `/pays` et dans « Pour aller plus loin » du pays.

## Pour aller plus loin (vague 3)

Pour chaque pays hors Schengen, lire le portail officiel (visa visiteur, étudiant, travail), puis ajouter un brouillon à `shared/countryCatalogDrafts*.ts` avec uniquement des faits lus sur la source, et laisser « à confirmer par votre conseiller » toute valeur qui varie ou se contredit entre sources.
