import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface CommentsSectionProps {
  dossierNumber: string;
  email: string;
  fullName: string;
  isAdmin?: boolean;
}

export function CommentsSection({
  dossierNumber,
  email,
  fullName,
  isAdmin = false,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isQuestion, setIsQuestion] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les commentaires
  const { data: commentsData, isLoading, refetch } = trpc.evaluationComments.getComments.useQuery(
    {
      dossierNumber,
      email,
    },
    {
      enabled: !!dossierNumber && !!email,
    }
  );

  // Poster un commentaire
  const postCommentMutation = trpc.evaluationComments.postComment.useMutation({
    onSuccess: () => {
      toast.success("Votre commentaire a été envoyé avec succès");
      setNewComment("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'envoi du commentaire");
    },
  });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    setIsSubmitting(true);
    try {
      await postCommentMutation.mutateAsync({
        dossierNumber,
        email,
        fullName,
        content: newComment,
        isQuestion,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const comments = commentsData?.comments || [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Questions et Commentaires
        </CardTitle>
        <CardDescription>
          Posez vos questions sur votre bilan d'évaluation. Nos conseillers vous répondront rapidement.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulaire de nouveau commentaire */}
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <Button
              variant={isQuestion ? "default" : "outline"}
              size="sm"
              onClick={() => setIsQuestion(true)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Question
            </Button>
            <Button
              variant={!isQuestion ? "default" : "outline"}
              size="sm"
              onClick={() => setIsQuestion(false)}
              className="flex-1"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Commentaire
            </Button>
          </div>

          <Textarea
            placeholder={
              isQuestion
                ? "Posez votre question sur votre bilan..."
                : "Écrivez votre commentaire..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />

          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </div>

        {/* Liste des commentaires */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun commentaire pour le moment.</p>
            <p className="text-sm">Soyez le premier à poser une question !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                {/* Commentaire principal */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{comment.authorName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {comment.isQuestion && (
                        <Badge variant={comment.isResolved ? "default" : "secondary"}>
                          {comment.isResolved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Résolu
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              En attente
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>

                {/* Réponses */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-green-200 space-y-3">
                    {comment.replies.map((reply: any) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-green-700">{reply.authorName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(reply.createdAt).toLocaleDateString("fr-FR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-50">
                            Réponse
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-green-50 p-2 rounded">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
