import { useState } from "react";
import { ChevronDown, ChevronRight, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { buildReviewInviteMessage, buildReviewInviteUrl, buildReviewInviteWhatsAppUrl } from "@/lib/reviewInvitation";

/**
 * Clients dont le visa est accordé et qui n'ont pas encore été invités à donner leur avis : une ligne par client, avec le message
 * WhatsApp déjà préparé (prénom, service, destination). L'équipe envoie elle-même ; le client garde la main (accord de publication).
 */
export default function AdminReviewsToInvite({ sessionToken }: { sessionToken: string }) {
  const [open, setOpen] = useState(true);
  const utils = trpc.useUtils();
  const query = trpc.reviewInvites.listToInvite.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), staleTime: 60_000, retry: 1 });
  const markInvited = trpc.reviewInvites.markInvited.useMutation({
    onSuccess: () => void utils.reviewInvites.listToInvite.invalidate(),
    onError: () => toast.error("L’invitation n’a pas pu être notée : elle restera dans la liste."),
  });
  const items = query.data?.items ?? [];
  const count = query.data?.count ?? 0;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40 p-5" data-testid="reviews-to-invite">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><Star className="h-5 w-5 text-amber-600" aria-hidden="true" />Clients à inviter à donner leur avis</h2>
          <p className="mt-1 text-sm text-slate-600">
            {query.isLoading ? "Chargement…" : query.error ? "Liste indisponible pour le moment." : count === 0 ? "Tous les clients dont le visa est accordé ont été invités ou ont déjà donné leur avis." : `${count} client${count > 1 ? "s" : ""} avec un visa accordé ${count > 1 ? "n’ont" : "n’a"} pas encore été invité${count > 1 ? "s" : ""}.`}
          </p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
      </button>
      {open && items.length > 0 && (
        <ul className="mt-4 divide-y divide-amber-100 rounded-xl border border-amber-100 bg-white" data-testid="to-invite-list">
          {items.map((item) => {
            const url = buildReviewInviteUrl({ serviceType: item.service, destinationCountry: item.destination });
            const message = buildReviewInviteMessage({ firstName: item.firstName, url });
            const whatsapp = buildReviewInviteWhatsAppUrl({ phone: item.phone, message });
            return (
              <li key={item.key} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid="to-invite-row">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{item.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{[item.service, item.destination].filter(Boolean).join(" · ") || "Visa accordé"}{item.approvedAt ? ` · visa le ${new Date(item.approvedAt).toLocaleDateString("fr-FR")}` : ""}</p>
                </div>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => markInvited.mutate({ sessionToken, key: item.key })} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700" data-testid="invite-whatsapp">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />Inviter sur WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
