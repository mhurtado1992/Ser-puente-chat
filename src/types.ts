export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export type ExhibitionThemeId = "deep_river" | "white_gallery" | "valdivian_forest" | "stone_canyon";

export interface ExhibitionAesthetics {
  theme: ExhibitionThemeId;
  title: string;
  subtitle: string;
  fontStyle: "serif" | "sans";
  waterAnimation: "full" | "subtle" | "none";
}

export interface VisitorVoiceRecord {
  id: string;
  visitorId: string;
  userMessage: string;
  riverReply: string;
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
