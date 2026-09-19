import React from "react";
import { motion } from "framer-motion";
import { Circle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileCompletion } from "@shared/profileCompletion";

type ProfileCompletionBarProps = {
  completion: ProfileCompletion;
  onEditClick?: () => void;
};

export function ProfileCompletionBar({ completion, onEditClick }: ProfileCompletionBarProps) {
  if (completion.percent >= 100) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="profile-completion-title"
      className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-600 p-2.5 text-white" aria-hidden="true"><UserRound className="h-5 w-5" /></span>
          <div>
            <h2 id="profile-completion-title" className="text-lg font-black text-blue-950">Complétez votre profil</h2>
            <p className="text-sm text-blue-800">
              {completion.filled} étape{completion.filled > 1 ? "s" : ""} sur {completion.total} terminée{completion.filled > 1 ? "s" : ""} : un profil complet accélère le traitement de votre dossier.
            </p>
          </div>
        </div>
        {onEditClick && (
          <Button type="button" onClick={onEditClick} className="bg-blue-700 text-white hover:bg-blue-800">
            Compléter mon profil
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-white/80 ring-1 ring-blue-100"
          role="progressbar"
          aria-label="Progression de votre profil"
          aria-valuenow={completion.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion.percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
          />
        </div>
        <span className="w-12 text-right text-sm font-black text-blue-900">{completion.percent} %</span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Éléments restant à compléter">
        {completion.missing.map((field) => (
          <li key={field.key} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-blue-100">
            <Circle className="h-3 w-3 text-blue-400" aria-hidden="true" />
            {field.label}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
