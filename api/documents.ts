import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DEFAULT_DOCUMENTS, type KnowledgeDocument } from "./_knowledge.js";

// In-memory store for serverless runtime
let documentsCache: KnowledgeDocument[] = [...DEFAULT_DOCUMENTS];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({
      success: true,
      documents: documentsCache,
      count: documentsCache.length,
    });
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { title, category, content, pageCountApprox } = body || {};
    if (!title || !content) {
      res.status(400).json({ error: "Título y contenido son requeridos." });
      return;
    }

    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      category: String(category || "Archivos & Testimonios de la Exposición").trim(),
      content: String(content).trim(),
      pageCountApprox: Number(pageCountApprox) || Math.max(1, Math.round(content.length / 1800)),
    };

    documentsCache.push(newDoc);

    res.status(200).json({
      success: true,
      document: newDoc,
      totalCount: documentsCache.length,
    });
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (id) {
      documentsCache = documentsCache.filter((d) => d.id !== id);
    }
    res.status(200).json({ success: true, count: documentsCache.length });
    return;
  }

  res.status(405).json({ error: "Método no permitido" });
}
