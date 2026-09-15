import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, AlertCircle, CornerDownLeft } from "lucide-react";
import { ChatMessage, ExhibitionConfig } from "./types";
import { ExhibitionHeader } from "./components/ExhibitionHeader";
import { MessageItem } from "./components/MessageItem";
import { CuratorModal } from "./components/CuratorModal";
import { WaterVisualizer } from "./components/WaterVisualizer";

const SUGGESTED_QUESTIONS = [
  "¿Cómo viviste la hazaña solidaria del Riñihuazo en 1960?",
  "¿Qué significa para ti correr libre y sin represas?",
  "¿Qué seres y espíritus habitan tus aguas profundas?",
  "¿Qué memorias guardas de las comunidades que caminan tu orilla?",
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ExhibitionConfig | null>(null);
  const [isCuratorOpen, setIsCuratorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn("No se pudo obtener la configuración del servidor:", e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      // Prepare history formatted for the API
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: data.reply || "Mis aguas guardan silencio en este momento...",
        timestamp: Date.now(),
      };
      setMessages([...nextHistory, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message || "Ocurrió una interrupción en la corriente. Por favor intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-stone-200 flex flex-col relative selection:bg-teal-950 selection:text-teal-200">
      {/* Dynamic Background Water Animation */}
      <WaterVisualizer />

      {/* Main Header */}
      <ExhibitionHeader
        onResetChat={handleResetChat}
        onOpenCurator={() => setIsCuratorOpen(true)}
        messageCount={messages.length}
      />

      {/* Main Chat Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col relative z-10">
        {/* Welcome State / Gallery Entrance */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-16 space-y-8 animate-fade-in">
            {/* Medallion */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-teal-950/60 to-stone-950 border border-teal-800/40 flex items-center justify-center text-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.15)] mx-auto">
                <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 opacity-90 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 inset-x-0 mx-auto w-12 h-1 bg-teal-500/20 blur-sm rounded-full"></div>
            </div>

            {/* Poetic Intro */}
            <div className="space-y-4 max-w-xl mx-auto px-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-teal-400/80">
                Instalación Sonora & Dialógica
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif tracking-wide text-stone-100 font-light leading-snug">
                Habla con el Río San Pedro
              </h2>
              <p className="text-sm sm:text-base font-serif italic text-stone-400 font-light leading-relaxed">
                "Mis aguas nacen en el lago Riñihue y viajan llevando la memoria del Riñihuazo, las voces de las comunidades ribereñas, las piedras y los rápidos que defienden mi curso libre. Siéntate a mi orilla... ¿qué deseas saber?"
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/40 border border-teal-800/40 text-[11px] text-teal-300 font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Acceso libre: escribe directamente abajo sin necesidad de registrarte ni iniciar sesión
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <p className="text-xs uppercase font-mono tracking-widest text-stone-400 mb-3">
                Preguntas sugeridas al río:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    id={`suggested-question-${idx}`}
                    onClick={() => handleSendMessage(q)}
                    type="button"
                    className="p-3 text-left text-xs font-serif italic text-stone-300 bg-[#0a0e12]/80 hover:bg-teal-950/40 hover:text-teal-200 border border-stone-800 hover:border-teal-800/60 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.length > 0 && (
          <div className="flex-1 space-y-1 pb-4">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}

            {/* Model Thinking Ripple */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 my-4 sm:my-6 justify-start items-center">
                <div className="w-8 h-8 rounded-full bg-teal-950/60 border border-teal-800/40 flex items-center justify-center text-teal-300 animate-spin">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-[#0c1014]/90 border border-stone-800/90 rounded-2xl px-5 py-3.5 text-stone-400 text-xs sm:text-sm font-serif italic flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                  Las aguas se agitan y buscan en su memoria...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="my-3 p-3.5 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </main>

      {/* Sticky Bottom Input Bar */}
      <footer className="sticky bottom-0 z-30 w-full backdrop-blur-lg bg-[#06080a]/90 border-t border-stone-800/80 pb-safe">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-end gap-2 bg-[#0c1014] border border-stone-800 focus-within:border-teal-600/70 focus-within:ring-1 focus-within:ring-teal-500/30 rounded-2xl p-2 transition-all shadow-xl"
          >
            <textarea
              id="visitor-chat-textarea"
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Habla con el río San Pedro..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-stone-100 placeholder-stone-400 text-sm sm:text-base font-serif px-3 py-1.5 resize-none focus:outline-none min-h-[38px] max-h-[120px]"
            />

            <button
              id="send-message-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:hover:bg-teal-600 text-white transition-all shadow-[0_0_12px_rgba(20,184,166,0.2)] flex-shrink-0"
              title="Enviar mensaje al río"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-400 font-serif">
            <span>"Ser Puente" — Exposición Interactiva</span>
            <span className="hidden sm:inline">Presiona Enter para enviar</span>
            <span>Gemini 2.5 Flash · Gratuito</span>
          </div>
        </div>
      </footer>

      {/* Curator & Prompt Modal */}
      <CuratorModal
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        config={config}
        onRefreshConfig={fetchConfig}
      />
    </div>
  );
}
