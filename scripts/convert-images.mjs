#!/usr/bin/env node

/**
 * Script de conversion d'images en WebP et AVIF
 * Utilise Sharp pour optimiser les images
 * 
 * Usage:
 *   node scripts/convert-images.mjs
 *   node scripts/convert-images.mjs --input ./custom-dir
 *   node scripts/convert-images.mjs --quality 80
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  inputDir: process.argv.includes('--input') 
    ? process.argv[process.argv.indexOf('--input') + 1] 
    : path.join(__dirname, '../client/src/assets'),
  outputDir: process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : path.join(__dirname, '../client/src/assets'),
  webpQuality: parseInt(process.argv.find(arg => arg.startsWith('--webp-quality='))?.split('=')[1] || 80),
  avifQuality: parseInt(process.argv.find(arg => arg.startsWith('--avif-quality='))?.split('=')[1] || 75),
  jpgQuality: parseInt(process.argv.find(arg => arg.startsWith('--jpg-quality='))?.split('=')[1] || 85),
  pngCompression: parseInt(process.argv.find(arg => arg.startsWith('--png-compression='))?.split('=')[1] || 9),
  skipWebp: process.argv.includes('--skip-webp'),
  skipAvif: process.argv.includes('--skip-avif'),
  skipOptimize: process.argv.includes('--skip-optimize'),
  verbose: process.argv.includes('--verbose'),
};

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getCompressionRatio(original, compressed) {
  return Math.round(((original - compressed) / original) * 100);
}

async function convertImage(inputPath, outputDir, filename) {
  const baseName = path.parse(filename).name;
  const ext = path.parse(filename).ext.toLowerCase();
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;

  const results = {
    filename,
    originalSize,
    conversions: [],
  };

  try {
    // Lire l'image
    let image = sharp(inputPath);
    const metadata = await image.metadata();

    if (config.verbose) {
      log(`\n📷 ${filename}`, 'cyan');
      log(`   Dimensions: ${metadata.width}x${metadata.height}`, 'blue');
      log(`   Format: ${metadata.format}`, 'blue');
      log(`   Taille: ${getFileSize(originalSize)}`, 'blue');
    }

    // 1. Optimiser l'image originale (si JPG ou PNG)
    if (!config.skipOptimize && (ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
      const optimizedPath = path.join(outputDir, filename);
      
      if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(inputPath)
          .jpeg({ quality: config.jpgQuality, progressive: true })
          .toFile(optimizedPath);
      } else if (ext === '.png') {
        await sharp(inputPath)
          .png({ compressionLevel: config.pngCompression })
          .toFile(optimizedPath);
      }

      const optimizedSize = fs.statSync(optimizedPath).size;
      const ratio = getCompressionRatio(originalSize, optimizedSize);
      
      results.conversions.push({
        format: 'Original (Optimisé)',
        size: optimizedSize,
        ratio,
        saved: originalSize - optimizedSize,
      });

      if (config.verbose) {
        log(`   ✓ Original optimisé: ${getFileSize(optimizedSize)} (-${ratio}%)`, 'green');
      }
    }

    // 2. Convertir en WebP
    if (!config.skipWebp) {
      const webpPath = path.join(outputDir, `${baseName}.webp`);
      const webpImage = await sharp(inputPath)
        .webp({ quality: config.webpQuality })
        .toBuffer();

      fs.writeFileSync(webpPath, webpImage);
      const webpSize = webpImage.length;
      const ratio = getCompressionRatio(originalSize, webpSize);

      results.conversions.push({
        format: 'WebP',
        size: webpSize,
        ratio,
        saved: originalSize - webpSize,
      });

      if (config.verbose) {
        log(`   ✓ WebP: ${getFileSize(webpSize)} (-${ratio}%)`, 'green');
      }
    }

    // 3. Convertir en AVIF
    if (!config.skipAvif) {
      const avifPath = path.join(outputDir, `${baseName}.avif`);
      const avifImage = await sharp(inputPath)
        .avif({ quality: config.avifQuality })
        .toBuffer();

      fs.writeFileSync(avifPath, avifImage);
      const avifSize = avifImage.length;
      const ratio = getCompressionRatio(originalSize, avifSize);

      results.conversions.push({
        format: 'AVIF',
        size: avifSize,
        ratio,
        saved: originalSize - avifSize,
      });

      if (config.verbose) {
        log(`   ✓ AVIF: ${getFileSize(avifSize)} (-${ratio}%)`, 'green');
      }
    }

    return results;
  } catch (error) {
    log(`   ✗ Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function main() {
  log('\n🖼️  Image Optimization Script', 'cyan');
  log('================================\n', 'cyan');

  // Vérifier que le répertoire d'entrée existe
  if (!fs.existsSync(config.inputDir)) {
    log(`❌ Répertoire d'entrée non trouvé: ${config.inputDir}`, 'red');
    process.exit(1);
  }

  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  log(`📁 Répertoire d'entrée: ${config.inputDir}`, 'blue');
  log(`📁 Répertoire de sortie: ${config.outputDir}`, 'blue');
  log(`⚙️  Configuration:`, 'blue');
  log(`   - WebP Quality: ${config.webpQuality}`, 'blue');
  log(`   - AVIF Quality: ${config.avifQuality}`, 'blue');
  log(`   - JPG Quality: ${config.jpgQuality}`, 'blue');
  log(`   - PNG Compression: ${config.pngCompression}`, 'blue');

  // Lister les fichiers images
  const files = fs.readdirSync(config.inputDir).filter(file => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
  });

  if (files.length === 0) {
    log(`\n⚠️  Aucune image trouvée dans ${config.inputDir}`, 'yellow');
    process.exit(0);
  }

  log(`\n📊 Traitement de ${files.length} image(s)...\n`, 'cyan');

  const allResults = [];
  let totalOriginal = 0;
  let totalCompressed = 0;
  let totalSaved = 0;

  for (const file of files) {
    const inputPath = path.join(config.inputDir, file);
    const result = await convertImage(inputPath, config.outputDir, file);

    if (result) {
      allResults.push(result);
      totalOriginal += result.originalSize;

      result.conversions.forEach(conv => {
        totalCompressed += conv.size;
        totalSaved += conv.saved;
      });
    }
  }

  // Résumé
  log('\n📈 Résumé de l\'optimisation', 'cyan');
  log('================================\n', 'cyan');

  const summaryTable = allResults.map(result => ({
    'Fichier': result.filename,
    'Original': getFileSize(result.originalSize),
    'Conversions': result.conversions.map(c => `${c.format} (${getFileSize(c.size)}, -${c.ratio}%)`).join(', '),
  }));

  console.table(summaryTable);

  const totalRatio = getCompressionRatio(totalOriginal, totalCompressed);
  log(`\n📊 Statistiques Globales:`, 'cyan');
  log(`   Taille originale: ${getFileSize(totalOriginal)}`, 'blue');
  log(`   Taille compressée: ${getFileSize(totalCompressed)}`, 'blue');
  log(`   Espace économisé: ${getFileSize(totalSaved)} (-${totalRatio}%)`, 'green');

  log(`\n✅ Optimisation terminée!\n`, 'green');
}

main().catch(error => {
  log(`\n❌ Erreur: ${error.message}\n`, 'red');
  process.exit(1);
});
