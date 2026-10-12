import type { NextFunction, Request, Response } from "express";

/**
 * En-têtes de sécurité que Cloudflare n'ajoute pas (il envoie déjà Strict-Transport-Security et nosniff).
 *
 * - Referrer-Policy : une adresse interne (dossier, référence de paiement) ne part jamais en entier vers un site tiers.
 * - Permissions-Policy : seule la caméra du site est autorisée (portrait du candidat, PortraitCapture) ;
 *   micro, géolocalisation, paiement navigateur et USB sont coupés.
 * - Anti-clickjacking (X-Frame-Options + frame-ancestors) UNIQUEMENT sur les pages privées : connexion, espaces,
 *   paiement. Les pages publiques restent affichables dans l'aperçu de l'hébergeur.
 */
export const PERMISSIONS_POLICY = "camera=(self), microphone=(), geolocation=(), payment=(), usb=()";
export const REFERRER_POLICY = "strict-origin-when-cross-origin";

const PRIVATE_PATHS = /^\/(admin|login|connexion|mon-espace|mon-dossier|paiement|payment|payment-success|document-upload|panier|assistance-acces|employeurs|agences-placement|evaluation-space)(\/|$|\?)/i;

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATHS.test(path);
}

export function applySecurityHeaders(path: string, setHeader: (name: string, value: string) => void) {
  setHeader("Referrer-Policy", REFERRER_POLICY);
  setHeader("Permissions-Policy", PERMISSIONS_POLICY);
  if (isPrivatePath(path)) {
    setHeader("X-Frame-Options", "SAMEORIGIN");
    setHeader("Content-Security-Policy", "frame-ancestors 'self'");
  }
}

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  applySecurityHeaders(req.path, (name, value) => res.setHeader(name, value));
  next();
}
