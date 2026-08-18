import { BookOpenCheck, BriefcaseBusiness, CalendarDays, MessageCircleQuestion, Presentation, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";

const modules = [
  { title: "Fondamentaux de l’agence de voyage", icon: Presentation, text: "Organisation d’un dossier voyage, rôle des fournisseurs, information client et bonnes pratiques de service." },
  { title: "Conseil et relation client", icon: UsersRound, text: "Recueil du besoin, clarification des contraintes, présentation transparente des options et suivi professionnel." },
  { title: "Billetterie et services associés", icon: BriefcaseBusiness, text: "Repères opérationnels autour de la recherche de vols, de la préparation d’un devis et du suivi de réservation." },
  { title: "Procédures et conformité", icon: BookOpenCheck, text: "Comprendre les limites du conseil, vérifier les informations officielles et éviter les promesses de résultat." },
];

export default function Formation() {
  return <ServicePageShell eyebrow="Formation 3M · Agence de voyage" title="Développez les repères essentiels du métier d’agent de voyage" introduction="Cette formation s’adresse aux personnes qui souhaitent comprendre l’organisation d’une agence de voyage et renforcer leurs bases de relation client, de billetterie et de suivi de dossier." primaryHref="/contact?objet=formation" primaryLabel="Demander les informations de formation" notice="Les dates, modalités, prérequis, tarifs et éventuelle attestation sont communiqués par 3M Travel avant toute inscription.">
    <ServiceSection title="Les axes de formation" introduction="Un programme pratique construit autour des situations rencontrées dans une agence de voyage."><div className="grid gap-4 md:grid-cols-2">{modules.map((module) => { const Icon = module.icon; return <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-6"><Icon className="h-7 w-7 text-blue-700" /><h3 className="mt-4 text-lg font-black">{module.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{module.text}</p></article>; })}</div></ServiceSection>
    <ServiceSection tone="slate" title="Demander un programme adapté"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-white p-5"><CalendarDays className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Recevez les prochaines disponibilités et le format de la session.</p></div><div className="rounded-xl bg-white p-5"><MessageCircleQuestion className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Précisez votre niveau, vos objectifs et la disponibilité souhaitée.</p></div><div className="rounded-xl bg-white p-5"><UsersRound className="h-6 w-6 text-blue-700" /><p className="mt-3 text-sm text-slate-600">Formations individuelles ou à confirmer selon les groupes disponibles.</p></div></div><div className="mt-8"><Link href="/contact?objet=formation" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Contacter l’équipe formation</Link></div></ServiceSection>
  </ServicePageShell>;
}
