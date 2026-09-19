import { RotateCcw, Settings, Waves } from "lucide-react";
import { AmbientAudio } from "./AmbientAudio";
import { ExhibitionAesthetics } from "../types";
import { ThemeStyles } from "../utils/themeConfig";

interface ExhibitionHeaderProps {
  onResetChat: () => void;
  onOpenCurator: () => void;
  messageCount: number;
  aesthetics: ExhibitionAesthetics;
  themeStyles: ThemeStyles;
}

export function ExhibitionHeader({
  onResetChat,
  onOpenCurator,
  messageCount,
  aesthetics,
  themeStyles,
}: ExhibitionHeaderProps) {
  const isSerif = aesthetics.fontStyle === "serif";

  return (
    <header
      id="exhibition-main-header"
      className={`sticky top-0 z-30 w-full transition-all border-b ${themeStyles.headerBg} ${themeStyles.headerBorder}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Title / Identity */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all ${themeStyles.accentIconBg} ${themeStyles.accentIconBorder} ${themeStyles.accentColor}`}
          >
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-base sm:text-lg tracking-widest uppercase font-normal ${
                  isSerif ? "font-serif" : "font-sans font-medium"
                } ${themeStyles.textColor}`}
              >
                {aesthetics.title || "Ser Puente"}
              </h1>
              <span
                className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border ${themeStyles.accentBadge}`}
              >
                Wazalafken
              </span>
            </div>
            <p className={`text-[11px] sm:text-xs font-light tracking-wide truncate max-w-[200px] sm:max-w-none ${themeStyles.textMuted}`}>
              {aesthetics.subtitle || "Voces y memorias del Río San Pedro"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ambient sound toggle */}
          <AmbientAudio />

          {/* Reset chat button */}
          {messageCount > 0 && (
            <button
              id="reset-chat-button"
              onClick={onResetChat}
              type="button"
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-light transition-all flex items-center gap-1.5 border ${
                themeStyles.isLight
                  ? "bg-white/90 hover:bg-stone-100 text-stone-700 border-stone-300"
                  : "bg-stone-900/40 hover:bg-stone-800/60 text-stone-300 border-stone-800/80"
              }`}
              title="Iniciar nuevo diálogo con el río"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva conversación</span>
            </button>
          )}

          {/* Curator / Settings */}
          <button
            id="open-curator-modal-btn"
            onClick={onOpenCurator}
            type="button"
            className={`p-2 rounded-full border transition-all ${
              themeStyles.isLight
                ? "bg-white/90 hover:bg-stone-100 text-stone-700 border-stone-300"
                : "bg-stone-900/40 hover:bg-stone-800/70 text-stone-400 hover:text-stone-200 border-stone-800/80"
            }`}
            title="Ajustes de la Instalación, Estética & Archivo de Voces"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
