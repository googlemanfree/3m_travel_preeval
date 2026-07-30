# 📸 Guide d'Optimisation des Images

Ce guide explique comment utiliser les scripts et composants d'optimisation d'images pour améliorer les performances du site.

---

## 🚀 Démarrage Rapide

### 1. Installer les dépendances

```bash
npm install sharp --save-dev
```

### 2. Convertir les images existantes

```bash
# Convertir toutes les images en WebP et AVIF
node scripts/convert-images.mjs

# Avec options personnalisées
node scripts/convert-images.mjs --webp-quality=85 --avif-quality=80

# Batch processing (plusieurs répertoires)
node scripts/batch-optimize-images.mjs --report
```

### 3. Utiliser les composants dans le code

```tsx
import { LazyImage, OptimizedImage, ResponsiveImage } from '@/components/LazyImage';

// Image simple avec lazy loading
<LazyImage 
  src="/manus-storage/image.webp" 
  alt="Description"
  width={800}
  height={600}
/>

// Image optimisée avec formats multiples
<OptimizedImage 
  src="/manus-storage/hero"
  alt="Hero"
  width={1200}
  height={600}
  priority={true}
/>

// Image responsive avec srcset
<ResponsiveImage 
  src="/manus-storage/feature"
  alt="Feature"
  width={800}
  height={600}
  responsiveSizes={{
    mobile: { width: 320 },
    tablet: { width: 768 },
    desktop: { width: 1280 },
  }}
/>
```

---

## 📋 Scripts Disponibles

### convert-images.mjs

Convertit les images d'un répertoire en WebP et AVIF.

**Usage:**
```bash
node scripts/convert-images.mjs [options]
```

**Options:**
```bash
--input <dir>              Répertoire d'entrée (défaut: client/src/assets)
--output <dir>             Répertoire de sortie (défaut: même que input)
--webp-quality <0-100>     Qualité WebP (défaut: 80)
--avif-quality <0-100>     Qualité AVIF (défaut: 75)
--jpg-quality <0-100>      Qualité JPG (défaut: 85)
--png-compression <0-9>    Compression PNG (défaut: 9)
--skip-webp                Ignorer la conversion WebP
--skip-avif                Ignorer la conversion AVIF
--skip-optimize            Ignorer l'optimisation de l'original
--verbose                  Afficher les détails
```

**Exemples:**
```bash
# Convertir avec qualité élevée
node scripts/convert-images.mjs --webp-quality=90 --avif-quality=85

# Convertir un répertoire spécifique
node scripts/convert-images.mjs --input ./client/public

# Afficher les détails
node scripts/convert-images.mjs --verbose
```

### batch-optimize-images.mjs

Traite les images dans plusieurs répertoires (assets, public, webdev-static-assets).

**Usage:**
```bash
node scripts/batch-optimize-images.mjs [options]
```

**Options:**
```bash
--dry-run       Simuler sans modifier les fichiers
--report        Générer un rapport JSON
--verbose       Afficher les détails
--skip-webp     Ignorer WebP
--skip-avif     Ignorer AVIF
```

**Exemples:**
```bash
# Simuler l'optimisation
node scripts/batch-optimize-images.mjs --dry-run

# Générer un rapport
node scripts/batch-optimize-images.mjs --report

# Verbose avec rapport
node scripts/batch-optimize-images.mjs --verbose --report
```

---

## 🖼️ Composants d'Image

### LazyImage

Composant simple avec lazy loading via Intersection Observer.

**Props:**
```tsx
interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;                    // URL de l'image
  alt: string;                    // Texte alternatif
  width?: number;                 // Largeur
  height?: number;                // Hauteur
  priority?: boolean;             // Charger immédiatement (LCP)
  placeholder?: string;           // Image placeholder
  onLoad?: () => void;            // Callback au chargement
  onError?: () => void;           // Callback en cas d'erreur
}
```

