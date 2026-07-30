#!/usr/bin/env node

/**
 * Script de batch processing pour optimiser les images
 * Traite les images dans plusieurs répertoires
 * Génère des rapports détaillés
 * 
 * Usage:
 *   node scripts/batch-optimize-images.mjs
 *   node scripts/batch-optimize-images.mjs --report
 *   node scripts/batch-optimize-images.mjs --dry-run
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Répertoires à traiter
const imageDirs = [
  path.join(__dirname, '../client/src/assets'),
  path.join(__dirname, '../client/public'),
  path.join(__dirname, '../webdev-static-assets'),
];

// Options
const options = {
  dryRun: process.argv.includes('--dry-run'),
  report: process.argv.includes('--report'),
  verbose: process.argv.includes('--verbose'),
  quality: {
    webp: 80,
    avif: 75,
    jpg: 85,
  },
};

// Couleurs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getCompressionRatio(original, compressed) {
  return Math.round(((original - compressed) / original) * 100);
}

async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath);
  const baseName = path.parse(filename).name;
  const ext = path.parse(filename).ext.toLowerCase();

  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(ext)) {
    return null;
  }

  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;

    const results = {
      filename,
      originalSize,
      conversions: [],
      success: true,
    };

    // Lire les métadonnées
    const metadata = await sharp(inputPath).metadata();

    // Convertir en WebP
    if (!process.argv.includes('--skip-webp')) {
      const webpPath = path.join(outputDir, `${baseName}.webp`);
      const webpBuffer = await sharp(inputPath)
        .webp({ quality: options.quality.webp })
        .toBuffer();

      if (!options.dryRun) {
        fs.writeFileSync(webpPath, webpBuffer);
      }

      const webpSize = webpBuffer.length;
      results.conversions.push({
        format: 'WebP',
        size: webpSize,
        ratio: getCompressionRatio(originalSize, webpSize),
      });
    }

    // Convertir en AVIF
    if (!process.argv.includes('--skip-avif')) {
      const avifPath = path.join(outputDir, `${baseName}.avif`);
      const avifBuffer = await sharp(inputPath)
        .avif({ quality: options.quality.avif })
        .toBuffer();

      if (!options.dryRun) {
        fs.writeFileSync(avifPath, avifBuffer);
      }

      const avifSize = avifBuffer.length;
      results.conversions.push({
        format: 'AVIF',
        size: avifSize,
        ratio: getCompressionRatio(originalSize, avifSize),
      });
    }

    if (options.verbose) {
      log(`✓ ${filename}`, 'green');
      log(`  Original: ${getFileSize(originalSize)}`, 'gray');
      results.conversions.forEach(conv => {
        log(`  ${conv.format}: ${getFileSize(conv.size)} (-${conv.ratio}%)`, 'gray');
      });
    }

    return results;
  } catch (error) {
    log(`✗ ${filename}: ${error.message}`, 'red');
    return { filename, success: false, error: error.message };
  }
}

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const inputPath = path.join(dir, file);
    const stat = fs.statSync(inputPath);

    if (stat.isDirectory()) {
      const subResults = await processDirectory(inputPath);
      results.push(...subResults);
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
      const result = await optimizeImage(inputPath, dir);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
}

async function main() {
  log('\n🖼️  Batch Image Optimization', 'cyan');
  log('================================\n', 'cyan');

  if (options.dryRun) {
    log('⚠️  Mode DRY-RUN: Les fichiers ne seront pas modifiés\n', 'yellow');
  }

  const allResults = [];
  let totalOriginal = 0;
  let totalCompressed = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const dir of imageDirs) {
    if (!fs.existsSync(dir)) {
      if (options.verbose) {
        log(`⊘ Répertoire non trouvé: ${dir}`, 'yellow');
      }
      continue;
    }

    log(`📁 Traitement: ${dir}`, 'blue');
    const results = await processDirectory(dir);

    for (const result of results) {
      if (result.success) {
        successCount++;
        totalOriginal += result.originalSize;
        result.conversions.forEach(conv => {
          totalCompressed += conv.size;
        });
      } else {
        errorCount++;
      }
      allResults.push(result);
    }

    log(`   ${results.length} fichier(s) traité(s)\n`, 'gray');
  }

  // Résumé
  log('\n📊 Résumé de l\'optimisation', 'cyan');
  log('================================\n', 'cyan');

  const totalRatio = totalOriginal > 0 ? getCompressionRatio(totalOriginal, totalCompressed) : 0;
  const totalSaved = totalOriginal - totalCompressed;

  log(`Fichiers traités: ${successCount}`, 'blue');
  log(`Erreurs: ${errorCount}`, errorCount > 0 ? 'red' : 'gray');
  log(`Taille originale: ${getFileSize(totalOriginal)}`, 'blue');
  log(`Taille compressée: ${getFileSize(totalCompressed)}`, 'blue');
  log(`Espace économisé: ${getFileSize(totalSaved)} (-${totalRatio}%)`, 'green');

  // Rapport détaillé
  if (options.report) {
    log('\n📋 Rapport Détaillé', 'cyan');
    log('================================\n', 'cyan');

    const reportPath = path.join(__dirname, '../image-optimization-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      options,
      summary: {
        filesProcessed: successCount,
        errors: errorCount,
        totalOriginalSize: totalOriginal,
        totalCompressedSize: totalCompressed,
        totalSaved,
        compressionRatio: totalRatio,
      },
      details: allResults,
    };

    if (!options.dryRun) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      log(`✓ Rapport sauvegardé: ${reportPath}\n`, 'green');
    } else {
      log(`✓ Rapport (mode dry-run):\n`, 'green');
      console.log(JSON.stringify(report, null, 2));
    }
  }

  if (options.dryRun) {
    log('\n✅ Simulation terminée (aucun fichier modifié)\n', 'yellow');
  } else {
    log('\n✅ Optimisation terminée!\n', 'green');
  }
}

main().catch(error => {
  log(`\n❌ Erreur: ${error.message}\n`, 'red');
  process.exit(1);
});
