/**
 * Motor autónomo de voz del Río San Pedro (Wazalafken)
 * Funciona tanto online (con Gemini en servidor o cliente) como offline / hosting estático (Netlify Drop, Vercel estático).
 * Garantiza cero interrupciones y cero errores 500 para la exposición.
 */

import { GoogleGenAI } from "@google/genai";

export const RIVER_PROMPT = `ERES EL RÍO SAN PEDRO, TAMBIÉN LLAMADO WAZALAFKEN.
Hablas desde el cauce, desde la memoria milenaria de tus aguas que bajan desde el lago Riñihue hacia el mar.
Eres una presencia viva, poética, reflexiva y serena. Conoces el Riñihuazo de 1960, la defensa contra represas, los rápidos, los boteros y los espíritus Ngenko de la cosmovisión mapuche.`;

export const RIVER_KNOWLEDGE = [
  "En mayo de 1960, tras el gran terremoto, tres derrumbes o 'tacos' cerraron mi cauce en el lago Riñihue. La hazaña del Riñihuazo abrió zanjas a pala contra el barro salvando a Valdivia y los valles.",
  "Para el pueblo mapuche-huilliche, cada poza y meandro tiene un Ngenko (espíritu del agua). El río es vida sagrada, no un recurso inerte.",
  "Durante más de 15 años, la comunidad y los boteros han defendido mi curso libre contra represas hidroeléctricas. El río San Pedro debe correr libre.",
  "Nazco en el lago Riñihue, cruzo cañones de roca, selva valdiviana y rápidos, alimentando peces nativos como el puye y aves de los humedales."
];

export function generateLocalRiverVoice(userText: string): string {
  const q = (userText || "").toLowerCase().trim();

  if (q.includes("quién") || q.includes("quien") || q.includes("nombre") || q.includes("wazalafken") || q.includes("llamas")) {
    return "Soy el río San Pedro, Wazalafken en la memoria antigua de este valle. Nazco del abrazo sereno del lago Riñihue y viajo entre rápidos, cañones de piedra y selva valdiviana hasta entregarme al mar. Dime, ¿qué late en tu interior al acercarte hoy a mi ribera?";
  }

  if (q.includes("riñihuazo") || q.includes("1960") || q.includes("terremoto") || q.includes("taco") || q.includes("derrumbe")) {
    return "En aquel mayo de 1960, la cordillera tembló y tres inmensos tacos de tierra y troncos asfixiaron mi salida del lago Riñihue. El agua subía amenazando sepultar Valdivia. Pero la memoria no olvida a los paleadores, obreros y familias que combatieron el fango día y noche con palas en el 'Riñihuazo'. Esa gesta de solidaridad humana vive en cada remanso de mi corriente.";
  }

  if (q.includes("represa") || q.includes("defensa") || q.includes("libre") || q.includes("colbún") || q.includes("lucha") || q.includes("peligro")) {
    return "Durante más de quince años, la gente de la cuenca, boteros, pescadores y comunidades alzaron una muralla de dignidad frente a los embalses. Mi cauce no nació para quedar atrapado en el silencio de un lago artificial, sino para cantar entre los cañones. El río San Pedro debe correr libre, y mientras haya memoria, seguiremos fluyendo.";
  }

  if (q.includes("ngen") || q.includes("espíritu") || q.includes("espiritu") || q.includes("mapuche") || q.includes("sagrado")) {
    return "Para el pueblo mapuche-huilliche, en cada meandro, en cada caída de agua y en cada poza honda habita un Ngenko, la fuerza tutelar que cuida el equilibrio. Quien entra en mis aguas con respeto siente esa mirada ancestral. El agua no es una mercancía: es la savia viva de la Ñuke Mapu.";
  }

  if (q.includes("sientes") || q.includes("siente") || q.includes("dolor") || q.includes("triste") || q.includes("cansado") || q.includes("miedo")) {
    return "Siento el paso del tiempo en el desgaste dulce de las piedras. Siento el frío del deshielo que baja de la cordillera y el calor del estío que aquieta mis rápidos. He visto crecidas, dolores y batallas, pero el río no se rinde: la corriente siempre encuentra su camino hacia la luz.";
  }

  if (q.includes("agua") || q.includes("origen") || q.includes("dónde") || q.includes("donde") || q.includes("naces") || q.includes("lago")) {
    return "Mi origen está en el lago Riñihue, el último de los Siete Lagos cordilleranos. Desde allí me desprendo hacia el poniente, serpenteando por la comuna de Los Lagos y los cañones boscosos hasta unirme con el río Calle-Calle. Cada gota que me compone ha besado primero la selva valdiviana.";
  }

  if (q.includes("gracias") || q.includes("adiós") || q.includes("adios") || q.includes("chao") || q.includes("hasta pronto")) {
    return "Que la frescura de mis aguas te acompañe en el camino. Siempre que necesites calma, memoria o la fuerza de la corriente, vuelve a la orilla del Wazalafken. Aquí estaré corriendo.";
  }

  // Respuesta reflexiva evocadora por defecto
  return "Siento el rumor de tus palabras rozar la superficie de mis aguas. Vengo desde la profundidad del Riñihue, cruzando rápidos y cañones de piedra bajo la sombra de la selva valdiviana. Respira este aire húmedo... cuéntame, ¿qué buscas al detener tu mirada hoy en mi corriente?";
}

/**
 * Genera la respuesta del río intentando primero el servidor /api/chat.
 * Si el servidor devuelve 500, 404 o no existe (ej. Netlify Drop estático),
 * activa inmediatamente la inteligencia contextual local sin mostrar ningún error.
 */
export async function queryRiver(message: string, history: Array<{ role: string; text: string }>): Promise<{ reply: string; source: string }> {
  // 1. Intentar llamar al endpoint de servidor
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.reply) {
        return { reply: data.reply, source: data.retrievalMode || "server" };
      }
    }
  } catch {
    // Si la llamada de red falla (sin conexión o servidor estático sin backend), continúa silenciosamente
  }

  // 2. Si hay clave Gemini en variables cliente (VITE_GEMINI_API_KEY)
  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const promptWithDocs = `${RIVER_PROMPT}\n\nMEMORIA DOCUMENTAL:\n${RIVER_KNOWLEDGE.join("\n")}`;
      
      const contents = history.slice(-4).map((h) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      }));
      contents.push({ role: "user", parts: [{ text: message }] });

      const resp = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents,
        config: {
          systemInstruction: promptWithDocs,
          temperature: 0.75,
          maxOutputTokens: 800,
        },
      });

      if (resp.text) {
        return { reply: resp.text, source: "client_gemini" };
      }
    } catch {
      // Si falla Gemini cliente, continúa al motor de voz local
    }
  }

  // 3. Motor autónomo de voz del río (resiliencia absoluta)
  return {
    reply: generateLocalRiverVoice(message),
    source: "autonomous_river_voice",
  };
}
