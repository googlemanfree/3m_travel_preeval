import type { FormOverride } from "@shared/dynamicForm";
import { trpc } from "@/lib/trpc";

const NONE: FormOverride[] = [];

/**
 * Règles de l'administration sur les questions du formulaire (masquées, renommées, obligatoires, ajoutées).
 * Sans règle, ou si elles ne sont pas disponibles, le formulaire reste celui du moteur : jamais d'écran cassé.
 */
export function useFormOverrides(): FormOverride[] {
  const query = (trpc as unknown as { evaluationForms?: { activeOverrides?: { useQuery?: (input: undefined, options: Record<string, unknown>) => { data?: FormOverride[] } } } }).evaluationForms?.activeOverrides?.useQuery?.(undefined, { staleTime: 60_000, retry: false, refetchOnWindowFocus: false });
  return query?.data ?? NONE;
}
