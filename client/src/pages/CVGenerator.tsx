import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
}

export default function CVGenerator() {
  const [cvData, setCVData] = useState<CVData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: [{ company: '', position: '', duration: '', description: '' }],
    education: [{ school: '', degree: '', field: '', year: '' }],
    skills: [],
    languages: []
  });

  const [currentTab, setCurrentTab] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setCVData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setCVData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput]
      }));
      setSkillInput('');
    }
  };

  const addLanguage = () => {
    if (languageInput.trim()) {
      setCVData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput]
      }));
      setLanguageInput('');
    }
  };

  const generatePDF = async () => {
    try {
      const response = await fetch('/api/cv/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cvData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${cvData.fullName}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du CV');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            📄 Générateur CV International
          </h1>
          <p className="text-gray-600">Créez un CV professionnel au format international</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8"
          >
            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {[
                { id: 'personal', label: '👤 Personnel' },
                { id: 'experience', label: '💼 Expérience' },
                { id: 'education', label: '🎓 Éducation' },
                { id: 'skills', label: '🎯 Compétences' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`px-4 py-2 font-semibold transition ${
                    currentTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu onglets */}
            {currentTab === 'personal' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={cvData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={cvData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={cvData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Localisation"
                  value={cvData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
                <textarea
                  placeholder="Résumé professionnel"
                  value={cvData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none h-24"
                />
              </div>
            )}

            {currentTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter une compétence"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold mb-3">Langues</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ajouter une langue"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={addLanguage}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cvData.languages.map((lang, idx) => (
                      <span key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Aperçu */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-6">
              <h3 className="font-bold text-lg mb-4">📋 Aperçu</h3>

              <div className="text-sm space-y-3">
                <div>
                  <p className="text-gray-600 text-xs">Nom</p>
                  <p className="font-semibold">{cvData.fullName || 'Non rempli'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Email</p>
                  <p className="font-semibold text-blue-600">{cvData.email || 'Non rempli'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Localisation</p>
                  <p className="font-semibold">{cvData.location || 'Non rempli'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Compétences</p>
                  <p className="font-semibold">{cvData.skills.length} ajoutées</p>
                </div>
              </div>

              <button
                onClick={generatePDF}
                disabled={!cvData.fullName}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 Télécharger CV
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
