import React, { useState } from "react";
import {
  X, Save, User, FileText, GraduationCap, Shield, CheckCircle2, Loader2, AlertCircle, Camera, Upload
} from "lucide-react";
import { supabase, SPECIALTIES, type Lawyer, type Profile, type Specialty } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface ConfigurarPerfilModalProps {
  session: Session;
  lawyer: Lawyer;
  profile: Profile;
  onClose: () => void;
  onSaved: (updatedLawyer: Lawyer, updatedProfile: Profile) => void;
}

export default function ConfigurarPerfilModal({
  session,
  lawyer,
  profile,
  onClose,
  onSaved
}: ConfigurarPerfilModalProps) {
  // Profile fields
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [city, setCity] = useState(profile.city || "");

  // Lawyer fields
  const [headline, setHeadline] = useState(lawyer.headline || "");
  const [bio, setBio] = useState(lawyer.bio || "");
  const [experienceYears, setExperienceYears] = useState<number | "">(lawyer.experience_years ?? "");
  const [professionalCard, setProfessionalCard] = useState(lawyer.professional_card_number || "");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(lawyer.specialties || []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Profile image
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const toggleSpecialty = (spec: Specialty) => {
    setSelectedSpecialties(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);

    try {
      const userId = session.user.id;
      let profileImageUrl: string | null = null;

      // ── STEP 0: Upload profile image if selected ─────────────────────
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profile-images/${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(filePath, profileImageFile, { upsert: true });

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from("profiles")
          .getPublicUrl(filePath);

        profileImageUrl = publicUrl;
      }

      // ── STEP 1: Update profiles table (always works) ──────────────────
      const profileUpdate: any = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null
      };

      if (profileImageUrl) {
        profileUpdate.avatar_url = profileImageUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) throw profileError;

      // ── STEP 2: Build lawyer payload ───────────────────────────────────
      const fullPayload = {
        profile_id: userId,
        professional_card_number: professionalCard.trim(),
        specialties: selectedSpecialties,
        bio: bio.trim() || null,
        experience_years: experienceYears !== "" ? Number(experienceYears) : null,
        headline: headline.trim() || null
      };

      const basePayload = {
        professional_card_number: professionalCard.trim(),
        specialties: selectedSpecialties
      };

      // ── STEP 3: Try UPDATE first (works with strict RLS) ──────────────
      let savedWithNewCols = false;
      const { data: existingRow } = await supabase
        .from("lawyers")
        .select("profile_id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (existingRow) {
        // Row exists → UPDATE
        const { error: updateErr } = await supabase
          .from("lawyers")
          .update(fullPayload)
          .eq("profile_id", userId);

        if (updateErr) {
          const isMissingCol =
            updateErr.message?.includes("bio") ||
            updateErr.message?.includes("experience_years") ||
            updateErr.message?.includes("headline") ||
            updateErr.message?.includes("schema cache");

          if (isMissingCol) {
            // Columns don't exist yet — save base columns only
            const { error: baseUpdateErr } = await supabase
              .from("lawyers")
              .update(basePayload)
              .eq("profile_id", userId);
            if (baseUpdateErr) throw baseUpdateErr;
          } else {
            throw updateErr;
          }
        } else {
          savedWithNewCols = true;
        }
      } else {
        // Row doesn't exist → INSERT
        const { error: insertErr } = await supabase
          .from("lawyers")
          .insert(fullPayload);

        if (insertErr) {
          const isRLS = insertErr.message?.includes("row-level security") ||
            insertErr.message?.includes("violates");
          const isMissingCol =
            insertErr.message?.includes("bio") ||
            insertErr.message?.includes("experience_years") ||
            insertErr.message?.includes("headline") ||
            insertErr.message?.includes("schema cache");

          if (isMissingCol) {
            const { error: baseInsertErr } = await supabase
              .from("lawyers")
              .insert({ profile_id: userId, ...basePayload });
            if (baseInsertErr) throw baseInsertErr;
          } else if (isRLS) {
            throw new Error(
              "Permiso denegado por la política de seguridad de la base de datos (RLS).\n\n" +
              "Solución: abre el SQL Editor de tu Supabase Dashboard y ejecuta el archivo supabase_migration.sql que está en la raíz del proyecto.\n\n" +
              "URL directa: https://supabase.com/dashboard/project/lprxfcnhbanidurjagkk/sql/new"
            );
          } else {
            throw insertErr;
          }
        } else {
          savedWithNewCols = true;
        }
      }

      // ── STEP 4: Build return objects ───────────────────────────────────
      const updatedProfile: Profile = {
        ...profile,
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null
      };

      const updatedLawyer: Lawyer = {
        ...lawyer,
        professional_card_number: professionalCard.trim(),
        specialties: selectedSpecialties,
        bio: savedWithNewCols ? (bio.trim() || null) : lawyer.bio,
        experience_years: savedWithNewCols
          ? (experienceYears !== "" ? Number(experienceYears) : null)
          : lawyer.experience_years,
        headline: savedWithNewCols ? (headline.trim() || null) : lawyer.headline
      };

      if (!savedWithNewCols) {
        setError(
          "⚠️ Perfil parcialmente guardado (nombre, tarjeta y especialidades).\n" +
          "Para guardar la biografía, experiencia y headline, ejecuta supabase_migration.sql en tu Supabase SQL Editor."
        );
        setSaving(false);
        setTimeout(() => onSaved(updatedLawyer, updatedProfile), 2500);
        return;
      }

      setSaved(true);
      setTimeout(() => {
        onSaved(updatedLawyer, updatedProfile);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "No se pudo guardar el perfil. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gold/20 relative my-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy/90 text-white px-8 py-6 rounded-t-3xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gold uppercase font-bold tracking-widest block mb-1">
              Perfil Profesional
            </span>
            <h2 className="font-serif font-bold text-xl flex items-center gap-2">
              <User className="w-5 h-5 text-gold" /> Configurar mi Perfil de Abogado
            </h2>
            <p className="text-xs text-white/70 mt-1">
              Esta información será visible públicamente en tu perfil de TuCaso.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {/* SECCIÓN 1: Datos Personales */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
              <User className="w-4 h-4 text-gold" /> Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                  Nombre Completo <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Dra. Valentina Ospina Gómez"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                  Teléfono / Celular
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+57 310 987 6543"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Ciudad de Ejercicio</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Bogotá D.C."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                  Años de Experiencia <span className="text-gold">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={e => setExperienceYears(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="12"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 1.5: Foto de Perfil */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
              <Camera className="w-4 h-4 text-gold" /> Foto de Perfil
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Preview"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-gold shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-2">
                  Sube tu foto de perfil
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="profile-image-input"
                />
                <label
                  htmlFor="profile-image-input"
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition border border-gray-200"
                >
                  <Upload className="w-4 h-4" /> Seleccionar Imagen
                </label>
                <p className="text-[10px] text-gray-400 mt-2">JPG, PNG. Máximo 5MB.</p>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Tarjeta Profesional */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
              <Shield className="w-4 h-4 text-gold" /> Tarjeta Profesional CSJ
            </h3>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                Número de Tarjeta Profesional <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                value={professionalCard}
                onChange={e => setProfessionalCard(e.target.value)}
                placeholder="TP-312459-CSJ"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Este número será verificado y mostrado públicamente en tu perfil como garantía de autenticidad.
              </p>
            </div>
          </section>

          {/* SECCIÓN 3: Perfil Profesional */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
              <FileText className="w-4 h-4 text-gold" /> Perfil Profesional Público
            </h3>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                Título Profesional / Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                placeholder="Especialista en Derecho de Familia & Conciliaciones Intrafamiliares"
                maxLength={120}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition"
              />
              <p className="text-[10px] text-gray-400 mt-1">{headline.length}/120 caracteres</p>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                Biografía / Extracto Profesional <span className="text-gold">*</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                required
                rows={5}
                placeholder="Cuéntales a tus clientes sobre tu trayectoria, filosofía de práctica y en qué te especializas. Este texto aparecerá en la sección 'Acerca de mí' de tu perfil público."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">{bio.length} caracteres — Recomendado: 200–500 caracteres.</p>
            </div>
          </section>

          {/* SECCIÓN 4: Especialidades */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
              <GraduationCap className="w-4 h-4 text-gold" /> Especialidades Legales
            </h3>
            <p className="text-[11px] text-gray-500">
              Selecciona las áreas del derecho en las que te especializas. Estos son los filtros que usan los clientes al buscar abogados.
            </p>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(spec => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "bg-navy border-navy text-gold shadow-md scale-105"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gold/50"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-gold" />}
                    {spec}
                  </button>
                );
              })}
            </div>
            {selectedSpecialties.length === 0 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Selecciona al menos una especialidad.
              </p>
            )}
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-3.5 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedSpecialties.length === 0}
              className="flex-1 bg-navy hover:bg-gold hover:text-navy text-white font-bold text-xs py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> ¡Perfil Guardado!</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar Perfil</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
