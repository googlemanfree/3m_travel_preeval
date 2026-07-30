import React, { useState, useEffect, useRef } from "react";
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
  History,
  Trash2,
  Search,
  Clock,
  MoreVertical,
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

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
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

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.05 },
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
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>

        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-300">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copier"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onHelpful(message.id, true)}
              className={`p-1 rounded transition-colors ${
                message.helpful === true
                  ? "bg-green-100 text-green-600"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Utile"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onHelpful(message.id, false)}
              className={`p-1 rounded transition-colors ${
                message.helpful === false
                  ? "bg-red-100 text-red-600"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Pas utile"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
          <span className="text-xs font-bold">U</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Composant : Suggestion Rapide ───
const QuickSuggestion = ({
  suggestion,
  onClick,
  index,
}: {
  suggestion: SuggestedQuestion;
  onClick: (text: string) => void;
  index: number;
}) => {
  return (
    <motion.button
      initial="hidden"
      animate="visible"
      variants={slideIn}
      custom={index}
      onClick={() => onClick(suggestion.text)}
      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
    >
      <div className="text-blue-600 group-hover:scale-110 transition-transform">
        {suggestion.icon}
      </div>
      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
        {suggestion.text}
      </span>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors ml-auto" />
    </motion.button>
  );
};

// ─── Composant : Élément d'Historique ───
const HistoryItem = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  index,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  index: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideIn}
      custom={index}
      className={`p-3 rounded-lg cursor-pointer group transition-all ${
        isActive
          ? "bg-blue-100 border-2 border-blue-600"
          : "bg-white border border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm truncate ${
            isActive ? "text-blue-900" : "text-gray-900"
          }`}>
            {conversation.title}
          </h4>
          <p className={`text-xs mt-1 ${
            isActive ? "text-blue-700" : "text-gray-600"
          }`}>
            {conversation.messages.length} messages
          </p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            isActive ? "text-blue-600" : "text-gray-500"
          }`}>
            <Clock className="w-3 h-3" />
            {new Date(conversation.updatedAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation.id);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Composant Principal : AIAssistantEnhanced ───
export default function AIAssistantEnhanced() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: "1",
    title: "Nouvelle Conversation",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions: SuggestedQuestion[] = [
    {
      id: "1",
      text: "Quels sont les documents requis pour un visa étudiant?",
      icon: <FileText className="w-5 h-5" />,
      category: "documents",
    },
    {
      id: "2",
      text: "Combien coûte un visa pour la France?",
      icon: <DollarSign className="w-5 h-5" />,
      category: "pricing",
    },
    {
      id: "3",
      text: "Quel est le délai de traitement d'un visa?",
      icon: <Clock className="w-5 h-5" />,
      category: "timeline",
    },
    {
      id: "4",
      text: "Comment prendre rendez-vous à l'ambassade?",
      icon: <Calendar className="w-5 h-5" />,
      category: "appointment",
    },
    {
      id: "5",
      text: "Quels pays puis-je visiter avec un visa Schengen?",
      icon: <Globe className="w-5 h-5" />,
      category: "schengen",
    },
    {
      id: "6",
      text: "Que faire si mon visa est rejeté?",
      icon: <AlertCircle className="w-5 h-5" />,
      category: "rejection",
    },
  ];

  // Charger l'historique depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai_conversations");
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0) {
        setCurrentConversation(parsed[0]);
      }
    }
  }, []);

  // Sauvegarder l'historique dans localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("ai_conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation.messages]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
    };

    setCurrentConversation(updatedConversation);
    setInputValue("");
    setIsLoading(true);

    // Simuler une réponse IA
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Merci pour votre question: "${text}". Je suis l'assistant IA de 3M Travel & Services. Je peux vous aider avec des informations sur les visas, les procédures d'immigration, les documents requis, et bien plus encore. N'hésitez pas à poser d'autres questions!`,
        timestamp: new Date(),
        sources: ["Base de données 3M Travel"],
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        title: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
      };

      setCurrentConversation(finalConversation);
      setIsLoading(false);

      // Sauvegarder la conversation
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === finalConversation.id);
        if (existing) {
          return prev.map((c) =>
            c.id === finalConversation.id ? finalConversation : c
          );
        }
        return [finalConversation, ...prev];
      });
    }, 1500);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Nouvelle Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentConversation(newConversation);
    setShowHistory(false);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversation.id === id) {
      handleNewConversation();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié!");
  };

  const handleHelpful = (messageId: string, helpful: boolean) => {
    const updatedMessages = currentConversation.messages.map((m) =>
      m.id === messageId ? { ...m, helpful } : m
    );
    setCurrentConversation({
      ...currentConversation,
      messages: updatedMessages,
    });
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-40 group"
        title="Ouvrir l'assistant IA"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-blue-400 opacity-20"
        />
        <Sparkles className="w-6 h-6 relative z-10" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed bottom-6 right-6 w-96 h-screen max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <h3 className="font-bold">Assistant IA</h3>
            <p className="text-xs text-blue-100">3M Travel & Services</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            title="Historique"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-5 h-5" />
            ) : (
              <Minimize2 className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConversation.messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <Sparkles className="w-12 h-12 text-blue-300 mb-3" />
                    <h4 className="font-bold text-gray-900 mb-2">
                      Bienvenue!
                    </h4>
                    <p className="text-sm text-gray-600 mb-6">
                      Je suis votre assistant IA spécialisé dans les visas et
                      l'immigration. Comment puis-je vous aider?
                    </p>
                    <div className="space-y-2 w-full">
                      {suggestedQuestions.slice(0, 3).map((q, i) => (
                        <QuickSuggestion
                          key={q.id}
                          suggestion={q}
                          onClick={handleSendMessage}
                          index={i}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {currentConversation.messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onCopy={handleCopy}
                        onHelpful={handleHelpful}
                      />
                    ))}
                    {isLoading && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
                          <TypingIndicator />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Suggestions (si pas de messages) */}
              {currentConversation.messages.length === 0 && (
                <div className="px-4 pb-4 space-y-2">
                  {suggestedQuestions.slice(3).map((q, i) => (
                    <QuickSuggestion
                      key={q.id}
                      suggestion={q}
                      onClick={handleSendMessage}
                      index={i + 3}
                    />
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-200 p-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Posez votre question..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewConversation}
                  className="w-full gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Nouvelle Conversation
                </Button>
              </div>
            </div>

            {/* Sidebar Historique */}
            {showHistory && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-64 border-l border-gray-200 bg-gray-50 flex flex-col"
              >
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3">Historique</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredConversations.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Aucune conversation
                    </p>
                  ) : (
                    filteredConversations.map((conv, i) => (
                      <HistoryItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === currentConversation.id}
                        onClick={() => {
                          setCurrentConversation(conv);
                          setShowHistory(false);
                        }}
                        onDelete={handleDeleteConversation}
                        index={i}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
