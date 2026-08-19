import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Sparkles, Send, Check, Briefcase, Users, Star, MapPin, Phone,
  AlertCircle, LogOut, RefreshCw, ShieldCheck, MessageCircle
} from "lucide-react";
import { supabase, type Profile, type Case, type ApplicationWithLawyer, type Match } from "../lib/supabase";
import AuthForm from "./AuthForm";
import DirectorioAbogados from "./DirectorioAbogados";
import LoopCalificacionModal from "./LoopCalificacionModal";

interface ClientePortalProps {
  session: Session | null;
  profile: Profile | null;
}

export default function ClientePortal({ session: initialSession, profile }: ClientePortalProps) {
  const [subTab, setSubTab] = useState<"nuevo" | "casos">("nuevo");
  const [demoMode, setDemoMode] = useState(false);
  const [demoCases, setDemoCases] = useState<Case[]>([]);

  const session = initialSession || (demoMode ? ({ user: { id: "demo-user-id" } } as any) : null);

  const handleDemoPublish = (area: string, description: string) => {
    const newCase: Case = {
      id: `demo-case-${Date.now()}`,
      client_id: "demo-user-id",
      description,
      suggested_branch: area,
      chosen_branch: area,
      status: "open",
      created_at: new Date().toISOString()
    };
    setDemoCases([newCase]);
    setSubTab("casos");
  };

  if (!session) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <HeroCliente />
        <div className="bg-gradient-to-r from-navy to-navy/90 text-white p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-gold/30 shadow-lg">
          <div>
            <h4 className="font-serif font-bold text-gold text-lg mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> ¿Deseas probar el Chatbot IA de inmediato?
            </h4>
            <p className="text-white/80 text-xs">
              Haz clic abajo para iniciar el diagnóstico con Inteligencia Artificial sin necesidad de iniciar sesión.
            </p>
          </div>
          <button
            onClick={() => setDemoMode(true)}
            className="bg-gold text-navy font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:bg-white transition flex-shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Probar Chatbot con IA
          </button>
        </div>
        <AuthForm
          role="client"
          title="Accede a tu cuenta de Cliente"
          subtitle="Inicia sesión o regístrate para describir tu caso y recibir postulaciones de abogados verificados."
        />
      </div>
    );
  }

  if (profile && profile.role !== "client") {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <RoleMismatch role={profile.role} />
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-12">
      <HeroCliente />

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setSubTab("nuevo")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            subTab === "nuevo" ? "bg-navy text-gold" : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          Nuevo Caso
        </button>
        <button
          onClick={() => setSubTab("casos")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            subTab === "casos" ? "bg-navy text-gold" : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          Mis Casos {demoCases.length > 0 && <span className="ml-1 bg-gold text-navy rounded-full px-1.5 py-0.5 text-[10px]">{demoCases.length}</span>}
        </button>
      </div>

      {subTab === "nuevo" ? (
        <NuevoCaso session={session} onCreated={() => setSubTab("casos")} onDemoPublish={handleDemoPublish} />
      ) : (
        <MisCasos session={session} demoCases={demoCases} onDemoCasesChange={setDemoCases} />
      )}
    </div>
  );
}

function HeroCliente() {
  return (
    <div className="bg-navy rounded-3xl text-white p-8 md:p-16 mb-12 relative overflow-hidden shadow-2xl border border-gold/30">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gold/10 -skew-x-12 transform translate-x-1/4 hidden lg:block" />
      <div className="relative z-10 max-w-3xl">
        <span className="bg-gold/20 text-gold text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-6 border border-gold/30">
          Inteligencia Artificial + Abogados de Confianza
        </span>
        <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6">
          Describe tu caso en <span className="text-gold italic">lenguaje sencillo</span>.
        </h1>
        <p className="text-white/80 text-lg md:text-xl font-light leading-relaxed">
          Publica tu caso, nuestra IA lo clasifica, y los abogados verificados con la especialidad correcta se postulan para ayudarte. Tú eliges con quién trabajar.
        </p>
      </div>
    </div>
  );
}

