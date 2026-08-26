import { Facebook, Linkedin, Twitter } from "lucide-react";

type SocialShareButtonsProps = {
  title: string;
  className?: string;
};

export function SocialShareButtons({ title, className = "" }: SocialShareButtonsProps) {
  const share = (network: "facebook" | "twitter" | "linkedin") => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://www.3mtravelagency.com/";
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedTitle = encodeURIComponent(title);
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };
    window.open(urls[network], "_blank", "noopener,noreferrer,width=680,height=620");
  };

  const buttons = [
    { key: "facebook" as const, label: "Partager sur Facebook", icon: Facebook, tone: "bg-[#1877F2] hover:bg-[#0f65d1]" },
    { key: "twitter" as const, label: "Partager sur Twitter", icon: Twitter, tone: "bg-slate-900 hover:bg-slate-700" },
    { key: "linkedin" as const, label: "Partager sur LinkedIn", icon: Linkedin, tone: "bg-[#0A66C2] hover:bg-[#084f96]" },
  ];

  return (
    <section aria-labelledby="social-share-title" className={`flex flex-wrap items-center gap-3 ${className}`}>
      <h2 id="social-share-title" className="mr-1 text-sm font-bold text-slate-700">Partager cette page</h2>
      {buttons.map(({ key, label, icon: Icon, tone }) => (
        <button key={key} type="button" onClick={() => share(key)} aria-label={label} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{key === "twitter" ? "Twitter" : key[0].toUpperCase() + key.slice(1)}</span>
        </button>
      ))}
    </section>
  );
}
