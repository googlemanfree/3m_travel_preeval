import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ambassadors, applications } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I)

function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const ambassadorRouter = router({
  register: publicProcedure
    .input(z.object({
      fullName: z.string().trim().min(2).max(255),
      email: z.string().trim().toLowerCase().email().max(320),
      phone: z.string().trim().min(6).max(50),
      country: z.string().trim().min(2).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service indisponible pour le moment." });

      const existing = await db.select({ id: ambassadors.id, referralCode: ambassadors.referralCode })
        .from(ambassadors).where(eq(ambassadors.email, input.email)).limit(1);
      if (existing[0]) {
        return { referralCode: existing[0].referralCode, alreadyRegistered: true } as const;
      }

      let referralCode = generateReferralCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await db.select({ id: ambassadors.id }).from(ambassadors).where(eq(ambassadors.referralCode, referralCode)).limit(1);
        if (!clash[0]) break;
        referralCode = generateReferralCode();
      }

      await db.insert(ambassadors).values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        referralCode,
      });

      return { referralCode, alreadyRegistered: false } as const;
    }),

  getStatsByCode: publicProcedure
    .input(z.object({ referralCode: z.string().trim().toUpperCase().max(16) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service indisponible pour le moment." });

      const ambassadorRows = await db.select().from(ambassadors).where(eq(ambassadors.referralCode, input.referralCode)).limit(1);
      const ambassador = ambassadorRows[0];
      if (!ambassador) throw new TRPCError({ code: "NOT_FOUND", message: "Code de parrainage introuvable." });

      const referredApplications = await db.select({
        paymentStatus: applications.paymentStatus,
        paymentAmount: applications.paymentAmount,
        paymentConfirmedAmount: applications.paymentConfirmedAmount,
      }).from(applications).where(eq(applications.referredByCode, input.referralCode));

      const paidApplications = referredApplications.filter((a) => a.paymentStatus === "SUCCESS");
      const totalCommissionXaf = paidApplications.reduce((sum, a) => {
        const amount = a.paymentConfirmedAmount ?? a.paymentAmount ?? 0;
        return sum + Math.round((amount * ambassador.commissionRateBps) / 10000);
      }, 0);

      return {
        fullName: ambassador.fullName,
        referralCode: ambassador.referralCode,
        status: ambassador.status,
        commissionRateBps: ambassador.commissionRateBps,
        totalReferrals: referredApplications.length,
        paidReferrals: paidApplications.length,
        totalCommissionXaf,
      };
    }),
});
