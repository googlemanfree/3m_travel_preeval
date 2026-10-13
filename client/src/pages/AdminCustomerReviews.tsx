import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, XCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import ReviewInvitationPanel from "@/components/ReviewInvitationPanel";
import AdminReviewsToInvite from "@/components/AdminReviewsToInvite";
import { ReviewRowTools, TestimonialComposer } from "@/components/AdminTestimonialTools";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "⏳ À valider",
  approved: "✅ Publié",
  rejected: "❌ Rejeté / retiré",
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-gray-200 text-gray-600",
};

export default function AdminCustomerReviews() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("admin_session_token") || localStorage.getItem("admin_session_token") || ""
    : "";
  const { data: adminReviews, isLoading, refetch } = trpc.customerReview.listForAdmin.useQuery(
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

  const items = useMemo(() => [...(adminReviews ?? [])]
    .filter((review) => statusFilter === "all" || review.status === statusFilter)
    .sort((a, b) => {
      const difference = new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime();
      return dateSort === "newest" ? -difference : difference;
    }), [adminReviews, dateSort, statusFilter]);

  const publishedCount = (adminReviews ?? []).filter((review) => review.status === "approved").length;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⭐ Témoignages et avis clients</h1>

        {sessionToken && <AdminReviewsToInvite sessionToken={sessionToken} />}
        {sessionToken && <ReviewInvitationPanel />}
        {sessionToken && <TestimonialComposer sessionToken={sessionToken} onSaved={() => void refetch()} />}

        {!sessionToken ? (
          <p className="text-center text-amber-600 py-16">Veuillez vous connecter en tant qu'administrateur pour accéder à la modération.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
          <Card className="mb-4 flex flex-col gap-3 border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-900">File des témoignages</p>
              <p className="text-xs text-slate-500">{items.length} résultat(s) affiché(s) · {publishedCount} publié(s) sur le site</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select aria-label="Filtrer les avis par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="all">Tous les statuts</option>
                <option value="pending_review">À valider</option>
                <option value="approved">Publiés</option>
                <option value="rejected">Rejetés / retirés</option>
              </select>
              <select aria-label="Trier les avis par date" value={dateSort} onChange={(event) => setDateSort(event.target.value as "newest" | "oldest")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="newest">Les plus récents</option>
                <option value="oldest">Les plus anciens</option>
              </select>
            </div>
          </Card>
          {items.length === 0 ? <p className="text-center text-gray-500 py-16">Aucun avis ne correspond à ces filtres.</p> : <div className="space-y-4">
            {items.map((review) => (
              <Card key={review.id} className="p-5" data-testid={`review-card-${review.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.fullName} <span className="text-xs font-normal text-gray-500">· affiché « {review.displayName} »</span></p>
                    <p className="text-xs text-gray-500">
                      {review.email.endsWith("@temoignage.invalid") ? "E-mail non communiqué" : review.email}
                      {review.destinationCountry ? ` — ${review.destinationCountry}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={STATUS_COLORS[review.status]}>
                      {STATUS_LABELS[review.status]}
                    </Badge>
                    {review.adminEntered && <Badge variant="outline" className="border-blue-200 text-blue-800" data-testid={`review-admin-entered-${review.id}`}>Saisi par l’administration</Badge>}
                  </div>
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

                {review.adminNotes && (
                  <details className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <summary className="cursor-pointer font-semibold text-slate-700">Historique et preuve de l’accord</summary>
                    <p className="mt-2 whitespace-pre-line">{review.adminNotes}</p>
                  </details>
                )}

                {review.status === "pending_review" && (
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
                )}

                {review.status !== "rejected" && (
                  <ReviewRowTools
                    sessionToken={sessionToken}
                    review={{ id: review.id, status: review.status, reviewText: review.reviewText, destinationCountry: review.destinationCountry, serviceType: review.serviceType, displayNameChoice: review.displayNameChoice }}
                    onChanged={() => void refetch()}
                  />
                )}
              </Card>
            ))}
          </div>}
          </>
        )}
      </div>
    </main>
  );
}
