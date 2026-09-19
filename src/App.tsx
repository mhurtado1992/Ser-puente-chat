import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage, ExhibitionConfig, ExhibitionAesthetics } from "./types";
import { ExhibitionHeader } from "./components/ExhibitionHeader";
import { MessageItem } from "./components/MessageItem";
import { CuratorModal } from "./components/CuratorModal";
import { WaterVisualizer } from "./components/WaterVisualizer";
import { queryRiver } from "./utils/riverEngine";
import { THEMES, loadAesthetics } from "./utils/themeConfig";
import { logVisitorVoice } from "./utils/visitorVoices";

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
  const [aesthetics, setAesthetics] = useState<ExhibitionAesthetics>(loadAesthetics);

  const themeStyles = THEMES[aesthetics.theme] || THEMES.deep_river;
  const isSerif = aesthetics.fontStyle === "serif";

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
      // Prepare history formatted for queryRiver
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Resilient river query: tries server, then client Gemini, then local autonomous river engine
      const { reply } = await queryRiver(text, historyPayload);

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: reply || "Mis aguas guardan silencio en este momento...",
        timestamp: Date.now(),
      };
      setMessages([...nextHistory, modelMsg]);

      // Automatically register the interaction in the collective voices archive
      logVisitorVoice(text, modelMsg.text).catch(() => {});
    } catch (err: any) {
      console.error(err);
      const fallbackReply =
        "Siento tus pasos en la orilla del Wazalafken. La corriente sigue su curso entre las piedras del Riñihue hacia el mar. Cuéntame, ¿qué buscas al mirar hoy en mis aguas?";
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        text: fallbackReply,
        timestamp: Date.now(),
      };
      setMessages([...nextHistory, modelMsg]);
      logVisitorVoice(text, fallbackReply).catch(() => {});
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
    <div
      className={`min-h-screen flex flex-col relative transition-colors duration-300 ${themeStyles.containerBg} ${themeStyles.textColor} ${
        isSerif ? "font-serif" : "font-sans"
      }`}
    >
      {/* Dynamic Background Water Animation */}
      <WaterVisualizer mode={aesthetics.waterAnimation} themeStyles={themeStyles} />

      {/* Main Header */}
      <ExhibitionHeader
        onResetChat={handleResetChat}
        onOpenCurator={() => setIsCuratorOpen(true)}
        messageCount={messages.length}
        aesthetics={aesthetics}
        themeStyles={themeStyles}
      />

      {/* Main Chat Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col relative z-10">
        {/* Welcome State / Gallery Entrance */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8 sm:py-16 space-y-8 animate-fade-in">
            {/* Medallion */}
            <div className="relative">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center shadow-lg mx-auto ${themeStyles.accentIconBg} ${themeStyles.accentIconBorder} ${themeStyles.accentColor}`}
              >
                <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 opacity-90 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 inset-x-0 mx-auto w-12 h-1 bg-teal-500/20 blur-sm rounded-full"></div>
            </div>

            {/* Poetic Intro */}
            <div className="space-y-4 max-w-xl mx-auto px-2">
              <span className={`text-[11px] font-mono uppercase tracking-[0.25em] ${themeStyles.accentColor}`}>
                Instalación Sonora & Dialógica
              </span>
              <h2
                className={`text-2xl sm:text-4xl tracking-wide font-light leading-snug ${
                  isSerif ? "font-serif" : "font-sans font-normal"
                } ${themeStyles.textColor}`}
              >
                Habla con el Río San Pedro
              </h2>
              <p
                className={`text-sm sm:text-base italic font-light leading-relaxed ${
                  themeStyles.textMuted
                }`}
              >
                "Mis aguas nacen en el lago Riñihue y viajan llevando la memoria del Riñihuazo, las voces de las comunidades ribereñas, las piedras y los rápidos que defienden mi curso libre. Siéntate a mi orilla... ¿qué deseas saber?"
              </p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-light ${themeStyles.accentBadge}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Acceso libre: escribe directamente abajo sin necesidad de registrarte ni iniciar sesión
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <p className={`text-xs uppercase font-mono tracking-widest mb-3 ${themeStyles.textMuted}`}>
                Preguntas sugeridas al río:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    id={`suggested-question-${idx}`}
                    onClick={() => handleSendMessage(q)}
                    type="button"
                    className={`p-3 text-left text-xs italic rounded-xl transition-all duration-200 shadow-sm border ${
                      themeStyles.isLight
                        ? "bg-white/90 hover:bg-teal-50/50 text-stone-800 border-stone-300 hover:border-teal-500/60"
                        : "bg-[#0a0e12]/80 hover:bg-teal-950/40 text-stone-300 hover:text-teal-200 border-stone-800 hover:border-teal-800/60"
                    }`}
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
              <MessageItem
                key={msg.id}
                message={msg}
                themeStyles={themeStyles}
                fontStyle={aesthetics.fontStyle}
              />
            ))}

            {/* Model Thinking Ripple */}
            {isLoading && (
              <div className="flex gap-3 sm:gap-4 my-4 sm:my-6 justify-start items-center">
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center animate-spin ${themeStyles.accentIconBg} ${themeStyles.accentIconBorder} ${themeStyles.accentColor}`}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div
                  className={`rounded-2xl px-5 py-3.5 text-xs sm:text-sm italic flex items-center gap-2 border ${
                    themeStyles.isLight
                      ? "bg-white border-stone-300 text-stone-700 shadow-sm"
                      : "bg-[#0c1014]/90 border-stone-800/90 text-stone-400"
                  }`}
                >
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
      <footer
        className={`sticky bottom-0 z-30 w-full backdrop-blur-lg border-t pb-safe transition-colors ${themeStyles.inputContainerBg}`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`relative flex items-end gap-2 border focus-within:ring-1 focus-within:ring-teal-500/40 rounded-2xl p-2 transition-all shadow-lg ${themeStyles.inputBg} ${themeStyles.inputBorder}`}
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
              className={`flex-1 bg-transparent text-sm sm:text-base px-3 py-1.5 resize-none focus:outline-none min-h-[38px] max-h-[120px] ${
                themeStyles.isLight
                  ? "text-stone-900 placeholder-stone-400"
                  : "text-stone-100 placeholder-stone-500"
              }`}
            />

            <button
              id="send-message-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:hover:bg-teal-600 text-white transition-all shadow-md flex-shrink-0"
              title="Enviar mensaje al río"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div
            className={`flex items-center justify-between mt-2 px-1 text-[11px] ${themeStyles.textMuted}`}
          >
            <span>"{aesthetics.title}" — Exposición Interactiva</span>
            <span className="hidden sm:inline">Presiona Enter para enviar</span>
            <span>Acceso Abierto Sin Registro</span>
          </div>
        </div>
      </footer>

      {/* Curator & Prompt Modal */}
      <CuratorModal
        isOpen={isCuratorOpen}
        onClose={() => setIsCuratorOpen(false)}
        config={config}
        onRefreshConfig={fetchConfig}
        aesthetics={aesthetics}
        onUpdateAesthetics={setAesthetics}
      />
    </div>
  );
}
