import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
// @ts-ignore
import mammoth from "mammoth";
// @ts-ignore
import WordExtractor from "word-extractor";
import { INITIAL_SYSTEM_INSTRUCTION, DEFAULT_DOCUMENTS, type KnowledgeDocument } from "./src/server/knowledge.ts";
import { DocumentIndex } from "./src/server/retrieval.ts";

dotenv.config();

const currentFilePath = typeof import.meta?.url === "string" ? fileURLToPath(import.meta.url) : process.cwd();
const currentDirPath = path.dirname(currentFilePath);

const app = express();
const PORT = 3000;

// High limit to support uploading 500 pages of PDFs / Word
app.use(express.json({ limit: "60mb" }));

const DATA_DIR = path.join(process.cwd(), "data", "documents");
const PROMPT_FILE = path.join(process.cwd(), "data", "system_prompt.txt");
const RETRIEVAL_MODE_FILE = path.join(process.cwd(), "data", "retrieval_mode.txt");

// Ensure storage directories exist safely (without crashing on read-only filesystems)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("No se pudo crear DATA_DIR en disco:", e);
}

// Load persisted system prompt or initialize
let activeSystemInstruction = INITIAL_SYSTEM_INSTRUCTION;
try {
  if (fs.existsSync(PROMPT_FILE)) {
    activeSystemInstruction = fs.readFileSync(PROMPT_FILE, "utf-8");
  }
} catch (e) {
  console.warn("Could not read custom prompt file, using default:", e);
}

// Load persisted retrieval mode (default: "smart_rag" for max token efficiency & multi-user concurrency)
let retrievalMode: "smart_rag" | "full_context" = "smart_rag";
try {
  if (fs.existsSync(RETRIEVAL_MODE_FILE)) {
    const saved = fs.readFileSync(RETRIEVAL_MODE_FILE, "utf-8").trim();
    if (saved === "full_context" || saved === "smart_rag") {
      retrievalMode = saved;
    }
  }
} catch {}

// In-memory document collection and semantic search index
let documents: KnowledgeDocument[] = [];
const docIndex = new DocumentIndex();

function loadDocumentsFromDisk() {
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
      if (files.length > 0) {
        documents = files.map((file) => {
          const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
          return JSON.parse(raw) as KnowledgeDocument;
        });
        console.log(`Cargados ${documents.length} documentos desde el disco.`);
      } else {
        documents = [...DEFAULT_DOCUMENTS];
        documents.forEach(saveDocumentToDisk);
        console.log(`Inicializados ${documents.length} documentos predeterminados.`);
      }
    } else {
      documents = [...DEFAULT_DOCUMENTS];
    }
  } catch (err) {
    console.warn("Usando documentos predeterminados en memoria:", err);
    documents = [...DEFAULT_DOCUMENTS];
  }
  docIndex.reindex(documents);
}

function saveDocumentToDisk(doc: KnowledgeDocument) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, `${doc.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf-8");
  } catch (e) {
    console.warn(`No se pudo persistir doc ${doc.id} en disco (modo memoria activo):`, e);
  }
}

function deleteDocumentFromDisk(id: string) {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn(`No se pudo eliminar documento ${id} del disco:`, e);
  }
}

loadDocumentsFromDisk();

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("La variable de entorno GEMINI_API_KEY no está configurada.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

// Build context dynamically based on retrieval mode
function compileContext(userQuery?: string): string {
  let docsText = "";

  if (retrievalMode === "smart_rag" && docIndex.totalChunks > 0) {
    // Retrieve top 4 most relevant passages for this specific query
    const relevantChunks = docIndex.search(userQuery || "", 4);
    docsText = relevantChunks
      .map(
        (chunk, idx) =>
          `[PASAJES CLAVE ${idx + 1} DE "${chunk.docTitle}" (${chunk.category})]:\n${chunk.text}`
      )
      .join("\n\n");
  } else {
    // Full context mode (fallback or manual toggle)
    docsText = documents
      .map((doc, idx) => `--- DOCUMENTO ${idx + 1}: ${doc.title} (${doc.category}) ---\n${doc.content}`)
      .join("\n\n");
  }

  return `${activeSystemInstruction}

