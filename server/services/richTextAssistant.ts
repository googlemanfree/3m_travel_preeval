import { invokeLLM, listLLMModels } from "../_core/llm";
import { richTextToPlainText, sanitizeRichTextHtml } from "./richText";

export type RichTextImprovement = { contentHtml: string; contentText: string; changeSummary: string };

function contentFrom(result: Awaited<ReturnType<typeof invokeLLM>>) {
  const value = result.choices[0]?.message.content;
  return typeof value === "string" ? value : value?.filter((part) => part.type === "text").map((part) => part.text).join("\n") || "";
}

export async function improveAdministrativeRichText(content: string, purpose: "candidate_message" | "evaluation_message" | "general"): Promise<RichTextImprovement> {
  const currentHtml = sanitizeRichTextHtml(content);
  const currentText = richTextToPlainText(currentHtml);
  if (currentText.length < 3) throw new Error("Le texte à améliorer est trop court.");
  const { data: models } = await listLLMModels();
  const model = models.find((entry) => entry.id === "gpt-5-mini")?.id;
  const result = await invokeLLM({
    model,
    maxTokens: 1800,
    outputSchema: {
      name: "administrative_rich_text_improvement",
      strict: true,
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          contentHtml: { type: "string" },
          changeSummary: { type: "string" },
        },
        required: ["contentHtml", "changeSummary"],
      },
    },
    messages: [
      { role: "system", content: "Tu es un correcteur rédactionnel pour une agence de mobilité internationale. Corrige l’orthographe, la grammaire, la clarté et le ton professionnel du texte fourni, sans modifier les faits, chiffres, références de dossier, noms, liens, exigences consulaires, décisions ou délais. Ne crée aucune information. Préserve les listes et la structure. Retourne uniquement le JSON demandé. Le HTML doit se limiter à p, br, strong, em, u, ul, ol, li, h3, a et table. Toute proposition reste soumise à validation humaine." },
      { role: "user", content: `Contexte : ${purpose}.\n\nTexte à améliorer :\n${currentHtml}\n\nConserve strictement le sens et les informations factuelles. Reformule seulement pour rendre le message plus clair, correct et professionnel.` },
    ],
  });
  const raw = JSON.parse(contentFrom(result)) as Record<string, unknown>;
  const contentHtml = sanitizeRichTextHtml(typeof raw.contentHtml === "string" ? raw.contentHtml : currentHtml);
  const contentText = richTextToPlainText(contentHtml);
  const changeSummary = typeof raw.changeSummary === "string" ? raw.changeSummary.trim().slice(0, 600) : "Proposition de correction préparée pour relecture.";
  if (contentText.length < 3) throw new Error("La proposition IA ne contient aucun texte exploitable.");
  return { contentHtml, contentText, changeSummary };
}
