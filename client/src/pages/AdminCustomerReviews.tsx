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
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [statusFilter, setStatusFilter] = useState<string>("pending_review");

  const { data: reviews, isLoading, refetch } = trpc.customerReview.listForAdmin.useQuery(
    { sessionToken, status: statusFilter !== "tous" ? (statusFilter as any) : undefined },
    { enabled: !!sessionToken, refetchInterval: 30000 }
  );

  const approveMutation = trpc.customerReview.approve.useMutation({
    onSuccess: () => { toast.success("Avis publié."); refetch(); },
  });
  const rejectMutation = trpc.customerReview.reject.useMutation({
    onSuccess: () => { toast.success("Avis rejeté."); refetch(); },
  });

  const items = reviews ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⭐ Modération des avis clients</h1>

        {!sessionToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-sm">
            Session admin introuvable — reconnectez-vous sur /admin/login.
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending_review", "approved", "rejected", "tous"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
            >
              {s === "tous" ? "Tous" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Aucun avis dans cette catégorie.</p>
        ) : (
          <div className="space-y-4">
            {items.map((review) => (
              <Card key={review.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.fullName}</p>
                    <p className="text-xs text-gray-500">{review.email} {review.destinationCountry ? `— ${review.destinationCountry}` : ""}</p>
                  </div>
                  <Badge className={STATUS_COLORS[review.status]}>{STATUS_LABELS[review.status]}</Badge>
                </div>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4">"{review.reviewText}"</p>
                <p className="text-xs text-gray-400 mb-3">
                  Consentement à la publication : {review.consentToPublish ? "✅ Oui" : "❌ Non"} — Affichage choisi : {review.displayNameChoice}
                </p>
                {review.status === "pending_review" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => approveMutation.mutate({ sessionToken, reviewId: review.id })}
                      disabled={approveMutation.isPending || !review.consentToPublish}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Publier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate({ sessionToken, reviewId: review.id })}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {review.status === "pending_review" && !review.consentToPublish && (
                  <p className="text-xs text-red-500 mt-2">⚠️ Le client n'a pas coché le consentement — ne peut pas être publié.</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
