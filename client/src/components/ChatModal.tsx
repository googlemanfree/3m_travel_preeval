import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type Message = {
  role: "user" | "support";
  content: string;
  createdAt?: string;
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "support",
      content: "Bienvenue ! 👋 Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les messages existants
  const { data: existingMessages } = trpc.contact.getMessages.useQuery(
    { sessionId },
    { enabled: isOpen && isInitialized }
  );

  // Mutation pour envoyer un message
  const sendMessageMutation = trpc.contact.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent("");
      setIsLoading(false);
      // Recharger les messages
      if (isInitialized) {
        // Ajouter le message à la liste locale
        setMessages((prev) => [
          ...prev,
          { role: "user", content: messageContent },
        ]);
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi du message");
      setIsLoading(false);
    },
  });

  // Charger les messages existants
  useEffect(() => {
    if (existingMessages && isOpen) {
      const formattedMessages = existingMessages.map((msg) => ({
        role: (msg.senderRole === "visitor" ? "user" : "support") as "user" | "support",
        content: msg.content,
        createdAt: msg.createdAt?.toString(),
      }));
      if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
      }
    }
  }, [existingMessages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitorName.trim() || !visitorEmail.trim() || !messageContent.trim()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setIsLoading(true);

    try {
      await sendMessageMutation.mutateAsync({
        visitorName,
        visitorEmail,
        visitorPhone,
        sessionId,
        content: messageContent,
        subject: "Chat Support",
      });

      // Ajouter le message à la liste
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageContent },
      ]);

      // Simuler une réponse du support après 1 seconde
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "support",
            content: "Merci pour votre message ! Notre équipe vous répondra dans les plus brefs délais.",
          },
        ]);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsInitialized(true);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="text-lg font-bold">Chat en direct</DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          {!isInitialized || (visitorName === "" && visitorEmail === "") ? (
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Input
                placeholder="Votre nom"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="text-sm"
                required
              />
              <Input
                placeholder="Votre email"
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                className="text-sm"
                required
              />
              <Input
                placeholder="Votre téléphone (optionnel)"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Votre message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="text-sm resize-none min-h-20"
                required
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Envoi..." : "Envoyer"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                placeholder="Votre message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="text-sm resize-none min-h-10 max-h-20"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                disabled={isLoading || !messageContent.trim()}
              >
                <Send size={18} />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
