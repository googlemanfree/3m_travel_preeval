import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Phone, Sparkles, Plane, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SmartFlightAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Bonjour ! Je suis votre assistant virtuel 3M Travel. Comment puis-je vous aider dans votre recherche de vol, choix de siège ou réservation aujourd\'hui ?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "Comment réserver un vol ?",
    "Quelles sont les franchises bagages ?",
    "Comment modifier mon siège ?",
    "Contacter un conseiller"
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text, time: userTime }]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = "Je peux vous accompagner pas à pas dans votre réservation de vol. Rendez-vous sur notre page Billets pour comparer les offres, ou connectez-vous à votre espace client pour suivre vos dossiers.";
      
      const lower = text.toLowerCase();
      if (lower.includes('réserver') || lower.includes('vol') || lower.includes('billet')) {
        botReply = "Pour réserver un vol, accédez à la rubrique « Billets » dans le menu supérieur. Vous pourrez y sélectionner votre trajet, choisir votre classe de cabine et vos options de bagages.";
      } else if (lower.includes('bagage') || lower.includes('valise')) {
        botReply = "Chaque billet standard inclut un bagage cabine et un accessoire. Vous pouvez ajouter des bagages en soute supplémentaires directement lors du récapitulatif de votre réservation.";
      } else if (lower.includes('siège') || lower.includes('place')) {
        botReply = "Notre carte interactive de cabine vous permet de choisir votre siège exact (hublot, couloir, issue de secours) lors de la validation de votre billet.";
      } else if (lower.includes('conseiller') || lower.includes('contact') || lower.includes('whatsapp')) {
        botReply = "Nos conseillers experts sont joignables directement sur WhatsApp au +237 698 10 48 32 ou par e-mail à hello@3mtravelagency.com pour vous assister.";
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { sender: 'bot', text: botReply, time: botTime }]);
      setIsTyping(false);
    }, 750);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/25 cursor-pointer group"
            aria-label="Assistant virtuel de vol"
          >
            <Plane className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
            <span className="absolute right-full mr-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Besoin d'aide pour votre vol ? ✈️
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-[360px] max-w-[calc(100vw-32px)] overflow-hidden flex flex-col h-[500px]"
          >
            {/* En-tête du chat */}
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Assistant 3M Travel</h4>
                  <p className="text-[11px] text-blue-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> En ligne • Réservations & Vols
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps des messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#1E3A8A] text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className={`block text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-xs shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions rapides */}
            <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#1E3A8A] dark:text-blue-200 text-[11px] font-medium px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700/50 transition-colors shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Zone de saisie */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
              <input
                type="text"
                placeholder="Posez votre question sur un vol..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
              <Button
                onClick={() => handleSend()}
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl px-3.5 py-2 h-auto text-xs font-bold shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
