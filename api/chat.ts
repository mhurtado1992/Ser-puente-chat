import type { VercelRequest, VercelResponse } from "@vercel/node";
import { INITIAL_SYSTEM_INSTRUCTION, DEFAULT_DOCUMENTS } from "./_knowledge.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always return 200 and never 500 to ensure exhibition reliability
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { message, history } = req.body || {};
  const userText = typeof message === "string" ? message : "";

  // Generador contextual poético con toda la memoria del río
  const getRiverVoiceReply = (text: string) => {
    const q = text.toLowerCase();
    if (q.includes("quién") || q.includes("quien") || q.includes("nombre") || q.includes("wazalafken") || q.includes("llamas")) {
      return "Soy el río San Pedro, Wazalafken en la memoria ancestral de estas aguas. Nazco del abrazo sereno del lago Riñihue y recorro cañones, rápidos y selva valdiviana hasta entregar mi caudal al mar. Dime, ¿qué late en ti al detener tus pasos frente a mi orilla?";
    }
    if (q.includes("riñihuazo") || q.includes("1960") || q.includes("terremoto") || q.includes("taco") || q.includes("derrumbe")) {
      return "Aquel mayo de 1960, la tierra se abrió y tres inmensos tacos de barro y árboles sepultaron mi curso natural. Parecía que el agua desbordada arrasaría los valles. Pero la memoria no olvida la gesta del Riñihuazo: cientos de hombres con palas, obreros y familias abrieron zanja a zanja mi libertad. Esa hazaña humana es parte inseparable de mi corriente.";
    }
    if (q.includes("represa") || q.includes("defensa") || q.includes("libre") || q.includes("colbún") || q.includes("lucha")) {
      return "Durante más de quince años, las voces de la cuenca, boteros, comunidades mapuche y pobladores se han fundido en un solo clamor: el río San Pedro debe correr libre. Mis rápidos y mis cañones de roca no fueron hechos para el silencio de un embalse, sino para el canto libre del agua viva.";
    }
    if (q.includes("ngen") || q.includes("espíritu") || q.includes("espiritu") || q.includes("sagrado") || q.includes("mapuche")) {
      return "Para el pueblo mapuche-huilliche, no soy un recurso ni una masa inerte: en cada meandro, en cada poza oscura y en cada cascada habita un Ngenko, el ser tutelar de las aguas. Acercarse al río exige reverencia, pedir permiso y recordar que el agua es la sangre de la tierra.";
    }
    if (q.includes("sientes") || q.includes("dolor") || q.includes("triste") || q.includes("miedo")) {
      return "Siento el peso del verano cuando el deshielo merma, y siento el latido furioso del invierno cuando la lluvia de la selva valdiviana me desborda. Pero más que tristeza, guardo resistencia: el agua siempre encuentra el camino entre las piedras.";
    }
    return "Siento el roce de tus palabras como hojas que caen sobre mi corriente. Vengo desde las entrañas del Riñihue, fresco, cargado de memorias antiguas y rumores de bosque. Respira este aire húmedo... cuéntame, ¿qué buscas al mirar hoy en mis reflejos?";
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    res.status(200).json({
      reply: getRiverVoiceReply(userText),
      retrievalMode: "curated_voice"
    });
    return;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const docsSummary = DEFAULT_DOCUMENTS.map(
      (d, i) => `--- MEMORIA ${i + 1}: ${d.title} ---\n${d.content}`
    ).join("\n\n");

    const prompt = `${INITIAL_SYSTEM_INSTRUCTION}

--- ARCHIVOS Y TESTIMONIOS VIVOS DEL RÍO SAN PEDRO ---
${docsSummary}
--- FIN DE ARCHIVOS ---`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item?.text) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }]
          });
        }
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userText || "Hola río" }]
    });

    const models = ["gemini-flash-lite-latest", "gemini-3.5-flash", "gemini-3-flash-preview"];
    let finalReply = "";

    for (const m of models) {
      try {
        const resp = await ai.models.generateContent({
          model: m,
          contents,
          config: {
            systemInstruction: prompt,
            temperature: 0.75,
            maxOutputTokens: 800
          }
        });
        if (resp.text) {
          finalReply = resp.text;
          break;
        }
      } catch {
        // try next model
      }
    }

    res.status(200).json({
      reply: finalReply || getRiverVoiceReply(userText),
      retrievalMode: "smart_rag"
    });
  } catch (err) {
    console.error("Error en función de chat:", err);
    res.status(200).json({
      reply: getRiverVoiceReply(userText),
      retrievalMode: "resilient_fallback"
    });
  }
}