**Exemple:**
```tsx
<LazyImage 
  src="/manus-storage/feature.webp" 
  alt="Feature"
  width={800}
  height={600}
  priority={false}
/>
```

### OptimizedImage

Utilise `<picture>` pour servir les meilleurs formats (AVIF → WebP → JPG).

**Props:**
```tsx
interface OptimizedImageProps extends Omit<LazyImageProps, 'src'> {
  src: string;                    // URL sans extension
  formats?: {                     // Formats personnalisés
    avif?: string;
    webp?: string;
    jpg?: string;
  };
  sizes?: string;                 // Media queries pour srcset
}
```

**Exemple:**
```tsx
<OptimizedImage 
  src="/manus-storage/hero"
  alt="Hero"
  width={1200}
  height={600}
  priority={true}
/>
```

### ResponsiveImage

Génère un srcset pour différentes résolutions.

**Props:**
```tsx
interface ResponsiveImageProps extends Omit<LazyImageProps, 'src' | 'sizes'> {
  src: string;
  responsiveSizes?: {
    mobile?: { width: number; quality?: number };
    tablet?: { width: number; quality?: number };
    desktop?: { width: number; quality?: number };
  };
}
```

**Exemple:**
```tsx
<ResponsiveImage 
  src="/manus-storage/feature"
  alt="Feature"
  width={800}
  height={600}
  responsiveSizes={{
    mobile: { width: 320, quality: 80 },
    tablet: { width: 768, quality: 85 },
    desktop: { width: 1280, quality: 90 },
  }}
/>
```

---

## 🎯 Bonnes Pratiques

### 1. Images Critiques (LCP)

Pour les images du héros ou au-dessus de la ligne de flottaison:

```tsx
<OptimizedImage 
  src="/manus-storage/hero"
  alt="Hero"
  priority={true}  // ← Important!
  width={1200}
  height={600}
/>
```

**Bénéfices:**
- Chargement immédiat (eager)
- Préchargement du navigateur
- Améliore LCP

### 2. Images Non-Critiques

Pour les images en bas de page:

```tsx
<LazyImage 
  src="/manus-storage/feature.webp" 
  alt="Feature"
  priority={false}  // ← Lazy loading
  width={800}
  height={600}
/>
```

**Bénéfices:**
- Chargement à la demande
- Réduit le bundle initial
- Améliore les performances

### 3. Dimensions Correctes

Toujours spécifier width et height pour éviter le CLS:

```tsx
// ✅ BON
<LazyImage 
  src="image.webp" 
  alt="Image"
  width={800}
  height={600}
/>

// ❌ MAUVAIS
<LazyImage 
  src="image.webp" 
  alt="Image"
/>
```

### 4. Formats Multiples

Utiliser `<picture>` pour les meilleurs formats:

```tsx
// ✅ BON
<OptimizedImage 
  src="/manus-storage/image"
  alt="Image"
/>

// ❌ MAUVAIS
<img src="/manus-storage/image.jpg" alt="Image" />
```

### 5. Responsive Images

Adapter les images à la taille de l'écran:

```tsx
<ResponsiveImage 
  src="/manus-storage/image"
  alt="Image"
  responsiveSizes={{
    mobile: { width: 320 },
    tablet: { width: 768 },
    desktop: { width: 1280 },
  }}
/>
```

---

## 📊 Optimisation des Qualités

### Recommandations

| Format | Qualité | Compression | Cas d'usage |
|---|---|---|---|
| **WebP** | 75-85 | Très bonne | Images générales |
| **AVIF** | 70-80 | Excellente | Images modernes |
| **JPG** | 80-90 | Bonne | Fallback |
| **PNG** | 9 | Très bonne | Compression max |

### Exemples de Configuration

**Haute Qualité (pour photos):**
```bash
node scripts/convert-images.mjs \
  --webp-quality=90 \
  --avif-quality=85 \
  --jpg-quality=90
```

