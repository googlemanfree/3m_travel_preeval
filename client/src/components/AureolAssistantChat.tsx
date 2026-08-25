import React, { useEffect, useState } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type ChatMessage = { sender: "user" | "aureol"; text: string; time: string };

export function AureolAssistantChat() {
  const { language } = useLanguage();
  const t = (fr: string, en: string) => language === "en" ? en : fr;
  const time = () => new Date().toLocaleTimeString(language === "en" ? "en-CA" : "fr-FR", { hour: "2-digit", minute: "2-digit" });
  const greeting = t(
    "Bonjour ! Je suis Aureol, votre guide 3M Travel & Services. Je peux vous aider à repérer les pages, étapes et ressources liées à votre projet de mobilité. Comment puis-je vous aider ?",
    "Hello! I am Aureol, your 3M Travel & Services guide. I can help you find the pages, steps and resources related to your mobility project. How can I help?",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: "aureol", text: greeting, time: time() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages((current) => current.length === 1 && current[0].sender === "aureol" ? [{ sender: "aureol", text: greeting, time: time() }] : current);
  }, [language]);

  const replyTo = async (message: string) => {
    const q = message.toLowerCase();
    if (q.includes("canada")) return t("Pour le Canada, commencez par l’évaluation gratuite afin d’identifier les étapes adaptées à votre projet. Les documents demandés dépendent de la procédure retenue.", "For Canada, start with the free assessment to identify steps suited to your project. Required documents depend on the selected procedure.");
    if (q.includes("luxembourg") || q.includes("work visa") || q.includes("visa travail")) return t("Pour le Luxembourg, consultez la procédure correspondante et préparez vos documents selon votre situation. Toute sélection ou décision externe reste soumise à validation humaine.", "For Luxembourg, consult the relevant procedure and prepare documents according to your situation. Any selection or external decision remains subject to human review.");
    if (q.includes("e-visa") || q.includes("evisa")) return t("Les exigences e-Visa varient selon la destination. Ouvrez la page e-Visa, choisissez le pays concerné et renseignez le formulaire adapté.", "e-Visa requirements vary by destination. Open the e-Visa page, select the relevant country and complete the appropriate form.");
    return t("Votre question a été enregistrée dans cette conversation. Pour une procédure précise, utilisez les pages de service ou contactez l’agence afin qu’un conseiller examine votre situation.", "Your question has been recorded in this conversation. For a specific procedure, use the service pages or contact the agency so that an adviser can review your situation.");
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((current) => [...current, { sender: "user", text: userText, time: time() }]);
    setInput(""); setLoading(true);
    try {
      const reply = await replyTo(userText);
      setMessages((current) => [...current, { sender: "aureol", text: reply, time: time() }]);
    }
    catch { setMessages((current) => [...current, { sender: "aureol", text: t("Une difficulté technique est survenue. Réessayez dans quelques instants.", "A technical issue occurred. Please try again shortly."), time: time() }]); }
    finally { setLoading(false); }
  };

  const quickQuestions = language === "en"
    ? [{ label: "Canada procedure", value: "How do I assess my profile for Canada?" }, { label: "Luxembourg work visa", value: "Which documents are needed for Luxembourg?" }, { label: "Fees and payment", value: "How can I ask about case-opening fees?" }]
    : [{ label: "Procédure Canada", value: "Comment faire évaluer mon profil pour le Canada ?" }, { label: "Visa travail Luxembourg", value: "Quels sont les documents pour le Luxembourg ?" }, { label: "Frais et paiement", value: "Comment demander des informations sur les frais d'ouverture de dossier ?" }];

  return <Card className="border-blue-100 dark:border-slate-800 shadow-lg bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950"><CardHeader className="border-b bg-blue-600 text-white rounded-t-lg py-4 px-6 flex flex-row items-center justify-between"><div className="flex items-center space-x-3"><div className="p-2 bg-white/20 rounded-full"><Bot className="w-6 h-6 text-white" /></div><div><CardTitle className="text-lg font-bold flex items-center gap-2">Aureol — {t("Assistant 3M Travel", "3M Travel assistant")} <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" /></CardTitle><p className="text-xs text-blue-100">{t("Guidage instantané vers vos procédures de mobilité", "Instant guidance to your mobility procedures")}</p></div></div><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">● {t("En ligne", "Online")}</span></CardHeader><CardContent className="p-4 space-y-4"><div className="h-[380px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">{messages.map((message, index) => <div key={`${message.time}-${index}`} className={`flex items-start gap-2.5 ${message.sender === "user" ? "flex-row-reverse" : ""}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>{message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</div><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none"}`}><p className="whitespace-pre-wrap leading-relaxed">{message.text}</p><span className={`block text-[10px] mt-1 text-right ${message.sender === "user" ? "text-blue-200" : "text-slate-400"}`}>{message.time}</span></div></div>)}{loading && <div className="flex items-start gap-2.5"><div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Bot className="w-4 h-4 animate-spin" /></div><div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-500 rounded-tl-none">{t("Aureol prépare une réponse…", "Aureol is preparing a response…")}</div></div>}</div><div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800" aria-label={t("Questions suggérées", "Suggested questions")}>{quickQuestions.map((item) => <button key={item.label} type="button" onClick={() => setInput(item.value)} className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 transition">{item.label}</button>)}</div><form onSubmit={handleSend} className="flex gap-2 pt-1"><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("Posez votre question à Aureol…", "Ask Aureol a question…")} aria-label={t("Votre question à Aureol", "Your question for Aureol")} className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" /><Button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4" aria-label={t("Envoyer votre question", "Send your question")}><Send className="w-4 h-4" /></Button></form></CardContent></Card>;
}
