import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AIAssistantProps {
  jobTitle: string;
  company: string;
  description: string;
  onAccept: (improvedDescription: string) => void;
  language?: 'fr' | 'en';
}

export default function AIAssistant({
  jobTitle,
  company,
  description,
  onAccept,
  language = 'fr',
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const suggestMutation = trpc.cvAI.suggestExperienceImprovement.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        toast.error(data.error || 'Erreur lors de la génération des suggestions');
      }
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const handleSuggest = async () => {
    if (!description.trim()) {
      toast.error(language === 'fr' ? 'Veuillez entrer une description' : 'Please enter a description');
      return;
    }
    await suggestMutation.mutateAsync({
      jobTitle,
      company,
      description,
      language,
    });
  };

  const handleAccept = () => {
    if (suggestions?.improvedDescription) {
      onAccept(suggestions.improvedDescription);
      setIsOpen(false);
      setSuggestions(null);
      toast.success(language === 'fr' ? 'Description améliorée acceptée' : 'Improved description accepted');
    }
  };

  const handleReject = () => {
    setSuggestions(null);
    toast.info(language === 'fr' ? 'Suggestions annulées' : 'Suggestions cancelled');
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
          >
            <Sparkles size={16} />
            {language === 'fr' ? '💡 Améliorer avec l\'IA' : '💡 Improve with AI'}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="space-y-3">
                {!suggestions ? (
                  <>
                    <p className="text-sm text-gray-600">
                      {language === 'fr'
                        ? 'L\'IA analysera votre description et suggérera des améliorations.'
                        : 'AI will analyze your description and suggest improvements.'}
                    </p>
                    <Button
                      onClick={handleSuggest}
                      disabled={suggestMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg"
                    >
                      {suggestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {language === 'fr' ? 'Générer des suggestions' : 'Generate suggestions'}
                    </Button>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="outline"
                      className="w-full"
                    >
                      {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">
                        {language === 'fr' ? 'Description améliorée' : 'Improved description'}
                      </h4>
                      <p className="text-sm bg-white p-3 rounded-lg border border-purple-200">
                        {suggestions.improvedDescription}
                      </p>
                    </div>

                    {suggestions.keyPoints && suggestions.keyPoints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">
                          {language === 'fr' ? 'Points clés' : 'Key points'}
                        </h4>
                        <ul className="text-sm space-y-1">
                          {suggestions.keyPoints.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-600 font-bold">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleAccept}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} className="mr-2" />
                        {language === 'fr' ? 'Accepter' : 'Accept'}
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        className="flex-1"
                      >
                        <X size={16} className="mr-2" />
                        {language === 'fr' ? 'Rejeter' : 'Reject'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