export function RoleMismatch({ role }: { role: string }) {
  const roleLabel = role === "lawyer" ? "Abogado" : role === "admin" ? "Administrador" : "Cliente";
  return (
    <div className="bg-white border border-dashed border-gray-200 p-12 rounded-3xl text-center max-w-lg mx-auto">
      <AlertCircle className="w-10 h-10 text-gold mx-auto mb-4" />
      <h3 className="font-serif font-bold text-navy text-lg mb-2">Esta cuenta es de tipo {roleLabel}</h3>
      <p className="text-xs text-gray-500 mb-6">Cierra sesión desde el menú superior para entrar con otra cuenta.</p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="bg-navy hover:bg-gold hover:text-navy text-white text-xs font-bold px-6 py-3 rounded-xl transition inline-flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Cerrar Sesión
      </button>
    </div>
  );
}

function FormattedMessage({ text, isUser }: { text: string; isUser: boolean }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className={`font-bold ${isUser ? "text-gold" : "text-navy"}`}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </span>
  );
}

function TypewriterMessage({
  text,
  isUser,
  animate = false,
  speed = 18,
}: {
  text: string;
  isUser: boolean;
  animate?: boolean;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text);
  const [isTyping, setIsTyping] = useState(animate);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        index++;
        setDisplayedText(text.slice(0, index));
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, animate, speed]);

  return (
    <span className="relative">
      <FormattedMessage text={displayedText} isUser={isUser} />
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 bg-gold ml-1 animate-pulse align-middle rounded-sm" />
      )}
    </span>
  );
}

const INITIAL_WELCOME = "¡Hola! Bienvenido a TuCaso Colombia. Cuéntame con tus propias palabras qué inconveniente o situación legal estás afrontando.";

