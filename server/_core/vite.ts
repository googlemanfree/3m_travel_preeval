import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { composePublicPrerender } from "../publicPrerender";
import { canonicalRedirectFromHosts } from "../canonicalDomain";

function applyCanonicalDomainRedirect(app: Express) {
  app.use((req, res, next) => {
    // Selon le maillon proxy, l'hôte externe peut être fourni sous l'un de ces
    // en-têtes alors que req.hostname contient un nom interne de plateforme.
    const target = canonicalRedirectFromHosts([
      req.get("x-forwarded-host"),
      req.get("x-original-host"),
      req.get("x-host"),
      req.get("host"),
      req.hostname,
    ], req.originalUrl);
    if (!target) return next();
    return res.redirect(301, target);
  });
}
export async function setupVite(app: Express, server: Server) {
  applyCanonicalDomainRedirect(app);
  const serverOptions = {
    middlewareMode: true,
    // Le proxy de prévisualisation ne relaie pas de WebSocket Vite fiable dans
    // ce mode middleware. Désactiver HMR évite les tentatives vers localhost:5173
    // et laisse l’actualisation de page normale sans bruit console.
    hmr: false,
    allowedHosts: true as const,
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });
  // Les modules CSS Vite peuvent encore demander /@vite/client même si l’entrée
  // React a été nettoyée. Le proxy de prévisualisation ne transporte pas HMR :
  // fournir une API no-op compatible évite l’ouverture d’un WebSocket sans
  // désactiver la transformation des styles par Vite.
  app.use("/@vite/client", (_req, res) => {
    const shim = `
      export const createHotContext = () => ({
        data: {}, accept: () => {}, acceptExports: () => {}, dispose: () => {},
        prune: () => {}, decline: () => {}, invalidate: () => {}, on: () => {}, send: () => {}
      });
      export const injectQuery = (url) => url;
      export const updateStyle = (id, css) => {
        const selector = 'style[data-3m-vite-css="' + CSS.escape(id) + '"]';
        let style = document.querySelector(selector);
        if (!style) {
          style = document.createElement('style');
          style.dataset['3mViteCss'] = id;
          document.head.appendChild(style);
        }
        style.textContent = css;
      };
      export const removeStyle = (id) => {
        document.querySelector('style[data-3m-vite-css="' + CSS.escape(id) + '"]')?.remove();
      };
      export const waitForRequestsIdle = () => Promise.resolve();
    `;
    res.status(200).set({ "Content-Type": "application/javascript", "Cache-Control": "no-store" }).end(shim);
  });
  // En mode middleware, Vite injecte encore `import "/@vite/client"` dans
  // l’entrée React. Le proxy de prévisualisation ne relaie pas ce WebSocket :
  // servir cette unique entrée sans le client HMR évite l’erreur console tout
  // en laissant Vite transformer les autres modules normalement.
  app.use(async (req, res, next) => {
    if (req.path !== "/src/main.tsx") return next();
    try {
      const transformed = await vite.transformRequest("/src/main.tsx");
      if (!transformed?.code) return next();
      const code = transformed.code.replace(/import\s+["']\/@vite\/client(?:\?[^"']*)?["'];?\s*/g, "");
      res.status(200).set({ "Content-Type": "application/javascript" }).end(code);
    } catch (error) {
      next(error);
    }
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      // Le proxy de prévisualisation ne relaie pas le WebSocket HMR. Vite injecte
      // néanmoins son client dans index.html ; le retirer ici évite les erreurs
      // de connexion vers localhost:5173 tout en conservant l’actualisation via
      // rechargement de page.
      const transformedPage = (await vite.transformIndexHtml(url, template))
        .replace(/<script\b[^>]*\bsrc=["']\/@vite\/client(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "")
        .replace(/import\s+["']\/@vite\/client(?:\?[^"']*)?["'];?/gi, "");
      const rendered = composePublicPrerender(transformedPage, url);
      res.status(rendered.status).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(rendered.html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
export function serveStatic(app: Express) {
  applyCanonicalDomainRedirect(app);
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  // Route explicite pour les plateformes qui appliquent leur propre fallback
  // avant le catch-all Express : la page d’état doit rester une page publique 200.
  const renderExplicitShell = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const rendered = composePublicPrerender(template, req.originalUrl);
      res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(rendered.html);
    } catch (error) {
      next(error);
    }
  };
  // Les plateformes peuvent appliquer leur propre fallback avant le catch-all
  // Express. Les pages protégées doivent donc être servies explicitement avec
  // un shell 200/noindex, puis laisser AuthGuard gérer la session côté client.
  app.get("/etat-du-service", renderExplicitShell);
  app.get("/mon-dossier", renderExplicitShell);
  app.get("/document-upload", renderExplicitShell);
  app.get("/mes-vols-favoris", renderExplicitShell);
  app.get("/flights", renderExplicitShell);
  app.use(express.static(distPath, { index: false, redirect: false }));
  app.use("*", async (req, res) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const rendered = composePublicPrerender(template, req.originalUrl);
      res.status(rendered.status).set({ "Content-Type": "text/html", "Cache-Control": "no-cache" }).end(rendered.html);
    } catch (error) {
      console.error("[SEO prerender] Unable to render public shell", error);
      res.status(500).end("Erreur de rendu");
    }
  });
}
