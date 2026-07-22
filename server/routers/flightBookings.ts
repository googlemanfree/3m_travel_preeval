import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { flightBookings, type FlightBooking } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Schéma d'un passager
const passengerSchema = z.object({
  type: z.enum(["adult", "child", "infant"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  nationality: z.string().min(1),
  passportNumber: z.string().min(1),
  passportExpiry: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
});

// Schéma du vol sélectionné
const flightDataSchema = z.object({
  airline: z.string(),
  airlineCode: z.string(),
  flightNumber: z.string(),
  from: z.string(),
  fromCity: z.string(),
  to: z.string(),
  toCity: z.string(),
  departure: z.string(),
  arrival: z.string(),
  duration: z.string(),
  stops: z.number(),
  stopCities: z.array(z.string()).optional(),
  class: z.string(),
  price: z.number(),
  baggageIncluded: z.boolean().optional(),
  refundable: z.boolean().optional(),
  pnr: z.string().optional(),
  // Retour (aller-retour)
  returnFlight: z.object({
    airline: z.string(),
    flightNumber: z.string(),
    departure: z.string(),
    arrival: z.string(),
    duration: z.string(),
    stops: z.number(),
    price: z.number(),
  }).optional(),
});

// Génère une référence de réservation unique
function generateBookingRef(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `3MF-${year}-${random}`;
}

export const flightBookingsRouter = router({
  // Créer une réservation de vol
  createBooking: publicProcedure
    .input(z.object({
      flightData: flightDataSchema,
      passengers: z.array(passengerSchema).min(1),
      contactEmail: z.string().email(),
      contactPhone: z.string().min(8),
      adultsCount: z.number().min(1),
      childrenCount: z.number().min(0).default(0),
      infantsCount: z.number().min(0).default(0),
      totalPrice: z.number().min(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const bookingRef = generateBookingRef();

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const booking = await db.insert(flightBookings).values({
        bookingRef,
        flightData: JSON.stringify(input.flightData),
        passengersData: JSON.stringify(input.passengers),
        adultsCount: input.adultsCount,
        childrenCount: input.childrenCount,
        infantsCount: input.infantsCount,
        totalPrice: input.totalPrice,
        currency: "XAF",
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        bookingStatus: "pending",
        userId: ctx.user?.id ?? null,
      });

      return {
        success: true,
        bookingRef,
        bookingId: Number((booking as any).insertId),
      };
    }),

  // Récupérer une réservation par référence
  getBookingByRef: publicProcedure
    .input(z.object({
      bookingRef: z.string(),
      contactEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [booking] = await db
        .select()
        .from(flightBookings)
        .where(eq(flightBookings.bookingRef, input.bookingRef))
        .limit(1);

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Réservation introuvable" });
      }

      // Vérification email pour sécurité
      if (booking.contactEmail.toLowerCase() !== input.contactEmail.toLowerCase()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Email incorrect" });
      }

      return {
        ...booking,
        flightData: JSON.parse(booking.flightData),
        passengersData: JSON.parse(booking.passengersData),
      };
    }),

  // Mes réservations (utilisateur connecté)
  getMyBookings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const bookings = await db
        .select()
        .from(flightBookings)
        .where(eq(flightBookings.userId, ctx.user.id))
        .orderBy(desc(flightBookings.createdAt));

      return bookings.map((b: FlightBooking) => ({
        ...b,
        flightData: JSON.parse(b.flightData),
        passengersData: JSON.parse(b.passengersData),
      }));
    }),

  // Admin — liste toutes les réservations
  listAllBookings: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "pending", "confirmed", "paid", "ticketed", "cancelled"]).default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const bookings = await db
        .select()
        .from(flightBookings)
        .orderBy(desc(flightBookings.createdAt));

      const filtered = input?.status && input.status !== "all"
        ? bookings.filter((b: FlightBooking) => b.bookingStatus === input.status)
        : bookings;

      return filtered.map((b: FlightBooking) => ({
        ...b,
        flightData: JSON.parse(b.flightData),
        passengersData: JSON.parse(b.passengersData),
      }));
    }),

  // Admin — mettre à jour le statut d'une réservation
  updateBookingStatus: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      status: z.enum(["pending", "confirmed", "paid", "ticketed", "cancelled"]),
      adminNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db
        .update(flightBookings)
        .set({
          bookingStatus: input.status,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        })
        .where(eq(flightBookings.id, input.bookingId));

      return { success: true };
    }),
});
