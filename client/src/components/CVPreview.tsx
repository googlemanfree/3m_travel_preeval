import { motion } from 'framer-motion';

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  profilePhoto: string;
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

interface CVPreviewProps {
  data: CVData;
  template?: 'modern' | 'classic' | 'minimal';
}

export default function CVPreview({ data, template = 'modern' }: CVPreviewProps) {
  const renderModernTemplate = () => (
    <div className="bg-white p-12 text-gray-900 space-y-8 font-sans">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-8">
        <div className="flex gap-6 items-start mb-4">
          {data.profilePhoto && (
            <img src={data.profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-black text-blue-600 mb-2">{data.fullName || 'Nom Complet'}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {data.email && <span>📧 {data.email}</span>}
          {data.phone && <span>📱 {data.phone}</span>}
          {data.location && <span>📍 {data.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div>
          <h2 className="text-xl font-black text-blue-600 mb-3">Profil Professionnel</h2>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.some(e => e.company) && (
        <div>
          <h2 className="text-xl font-black text-blue-600 mb-4">Expérience Professionnelle</h2>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              (exp.company || exp.position) && (
                <div key={idx} className="border-l-4 border-blue-300 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{exp.position || 'Poste'}</h3>
                    <span className="text-sm text-gray-600">{exp.duration}</span>
                  </div>
                  <p className="text-sm text-blue-600 font-semibold mb-2">{exp.company}</p>
                  {exp.description && <p className="text-sm text-gray-700">{exp.description}</p>}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.some(e => e.school) && (
        <div>
          <h2 className="text-xl font-black text-blue-600 mb-4">Formation</h2>
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              (edu.school || edu.degree) && (
                <div key={idx} className="border-l-4 border-indigo-300 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900">{edu.degree || 'Diplôme'}</h3>
                    <span className="text-sm text-gray-600">{edu.year}</span>
                  </div>
                  <p className="text-sm text-indigo-600 font-semibold">{edu.school}</p>
                  {edu.field && <p className="text-sm text-gray-700">{edu.field}</p>}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-blue-600 mb-3">Compétences</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-blue-600 mb-3">Langues</h2>
          <div className="flex flex-wrap gap-2">
            {data.languages.map((lang, idx) => (
              <span key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>CV généré par 3M Travel & Services</p>
      </div>
    </div>
  );

  const renderClassicTemplate = () => (
    <div className="bg-white p-10 text-gray-900 space-y-6 font-serif">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-400 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.fullName || 'Nom Complet'}</h1>
        <div className="text-sm text-gray-700 space-y-1">
          {data.email && <p>📧 {data.email}</p>}
          {data.phone && <p>📱 {data.phone}</p>}
          {data.location && <p>📍 {data.location}</p>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase">Profil</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience.some(e => e.company) && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase">Expérience</h2>
          <div className="space-y-3">
            {data.experience.map((exp, idx) => (
              (exp.company || exp.position) && (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{exp.position}</span>
                    <span className="text-sm text-gray-600">{exp.duration}</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">{exp.company}</p>
                  {exp.description && <p className="text-sm text-gray-700 mt-1">{exp.description}</p>}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.some(e => e.school) && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase">Formation</h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              (edu.school || edu.degree) && (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{edu.degree}</span>
                    <span className="text-sm text-gray-600">{edu.year}</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">{edu.school}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Skills & Languages */}
      {(data.skills.length > 0 || data.languages.length > 0) && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase">Compétences</h2>
          <p className="text-sm text-gray-700">{data.skills.join(' • ')}</p>
          {data.languages.length > 0 && (
            <p className="text-sm text-gray-700 mt-2"><strong>Langues :</strong> {data.languages.join(' • ')}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="bg-white p-8 text-gray-900 space-y-4 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{data.fullName || 'Nom Complet'}</h1>
        <p className="text-xs text-gray-600 mt-1">
          {[data.email, data.phone, data.location].filter(Boolean).join(' • ')}
        </p>
      </div>

      {/* Summary */}
      {data.summary && (
        <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
      )}

      {/* Experience */}
      {data.experience.some(e => e.company) && (
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-2">EXPÉRIENCE</h3>
          {data.experience.map((exp, idx) => (
            (exp.company || exp.position) && (
              <div key={idx} className="text-sm mb-2">
                <div className="flex justify-between">
                  <span className="font-semibold">{exp.position}</span>
                  <span className="text-gray-600">{exp.duration}</span>
                </div>
                <p className="text-gray-600">{exp.company}</p>
              </div>
            )
          ))}
        </div>
      )}

      {/* Education */}
      {data.education.some(e => e.school) && (
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-2">FORMATION</h3>
          {data.education.map((edu, idx) => (
            (edu.school || edu.degree) && (
              <div key={idx} className="text-sm mb-1">
                <span className="font-semibold">{edu.degree}</span>
                <p className="text-gray-600">{edu.school} ({edu.year})</p>
              </div>
            )
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-1">COMPÉTENCES</h3>
          <p className="text-sm text-gray-700">{data.skills.join(' • ')}</p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* A4 Preview */}
      <div className="bg-white" style={{ aspectRatio: '210/297' }}>
        <div className="h-full overflow-y-auto text-xs" style={{ fontSize: '11px' }}>
          {template === 'modern' && renderModernTemplate()}
          {template === 'classic' && renderClassicTemplate()}
          {template === 'minimal' && renderMinimalTemplate()}
        </div>
      </div>
    </motion.div>
  );
}
