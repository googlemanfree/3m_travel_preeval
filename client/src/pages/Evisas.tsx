/**
 * Page E-Visas
 * Affiche la liste complète des e-visas disponibles avec filtres et recherche
 */

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Clock,
  DollarSign,
  FileText,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';

export function Evisas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'time'>('name');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Récupérer les e-visas
  const { data: evisasData, isLoading: loadingEvisas } = trpc.evisa.getAllEvisas.useQuery({
    region: selectedRegion || undefined,
    search: searchTerm || undefined,
    limit: 200,
    offset: 0,
  });

  // Récupérer les régions
  const { data: regionsData } = trpc.evisa.getRegions.useQuery();

  // Récupérer les statistiques
  const { data: statsData } = trpc.evisa.getEvisaStats.useQuery();

  // Traiter et trier les données
  const processedEvisas = useMemo(() => {
    let items = (evisasData?.data as any[]) || [];

    // Trier
    switch (sortBy) {
      case 'price':
        items = [...items].sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
        break;
      case 'time':
        items = [...items].sort((a: any, b: any) => {
          const timeA = parseInt(a.processingTime?.split('-')[0] || '0');
          const timeB = parseInt(b.processingTime?.split('-')[0] || '0');
          return timeA - timeB;
        });
        break;
      case 'name':
      default:
        items = [...items].sort((a: any, b: any) =>
          (a.countryName || '').localeCompare(b.countryName || '')
        );
    }

    return items;
  }, [evisasData, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedEvisas.length / itemsPerPage);
  const paginatedEvisas = processedEvisas.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const regions = (regionsData?.data as any[]) || [];
  const stats = statsData?.data?.evisas || {};

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">E-Visas du Monde</h1>
        <p className="text-blue-100">
          Découvrez les e-visas disponibles pour plus de {stats.totalCountries} pays
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-3xl font-bold">{stats.totalCountries || 0}</p>
              <p className="text-sm text-gray-600">Pays disponibles</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold">{stats.minPrice || 0}</p>
              <p className="text-sm text-gray-600">Prix minimum (XOF)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-3xl font-bold">{Math.round(stats.avgPrice || 0) / 1000}k</p>
              <p className="text-sm text-gray-600">Prix moyen (XOF)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold">{stats.totalRegions || 0}</p>
              <p className="text-sm text-gray-600">Régions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-10"
              />
            </div>

            {/* Région */}
            <Select value={selectedRegion} onValueChange={(value) => {
              setSelectedRegion(value);
              setCurrentPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les régions</SelectItem>
                {(regions as any[]).map((region: any) => (
                  <SelectItem key={region.region} value={region.region}>
                    {region.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tri */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom du pays</SelectItem>
                <SelectItem value="price">Prix (croissant)</SelectItem>
                <SelectItem value="time">Délai de traitement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résultats */}
          <div className="text-sm text-gray-600">
            {processedEvisas.length > 0 ? (
              <>
                Affichage {currentPage * itemsPerPage + 1} à{' '}
                {Math.min((currentPage + 1) * itemsPerPage, processedEvisas.length)} sur{' '}
                {processedEvisas.length} résultats
              </>
            ) : (
              'Aucun e-visa trouvé'
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des e-visas */}
      {loadingEvisas ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement des e-visas...</p>
        </div>
      ) : paginatedEvisas.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(paginatedEvisas as any[]).map((evisa: any) => (
              <Card key={evisa.countryCode} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{evisa.countryName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{evisa.region}</p>
                    </div>
                    <Badge variant="outline">{evisa.countryCode}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-gray-700">{evisa.description}</p>

                  {/* Informations principales */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">{evisa.price?.toLocaleString('fr-FR')} XOF</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>{evisa.processingTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Validité: {evisa.validityDays} jours</span>
                    </div>
                  </div>

                  {/* Exigences */}
                  {evisa.requirements && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-semibold mb-1">Exigences:</p>
                      <p className="text-gray-700">{evisa.requirements}</p>
                    </div>
                  )}

                  {/* Documents */}
                  {evisa.documents && (
                    <div className="bg-blue-50 p-3 rounded text-sm">
                      <p className="font-semibold mb-1">Documents:</p>
                      <p className="text-gray-700">{evisa.documents}</p>
                    </div>
                  )}

                  {/* Bouton d'action */}
                  <Button className="w-full" variant="default">
                    <span>Demander un e-visa</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Précédent
              </Button>

              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(i)}
                  className="w-10"
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Aucun e-visa ne correspond à vos critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
