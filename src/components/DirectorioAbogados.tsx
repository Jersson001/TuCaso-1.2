import React, { useState } from "react";
import { Star, ShieldCheck, MapPin, Briefcase, Award, Search, X, Check, PhoneCall, MessageSquare } from "lucide-react";
import { MOCK_LAWYERS, type MockLawyer } from "../data/mockLawyers";

interface DirectorioAbogadosProps {
  initialSpecialty?: string | null;
  onClose?: () => void;
  onSelectLawyer?: (lawyer: MockLawyer) => void;
}

const SPECIALTY_TABS = ["Todas", "Familia", "Penal", "Laboral", "Civil", "Comercial", "Administrativo"] as const;

export default function DirectorioAbogados({ initialSpecialty, onClose, onSelectLawyer }: DirectorioAbogadosProps) {
  const [selectedTab, setSelectedTab] = useState<string>(
    initialSpecialty && SPECIALTY_TABS.includes(initialSpecialty as any) ? initialSpecialty : "Todas"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLawyerModal, setActiveLawyerModal] = useState<MockLawyer | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);

  const filteredLawyers = MOCK_LAWYERS.filter(lawyer => {
    const matchesTab = selectedTab === "Todas" || lawyer.specialtyMain === selectedTab || lawyer.specialties.includes(`Derecho de ${selectedTab}`);
    const matchesQuery = searchQuery === "" ||
      lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  const handleContactLawyer = (lawyer: MockLawyer) => {
    setContactSuccess(`¡Solicitud enviada a ${lawyer.name}! El abogado se pondrá en contacto contigo muy pronto.`);
    setTimeout(() => setContactSuccess(null), 5000);
    if (onSelectLawyer) onSelectLawyer(lawyer);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-gold/30 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" /> Directorio de Especialistas Verificados
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-navy">
            Abogados mejor calificados en Colombia
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Revisa sus valoraciones, casos atendidos en TuCaso y su Tarjeta Profesional CSJ verificada.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="self-end md:self-center bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {contactSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-4 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{contactSuccess}</span>
        </div>
      )}

      {/* Search & Specialty Filter Tabs */}
      <div className="space-y-4 mb-8">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SPECIALTY_TABS.map((tab) => {
            const isActive = selectedTab === tab;
            const count = tab === "Todas"
              ? MOCK_LAWYERS.length
              : MOCK_LAWYERS.filter(l => l.specialtyMain === tab || l.specialties.includes(`Derecho de ${tab}`)).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-navy text-gold shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isActive ? "bg-gold/20 text-gold" : "bg-gray-200 text-gray-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lawyers Grid */}
      {filteredLawyers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">No encontramos abogados para los filtros seleccionados.</p>
          <button
            onClick={() => { setSelectedTab("Todas"); setSearchQuery(""); }}
            className="text-xs text-gold hover:underline font-bold mt-2 inline-block"
          >
            Ver todos los abogados
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="bg-white border border-gray-200 hover:border-gold/60 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={lawyer.avatar}
                    alt={lawyer.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-gold/40 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-max mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {lawyer.csjCard}
                    </div>
                    <h3 className="font-serif font-bold text-navy text-sm leading-tight group-hover:text-gold transition">
                      {lawyer.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {lawyer.rating}
                      </span>
                      <span>({lawyer.reviewsCount} opiniones)</span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center gap-1.5 text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-navy shrink-0" />
                    <span className="font-semibold">{lawyer.casesCount} casos atendidos</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{lawyer.city}</span>
                  </div>
                </div>

                {/* Bio Snippet */}
                <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed font-light">
                  {lawyer.bio}
                </p>

                {/* Specialty Chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {lawyer.specialties.slice(0, 3).map((spec, i) => (
                    <span key={i} className="bg-navy/5 text-navy text-[10px] font-medium px-2.5 py-1 rounded-md">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setActiveLawyerModal(lawyer)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-navy font-bold text-xs py-2.5 rounded-xl border border-gray-200 transition"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => handleContactLawyer(lawyer)}
                  className="flex-1 bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Contactar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Profile Detailed View */}
      {activeLawyerModal && (
        <div className="fixed inset-0 bg-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gold/40 relative max-h-[90vh] overflow-y-auto animate-scale-up">
            <button
              onClick={() => setActiveLawyerModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-navy p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <img
                src={activeLawyerModal.avatar}
                alt={activeLawyerModal.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-gold shadow-md shrink-0"
              />
              <div>
                <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tarjeta Profesional CSJ: {activeLawyerModal.csjCard}
                </span>
                <h3 className="font-serif text-xl font-bold text-navy">{activeLawyerModal.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-gold" /> {activeLawyerModal.city} • {activeLawyerModal.experienceYears} años de experiencia
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Calificación</span>
                <span className="text-sm font-bold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {activeLawyerModal.rating}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Casos Exitosos</span>
                <span className="text-sm font-bold text-navy mt-0.5 block">{activeLawyerModal.casesCount} casos</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Honorarios</span>
                <span className="text-xs font-bold text-emerald-700 mt-0.5 block">{activeLawyerModal.hourlyRate}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-1">Perfil Profesional</h4>
                <p className="text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                  {activeLawyerModal.bio}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-2">Especialidades Acreditadas</h4>
                <div className="flex flex-wrap gap-2">
                  {activeLawyerModal.specialties.map((s, i) => (
                    <span key={i} className="bg-navy text-gold text-xs font-semibold px-3 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleContactLawyer(activeLawyerModal);
                setActiveLawyerModal(null);
              }}
              className="w-full bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Solicitar Asesoría con {activeLawyerModal.name.split(" ")[0]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
