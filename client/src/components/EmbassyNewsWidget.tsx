import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Globe, Newspaper, ShieldCheck, Sparkles, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EmbassyNewsWidget() {
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const { data: newsItems, isLoading } = trpc.embassyNews.list.useQuery({
    category: selectedCategory,
    source: selectedSource,
  });

  const categories = [
    { id: "all", label: language === "en" ? "All Updates" : "Toutes les actualités" },
    { id: "visa", label: language === "en" ? "Visas & Entry" : "Visas & Entrée" },
    { id: "etudes", label: language === "en" ? "Studies & Permits" : "Études & Permis" },
    { id: "immigration", label: language === "en" ? "Immigration" : "Immigration" },
  ];

  const sources = [
    { id: "all", label: language === "en" ? "All Sources" : "Toutes les sources" },
    { id: "canada", label: "Canada (IRCC)" },
    { id: "schengen", label: "Schengen / EU" },
    { id: "france", label: "France Visas" },
  ];

  return (
    <section className="py-12 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              {language === "en" ? "Official Embassy Sources" : "Sources Officielles & Gouvernementales"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {language === "en" ? "Latest Embassy & Immigration Updates" : "Actualités Officielles des Ambassades"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {language === "en"
                ? "Real-time updates and procedural announcements for Canada, Schengen, and European destinations."
                : "Informations vérifiées en direct des autorités compétentes pour vos démarches vers le Canada et l'Europe."}
            </p>
          </div>

          {/* Filtres par catégorie et source */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border shadow-sm">
              <Filter className="w-4 h-4 ml-2 text-slate-400" />
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sources.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste des actualités */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="animate-pulse bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !newsItems || newsItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Newspaper className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {language === "en" ? "No news found matching your filters." : "Aucune actualité ne correspond à vos filtres."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map((item) => (
              <Card
                key={item.id}
                className="group flex flex-col justify-between bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`font-semibold ${
                        item.source === "Canada"
                          ? "border-red-300 text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400"
                          : "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}
                    >
                      {item.source === "Canada" ? "🇨🇦 " : "🇪🇺 "}
                      {item.sourceBadge}
                    </Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(item.date).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {item.priority !== "normal" && (
                    <motion.div
                      role="status"
                      aria-label={item.priority === "urgent"
                        ? (language === "en" ? "Urgent embassy announcement" : "Annonce urgente de l’ambassade")
                        : (language === "en" ? "Major embassy announcement" : "Annonce majeure de l’ambassade")}
                      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
                      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        item.priority === "urgent"
                          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700/70 dark:bg-red-950/40 dark:text-red-300"
                          : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.priority === "urgent"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        } ${prefersReducedMotion ? "" : "animate-pulse"}`}
                      />
                      {item.priority === "urgent"
                        ? (language === "en" ? "Urgent" : "Urgent")
                        : (language === "en" ? "Major update" : "Annonce majeure")}
                    </motion.div>
                  )}
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {item.title[language === "en" ? "en" : "fr"]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">
                    {item.summary[language === "en" ? "en" : "fr"]}
                  </CardDescription>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 p-0 h-auto font-semibold text-xs"
                    >
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                        <span>{language === "en" ? "Official source" : "Source officielle"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
