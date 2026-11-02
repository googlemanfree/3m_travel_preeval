import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { inspectBilan, toBilanHtml } from "../../shared/bilanContent";
import { publicProcedure, router } from "../_core/trpc";
import { BILAN_AI_MAX_CHARS, BILAN_AI_MODE_KEYS, BILAN_AI_MODES, askPerplexity, bilanAiAvailable, buildBilanAiMessages, pseudonymizeBilan, takeAiSlot } from "../services/bilanAi";
import { requireValidAdminSession } from "./adminAuth";

const session = z.string().min(1).max(512);

/** Assistant de relecture : l'administrateur décide. Le nom du candidat n'est jamais transmis ; la proposition n'est jamais enregistrée ni envoyée par le serveur. */
export const bilanAiRouter = router({
  status: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return { available: bilanAiAvailable(), modes: BILAN_AI_MODE_KEYS.map((key) => ({ key, label: BILAN_AI_MODES[key].label })) };
  }),

  improve: publicProcedure.input(z.object({ sessionToken: session, mode: z.enum(BILAN_AI_MODE_KEYS), text: z.string().min(30).max(BILAN_AI_MAX_CHARS), fullName: z.string().trim().max(255).nullish() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    if (!bilanAiAvailable()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L'assistant n'est pas activé : la clé PERPLEXITY_API_KEY doit être ajoutée à la configuration du serveur." });
    if (!takeAiSlot(admin.id)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite atteinte : 20 propositions par heure. Réessayez plus tard." });
    let proposal: string;
    try {
      proposal = await askPerplexity(buildBilanAiMessages(input.mode, pseudonymizeBilan(input.text, input.fullName)));
    } catch {
      throw new TRPCError({ code: "BAD_GATEWAY", message: "L'assistant n'a pas répondu. Réessayez dans un instant ; votre texte n'est pas modifié." });
    }
    const check = inspectBilan(toBilanHtml(proposal));
    return { proposal, warnings: [...check.forbiddenTerms.map((term) => `Formulation à revoir : ${term}`), ...check.sensitiveData.map((item) => `Donnée sensible : ${item}`)] };
  }),
});
