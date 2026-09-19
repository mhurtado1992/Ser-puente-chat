import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, AlertCircle, Waves } from "lucide-react";
import { ChatMessage, ExhibitionConfig, ExhibitionAesthetics } from "./types";
import { ExhibitionHeader } from "./components/ExhibitionHeader";
import { MessageItem } from "./components/MessageItem";
import { CuratorModal } from "./components/CuratorModal";
import { WaterVisualizer } from "./components/WaterVisualizer";
import { queryRiver } from "./utils/riverEngine";
import { THEMES, loadAesthetics } from "./utils/themeConfig";
import { logVisitorVoice } from "./utils/visitorVoices";
import riverPhoto from "./assets/images/rio_san_pedro.jpg";

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

  const handleStartConnectionsGame = () => {
    const modelMsg: ChatMessage = {
      id: `msg-${Date.now()}-model`,
      role: "model",
      text: "Soy el río San Pedro, Wazalafken. Cuéntame un recuerdo tuyo con un río, un mar, un lago, o cualquier cuerpo de agua — no tiene que ser conmigo. Todos somos parte de la misma red.",
      timestamp: Date.now(),
    };
    setMessages([modelMsg]);
  };

  const handleStartExploreVoices = () => {
    const modelMsg: ChatMessage = {
      id: `msg-${Date.now()}-model`,
      role: "model",
      text: "Soy el río San Pedro, Wazalafken. Llevo dentro las voces reales de personas que conocieron mi cuenca: desde los relatos de la gesta del Riñihuazo en 1960 y la memoria de los boteros de Los Lagos, hasta las investigaciones de quienes defienden mis aguas libres de represas. Puedes preguntarme libremente sobre alguna de estas historias o lo que desees conocer de mi cauce.",
      timestamp: Date.now(),
    };
    setMessages([modelMsg]);
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
          <div className="flex-1 flex flex-col justify-center my-auto py-6 sm:py-12 space-y-6 sm:space-y-8 animate-fade-in">
            {/* Intro layout: text on the left, photograph adjusted to the right */}
            <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-8">
              {/* Text block */}
              <div className="flex-1 space-y-3 sm:space-y-4 text-left">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#2b3cdb] block">
                  Instalación Sonora & Dialógica
                </span>
                <h2
                  className={`text-[21px] tracking-wide font-light leading-snug ${
                    isSerif ? "font-serif" : "font-sans font-normal"
                  } text-[#2b3cdb]`}
                >
                  Habla con el Río San Pedro
                </h2>
                <p className="text-[10px] leading-[15.75px] italic font-light text-[#2b3cdb]">
                  "Mis aguas nacen en el lago Riñihue y viajan llevando la memoria del Riñihuazo, las voces de las comunidades ribereñas, las piedras y los rápidos que defienden mi curso libre. Siéntate a mi orilla... ¿qué deseas saber?"
                </p>
              </div>

              {/* Photo adjusted to the right */}
              <div className="w-full sm:w-72 md:w-64 lg:w-72 shrink-0 self-center md:self-start flex flex-col items-end">
                <div className="relative group w-full overflow-hidden">
                  <img
                    src={riverPhoto}
                    alt="Río San Pedro"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2b3cdb]/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Suggestion Starter Buttons (Google-style) */}
            <div className="w-full pt-1 sm:pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {/* Botón 1: El juego de las conexiones */}
                <button
                  id="btn-start-connections-game"
                  type="button"
                  onClick={handleStartConnectionsGame}
                  className="group relative p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 bg-white hover:bg-blue-50/40 border-[#e6dfd1] hover:border-[#2b3cdb] text-[#2b3cdb]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-9 h-9 rounded-xl bg-[#2b3cdb]/15 text-[#2b3cdb] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#2b3cdb] font-medium px-2 py-0.5 rounded-full bg-[#2b3cdb]/10 border border-[#2b3cdb]/30">
                      Paso a paso
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-[#2b3cdb]">El juego de las conexiones</h3>
                    <p className="text-xs mt-1 leading-snug text-[#2b3cdb]/80">
                      Comparte un recuerdo con el agua y descubre qué historia te responde.
                    </p>
                  </div>
                </button>

                {/* Botón 2: Explora las voces del río */}
                <button
                  id="btn-start-explore-voices"
                  type="button"
                  onClick={handleStartExploreVoices}
                  className="group relative p-4 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 bg-white hover:bg-blue-50/40 border-[#e6dfd1] hover:border-[#2b3cdb] text-[#2b3cdb]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-9 h-9 rounded-xl bg-[#2b3cdb]/15 text-[#2b3cdb] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Waves className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#2b3cdb] font-medium px-2 py-0.5 rounded-full bg-[#2b3cdb]/10 border border-[#2b3cdb]/30">
                      Diálogo libre
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-[#2b3cdb]">Explora las voces del río</h3>
                    <p className="text-xs mt-1 leading-snug text-[#2b3cdb]/80">
                      Conversa libremente sobre testimonios reales, historia y el cauce libre.
                    </p>
                  </div>
                </button>
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
                  className="rounded-2xl px-5 py-3.5 text-xs sm:text-sm italic flex items-center gap-2 border bg-white border-[#e6dfd1] text-[#2b3cdb] shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2b3cdb] animate-ping"></span>
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
            className={`relative flex items-end gap-2 border focus-within:ring-2 focus-within:ring-[#2b3cdb]/50 rounded-2xl p-2 transition-all shadow-lg ${themeStyles.inputBg} ${themeStyles.inputBorder}`}
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
              className="flex-1 bg-transparent text-sm sm:text-base px-3 py-1.5 resize-none focus:outline-none min-h-[38px] max-h-[120px] text-[#2b3cdb] placeholder-[#2b3cdb]/50"
            />

            <button
              id="send-message-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-[#2b3cdb] hover:bg-[#2231bd] disabled:opacity-30 disabled:hover:bg-[#2b3cdb] text-white transition-all shadow-md shadow-[#2b3cdb]/30 flex-shrink-0"
              title="Enviar mensaje al río"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div
            className="flex items-center justify-between mt-2 px-1 text-[8px] text-[#2b3cdb]/70 font-light"
          >
            <span>Valdivia, Chile - 2026</span>
            <span>Presiona Enter para enviar</span>
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
