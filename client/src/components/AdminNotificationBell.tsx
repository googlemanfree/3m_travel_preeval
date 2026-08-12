import { useState } from "react";
import { Bell, X, FileText, Mail, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, any> = {
  new_evaluation: FileText,
  new_contact_message: Mail,
  new_document: FileText,
  payment_received: CheckCircle2,
};

function timeAgo(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("adminSessionToken") || "" : "";

  const { data, refetch } = trpc.adminNotifications.list.useQuery(
    { sessionToken, limit: 20 },
    { enabled: !!sessionToken, refetchInterval: 20000 } // sondage toutes les 20s
  );

  const markAsRead = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllAsRead = trpc.adminNotifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  if (!sessionToken) return null;

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Notifications"}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate({ sessionToken })}
              className="text-xs text-blue-600 hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucune notification pour le moment.</p>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead.mutate({ sessionToken, notificationId: n.id })}
                      aria-label="Marquer comme lu"
                      className="flex-shrink-0 text-gray-300 hover:text-blue-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
