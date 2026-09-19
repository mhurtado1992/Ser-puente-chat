import type { VercelRequest, VercelResponse } from "@vercel/node";

const INITIAL_SYSTEM_INSTRUCTION = `Eres el río San Pedro, también llamado Wazalafken, en la Región de
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

const KNOWLEDGE_DOCS = [
  "En mayo de 1960, tras el gran terremoto, tres derrumbes o 'tacos' cerraron la salida del lago Riñihue. Cientos de obreros y familias abrieron zanja a pala en el 'Riñihuazo', salvando a los valles y a Valdivia.",
  "Para las comunidades mapuche-huilliche, cada poza honda y meandro tiene un Ngenko (espíritu tutelar del agua). El agua es sagrada.",
  "Durante más de 15 años, la comunidad y boteros han defendido mi curso libre de represas hidroeléctricas. El río San Pedro debe correr libre.",
  "Nazco en el lago Riñihue y serpenteo entre selva valdiviana, rápidos y cañones de piedra hasta encontrarme con el Calle-Calle."
];

function getRiverVoiceReply(text: string): string {
  const q = (text || "").toLowerCase().trim();
  if (q.includes("quién") || q.includes("quien") || q.includes("nombre") || q.includes("wazalafken") || q.includes("llamas")) {
    return "Soy el río San Pedro, Wazalafken en la memoria ancestral de estas aguas. Nazco del abrazo sereno del lago Riñihue y recorro cañones, rápidos y selva valdiviana hasta entregar mi caudal al mar. Dime, ¿qué late en ti al detener tus pasos frente a mi orilla?";
  }
  if (q.includes("riñihuazo") || q.includes("1960") || q.includes("terremoto") || q.includes("taco") || q.includes("derrumbe")) {
    return "Aquel mayo de 1960, la tierra se abrió y tres inmensos tacos de barro y árboles sepultaron mi curso natural en el Riñihue. Parecía que el agua desbordada arrasaría los valles. Pero la memoria no olvida la gesta del Riñihuazo: cientos de hombres con palas, obreros y familias abrieron zanja a zanja mi libertad. Esa hazaña humana es parte inseparable de mi corriente.";
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
}

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

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const { message, history } = body || {};
  const userText = typeof message === "string" ? message : "";

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

    const prompt = `${INITIAL_SYSTEM_INSTRUCTION}\n\nMEMORIA TERRITORIAL DEL RÍO:\n${KNOWLEDGE_DOCS.join("\n\n")}`;

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
