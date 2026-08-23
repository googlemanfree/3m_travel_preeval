import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Utilisez le format AAAA-MM-JJ.");

const searchInput = z.object({
  cityName: z.string().trim().min(2).max(120),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Utilisez le code pays ISO à deux lettres."),
  checkin: isoDate,
  checkout: isoDate,
  adults: z.number().int().min(1).max(8),
  currency: z.enum(["XAF", "EUR", "USD"]),
}).superRefine((value, context) => {
  if (value.checkout <= value.checkin) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["checkout"], message: "La date de départ doit être postérieure à la date d’arrivée." });
  }
});

type JinkoRate = {
  offer_id?: string;
  board_name?: string;
  total_amount?: number;
  currency?: string;
  is_refundable?: boolean;
  free_cancellation_until?: string;
};

type JinkoHotel = {
  id?: string | number;
  hotel_id?: string | number;
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  star_rating?: number;
  rating?: number;
  review_count?: number;
  main_photo?: string;
  thumbnail?: string;
  rooms?: Array<{ rates?: JinkoRate[] }>;
};

type JinkoSearchResponse = { hotels?: JinkoHotel[]; total?: number };

function lowestRate(hotel: JinkoHotel) {
  const rates = (hotel.rooms ?? []).flatMap((room) => room.rates ?? [])
    .filter((rate) => typeof rate.total_amount === "number" && Number.isFinite(rate.total_amount));
  return rates.sort((left, right) => (left.total_amount ?? Infinity) - (right.total_amount ?? Infinity))[0] ?? null;
}

export function mapJinkoHotel(hotel: JinkoHotel) {
  const rate = lowestRate(hotel);
  return {
    providerHotelId: String(hotel.hotel_id ?? hotel.id ?? hotel.name ?? "hotel-inconnu"),
    name: hotel.name ?? "Hôtel à confirmer",
    address: hotel.address ?? null,
    city: hotel.city ?? null,
    country: hotel.country ?? null,
    stars: typeof hotel.star_rating === "number" ? hotel.star_rating : null,
    guestRating: typeof hotel.rating === "number" ? hotel.rating : null,
    reviewCount: typeof hotel.review_count === "number" ? hotel.review_count : null,
    imageUrl: hotel.main_photo ?? hotel.thumbnail ?? null,
    indicativeOffer: rate ? {
      offerId: rate.offer_id ?? null,
      boardName: rate.board_name ?? null,
      totalAmount: rate.total_amount ?? null,
      currency: rate.currency ?? null,
      refundable: Boolean(rate.is_refundable),
      freeCancellationUntil: rate.free_cancellation_until ?? null,
    } : null,
  };
}

export const jinkoHotelSearchRouter = router({
  search: publicProcedure.input(searchInput).mutation(async ({ input }) => {
    const apiKey = process.env.JINKO_API_KEY;
    if (!apiKey) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La recherche hôtelière est temporairement indisponible." });
    }

    let response: Response;
    try {
      response = await fetch("https://api.gojinko.com/v1/hotel_search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({
          city_name: input.cityName,
          country_code: input.countryCode,
          checkin: input.checkin,
          checkout: input.checkout,
          adults: input.adults,
          currency: input.currency,
        }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Le fournisseur hôtelier est temporairement indisponible. Réessayez dans quelques instants." });
    }

    if (!response.ok) {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "La recherche hôtelière ne peut pas être finalisée pour le moment." });
    }

    const payload = await response.json() as JinkoSearchResponse;
    const hotels = (payload.hotels ?? []).slice(0, 12).map(mapJinkoHotel);
    return {
      hotels,
      total: typeof payload.total === "number" ? payload.total : hotels.length,
      searchedAt: new Date(),
      provider: "Jinko",
      humanValidationRequired: true,
      notice: "Les disponibilités, conditions et tarifs indicatifs affichés doivent être confirmés par un conseiller 3M avant toute réservation.",
    };
  }),
});
