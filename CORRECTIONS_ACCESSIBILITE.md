# 🔧 CORRECTIONS ACCESSIBILITÉ - 17 Problèmes Majeurs

## 1. Ajouter aria-labels sur Boutons Icon-Only

### Fichiers à Modifier :
- `client/src/components/Navbar.tsx` - Menu toggle
- `client/src/components/FloatingServices.tsx` - Gear icon
- `client/src/components/FloatingWhatsAppButton.tsx` - WhatsApp button
- `client/src/components/AccessibleModal.tsx` - Close button

### Correction :
```tsx
// ❌ Avant
<button><Menu className="w-5 h-5" /></button>

// ✅ Après
<button 
  aria-label="Ouvrir le menu de navigation"
  title="Ouvrir le menu"
>
  <Menu className="w-5 h-5" />
</button>
```

---

## 2. Implémenter Support Clavier pour Dropdowns

### Fichiers :
- `client/src/components/AccessibleDropdown.tsx` ✅ CRÉÉ

### Caractéristiques :
- ✅ Arrow Up/Down pour navigation
- ✅ Enter/Space pour sélection
- ✅ Escape pour fermer
- ✅ Home/End pour premier/dernier
- ✅ aria-expanded et aria-haspopup

---

## 3. Ajouter Focus Trap dans Modales

### Fichiers :
- `client/src/components/AccessibleModal.tsx` ✅ CRÉÉ

### Caractéristiques :
- ✅ Focus piégé dans la modale
- ✅ Tab cycle dans la modale
- ✅ Escape ferme la modale
- ✅ Focus restauré après fermeture

---

## 4. Ajouter Validation Accessible aux Formulaires

### Fichiers à Modifier :
- `client/src/pages/OpenDossier.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/Login.tsx`
- Tous les formulaires

### Correction :
```tsx
// ✅ Correct
<input 
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-required={required}
  aria-describedby={error ? "email-error" : undefined}
  required
/>
{error && (
  <span id="email-error" role="alert" className="text-red-600">
    {error}
  </span>
)}
```

---

## 5. Ajouter Alt Text à Toutes les Images

### Fichiers à Modifier :
- `client/src/pages/Home.tsx` - Logo, images hero
- `client/src/pages/Destinations.tsx` - Images pays
- `client/src/pages/SuccessStoriesGallery.tsx` - Photos galerie
- Tous les carousels

### Correction :
```tsx
// ✅ Images informatives
<img 
  src="..." 
  alt="Drapeau du Canada avec feuille d'érable rouge"
/>

// ✅ Images décoratives
<img 
  src="..." 
  alt="" 
  aria-hidden="true"
/>
```

---

## 6. Ajouter H1 Unique par Page

### Pages à Corriger :
- ✅ Home - H1 présent
- ❌ Procedures - Ajouter H1
- ❌ Destinations - Ajouter H1
- ❌ Flights - Ajouter H1
- ❌ Tarifs - Ajouter H1
- ❌ Avis - Ajouter H1
- ❌ Blog - Ajouter H1
- ❌ Ressources - Ajouter H1

### Correction :
```tsx
<h1 className="text-3xl font-bold mb-6">
  Procédures de Visa - 3M Travel & Services
</h1>
```

---

## 7. Corriger Hiérarchie des Headings

### Règles :
- ✅ H1 → H2 → H3 → H4 (pas de sauts)
- ✅ Un seul H1 par page
- ✅ H2 comme sous-titre principal
- ✅ H3 pour sections
- ✅ H4 pour sous-sections

### Audit :
```
Home.tsx:
  H1: "3M Travel Agency" ✅
  H2: "Pourquoi choisir 3M" ✅
  H3: Atouts ✅
  H2: "Statistiques" ✅
  
Procedures.tsx:
  ❌ Pas de H1
  ❌ H2 → H4 (saute H3)
```

---

## 8. Ajouter aria-live pour Notifications

### Fichiers :
- `client/src/components/Toaster.tsx`
- `client/src/pages/Dashboard.tsx`
- Tous les composants avec notifications

### Correction :
```tsx
// ✅ Correct
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {notification}
</div>

// Visible
<div className="bg-green-100 text-green-900 p-4 rounded">
  {notification}
</div>
```

---

## 9. Rendre Carousels Accessibles

### Fichiers :
- `client/src/pages/Home.tsx` - Testimonials carousel
- `client/src/pages/SuccessStoriesGallery.tsx` - Gallery carousel

### Corrections :
- ✅ Boutons Previous/Next avec aria-label
- ✅ aria-live="polite" pour slide actuel
- ✅ Support clavier (Arrow Left/Right)
- ✅ Pause auto-play au focus/hover
- ✅ Indicateurs de slide accessibles

---

## 10. Ajouter aria-label sur Liens Vides

### Fichiers :
- `client/src/components/Navbar.tsx` - Liens réseaux
- `client/src/components/Footer.tsx` - Liens réseaux
- Tous les liens "#"

### Correction :
```tsx
// ✅ Correct
<a 
  href="https://facebook.com/3mtravel"
  aria-label="Suivre 3M Travel sur Facebook"
  target="_blank"
>
  <Facebook className="w-5 h-5" />
</a>
```

