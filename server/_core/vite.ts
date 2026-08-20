import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
export async function setupVite(app: Express, server: Server) {
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
      const page = (await vite.transformIndexHtml(url, template))
        .replace(/<script\b[^>]*\bsrc=["']\/@vite\/client(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "")
        .replace(/import\s+["']\/@vite\/client(?:\?[^"']*)?["'];?/gi, "");
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