**Qualité Équilibrée (recommandé):**
```bash
node scripts/convert-images.mjs \
  --webp-quality=80 \
  --avif-quality=75 \
  --jpg-quality=85
```

**Basse Qualité (pour thumbnails):**
```bash
node scripts/convert-images.mjs \
  --webp-quality=70 \
  --avif-quality=65 \
  --jpg-quality=75
```

---

## 🔧 Intégration avec Vite

### Configuration Vite

```ts
// vite.config.ts
export default defineConfig({
  build: {
    // Minifier les assets
    minify: 'terser',
    
    // Optimiser les images
    rollupOptions: {
      output: {
        // Code splitting
        manualChunks: {
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  
  // Précharger les images critiques
  server: {
    preload: [
      { src: '/manus-storage/hero.webp', as: 'image' },
    ],
  },
});
```

### Préchargement dans HTML

```html
<!-- client/index.html -->
<link rel="preload" as="image" href="/manus-storage/hero.webp" />
<link rel="preload" as="image" href="/manus-storage/hero.avif" type="image/avif" />
```

---

## 📈 Mesurer les Résultats

### Avant Optimisation

```bash
# Tester avec PageSpeed Insights
curl -X POST https://www.googleapis.com/pagespeedonline/v5/runPagespeed \
  -d url=https://3mtravelagency.click \
  -d strategy=mobile
```

### Après Optimisation

```bash
# Comparer les résultats
node scripts/batch-optimize-images.mjs --report

# Analyser le rapport
cat image-optimization-report.json | jq '.summary'
```

**Résultats attendus:**
- Réduction de 60-70% pour les images PNG → WebP
- Réduction de 25-35% pour les images JPG → WebP
- Réduction supplémentaire de 15-20% pour WebP → AVIF
- PageSpeed Mobile: +20-30 points

---

## 🐛 Dépannage

### Les images ne se chargent pas

**Cause:** URL incorrecte ou format non supporté

**Solution:**
```tsx
// Vérifier l'URL
console.log(src); // Doit être une URL valide

// Utiliser OptimizedImage avec fallback
<OptimizedImage src="/manus-storage/image" alt="Image" />
```

### Les images se chargent lentement

**Cause:** Lazy loading trop agressif

**Solution:**
```tsx
// Augmenter le rootMargin
// Dans LazyImage.tsx, modifier:
rootMargin: '150px', // Au lieu de '50px'
```

### CLS (Cumulative Layout Shift)

**Cause:** Dimensions manquantes

**Solution:**
```tsx
// ✅ Toujours spécifier width et height
<LazyImage 
  src="image.webp" 
  alt="Image"
  width={800}      // ← Important
  height={600}     // ← Important
/>
```

### Format AVIF non supporté

**Cause:** Navigateur ancien

**Solution:**
```tsx
// OptimizedImage gère automatiquement le fallback
<OptimizedImage src="/manus-storage/image" alt="Image" />
// Fallback: AVIF → WebP → JPG
```

---

## 📚 Ressources

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Format](https://developers.google.com/speed/webp)
- [AVIF Format](https://aomediacodec.org/av1-image-format/)
- [Lazy Loading API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Picture Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)

---

## ✅ Checklist d'Implémentation

- [ ] Installer Sharp: `npm install sharp --save-dev`
- [ ] Copier les composants LazyImage.tsx et ImageOptimizer.tsx
- [ ] Copier les scripts convert-images.mjs et batch-optimize-images.mjs
- [ ] Convertir les images existantes: `node scripts/batch-optimize-images.mjs`
- [ ] Remplacer les `<img>` par `<LazyImage>` ou `<OptimizedImage>`
- [ ] Tester avec PageSpeed Insights
- [ ] Vérifier les Core Web Vitals
- [ ] Valider le score PageSpeed Mobile 95+

---

**Dernière mise à jour:** 30 Juillet 2026  
**Auteur:** Manus AI
