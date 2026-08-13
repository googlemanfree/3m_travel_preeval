import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader, Sparkles, ThumbsUp, ThumbsDown, Zap, FileText, Phone, Download, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface SourceItem {
  title: string;
  url: string;
  country: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  feedback?: "up" | "down" | null;
  showActions?: boolean;
}

const QUICK_ACTIONS = [
  {
    label: "💰 Frais d'ouverture",
    question:
      "À quoi correspondent les 65 000 FCFA de frais d'ouverture de dossier ?",
  },
  {
    label: "📄 Documents requis",
    question:
      "Quels sont les documents généralement demandés pour une évaluation ?",
  },
  {
    label: "🌍 Destinations",
    question: "Combien de destinations sont disponibles et quels types de visas ?",
  },
  { label: "💬 Appel WhatsApp", whatsapp: true },
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour ! Je suis Aureol, l’assistant IA de 3M Travel 🤖 Je peux répondre à vos questions sur les évaluations, les visas, les destinations et nos procédures. Comment puis-je vous aider ?",
  feedback: null,
  showActions: true,
};

const QUICK_ACTION_BUTTONS = [
  { label: "🚀 Lancer l'évaluation", action: "evaluation" },
  { label: "📋 Voir les procédures", action: "procedures" },
  { label: "💬 Contacter WhatsApp", action: "whatsapp" },
];

export default function AiCopilotWidgetEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const chatMutation = trpc.aiCopilot.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: data.reply,
          sources: data.sources || [],
          feedback: null,
          showActions: true
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, une erreur est survenue. Contactez-nous directement sur WhatsApp au +237 698 104 832.",
          feedback: null,
          showActions: false
        },
      ]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chatMutation.isPending]);

  const sendMessage = (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text.trim(), feedback: null },
    ];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })) });
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (action.whatsapp) {
      window.open(
        `https://wa.me/237698104832?text=${encodeURIComponent(
          "Bonjour, j'aimerais être recontacté(e) par un conseiller 3M Travel pour une évaluation."
        )}`,
        "_blank"
      );
      return;
    }
    if (action.question) sendMessage(action.question);
  };

  const handleFeedback = (messageIndex: number, feedback: "up" | "down") => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex].feedback = feedback;
      }
      return updated;
    });
  };

  const handleQuickActionButton = (action: string) => {
    switch (action) {
      case "evaluation":
        navigate("/evaluation-primaire");
        setIsOpen(false);
        break;
      case "procedures":
        navigate("/procedures");
        setIsOpen(false);
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/237698104832?text=${encodeURIComponent(
            "Bonjour, j'aimerais être recontacté(e) par un conseiller 3M Travel."
          )}`,
          "_blank"
        );
        break;
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <div className="safe-bottom-floating-panel fixed right-4 z-40 md:bottom-6 md:right-24">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setIsOpen(true)}
              aria-label="Ouvrir Aureol, l’assistant IA 3M Travel"
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow hover:scale-110"
            >
              <MessageSquare className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="safe-bottom-floating-panel fixed right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 md:bottom-6 md:right-24"
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <p className="font-bold text-sm leading-tight">
                    Aureol
                  </p>
                  <p className="text-xs text-blue-100 leading-tight">
                    Assistant IA — procédures et visas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le chat"
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {m.content}

                      {/* Sources officielles et téléchargement des guides PDF */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-col gap-1.5">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3 text-blue-600" /> Sources et guides officiels :
                          </p>
                          {m.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors font-medium shadow-sm"
                            >
                              <span className="truncate max-w-[190px]">📖 {src.title}</span>
                              <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold flex-shrink-0">
                                <Download className="w-3 h-3" /> Télécharger PDF
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Feedback buttons pour les messages de l'assistant */}
                    {m.role === "assistant" && m.showActions && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mt-2 ml-2"
                      >
                        <button
                          onClick={() => handleFeedback(i, "up")}
                          className={`p-1 rounded hover:bg-green-100 transition-colors ${
                            m.feedback === "up"
                              ? "bg-green-100 text-green-600"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                          title="Utile"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "down")}
                          className={`p-1 rounded hover:bg-red-100 transition-colors ${
                            m.feedback === "down"
                              ? "bg-red-100 text-red-600"
                              : "text-gray-400 hover:text-red-600"
                          }`}
                          title="Non utile"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}

                    {/* Quick action buttons après la première réponse */}
                    {m.role === "assistant" && i === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 mt-3"
                      >
                        {QUICK_ACTION_BUTTONS.map((btn) => (
                          <button
                            key={btn.action}
                            onClick={() => handleQuickActionButton(btn.action)}
                            className="text-left text-xs bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
                          >
                            {btn.action === "evaluation" && <Zap className="w-3 h-3" />}
                            {btn.action === "procedures" && <FileText className="w-3 h-3" />}
                            {btn.action === "whatsapp" && <Phone className="w-3 h-3" />}
                            {btn.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin text-blue-600" />
                    <span className="text-xs text-gray-400">
                      en train d'écrire...
                    </span>
                  </div>
                </div>
              )}

              {messages.length === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 pt-2"
                >
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      className="text-left text-xs bg-white border border-blue-200 text-blue-700 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors font-medium"
                    >
                      {action.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Saisie */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 p-3 border-t border-gray-100 flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={chatMutation.isPending}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                aria-label="Envoyer"
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
