import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook useAutoSaveForm
 * 
 * Gère la sauvegarde automatique des données de formulaire dans localStorage
 * avec détection de changements, indicateurs visuels et gestion des erreurs
 */

export interface AutoSaveOptions {
  storageKey: string;
  saveInterval?: number; // en millisecondes (défaut: 30000ms = 30s)
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasSavedData: boolean;
}

export const useAutoSaveForm = <T extends Record<string, any>>(
  formData: T,
  options: AutoSaveOptions
) => {
  const {
    storageKey,
    saveInterval = 30000,
    onSave,
    onRestore,
    onError,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    hasSavedData: false,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);

  // Sauvegarder les données dans localStorage
  const saveToLocalStorage = useCallback(
    (data: T) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));

        const serialized = JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
        });

        localStorage.setItem(storageKey, serialized);
        lastSavedDataRef.current = data;

        setState((prev) => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
        }));

        onSave?.(data);

        // Log pour debugging
        console.log(`[AutoSave] Formulaire sauvegardé: ${storageKey}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[AutoSave] Erreur lors de la sauvegarde:", err);
        onError?.(err);

        setState((prev) => ({
          ...prev,
          isSaving: false,
        }));
      }
    },
    [storageKey, onSave, onError]
  );

  // Restaurer les données depuis localStorage
  const restoreFromLocalStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const restoredData = parsed.data as T;

      lastSavedDataRef.current = restoredData;

      setState((prev) => ({
        ...prev,
        hasSavedData: true,
        hasUnsavedChanges: false,
      }));

      onRestore?.(restoredData);

      console.log(`[AutoSave] Formulaire restauré: ${storageKey}`);
      return restoredData;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[AutoSave] Erreur lors de la restauration:", err);
      onError?.(err);
      return null;
    }
  }, [storageKey, onRestore, onError]);

  // Effacer les données sauvegardées
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedDataRef.current = null;

      setState((prev) => ({
        ...prev,
        hasSavedData: false,
        hasUnsavedChanges: false,
        lastSaved: null,
      }));

      console.log(`[AutoSave] Données effacées: ${storageKey}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[AutoSave] Erreur lors de l'effacement:", err);
      onError?.(err);
    }
  }, [storageKey, onError]);

  // Vérifier si les données ont changé
  const hasDataChanged = useCallback((): boolean => {
    if (!lastSavedDataRef.current) return true;

    return JSON.stringify(formData) !== JSON.stringify(lastSavedDataRef.current);
  }, [formData]);

  // Effet: Sauvegarde automatique
  useEffect(() => {
    // Vérifier les changements
    if (hasDataChanged()) {
      setState((prev) => ({
        ...prev,
        hasUnsavedChanges: true,
      }));
    }

    // Nettoyer le timeout précédent
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde
    saveTimeoutRef.current = setTimeout(() => {
      if (hasDataChanged()) {
        saveToLocalStorage(formData);
      }
    }, saveInterval);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, saveInterval, hasDataChanged, saveToLocalStorage]);

  // Effet: Sauvegarder avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        saveToLocalStorage(formData);
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, state.hasUnsavedChanges, saveToLocalStorage]);

  // Effet: Restaurer les données au montage
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      setState((prev) => ({
        ...prev,
        hasSavedData: true,
      }));
    }
  }, [storageKey]);

  return {
    ...state,
    saveNow: () => saveToLocalStorage(formData),
    restoreNow: restoreFromLocalStorage,
    clearNow: clearSavedData,
    hasDataChanged,
  };
};

/**
 * Hook useLocalStorageFormData
 * 
 * Gère la synchronisation bidirectionnelle entre un formulaire et localStorage
 */
export const useLocalStorageFormData = <T extends Record<string, any>>(
  storageKey: string,
  initialData: T
): [T, (data: T) => void, () => void] => {
  const [data, setData] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data || initialData;
      }
    } catch (error) {
      console.error("[LocalStorage] Erreur lors de la lecture:", error);
    }
    return initialData;
  });

  // Sauvegarder dans localStorage quand les données changent
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          data,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("[LocalStorage] Erreur lors de la sauvegarde:", error);
    }
  }, [data, storageKey]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setData(initialData);
    } catch (error) {
      console.error("[LocalStorage] Erreur lors de l'effacement:", error);
    }
  }, [storageKey, initialData]);

  return [data, setData, clear];
};
