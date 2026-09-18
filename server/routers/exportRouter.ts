/**
 * Routeur pour les exports des statistiques du dashboard admin
 * Génère les fichiers PDF et CSV
 */

import { protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { applications, candidates, transactions } from "../../drizzle/schema";
import { desc, count, sql, eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const TMP_DIR = "/tmp";

export const exportRouter = {
  /**
   * Exporter les statistiques en CSV
   */
  exportStatisticsCSV: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const [[txStats], [appCount], [candCount], recentApps, recentTxns] = await Promise.all([
        db.select({
          total: count(),
          completed: count(sql`CASE WHEN status = 'success' THEN 1 END`),
          pending: count(sql`CASE WHEN status IN ('pending','processing') THEN 1 END`),
          failed: count(sql`CASE WHEN status IN ('failed','cancelled') THEN 1 END`),
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0)`,
        }).from(transactions),
        db.select({ total: count() }).from(applications),
        db.select({ total: count() }).from(candidates),
        db.select({
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          destination: applications.destination,
          dossierStatus: applications.dossierStatus,
          createdAt: applications.createdAt,
        }).from(applications).orderBy(desc(applications.createdAt)).limit(10),
        db.select({
          dossierNumber: transactions.dossierNumber,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
          transactionId: transactions.transactionId,
        }).from(transactions).orderBy(desc(transactions.createdAt)).limit(10),
      ]);

      const totalRevenue = Number(txStats.totalRevenue);
      const csvData: string[] = [
        "=== STATISTIQUES 3M TRAVEL AGENCY ===",
        `Date d'export: ${new Date().toLocaleDateString("fr-FR")}`,
        "",
        "STATISTIQUES GLOBALES",
        "Métrique,Valeur",
        `Total Dossiers,${appCount.total}`,
        `Total Candidats,${candCount.total}`,
        `Total Transactions,${txStats.total}`,
        `Transactions Réussies,${txStats.completed}`,
        `Transactions En Attente,${txStats.pending}`,
        `Transactions Échouées,${txStats.failed}`,
        "",
        "REVENUS",
        "Description,Montant (XOF)",
        `Revenu Total,${totalRevenue}`,
        `Montant Moyen par Transaction,${txStats.completed > 0 ? Math.round(totalRevenue / txStats.completed) : 0}`,
        "",
        "DOSSIERS RÉCENTS",
        "Numéro Dossier,Candidat,Destination,Statut,Date Création",
        ...recentApps.map(app =>
          `"${app.dossierNumber}","${app.fullName || "N/A"}","${(app as any).destinationCountry || app.destination || "N/A"}","${(app as any).status || app.dossierStatus || "N/A"}","${app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : "N/A"}"`
        ),
        "",
        "TRANSACTIONS RÉCENTES",
        "Numéro Dossier,Montant (XOF),Statut,Date,ID Transaction",
        ...recentTxns.map(txn =>
          `"${txn.dossierNumber}","${txn.amount || 0}","${txn.status}","${txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("fr-FR") : "N/A"}","${txn.transactionId}"`
        ),
      ];

      const csvContent = csvData.join("\n");
      const fileName = `statistiques_${new Date().toISOString().split("T")[0]}.csv`;
      const filePath = path.join(TMP_DIR, fileName);
      fs.writeFileSync(filePath, csvContent, "utf-8");

      return {
        success: true,
        fileName,
        size: fs.statSync(filePath).size,
      };
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la génération du fichier CSV",
      });
    }
  }),

  /**
   * Exporter les statistiques en PDF
   */
  exportStatisticsPDF: adminProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const [[txStats], [appCount], [candCount], recentApps, recentTxns] = await Promise.all([
        db.select({
          total: count(),
          completed: count(sql`CASE WHEN status = 'success' THEN 1 END`),
          pending: count(sql`CASE WHEN status IN ('pending','processing') THEN 1 END`),
          failed: count(sql`CASE WHEN status IN ('failed','cancelled') THEN 1 END`),
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0)`,
        }).from(transactions),
        db.select({ total: count() }).from(applications),
        db.select({ total: count() }).from(candidates),
        db.select({
          dossierNumber: applications.dossierNumber,
          fullName: applications.fullName,
          destination: applications.destination,
          dossierStatus: applications.dossierStatus,
          createdAt: applications.createdAt,
        }).from(applications).orderBy(desc(applications.createdAt)).limit(5),
        db.select({
          dossierNumber: transactions.dossierNumber,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
        }).from(transactions).orderBy(desc(transactions.createdAt)).limit(5),
      ]);

      const totalRevenue = Number(txStats.totalRevenue);
      const averageTransaction = txStats.completed > 0 ? Math.round(totalRevenue / txStats.completed) : 0;
      const successRate = txStats.total > 0 ? Math.round((txStats.completed / txStats.total) * 100) : 0;

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #1E3A8A; border-bottom: 3px solid #2563EB; padding-bottom: 10px; }
    h2 { color: #2563EB; margin-top: 20px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background-color: #1E3A8A; color: white; padding: 10px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .stat-box { display: inline-block; width: 23%; margin: 1%; padding: 15px; background-color: #f0f4f8; border-left: 4px solid #2563EB; border-radius: 4px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1E3A8A; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>Rapport de Statistiques - 3M Travel Agency</h1>
  <p>Date d'export: <strong>${new Date().toLocaleDateString("fr-FR")}</strong></p>
  <h2>Indicateurs Clés</h2>
  <div class="stat-box"><div class="stat-value">${appCount.total}</div><div class="stat-label">Total Dossiers</div></div>
  <div class="stat-box"><div class="stat-value">${candCount.total}</div><div class="stat-label">Total Candidats</div></div>
  <div class="stat-box"><div class="stat-value">${txStats.total}</div><div class="stat-label">Total Transactions</div></div>
  <div class="stat-box"><div class="stat-value">${successRate}%</div><div class="stat-label">Taux de Réussite</div></div>
  <h2>Revenus</h2>
  <table>
    <tr><th>Description</th><th>Montant (XOF)</th></tr>
    <tr><td>Revenu Total</td><td><strong>${totalRevenue.toLocaleString("fr-FR")}</strong></td></tr>
    <tr><td>Montant Moyen par Transaction</td><td><strong>${averageTransaction.toLocaleString("fr-FR")}</strong></td></tr>
    <tr><td>Transactions Réussies</td><td>${txStats.completed}</td></tr>
  </table>
  <h2>Statut des Transactions</h2>
  <table>
    <tr><th>Statut</th><th>Nombre</th><th>Pourcentage</th></tr>
    <tr><td>Réussies</td><td>${txStats.completed}</td><td>${txStats.total > 0 ? Math.round((txStats.completed / txStats.total) * 100) : 0}%</td></tr>
    <tr><td>En Attente</td><td>${txStats.pending}</td><td>${txStats.total > 0 ? Math.round((txStats.pending / txStats.total) * 100) : 0}%</td></tr>
    <tr><td>Échouées</td><td>${txStats.failed}</td><td>${txStats.total > 0 ? Math.round((txStats.failed / txStats.total) * 100) : 0}%</td></tr>
  </table>
  <h2>Dossiers Récents</h2>
  <table>
    <tr><th>Numéro Dossier</th><th>Candidat</th><th>Destination</th><th>Statut</th><th>Date</th></tr>
    ${recentApps.map(app => `<tr><td>${app.dossierNumber}</td><td>${app.fullName || "N/A"}</td><td>${(app as any).destinationCountry || app.destination || "N/A"}</td><td>${(app as any).status || app.dossierStatus || "N/A"}</td><td>${app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td></tr>`).join("")}
  </table>
  <h2>Transactions Récentes</h2>
  <table>
    <tr><th>Numéro Dossier</th><th>Montant (XOF)</th><th>Statut</th><th>Date</th></tr>
    ${recentTxns.map(txn => `<tr><td>${txn.dossierNumber}</td><td>${(txn.amount || 0).toLocaleString("fr-FR")}</td><td>${txn.status}</td><td>${txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td></tr>`).join("")}
  </table>
  <div class="footer"><p>Rapport généré automatiquement par 3M Travel Agency - ${new Date().toLocaleString("fr-FR")}</p></div>
</body>
</html>`;

      const fileName = `statistiques_${new Date().toISOString().split("T")[0]}.pdf`;
      const filePath = path.join(TMP_DIR, fileName);
      const htmlFilePath = path.join(TMP_DIR, `temp_${Date.now()}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent, "utf-8");

      try {
        const { execSync } = require("child_process");
        execSync(`weasyprint ${htmlFilePath} ${filePath}`, { stdio: "pipe" });
        fs.unlinkSync(htmlFilePath);
      } catch {
        console.warn("WeasyPrint non disponible, génération d'un fichier texte");
        fs.writeFileSync(filePath, `=== RAPPORT - 3M TRAVEL AGENCY ===\nDate: ${new Date().toLocaleDateString("fr-FR")}\n\nDossiers: ${appCount.total}\nCandidats: ${candCount.total}\nTransactions: ${txStats.total}\nRevenus: ${totalRevenue.toLocaleString("fr-FR")} XOF\n`, "utf-8");
        try { fs.unlinkSync(htmlFilePath); } catch { /* already gone */ }
      }

      return {
        success: true,
        fileName,
        size: fs.statSync(filePath).size,
      };
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la génération du fichier PDF",
      });
    }
  }),

  /**
   * Télécharger un fichier exporté
   */
  downloadExport: adminProcedure
    .input(z.object({ fileName: z.string().max(255) }))
    .query(async ({ input }: any) => {
      try {
        const resolved = path.resolve(TMP_DIR, input.fileName);
        if (!resolved.startsWith(path.resolve(TMP_DIR) + path.sep)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Fichier non trouvé" });
        }
        if (!fs.existsSync(resolved)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Fichier non trouvé" });
        }

        const fileContent = fs.readFileSync(resolved, "utf-8");
        return {
          success: true,
          fileName: path.basename(resolved),
          content: fileContent,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors du téléchargement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du téléchargement du fichier",
        });
      }
    }),
};
