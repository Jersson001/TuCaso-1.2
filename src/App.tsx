import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Scale, MapPin, LogOut, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase, type Profile, type Lawyer } from "./lib/supabase";
import ClientePortal from "./components/ClientePortal";
import AbogadoPortal from "./components/AbogadoPortal";
import AdminPortal from "./components/AdminPortal";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"cliente" | "abogado" | "admin">("cliente");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setLawyer(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      setProfile(profileData);

      if (profileData?.role === "lawyer") setCurrentTab("abogado");
      else if (profileData?.role === "admin") setCurrentTab("admin");
      else setCurrentTab("cliente");

      if (profileData?.role === "lawyer") {
        const { data: lawyerData } = await supabase
          .from("lawyers")
          .select("*")
          .eq("profile_id", session.user.id)
          .maybeSingle();
        if (!cancelled) setLawyer(lawyerData);
      } else {
        setLawyer(null);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <p className="text-xs text-gray-400">Cargando TuCaso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-dark flex flex-col font-sans selection:bg-gold selection:text-navy">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-navy text-white py-4 px-6 border-b border-gold/20 backdrop-blur-md bg-opacity-95 shadow-md">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-gold animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-display font-bold tracking-[0.2em] uppercase text-white">
                TuCaso
              </span>
              <span className="text-[9px] font-sans text-gold uppercase tracking-[0.15em] -mt-1 font-semibold">
                Marketplace de Abogados de Colombia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setCurrentTab("cliente")}
              className={`px-4 py-2 text-xs md:text-sm font-sans tracking-wide rounded-full transition-all duration-300 ${
                currentTab === "cliente"
                  ? "bg-gold text-navy font-semibold shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Soy Cliente
            </button>
            <button
              onClick={() => setCurrentTab("abogado")}
              className={`px-4 py-2 text-xs md:text-sm font-sans tracking-wide rounded-full transition-all duration-300 ${
                currentTab === "abogado"
                  ? "bg-gold text-navy font-semibold shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Soy Abogado
            </button>
            {profile?.role === "admin" && (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`px-4 py-2 text-xs md:text-sm font-sans tracking-wide rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                  currentTab === "admin"
                    ? "bg-gold text-navy font-semibold shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </button>
            )}
            {session && (
              <button
                onClick={() => supabase.auth.signOut()}
                title="Cerrar sesión"
                className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Areas */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            {currentTab === "cliente" && <ClientePortal session={session} profile={profile} />}
            {currentTab === "abogado" && <AbogadoPortal session={session} profile={profile} lawyer={lawyer} />}
            {currentTab === "admin" && session && profile?.role === "admin" && (
              <AdminPortal session={session} profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Sophisticated Footer */}
      <footer className="bg-navy text-white pt-20 pb-10 border-t border-gold/30">
        <div className="max-w-screen-2xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-10 h-10 text-gold" />
              <span className="text-2xl font-display font-bold tracking-[0.2em] uppercase">TuCaso</span>
            </div>
            <p className="text-white/70 text-sm max-w-md leading-relaxed mb-6 font-light">
              La plataforma inteligente para conectar clientes con abogados verificados en Colombia.
              Publica tu caso, recibe postulaciones de especialistas verificados y elige con quién trabajar.
            </p>
            <div className="flex items-center gap-2 text-xs text-gold font-medium bg-gold/10 px-4 py-2 rounded-lg inline-block">
              <MapPin className="w-4 h-4" /> Zona Piloto Activa: Bogotá D.C.
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.2em] text-gold mb-6">Información Legal</h4>
            <p className="text-white/50 text-xs leading-relaxed font-light mb-4">
              <strong>Aviso Importante:</strong> TuCaso es un marketplace de intermediación y un canal de contacto tecnológico. No brindamos asesoría jurídica directa ni emitimos juicios de valor legales sobre los casos de los usuarios.
            </p>
            <p className="text-white/50 text-xs leading-relaxed font-light">
              Toda consulta jurídica se realiza exclusivamente por los abogados matriculados ante el Consejo Superior de la Judicatura de Colombia.
            </p>
          </div>

          <div>
            <h4 className="font-display text-xs uppercase tracking-[0.2em] text-gold mb-6">Soporte e Integraciones</h4>
            <ul className="space-y-3 text-xs text-white/75 font-light">
              <li>• Diagnóstico legal preliminar con IA</li>
              <li>• Postulación y selección de abogados verificados</li>
              <li>• Verificación de Tarjeta Profesional por un administrador de TuCaso</li>
              <li>• Términos de Servicio y Privacidad de Datos</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} TuCaso. Diseñado para la comunidad legal y empresarial de Colombia.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-gold transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-gold transition-colors">Política de Datos</a>
            <a href="#" className="hover:text-gold transition-colors">Ética Profesional</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
