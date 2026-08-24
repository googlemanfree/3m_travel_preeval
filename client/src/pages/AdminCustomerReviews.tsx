import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, XCircle, Loader } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "⏳ À valider",
  approved: "✅ Publié",
  rejected: "❌ Rejeté",
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-gray-200 text-gray-600",
};

export default function AdminCustomerReviews() {
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("admin_session_token") || localStorage.getItem("admin_session_token") || ""
    : "";
  const { data: pendingReviews, isLoading, refetch } = trpc.customerReview.getPendingReviews.useQuery(
    { sessionToken },
    { refetchInterval: 30000, enabled: !!sessionToken }
  );

  const approveMutation = trpc.customerReview.approveReview.useMutation({
    onSuccess: () => {
      toast.success("Avis publié.");
      refetch();
    },
  });

  const rejectMutation = trpc.customerReview.rejectReview.useMutation({
    onSuccess: () => {
      toast.success("Avis rejeté.");
      refetch();
    },
  });

  const items = pendingReviews ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⭐ Modération des avis clients</h1>

        {!sessionToken ? (
          <p className="text-center text-amber-600 py-16">Veuillez vous connecter en tant qu'administrateur pour accéder à la modération.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Aucun avis en attente de validation.</p>
        ) : (
          <div className="space-y-4">
            {items.map((review) => (
              <Card key={review.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {review.email}
                      {review.destinationCountry ? ` — ${review.destinationCountry}` : ""}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[review.status]}>
                    {STATUS_LABELS[review.status]}
                  </Badge>
                </div>

                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-sm mb-4">"{review.reviewText}"</p>

                <p className="text-xs text-gray-400 mb-3">
                  Service: {review.serviceType || "Non spécifié"}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      approveMutation.mutate({ sessionToken, reviewId: review.id })
                    }
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Publier
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      rejectMutation.mutate({ sessionToken, reviewId: review.id })
                    }
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Rejeter
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
