import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ClientNotificationItem = {
  id: number;
  type?: string | null;
  title: string;
  body: string;
  actionUrl?: string | null;
  isRead?: boolean | null;
  isArchived?: boolean | null;
  createdAt?: string | Date | null;
};

function sourceLabel(type?: string | null): string {
  const key = String(type || "").toLowerCase();
  if (key.includes("agency") || key.includes("placement") || key.includes("employer")) return "Agence de placement";
  if (key.includes("document") || key.includes("requirement") || key.includes("clarification")) return "Documents";
  if (key.includes("payment") || key.includes("receipt") || key.includes("protocol")) return "Paiement";
  return "Administration";
}

/** Centre de notifications de l’espace client : historique durable + marquage lu. */
export default function ClientNotificationsInbox({
  notifications,
  onChanged,
}: {
  notifications: ClientNotificationItem[];
  onChanged?: () => void;
}) {
  const markRead = trpc.caseTracking.markNotificationRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marquée comme lue");
      onChanged?.();
    },
    onError: (error) => toast.error(error.message || "Impossible de marquer comme lue."),
  });
  const markUnread = trpc.caseTracking.markNotificationUnread.useMutation({
    onSuccess: () => onChanged?.(),
    onError: (error) => toast.error(error.message || "Impossible de rouvrir la notification."),
  });

  const visible = notifications.filter((item) => !item.isArchived);
  const unread = visible.filter((item) => !item.isRead).length;

  return (
    <Card className="premium-surface border-slate-200 p-6" data-testid="client-notifications-inbox" aria-labelledby="notifications-inbox-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="notifications-inbox-title" className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <Bell className="h-5 w-5 text-blue-700" aria-hidden="true" />
            Centre de notifications
            {unread > 0 ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{unread}</span>
            ) : null}
          </h3>
          <p className="mt-1 text-sm text-slate-600">Messages de l’administration, documents publiés et mises à jour de votre dossier.</p>
        </div>
        {unread > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={markRead.isPending}
            onClick={() => {
              visible.filter((item) => !item.isRead).slice(0, 20).forEach((item) => {
                markRead.mutate({ notificationId: item.id });
              });
            }}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Tout marquer comme lu
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
          <Bell className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-slate-800">Aucune notification pour le moment</p>
          <p className="mt-1 text-sm text-slate-600">Dès qu’un conseiller publie un document ou avance votre dossier, l’alerte apparaît ici.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y">
          {visible.map((notification) => {
            const read = Boolean(notification.isRead);
            return (
              <li
                key={notification.id}
                className={`flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between ${read ? "opacity-80" : ""}`}
                data-testid={read ? "notification-read" : "notification-unread"}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {sourceLabel(notification.type)}
                    {notification.createdAt
                      ? ` · ${new Date(notification.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`
                      : ""}
                  </p>
                  <p className={`mt-1 text-sm ${read ? "font-medium text-slate-700" : "font-bold text-slate-950"}`}>{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{notification.body}</p>
                  {notification.actionUrl ? (
                    <a
                      href={notification.actionUrl}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
                    >
                      Ouvrir <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  {read ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => markUnread.mutate({ notificationId: notification.id })}>
                      Marquer non lue
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => markRead.mutate({ notificationId: notification.id })}>
                      Marquer comme lue
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
