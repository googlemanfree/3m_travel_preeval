import React from 'react';
import { SearchBarWithFilters } from '@/components/SearchBarWithFilters';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

const SearchDemo = () => {
  // Données d'exemple
  const searchItems = [
    {
      id: '1',
      title: 'Visa Étudiant Canada',
      description: 'Demande de visa d\'études pour les universités canadiennes',
      category: 'Visa',
      tags: ['Canada', 'Études', 'Travail'],
      icon: '🎓',
    },
    {
      id: '2',
      title: 'Permis de Travail France',
      description: 'Demande de permis de travail pour la France',
      category: 'Travail',
      tags: ['France', 'Travail', 'Professionnel'],
      icon: '💼',
    },
    {
      id: '3',
      title: 'Résidence Permanente Canada',
      description: 'Demande de résidence permanente canadienne',
      category: 'Immigration',
      tags: ['Canada', 'Résidence', 'Permanent'],
      icon: '🏠',
    },
    {
      id: '4',
      title: 'Visa Visiteur Royaume-Uni',
      description: 'Demande de visa de visite pour le Royaume-Uni',
      category: 'Visa',
      tags: ['Royaume-Uni', 'Visite', 'Tourisme'],
      icon: '✈️',
    },
    {
      id: '5',
      title: 'Permis de Travail Allemagne',
      description: 'Demande de permis de travail pour l\'Allemagne',
      category: 'Travail',
      tags: ['Allemagne', 'Travail', 'Technique'],
      icon: '🔧',
    },
    {
      id: '6',
      title: 'Visa Étudiant Australie',
      description: 'Demande de visa d\'études pour l\'Australie',
      category: 'Visa',
      tags: ['Australie', 'Études', 'International'],
      icon: '🎓',
    },
    {
      id: '7',
      title: 'Traduction de Documents',
      description: 'Service de traduction certifiée de documents officiels',
      category: 'Services',
      tags: ['Traduction', 'Documents', 'Certification'],
      icon: '📄',
    },
    {
      id: '8',
      title: 'Consultation Gratuite',
      description: 'Consultation gratuite avec nos experts en immigration',
      category: 'Services',
      tags: ['Consultation', 'Gratuit', 'Expert'],
      icon: '👨‍💼',
    },
    {
      id: '9',
      title: 'Assurance Voyage',
      description: 'Assurance voyage complète pour vos déplacements',
      category: 'Services',
      tags: ['Assurance', 'Voyage', 'Protection'],
      icon: '🛡️',
    },
    {
      id: '10',
      title: 'Hébergement Étudiant',
      description: 'Aide à la recherche d\'hébergement pour étudiants',
      category: 'Services',
      tags: ['Hébergement', 'Étudiant', 'Logement'],
      icon: '🏢',
    },
  ];

  const filters = [
    {
      id: 'category',
      label: 'Catégorie',
      options: ['Visa', 'Travail', 'Immigration', 'Services'],
    },
    {
      id: 'tags',
      label: 'Destination',
      options: ['Canada', 'France', 'Royaume-Uni', 'Allemagne', 'Australie'],
    },
  ];

  const handleSearch = (query: string, activeFilters: Record<string, string[]>) => {
    console.log('Recherche:', { query, activeFilters });
  };

  const handleItemSelect = (item: any) => {
    toast.success(`Vous avez sélectionné : ${item.title}`);
    console.log('Item sélectionné:', item);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Recherche Avancée
            </h1>
            <p className="text-lg text-gray-600">
              Trouvez facilement les services et procédures d'immigration que vous recherchez
            </p>
          </div>

          {/* Barre de recherche */}
          <Card className="p-6 mb-8">
            <SearchBarWithFilters
              items={searchItems}
              filters={filters}
              onSearch={handleSearch}
              onItemSelect={handleItemSelect}
              placeholder="Recherchez un visa, une procédure, un service..."
            />
          </Card>

          {/* Informations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔍 Recherche Rapide
              </h3>
              <p className="text-gray-600 text-sm">
                Tapez vos mots-clés pour trouver instantanément les services correspondants
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎯 Filtres Intelligents
              </h3>
              <p className="text-gray-600 text-sm">
                Utilisez les filtres pour affiner vos résultats par catégorie ou destination
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ✨ Résultats Détaillés
              </h3>
              <p className="text-gray-600 text-sm">
                Consultez les descriptions complètes et les tags pour chaque résultat
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDemo;
