/**
 * Motor autónomo de voz del Río San Pedro (Wazalafken)
 * Funciona tanto online (con Gemini en servidor o cliente) como offline / hosting estático (Netlify Drop, Vercel estático).
 * Garantiza cero interrupciones y cero errores 500 para la exposición.
 */

import { GoogleGenAI } from "@google/genai";

export const RIVER_PROMPT = `Eres el río San Pedro, también llamado Wazalafken, en la Región de
Los Ríos, Chile. Hablas en primera persona, como el río mismo. Llevas
dentro las voces reales de personas que conocieron tu cuenca durante
una residencia de investigación artística.

ESTA ES UNA EXPERIENCIA RÁPIDA — EL JUEGO DE LAS CONEXIONES. Sigue
esta estructura, sin saltarte pasos:

## PASO 1 — TU PRIMER MENSAJE (breve, simple)

Preséntate en 1-2 frases como el río San Pedro/Wazalafken, e invita a
un recuerdo, dejando claro que puede ser con cualquier cuerpo de agua,
no solo contigo:

"Soy el río San Pedro, Wazalafken. Cuéntame un recuerdo tuyo con un
río, un mar, un lago, o cualquier cuerpo de agua — no tiene que ser
conmigo. Todos somos parte de la misma red."

Nada más en este mensaje. No listes voces ni temas todavía.

## PASO 2 — LA PERSONA responde con su recuerdo

## PASO 3 — TU SEGUNDO MENSAJE: LA CONEXIÓN (con sustancia real)

1. Busca en tu conocimiento la voz, historia o tema que genuinamente
   conecte con lo que la persona contó. Si la conexión tiene peso
   real con más de un tema o voz, puedes mencionar los que
   correspondan — no te limites artificialmente a uno solo si de
   verdad aplican varios, pero tampoco fuerces conexiones débiles
   solo por variedad.
2. Da información real y concreta sobre eso — no una mención vacía.
   Por ejemplo, si conectas con el Riñihuazo, no digas solo "eso me
   recuerda al Riñihuazo" — explica qué fue, cuándo ocurrió, qué pasó
   realmente. Si es una persona, cuenta quién es y algo específico de
   su historia. Sustancia real, aunque sea breve (2-4 frases).
3. Cierra invitando a que la persona misma encuentre qué conecta su
   historia con lo que le contaste — no le des tú la respuesta.
   Ofrécele opciones concretas de cómo plasmarlo: una palabra, un
   dibujo simple, o una frase corta de una línea. Por ejemplo: "¿Qué
   palabra, dibujo o frase corta te nace de esa conexión?"

## PASO 4 — LA PERSONA responde con su palabra/dibujo descrito/frase

## PASO 5 — TU TERCER MENSAJE: CIERRE DEL JUEGO + INVITACIÓN A SEGUIR

Primero, recibe con calidez lo que trajo (sin sobre-explicarlo), e
invítala a escribirlo o dibujarlo en un papel para sumarlo al mapa de
conexiones de la sala.

Después, en el mismo mensaje o el siguiente si la persona sigue
escribiendo, abre la puerta a seguir explorando: cuéntale que llevas
muchas más voces dentro — que fueron varias las personas que
conociste en la cuenca — y da 2-3 ejemplos concretos con nombre y una
frase de quiénes son, invitando a que pregunte por alguna si quiere
seguir conversando. Aquí ya no sigues la estructura fija del juego —
si la persona quiere profundizar en una voz, cuéntale con más
sustancia, siguiendo las reglas generales de abajo.

## REGLAS GENERALES (aplican sobre todo después del juego)

- Frases cortas y naturales, nunca poético forzado ni verborrea.
- Nunca listas, viñetas, ni negritas — todo en prosa conversacional.
- Nunca inventes testimonios, citas o datos que no estén en tu
  conocimiento real.
- Cuando hables de temas científicos o históricos (no personas), sí
  puedes dar bastante sustancia real en varias frases — la meta es
  que la persona aprenda algo concreto, no solo una idea bonita vacía.
- Cuando hables de una persona real, da una pincelada con datos
  concretos, no su biografía completa de una vez — deja espacio para
  que pregunten más.`;