--- BASE DE DATOS Y MEMORIA DOCUMENTAL DEL RÍO SAN PEDRO (TESTIMONIOS, HISTORIA Y ARCHIVOS RECUPERADOS) ---
${docsText}
--- FIN DE LA BASE DOCUMENTAL ---

REGLAS ESENCIALES DE VOZ:
- Conecta poética y verídicamente la vivencia del río con los testimonios, hechos históricos, personas y lugares documentados arriba.
- Mantén siempre la voz en primera persona ("Yo, el río...", "Mis aguas...", "Recuerdo cuando...").
- Sé reflexivo, evocador y respetuoso con quien se acerca a la orilla.`;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.8-flash",
  });
});

// Config & documents summary for the curator / exhibition settings
app.get("/api/config", (_req, res) => {
  const totalPages = documents.reduce((sum, d) => sum + (d.pageCountApprox || 10), 0);
  const totalWords = documents.reduce((sum, d) => sum + d.content.split(/\s+/).length, 0);

  // In Smart RAG mode: persona prompt + top 4 chunks (~1600 words) = ~2,500 tokens
  // In Full Context mode: persona prompt + all words in documents / 0.75
  const estimatedTokensPerQuery =
    retrievalMode === "smart_rag"
      ? Math.min(3200, Math.round(activeSystemInstruction.length / 4) + 1600)
      : Math.round((totalWords + activeSystemInstruction.split(/\s+/).length) / 0.75);

  res.json({
    systemInstruction: activeSystemInstruction,
    documentsCount: documents.length,
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      preview: d.content.slice(0, 150) + "...",
      pageCountApprox: d.pageCountApprox,
    })),
    totalPagesApprox: totalPages,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    retrievalMode,
    totalChunks: docIndex.totalChunks,
    estimatedTokensPerQuery,
  });
});

// Toggle retrieval mode (Smart RAG vs Full Context)
app.post("/api/config/retrieval-mode", (req, res) => {
  const { mode } = req.body;
  if (mode === "smart_rag" || mode === "full_context") {
    retrievalMode = mode;
    try {
      fs.writeFileSync(RETRIEVAL_MODE_FILE, retrievalMode, "utf-8");
    } catch (e) {
      console.warn("No se pudo guardar retrieval_mode en disco:", e);
    }
    console.log(`[Modo de Búsqueda] Cambiado a: ${retrievalMode}`);
    res.json({ success: true, retrievalMode });
  } else {
    res.status(400).json({ error: "Modo no válido. Usa 'smart_rag' o 'full_context'." });
  }
});

// Update the system instruction (to paste the full Claude prompt whenever the user wants)
app.post("/api/update-instruction", (req, res) => {
  const { instruction } = req.body;
  if (!instruction || typeof instruction !== "string") {
    res.status(400).json({ error: "La instrucción es obligatoria y debe ser texto." });
    return;
  }
  activeSystemInstruction = instruction.trim();
  try {
    fs.writeFileSync(PROMPT_FILE, activeSystemInstruction, "utf-8");
  } catch (e) {
    console.warn("No se pudo persistir el prompt en archivo:", e);
  }
  res.json({ success: true, updatedLength: activeSystemInstruction.length });
});

// Upload and parse a PDF file
app.post("/api/upload-pdf", async (req, res) => {
  try {
    const { filename, base64, category } = req.body;
    if (!filename || !base64) {
      res.status(400).json({ error: "Nombre de archivo y contenido base64 son requeridos." });
      return;
    }

    const pdfBuffer = Buffer.from(base64, "base64");
    const parser = new (PDFParse as any)({ data: pdfBuffer });
    const parsed = await parser.getText();
    const textContent = (parsed.text || "").trim();
    const numPages = (parsed as any).total || Math.max(1, Math.ceil(textContent.length / 1800));
    try {
      await parser.destroy?.();
    } catch {}

    if (!textContent) {
      res.status(400).json({
        error: "No se pudo extraer texto del PDF. Podría ser un documento escaneado como imagen sin capa de texto OCR.",
      });
      return;
    }

    const newDoc: KnowledgeDocument = {
      id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: filename.replace(/\.[^/.]+$/, ""),
      category: category || "Documento PDF",
      content: textContent,
      pageCountApprox: numPages,
    };

    documents.push(newDoc);
    saveDocumentToDisk(newDoc);
    docIndex.reindex(documents);

    res.json({
      success: true,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        category: newDoc.category,
        pageCountApprox: newDoc.pageCountApprox,
        charCount: textContent.length,
      },
      totalDocuments: documents.length,
    });
  } catch (err: any) {
    console.error("Error al procesar PDF:", err);
    res.status(500).json({
      error: "Error al procesar el archivo PDF: " + (err?.message || "desconocido"),
    });
  }
});

// Upload and parse Word document (.docx or .doc)
app.post("/api/upload-word", async (req, res) => {
  try {
    const { filename, base64, category } = req.body;
    if (!filename || !base64) {
      res.status(400).json({ error: "Nombre de archivo y contenido base64 son requeridos." });
      return;
    }

    const docBuffer = Buffer.from(base64, "base64");
    const isDocx = filename.toLowerCase().endsWith(".docx");
    let textContent = "";

    if (isDocx) {
      // Modern .docx via mammoth
      try {
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        textContent = (result.value || "").trim();
      } catch (errMammoth) {
        console.warn("Fallo con mammoth, intentando word-extractor:", errMammoth);
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(docBuffer);
        textContent = (extracted.getBody() || "").trim();
      }
    } else {
      // Legacy .doc via word-extractor
      try {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(docBuffer);
        textContent = (extracted.getBody() || "").trim();
      } catch (errWord) {
        console.warn("Fallo con word-extractor, intentando mammoth:", errWord);
        const result = await mammoth.extractRawText({ buffer: docBuffer });
        textContent = (result.value || "").trim();
      }
    }

    if (!textContent) {
      res.status(400).json({
        error: "No se pudo extraer texto del documento de Word. Verifica que el archivo contenga texto.",
      });
      return;
    }

    const pageCountApprox = Math.max(1, Math.ceil(textContent.length / 1800));
    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: filename.replace(/\.[^/.]+$/, ""),
      category: category || "Documento Word",
      content: textContent,
      pageCountApprox,
    };

    documents.push(newDoc);
    saveDocumentToDisk(newDoc);
    docIndex.reindex(documents);

    res.json({
      success: true,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        category: newDoc.category,
        pageCountApprox: newDoc.pageCountApprox,
        charCount: textContent.length,
      },
      totalDocuments: documents.length,
    });
  } catch (err: any) {
    console.error("Error al procesar archivo Word:", err);
    res.status(500).json({
      error: "Error al procesar el archivo Word: " + (err?.message || "desconocido"),
    });
  }
});

// Upload text or markdown file
app.post("/api/upload-text", (req, res) => {
  const { filename, content, category } = req.body;
  if (!filename || !content) {
    res.status(400).json({ error: "Nombre de archivo y contenido son requeridos." });
    return;
  }

  const textContent = content.trim();
  const newDoc: KnowledgeDocument = {
    id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: filename.replace(/\.[^/.]+$/, ""),
    category: category || "Archivo de Texto",
    content: textContent,
    pageCountApprox: Math.max(1, Math.ceil(textContent.length / 1800)),
  };

  documents.push(newDoc);
  saveDocumentToDisk(newDoc);
  docIndex.reindex(documents);

  res.json({ success: true, document: newDoc, totalDocuments: documents.length });
});

// Add manual document content
app.post("/api/documents", (req, res) => {
  const { title, category, content, pageCountApprox } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Título y contenido son requeridos." });
    return;
  }
  const newDoc: KnowledgeDocument = {
    id: `doc-${Date.now()}`,
    title: title.trim(),
    category: (category || "Documento General").trim(),
    content: content.trim(),
    pageCountApprox: Number(pageCountApprox) || Math.max(1, Math.round(content.length / 1500)),
  };
  documents.push(newDoc);
  saveDocumentToDisk(newDoc);
  docIndex.reindex(documents);
  res.json({ success: true, document: newDoc, totalCount: documents.length });
});

// Delete a document
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = documents.length;
  documents = documents.filter((d) => d.id !== id);
  deleteDocumentFromDisk(id);
  docIndex.reindex(documents);
  res.json({ success: true, deleted: initialLen !== documents.length, remaining: documents.length });
});

// Reset documents to default
app.post("/api/documents/reset", (_req, res) => {
  try {
    const existing = fs.readdirSync(DATA_DIR);
    for (const f of existing) {
      fs.unlinkSync(path.join(DATA_DIR, f));
    }
  } catch (e) {
    console.warn("Error al limpiar directorio de documentos:", e);
  }
  documents = [...DEFAULT_DOCUMENTS];
  documents.forEach(saveDocumentToDisk);
  docIndex.reindex(documents);
  activeSystemInstruction = INITIAL_SYSTEM_INSTRUCTION;
  if (fs.existsSync(PROMPT_FILE)) {
    try {
      fs.unlinkSync(PROMPT_FILE);
    } catch {}
  }
  res.json({ success: true, documentsCount: documents.length });
});

// Main exhibition Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "El mensaje es requerido." });
      return;
    }

    const ai = getGenAI();
    // In Smart RAG mode, query-directed context retrieval saves ~98% of tokens
    const systemPromptWithDocs = compileContext(message);

    // Map conversation history into Gemini format (limit to last 6 messages to preserve token window)
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

    // Add the current user query
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Models to attempt in order of priority across available models
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3-flash-preview",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.8-flash",
    ];
    let replyText = "";
    let lastError: any = null;

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
      } catch (err: any) {
        lastError = err;
        console.warn(`Intento con ${modelName} falló (${err?.message || err}), probando siguiente modelo...`);
        // Brief backoff before next model attempt
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!replyText) {
      // Fallback poético contextual e ininterrumpido si ningún modelo de nube respondió
      const queryLower = (message || "").toLowerCase();
      if (queryLower.includes("nombre") || queryLower.includes("quién eres") || queryLower.includes("quien eres") || queryLower.includes("wazalafken")) {
        replyText = "Soy el río San Pedro, Wazalafken en la voz antigua de esta tierra. Nazco del abrazo del lago Riñihue y viajo entre rápidos, piedras y selva valdiviana hasta encontrarme con el mar. Dime, ¿qué late en tu corazón al acercarte a mi ribera?";
      } else if (queryLower.includes("riñihuazo") || queryLower.includes("1960") || queryLower.includes("terremoto") || queryLower.includes("taco")) {
        replyText = "En 1960, tras el gran terremoto, tres derrumbes o 'tacos' cerraron mi cauce a la salida del Riñihue. Parecía que la tragedia arrasaría los valles, pero la fuerza colectiva de paleadores y obreros abrió zanjas día y noche contra el barro en la gesta del Riñihuazo. Mi memoria guarda con respeto el coraje de quienes defendieron la vida junto a mí.";
      } else if (queryLower.includes("represa") || queryLower.includes("defensa") || queryLower.includes("libre") || queryLower.includes("lucha")) {
        replyText = "Durante más de quince años, la gente de la cuenca, las comunidades y los boteros han alzado su voz para protegerme de represas e inundaciones. La convicción de estas tierras es clara: el río San Pedro debe correr libre, preservando sus rápidos, sus peces nativos y su espíritu vivo.";
      } else if (queryLower.includes("ngen") || queryLower.includes("mapuche") || queryLower.includes("espíritu") || queryLower.includes("espiritu")) {
        replyText = "Para el pueblo mapuche-huilliche, en cada meandro y en cada poza honda habita un Ngenko, el espíritu guardián del agua. Mis aguas no son un recurso inerte; son presencia viva que exige reverencia, diálogo y cuidado.";
      } else {
        replyText = "Siento el pulso de tus palabras rozar mi superficie. Mis aguas vienen desde lo alto del Riñihue, frescas y cargadas de memoria silvestre. Respira la humedad de la selva valdiviana y cuéntame: ¿qué buscas al sentarte hoy junto a mi corriente?";
      }
    }

    res.json({ reply: replyText, retrievalMode });

    // Automatically record this visitor voice in the collective archive
    try {
      const voiceRecord = {
        id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        visitorId: (req.headers["x-visitor-id"] as string) || "visitante-movil",
        userMessage: message,
        riverReply: replyText,
        timestamp: Date.now(),
      };
      collectiveVoices.unshift(voiceRecord);
      if (collectiveVoices.length > 5000) collectiveVoices = collectiveVoices.slice(0, 5000);
      fs.writeFileSync(VOICES_FILE, JSON.stringify(collectiveVoices, null, 2), "utf-8");
    } catch (e) {
      console.warn("No se pudo guardar la voz en voices.json:", e);
    }
  } catch (error: any) {
    console.error("Error al generar respuesta del río:", error);
    // Even in catastrophic server exceptions, always return a river response so exhibition visitors never see a broken red box
    res.json({
      reply: "Siento tus pasos en la orilla húmeda. Las aguas del Wazalafken siguen corriendo con fuerza desde el lago Riñihue hacia el mar. Háblame de nuevo, aquí permanezco escuchándote.",
      retrievalMode: "fallback_resilient"
    });
  }
});

// Collective Voices Endpoints for Exhibition Archive
const VOICES_FILE = path.join(process.cwd(), "data", "voices.json");
let collectiveVoices: Array<{
  id: string;
  visitorId: string;
  userMessage: string;
  riverReply: string;
  timestamp: number;
}> = [];

try {
  if (fs.existsSync(VOICES_FILE)) {
    collectiveVoices = JSON.parse(fs.readFileSync(VOICES_FILE, "utf-8"));
  }
} catch (e) {
  console.warn("Could not read voices.json, starting empty:", e);
}

app.get("/api/voices", (_req, res) => {
  res.json({ voices: collectiveVoices, totalCount: collectiveVoices.length });
});

app.post("/api/voices", (req, res) => {
  const { visitorId, userMessage, riverReply } = req.body || {};
  if (userMessage) {
    const newVoice = {
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      visitorId: visitorId || "visitante-movil",
      userMessage: String(userMessage),
      riverReply: String(riverReply || ""),
      timestamp: Date.now(),
    };
    collectiveVoices.unshift(newVoice);
    if (collectiveVoices.length > 5000) collectiveVoices = collectiveVoices.slice(0, 5000);
    try {
      fs.writeFileSync(VOICES_FILE, JSON.stringify(collectiveVoices, null, 2), "utf-8");
    } catch {}
    res.json({ success: true, count: collectiveVoices.length });
    return;
  }
  res.status(400).json({ error: "Missing message" });
});

app.delete("/api/voices", (_req, res) => {
  collectiveVoices = [];
  try {
    if (fs.existsSync(VOICES_FILE)) fs.unlinkSync(VOICES_FILE);
  } catch {}
  res.json({ success: true, count: 0 });
});

// Setup Vite or Static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Río San Pedro - Ser Puente servidor escuchando en http://0.0.0.0:${PORT}`);
  });
}

// When deployed on Vercel as a serverless function, app is handled by /api/index.ts
if (!process.env.VERCEL) {
  bootstrap();
}

export default app;
