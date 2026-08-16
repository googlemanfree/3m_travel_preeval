import React, { useState } from "react";
import { Globe, ExternalLink, Search, ShieldCheck, FileText, Download, Building2, MapPin, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONSULAR_REGISTRY, ConsularEntry } from "../../../server/consularRegistry";

export function AdminConsularRegistry() {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const regions = ["all", "Amérique du Nord", "Europe Schengen", "Europe", "Moyen-Orient"];

  const filtered = CONSULAR_REGISTRY.filter(item => {
    const matchSearch = item.countryName.toLowerCase().includes(search.toLowerCase()) || 
                        item.region.toLowerCase().includes(search.toLowerCase()) ||
                        item.visaRequirementsSummary.toLowerCase().includes(search.toLowerCase());
    const matchRegion = selectedRegion === "all" || item.region === selectedRegion;
    return matchSearch && matchRegion;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Registre des Consulats & Liens Officiels
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accès direct aux portails consulaires officiels, e-Visas et exigences de voyage mondiales.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Region filters */}
      <div className="flex flex-wrap gap-2">
        {regions.map(r => (
          <Button
            key={r}
            variant={selectedRegion === r ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRegion(r)}
            className={selectedRegion === r ? "bg-blue-600 text-white" : "border-slate-200 dark:border-slate-800"}
          >
            {r === "all" ? "Toutes les régions" : r}
          </Button>
        ))}
      </div>

      {/* Grid of Consular Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(entry => (
          <Card key={entry.countryCode} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      {entry.countryName}
                    </CardTitle>
                    <CardDescription className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {entry.region}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
                  {entry.countryCode.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> Délai moyen :</span>
                  <span className="font-semibold">{entry.processingTimeDays} jours</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Frais officiels :</span>
                  <span className="font-semibold">~{entry.officialFeesUsd} USD</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exigences principales :</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {entry.visaRequirementsSummary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {entry.evisaUrl && (
                  <a
                    href={entry.evisaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Portail e-Visa Officiel
                    </span>
                    <span>↗</span>
                  </a>
                )}
                <a
                  href={entry.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" /> Ambassade / Consulat
                  </span>
                  <span>↗</span>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Aucun consulat trouvé pour votre recherche.</p>
        </div>
      )}
    </div>
  );
}
