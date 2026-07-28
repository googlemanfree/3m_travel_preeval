import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Mail,
  MessageCircle,
  Phone,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  X,
  Settings,
  Trash2,
  Archive,
  Volume2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  channels: ("email" | "whatsapp" | "sms" | "push")[];
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  channels: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    push: boolean;
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.05 },
  }),
};

// ─── Composant : Badge de Type ───
const NotificationTypeBadge = ({ type }: { type: Notification["type"] }) => {
  const config = {
    success: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    warning: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    info: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <Info className="w-4 h-4" />,
    },
    alert: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const { bg, text, icon } = config[type];

  return (
    <div className={`${bg} ${text} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
  );
};

// ─── Composant : Ligne de Notification ───
const NotificationItem = ({
  notification,
  onRead,
  onDelete,
  onArchive,
  index,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  index: number;
}) => {
  const timeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideIn}
      custom={index}
      className={`p-4 rounded-lg border-2 transition-all ${
        notification.read
          ? "bg-gray-50 border-gray-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <NotificationTypeBadge type={notification.type} />

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className={`font-semibold ${notification.read ? "text-gray-600" : "text-gray-900"}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Channels */}
          <div className="flex items-center gap-2 mt-2">
            {notification.channels.map((channel) => {
              const icons = {
                email: <Mail className="w-3 h-3" />,
                whatsapp: <MessageCircle className="w-3 h-3" />,
                sms: <Phone className="w-3 h-3" />,
                push: <Bell className="w-3 h-3" />,
              };
              return (
                <span
                  key={channel}
                  className="text-xs bg-white px-2 py-1 rounded flex items-center gap-1 text-gray-600"
                >
                  {icons[channel]}
                  {channel.toUpperCase()}
                </span>
              );
            })}
          </div>

          {/* Time & Actions */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(notification.timestamp)}
            </p>
            <div className="flex items-center gap-2">
              {notification.actionUrl && (
                <Button size="sm" variant="outline">
                  {notification.actionLabel || "Voir"}
                </Button>
              )}
              {!notification.read && (
              <button
                onClick={() => onRead(notification.id)}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Marquer comme lu"
              >
                <Eye className="w-4 h-4 text-blue-600" />
              </button>
              )}
              <button
                onClick={() => onArchive(notification.id)}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Archiver"
              >
                <Archive className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1 hover:bg-red-50 rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Composant : Préférence de Notification ───
const NotificationPreferenceItem = ({
  preference,
  onToggle,
  onChannelToggle,
  index,
}: {
  preference: NotificationPreference;
  onToggle: (id: string) => void;
  onChannelToggle: (id: string, channel: keyof NotificationPreference["channels"]) => void;
  index: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideIn}
      custom={index}
      className="p-4 bg-white rounded-lg border border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            {preference.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{preference.name}</h4>
            <p className="text-sm text-gray-600">{preference.description}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={preference.enabled}
            onChange={() => onToggle(preference.id)}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold text-gray-700">
            {preference.enabled ? "Activé" : "Désactivé"}
          </span>
        </label>
      </div>

      {/* Channels */}
      {preference.enabled && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(preference.channels).map(([channel, enabled]) => (
            <label
              key={channel}
              className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() =>
                  onChannelToggle(preference.id, channel as keyof NotificationPreference["channels"])
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 capitalize">{channel}</span>
            </label>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Composant Principal : NotificationCenter ───
export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "✓ Passeport Vérifié",
      message: "Votre passeport a été vérifié avec succès par notre équipe",
      timestamp: new Date(Date.now() - 3600000),
      channels: ["email", "whatsapp", "push"],
      read: false,
      actionUrl: "/documents",
      actionLabel: "Voir",
    },
    {
      id: "2",
      type: "warning",
      title: "⚠️ Documents Manquants",
      message: "Veuillez uploader vos diplômes avant le 25 juillet 2026",
      timestamp: new Date(Date.now() - 7200000),
      channels: ["email", "whatsapp", "sms"],
      read: false,
      actionUrl: "/documents",
      actionLabel: "Uploader",
    },
    {
      id: "3",
      type: "info",
      title: "ℹ️ Rappel RDV",
      message: "Vous avez un rendez-vous demain à 10h00 avec Alain Fouda",
      timestamp: new Date(Date.now() - 86400000),
      channels: ["email", "push"],
      read: true,
      actionUrl: "/appointments",
      actionLabel: "Détails",
    },
    {
      id: "4",
      type: "alert",
      title: "🚨 Délai Critique",
      message: "Votre visa expire dans 30 jours. Commencez la procédure de renouvellement",
      timestamp: new Date(Date.now() - 172800000),
      channels: ["email", "whatsapp", "sms", "push"],
      read: true,
      actionUrl: "/renewal",
      actionLabel: "Renouveler",
    },
  ]);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "dossier_updates",
      name: "Mises à Jour du Dossier",
      description: "Notifications sur l'avancement de votre demande",
      icon: <CheckCircle2 className="w-5 h-5" />,
      enabled: true,
      channels: { email: true, whatsapp: true, sms: false, push: true },
    },
    {
      id: "documents",
      name: "Documents",
      description: "Alertes sur les documents manquants ou rejetés",
      icon: <AlertCircle className="w-5 h-5" />,
      enabled: true,
      channels: { email: true, whatsapp: true, sms: true, push: true },
    },
    {
      id: "appointments",
      name: "Rendez-vous",
      description: "Rappels et confirmations de rendez-vous",
      icon: <Clock className="w-5 h-5" />,
      enabled: true,
      channels: { email: true, whatsapp: false, sms: false, push: true },
    },
    {
      id: "payments",
      name: "Paiements",
      description: "Notifications de paiement et de facturation",
      icon: <Mail className="w-5 h-5" />,
      enabled: true,
      channels: { email: true, whatsapp: false, sms: false, push: false },
    },
    {
      id: "promotions",
      name: "Promotions",
      description: "Offres spéciales et actualités",
      icon: <Volume2 className="w-5 h-5" />,
      enabled: false,
      channels: { email: true, whatsapp: false, sms: false, push: false },
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleArchive = (id: string) => {
    handleDelete(id);
  };

  const handleTogglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleToggleChannel = (
    id: string,
    channel: keyof NotificationPreference["channels"]
  ) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              channels: {
                ...p.channels,
                [channel]: !p.channels[channel],
              },
            }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-600" />
              Centre de Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos notifications et préférences
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-semibold transition-colors ${
                activeTab === "notifications"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-4 px-1 border-b-2 font-semibold transition-colors ${
                activeTab === "preferences"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Préférences
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    index={index}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {preferences.map((preference, index) => (
                <NotificationPreferenceItem
                  key={preference.id}
                  preference={preference}
                  onToggle={handleTogglePreference}
                  onChannelToggle={handleToggleChannel}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
