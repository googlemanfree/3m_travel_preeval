import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface HeartbeatJob {
  taskUid: string;
  name: string;
  userId: string;
  description: string;
  cronExpression: string;
  callbackPath: string;
  callbackMethod: string;
  callbackPayload: string;
  isEnable: boolean;
  createdAt?: string | null;
  lastExecutedAt?: string | null;
  nextExecutionAt?: string | null;
}

export default function HeartbeatJobManager() {
  const [jobs, setJobs] = useState<HeartbeatJob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [cronExpression, setCronExpression] = useState('0 0 8 * * *'); // 8h UTC par défaut
  const [description, setDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('daily-8am');

  const listJobs = trpc.heartbeat.listJobs.useQuery();
  const createJob = trpc.heartbeat.createEvaluationJob.useMutation();
  const deleteJob = trpc.heartbeat.deleteJob.useMutation();

  // Charger les jobs existants
  useEffect(() => {
    if (listJobs.data?.jobs) {
      setJobs(listJobs.data.jobs as unknown as HeartbeatJob[]);
    }
  }, [listJobs.data]);

  // Presets de cron
  const cronPresets = {
    'daily-8am': { cron: '0 0 8 * * *', label: 'Tous les jours à 8h UTC' },
    'daily-9am': { cron: '0 0 9 * * *', label: 'Tous les jours à 9h UTC' },
    'daily-noon': { cron: '0 0 12 * * *', label: 'Tous les jours à midi UTC' },
    'daily-6pm': { cron: '0 0 18 * * *', label: 'Tous les jours à 18h UTC' },
    'twice-daily': { cron: '0 0 8,18 * * *', label: 'Deux fois par jour (8h et 18h UTC)' },
    'weekdays-8am': { cron: '0 0 8 * * 1-5', label: 'Jours de semaine à 8h UTC' },
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    setCronExpression(cronPresets[preset as keyof typeof cronPresets].cron);
  };

  const handleCreateJob = async () => {
    if (!cronExpression.trim()) {
      toast.error('Veuillez entrer une expression cron valide');
      return;
    }

    try {
      setIsCreating(true);
      const result = await createJob.mutateAsync({
        cronExpression,
        description: description || 'Job d\'évaluation automatique',
      });

      toast.success('Job créé avec succès!');
      
      // Recharger les jobs
      listJobs.refetch();
      
      // Réinitialiser le formulaire
      setCronExpression('0 0 8 * * *');
      setDescription('');
      setSelectedPreset('daily-8am');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du job';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteJob = async (taskUid: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce job?')) return;

    try {
      await deleteJob.mutateAsync({ taskUid });
      toast.success('Job supprimé avec succès!');
      listJobs.refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression du job';
      toast.error(msg);
    }
  };

  const formatNextExecution = (nextExecution: string | null | undefined) => {
    if (!nextExecution) return 'Non planifié';
    try {
      const date = new Date(nextExecution);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      });
    } catch {
      return nextExecution;
    }
  };

  const formatLastExecution = (lastExecution: string | null | undefined) => {
    if (!lastExecution) return 'Jamais exécuté';
    try {
      const date = new Date(lastExecution);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
    } catch {
      return lastExecution;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          Gestion des Jobs Heartbeat
        </h2>
        <p className="text-gray-600 mt-1">
          Configurez les tâches automatiques d'évaluation des dossiers
        </p>
      </div>

      {/* Formulaire de création */}
      <Card className="p-6 border-2 border-blue-100 bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau job</h3>
        
        <div className="space-y-4">
          {/* Preset de cron */}
          <div>
            <Label htmlFor="preset">Sélectionner un preset</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger id="preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cronPresets).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expression cron personnalisée */}
          <div>
            <Label htmlFor="cron">Expression Cron (6 champs: sec min hour dom mon dow)</Label>
            <Input
              id="cron"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 0 8 * * *"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ex: "0 0 8 * * *" = tous les jours à 8h UTC
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du job"
            />
          </div>

          {/* Bouton de création */}
          <Button
            onClick={handleCreateJob}
            disabled={isCreating || createJob.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          >
            {isCreating || createJob.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Créer le job
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Liste des jobs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs existants</h3>
        
        {listJobs.isLoading ? (
          <Card className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-2">Chargement des jobs...</p>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aucun job créé pour le moment</p>
          </Card>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.taskUid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`p-4 border-l-4 ${job.isEnable ? 'border-l-green-500 bg-green-50' : 'border-l-gray-300 bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {job.isEnable ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400" />
                          )}
                          <h4 className="font-semibold text-gray-900">{job.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${job.isEnable ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                            {job.isEnable ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        
                        {job.description && (
                          <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                          <div>
                            <p className="font-semibold">Expression Cron</p>
                            <p className="font-mono text-gray-700">{job.cronExpression}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Endpoint</p>
                            <p className="font-mono text-gray-700">{job.callbackPath}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Prochaine exécution</p>
                            <p className="text-gray-700">{formatNextExecution(job.nextExecutionAt)}</p>
                          </div>
                          <div>
                            <p className="font-semibold">Dernière exécution</p>
                            <p className="text-gray-700">{formatLastExecution(job.lastExecutedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bouton de suppression */}
                      <Button
                        onClick={() => handleDeleteJob(job.taskUid)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteJob.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Information */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Info :</strong> Les jobs Heartbeat exécutent automatiquement l'endpoint <code className="font-mono bg-blue-100 px-1 rounded">/api/scheduled/evaluation-job</code> selon la planification définie. Les rapports d'évaluation sont générés et envoyés par email aux candidats.
        </p>
      </Card>
    </div>
  );
}
