import type { VercelRequest, VercelResponse } from "@vercel/node";
import { INITIAL_SYSTEM_INSTRUCTION, DEFAULT_DOCUMENTS } from "../src/server/knowledge.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const totalPages = DEFAULT_DOCUMENTS.reduce((sum, d) => sum + (d.pageCountApprox || 10), 0);
  const totalWords = DEFAULT_DOCUMENTS.reduce((sum, d) => sum + d.content.split(/\s+/).length, 0);

  res.status(200).json({
    systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
    documentsCount: DEFAULT_DOCUMENTS.length,
    documents: DEFAULT_DOCUMENTS.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      pageCountApprox: d.pageCountApprox,
      charCount: d.content.length,
      sample: d.content.substring(0, 150) + "...",
    })),
    totalPagesApprox: totalPages,
    totalWordsApprox: totalWords,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    retrievalMode: "smart_rag",
    totalChunks: DEFAULT_DOCUMENTS.length,
    estimatedTokensPerQuery: 2500,
  });
}
