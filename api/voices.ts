import type { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory collection of voices for serverless runtime
interface VoiceRecord {
  id: string;
  visitorId: string;
  userMessage: string;
  riverReply: string;
  timestamp: number;
}

let sharedVoices: VoiceRecord[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const { visitorId, userMessage, riverReply } = body || {};
    if (userMessage) {
      const record: VoiceRecord = {
        id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        visitorId: visitorId || "visitante-movil",
        userMessage: String(userMessage),
        riverReply: String(riverReply || ""),
        timestamp: Date.now(),
      };
      sharedVoices.unshift(record);
      // Keep last 1000 voices in memory
      if (sharedVoices.length > 1000) {
        sharedVoices = sharedVoices.slice(0, 1000);
      }
      res.status(200).json({ success: true, count: sharedVoices.length });
      return;
    }
  }

  // GET: return list of registered voices
  res.status(200).json({
    voices: sharedVoices,
    totalCount: sharedVoices.length,
  });
}
