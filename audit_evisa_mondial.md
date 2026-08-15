# Rapport d'Audit et de Comparaison du Catalogue e-Visa Mondial (Prime Travel Service)

## 1. Introduction et Méthodologie

Le présent rapport dresse l'inventaire comparatif du catalogue des autorisations de voyage électroniques (**e-Visa**, **ETA**, **e-VOA**) intégré dans la plateforme **Prime Travel Service**. 

Pour garantir une rigueur absolue, la classification distingue :
- **Les pays déjà présents** dans le module actuel (`Evisas.tsx`).
- **Les pays manquants** recensés dans les bases internationales d'immigration (portails officiels gouvernementaux) mais non encore intégrés dans notre interface.
- **Les exclusions délibérées** (pays à visa consulaire physique en ambassade uniquement ou espace Schengen, qui ne relèvent pas du format e-Visa direct).

---

## 2. Liste des Pays Actuellement Présents dans le Catalogue (v221)

Le catalogue actuel couvre **42 destinations** réparties sur 5 continents :

### 🌍 Afrique (17 destinations)
1. **Égypte** (e-Visa Touristique - 25 USD)
2. **Kenya** (eTA Électronique - 34 USD)
3. **Tanzanie & Zanzibar** (e-Visa Touristique - 50 USD)
4. **Maroc** (e-Visa AEVM - 770 MAD)
5. **Rwanda** (e-Visa Entrée - 50 USD)
6. **Éthiopie** (e-Visa Tourisme - 82 USD)
7. **Gabon** (e-Visa Électronique - 85 EUR)
8. **Côte d'Ivoire** (e-Visa Snedai - 73 EUR)
9. **Togo** (e-Visa Voyage - 35 000 XOF)
10. **Ouganda** (e-Visa Touristique - 50 USD)
11. **Bénin** (e-Visa Électronique - 50 EUR)
12. **Zambie & Zimbabwe** (Kaza Univisa - 50 USD)
13. **Madagascar** (e-Visa Séjour - 35 EUR)
14. **Cap-Vert** (Autorisation EASE - 31 EUR)
15. **Angola** (e-Visa Pré-approbation - 120 USD)
16. **Mozambique** (e-Visa Touristique - 50 USD)
17. **Malawi** (e-Visa Touristique - 50 USD)
18. **Djibouti** (e-Visa Touristique - 31 USD)

### 🌏 Asie & Moyen-Orient (20 destinations)
19. **Émirats Arabes Unis / Dubaï** (e-Visa Tourisme - 130 USD)
20. **Arabie Saoudite** (e-Visa Tourisme / Oumrah - 140 USD)
21. **Turquie** (e-Visa Électronique - 50 USD)
22. **Inde** (e-Visa Tourist / Business - 25 à 100 USD)
23. **Viêt Nam** (e-Visa Électronique - 25 USD)
24. **Thaïlande** (e-Visa Officiel - 40 USD)
25. **Cambodge** (e-Visa Touristique - 36 USD)
26. **Indonésie / Bali** (e-VOA - 35 USD)
27. **Qatar** (e-Visa Hayya - Gratuit / Variable)
28. **Oman** (e-Visa Touristique - 20 OMR)
29. **Sri Lanka** (ETA Électronique - 50 USD)
30. **Ouzbékistan** (e-Visa Électronique - 20 USD)
31. **Jordanie** (Jordan Pass / e-Visa - 70 JOD)
32. **Laos** (e-Visa Touristique - 50 USD)
33. **Mongolie** (e-Visa Touristique - 21.50 USD)
34. **Bahreïn** (e-Visa Touristique - 29 BHD)
35. **Kirghizistan** (e-Visa Touristique - 50 USD)
36. **Taïwan** (Travel Authorization Certificate - Gratuit)
37. **Pakistan** (e-Visa Tourisme - 25 USD)
38. **Philippines** (ETA / e-Travel - Variable)

### 🇪🇺 🌎 Europe & Amériques (7 destinations)
39. **Russie** (e-Visa Unifié - 52 USD)
40. **Moldavie** (e-Visa Touristique - 80 EUR)
41. **Albanie** (e-Visa Électronique - 50 EUR)
42. **Cuba** (e-Visa Numérique / Tarjeta - 35 EUR)
43. **Suriname** (e-Visa / E-Fee - 50 USD)
44. **Antigua-et-Barbuda** (e-Visa Touristique - 100 USD)
45. **Bahamas** (e-Visa Touristique - 100 USD)

### 🇦🇺 Océanie (3 destinations)
46. **Australie** (ETA / eVisitor - 20 à 190 AUD)
47. **Nouvelle-Zélande** (NZeTA - 58 NZD)
48. **Papouasie-Nouvelle-Guinée** (e-Visa Touristique - 50 USD)

---

## 3. Liste des Pays Manquants à Intégrer (Prochaine Vague d'Expansion)

Pour atteindre une exhaustivité mondiale absolue sur les régimes d'autorisation électronique, voici les pays et territoires disposant d'un système e-Visa officiel qui peuvent encore être rajoutés :

1. **Azerbaïdjan** (ASAN Visa - e-Visa touristique 3 jours)
2. **Bahreïn** (Extension des catégories e-Visa d'affaires et familiales)
3. **Cambodge** (Extension e-Visa spécialisé affaires)
4. **Colombie** (e-Visa consulaire en ligne - procédure électronique intégrale)
5. **Corée du Sud** (K-ETA / Autorisation électronique obligatoire pour nationalités non dispensées)
6. **Djibouti** (Extension e-Visa transit et affaires)
7. **Équateur** (Visa électronique en ligne - e-Visa consulaire)
8. **Gabon** (Extension e-Visa long séjour et travail)
9. **Ghana** (Système e-Visa en cours de déploiement progressif pour les hubs d'affaires)
10. **Iran** (e-Visa avec code d'approbation préalable du Ministère des Affaires Étrangères)
11. ** Lesotho** (e-Visa Lesotho - extension des quotas)
12. **Montserrat** (e-Visa territoire britannique d'outre-mer)
13. **Myanmar (Birmanie)** (e-Visa Touristique officiel - temporairement soumis à réévaluation politique mais actif pour les affaires)
14. **Népal** (Visa à l'arrivée numérique / pré-demande en ligne)
15. **Sainte-Hélène** (e-Visa électronique d'outre-mer)
16. **Sao Tomé-et-Principe** (e-Visa officiel pour formalités simplifiées)
17. **Seychelles** (Autorisation de voyage électronique - Seychelles Electronic Border System)
18. **Sierra Leone** (e-Visa d'entrée aéroportuaire)
19. **Singapour** (SG Arrival Card et e-Visa pour nationalités soumises)
20. **Soudan du Sud** (e-Visa d'entrée officiel)
21. **Tadjikistan** (e-Visa Pamir et touristique étendu)
22. **Vietnam** (Extension e-Visa affaires et investisseurs)

---

## 4. Recommandations Stratégiques pour Prime Travel Service

1. **Mise à jour dynamique par API officielle** : À terme, connecter le module e-Visa aux bases de données officielles de l'IATA Timatic pour garantir que les frais et délais affichés se calent à jour sur les variations des gouvernements.
2. **Formulaire de pré-collecte unifié** : Permettre au candidat, lorsqu'il clique sur « Lancer la procédure » pour un pays donné, d'être redirigé vers un formulaire pré-rempli avec son passeport, évitant la ressaisie manuelle sur WhatsApp.
3. **Suivi des dossiers e-Visa** : Lier chaque demande d'e-Visa au numéro de dossier unique du client dans son espace unifié (`/mon-espace`).
