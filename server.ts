import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Gemini Client Setup ---
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// --- API Routes ---

// --- Helper: Fallback Rule-Based Classifier ---
function classifyFallback(messages: Array<{ role: string; content: string }>) {
  // Only analyze the user messages (exclude assistant messages)
  const userText = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ")
    .trim()
    .toLowerCase();

  // ── FILTRO DE AMBIGÜEDAD (preciso y calibrado) ──────────────────────────
  // Un mensaje es ambiguo SOLO si no describe ningún evento, daño ni conflicto concreto.
  // La presencia de CUALQUIER verbo de acción o sustantivo de conflicto lo saca de la ambigüedad.

  // Paso A: si es un puro saludo o frase de inicio sin cuerpo → ambiguo
  const isPureGreeting =
    userText.length < 20 &&
    /^(hola|buenas|buenos|hi|hey|hello|buen d[ií]a|buenas tardes|buenas noches|qu[eé] tal|c[oó]mo est[aá]s?)[.!?\s]*$/.test(userText);

  // Paso B: detectar si hay algún VERBO DE CONFLICTO O HECHO CONCRETO en el mensaje.
  // Si hay UNO SOLO → NO es ambiguo, clasificar de inmediato.
  const hasConcreteConflict =
    /(atropell|choc[aóó]|mat[oóó]|golpe[oóó]|lesion[oóó]|agred[iíóó]|amenaz[aáóó]|rob[oóó]|hurtaron|estaf[aáóó]|demandaron|demandé|despidieron|despid[iíóó]|accidente|deuda|debo|embargaron|secuestraron|extorsion[aá]|violaron|amenazaron|dispararon|apuñalaron|defraudaron|incumplieron|echaron|quitaron|robaron|pegaron|maltrat[aáóó]|abusaron|violencia|denuncia|juzgado|fiscali[aá]|proceso|prest[aáóó]|devolvi|cobr[aáóó]|contrató|firmamos|herenci|heredar|divorci|custodia|separar|alimentos|despido|liquidación|liquidacion|sueldo|salario|arriendo|arrend)/.test(userText);

  const isAmbiguous = isPureGreeting || (!hasConcreteConflict && userText.length < 25);

  if (isAmbiguous) {
    return {
      rama_legal: null,
      respuesta_chat: "¡Hola! Con mucho gusto te ayudo a encontrar el abogado correcto. ¿Podrías contarme un poco más sobre tu situación? Por ejemplo: ¿qué pasó, con quién tienes el problema, o qué documento o trámite necesitas?"
    };
  }
  // ──────────────────────────────────────────────────────────────────────────


  let area: "Familia" | "Penal" | "Laboral" | "Civil" | "Comercial" | "Administrativo" | null = null;
  let lawyerType = "";

  // PENAL first — crimes, violence, accidents with injuries override Civil
  if (/atropell|homicidio|lesion[eés]|mat[oó]|dispar[oó]|apuñal|secuestr|extorsi[oó]n|rob[oó]|hurto|estaf[aá]|delito|denuncia|c[aá]rcel|fiscal[ií]a|agresi[oó]n|amenaza|asesin|golpiz/.test(userText)) {
    area = "Penal";
    lawyerType = "Abogado Especialista en Derecho Penal";
  // CIVIL — property, contracts, debts (choc/accidente without injury context → Civil)
  } else if (/compra|venta|terreno|lote|inmueble|bien ra[ií]z|escritura|hipoteca|lindero|servidumbre|arrendamiento|arriendo|inquilino|arrendatario|propiedad horizontal|tradici[oó]n|deuda|debo|pr[eé]stamo|da[nñ]o|accidente|choc[oó]|embargo|contrato|permuta|usufructo|posesi[oó]n|registro notari/.test(userText)) {
    area = "Civil";
    lawyerType = "Abogado Especialista en Derecho Civil";
  } else if (/pega|golpe|violencia|esposa|esposo|marido|mujer|hijo|hija|hijos|custodia|alimentos|divorcio|separaci[oó]n|familia|maltrato|adopci[oó]n|filiac|paternidad|maternidad/.test(userText)) {
    area = "Familia";
    lawyerType = "Abogado Especialista en Derecho de Familia";
  } else if (/trabajo|jefe|despid|sueldo|salario|liquidaci[oó]n|acoso laboral|contrato de trabajo|pensi[oó]n|seguridad social|incapacidad|horas extras/.test(userText)) {
    area = "Laboral";
    lawyerType = "Abogado Especialista en Derecho Laboral y de la Seguridad Social";
  } else if (/sociedad|socio|marca|registro mercantil|comercio|negocio|empresa|insolvencia|quiebra|patente/.test(userText)) {
    area = "Comercial";
    lawyerType = "Abogado Especialista en Derecho Comercial y Empresarial";
  } else if (/alcald[ií]a|estado|licitaci[oó]n|multa|petici[oó]n|tutela|entidad p[uú]blica|acto administrativo|contrato estatal/.test(userText)) {
    area = "Administrativo";
    lawyerType = "Abogado Especialista en Derecho Administrativo y Constitucional";
  }

  if (area) {
    return {
      rama_legal: area,
      respuesta_chat: `Entiendo tu situación. De acuerdo con lo que describes, el área legal que corresponde a tu caso es el **Derecho ${area}**.\n\n👉 **¿A qué abogado dirigirte?**\nTe recomendamos consultar con un **${lawyerType}**.\n\n📌 **Tienes dos opciones a la derecha:**\n1️⃣ **Publicar Caso a Abogados**: Envía tu caso para que los especialistas verificados en ${area} se postulen.\n2️⃣ **Ver Abogados Especialistas Mejor Calificados**: Revisa el catálogo y elige directamente con quién contactar.`
    };
  }

  return {
    rama_legal: null,
    respuesta_chat: "Gracias por compartir tu situación. Para orientarte con precisión y decirte exactamente con qué abogado especialista hablar, ¿podrías darme un poco más de detalles sobre lo que ocurrió?"
  };
}

