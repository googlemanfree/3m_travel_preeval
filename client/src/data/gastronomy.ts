// Données de gastronomie locale pour chaque pays
export const GASTRONOMY: Record<string, { name: string; icon: string; description: string }[]> = {
  'Allemagne': [
    { name: 'Schnitzel', icon: '🥩', description: 'Escalope pannée croustillante' },
    { name: 'Bretzel', icon: '🥨', description: 'Pain tressé traditionnel bavarois' },
    { name: 'Bratwurst', icon: '🌭', description: 'Saucisse de porc grillée' },
    { name: 'Schwarzwälder Kirschtorte', icon: '🍰', description: 'Gâteau noir aux cerises' },
  ],
  'Australie': [
    { name: 'Lamington', icon: '🍰', description: 'Gâteau au chocolat et noix de coco' },
    { name: 'Pavlova', icon: '🍧', description: 'Dessert méringué avec fruits' },
    { name: 'Vegemite Toast', icon: '🍞', description: 'Toast avec pâte de levure' },
    { name: 'Barramundi', icon: '🐟', description: 'Poisson grillé savoureux' },
  ],
  'Canada': [
    { name: 'Poutine', icon: '🍟', description: 'Frites, sauce et fromage en grains' },
    { name: 'Tourtière', icon: '🥧', description: 'Pâté en croûte traditionnel' },
    { name: 'Butter Tarts', icon: '🍰', description: 'Tartelettes au beurre sucré' },
    { name: 'Maple Taffy', icon: '🍬', description: 'Bonbon à l\'érable sur neige' },
  ],
  'France': [
    { name: 'Coq au Vin', icon: '🍗', description: 'Poulet braisé au vin rouge' },
    { name: 'Croissant', icon: '🥐', description: 'Viennoiserie feuilletée dorée' },
    { name: 'Escargots', icon: '🐌', description: 'Escargots à l\'ail et persil' },
    { name: 'Crème Brûlée', icon: '🍰', description: 'Crème vanillée avec sucre caramalisé' },
  ],
  'États-Unis': [
    { name: 'Hamburger', icon: '🍔', description: 'Sandwich au steak haché classique' },
    { name: 'BBQ Ribs', icon: '🥩', description: 'Côtes levées fumées' },
    { name: 'Apple Pie', icon: '🍰', description: 'Tarte aux pommes traditionnelle' },
    { name: 'Buffalo Wings', icon: '🍗', description: 'Ailes de poulet épicées' },
  ],
  'Royaume-Uni': [
    { name: 'Fish & Chips', icon: '🐟', description: 'Poisson frit et frites' },
    { name: 'Sunday Roast', icon: '🥩', description: 'Rôti dominical avec légumes' },
    { name: 'Scones', icon: '🍰', description: 'Gâteau léger avec crème et confiture' },
    { name: 'Sticky Toffee Pudding', icon: '🍰', description: 'Pudding au toffee collant' },
  ],
  'Suisse': [
    { name: 'Fondue', icon: '🫕', description: 'Fromage fondu partagé' },
    { name: 'Raclette', icon: '🫕', description: 'Fromage râpé et grillé' },
    { name: 'Toblerone', icon: '🍫', description: 'Chocolat triangulaire croquant' },
    { name: 'Rösti', icon: '🍟', description: 'Galette de pommes de terre' },
  ],
  'Nouvelle-Zélande': [
    { name: 'Pavlova', icon: '🍧', description: 'Dessert méringué léger' },
    { name: 'Hangi', icon: '🥩', description: 'Viande cuite sous terre' },
    { name: 'Kiwifruit', icon: '🥝', description: 'Fruit sucré et tropical' },
    { name: 'Anzac Biscuits', icon: '🍰', description: 'Biscuits à l\'avoine et noix de coco' },
  ],
  'Irlande': [
    { name: 'Irish Stew', icon: '🥘', description: 'Ragout d\'agneau et pommes de terre' },
    { name: 'Soda Bread', icon: '🍞', description: 'Pain sans levure traditionnel' },
    { name: 'Colcannon', icon: '🥘', description: 'Purée de pommes de terre et chou' },
    { name: 'Baileys', icon: '🥃', description: 'Liqueur crémeuse au cacao' },
  ],
  'Italie': [
    { name: 'Pasta Carbonara', icon: '🍝', description: 'Pâtes crémeuses au lard' },
    { name: 'Risotto', icon: '🍚', description: 'Riz crémeux au safran' },
    { name: 'Tiramisu', icon: '🍰', description: 'Dessert café et mascarpone' },
    { name: 'Gelato', icon: '🍨', description: 'Glace italienne onctueuse' },
  ],
  'Pologne': [
    { name: 'Pierogi', icon: '🍞', description: 'Ravioli farcis tradition' },
    { name: 'Borscht', icon: '🍲', description: 'Soupe de betteraves rouge vif' },
    { name: 'Kielbasa', icon: '🌭', description: 'Saucisse fumée savoureuse' },
    { name: 'Sernik', icon: '🍰', description: 'Gâteau au fromage blanc' },
  ],
  'Portugal': [
    { name: 'Pastéis de Nata', icon: '🍰', description: 'Tartelette crémeuse caramalisée' },
    { name: 'Sardines Grillées', icon: '🐟', description: 'Sardines fraîches grillées' },
    { name: 'Caldo Verde', icon: '🍲', description: 'Soupe au chou et pommes de terre' },
    { name: 'Francesinha', icon: '🍔', description: 'Sandwich au fromage fondu' },
  ],
  'Qatar': [
    { name: 'Shawarma', icon: '🌭', description: 'Viande rôtie dans pain pita' },
    { name: 'Hummus', icon: '🥘', description: 'Purée de pois chiches' },
    { name: 'Tabbouleh', icon: '🥗', description: 'Salade de persil et boulgour' },
    { name: 'Baklava', icon: '🍰', description: 'Pâte feuilletée aux noix' },
  ],
  'Malaisie': [
    { name: 'Nasi Lemak', icon: '🍚', description: 'Riz coco avec sambal et oeufs' },
    { name: 'Laksa', icon: '🍲', description: 'Soupe de nouilles épicée' },
    { name: 'Satay', icon: '🥩', description: 'Brochettes de viande sauce cacahuète' },
    { name: 'Teh Tarik', icon: '☕', description: 'Thé sucré étiré' },
  ],
  'Kenya': [
    { name: 'Ugali', icon: '🥘', description: 'Bouillie de maïs épaisse' },
    { name: 'Nyama Choma', icon: '🥩', description: 'Viande grillée savoureux' },
    { name: 'Sukuma Wiki', icon: '🥬', description: 'Feuilles de chou sautées' },
    { name: 'Chapati', icon: '🍞', description: 'Pain plat frit croustillant' },
  ],
  'Schengen': [
    { name: 'Paella', icon: '🍚', description: 'Riz espagnol aux fruits de mer' },
    { name: 'Moussaka', icon: '🍲', description: 'Gratin d\'aubergines grec' },
    { name: 'Goulash', icon: '🥘', description: 'Ragout hongrois épicé' },
    { name: 'Ratatouille', icon: '🍲', description: 'Ragout de légumes provençal' },
  ],
};