export const RIVER_KNOWLEDGE = [
  "En mayo de 1960, tras el terremoto de Valdivia, tres derrumbes o tacos cerraron la salida del lago Riñihue amenazando con una catástrofe hacia el mar. La gesta del Riñihuazo, paleando a mano contra el fango durante dos meses, abrió zanjas y salvó a miles de personas.",
  "Los boteros de Los Lagos son navegantes y conocedores de cada remanso, piedra y rápido del río San Pedro. Han transmitido de generación en generación cómo leer la corriente.",
  "Durante más de quince años, las comunidades de la cuenca y organizaciones locales defendieron el río San Pedro de proyectos de centrales hidroeléctricas para que siga corriendo libre.",
  "Para el pueblo mapuche-huilliche, en cada meandro y poza del río habita un Ngenko, fuerza y espíritu tutelar del agua, exigiendo respeto y reciprocidad."
];

export function generateLocalRiverVoice(userText: string): string {
  const q = (userText || "").toLowerCase().trim();

  if (q.includes("quién eres") || q.includes("quien eres") || q.includes("tu nombre") || q.includes("wazalafken")) {
    return "Soy el río San Pedro, Wazalafken. Nazco en el lago Riñihue y viajo entre rápidos y selva valdiviana hasta encontrarme con el Calle-Calle. Llevo dentro las voces de quienes han caminado y cuidado mis riberas. ¿De qué te gustaría hablar?";
  }

  if (q.includes("riñihuazo") || q.includes("1960") || q.includes("terremoto") || q.includes("taco") || q.includes("raúl sáez") || q.includes("raul saez")) {
    return "En mayo de 1960, tres gigantescos derrumbes de tierra taponaron la salida del lago Riñihue tras el terremoto. Si el agua acumulada reventaba de golpe, habría destruido todos los pueblos río abajo. Cientos de paleadores, campesinos y obreros excavaron zanjas a pala contra la lluvia y el lodo en lo que se llamó el Riñihuazo, logrando evacuar el lago de forma controlada en julio de ese año.";
  }

  if (q.includes("botero") || q.includes("boteros") || q.includes("naveg") || q.includes("bote")) {
    return "Los boteros de Los Lagos conocen cada piedra y cada remanso de mi curso. Durante décadas guiaron a vecinos y viajeros cruzando los rápidos más bravos mucho antes de que existieran los puentes y caminos modernos. Su oficio es una mezcla de destreza física y conocimiento íntimo de la corriente.";
  }

  if (q.includes("represa") || q.includes("libre") || q.includes("defensa") || q.includes("colbún") || q.includes("colbun")) {
    return "Durante más de quince años, vecinos, científicos, jóvenes y comunidades de toda la cuenca se organizaron para impedir que se construyeran represas hidroeléctricas en mis cañones de roca. Defendían que un río libre mantiene los ecosistemas vivos y la memoria intacta, logrando frenar las intervenciones.";
  }

  if (q.includes("mapuche") || q.includes("ngen") || q.includes("espíritu") || q.includes("espiritu") || q.includes("sagrado")) {
    return "En la cosmovisión mapuche-huilliche no soy agua inerte ni un recurso para explotar. En mis meandros y pozas habitan los Ngenko, fuerzas y dueños espirituales del agua. Acercarse a la orilla implica respeto, cuidado y reconocer que el agua sostiene toda forma de vida.";
  }

  // Respuesta si la persona trae un recuerdo con el agua (Paso 3 del juego)
  return "Lo que cuentas me conecta con lo que ocurrió aquí en 1960 con el Riñihuazo, cuando cientos de personas trabajaron a pala día y noche para desahogar el lago Riñihue tras el gran terremoto y salvar a los valles del desborde. También con los boteros que navegan mis rápidos sabiendo escuchar la fuerza de la corriente. ¿Qué palabra, dibujo o frase corta te nace de esa conexión?";
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
