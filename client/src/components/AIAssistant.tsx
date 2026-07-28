import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Phone,
  Globe,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  helpful?: boolean;
}

interface SuggestedQuestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

// ─── Composant : Indicateur de Saisie ───
const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-2 h-2 bg-blue-600 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        className="w-2 h-2 bg-blue-600 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        className="w-2 h-2 bg-blue-600 rounded-full"
      />
    </div>
  );
};

// ─── Composant : Message de Chat ───
const ChatMessage = ({
  message,
  onCopy,
  onHelpful,
}: {
  message: Message;
  onCopy: (content: string) => void;
  onHelpful: (id: string, helpful: boolean) => void;
}) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg ${
          isUser
            ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
            : "bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none"
        } p-4 shadow-sm`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
            <p className="text-xs font-semibold opacity-75">Sources:</p>
            {message.sources.map((source, i) => (
              <p key={i} className="text-xs opacity-75">
                • {source}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-300">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Copier"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHelpful(message.id, true)}
              className={`p-1 rounded transition-colors ${
                message.helpful === true
                  ? "bg-white/30"
                  : "hover:bg-white/20"
              }`}
              title="Utile"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHelpful(message.id, false)}
              className={`p-1 rounded transition-colors ${
                message.helpful === false
                  ? "bg-white/30"
                  : "hover:bg-white/20"
              }`}
              title="Pas utile"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-xs opacity-50 mt-2">
          {message.timestamp.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
};

// ─── Composant : Questions Suggérées ───
const SuggestedQuestions = ({
  questions,
  onSelect,
}: {
  questions: SuggestedQuestion[];
  onSelect: (question: string) => void;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-3"
    >
      <p className="text-sm font-semibold text-gray-700 px-4">
        Questions Fréquentes
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-4">
        {questions.map((q, index) => (
          <motion.button
            key={q.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={index}
            onClick={() => onSelect(q.text)}
            whileHover={{ scale: 1.02 }}
            className="p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-start gap-2">
              <div className="text-blue-600 flex-shrink-0 mt-0.5">
                {q.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">
                  {q.category}
                </p>
                <p className="text-sm text-gray-700 mt-1">{q.text}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Entrée de Message ───
const MessageInput = ({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-gray-200 bg-white">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Posez votre question..."
        disabled={disabled}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="sm"
        className="gap-2"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

// ─── Composant Principal : AIAssistant ───
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Bonjour! 👋 Je suis votre assistant IA spécialisé en visas et voyages. Je peux vous aider avec vos questions sur les procédures de visa, les exigences, les délais, les coûts, et bien plus. Comment puis-je vous aider aujourd'hui?",
      timestamp: new Date(),
      sources: ["Base de données 3M Travel", "Documentation officielle"],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions: SuggestedQuestion[] = [
    {
      id: "1",
      text: "Quels sont les documents requis pour un visa Canada?",
      icon: <FileText className="w-5 h-5" />,
      category: "Documents",
    },
    {
      id: "2",
      text: "Quel est le délai de traitement pour un visa Schengen?",
      icon: <Calendar className="w-5 h-5" />,
      category: "Délais",
    },
    {
      id: "3",
      text: "Combien coûte une demande de visa pour la France?",
      icon: <DollarSign className="w-5 h-5" />,
      category: "Coûts",
    },
    {
      id: "4",
      text: "Quelles sont les conditions d'éligibilité pour étudier au Canada?",
      icon: <Globe className="w-5 h-5" />,
      category: "Éligibilité",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        canada: `Pour un visa Canada, les documents requis incluent:
        
• Passeport valide (au moins 6 mois)
• Formulaire de demande complété
• Preuve de ressources financières
• Lettre d'acceptation (si études)
• Preuve de résidence
• Certificat médical
• Antécédents judiciaires

Le délai de traitement est généralement de 4-6 semaines.`,

        schengen: `Le délai de traitement pour un visa Schengen est généralement:

• 15 jours ouvrables (délai standard)
• Jusqu'à 60 jours (cas complexes)
• Accélération possible (3-5 jours)

Les délais peuvent varier selon le consulat et la saison.`,

        france: `Le coût d'une demande de visa pour la France est:

• Visa court séjour: 80 EUR
• Visa long séjour: 99 EUR
• Enfants 6-12 ans: 40 EUR
• Enfants moins de 6 ans: Gratuit

Frais agence 3M: À partir de 65,000 XAF`,

        canada_etude: `Conditions d'éligibilité pour étudier au Canada:

• Acceptation d'une institution canadienne
• Preuve de ressources financières (CAD 20,000+)
• Certificat médical
• Antécédents judiciaires vierges
• Lien avec le pays d'origine
• Maîtrise de l'anglais/français

Délai: 4-6 semaines`,
      };

      let response = `Je n'ai pas trouvé d'information spécifique. Pouvez-vous reformuler votre question ou me contacter pour une consultation personnalisée?`;

      if (
        content.toLowerCase().includes("canada") &&
        content.toLowerCase().includes("document")
      ) {
        response = aiResponses.canada;
      } else if (
        content.toLowerCase().includes("schengen") &&
        content.toLowerCase().includes("délai")
      ) {
        response = aiResponses.schengen;
      } else if (
        content.toLowerCase().includes("france") &&
        content.toLowerCase().includes("coût")
      ) {
        response = aiResponses.france;
      } else if (
        content.toLowerCase().includes("canada") &&
        content.toLowerCase().includes("étude")
      ) {
        response = aiResponses.canada_etude;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        sources: ["Base de données 3M Travel", "Documentation officielle"],
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("Copié!");
  };

  const handleHelpfulFeedback = (id: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, helpful } : msg
      )
    );
  };

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">Assistant IA 3M</h3>
            <p className="text-xs opacity-90">Toujours disponible</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={handleSendMessage}
          />
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCopy={handleCopyMessage}
            onHelpful={handleHelpfulFeedback}
          />
        ))}

        {isLoading && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="flex justify-start mb-4"
          >
            <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-600">
          Besoin d'aide? <button className="text-blue-600 hover:underline">Contacter support</button>
        </p>
      </div>
    </motion.div>
  );
}
