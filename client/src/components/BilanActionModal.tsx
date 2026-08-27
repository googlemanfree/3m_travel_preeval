import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface BilanActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateEmail: string;
  candidateName: string;
  dossierNumber: string;
}

export function BilanActionModal({
  isOpen,
  onClose,
  candidateEmail,
  candidateName,
  dossierNumber,
}: BilanActionModalProps) {
  const [activeTab, setActiveTab] = useState('question');
  const [question, setQuestion] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');

  // Mutation pour envoyer une question
  const sendQuestionMutation = trpc.candidate.sendBilanQuestion.useMutation({
    onSuccess: () => {
      toast.success('Question envoyée avec succès!');
      setQuestion('');
      onClose();
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de la question');
    },
  });

  // Mutation pour demander un rendez-vous
  const requestAppointmentMutation = trpc.candidate.requestBilanAppointment.useMutation({
    onSuccess: () => {
      toast.success('Demande de rendez-vous envoyée!');
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentReason('');
      onClose();
    },
    onError: () => {
      toast.error('Erreur lors de la demande de rendez-vous');
    },
  });

  const handleSendQuestion = () => {
    if (!question.trim()) {
      toast.error('Veuillez entrer votre question');
      return;
    }

    sendQuestionMutation.mutate({
      candidateEmail,
      dossierNumber,
      question: question.trim(),
    });
  };

  const handleRequestAppointment = () => {
    if (!appointmentDate || !appointmentTime) {
      toast.error('Veuillez sélectionner une date et une heure');
      return;
    }

    requestAppointmentMutation.mutate({
      preferredDate: appointmentDate,
      preferredTime: appointmentTime,
      preferredContact: 'email',
      reason: appointmentReason || 'Discussion du bilan',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suite à votre Bilan</DialogTitle>
          <DialogDescription>
            Posez une question ou demandez un rendez-vous avec nos experts
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="question" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Question
            </TabsTrigger>
            <TabsTrigger value="appointment" className="gap-2">
              <Calendar className="w-4 h-4" />
              Rendez-vous
            </TabsTrigger>
          </TabsList>

          {/* Tab: Poser une Question */}
          <TabsContent value="question" className="space-y-4">
            <div>
              <Label htmlFor="question">Votre Question</Label>
              <Textarea
                id="question"
                placeholder="Posez votre question concernant votre bilan d'évaluation..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-32 resize-none"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>📧 Nous répondrons à : <strong>{candidateEmail}</strong></p>
            </div>

            <Button
              onClick={handleSendQuestion}
              disabled={sendQuestionMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sendQuestionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Envoyer la Question
                </>
              )}
            </Button>
          </TabsContent>

          {/* Tab: Demander un Rendez-vous */}
          <TabsContent value="appointment" className="space-y-4">
            <div>
              <Label htmlFor="appointmentDate">Date Préférée</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="appointmentTime">Heure Préférée</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="appointmentReason">Sujet du Rendez-vous (Optionnel)</Label>
              <Textarea
                id="appointmentReason"
                placeholder="Ex: Discussion du bilan, clarifications sur les recommandations..."
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>

            <div className="text-sm text-gray-500">
              <p>📞 Nous vous contacterons à : <strong>{candidateEmail}</strong></p>
            </div>

            <Button
              onClick={handleRequestAppointment}
              disabled={requestAppointmentMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {requestAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Demander un Rendez-vous
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
