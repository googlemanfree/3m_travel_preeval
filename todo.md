

## PR145 — stabilité des contrats après réalignement sur main
- [x] Corriger uniquement les assertions obsolètes liées aux pages lazy, logo/SW, contenus légaux, SEO, parcours, visuels, contact, hubs et ordre des sections.
- [x] Aligner les tests pré-dossier sur la règle actuelle : activation conservée, aucune corbeille automatique des dossiers frères/doublons.
- [x] `pnpm run check` vert et lots ciblés : 15 suites / 126 tests verts après corrections.
- [x] `git diff --check` vert.
- [x] La suite complète n’est pas relancée après correction : le test pré-dossier déclenche actuellement des e-mails SMTP réels; aucune nouvelle exécution n’a été faite pour éviter un nouvel envoi.
