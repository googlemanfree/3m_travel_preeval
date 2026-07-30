# 🎨 Guide d'Optimisation CSS et JavaScript

Ce guide explique comment optimiser les fichiers CSS et JavaScript pour améliorer les performances du site.

---

## 🚀 Démarrage Rapide

### 1. Analyser l'état actuel

```bash
# Analyser CSS et JavaScript
node scripts/optimize-css-js.mjs --analyze

# Générer un rapport
node scripts/optimize-css-js.mjs --report

# Analyser le bundle
node scripts/analyze-bundle.mjs

# Générer le code splitting
node scripts/generate-code-splitting.mjs
```

### 2. Implémenter les optimisations

```bash
# Construire en production (minification automatique)
npm run build

# Vérifier la taille du bundle
ls -lh dist/assets/
```

### 3. Valider les améliorations

```bash
# Tester avec PageSpeed Insights
curl -X POST https://www.googleapis.com/pagespeedonline/v5/runPagespeed \
  -d url=https://3mtravelagency.click \
  -d strategy=mobile
```

---

## 📋 Scripts Disponibles

### optimize-css-js.mjs

Analyse les fichiers CSS et JavaScript pour identifier les optimisations.

**Usage:**
```bash
node scripts/optimize-css-js.mjs [options]
```

**Options:**
```bash
--analyze       Afficher les conseils d'optimisation
--report        Générer un rapport JSON
```

**Résultats:**
- Taille totale CSS/JS
- Nombre de règles CSS
- Nombre de lignes de code
- Code mort détecté (console.log, debugger, TODO)
- Dépendances potentiellement inutilisées

### generate-code-splitting.mjs

Génère automatiquement le code splitting pour les routes.

**Usage:**
```bash
node scripts/generate-code-splitting.mjs [options]
```

**Options:**
```bash
--output <path>  Chemin du fichier App.tsx optimisé
```

**Résultats:**
- Configuration JSON des routes
- Rapport d'analyse
- Fichier App.tsx avec lazy loading

### analyze-bundle.mjs

Analyse la taille du bundle et les dépendances.

**Usage:**
```bash
node scripts/analyze-bundle.mjs [options]
```

**Résultats:**
- Nombre de dépendances
- Structure du projet
- Recommandations d'optimisation
- Rapport JSON

---

## 🎯 Optimisations Prioritaires

### 1. CODE SPLITTING (Impact: +15 points)

**Problème:** Tout le code est chargé au démarrage

**Solution:** Charger le code des pages seulement quand nécessaire

**Avant:**
```tsx
import Home from "./pages/Home";
import Flights from "./pages/Flights";
import Dashboard from "./pages/Dashboard";
// ... 50+ autres imports

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/flights" component={Flights} />
      <Route path="/dashboard" component={Dashboard} />
    </Switch>
  );
}
```

**Après:**
```tsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import("./pages/Home"));
const Flights = lazy(() => import("./pages/Flights"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <Suspense fallback={<PageLoader />}>
          <Home />
        </Suspense>
      )} />
      <Route path="/flights" component={() => (
        <Suspense fallback={<PageLoader />}>
          <Flights />
        </Suspense>
      )} />
      <Route path="/dashboard" component={() => (
        <Suspense fallback={<PageLoader />}>
          <Dashboard />
        </Suspense>
      )} />
    </Switch>
  );
}
```

**Gains:**
- Bundle initial: -40%
- LCP: -20%
- TTI: -25%

**Implémentation:**
```bash
# Générer le code splitting
node scripts/generate-code-splitting.mjs

# Reviser le fichier App.optimized.tsx
# Fusionner progressivement avec App.tsx
```

---

### 2. MINIFICATION CSS/JS (Impact: +8 points)

**Problème:** Fichiers non minifiés en production

**Solution:** Vite minifie automatiquement

**Configuration Vite (déjà optimisée):**
```ts
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

**Vérification:**
```bash
npm run build
ls -lh dist/assets/

# Avant: index-abc123.js (250KB)
# Après: index-abc123.js (150KB)
```

---

### 3. SUPPRESSION DU CODE MORT (Impact: +3 points)

**Problème:** console.log, debugger, TODO dans le code

**Solution:** Utiliser ESLint et Terser

**Détection:**
```bash
# Chercher le code mort
node scripts/optimize-css-js.mjs --report

# Résultats:
# console.log: 45 occurrences
# debugger: 3 occurrences
# TODO: 12 occurrences
```

**Suppression manuelle:**
```bash
# Chercher les console.log
grep -r "console.log" client/src --include="*.tsx"

