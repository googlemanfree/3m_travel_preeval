import React, { useState } from "react";
import { Bot, Send, User, Sparkles, HelpCircle, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function AureolAssistantChat() {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'aureol'; text: string; time: string }>>([
    {
      sender: 'aureol',
      text: "Bonjour ! Je suis Aureol, votre assistant virtuel intelligent chez 3M Travel & Services. Je suis là pour répondre à toutes vos questions sur nos procédures (Canada, Luxembourg, e-Visas, vols, hôtels, assurances). Comment puis-je vous aider aujourd'hui ?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessageMutation = {
    mutateAsync: async ({ message }: { message: string }) => {
      // Fallback simulation intelligente si le routeur chatbot n'est pas enregistré
      const q = message.toLowerCase();
      if (q.includes('canada') || q.includes('rp')) {
        return { reply: "Pour le Canada, nous évaluons votre profil sur la base de vos diplômes, tests linguistiques et expérience professionnelle. Vous pouvez lancer votre évaluation gratuite depuis le menu principal !" };
      }
      if (q.includes('luxembourg') || q.includes('visa travail')) {
        return { reply: "Le Luxembourg est l'une de nos destinations phares pour les procédures de visa travail. Nous assurons le traitement, la traduction et la soumission vers nos agences partenaires en 48h." };
      }
      if (q.includes('e-visa') || q.includes('evisa')) {
        return { reply: "Nos e-Visas couvrent plus de 50 destinations mondiales. Rendez-vous sur la page e-Visa, sélectionnez votre pays de destination et lancez votre procédure ciblée en un clic." };
      }
      if (q.includes('paiement') || q.includes('frais')) {
        return { reply: "Les frais d'ouverture de dossier s'élèvent à 65 000 XAF. Vous pouvez régler par Orange Money ou directement en agence, puis téléverser votre reçu pour validation." };
      }
      return `J'ai bien pris en compte votre question : "${message}". Pour toute procédure spécifique, nos conseillers en agence restent à votre disposition pour un accompagnement sur-mesure. N'hésitez pas à déposer vos pièces dans votre espace personnel !`;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeNow }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendMessageMutation.mutateAsync({ message: userText });
      const replyText = typeof res === 'object' && res !== null && 'reply' in res ? (res as any).reply : String(res);
      setMessages(prev => [...prev, { sender: 'aureol', text: replyText || "Réponse reçue.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'aureol', text: "Désolé, une erreur technique est survenue. Veuillez réessayer dans quelques instants.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <Card className="border-blue-100 dark:border-slate-800 shadow-lg bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950">
      <CardHeader className="border-b bg-blue-600 text-white rounded-t-lg py-4 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              Aureol AI — Assistant 3M Travel <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </CardTitle>
            <p className="text-xs text-blue-100">Réponses instantanées sur vos procédures de mobilité</p>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ● En ligne
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Messages Container */}
        <div className="h-[380px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <span className={`block text-[10px] mt-1 text-right ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-500 rounded-tl-none">
                Aureol réfléchit à votre réponse...
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions Suggestions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => handleQuickQuestion("Comment faire évaluer mon profil pour le Canada ?")} className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 transition">
            🇨🇦 Procédure Canada
          </button>
          <button onClick={() => handleQuickQuestion("Quels sont les documents pour le Luxembourg ?")} className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 transition">
            🇱🇺 Visa travail Luxembourg
          </button>
          <button onClick={() => handleQuickQuestion("Comment payer mes frais d'ouverture de dossier ?")} className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 transition">
            💳 Frais et Paiement
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex gap-2 pt-1">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Posez votre question à Aureol..."
            className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