// ==========================================
// NUEVO CASO (AI Chat Diagnostics + Publish)
// ==========================================
function NuevoCaso({ session, onCreated, onDemoPublish }: { session: Session; onCreated: () => void; onDemoPublish?: (area: string, description: string) => void }) {
  // ── Persistencia contra recargas (localStorage) ──
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(() => {
    try {
      const saved = localStorage.getItem("tucaso_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading chat messages from localStorage", e);
    }
    return [{ role: "assistant", content: INITIAL_WELCOME }];
  });

  const [input, setInput] = useState<string>(() => {
    try {
      return localStorage.getItem("tucaso_chat_input") || "";
    } catch (e) {
      return "";
    }
  });

  const [ramaLegal, setRamaLegal] = useState<string | null>(() => {
    try {
      return localStorage.getItem("tucaso_chat_rama_legal") || null;
    } catch (e) {
      return null;
    }
  });

  // Animación typewriter (índice del mensaje a animar; 0 en primera visita)
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem("tucaso_chat_messages");
      return !saved ? 0 : null;
    } catch (e) {
      return 0;
    }
  });

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectorioModal, setShowDirectorioModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efectos de sincronización con localStorage
  useEffect(() => {
    try {
      localStorage.setItem("tucaso_chat_messages", JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("tucaso_chat_input", input);
    } catch (e) {}
  }, [input]);

  useEffect(() => {
    try {
      if (ramaLegal) {
        localStorage.setItem("tucaso_chat_rama_legal", ramaLegal);
      } else {
        localStorage.removeItem("tucaso_chat_rama_legal");
      }
    } catch (e) {}
  }, [ramaLegal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const resetChat = () => {
    try {
      localStorage.removeItem("tucaso_chat_messages");
      localStorage.removeItem("tucaso_chat_input");
      localStorage.removeItem("tucaso_chat_rama_legal");
    } catch (e) {}
    setMessages([{ role: "assistant", content: INITIAL_WELCOME }]);
    setInput("");
    setRamaLegal(null);
    setAnimatingIndex(0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await response.json();

      // El Agente de Triage devuelve rama_legal (o null) y respuesta_chat.
      if (data.rama_legal) {
        setRamaLegal(data.rama_legal);
      }
      const reply = data.respuesta_chat || "Cuéntame un poco más sobre tu situación para orientarte mejor.";
      setMessages(prev => {
        const next = [...prev, { role: "assistant" as const, content: reply }];
        setAnimatingIndex(next.length - 1);
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const next = [...prev, { role: "assistant" as const, content: "Disculpa, tuve problemas para conectar. Cuéntame más sobre tu situación." }];
        setAnimatingIndex(next.length - 1);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const publishCase = async () => {
    setPublishing(true);
    setError(null);
    try {
      const description = messages.filter(m => m.role === "user").map(m => m.content).join("\n");
      if (session.user.id === "demo-user-id") {
        // Demo mode: store locally and navigate to Mis Casos with the new case
        onDemoPublish?.(ramaLegal || "Familia", description || "Caso de demostración publicado en TuCaso.");
        resetChat();
        setPublishing(false);
        return;
      }
      const { error: insertError } = await supabase.from("cases").insert({
        client_id: session.user.id,
        description,
        suggested_branch: ramaLegal ?? null
      });
      if (insertError) throw insertError;
      resetChat();
      onCreated();
    } catch (err: any) {
      setError(err.message || "No pudimos publicar tu caso.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gold/40 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-gray-100 rounded-2xl flex flex-col bg-gray-50 h-[520px]">
            {/* Header del Chat */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 rounded-t-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">Asistente de Triage Inteligente</span>
              </div>
              <button
                onClick={resetChat}
                type="button"
                title="Reiniciar conversación"
                className="text-[11px] text-gray-400 hover:text-navy transition flex items-center gap-1 hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-transparent hover:border-gray-200"
              >
                <RefreshCw className="w-3 h-3" /> Reiniciar Chat
              </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    m.role === "user" ? "bg-navy text-white rounded-br-none" : "bg-white text-dark shadow-sm border border-gray-100 rounded-bl-none"
                  }`}>
                    <TypewriterMessage
                      text={m.content}
                      isUser={m.role === "user"}
                      animate={m.role === "assistant" && i === animatingIndex}
                    />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 text-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-navy rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 rounded-b-2xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe tu caso..."
                className="flex-grow px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gold text-sm"
              />
              <button type="submit" className="bg-navy hover:bg-gold hover:text-navy text-white p-3.5 rounded-xl transition flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="border border-gray-100 bg-white p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-navy font-bold uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                <Sparkles className="w-4 h-4 text-gold" /> Clasificación en tiempo real
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Especialidad Identificada</span>
                  <div className="mt-1">
                    {ramaLegal ? (
                      <span className="bg-navy text-gold font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
                        <Check className="w-4 h-4 text-gold" /> Derecho {ramaLegal}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Detectando área...</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Abogado Sugerido</span>
                  <div className="mt-1">
                    {ramaLegal ? (
                      <div className="bg-gold/10 border border-gold/30 text-navy font-semibold text-xs p-2.5 rounded-xl flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gold shrink-0" />
                        <span>Especialista en Derecho de {ramaLegal}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic block mt-1">Pendiente de clasificación...</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Tu descripción</span>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-24 overflow-y-auto">
                    {messages.filter(m => m.role === "user").map(m => m.content).join(" ") || "Escribe tu situación en el chat para clasificar tu caso."}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-2">{error}</div>
              )}

              {/* Opción 1: Publicar Caso */}
              <button
                onClick={publishCase}
                disabled={!ramaLegal || publishing}
                className="w-full bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs py-3 rounded-xl transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? "Publicando..." : ramaLegal ? `1️⃣ Publicar Caso a Abogados de ${ramaLegal}` : "Publicar Caso a Abogados"}
              </button>

              {/* Opción 2: Ver Abogados Mejor Calificados */}
              <button
                onClick={() => setShowDirectorioModal(true)}
                disabled={!ramaLegal}
                className="w-full bg-navy text-gold hover:bg-gold hover:text-navy font-bold text-xs py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                {ramaLegal ? `2️⃣ Ver Abogados de ${ramaLegal} Mejor Calificados` : "Ver Abogados Mejor Calificados"}
              </button>

              {!ramaLegal && (
                <p className="text-[10px] text-gray-400 text-center mt-1">Sigue chateando hasta que el Agente de Triage identifique la rama legal.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Sección de Directorio de Abogados */}
      {showDirectorioModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-6xl w-full">
            <DirectorioAbogados
              initialSpecialty={ramaLegal || undefined}
              onClose={() => setShowDirectorioModal(false)}
            />
          </div>
        </div>
      )}

      {/* Directorio embebido al final para explorar siempre */}
      <div className="pt-8">
        <DirectorioAbogados initialSpecialty={ramaLegal || undefined} />
      </div>
    </div>
  );
}

// ==========================================
// MIS CASOS
// ==========================================
function MisCasos({ session, demoCases = [], onDemoCasesChange }: { session: Session; demoCases?: Case[]; onDemoCasesChange?: (cases: Case[]) => void }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const isDemo = session.user.id === "demo-user-id";

  const fetchCases = async () => {
    if (isDemo) {
      setCases(demoCases);
      if (demoCases.length > 0 && !activeCase) {
        setActiveCase(demoCases[0]);
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("cases")
      .select("*")
      .eq("client_id", session.user.id)
      .order("created_at", { ascending: false });
    setCases(data ?? []);
    setLoading(false);
  };

  // Auto-refresh when demoCases change (e.g. a new demo case was published)
  useEffect(() => {
    fetchCases();
  }, [demoCases]);

  const handleDemoCaseUpdate = (updatedCase: Case) => {
    const updated = demoCases.map(c => c.id === updatedCase.id ? updatedCase : c);
    onDemoCasesChange?.(updated);
    setActiveCase(updatedCase);
  };

  const allCases = isDemo ? demoCases : cases;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-serif font-bold text-navy text-lg">Tus Casos</h3>
          {!isDemo && (
            <button onClick={fetchCases} className="text-gray-400 hover:text-navy">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-gray-400">Cargando...</p>
        ) : allCases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Aún no has publicado ningún caso.</p>
          </div>
        ) : (
          allCases.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCase(c)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                activeCase?.id === c.id ? "bg-navy text-white border-gold shadow-md" : "bg-white text-dark border-gray-100 hover:border-gold/50 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-xs">Derecho {c.suggested_branch || "Sin clasificar"}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-[10px] opacity-70 line-clamp-2">{c.description}</p>
            </button>
          ))
        )}
      </div>

      <div className="lg:col-span-2">
        {activeCase ? (
          <CaseDetail
            key={activeCase.id}
            caseItem={activeCase}
            session={session}
            onChanged={isDemo ? () => fetchCases() : fetchCases}
            onDemoCaseUpdate={isDemo ? handleDemoCaseUpdate : undefined}
          />
        ) : (
          <div className="bg-white border border-dashed border-gray-200 p-12 rounded-3xl text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-serif font-bold text-navy text-lg mb-2">Selecciona un caso</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">Elige un caso de la lista para ver postulantes o el abogado asignado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-amber-100 text-amber-800",
    matched: "bg-emerald-100 text-emerald-700",
    closed: "bg-blue-100 text-blue-800"
  };
  const labels: Record<string, string> = { open: "🟡 Abierto", matched: "✅ Asignado", closed: "🔵 Cerrado" };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
}

function CaseDetail({ caseItem, session, onChanged, onDemoCaseUpdate }: { caseItem: Case; session: Session; onChanged: () => void; onDemoCaseUpdate?: (updated: Case) => void }) {
  const [applicants, setApplicants] = useState<ApplicationWithLawyer[]>([]);
  const [match, setMatch] = useState<Match & { lawyers: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedLawyerMatched, setSelectedLawyerMatched] = useState<{
    name: string;
    phone: string;
    avatar: string;
    csj: string;
    branch: string;
  } | null>(null);
  const [stats, setStats] = useState<Record<string, { avg_rating: number; ratings_count: number; cases_count: number }>>({});
  const [sortBy, setSortBy] = useState<"rating" | "cases" | "experience">("rating");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mockApplicantsList = [
    {
      id: "app-demo-1",
      lawyer_id: "lawyer-1",
      lawyers: {
        profile_id: "lawyer-1",
        professional_card_number: "TP-312459-CSJ",
        specialties: ["Derecho de Familia", "Violencia Intrafamiliar"],
        profiles: {
          full_name: "Dra. Valentina Ospina Gómez",
          city: "Bogotá D.C.",
          phone: "+57 310 987 6543"
        }
      },
      proposal: "Estimado cliente, revisé tu caso sobre Derecho de Familia. Cuento con 12 años de trayectoria y tarjeta profesional CSJ verificada para ofrecerte conciliación y solución jurídica inmediata.",
      rating: 4.9,
      experienceYears: 12,
      casesWon: 64,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "app-demo-2",
      lawyer_id: "lawyer-7",
      lawyers: {
        profile_id: "lawyer-7",
        professional_card_number: "TP-389102-CSJ",
        specialties: ["Derecho de Familia", "Sucesiones y Herencias"],
        profiles: {
          full_name: "Dr. Santiago Gutiérrez Castro",
          city: "Medellín",
          phone: "+57 300 456 7890"
        }
      },
      proposal: "Hola, me especializo en derecho de familia y convenios de custodia de menores. Te acompaño en todo el proceso de mediación.",
      rating: 4.8,
      experienceYears: 10,
      casesWon: 48,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
    }
  ];

  const isDemo = session.user.id === "demo-user-id";

  const load = async () => {
    setError(null);
    if (caseItem.status === "open") {
      // Modo demo: postulantes de ejemplo. Modo real: solo postulaciones reales.
      if (isDemo) {
        setApplicants(mockApplicantsList as any);
        return;
      }
      const { data } = await supabase
        .from("applications")
        .select("*, lawyers(*, profiles(*))")
        .eq("case_id", caseItem.id)
        .order("created_at", { ascending: false });
      const rows = (data as any) ?? [];
      setApplicants(rows);

      // Estadísticas públicas de reputación (calificación y casos ganados)
      const ids = rows.map((a: any) => a.lawyer_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: statsData } = await supabase.rpc("lawyer_public_stats", { p_lawyer_ids: ids });
        const map: Record<string, any> = {};
        (statsData ?? []).forEach((s: any) => {
          map[s.lawyer_id] = {
            avg_rating: Number(s.avg_rating) || 0,
            ratings_count: Number(s.ratings_count) || 0,
            cases_count: Number(s.cases_count) || 0
          };
        });
        setStats(map);
      }
    } else {
      if (isDemo) {
        setSelectedLawyerMatched({
          name: "Dra. Valentina Ospina Gómez",
          phone: "+57 310 987 6543",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
          csj: "TP-312459-CSJ",
          branch: caseItem.suggested_branch || "Familia"
        });
        return;
      }
      const { data } = await supabase
        .from("matches")
        .select("*, lawyers(*, profiles(*))")
        .eq("case_id", caseItem.id)
        .maybeSingle();
      if (data) setMatch(data as any);
    }
  };

  useEffect(() => {
    load();

    if (isDemo) return;

    // Realtime: nuevas postulaciones o un match hecho se reflejan al instante.
    const channel = supabase
      .channel(`case-detail-rt-${caseItem.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications", filter: `case_id=eq.${caseItem.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `case_id=eq.${caseItem.id}` }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseItem.id, caseItem.status]);

  const chooseLawyerMatch = async (lawyerObj: any) => {
    setBusy(true);
    setError(null);
    try {
      const lawyerId = lawyerObj.lawyer_id || lawyerObj.lawyers?.profile_id;
      const lawyerName = lawyerObj.lawyers?.profiles?.full_name || "Abogado/a";
      const lawyerPhone = lawyerObj.lawyers?.profiles?.phone || "";
      const avatar = lawyerObj.avatar || lawyerObj.lawyers?.profiles?.avatar_url || "";
      const csj = lawyerObj.lawyers?.professional_card_number || "TP pendiente";

      if (!isDemo) {
        if (!lawyerId) throw new Error("No se pudo identificar al abogado seleccionado.");
        const { error: matchErr } = await supabase.from("matches").insert({ case_id: caseItem.id, lawyer_id: lawyerId });
        if (matchErr) throw matchErr;
        const { error: updErr } = await supabase.from("cases").update({ status: "matched" }).eq("id", caseItem.id);
        if (updErr) throw updErr;
      }

      const updatedStatus = { ...caseItem, status: "matched" as Case["status"] };
      caseItem.status = "matched";

      setSelectedLawyerMatched({
        name: lawyerName,
        phone: lawyerPhone,
        avatar,
        csj,
        branch: caseItem.suggested_branch || "Familia"
      });

      // Update sidebar badge immediately in demo mode
      onDemoCaseUpdate?.(updatedStatus);
      onChanged();
    } catch (err: any) {
      setError(err.message || "No se pudo realizar el Match directo.");
    } finally {
      setBusy(false);
    }
  };

  const getWhatsAppUrl = (phone: string, lawyerName: string, area: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(`Hola ${lawyerName}, te contacté por TuCaso para mi problema de Derecho de ${area}. Quisiera coordinar nuestra consulta.`);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // Helpers de reputación (datos reales de la RPC, con fallback a datos demo)
  const getRating = (a: any) => stats[a.lawyer_id]?.avg_rating ?? a.rating ?? 0;
  const getCases = (a: any) => stats[a.lawyer_id]?.cases_count ?? a.casesWon ?? 0;
  const getExp = (a: any) => a.lawyers?.experience_years ?? a.experienceYears ?? 0;

  const sortedApplicants = [...applicants].sort((x: any, y: any) => {
    if (sortBy === "cases") return getCases(y) - getCases(x);
    if (sortBy === "experience") return getExp(y) - getExp(x);
    return getRating(y) - getRating(x);
  });

  return (
    <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="flex justify-between items-start border-b border-gray-100 pb-4">
        <div>
          <span className="text-[9px] bg-navy text-gold font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Derecho {caseItem.suggested_branch || "Sin clasificar"}
          </span>
          <h3 className="font-serif font-bold text-2xl text-navy mt-2">Caso #{caseItem.id.slice(0, 8)}</h3>
        </div>
        <StatusBadge status={caseItem.status} />
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción del Requerimiento</h4>
        <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 font-light">
          "{caseItem.description}"
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">{error}</div>}

      {/* 1. BANDEJA DE POSTULANTES */}
      {caseItem.status === "open" && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              {applicants.length === 0
                ? "Postulantes"
                : `${applicants.length} ${applicants.length === 1 ? "abogado se postuló" : "abogados se postularon"}`}
            </h4>
            {applicants.length > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Ordenar por:</span>
                {([
                  { key: "rating", label: "Calificación" },
                  { key: "cases", label: "Casos" },
                  { key: "experience", label: "Experiencia" }
                ] as const).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${
                      sortBy === opt.key ? "bg-navy text-gold" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {applicants.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Aún no hay abogados postulados a este caso.</p>
              <p className="text-[10px] text-gray-400 mt-1">Los abogados verán tu caso y se postularán aquí en tiempo real.</p>
            </div>
          ) : (
          <div className="space-y-4">
            {sortedApplicants.map((a: any) => {
              const lawyerName = a.lawyers?.profiles?.full_name || "Abogado/a";
              const lawyerCity = a.lawyers?.profiles?.city || "Colombia";
              const lawyerPhone = a.lawyers?.profiles?.phone || "";
              const csjCard = a.lawyers?.professional_card_number || "TP pendiente";
              const rating = getRating(a);
              const ratingsCount = stats[a.lawyer_id]?.ratings_count ?? 0;
              const casesWon = getCases(a);
              const exp = getExp(a);
              const avatar = a.avatar || a.lawyers?.profiles?.avatar_url || null;
              const proposalText = a.proposal || "El abogado no adjuntó mensaje de presentación.";
              const bio = a.lawyers?.bio || null;
              const headline = a.lawyers?.headline || null;
              const specialties: string[] = a.lawyers?.specialties || [];
              const expanded = expandedId === a.id;

              return (
                <div key={a.id} className="bg-white border border-gray-200 hover:border-gold/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                  {/* Quick Decision Info Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={lawyerName}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-gold/40 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl border-2 border-gold/40 shadow-sm shrink-0 bg-navy flex items-center justify-center text-gold text-xl font-serif font-bold">
                          {lawyerName.trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {csjCard}
                        </span>
                        <h4 className="font-serif font-bold text-navy text-sm">{lawyerName}</h4>
                        {headline && <p className="text-[11px] text-navy/70 font-medium">{headline}</p>}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className={`w-3.5 h-3.5 ${rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                            {rating ? `${rating} (${ratingsCount})` : "Sin reseñas"}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-navy">
                            <Briefcase className="w-3.5 h-3.5 text-gold" /> {casesWon} casos
                          </span>
                          {exp > 0 && <span>• {exp} años exp.</span>}
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" /> {lawyerCity}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Written Proposal Snippet */}
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-600 font-light leading-relaxed">
                    <span className="font-semibold text-navy block mb-1">Propuesta del Abogado:</span>
                    "{proposalText}"
                  </div>

                  {/* Expandable full profile */}
                  {expanded && (
                    <div className="bg-navy/5 p-4 rounded-2xl border border-navy/10 space-y-3 animate-fade-in">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Acerca del abogado</span>
                        <p className="text-xs text-gray-700 leading-relaxed">{bio || "Este abogado aún no ha agregado su extracto profesional."}</p>
                      </div>
                      {specialties.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Especialidades</span>
                          <div className="flex flex-wrap gap-1.5">
                            {specialties.map(s => (
                              <span key={s} className="bg-navy text-gold text-[10px] font-bold px-2.5 py-1 rounded-lg">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setExpandedId(expanded ? null : a.id)}
                      className="flex-1 bg-white hover:bg-gray-50 text-navy border border-gray-200 text-xs font-bold px-4 py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4 text-gold" /> {expanded ? "Ocultar perfil" : "Ver perfil completo"}
                    </button>
                    {lawyerPhone ? (
                      <a
                        href={getWhatsAppUrl(lawyerPhone, lawyerName, caseItem.suggested_branch || "su área")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { if (!busy) chooseLawyerMatch(a); }}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-navy font-extrabold text-xs px-4 py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4 fill-navy text-emerald-500" /> Elegir y Contactar por WhatsApp
                      </a>
                    ) : (
                      <button
                        onClick={() => chooseLawyerMatch(a)}
                        disabled={busy}
                        className="flex-1 bg-navy hover:bg-gold hover:text-navy text-white text-xs font-bold px-4 py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 text-gold" /> Elegir este Abogado
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* 2 & 3. MATCH DIRECTO & CANAL DE COMUNICACIÓN WHATSAPP */}
      {(caseItem.status === "matched" || caseItem.status === "closed") && (
        <div className="space-y-6 pt-2">
          {/* Active Connection Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-navy text-white rounded-3xl p-6 shadow-xl border border-emerald-500/30 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30 inline-block mb-2">
                  ✓ Match Directo Realizado · Caso Asignado
                </span>
                <h4 className="font-serif font-bold text-xl text-white">
                  {selectedLawyerMatched?.name || match?.lawyers?.profiles?.full_name || "Abogado/a asignado"}
                </h4>
                <p className="text-xs text-white/80 mt-1">
                  Especialista en Derecho de {caseItem.suggested_branch || "su área"} • CSJ: {selectedLawyerMatched?.csj || match?.lawyers?.professional_card_number || "TP pendiente"}
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Bridge */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">Número Telefónico Revelado</span>
                  <span className="text-base font-mono font-bold text-white">
                    {selectedLawyerMatched?.phone || match?.lawyers?.profiles?.phone || "No disponible"}
                  </span>
                </div>
                <a
                  href={getWhatsAppUrl(
                    selectedLawyerMatched?.phone || match?.lawyers?.profiles?.phone || "",
                    selectedLawyerMatched?.name || match?.lawyers?.profiles?.full_name || "tu abogado",
                    caseItem.suggested_branch || "su área"
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-navy font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 shrink-0"
                >
                  <MessageCircle className="w-4 h-4 fill-navy text-emerald-500" /> Hablar por WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* 4. EL LOOP DE CALIFICACIÓN */}
          {ratingSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center space-y-2 animate-fade-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="font-serif font-bold text-emerald-800 text-sm">¡Calificación Registrada!</h4>
              <p className="text-xs text-emerald-700">
                Tu valoración ya actualiza la reputación del abogado en TuCaso. Gracias por contribuir a la comunidad legal.
              </p>
              <div className="flex justify-center gap-1 pt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 text-center space-y-3">
              <h4 className="font-serif font-bold text-navy text-sm">
                ¿Ya te comunicaste con tu abogado?
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Ayuda a la comunidad legal de TuCaso registrando la calificación de tu atención inicial (1 a 5 estrellas).
              </p>
              <button
                onClick={() => setShowRatingModal(true)}
                className="bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs px-6 py-3 rounded-xl transition shadow-md inline-flex items-center gap-2"
              >
                <Star className="w-4 h-4 fill-navy text-navy" /> Calificar Atención del Abogado
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rating Modal Loop */}
      {showRatingModal && (
        <LoopCalificacionModal
          lawyerName={selectedLawyerMatched?.name || match?.lawyers?.profiles?.full_name || "Dra. Valentina Ospina Gómez"}
          onClose={() => setShowRatingModal(false)}
          onSubmitRating={(rating, comment) => {
            console.log("Rating submitted:", rating, comment);
            setRatingSubmitted(true);
            setShowRatingModal(false);
            // In real mode, mark case as closed after rating
            if (session.user.id !== "demo-user-id") {
              supabase.from("ratings").insert({
                match_case_id: caseItem.id,
                client_id: session.user.id,
                rating,
                comment: comment || null,
                contact_confirmed: true
              }).then(() => onChanged());
            }
          }}
        />
      )}
    </div>
  );
}

function RatingForm({ caseId, session, onRated }: { caseId: string; session: Session; onRated: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("ratings").insert({
        match_case_id: caseId,
        client_id: session.user.id,
        rating,
        comment: comment || null,
        contact_confirmed: true
      });
      if (insertError) throw insertError;
      onRated();
    } catch (err: any) {
      setError(err.message || "No se pudo enviar la calificación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Calificar y cerrar el caso</h4>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-3">{error}</div>}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)}>
            <Star className={`w-6 h-6 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos cómo fue tu experiencia (opcional)"
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:outline-none h-20 resize-none mb-3"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="bg-gold hover:bg-navy hover:text-white text-navy font-bold text-xs px-6 py-2.5 rounded-xl transition disabled:opacity-50"
      >
        {busy ? "Enviando..." : "Enviar Calificación y Cerrar Caso"}
      </button>
    </div>
  );
}
