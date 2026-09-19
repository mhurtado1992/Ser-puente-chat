import { VisitorVoiceRecord } from "../types";

const LOCAL_VOICES_KEY = "exhibition_collective_voices_v1";
const VISITOR_ID_KEY = "exhibition_visitor_session_id_v1";

export function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      id = `Visitante #${randomSuffix}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return "Visitante";
  }
}

export function loadLocalVoices(): VisitorVoiceRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_VOICES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export async function logVisitorVoice(
  userMessage: string,
  riverReply: string
): Promise<VisitorVoiceRecord> {
  const visitorId = getOrCreateVisitorId();
  const record: VisitorVoiceRecord = {
    id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    visitorId,
    userMessage,
    riverReply,
    timestamp: Date.now(),
  };

  // 1. Save locally so it's always accessible in this browser
  try {
    const current = loadLocalVoices();
    const updated = [record, ...current].slice(0, 1000);
    localStorage.setItem(LOCAL_VOICES_KEY, JSON.stringify(updated));
  } catch {}

  // 2. Synchronize to server (Express or Vercel /api/voices) asynchronously
  try {
    fetch("/api/voices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Visitor-Id": visitorId,
      },
      body: JSON.stringify(record),
    }).catch(() => {});
  } catch {}

  return record;
}

export async function fetchServerVoices(): Promise<VisitorVoiceRecord[]> {
  try {
    const res = await fetch("/api/voices");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.voices) && data.voices.length > 0) {
        return data.voices;
      }
    }
  } catch {}
  return loadLocalVoices();
}

/**
 * Downloads all voices as an Excel-friendly CSV with UTF-8 BOM
 * so accents (á, é, í, ó, ú, ñ) display perfectly in Microsoft Excel.
 */
export function exportVoicesToCSV(voices: VisitorVoiceRecord[], exhibitionTitle = "Ser Puente"): void {
  if (!voices || voices.length === 0) return;

  const headers = ["Fecha y Hora", "Identificador Visitante", "Mensaje del Público", "Respuesta del Río"];
  
  const rows = voices.map((v) => {
    const dateStr = new Date(v.timestamp).toLocaleString("es-CL", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const escapeCsv = (str: string) => {
      const clean = (str || "").replace(/"/g, '""');
      return `"${clean}"`;
    };

    return [
      escapeCsv(dateStr),
      escapeCsv(v.visitorId),
      escapeCsv(v.userMessage),
      escapeCsv(v.riverReply),
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `Voces_del_Rio_${exhibitionTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all voices as structured JSON for digital archives or catalogue publishing.
 */
export function exportVoicesToJSON(voices: VisitorVoiceRecord[], exhibitionTitle = "Ser Puente"): void {
  if (!voices || voices.length === 0) return;

  const data = {
    exhibition: exhibitionTitle,
    exportedAt: new Date().toISOString(),
    totalVoices: voices.length,
    voices,
  };

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `Voces_del_Rio_${exhibitionTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
