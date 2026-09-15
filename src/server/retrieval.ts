import type { KnowledgeDocument } from "./knowledge.ts";

export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  category: string;
  text: string;
  keywords: string[];
}

const SPANISH_STOPWORDS = new Set([
  "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con",
  "no", "una", "su", "al", "lo", "como", "mas", "más", "pero", "sus", "le", "ya", "o", "este",
  "sí", "porque", "esta", "entre", "cuando", "muy", "sin", "sobre", "también", "me", "hasta",
  "hay", "donde", "quien", "desde", "todo", "nos", "durante", "todos", "uno", "les", "ni", "contra",
  "otros", "ese", "eso", "ante", "ellos", "e", "esto", "mí", "antes", "algunos", "qué", "unos", "yo",
  "otro", "otras", "otra", "él", "tanto", "esa", "estos", "mucho", "quienes", "nada", "muchos", "cual",
  "sea", "poco", "ella", "estar", "haber", "estas", "estaba", "estamos", "estan", "están"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents for fuzzy matching
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SPANISH_STOPWORDS.has(w));
}

export class DocumentIndex {
  private chunks: DocumentChunk[] = [];

  constructor() {
    this.chunks = [];
  }

  get totalChunks(): number {
    return this.chunks.length;
  }

  /**
   * Reindexes all documents into chunked passages
   */
  public reindex(documents: KnowledgeDocument[]) {
    const newChunks: DocumentChunk[] = [];

    for (const doc of documents) {
      const docChunks = this.chunkDocument(doc);
      newChunks.push(...docChunks);
    }

    this.chunks = newChunks;
    console.log(`[Índice RAG] Indexados ${this.chunks.length} fragmentos de ${documents.length} documentos.`);
  }

  /**
   * Splits a single document into overlapping passages (~350 words each)
   */
  private chunkDocument(doc: KnowledgeDocument): DocumentChunk[] {
    const paragraphs = doc.content.split(/\n\s*\n/);
    const passages: string[] = [];
    let currentWords: string[] = [];

    for (const para of paragraphs) {
      const words = para.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      if (currentWords.length + words.length > 380) {
        if (currentWords.length > 0) {
          passages.push(currentWords.join(" "));
          // keep last 50 words as overlap
          currentWords = currentWords.slice(-50);
        }
      }

      currentWords.push(...words);
    }

    if (currentWords.length > 0) {
      passages.push(currentWords.join(" "));
    }

    // If document is very short and no passages were generated
    if (passages.length === 0 && doc.content.trim().length > 0) {
      passages.push(doc.content.trim());
    }

    return passages.map((passage, idx) => ({
      id: `${doc.id}-chunk-${idx}`,
      docId: doc.id,
      docTitle: doc.title,
      category: doc.category,
      text: passage,
      keywords: tokenize(`${doc.title} ${doc.category} ${passage}`),
    }));
  }

  /**
   * Search for top K most relevant chunks for a user query
   */
  public search(query: string, topK: number = 4): DocumentChunk[] {
    if (this.chunks.length === 0) return [];
    
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      // Return first few chunks as fallback
      return this.chunks.slice(0, topK);
    }

    const scored: Array<{ chunk: DocumentChunk; score: number }> = [];

    for (const chunk of this.chunks) {
      let score = 0;
      const titleTokens = tokenize(chunk.docTitle);
      const categoryTokens = tokenize(chunk.category);

      for (const token of queryTokens) {
        // Boost for matches in document title
        if (titleTokens.includes(token)) {
          score += 5;
        }
        // Boost for category matches
        if (categoryTokens.includes(token)) {
          score += 3;
        }
        // Frequency in chunk keywords
        const freq = chunk.keywords.filter((kw) => kw === token).length;
        if (freq > 0) {
          score += Math.log(1 + freq) * 2;
        }
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // If we have matches, take top K
    if (scored.length > 0) {
      return scored.slice(0, topK).map((s) => s.chunk);
    }

    // Fallback: Return top K general chunks if query doesn't match specific words
    return this.chunks.slice(0, topK);
  }
}
