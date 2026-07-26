/**
 * Widget Flottant - Assistant IA Spécialisé
 * Aide les visiteurs à trouver rapidement des informations sur les services 3M Travel
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

// Design system colors
const designSystem = {
  colors: {
    primary: {
      royal: '#1E3A8A',
      mid: '#2563EB',
    },
  },
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
  timestamp: Date;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Appels tRPC
  const chatMutation = (trpc as any).aiAssistant?.chat?.useMutation?.() || { mutateAsync: async () => ({ message: 'Service indisponible', confidence: 0 }) };

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur l'input quand le widget s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Bonjour! 👋 Je suis l\'assistant IA de 3M Travel & Services. Je suis spécialisé dans les services de visa et d\'immigration. Comment puis-je vous aider aujourd\'hui?',
        suggestedActions: [
          'Informations sur les visas',
          'Destinations disponibles',
          'Évaluation d\'éligibilité',
        ],
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  /**
   * Envoie un message à l'assistant IA
   */
  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();

    if (!messageText) return;

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Appeler l'API IA
      const response = await chatMutation.mutateAsync({
        message: messageText,
        sessionId,
      });

      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        suggestedActions: response.suggestedActions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la communication avec l\'assistant');

      // Ajouter un message d'erreur
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gère la touche Entrée
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-[#1E3A8A] hover:bg-[#152E5F]'
        } text-white`}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
        style={{
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Widget de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              height: '600px',
              boxShadow: '0 20px 50px -12px rgba(30, 58, 138, 0.25)',
            }}
          >
            {/* Header */}
            <div
              className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-4 flex items-center justify-between"
              style={{
                background: `linear-gradient(135deg, ${designSystem.colors.primary.royal} 0%, ${designSystem.colors.primary.mid} 100%)`,
              }}
            >
              <div>
                <h3 className="font-bold text-lg">3M Travel Assistant</h3>
                <p className="text-sm text-blue-100">Spécialisé en visa & immigration</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[#1E3A8A] text-white rounded-br-none'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>

                    {/* Actions suggérées */}
                    {message.suggestedActions && message.role === 'assistant' && (
                      <div className="mt-3 space-y-2">
                        {message.suggestedActions.map((action, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSendMessage(action)}
                            className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded transition-colors"
                          >
                            {action}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Indicateur de chargement */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                    <Loader size={16} className="animate-spin" />
                    <span className="text-sm">L\'assistant réfléchit...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-[#1E3A8A] hover:bg-[#152E5F] text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Envoyer"
                >
                  <Send size={20} />
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Conseil: Posez des questions sur les visas, destinations, ou éligibilité
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAssistantWidget;
