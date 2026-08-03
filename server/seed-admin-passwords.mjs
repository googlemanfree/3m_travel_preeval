import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Générer 3 mots de passe sécurisés aléatoires
const admins = [
  { email: 'fabienbah203@gmail.com', adminType: 'evaluation' },
  { email: 'aureoldonfack@gmail.com', adminType: 'accompagnement' },
  { email: 'hello@3mtravelagency.click', adminType: 'procedures' }
];

console.log('=== MOTS DE PASSE GÉNÉRÉS POUR LES ADMINS ===\n');

const adminCredentials = [];

for (const admin of admins) {
  // Générer un mot de passe aléatoire de 16 caractères
  const password = crypto.randomBytes(12).toString('hex');
  
  // Hasher le mot de passe avec bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  adminCredentials.push({
    email: admin.email,
    adminType: admin.adminType,
    password,
    passwordHash
  });
  
  console.log(`Email: ${admin.email}`);
  console.log(`Type: ${admin.adminType}`);
  console.log(`Mot de passe: ${password}`);
  console.log(`Hash: ${passwordHash}`);
  console.log('---\n');
}

// Exporter les credentials pour utilisation
console.log('=== CREDENTIALS JSON ===');
console.log(JSON.stringify(adminCredentials, null, 2));
