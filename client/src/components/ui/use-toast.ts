import * as React from "react";
import { toast as sonnerToast } from "sonner";

import type { ToastActionElement, ToastProps } from "./toast";

/**
 * API `useToast` / `toast` conservée pour les composants qui l'utilisent déjà, mais l'affichage passe par `sonner`.
 *
 * L'application ne monte que le <Toaster /> de sonner (App.tsx). L'ancien <Toaster /> de Radix n'est monté nulle part :
 * avec l'implémentation précédente, les confirmations et les erreurs émises par ces composants (demande 3M Booking,
 * suivi de vols, CNI/passeport, confidentialité…) n'apparaissaient jamais à l'écran.
 */
type ToastInput = Omit<ToastProps, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
};

function toast({ title, description, variant, duration }: ToastInput) {
  const message = title ?? description;
  const options = { description: title ? description : undefined, duration };
  const id = variant === "destructive" ? sonnerToast.error(message, options) : sonnerToast(message, options);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToastInput) => {
      const nextMessage = next.title ?? next.description;
      sonnerToast(nextMessage, { id, description: next.title ? next.description : undefined, duration: next.duration });
    },
  };
}

function useToast() {
  return {
    toasts: [] as Array<ToastInput & { id: string }>,
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
