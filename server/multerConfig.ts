import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Configuration Multer pour le stockage structuré des pièces jointes
 * Structure : uploads/candidates/{folderCode}/
 * Nommage : {TYPE}_{fullName}_{timestamp}.{ext}
 */

const uploadsDir = path.join(process.cwd(), 'uploads', 'candidates');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderCode = req.body.folderCode || 'unknown';
    const candidateDir = path.join(uploadsDir, folderCode);
    
    // Créer le dossier du candidat s'il n'existe pas
    if (!fs.existsSync(candidateDir)) {
      fs.mkdirSync(candidateDir, { recursive: true });
    }
    
    cb(null, candidateDir);
  },
  filename: (req, file, cb) => {
    const fullName = (req.body.fullName || 'unknown').replace(/\s+/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    
    // Déterminer le type de document
    let docType = 'DOCUMENT';
    const fieldName = file.fieldname.toUpperCase();
    
    if (fieldName.includes('CV') || fieldName.includes('CURRICULUM')) {
      docType = 'CV';
    } else if (fieldName.includes('PASSEPORT') || fieldName.includes('PASSPORT')) {
      docType = 'PASSEPORT';
    } else if (fieldName.includes('DIPLOME') || fieldName.includes('DIPLOMA') || fieldName.includes('CERTIFICATE')) {
      docType = 'DIPLOME';
    } else if (fieldName.includes('ACTE') || fieldName.includes('BIRTH')) {
      docType = 'ACTE';
    } else if (fieldName.includes('ATTESTATION') || fieldName.includes('LETTER')) {
      docType = 'ATTESTATION';
    }
    
    const filename = `${docType}_${fullName}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accepter les fichiers PDF et images
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits
});

/**
 * Fonction utilitaire pour obtenir le chemin d'accès d'un document
 */
export const getDocumentPath = (folderCode: string, filename: string): string => {
  return path.join(uploadsDir, folderCode, filename);
};

/**
 * Fonction utilitaire pour lister les documents d'un dossier
 */
export const getDocumentsForFolder = (folderCode: string): string[] => {
  const folderPath = path.join(uploadsDir, folderCode);
  
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  
  return fs.readdirSync(folderPath);
};

/**
 * Fonction utilitaire pour supprimer un document
 */
export const deleteDocument = (folderCode: string, filename: string): boolean => {
  const filePath = getDocumentPath(folderCode, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${filename}:`, error);
    return false;
  }
};
