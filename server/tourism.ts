import { and, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { tourismServiceRequests } from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { requireAdminSessionFromCookie } from "./routers/adminAuth";

const statusSchema = z.enum(["new", "quote_sent", "confirmed", "cancelled"]);

export function buildTourismServiceTypes(packType: string, selectedServices: string[]): string {
  const set = new Set(selectedServices);
  if (packType === "escapade") set.add("hotel");
  if (packType === "explorer") { set.add("hotel"); set.add("vehicle"); }
  if (packType === "business") { set.add("hotel"); set.add("vehicle"); set.add("concierge"); }
  return Array.from(set).join(",");
}

export const tourismRouter = router({
  createRequest: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        destination: z.string().min(2),
        serviceType: z.enum(["hotel", "vehicle", "pack"]),
        packType: z.string().optional(),
        hotelPreferences: z.string().optional(),
        vehiclePreferences: z.string().optional(),
        budgetRange: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        notes: z.string().optional(),
        selectedServices: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const reference = `TOUR-${Math.floor(100000 + Math.random() * 900000)}`;
      const combinedServiceTypes = input.packType 
        ? buildTourismServiceTypes(input.packType, input.selectedServices)
        : input.selectedServices.join(",");

      const [inserted] = await db.insert(tourismServiceRequests).values({
        reference,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        destination: input.destination,
        serviceType: input.serviceType,
        packType: input.packType || null,
        hotelPreferences: input.hotelPreferences || null,
        vehiclePreferences: input.vehiclePreferences || null,
        budgetRange: input.budgetRange || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        notes: input.notes || null,
        selectedServices: combinedServiceTypes,
        status: "new",
      });

      return { success: true, reference, id: inserted.insertId };
    }),

  listAdminRequests: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        serviceType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rows = await db.select().from(tourismServiceRequests).orderBy(desc(tourismServiceRequests.createdAt));
      
      let filtered = rows;
      if (input.status && input.status !== "ALL") {
        filtered = filtered.filter(r => r.status === input.status);
      }
      if (input.serviceType && input.serviceType !== "ALL") {
        filtered = filtered.filter(r => r.serviceType === input.serviceType);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(r => 
          r.fullName.toLowerCase().includes(q) || 
          r.email.toLowerCase().includes(q) || 
          r.destination.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q)
        );
      }

      return {
        requests: filtered,
        total: filtered.length,
      };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: statusSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      await db.update(tourismServiceRequests).set({ status: input.status }).where(eq(tourismServiceRequests.id, input.id));
      return { success: true };
    }),

  updateDetails: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        quotedPriceXaf: z.number().int().positive().optional(),
        adminNotes: z.string().max(1500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const updateData: Record<string, any> = {};
      if (input.quotedPriceXaf !== undefined) updateData.quotedPriceXaf = input.quotedPriceXaf;
      if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;

      if (Object.keys(updateData).length > 0) {
        await db.update(tourismServiceRequests).set(updateData).where(eq(tourismServiceRequests.id, input.id));
      }
      return { success: true };
    }),
});