---

## 11. Ajouter aria-expanded sur Accordéons

### Fichiers :
- `client/src/pages/Guide.tsx` - FAQ
- `client/src/pages/Ressources.tsx` - Accordéons

### Correction :
```tsx
// ✅ Correct
<button 
  aria-expanded={isOpen}
  aria-controls={`panel-${id}`}
  onClick={() => setIsOpen(!isOpen)}
>
  {title}
</button>
<div id={`panel-${id}`} hidden={!isOpen}>
  {content}
</div>
```

---

## 12. Ajouter aria-current sur Liens Actifs

### Fichiers :
- `client/src/components/Navbar.tsx` - Navigation principale
- `client/src/pages/Dashboard.tsx` - Sidebar

### Correction :
```tsx
// ✅ Correct
<a 
  href="/procedures"
  aria-current={isActive ? "page" : undefined}
  className={isActive ? "font-bold" : ""}
>
  Procédures
</a>
```

---

## 13. Ajouter Sémantique aux Tableaux

### Fichiers :
- `client/src/pages/Admin.tsx` - Tableaux admin
- `client/src/pages/Dashboard.tsx` - Tableaux données

### Correction :
```tsx
// ✅ Correct
<table aria-label="Liste des dossiers">
  <thead>
    <tr>
      <th scope="col">Numéro</th>
      <th scope="col">Statut</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>12345</td>
      <td>Approuvé</td>
    </tr>
  </tbody>
</table>
```

---

## 14. Ajouter Landmarks Régionaux

### Fichiers :
- `client/src/App.tsx` ✅ FAIT (main landmark)
- `client/src/components/Navbar.tsx` - Ajouter <nav>
- `client/src/components/Footer.tsx` - Ajouter <footer>
- Toutes les pages - Ajouter <main>

### Structure :
```tsx
<header>
  <nav aria-label="Navigation principale">
    ...
  </nav>
</header>
<main id="main-content">
  ...
</main>
<aside aria-label="Sidebar">
  ...
</aside>
<footer>
  ...
</footer>
```

---

## 15. Ajouter Texte Alternatif pour SVG

### Fichiers :
- Tous les SVG inline
- Icônes Lucide React

### Correction :
```tsx
// ✅ Correct
<svg aria-label="Icône de validation">
  <title>Checkmark vert</title>
  <desc>Indique que l'action a réussi</desc>
  <path d="..." />
</svg>

// Alternative avec aria-hidden
<svg aria-hidden="true">
  <path d="..." />
</svg>
<span className="sr-only">Validation réussie</span>
```

---

## 16. Ajouter aria-label sur Sections

### Fichiers :
- `client/src/pages/Home.tsx` - Sections
- `client/src/pages/Procedures.tsx` - Sections
- Toutes les pages

### Correction :
```tsx
// ✅ Correct
<section aria-label="Statistiques 3M Travel">
  ...
</section>

<section aria-label="Services offerts">
  ...
</section>
```

---

## 17. Ajouter Autocomplete aux Inputs

### Fichiers :
- Tous les formulaires

### Correction :
```tsx
// ✅ Correct
<input 
  type="email" 
  autocomplete="email"
  placeholder="votre@email.com"
/>

<input 
  type="tel" 
  autocomplete="tel"
  placeholder="+33 6 12 34 56 78"
/>

<input 
  type="text" 
  autocomplete="given-name"
  placeholder="Prénom"
/>

<input 
  type="text" 
  autocomplete="family-name"
  placeholder="Nom"
/>

<input 
  type="text" 
  autocomplete="street-address"
  placeholder="Adresse"
/>

<input 
  type="text" 
  autocomplete="postal-code"
  placeholder="Code postal"
/>

<select autocomplete="country">
  <option>Pays</option>
</select>
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### Corrections Critiques
- [ ] 1. aria-labels sur boutons icon-only
- [ ] 2. Support clavier dropdowns (AccessibleDropdown)
- [ ] 3. Focus trap modales (AccessibleModal)
- [ ] 4. Validation accessible formulaires
- [ ] 5. Alt text images
- [ ] 6. H1 unique par page
- [ ] 7. Hiérarchie headings
- [ ] 8. aria-live notifications
- [ ] 9. Carousels accessibles
- [ ] 10. aria-label liens vides
- [ ] 11. aria-expanded accordéons
- [ ] 12. aria-current liens actifs
- [ ] 13. Sémantique tableaux
- [ ] 14. Landmarks régionaux
- [ ] 15. Alt text SVG
- [ ] 16. aria-label sections
- [ ] 17. Autocomplete inputs

### Résultat Attendu
- ✅ Score : 7.8/10 → 10/10
- ✅ WCAG 2.1 AA : 100%
- ✅ WCAG 2.1 AAA : 95%
- ✅ Tous les boutons testés
- ✅ Navigation clavier complète
- ✅ Lecteur d'écran compatible

---

**Durée Estimée :** 6-8 heures  
**Priorité :** CRITIQUE  
**Impact :** Site entièrement accessible
