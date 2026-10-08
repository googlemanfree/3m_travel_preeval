import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, XCircle, Loader, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import ReviewInvitationPanel from "@/components/ReviewInvitationPanel";
import AdminReviewsToInvite from "@/components/AdminReviewsToInvite";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", destinationCountry: "", serviceType: "", rating: "5", reviewText: "", displayNameChoice: "first_name_only" as "full_name" | "first_name_only" | "initials", consentToPublish: false });
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

  const createMutation = trpc.customerReview.createByAdmin.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setCreateForm({ fullName: "", email: "", destinationCountry: "", serviceType: "", rating: "5", reviewText: "", displayNameChoice: "first_name_only", consentToPublish: false });
      setShowCreateForm(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const items = useMemo(() => [...(adminReviews ?? [])]
    .filter((review) => statusFilter === "all" || review.status === statusFilter)
    .sort((a, b) => {
      const difference = new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime();
      return dateSort === "newest" ? -difference : difference;
    }), [adminReviews, dateSort, statusFilter]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">⭐ Modération des avis clients</h1>

        {sessionToken && <AdminReviewsToInvite sessionToken={sessionToken} />}
        {sessionToken && <ReviewInvitationPanel />}
        {sessionToken && (
          <Card className="mb-6 border-blue-200 bg-blue-50/60 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h2 className="font-bold text-slate-900">Avis fourni par un client</h2><p className="mt-1 text-sm text-slate-600">Saisissez uniquement un témoignage réellement reçu avec l’autorisation de publication.</p></div>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm((value) => !value)} className="gap-2 border-blue-300 bg-white"><PlusCircle className="h-4 w-4" />{showCreateForm ? "Fermer" : "Ajouter un avis"}</Button>
            </div>
            {showCreateForm && <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (!createForm.consentToPublish) { toast.error("Confirmez le consentement du client avant l’enregistrement."); return; } createMutation.mutate({ sessionToken, ...createForm, consentToPublish: true, rating: Number(createForm.rating) }); }}>
              <label className="text-sm font-semibold text-slate-700">Nom du client<input required value={createForm.fullName} onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">E-mail du client<input required type="email" value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Destination<input value={createForm.destinationCountry} onChange={(event) => setCreateForm((current) => ({ ...current, destinationCountry: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Service<input value={createForm.serviceType} onChange={(event) => setCreateForm((current) => ({ ...current, serviceType: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Note<select value={createForm.rating} onChange={(event) => setCreateForm((current) => ({ ...current, rating: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Nom affiché<select value={createForm.displayNameChoice} onChange={(event) => setCreateForm((current) => ({ ...current, displayNameChoice: event.target.value as typeof current.displayNameChoice }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500"><option value="first_name_only">Prénom uniquement</option><option value="initials">Initiales</option><option value="full_name">Nom complet autorisé</option></select></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">Témoignage<textarea required minLength={10} maxLength={1000} value={createForm.reviewText} onChange={(event) => setCreateForm((current) => ({ ...current, reviewText: event.target.value }))} className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="flex items-start gap-2 text-sm text-slate-700 md:col-span-2"><input type="checkbox" checked={createForm.consentToPublish} onChange={(event) => setCreateForm((current) => ({ ...current, consentToPublish: event.target.checked }))} className="mt-1 h-4 w-4" />Je confirme que ce témoignage vient réellement du client et qu’il a autorisé sa publication.</label>
              <Button type="submit" disabled={createMutation.isPending} className="md:col-span-2 md:w-fit">{createMutation.isPending ? "Enregistrement…" : "Enregistrer pour validation"}</Button>
            </form>}
          </Card>
        )}

        {!sessionToken ? (
          <p className="text-center text-amber-600 py-16">Veuillez vous connecter en tant qu'administrateur pour accéder à la modération.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
          <Card className="mb-4 flex flex-col gap-3 border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-bold text-slate-900">File des témoignages</p><p className="text-xs text-slate-500">{items.length} résultat(s) affiché(s)</p></div>
            <div className="flex flex-wrap gap-2"><select aria-label="Filtrer les avis par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">Tous les statuts</option><option value="pending_review">À valider</option><option value="approved">Publiés</option><option value="rejected">Rejetés</option></select><select aria-label="Trier les avis par date" value={dateSort} onChange={(event) => setDateSort(event.target.value as typeof dateSort)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option></select></div>
          </Card>
          {items.length === 0 ? <p className="text-center text-gray-500 py-16">Aucun avis ne correspond à ces filtres.</p> : <div className="space-y-4">
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
          </div>}
          </>
        )}
      </div>
    </main>
  );
}
