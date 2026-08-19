import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Briefcase, Shield, Check, MapPin, Phone, AlertCircle, RefreshCw, Award, LogOut,
  Star, GraduationCap, Trophy, Sparkles, Send, CheckCircle2, User, FileText, CheckSquare,
  Pencil, Settings
} from "lucide-react";
import { supabase, type Profile, type Lawyer, type Case } from "../lib/supabase";
import AuthForm from "./AuthForm";
import { RoleMismatch } from "./ClientePortal";
import ConfigurarPerfilModal from "./ConfigurarPerfilModal";

interface AbogadoPortalProps {
  session: Session | null;
  profile: Profile | null;
  lawyer: Lawyer | null;
}

export default function AbogadoPortal({ session: initialSession, profile: initialProfile, lawyer: initialLawyer }: AbogadoPortalProps) {
  const [activeTab, setActiveTab] = useState<"perfil" | "disponibles" | "postulaciones" | "asignados" | "configurar">("perfil");
  const [demoMode, setDemoMode] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [mutableProfile, setMutableProfile] = useState<Profile | null>(initialProfile);
  const [mutableLawyer, setMutableLawyer] = useState<Lawyer | null>(initialLawyer);

  // Sync when parent props change (e.g. initial load)
  useEffect(() => { if (initialProfile) setMutableProfile(initialProfile); }, [initialProfile]);
  useEffect(() => { if (initialLawyer) setMutableLawyer(initialLawyer); }, [initialLawyer]);

  const isDemo = demoMode || !initialSession;
  const session = initialSession || (demoMode ? ({ user: { id: "demo-lawyer-id" } } as any) : null);

  const profile = mutableProfile || (isDemo ? {
    id: session?.user?.id || "demo-profile",
    role: "lawyer",
    full_name: "Dra. Valentina Ospina Gómez",
    phone: "+57 310 987 6543",
    city: "Bogotá D.C.",
    created_at: new Date().toISOString()
  } as Profile : null);

  const lawyer = mutableLawyer || (isDemo ? {
    profile_id: session?.user?.id || "demo-profile",
    professional_card_number: "TP-312459-CSJ",
    verification_status: "verified",
    specialties: ["Derecho de Familia", "Derecho Penal", "Violencia Intrafamiliar", "Custodia y Alimentos"],
    subscription_status: "active",
    subscription_renewed_at: new Date().toISOString(),
    bio: "Especialista en Derecho de Familia de la Universidad del Rosario con 12 años de trayectoria. Enfocada en brindar soluciones empáticas y efectivas en procesos de custodia de menores, fijación de cuota alimentaria, violencia intrafamiliar y divorcios de mutuo acuerdo. Mi filosofía se centra en priorizar la conciliación pacífica antes de acudir al litigio contencioso.",
    experience_years: 12,
    headline: "Abogada Especialista en Derecho de Familia & Conciliaciones Intrafamiliares",
    created_at: new Date().toISOString()
  } as Lawyer : null);

  if (!session && !demoMode) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <HeroAbogado />
        <div className="bg-gradient-to-r from-navy to-navy/90 text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-gold/30 shadow-lg">
          <div>
            <h4 className="font-serif font-bold text-gold text-lg mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> ¿Deseas explorar el Perfil de Abogado estilo LinkedIn?
            </h4>
            <p className="text-white/80 text-xs">
              Haz clic abajo para previsualizar el perfil profesional, logros, estudios y el muro de postulaciones en Modo Demostración.
            </p>
          </div>
          <button
            onClick={() => setDemoMode(true)}
            className="bg-gold text-navy font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:bg-white transition flex-shrink-0 flex items-center gap-2"
          >
            <User className="w-4 h-4" /> Probar Perfil de Abogado (LinkedIn)
          </button>
        </div>
        <AuthForm
          role="lawyer"
          title="Accede a tu cuenta de Abogado"
          subtitle="Inicia sesión o regístrate para postularte a casos calificados por IA."
        />
      </div>
    );
  }

  if (profile && profile.role !== "lawyer") {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <RoleMismatch role={profile.role} />
      </div>
    );
  }

  // Si no hay lawyer o el perfil no está completo (sin bio, sin headline, sin experience).
  // Usamos chequeo falsy para cubrir null Y undefined (columnas aún no migradas en BD).
  const isProfileEmpty = !lawyer || (!lawyer.bio && !lawyer.headline && !lawyer.experience_years);

  if (isProfileEmpty && !isDemo && session) {
    // Objetos de respaldo por si el registro aún no existe en la BD.
    const profileForEdit: Profile = profile || {
      id: session.user.id,
      role: "lawyer",
      full_name: null,
      phone: null,
      city: null,
      avatar_url: null,
      created_at: new Date().toISOString()
    };
    const lawyerForEdit: Lawyer = lawyer || {
      profile_id: session.user.id,
      professional_card_number: "",
      verification_status: "pending",
      specialties: [],
      subscription_status: "active",
      subscription_renewed_at: null,
      bio: null,
      experience_years: null,
      headline: null,
      created_at: new Date().toISOString()
    };

    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 space-y-6">
        <div className="bg-white rounded-3xl border border-gold/30 p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-navy mb-2">Bienvenido a tu Perfil de Abogado</h2>
          <p className="text-xs text-gray-600 mb-6">Completa tu información profesional para que los clientes puedan conocer tu experiencia y especialidades.</p>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs px-6 py-3 rounded-xl transition shadow-md inline-flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Completar mi Perfil Ahora
          </button>
        </div>

        {showConfigModal && (
          <ConfigurarPerfilModal
            session={session}
            lawyer={lawyerForEdit}
            profile={profileForEdit}
            onClose={() => setShowConfigModal(false)}
            onSaved={(updatedLawyer, updatedProfile) => {
              setMutableLawyer(updatedLawyer);
              setMutableProfile(updatedProfile);
              setShowConfigModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">
      {/* LinkedIn Style Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mb-8">
        <div className="h-40 md:h-48 bg-gradient-to-r from-navy via-navy/90 to-gold/30 relative">
          {lawyer.verification_status === "verified" ? (
            <div className="absolute top-4 right-4 bg-navy/60 backdrop-blur-md text-gold text-[10px] font-bold px-3 py-1.5 rounded-full border border-gold/30 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Perfil Profesional Verificado
            </div>
          ) : (
            <div className="absolute top-4 right-4 bg-amber-500/20 backdrop-blur-md text-amber-100 text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-300/40 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-200" /> Verificación Pendiente
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 pb-8 relative -mt-16 md:-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
              {isDemo ? (
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
                  alt={profile.full_name || "Abogado"}
                  className="w-32 h-32 md:w-36 md:h-36 rounded-3xl object-cover border-4 border-white shadow-2xl shrink-0"
                />
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Abogado"}
                  className="w-32 h-32 md:w-36 md:h-36 rounded-3xl object-cover border-4 border-white shadow-2xl shrink-0"
                />
              ) : (
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border-4 border-white shadow-2xl shrink-0 bg-navy flex items-center justify-center text-gold text-5xl font-serif font-bold">
                  {(profile.full_name || "?").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-navy">
                    {profile.full_name || "Abogado/a"}
                  </h1>
                  {lawyer.verification_status === "verified" ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> CSJ Verificado
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Verificación Pendiente
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm font-medium text-navy/80">
                  {lawyer.headline || "Agrega tu título profesional en 'Editar Perfil'"}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-3 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold" /> {profile.city || "Colombia"}</span>
                  <span>•</span>
                  <span className="font-semibold text-navy">TP: {lawyer?.professional_card_number || "Pendiente"}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {!isDemo && (
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="bg-white hover:bg-gold hover:text-navy text-navy border border-gray-200 font-bold text-xs px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4 text-gold" /> Editar Perfil
                </button>
              )}
              <button
                onClick={() => setActiveTab("disponibles")}
                className="bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> Buscar Casos para Postularme
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="text-center md:text-left md:border-r border-gray-200 pr-4">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Casos Exitosos</span>
              <span className="text-lg font-bold text-navy flex items-center justify-center md:justify-start gap-1">
                <Trophy className="w-4 h-4 text-gold" /> {isDemo ? "64 Casos" : "Sin datos aún"}
              </span>
            </div>
            <div className="text-center md:text-left md:border-r border-gray-200 pr-4">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Calificación Clientes</span>
              <span className="text-lg font-bold text-amber-600 flex items-center justify-center md:justify-start gap-1">
                {isDemo ? (
                  <><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 / 5.0</>
                ) : (
                  <><Star className="w-4 h-4 text-gray-300" /> Sin reseñas</>
                )}
              </span>
            </div>
            <div className="text-center md:text-left md:border-r border-gray-200 pr-4">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Experiencia</span>
              <span className="text-lg font-bold text-navy flex items-center justify-center md:justify-start gap-1">
                <GraduationCap className="w-4 h-4 text-navy" />
                {lawyer.experience_years ? `${lawyer.experience_years} Años` : (isDemo ? "12 Años" : "—")}
              </span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Efectividad</span>
              <span className="text-lg font-bold text-emerald-700 flex items-center justify-center md:justify-start gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isDemo ? "98% Conciliado" : "Sin datos aún"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-gray-100 bg-gray-50/50 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-6 py-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "perfil" ? "border-gold text-navy bg-white shadow-sm" : "border-transparent text-gray-500 hover:text-navy"
            }`}
          >
            <User className="w-4 h-4 text-gold" /> Perfil Profesional LinkedIn
          </button>
          <button
            onClick={() => setActiveTab("disponibles")}
            className={`px-6 py-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "disponibles" ? "border-gold text-navy bg-white shadow-sm" : "border-transparent text-gray-500 hover:text-navy"
            }`}
          >
            <Briefcase className="w-4 h-4 text-navy" /> Casos Disponibles para Postularme
          </button>
          <button
            onClick={() => setActiveTab("postulaciones")}
            className={`px-6 py-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "postulaciones" ? "border-gold text-navy bg-white shadow-sm" : "border-transparent text-gray-500 hover:text-navy"
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" /> Mis Postulaciones
          </button>
          <button
            onClick={() => setActiveTab("asignados")}
            className={`px-6 py-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "asignados" ? "border-gold text-navy bg-white shadow-sm" : "border-transparent text-gray-500 hover:text-navy"
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" /> Casos Asignados
          </button>
          {!isDemo && (
            <button
              onClick={() => setActiveTab("configurar")}
              className={`px-6 py-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === "configurar" ? "border-gold text-navy bg-white shadow-sm" : "border-transparent text-gray-500 hover:text-navy"
              }`}
            >
              <Settings className="w-4 h-4 text-gray-400" /> Configurar Perfil
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "perfil" && <PerfilLinkedInTab lawyer={lawyer} profile={profile} isDemo={isDemo} />}
      {activeTab === "disponibles" && <CasosDisponibles session={session} isDemo={isDemo} />}
      {activeTab === "postulaciones" && <MisPostulaciones session={session} isDemo={isDemo} />}
      {activeTab === "asignados" && <CasosAsignados session={session} isDemo={isDemo} />}
      {activeTab === "configurar" && !isDemo && session && lawyer && profile && (
        <ConfigurarPerfilModal
          session={session}
          lawyer={lawyer}
          profile={profile}
          onClose={() => setActiveTab("perfil")}
          onSaved={(updatedLawyer, updatedProfile) => {
            setMutableLawyer(updatedLawyer);
            setMutableProfile(updatedProfile);
            setActiveTab("perfil");
          }}
        />
      )}

      {/* Floating Editar Perfil Modal */}
      {showConfigModal && !isDemo && session && lawyer && profile && (
        <ConfigurarPerfilModal
          session={session}
          lawyer={lawyer}
          profile={profile}
          onClose={() => setShowConfigModal(false)}
          onSaved={(updatedLawyer, updatedProfile) => {
            setMutableLawyer(updatedLawyer);
            setMutableProfile(updatedProfile);
            setShowConfigModal(false);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// LINKEDIN STYLE PROFILE TAB
// ==========================================
function PerfilLinkedInTab({ lawyer, profile, isDemo }: { lawyer: Lawyer; profile: Profile; isDemo?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main LinkedIn Feed Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Extracto / Bio */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-navy mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" /> Acerca de mí / Extracto Profesional
          </h3>
          {lawyer.bio ? (
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-light whitespace-pre-wrap">
              {lawyer.bio}
            </p>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                Aún no has agregado tu extracto profesional.
                <br />
                <span className="text-gold font-semibold">Configura tu perfil</span> para que los clientes te conozcan mejor.
              </p>
            </div>
          )}
        </div>

        {/* Estudios y Formación Académica */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-navy mb-6 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gold" /> Estudios y Formación Académica
          </h3>
          {isDemo ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy/5 text-navy font-bold text-sm flex items-center justify-center shrink-0 border border-navy/10">
                  UR
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm">Universidad del Rosario</h4>
                  <p className="text-xs text-gold font-semibold">Especialización en Derecho de Familia</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">2013 - 2014 • Bogotá D.C.</p>
                  <p className="text-xs text-gray-600 mt-2 font-light">
                    Enfoque en resolución alternativa de conflictos familiares, régimen patrimonial del matrimonio y protección integral de menores.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy/5 text-navy font-bold text-sm flex items-center justify-center shrink-0 border border-navy/10">
                  UR
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm">Universidad del Rosario</h4>
                  <p className="text-xs text-gold font-semibold">Pregrado en Derecho (Grado Honorífico Cum Laude)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">2007 - 2012 • Bogotá D.C.</p>
                  <p className="text-xs text-gray-600 mt-2 font-light">
                    Tesis laureada en protección de víctimas de violencia intrafamiliar en la legislación colombiana.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-navy/5 text-navy font-bold text-sm flex items-center justify-center shrink-0 border border-navy/10">
                  UN
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm">Universidad Nacional de Colombia</h4>
                  <p className="text-xs text-gold font-semibold">Magíster en Derecho Penal y Procesal</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">2016 - 2018 • Bogotá D.C.</p>
                  <p className="text-xs text-gray-600 mt-2 font-light">
                    Profundización en delitos contra la familia y responsabilidad técnica en medidas de protección.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Aún no has agregado tu formación académica.</p>
            </div>
          )}
        </div>

        {/* Logros y Certificaciones */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-navy mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" /> Logros y Certificaciones Oficiales
          </h3>
          {isDemo ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-navy">Certificación en Conciliación en Derecho</h4>
                  <p className="text-[11px] text-gray-500">Cámara de Comercio de Bogotá (CCB)</p>
                  <p className="text-xs text-gray-600 mt-1">Habilitada oficialmente como Conciliadora en Derecho para suscribir actas de acuerdo con plena validez jurídica.</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                <Award className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-navy">Abogada Destacada del Año en TuCaso (2025)</h4>
                  <p className="text-[11px] text-gray-500">Plataforma TuCaso Colombia</p>
                  <p className="text-xs text-gray-600 mt-1">Reconocimiento por la tasa más alta de casos resueltos mediante conciliación pacífica de alimentos y custodia.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Aún no has agregado logros ni certificaciones.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Info Column */}
      <div className="space-y-6">
        {/* CSJ Professional Card Box */}
        <div className="bg-navy rounded-3xl text-white p-6 shadow-xl border border-gold/30 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-gold" />
            <div>
              <span className="text-[10px] text-gold uppercase font-bold tracking-wider">Consejo Superior de la Judicatura</span>
              <h4 className="font-serif font-bold text-lg">Tarjeta Profesional</h4>
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center mb-4">
            <span className="text-lg font-mono font-bold text-gold">{lawyer.professional_card_number || "Pendiente"}</span>
            <span className="block text-[10px] text-white/70 mt-0.5">
              Estado: {lawyer.verification_status === "verified" ? "VIGENTE Y ACTIVA" : "PENDIENTE DE VERIFICACIÓN"}
            </span>
          </div>
          <p className="text-xs text-white/80 font-light leading-relaxed">
            {lawyer.verification_status === "verified"
              ? "Tarjeta verificada y validada ante el registro público del Consejo Superior de la Judicatura de Colombia."
              : "Tu tarjeta será verificada por un administrador de TuCaso ante el Consejo Superior de la Judicatura."}
          </p>
        </div>

        {/* Especialidades Acreditadas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="font-serif font-bold text-navy text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
            Especialidades Acreditadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {lawyer.specialties.map(spec => (
              <span key={spec} className="bg-navy text-gold text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                ✓ {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Contacto / Disponibilidad */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <h4 className="font-serif font-bold text-navy text-sm uppercase tracking-wider mb-2">
            Disponibilidad de Atención
          </h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" /> {profile.city ? `Atendiendo en ${profile.city} y modalidad virtual a nivel nacional.` : "Ciudad de atención no especificada."}</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-navy" /> {profile.phone || "Teléfono no especificado"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CASOS DISPONIBLES & POSTULACIÓN
// ==========================================
function CasosDisponibles({ session, isDemo }: { session: Session; isDemo?: boolean }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [myApplications, setMyApplications] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingCase, setApplyingCase] = useState<Case | null>(null);
  const [proposalText, setProposalText] = useState("");
  const [feeText, setFeeText] = useState("Consulta inicial acordada en plataforma");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    // En modo demo (visitante no autenticado) no consultamos la BD.
    if (isDemo) {
      setCases([]);
      setMyApplications(new Set());
      setLoading(false);
      return;
    }

    const [{ data: openCases }, { data: applications }] = await Promise.all([
      supabase.from("cases").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("applications").select("case_id").eq("lawyer_id", session.user.id)
    ]);

    // Solo casos reales publicados por clientes; sin datos hardcodeados.
    setCases(openCases ?? []);
    setMyApplications(new Set((applications ?? []).map(a => a.case_id)));
    setLoading(false);
  };

  useEffect(() => {
    load();

    // No suscribimos Realtime en modo demo (sin sesión real).
    if (isDemo) return;

    // Suscripción en tiempo real: cuando un cliente publica, edita o cierra
    // un caso, recargamos el muro automáticamente.
    const channel = supabase
      .channel("cases-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cases" },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenProposal = (c: Case) => {
    setApplyingCase(c);
    setProposalText(`Estimado cliente, revisé tu caso sobre Derecho de ${c.suggested_branch}. Cuento con amplia experiencia y Tarjeta Profesional CSJ verificada para brindarte la mejor asesoría inmediata.`);
  };

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingCase) return;

    if (!isDemo) {
      const { error: applyError } = await supabase.from("applications").insert({
        case_id: applyingCase.id,
        lawyer_id: session.user.id,
        proposal: proposalText.trim() || null,
        fee: feeText.trim() || null
      });

      if (applyError) {
        // Postulación duplicada: la tratamos como éxito (ya estaba postulado).
        const alreadyApplied = applyError.code === "23505" ||
          applyError.message?.toLowerCase().includes("duplicate");
        if (!alreadyApplied) {
          setSuccessMsg(null);
          setError(`No se pudo enviar la postulación: ${applyError.message}`);
          setTimeout(() => setError(null), 6000);
          return;
        }
      }
    }

    setMyApplications(prev => new Set([...prev, applyingCase.id]));
    setSuccessMsg(`¡Postulación enviada exitosamente para el caso de Derecho de ${applyingCase.suggested_branch}! El cliente revisará tu perfil.`);
    setTimeout(() => setSuccessMsg(null), 5000);
    setApplyingCase(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <span className="text-[10px] bg-gold/20 text-navy font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
            {!isDemo && <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>}
            Muro de Oportunidades en Tiempo Real
          </span>
          <h2 className="text-2xl font-serif font-bold text-navy">Casos Publicados por Clientes</h2>
          <p className="text-xs text-gray-500">Postúlate directamente a las solicitudes que coinciden con tus especialidades.</p>
        </div>
        <button onClick={load} className="bg-navy hover:bg-gold hover:text-navy text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2 shrink-0">
          <RefreshCw className="w-4 h-4 text-gold" /> Actualizar Muro
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-semibold p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Cargando oportunidades...</p>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No hay casos abiertos para tu área en este instante.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cases.map(c => {
            const applied = myApplications.has(c.id);
            return (
              <div key={c.id} className="bg-white border border-gray-200 hover:border-gold/60 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3 flex-grow max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="bg-navy text-gold font-bold text-xs px-3 py-1 rounded-lg">
                      Derecho {c.suggested_branch}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gold" /> Bogotá D.C.
                    </span>
                    <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2.5 py-0.5 rounded-md">
                      Urgencia Alta
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-light bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    "{c.description}"
                  </p>
                </div>

                <button
                  onClick={() => handleOpenProposal(c)}
                  disabled={applied}
                  className={`px-6 py-3.5 rounded-xl font-bold text-xs transition flex-shrink-0 flex items-center gap-2 shadow-md ${
                    applied
                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                      : "bg-navy hover:bg-gold hover:text-navy text-white"
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Postulación Enviada
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-gold" /> Postularme a este Caso
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Modal */}
      {applyingCase && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gold/40 relative">
            <h3 className="text-xl font-serif font-bold text-navy mb-1">
              Postularme al Caso de Derecho de {applyingCase.suggested_branch}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Envía tu mensaje de propuesta inicial al cliente. Se adjuntará tu Tarjeta Profesional CSJ y perfil verificado.
            </p>

            <form onSubmit={submitProposal} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Mensaje de Presentación</label>
                <textarea
                  rows={4}
                  required
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Condición de Consulta</label>
                <input
                  type="text"
                  value={feeText}
                  onChange={(e) => setFeeText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingCase(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-3 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Confirmar Postulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MIS POSTULACIONES TAB (real + realtime)
// ==========================================
function MisPostulaciones({ session, isDemo }: { session: Session; isDemo?: boolean }) {
  const [apps, setApps] = useState<any[]>([]);
  const [myMatchCaseIds, setMyMatchCaseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (isDemo) { setApps([]); setMyMatchCaseIds(new Set()); setLoading(false); return; }
    const [{ data: appData }, { data: matchData }] = await Promise.all([
      supabase.from("applications").select("*, cases(*)").eq("lawyer_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("matches").select("case_id").eq("lawyer_id", session.user.id)
    ]);
    setApps(appData ?? []);
    setMyMatchCaseIds(new Set((matchData ?? []).map((m: any) => m.case_id)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (isDemo) return;
    const channel = supabase
      .channel("mis-postulaciones-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-navy">Mis Postulaciones</h2>
        {!isDemo && (
          <span className="text-[10px] uppercase font-bold text-gray-400 inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            En vivo
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando tus postulaciones...</p>
      ) : apps.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Aún no te has postulado a ningún caso. Ve a "Casos Disponibles" para postularte.</p>
        </div>
      ) : (
        apps.map((a: any) => {
          const won = myMatchCaseIds.has(a.case_id);
          const caseClosed = a.cases?.status === "matched" || a.cases?.status === "closed";
          const branch = a.cases?.suggested_branch || a.cases?.chosen_branch || "Sin clasificar";
          const state = won
            ? { label: "Asignado a ti", cls: "bg-emerald-200 text-emerald-900" }
            : caseClosed
              ? { label: "No seleccionada", cls: "bg-gray-200 text-gray-600" }
              : { label: "En Revisión", cls: "bg-amber-200 text-amber-900" };
          return (
            <div key={a.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${won ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-start gap-3">
                {won ? <Trophy className="w-6 h-6 text-gold shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
                <div>
                  <h4 className="font-bold text-navy text-xs">Caso de Derecho {branch}</h4>
                  {a.cases?.description && (
                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 max-w-md">"{a.cases.description}"</p>
                  )}
                  {won && <p className="text-[11px] text-emerald-700 mt-1 font-semibold">¡Fuiste seleccionado! Revisa "Casos Asignados" para contactar al cliente.</p>}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${state.cls}`}>{state.label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ==========================================
// CASOS ASIGNADOS TAB (real + realtime)
// ==========================================
function CasosAsignados({ session, isDemo }: { session: Session; isDemo?: boolean }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (isDemo) { setMatches([]); setLoading(false); return; }
    const { data } = await supabase
      .from("matches")
      .select("*, cases(*, profiles(*))")
      .eq("lawyer_id", session.user.id)
      .order("matched_at", { ascending: false });
    setMatches(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (isDemo) return;
    const channel = supabase
      .channel("casos-asignados-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const whatsappUrl = (phone: string, branch: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Hola, soy tu abogado asignado en TuCaso para tu caso de Derecho de ${branch}. Coordinemos nuestra consulta.`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-navy">Casos Asignados y Ganados</h2>
        {!isDemo && (
          <span className="text-[10px] uppercase font-bold text-gray-400 inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            En vivo
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando casos asignados...</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Aún no tienes casos asignados. Cuando un cliente te elija, aparecerá aquí al instante.</p>
        </div>
      ) : (
        matches.map((m: any) => {
          const branch = m.cases?.suggested_branch || m.cases?.chosen_branch || "Sin clasificar";
          const clientName = m.cases?.profiles?.full_name || "Cliente";
          const clientPhone = m.cases?.profiles?.phone || "";
          return (
            <div key={m.case_id} className="bg-gradient-to-r from-emerald-900 to-navy text-white p-5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-gold" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Caso Ganado: Derecho de {branch}</h4>
                    <p className="text-[11px] text-white/80">Cliente: {clientName}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 font-bold px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">Asesoría Activa</span>
              </div>
              {m.cases?.description && (
                <p className="text-[11px] text-white/70 bg-white/10 p-3 rounded-xl border border-white/10">"{m.cases.description}"</p>
              )}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">Contacto del Cliente</span>
                  <span className="text-sm font-mono font-bold text-white">{clientPhone || "No disponible"}</span>
                </div>
                {clientPhone && (
                  <a
                    href={whatsappUrl(clientPhone, branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-400 text-navy font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 shrink-0"
                  >
                    <Send className="w-4 h-4" /> Contactar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function HeroAbogado() {
  return (
    <div className="bg-navy rounded-3xl text-white p-8 md:p-16 mb-12 relative overflow-hidden shadow-2xl border border-gold/30">
      <div className="relative z-10 max-w-3xl">
        <span className="bg-gold/20 text-gold text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-6 border border-gold/30">
          Para Abogados y Firmas en Colombia
        </span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
          Captura clientes listos para contratar con <span className="text-gold italic">TuCaso</span>.
        </h1>
        <p className="text-white/80 text-lg font-light leading-relaxed">
          Crea tu perfil profesional estilo LinkedIn, acredita tu Tarjeta Profesional CSJ y postúlate a casos en tiempo real.
        </p>
      </div>
    </div>
  );
}
