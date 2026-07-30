import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Footer from '@/components/Footer';

interface Resource {
  country: string;
  flag: string;
  file: string;
  type: string;
}

const ProceduresResources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Données des ressources
  const resourceTypes = [
    { id: 'all', label: 'Tous les documents', count: 107 },
    { id: 'visa_travail', label: 'Visa Travail', count: 34, color: 'bg-blue-50 border-blue-200' },
    { id: 'visa_etudes', label: 'Visa Études', count: 22, color: 'bg-green-50 border-green-200' },
    { id: 'visa_visiteur', label: 'Visa Visiteur', count: 27, color: 'bg-purple-50 border-purple-200' },
    { id: 'guides', label: 'Guides Spécialisés', count: 23, color: 'bg-orange-50 border-orange-200' },
  ];

  const resources: Resource[] = [
    // Visa Travail
    { country: 'Allemagne', flag: '🇩🇪', file: '3MTravel_VisaTravail_Allemagne_2026_64549fc5.docx', type: 'visa_travail' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaTravail_Australie_2026_916008e9.pdf', type: 'visa_travail' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaTravail_Canada_Complet_2026_6ddf7e2c.pdf', type: 'visa_travail' },
    { country: 'France', flag: '🇫🇷', file: '3MTravel_VisaTravail_France_2026_65fca802.pdf', type: 'visa_travail' },
    { country: 'États-Unis', flag: '🇺🇸', file: '3MTravel_VisaTravail_EtatsUnis_2026_bc1ac42d.pdf', type: 'visa_travail' },
    { country: 'Royaume-Uni', flag: '🇬🇧', file: '3MTravel_VisaTravail_RoyaumeUni_2026_d17acd9e.pdf', type: 'visa_travail' },
    { country: 'Suisse', flag: '🇨🇭', file: '3MTravel_VisaTravail_Suisse_2026_5f00cf79.docx', type: 'visa_travail' },
    { country: 'Nouvelle-Zélande', flag: '🇳🇿', file: '3MTravel_VisaTravail_NouvelleZelande_2026_6faad320.pdf', type: 'visa_travail' },
    { country: 'Irlande', flag: '🇮🇪', file: '3MTravel_VisaTravail_Irlande_2026_1612755f.docx', type: 'visa_travail' },
    { country: 'Italie', flag: '🇮🇹', file: '3MTravel_VisaTravail_Italie_Complet_3M_FCFA_2026_4afb5c71.docx', type: 'visa_travail' },
    { country: 'Pologne', flag: '🇵🇱', file: '3MTravel_VisaTravail_Pologne_2026_d7fe44ee.pdf', type: 'visa_travail' },
    { country: 'Portugal', flag: '🇵🇹', file: '3MTravel_VisaTravail_Portugal_2026_8608abfa.pdf', type: 'visa_travail' },
    { country: 'Qatar', flag: '🇶🇦', file: '3MTravel_VisaTravail_Qatar_2026_5de645a8.pdf', type: 'visa_travail' },
    { country: 'Malaisie', flag: '🇲🇾', file: '3MTravel_VisaTravail_Malaisie_2026_d55d0436.docx', type: 'visa_travail' },
    { country: 'Kenya', flag: '🇰🇪', file: '3MTravel_VisaTravail_Kenya_2026_36500e5d.docx', type: 'visa_travail' },
    // Visa Études
    { country: 'France', flag: '🇫🇷', file: '3MTravel_VisaEtudes_France_2026.pdf', type: 'visa_etudes' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaEtudes_Canada_2026.pdf', type: 'visa_etudes' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaEtudes_Australie_2026.pdf', type: 'visa_etudes' },
    { country: 'Royaume-Uni', flag: '🇬🇧', file: '3MTravel_VisaEtudes_RoyaumeUni_2026.pdf', type: 'visa_etudes' },
    { country: 'États-Unis', flag: '🇺🇸', file: '3MTravel_VisaEtudes_EtatsUnis_2026.pdf', type: 'visa_etudes' },
    // Visa Visiteur
    { country: 'Schengen', flag: '🇪🇺', file: '3MTravel_VisaVisiteur_Schengen_2026.pdf', type: 'visa_visiteur' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaVisiteur_Canada_2026.pdf', type: 'visa_visiteur' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaVisiteur_Australie_2026.pdf', type: 'visa_visiteur' },
  ];

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = resource.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType]);

  const getTypeColor = (type: string) => {
    const typeObj = resourceTypes.find(t => t.id === type);
    return typeObj?.color || 'bg-gray-50 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
  const handlePreview = (fileName: string) => {
    setPreviewFileName(fileName);
    setPreviewPdfUrl(`/manus-storage/${fileName}`);
    setIsPreviewOpen(true);
  };
    const typeObj = resourceTypes.find(t => t.id === type);
    return typeObj?.label || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2540] via-white to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">📚 Procédures & Guides Visa</h1>
          <p className="text-lg text-blue-100 mb-8">
            Accédez à notre bibliothèque complète de <strong>107 guides officiels</strong> pour vos demandes de visa vers le monde entier.
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un pays (ex: Canada, France, Australie)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-lg text-gray-900 w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#0a2540]">Filtrer par type</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>

          {/* Filter Buttons */}
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedType === type.id
                    ? 'bg-[#0a2540] text-white border-[#0a2540]'
                    : 'bg-white text-[#0a2540] border-gray-200 hover:border-[#0a2540]'
                }`}
              >
                <div className="font-bold">{type.label}</div>
                <div className="text-xs opacity-75">{type.count} docs</div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-[#0a2540] font-medium">
            {filteredResources.length} document{filteredResources.length !== 1 ? 's' : ''} trouvé{filteredResources.length !== 1 ? 's' : ''}
            {selectedType !== 'all' && ` • Type: ${getTypeLabel(selectedType)}`}
            {searchTerm && ` • Recherche: "${searchTerm}"`}
          </p>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${getTypeColor(resource.type)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{resource.flag}</div>
                  <span className="text-xs font-bold px-3 py-1 bg-white rounded-full text-[#0a2540]">
                    {getTypeLabel(resource.type)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#0a2540] mb-2">{resource.country}</h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Guide complet pour votre demande de visa
                </p>

                <a
                  href={`/manus-storage/${resource.file}`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a2540] text-white rounded-lg hover:bg-[#0a2540]/90 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Aucun document trouvé</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
              variant="outline"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl mb-2">📖</div>
            <h3 className="font-bold text-[#0a2540] mb-2">107 Destinations</h3>
            <p className="text-sm text-gray-600">Guides pour tous les pays et régions du monde</p>
          </div>
          
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold text-[#0a2540] mb-2">À Jour 2026</h3>
            <p className="text-sm text-gray-600">Tous les documents sont mis à jour régulièrement</p>
          </div>
          
          <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-[#0a2540] mb-2">Gratuit</h3>
            <p className="text-sm text-gray-600">Téléchargez tous les guides gratuitement</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] text-white rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aide pour votre demande ?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Nos experts sont disponibles pour vous accompagner dans votre démarche de visa. Contactez-nous pour une consultation gratuite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/237698104832"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-[#0a2540] rounded-lg font-bold hover:bg-blue-50 transition-colors"
            >
              💬 Contacter sur WhatsApp
            </a>
            <a
              href="/evaluation"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              ⭐ Évaluation Gratuite
            </a>
          </div>
        </div>
      </div>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={previewPdfUrl || ''}
        fileName={previewFileName}
        downloadUrl={`/manus-storage/${previewFileName}`}
      />
      <Footer />
    </div>
  );
};

export default ProceduresResources;
