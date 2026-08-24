import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";

const QUESTIONS = [
  {
    question: "L’évaluation gratuite engage-t-elle une procédure ?",
    answer: "Non. Elle permet de présenter votre projet et de recevoir une première orientation. Toute démarche, tout paiement et toute décision restent soumis à un échange et à une validation humaine.",
  },
  {
    question: "Faut-il créer un compte avant de commencer ?",
    answer: "Non. Le formulaire gratuit est accessible directement. Un compte peut ensuite être proposé lorsque le suivi de votre dossier l’exige.",
  },
  {
    question: "Quels documents dois-je préparer ?",
    answer: "Les pièces dépendent du pays et de la procédure. L’équipe vous confirme les documents nécessaires après examen de votre projet ; ne transmettez pas de document sensible sans instruction adaptée.",
  },
  {
    question: "Les délais et conditions affichés sont-ils garantis ?",
    answer: "Non. Les informations publiques sont indicatives. Les exigences et délais applicables sont confirmés au cas par cas par le conseiller et, lorsque nécessaire, auprès de la source officielle concernée.",
  },
];

export function PublicFAQ() {
  return (
    <section aria-labelledby="faq-title" className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Réponses claires</p>
          <h2 id="faq-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Les réponses utiles avant de commencer
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Nous privilégions des informations vérifiables et un accompagnement humain plutôt que des promesses automatiques.
          </p>
          <PublicEvaluationCTA className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Commencer l’évaluation gratuite
          </PublicEvaluationCTA>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-slate-200 bg-white px-5">
          {QUESTIONS.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-base font-bold text-slate-900 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-6 text-slate-600">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
