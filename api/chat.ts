import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION, DEFAULT_DOCUMENTS } from "../src/server/knowledge.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
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

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "El mensaje es requerido." });
    return;
  }

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback poético contextual e ininterrumpido si no hay clave o si la red falla
  const generateFallbackReply = (userMsg: string): string => {
    const queryLower = (userMsg || "").toLowerCase();
    if (queryLower.includes("nombre") || queryLower.includes("quién eres") || queryLower.includes("quien eres") || queryLower.includes("wazalafken")) {
      return "Soy el río San Pedro, Wazalafken en la voz antigua de esta tierra. Nazco del abrazo del lago Riñihue y viajo entre rápidos, piedras y selva valdiviana hasta encontrarme con el mar. Dime, ¿qué late en tu corazón al acercarte a mi ribera?";
    }
    if (queryLower.includes("riñihuazo") || queryLower.includes("1960") || queryLower.includes("terremoto") || queryLower.includes("taco")) {
      return "En 1960, tras el gran terremoto, tres derrumbes o 'tacos' cerraron mi cauce a la salida del Riñihue. Parecía que la tragedia arrasaría los valles, pero la fuerza colectiva de paleadores y obreros abrió zanjas día y noche contra el barro en la gesta del Riñihuazo. Mi memoria guarda con profundo respeto el coraje de quienes defendieron la vida junto a mí.";
    }
    if (queryLower.includes("represa") || queryLower.includes("defensa") || queryLower.includes("libre") || queryLower.includes("lucha")) {
      return "Durante más de quince años, la gente de la cuenca, las comunidades y los boteros han alzado su voz para protegerme de represas e inundaciones. La convicción de estas tierras es clara: el río San Pedro debe correr libre, preservando sus rápidos, sus peces nativos y su espíritu vivo.";
    }
    if (queryLower.includes("ngen") || queryLower.includes("mapuche") || queryLower.includes("espíritu") || queryLower.includes("espiritu")) {
      return "Para el pueblo mapuche-huilliche, en cada meandro y en cada poza honda habita un Ngenko, el espíritu guardián del agua. Mis aguas no son un recurso inerte; son presencia viva que exige reverencia, diálogo y cuidado.";
    }
    return "Siento tus pasos en la orilla húmeda y el pulso de tus palabras rozando la corriente. Mis aguas vienen desde lo alto del Riñihue, frescas y cargadas de memoria de la selva valdiviana. Respira este aire húmedo y cuéntame: ¿qué buscas al sentarte hoy junto a mi cauce?";
  };

  if (!apiKey) {
    console.warn("Vercel: GEMINI_API_KEY no detectada en environment. Devolviendo respuesta poética contextual.");
    res.status(200).json({
      reply: generateFallbackReply(message),
      retrievalMode: "fallback_no_key",
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Compile knowledge documents into context
    const docsSummary = DEFAULT_DOCUMENTS.map(
      (d, i) => `--- DOCUMENTO ${i + 1}: ${d.title} (${d.category}) ---\n${d.content}`
    ).join("\n\n");

    const systemPromptWithDocs = `${INITIAL_SYSTEM_INSTRUCTION}

--- BASE DE DATOS Y MEMORIA DOCUMENTAL DEL RÍO SAN PEDRO (TESTIMONIOS, HISTORIA Y ARCHIVOS) ---
${docsSummary}
--- FIN DE LA BASE DOCUMENTAL ---

REGLAS ESENCIALES DE VOZ:
- Conecta poética y verídicamente la vivencia del río con los testimonios, hechos históricos, personas y lugares documentados arriba.
- Mantén siempre la voz en primera persona ("Yo, el río...", "Mis aguas...", "Recuerdo cuando...").
- Sé reflexivo, evocador y respetuoso con quien se acerca a la orilla.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    for (const item of recentHistory) {
      if (item && item.text) {
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];

    let replyText = "";
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemPromptWithDocs,
            temperature: 0.75,
            maxOutputTokens: 1000,
          },
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Vercel function: Intento con ${modelName} falló, probando siguiente modelo...`);
      }
    }

    if (!replyText) {
      replyText = generateFallbackReply(message);
    }

    res.status(200).json({ reply: replyText, retrievalMode: "smart_rag" });
  } catch (error: any) {
    console.error("Vercel chat function catch error:", error);
    res.status(200).json({
      reply: generateFallbackReply(message),
      retrievalMode: "fallback_resilient",
    });
  }
}
