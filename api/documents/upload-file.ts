import type { VercelRequest, VercelResponse } from "@vercel/node";
// @ts-ignore
import mammoth from "mammoth";
// @ts-ignore
import { PDFParse } from "pdf-parse";
import { type KnowledgeDocument } from "../_knowledge.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { filename, base64, base64Data, category, fileType } = body || {};
    const rawBase64 = base64 || base64Data;

    if (!filename || !rawBase64) {
      res.status(400).json({ error: "Nombre de archivo y base64 requeridos." });
      return;
    }

    const cleanBase64 = String(rawBase64).replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const lower = (filename || "").toLowerCase();
    const isPdf = fileType === "pdf" || lower.endsWith(".pdf");
    const isDocx = fileType === "docx" || lower.endsWith(".docx") || lower.endsWith(".doc");

    let text = "";
    let pages = 1;

    if (isPdf) {
      const parser = new (PDFParse as any)({ data: buffer });
      const parsed = await parser.getText();
      text = (parsed.text || "").trim();
      pages = (parsed as any).total || Math.max(1, Math.ceil(text.length / 1800));
      try {
        await parser.destroy?.();
      } catch {}
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      text = (result.value || "").trim();
      pages = Math.max(1, Math.ceil(text.length / 1800));
    } else {
      text = buffer.toString("utf-8").trim();
      pages = Math.max(1, Math.ceil(text.length / 1800));
    }

    if (!text) {
      res.status(400).json({ error: `No se pudo extraer texto legible de "${filename}".` });
      return;
    }

    const cleanTitle = (filename || "").replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      category: category || "Archivos & Testimonios de la Exposición",
      content: text,
      pageCountApprox: pages,
    };

    res.status(200).json({
      success: true,
      document: {
        id: newDoc.id,
        title: newDoc.title,
        category: newDoc.category,
        pageCountApprox: newDoc.pageCountApprox,
        charCount: text.length,
        preview: text.substring(0, 150) + "...",
      },
    });
  } catch (err: any) {
    console.error("Error en api/documents/upload-file:", err);
    res.status(500).json({
      error: `Error al incorporar documento: ${err?.message || "desconocido"}`,
    });
  }
}