# Supprimer les console.log (avec sed)
sed -i '/console\.log/d' client/src/pages/*.tsx
```

**Automatisation avec ESLint:**
```bash
npm install --save-dev eslint-plugin-no-console

# .eslintrc.json
{
  "plugins": ["no-console"],
  "rules": {
    "no-console": "error"
  }
}
```

---

### 4. TREE-SHAKING (Impact: +5 points)

**Problème:** Importer des modules entiers au lieu d'utiliser named imports

**Avant:**
```tsx
// ❌ Importe tout le module
import * as utils from './utils';
import * as lodash from 'lodash';

utils.formatDate(date);
lodash.debounce(fn, 300);
```

**Après:**
```tsx
// ✅ Importe seulement ce qui est nécessaire
import { formatDate } from './utils';
import { debounce } from 'lodash-es';

formatDate(date);
debounce(fn, 300);
```

**Gains:**
- Bundle: -10-15%
- Parsing: -20%

**Vérification:**
```bash
# Vérifier les imports
grep -r "import \*" client/src --include="*.tsx"

# Remplacer les imports
# import * as utils from './utils' → import { func } from './utils'
```

---

### 5. OPTIMISATION DES POLICES (Impact: +3 points)

**Problème:** Polices chargées de manière bloquante

**Solution:** Précharger et utiliser font-display: swap

**Avant:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700" rel="stylesheet" />
```

**Après:**
```html
<!-- Précharger -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Charger avec swap -->
<link 
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" 
  rel="stylesheet" 
/>
```

**CSS:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

**Gains:**
- Évite le FOUT (Flash of Unstyled Text)
- Améliore LCP
- Réduit CLS

---

### 6. COMPRESSION BROTLI (Impact: +10 points)

**Problème:** Fichiers non compressés

**Solution:** Manus gère automatiquement Brotli

**Vérification:**
```bash
# Tester la compression
curl -I -H "Accept-Encoding: br,gzip" https://3mtravelagency.click/

# Vérifier les headers
# Content-Encoding: br (Brotli)
# ou
# Content-Encoding: gzip
```

**Gains:**
- CSS: -60%
- JS: -50%
- HTML: -70%

---

### 7. CACHE NAVIGATEUR (Impact: +5 points)

**Problème:** Fichiers rechargés à chaque visite

**Solution:** Ajouter les headers Cache-Control

**Configuration Express:**
```ts
// server/_core/index.ts
app.use((req, res, next) => {
  // Assets statiques: 1 an
  if (req.url.match(/\.(js|css|woff2|png|jpg|webp|avif)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // HTML: 1 heure
  else if (req.url.endsWith('.html') || req.url === '/') {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  // API: pas de cache
  else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

**Gains:**
- Visite suivante: -80% de chargement
- Améliore FID
- Améliore TTI

---

## 🛠️ Configuration Vite Optimisée

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'trpc': ['@trpc/client', '@trpc/react-query'],
        },
      },
    },
    
    // Optimisation CSS
    cssCodeSplit: true,
    
    // Optimisation des assets
    assetsInlineLimit: 4096, // Inliner les petits assets
    
    // Sourcemaps en production
    sourcemap: false,
  },
  
  // Optimisation du serveur de dev
  server: {
    preload: [
      { src: '/manus-storage/hero.webp', as: 'image' },
    ],
  },
});
```

---

## 📊 Checklist d'Implémentation

### Phase 1: Code Splitting (1 semaine)
- [ ] Générer le code splitting: `node scripts/generate-code-splitting.mjs`
- [ ] Reviser App.optimized.tsx
- [ ] Fusionner progressivement avec App.tsx
- [ ] Tester chaque page avec lazy loading
- [ ] Vérifier les Core Web Vitals

### Phase 2: Minification & Compression (3 jours)
- [ ] Vérifier que Vite minifie en production
- [ ] Tester la compression Brotli
- [ ] Ajouter les headers Cache-Control
- [ ] Vérifier les tailles de fichiers

### Phase 3: Code Mort (2 jours)
- [ ] Analyser le code mort: `node scripts/optimize-css-js.mjs --report`
- [ ] Supprimer les console.log
- [ ] Supprimer les debugger
- [ ] Supprimer les TODO/FIXME

### Phase 4: Tree-Shaking (2 jours)
- [ ] Auditer les imports
- [ ] Remplacer les `import *` par named imports
- [ ] Vérifier les dépendances inutilisées
- [ ] Mesurer la réduction du bundle

### Phase 5: Polices & Caching (2 jours)
- [ ] Précharger les polices
- [ ] Ajouter font-display: swap
- [ ] Configurer le cache navigateur
- [ ] Tester les performances

### Phase 6: Testing & Monitoring (3 jours)
- [ ] Tester avec PageSpeed Insights
- [ ] Monitorer les Core Web Vitals
- [ ] Valider le score 95+
- [ ] Documenter les résultats

---

## 📈 Gains Attendus

| Optimisation | Gain | Effort |
|---|---|---|
| **Code Splitting** | +15 pts | Moyen |
| **Minification** | +8 pts | Aucun |
| **Code Mort** | +3 pts | Facile |
| **Tree-Shaking** | +5 pts | Moyen |
| **Polices** | +3 pts | Facile |
| **Compression** | +10 pts | Aucun |
| **Cache** | +5 pts | Facile |
| **TOTAL** | **+49 pts** | **2 semaines** |

**Score Final:** 55 + 49 = **104 pts** (capped at 100) ✅

---

## 🐛 Dépannage

### Le code splitting ne fonctionne pas

**Cause:** Suspense mal configuré

**Solution:**
```tsx
// ✅ BON
<Suspense fallback={<PageLoader />}>
  <Page />
</Suspense>

// ❌ MAUVAIS
<Page />
```

### Les fichiers sont toujours gros

**Cause:** Minification non activée

**Solution:**
```bash
# Vérifier la configuration Vite
npm run build
ls -lh dist/assets/

# Doit être minifié
```

### Les polices se chargent lentement

**Cause:** Pas de préchargement

**Solution:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

---

## 📚 Ressources

- [Vite Documentation](https://vitejs.dev/)
- [Terser Documentation](https://terser.org/)
- [Web Fonts Best Practices](https://web.dev/optimize-webfont-loading/)
- [Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
- [Tree-Shaking](https://webpack.js.org/guides/tree-shaking/)

---

**Dernière mise à jour:** 30 Juillet 2026  
**Auteur:** Manus AI
