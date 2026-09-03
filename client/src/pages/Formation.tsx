import { BadgeCheck, BookOpenCheck, BriefcaseBusiness, CalendarDays, Clock3, MessageCircleQuestion, Presentation, UsersRound, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";

const modules = [
  { title: "Fondamentaux de l’agence de voyage", icon: Presentation, text: "Organisation d’un dossier voyage, rôle des fournisseurs, information client et bonnes pratiques de service." },
  { title: "Conseil et relation client", icon: UsersRound, text: "Recueil du besoin, clarification des contraintes, présentation transparente des options et suivi professionnel." },
  { title: "Billetterie et services associés", icon: BriefcaseBusiness, text: "Repères opérationnels autour de la recherche de vols, de la préparation d’un devis et du suivi de réservation." },
  { title: "Procédures et conformité", icon: BookOpenCheck, text: "Comprendre les limites du conseil, vérifier les informations officielles et éviter les promesses de résultat." },
];

const programme = [
  ["Session 1 · 3 h", "Métier, besoins client et cycle d’un dossier", "Positionnement d’une agence, qualification, collecte des informations et traçabilité."],
  ["Session 2 · 3 h", "Recherche, devis et billetterie", "Lecture d’une demande, comparaison transparente, construction d’un devis et contrôles avant confirmation."],
  ["Session 3 · 3 h", "Procédures, conformité et sources", "Vérification des portails officiels, limites du conseil, documents et communication responsable."],
  ["Session 4 · 3 h", "Mise en situation et plan d’action", "Jeu de rôle, traitement d’un cas complet, suivi client et plan de progression individuel."],
];

const formats = [
  { icon: Clock3, title: "Durée", text: "Parcours standard de 12 heures, réparti en 4 sessions de 3 heures. Une formule courte de 6 heures peut être proposée après analyse du besoin." },
  { icon: UsersRound, title: "Format", text: "Présentiel à Yaoundé ou distanciel selon disponibilité, en individuel ou en petit groupe. Les dates sont confirmées avant inscription." },
  { icon: WalletCards, title: "Fourchette indicative", text: "À partir de 75 000 à 150 000 FCFA selon le format, le nombre de participants et le niveau d’accompagnement. Devis confirmé avant paiement." },
  { icon: BadgeCheck, title: "Prérequis & attestation", text: "Aucun diplôme obligatoire pour le parcours d’introduction. Une attestation de participation peut être remise lorsque l’assiduité et les exercices prévus sont validés." },
];

export default function Formation() {
  return <ServicePageShell eyebrow="Formation 3M · Agence de voyage" title="Développez les repères essentiels du métier d’agent de voyage" introduction="Cette formation s’adresse aux personnes qui souhaitent comprendre l’organisation d’une agence de voyage et renforcer leurs bases de relation client, de billetterie et de suivi de dossier." primaryHref="/contact?objet=formation" primaryLabel="Demander les informations de formation" notice="Les dates, modalités et prix sont indicatifs jusqu’à confirmation écrite par 3M Travel. Aucun paiement n’est demandé avant validation du programme et du devis.">
    <ServiceSection title="Repères pratiques avant inscription" introduction="Un cadre lisible pour choisir le format adapté à votre objectif."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{formats.map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-6 w-6 text-blue-700" /><h3 className="mt-3 font-black text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>; })}</div></ServiceSection>
    <ServiceSection title="Programme détaillé" introduction="Le parcours standard combine apports, exercices et mises en situation. Le contenu peut être adapté après échange avec l’équipe formation."><div className="grid gap-4 md:grid-cols-2">{programme.map(([session, title, text]) => <article key={session} className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-700">{session}</p><h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></ServiceSection>
    <ServiceSection title="Les axes de formation" introduction="Un programme pratique construit autour des situations rencontrées dans une agence de voyage."><div className="grid gap-4 md:grid-cols-2">{modules.map((module) => { const Icon = module.icon; return <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-6"><Icon className="h-7 w-7 text-blue-700" /><h3 className="mt-4 text-lg font-black">{module.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{module.text}</p></article>; })}</div></ServiceSection>
    <ServiceSection tone="slate" title="Demander un programme adapté"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-white p-5"><CalendarDays className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Recevez les prochaines disponibilités et le format de la session.</p></div><div className="rounded-xl bg-white p-5"><MessageCircleQuestion className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Précisez votre niveau, vos objectifs et la disponibilité souhaitée.</p></div><div className="rounded-xl bg-white p-5"><UsersRound className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Formations individuelles ou à confirmer selon les groupes disponibles.</p></div></div><div className="mt-8"><Link href="/contact?objet=formation" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Contacter l’équipe formation</Link></div></ServiceSection>
  </ServicePageShell>;
}