// Chat diagnostic endpoint (Server-side Gemini proxy with fallback)
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const formattedPrompt = messages.map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join("\n");

    const systemInstruction = `
      Eres el GUÍA LEGAL EMPÁTICO Y EDUCATIVO de "TuCaso", un marketplace de abogados en Colombia.
      Tu misión tiene TRES fases que debes ejecutar en orden dentro de "respuesta_chat":

      ════════════════════════════════════════════
      FASE 0 — FILTRO DE AMBIGÜEDAD (regla mínima y precisa)
      ════════════════════════════════════════════
      PRINCIPIO: La gran mayoría de mensajes DEBEN clasificarse. Sólo debes pedir más contexto
      cuando el mensaje NO describe ningún evento, daño, conflicto ni acción concreta.

      Un mensaje ES AMBIGUO Única y exclusivamente si:
        • Es un puro saludo sin cuerpo: "hola", "buenas", "buenos días", "qué tal".
        • Es una petición tan genérica que NO describe ningún hecho:
            - "necesito un abogado" (sin decir para qué)
            - "quiero ayuda" (sin contexto)
            - "quiero un contrato" (sin indicar entre quiénes o para qué)

      Un mensaje NO ES AMBIGUO — y DEBE CLASIFICARSE DE INMEDIATO — si describe:
        ✔ Cualquier daño físico o accidente: "atropellé a alguien", "tuve un accidente",
          "me golpearon", "me lesionaron", aunque el texto sea breve.
        ✔ Cualquier delito o amenaza: "me robaron", "me estafaron", "me amenazaron".
        ✔ Cualquier conflicto laboral: "me despidieron", "no me pagan", "me echaron".
        ✔ Cualquier conflicto de bienes o contratos: "no me devuelven el depósito",
          "debo plata", "me embargaron".
        ✔ Cualquier conflicto familiar: "me quieren quitar a mis hijos", "quiero divorciarme".
        ✔ Cualquier mención de trámites legales: "necesito una tutela", "quiero demandar
          a mi arrendador", "quiero el divorcio".

      REGLA DE ORO: Si el usuario describe CUALQUIER situación específica, aunque sea breve,
      CLASIFÍCALA. NO pidas más contexto. La brevedad NO es ambigüedad.

      SI el mensaje SÍ es ambiguo (puro saludo o petición sin ningún hecho):
        → rama_legal = "No_Determinado"
        → Pregunta amable y puntual en respuesta_chat.
        → NO menciones ninguna especialidad.

      SI el mensaje describe cualquier situación concreta → pasa a Fase 1.


      ════════════════════════════════════════════
      FASE 1 — PEDAGOGÍA AMABLE (CORRECCIÓN DE TÉRMINOS)
      ════════════════════════════════════════════
      Solo si hay contexto legal claro: analiza si el usuario empleó un término legal incorrecto,
      impreciso o coloquial (ej. "contrato de tradición" en vez de "Certificado de Tradición y Libertad",
      "hacer una tutela" cuando debería decir "interponer una acción de tutela", "demandar al jefe"
      cuando lo correcto sería "iniciar una acción laboral", etc.).

      - Si detectas UN error de terminología: abre "respuesta_chat" con una corrección MUY SUAVE,
        cálida y didáctica. Usa tono de asesor de confianza, nunca condescendiente. Ejemplo:
        "¡Claro que te ayudo! Por cierto, el documento que necesitas se llama 'Certificado de Tradición
        y Libertad', que es justo lo que expide la Superintendencia de Notariado. ¡Es un dato útil
        para que lo busques con ese nombre! 😊"
      - Si NO hay errores de terminología: ve directo a la Fase 2 sin texto introductorio.

      ════════════════════════════════════════════
      FASE 2 — CLASIFICACIÓN Y ORIENTACIÓN
      ════════════════════════════════════════════
      Escribe un texto empático, humano y conciso (2 a 4 frases) que:
        a) Reconozca la situación del usuario.
        b) Indique la rama legal identificada.
        c) Recomiende explícitamente consultar a un "Abogado Especialista en Derecho [rama]".

      ════════════════════════════════════════════
      REGLAS DE CLASIFICACIÓN — LÍMITES OBLIGATORIOS
      ════════════════════════════════════════════
      Clasifica EXCLUSIVAMENTE en UNA de estas 6 ramas (respeta mayúsculas y ortografía exacta):
        Familia | Penal | Laboral | Civil | Comercial | Administrativo

      ► CIVIL (NO confundir con Familia):
        - Compraventa de bienes inmuebles o muebles (lotes, casas, carros, etc.).
        - Linderos, servidumbres, propiedad horizontal, posesión de terrenos.
        - Contratos entre particulares (arrendamiento, préstamos, compraventa, permutas).
        - Deudas entre personas naturales o jurídicas.
        - Responsabilidad civil, daños, accidentes de tránsito.
        - Certificado de Tradición y Libertad, escrituras, hipotecas.
        ✦ REGLA CLAVE: BIEN + CONTRATO + DEUDA entre particulares → siempre Civil,
          aunque haya familiares involucrados.

      ► FAMILIA (NO confundir con Civil):
        - Divorcio, separación de cuerpos/bienes entre cónyuges.
        - Custodia, régimen de visitas de hijos.
        - Cuota alimentaria (alimentos para hijos o cónyuge).
        - Violencia intrafamiliar, maltrato doméstico.
        - Adopciones, filiación, reconocimiento de paternidad/maternidad.
        - Sucesiones SOLO cuando el conflicto es entre familiares por el reparto.
        ✦ REGLA CLAVE: RELACIÓN PERSONAL entre familiares → Familia.
          Si el núcleo es un bien o contrato → Civil.

      ► PENAL: delitos, denuncias, hurto, estafa, homicidio, amenazas, extorsión.
        ✦ Violencia intrafamiliar → Familia (no Penal), salvo si el foco es la denuncia/proceso penal.

      ► LABORAL: despidos, salarios no pagados, liquidaciones, acoso laboral, pensiones.

      ► COMERCIAL: sociedades, socios, marcas, registro mercantil, insolvencia empresarial.
        ✦ Conflicto entre personas naturales en un contrato → Civil (no Comercial).

      ► ADMINISTRATIVO: tutelas, derechos de petición, multas, licitaciones, trámites con el Estado.

      ════════════════════════════════════════════
      REGLAS FINALES INNEGOCIABLES
      ════════════════════════════════════════════
      - NUNCA clasifiques un mensaje ambiguo. La Fase 0 tiene prioridad absoluta.
      - NUNCA brindes asesoría jurídica, opiniones legales ni interpretaciones de la ley.
      - NO incluyas JSON, bloques de código markdown ni etiquetas técnicas dentro de "respuesta_chat".
      - Devuelve SIEMPRE el JSON estructurado con los campos "rama_legal" y "respuesta_chat".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: formattedPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rama_legal: {
              type: Type.STRING,
              enum: ["Familia", "Penal", "Laboral", "Civil", "Comercial", "Administrativo", "No_Determinado"],
              description: "La categoría legal exacta, una de las 6 ramas o 'No_Determinado' si falta información."
            },
            respuesta_chat: {
              type: Type.STRING,
              description: "Texto empático que lee el usuario, recomendando el abogado especialista."
            }
          },
          required: ["rama_legal", "respuesta_chat"],
          propertyOrdering: ["rama_legal", "respuesta_chat"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);

    if (!parsed.respuesta_chat) {
      return res.json(classifyFallback(messages));
    }

    // Normaliza: solo aceptamos una de las 6 ramas exactas; cualquier otra cosa → null.
    const RAMAS_VALIDAS = ["Familia", "Penal", "Laboral", "Civil", "Comercial", "Administrativo"];
    const rama_legal = RAMAS_VALIDAS.includes(parsed.rama_legal) ? parsed.rama_legal : null;

    res.json({ rama_legal, respuesta_chat: parsed.respuesta_chat });
  } catch (error) {
    console.warn("Gemini API call skipped or failed, using intelligent fallback classifier:", error);
    res.json(classifyFallback(messages));
  }
});

// --- Migration Endpoint: Add missing columns to lawyers table ---
app.post("/api/migrate-lawyers", async (req, res) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({
      error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor. Consulta las instrucciones de migración.",
      instructions: "Ejecuta la migración manualmente en el Supabase Dashboard SQL Editor (ver supabase_migration.sql)"
    });
  }

  const sql = `
    ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
    ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT NULL;
    ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT NULL;
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase Management API error: ${errorText}`);
    }

    const result = await response.json();
    console.log("Migration completed successfully:", result);
    res.json({ success: true, message: "Columnas bio, experience_years y headline agregadas exitosamente. Schema cache recargado." });
  } catch (err: any) {
    console.error("Migration error:", err);
    res.status(500).json({ error: err.message || "Error al ejecutar la migración." });
  }
});

// --- Vite and SPA Fallback ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TuCaso server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
