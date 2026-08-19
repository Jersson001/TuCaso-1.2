import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { supabase, type Profile } from "../lib/supabase";

interface AdminPortalProps {
  session: Session;
  profile: Profile;
}

interface LawyerRow {
  profile_id: string;
  professional_card_number: string;
  verification_status: string;
  specialties: string[];
  subscription_status: string;
  profiles: Profile;
}

export default function AdminPortal({ session, profile }: AdminPortalProps) {
  const [lawyers, setLawyers] = useState<LawyerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lawyers")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });
    setLawyers((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (profileId: string, patch: Record<string, any>) => {
    setBusyId(profileId);
    await supabase.from("lawyers").update(patch).eq("profile_id", profileId);
    await load();
    setBusyId(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="bg-gold/10 text-navy text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-2 mb-4 border border-gold/30">
            <ShieldCheck className="w-4 h-4" /> Panel de Administración
          </span>
          <h1 className="text-3xl font-serif font-bold text-navy">Verificación de Abogados</h1>
          <p className="text-xs text-gray-500 mt-1">Conectado como {profile.full_name || session.user.email}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="bg-navy hover:bg-navy/95 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-gold/30 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gold" /> Actualizar
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : lawyers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-xs text-gray-500">Todavía no hay abogados registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
          {lawyers.map(l => (
            <div key={l.profile_id} className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <p className="font-bold text-navy text-sm">{l.profiles?.full_name || "Sin nombre"}</p>
                <p className="text-xs text-gray-500">{l.profiles?.city} · {l.professional_card_number}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {l.specialties.map(s => (
                    <span key={s} className="bg-navy/5 text-navy text-[10px] font-semibold px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    l.verification_status === "verified" ? "bg-emerald-50 text-emerald-700" :
                    l.verification_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}>{l.verification_status}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    l.subscription_status === "active" ? "bg-navy/5 text-navy" : "bg-gray-100 text-gray-500"
                  }`}>suscripción {l.subscription_status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <button
                  disabled={busyId === l.profile_id}
                  onClick={() => update(l.profile_id, { verification_status: "verified" })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Verificar
                </button>
                <button
                  disabled={busyId === l.profile_id}
                  onClick={() => update(l.profile_id, { verification_status: "rejected" })}
                  className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  disabled={busyId === l.profile_id}
                  onClick={() => update(l.profile_id, { subscription_status: "active", subscription_renewed_at: new Date().toISOString() })}
                  className="bg-gold hover:bg-gold/90 text-navy text-[10px] font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Activar Suscripción
                </button>
                <button
                  disabled={busyId === l.profile_id}
                  onClick={() => update(l.profile_id, { subscription_status: "expired" })}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                >
                  Desactivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
