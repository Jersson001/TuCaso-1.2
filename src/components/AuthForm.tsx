import React, { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase, SPECIALTIES, CITIES } from "../lib/supabase";

interface AuthFormProps {
  role: "client" | "lawyer";
  title: string;
  subtitle: string;
}

export default function AuthForm({ role, title, subtitle }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<string>(CITIES[0]);
  const [professionalCard, setProfessionalCard] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const toggleSpecialty = (spec: string) => {
    setSpecialties(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        if (role === "lawyer" && (!professionalCard || specialties.length === 0)) {
          throw new Error("Ingresa tu tarjeta profesional y selecciona al menos una especialidad.");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: fullName,
              phone,
              city,
              ...(role === "lawyer" ? { professional_card_number: professionalCard, specialties } : {})
            }
          }
        });
        if (signUpError) throw signUpError;

        if (data.user) {
          const userId = data.user.id;

          // Crear perfil en la tabla profiles
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              role,
              full_name: fullName.trim() || null,
              phone: phone.trim() || null,
              city: city.trim() || null
            });

          if (profileError && !profileError.message?.includes("duplicate")) {
            console.error("Error creando profile:", profileError);
          }

          // Si es abogado, crear registro limpio en la tabla lawyers
          if (role === "lawyer") {
            const { error: lawyerError } = await supabase
              .from("lawyers")
              .insert({
                profile_id: userId,
                professional_card_number: professionalCard.trim(),
                specialties: specialties,
                verification_status: "pending",
                subscription_status: "active"
              });

            if (lawyerError && !lawyerError.message?.includes("duplicate")) {
              console.error("Error creando lawyer:", lawyerError);
            }
          }
        }

        if (!data.session) {
          setInfo("¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.");
          setMode("login");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-lg mx-auto">
      <h3 className="font-serif text-2xl font-bold text-navy mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-6">{subtitle}</p>

      <div className="flex bg-gray-50 rounded-xl p-1 mb-6 border border-gray-100">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); setInfo(null); }}
          className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
            mode === "login" ? "bg-navy text-gold shadow-sm" : "text-gray-500"
          }`}
        >
          <LogIn className="w-4 h-4" /> Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
          className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 ${
            mode === "signup" ? "bg-navy text-gold shadow-sm" : "text-gray-500"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Registrarme
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {info && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        {mode === "signup" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Celular</label>
                <input
                  type="text"
                  required
                  placeholder="+57 3..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Ciudad</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {role === "lawyer" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Tarjeta Profesional (CSJ)</label>
                  <input
                    type="text"
                    required
                    placeholder="TP-98765-COL"
                    value={professionalCard}
                    onChange={(e) => setProfessionalCard(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Especialidades</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SPECIALTIES.map(spec => {
                      const active = specialties.includes(spec);
                      return (
                        <button
                          type="button"
                          key={spec}
                          onClick={() => toggleSpecialty(spec)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${
                            active ? "bg-navy text-gold" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white hover:bg-gold hover:text-navy transition font-bold py-3.5 rounded-xl text-xs shadow-md mt-2 disabled:opacity-60"
        >
          {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Completar Registro"}
        </button>
      </form>
    </div>
  );
}
