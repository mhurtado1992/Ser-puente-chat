export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface ExhibitionConfig {
  systemInstruction: string;
  documentsCount: number;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    preview: string;
    pageCountApprox?: number;
  }>;
  totalPagesApprox: number;
  hasApiKey: boolean;
  retrievalMode?: "smart_rag" | "full_context";
  totalChunks?: number;
  estimatedTokensPerQuery?: number;
}
