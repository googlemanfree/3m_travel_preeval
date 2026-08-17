export type CommunicationHistoryMessage = {
  id: number;
  senderRole: string;
  content: string;
  createdAt: Date | string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  evisaSnapshotJson?: string | null;
};

export type CommunicationHistoryNotification = {
  id: number;
  title: string;
  body: string;
  createdAt: Date | string;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function buildCommunicationHistoryEntries(messages: CommunicationHistoryMessage[], notifications: CommunicationHistoryNotification[]) {
  const entries = [
    ...notifications.map((notification) => ({
      createdAt: notification.createdAt,
      title: `Notification — ${notification.title}`,
      content: notification.body,
    })),
    ...messages.map((message) => {
      let snapshot = "";
      try {
        const parsed = message.evisaSnapshotJson ? JSON.parse(message.evisaSnapshotJson) : null;
        if (parsed?.items?.length) {
          snapshot = `\n\nInstantané e‑Visa partagé le ${formatDate(parsed.sharedAt)} :\n${parsed.items.map((item: any) => [
            `${item.country} — ${item.officialPortalLabel}`,
            `Portail : ${item.officialPortalUrl}`,
            `Vérifié le : ${item.officialVerifiedAt}`,
            `Exigences : ${item.requirements}`,
            `Frais et délai : ${item.fee} · ${item.delay}`,
            `Procédure : ${item.procedureUrl}`,
          ].join("\n")).join("\n\n")}`;
        }
      } catch {
        snapshot = "\n\nInstantané e‑Visa archivé, format historique non lisible.";
      }
      const attachment = message.attachmentName ? `\n\nPièce jointe référencée : ${message.attachmentName}${message.attachmentUrl ? `\nLien : ${message.attachmentUrl}` : ""}` : "";
      return {
        createdAt: message.createdAt,
        title: message.senderRole === "candidate" ? "Message du candidat" : "Message de l’administration",
        content: `${message.content}${attachment}${snapshot}`,
      };
    }),
  ];
  return entries.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}
