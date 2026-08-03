/**
 * Routeur pour les exports des statistiques du dashboard admin
 * Génère les fichiers PDF et CSV
 */

import { protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { applications} from "../../drizzle/schema";
import { desc } from "drizzle-orm"; // eslint-disable-line @typescript-eslint/no-unused-vars
import * as fs from "fs";
import * as path from "path";

export const exportRouter = {
  /**
   * Exporter les statistiques en CSV
   */
  exportStatisticsCSV: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      // Récupérer les données
      const allApplications = await db.select().from(applications);
      const allTransactions = await db.select().from(transactions);
      const allCandidates = await db.select().from(candidates);

      // Préparer les données CSV
      const csvData: string[] = [];

      // En-tête
      csvData.push("=== STATISTIQUES 3M TRAVEL AGENCY ===");
      csvData.push(`Date d'export: ${new Date().toLocaleDateString("fr-FR")}`);
      csvData.push("");

      // Statistiques globales
      csvData.push("STATISTIQUES GLOBALES");
      csvData.push("Métrique,Valeur");
      csvData.push(`Total Dossiers,${allApplications.length}`);
      csvData.push(`Total Candidats,${allCandidates.length}`);
      csvData.push(`Total Transactions,${allTransactions.length}`);
      csvData.push(`Transactions Réussies,${allTransactions.filter((t: any) => t.status === "success").length}`);
      csvData.push(`Transactions En Attente,${allTransactions.filter((t: any) => t.status === "pending" || t.status === "processing").length}`);
      csvData.push(`Transactions Échouées,${allTransactions.filter((t: any) => t.status === "failed" || t.status === "cancelled").length}`);
      csvData.push("");

      // Revenus
      const totalRevenue = allTransactions
        .filter((t: any) => t.status === "success")
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      csvData.push("REVENUS");
      csvData.push("Description,Montant (XOF)");
      csvData.push(`Revenu Total,${totalRevenue}`);
      csvData.push(`Montant Moyen par Transaction,${allTransactions.filter((t: any) => t.status === "success").length > 0 ? Math.round(totalRevenue / allTransactions.filter((t: any) => t.status === "success").length) : 0}`);
      csvData.push("");

      // Dossiers récents
      csvData.push("DOSSIERS RÉCENTS");
      csvData.push("Numéro Dossier,Candidat,Destination,Statut,Date Création");
      const recentApps = allApplications.slice(-10).reverse();
      recentApps.forEach((app: any) => {
        const candidate = allCandidates.find((c: any) => c.id === app.candidateId);
        csvData.push(
          `"${app.dossierNumber}","${candidate?.fullName || "N/A"}","${(app as any).destinationCountry || "N/A"}","${(app as any).status || "N/A"}","${app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : "N/A"}"`
        );
      });
      csvData.push("");

      // Transactions récentes
      csvData.push("TRANSACTIONS RÉCENTES");
      csvData.push("Numéro Dossier,Montant (XOF),Statut,Date,ID Transaction");
      const recentTxns = allTransactions.slice(-10).reverse();
      recentTxns.forEach((txn: any) => {
        csvData.push(
          `"${txn.dossierNumber}","${txn.amount || 0}","${txn.status}","${txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("fr-FR") : "N/A"}","${txn.transactionId}"`
        );
      });

      // Générer le fichier
      const csvContent = csvData.join("\n");
      const fileName = `statistiques_${new Date().toISOString().split("T")[0]}.csv`;
      const filePath = path.join("/tmp", fileName);

      fs.writeFileSync(filePath, csvContent, "utf-8");

      return {
        success: true,
        fileName,
        filePath,
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
      // Récupérer les données
      const allApplications = await db.select().from(applications);
      const allTransactions = await db.select().from(transactions);
      const allCandidates = await db.select().from(candidates);

      // Calculer les statistiques
      const totalDossiers = allApplications.length;
      const totalCandidats = allCandidates.length;
      const totalTransactions = allTransactions.length;
      const transactionsReussies = allTransactions.filter((t: any) => t.status === "success").length;
      const transactionsEnAttente = allTransactions.filter((t: any) => t.status === "pending" || t.status === "processing").length;
      const transactionsEchouees = allTransactions.filter((t: any) => t.status === "failed" || t.status === "cancelled").length;

      const totalRevenue = allTransactions
        .filter((t: any) => t.status === "success")
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const averageTransaction = transactionsReussies > 0 ? Math.round(totalRevenue / transactionsReussies) : 0;

      // Récupérer les données pour le PDF
      const recentAppsForPDF = allApplications.slice(-5).reverse();
      const recentTxnsForPDF = allTransactions.slice(-5).reverse();

      // Générer le contenu HTML pour conversion PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #1E3A8A;
      border-bottom: 3px solid #2563EB;
      padding-bottom: 10px;
    }
    h2 {
      color: #2563EB;
      margin-top: 20px;
      font-size: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th {
      background-color: #1E3A8A;
      color: white;
      padding: 10px;
      text-align: left;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .stat-box {
      display: inline-block;
      width: 23%;
      margin: 1%;
      padding: 15px;
      background-color: #f0f4f8;
      border-left: 4px solid #2563EB;
      border-radius: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1E3A8A;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>📊 Rapport de Statistiques - 3M Travel Agency</h1>
  <p>Date d'export: <strong>${new Date().toLocaleDateString("fr-FR")}</strong></p>

  <h2>📈 Indicateurs Clés</h2>
  <div class="stat-box">
    <div class="stat-value">${totalDossiers}</div>
    <div class="stat-label">Total Dossiers</div>
  </div>
  <div class="stat-box">
    <div class="stat-value">${totalCandidats}</div>
    <div class="stat-label">Total Candidats</div>
  </div>
  <div class="stat-box">
    <div class="stat-value">${totalTransactions}</div>
    <div class="stat-label">Total Transactions</div>
  </div>
  <div class="stat-box">
    <div class="stat-value">${Math.round((transactionsReussies / totalTransactions) * 100)}%</div>
    <div class="stat-label">Taux de Réussite</div>
  </div>

  <h2>💰 Revenus</h2>
  <table>
    <tr>
      <th>Description</th>
      <th>Montant (XOF)</th>
    </tr>
    <tr>
      <td>Revenu Total</td>
      <td><strong>${totalRevenue.toLocaleString("fr-FR")}</strong></td>
    </tr>
    <tr>
      <td>Montant Moyen par Transaction</td>
      <td><strong>${averageTransaction.toLocaleString("fr-FR")}</strong></td>
    </tr>
    <tr>
      <td>Transactions Réussies</td>
      <td>${transactionsReussies}</td>
    </tr>
  </table>

  <h2>📋 Statut des Transactions</h2>
  <table>
    <tr>
      <th>Statut</th>
      <th>Nombre</th>
      <th>Pourcentage</th>
    </tr>
    <tr>
      <td>Réussies</td>
      <td>${transactionsReussies}</td>
      <td>${Math.round((transactionsReussies / totalTransactions) * 100)}%</td>
    </tr>
    <tr>
      <td>En Attente</td>
      <td>${transactionsEnAttente}</td>
      <td>${Math.round((transactionsEnAttente / totalTransactions) * 100)}%</td>
    </tr>
    <tr>
      <td>Échouées</td>
      <td>${transactionsEchouees}</td>
      <td>${Math.round((transactionsEchouees / totalTransactions) * 100)}%</td>
    </tr>
  </table>

  <h2>📋 Dossiers Récents</h2>
  <table>
    <tr>
      <th>Numéro Dossier</th>
      <th>Candidat</th>
      <th>Destination</th>
      <th>Statut</th>
      <th>Date</th>
    </tr>
    ${allApplications
      .slice(-5)
      .reverse()
      .map((app: any) => {
        const candidate = allCandidates.find((c: any) => c.id === app.candidateId);
        return `
    <tr>
      <td>${app.dossierNumber}</td>
      <td>${candidate?.fullName || "N/A"}</td>
      <td>${(app as any).destinationCountry || "N/A"}</td>
      <td>${(app as any).status || "N/A"}</td>
      <td>${app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td>
    </tr>
    `;
      })
      .join("")}
  </table>

  <h2>💳 Transactions Récentes</h2>
  <table>
    <tr>
      <th>Numéro Dossier</th>
      <th>Montant (XOF)</th>
      <th>Statut</th>
      <th>Date</th>
    </tr>
    ${allTransactions
      .slice(-5)
      .reverse()
      .map((txn: any) => `
    <tr>
      <td>${txn.dossierNumber}</td>
      <td>${(txn.amount || 0).toLocaleString("fr-FR")}</td>
      <td>${txn.status}</td>
      <td>${txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td>
    </tr>
    `)
      .join("")}
  </table>

  <div class="footer">
    <p>Rapport généré automatiquement par 3M Travel Agency - ${new Date().toLocaleString("fr-FR")}</p>
  </div>
</body>
</html>
      `;

      // Générer le fichier PDF
      const fileName = `statistiques_${new Date().toISOString().split("T")[0]}.pdf`;
      const filePath = path.join("/tmp", fileName);

      // Utiliser weasyprint pour convertir HTML en PDF
      const { execSync } = require("child_process");
      const htmlFilePath = path.join("/tmp", `temp_${Date.now()}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent, "utf-8");

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { execSync: exec } = require("child_process");
        exec(`weasyprint ${htmlFilePath} ${filePath}`, { stdio: "pipe" });
        fs.unlinkSync(htmlFilePath);
      } catch (err: any) {
        // Si weasyprint échoue, utiliser une alternative simple
        console.warn("WeasyPrint non disponible, utilisation d'une alternative");
        // Créer un fichier texte formaté comme alternative
        const txtContent = `
=== RAPPORT DE STATISTIQUES - 3M TRAVEL AGENCY ===
Date d'export: ${new Date().toLocaleDateString("fr-FR")}

INDICATEURS CLÉS
Total Dossiers: ${totalDossiers}
Total Candidats: ${totalCandidats}
Total Transactions: ${totalTransactions}
Taux de Réussite: ${Math.round((transactionsReussies / totalTransactions) * 100)}%

REVENUS
Revenu Total: ${totalRevenue.toLocaleString("fr-FR")} XOF
Montant Moyen par Transaction: ${averageTransaction.toLocaleString("fr-FR")} XOF

STATUT DES TRANSACTIONS
Réussies: ${transactionsReussies} (${Math.round((transactionsReussies / totalTransactions) * 100)}%)
En Attente: ${transactionsEnAttente} (${Math.round((transactionsEnAttente / totalTransactions) * 100)}%)
Échouées: ${transactionsEchouees} (${Math.round((transactionsEchouees / totalTransactions) * 100)}%)

Rapport généré automatiquement par 3M Travel Agency - ${new Date().toLocaleString("fr-FR")}
        `;
        fs.writeFileSync(filePath, txtContent, "utf-8");
      }

      return {
        success: true,
        fileName,
        filePath,
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
    .input(z.object({ fileName: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const filePath = path.join("/tmp", input.fileName);

        // Vérifier que le fichier existe et est dans /tmp
        if (!filePath.startsWith("/tmp") || !fs.existsSync(filePath)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fichier non trouvé",
          });
        }

        const fileContent = fs.readFileSync(filePath, "utf-8");
        return {
          success: true,
          fileName: input.fileName,
          content: fileContent,
        };
      } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du téléchargement du fichier",
        });
      }
    }),
};
