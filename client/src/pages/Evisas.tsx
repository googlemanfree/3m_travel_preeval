/**
 * Page E-Visas
 * Affiche la liste complète des e-visas disponibles avec filtres et recherche avancée
 */

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Filter,
  ChevronRight,
} from 'lucide-react';
import {
  EvisasGridSkeleton,
  EvisasStatsSkeleton,
} from '@/components/EvisaSkeleton';
import {
  EvisaAdvancedFilters,
  FilterState,
} from '@/components/EvisaAdvancedFilters';

export function Evisas() {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    continents: [],
    priceRange: [0, 500000],
    processingTimeRange: [1, 90],
  });
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'time'>('name');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Récupérer les e-visas
  const { data: evisasData, isLoading: loadingEvisas } = trpc.evisa.getAllEvisas.useQuery({
    region: filters.continents.length > 0 ? filters.continents[0] : undefined,
    search: filters.searchTerm || undefined,
    limit: 200,
    offset: 0,
  });

  // Récupérer les statistiques
  const { data: statsData } = trpc.evisa.getEvisaStats.useQuery();

  // Traiter et trier les données
  const processedEvisas = useMemo(() => {
    let items = (evisasData?.data as any[]) || [];

    // Appliquer les filtres
    items = items.filter((item: any) => {
      // Filtre par continent
      if (filters.continents.length > 0 && !filters.continents.includes(item.continent)) {
        return false;
      }

      // Filtre par prix
      const price = item.price || 0;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // Filtre par délai de traitement
      const processingDays = parseInt(item.processingTime?.split('-')[0] || '0');
      if (processingDays < filters.processingTimeRange[0] || processingDays > filters.processingTimeRange[1]) {
        return false;
      }

      return true;
    });

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
  }, [evisasData, sortBy, filters]);

  // Pagination
  const totalPages = Math.ceil(processedEvisas.length / itemsPerPage);
  const paginatedEvisas = processedEvisas.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

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

      {/* Statistiques avec skeleton */}
      {loadingEvisas ? (
        <EvisasStatsSkeleton />
      ) : (
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
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm text-gray-600">Continents</p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Recherche et Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EvisaAdvancedFilters
            onFilterChange={setFilters}
            totalResults={processedEvisas.length}
          />
        </CardContent>
      </Card>

      {/* Tri supplémentaire */}
      {processedEvisas.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Affichage {currentPage * itemsPerPage + 1} à{' '}
            {Math.min((currentPage + 1) * itemsPerPage, processedEvisas.length)} sur{' '}
            {processedEvisas.length} résultats
          </p>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom du pays</SelectItem>
              <SelectItem value="price">Prix (croissant)</SelectItem>
              <SelectItem value="time">Délai de traitement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Liste des e-visas avec skeleton */}
      {loadingEvisas ? (
        <EvisasGridSkeleton />
      ) : paginatedEvisas.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(paginatedEvisas as any[]).map((evisa: any) => (
              <Card key={evisa.countryCode} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{evisa.countryName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{evisa.continent}</p>
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
                      <span>Validité: {evisa.validity}</span>
                    </div>
                  </div>

                  {/* Exigences */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Exigences:</p>
                    <div className="flex flex-wrap gap-1">
                      {(evisa.requirements || '').split(',').slice(0, 3).map((req: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {req.trim()}
                        </Badge>
                      ))}
                      {(evisa.requirements || '').split(',').length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(evisa.requirements || '').split(',').length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Bouton d'action */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => window.location.href = `/evisas/${evisa.countryCode}`}
                  >
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
