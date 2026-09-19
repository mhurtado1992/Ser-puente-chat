import { RotateCcw, Settings } from "lucide-react";
import { AmbientAudio } from "./AmbientAudio";
import { ExhibitionAesthetics } from "../types";
import { ThemeStyles } from "../utils/themeConfig";
import logoPuente from "../assets/images/logo_puente.svg";

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
          <img
            src={logoPuente}
            alt="Logo Ser Puente"
            className="h-6 sm:h-7 w-auto object-contain shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-[11px] tracking-widest uppercase font-normal ${
                  isSerif ? "font-serif" : "font-sans font-medium"
                } ${themeStyles.textColor}`}
              >
                {aesthetics.title || "Ser Puente"}
              </h1>
            </div>
            <p className={`text-[7px] font-light tracking-wide truncate max-w-[240px] sm:max-w-none ${themeStyles.textMuted}`}>
              Obra de María Hurtado Izquierdo
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
                  ? "bg-white/90 hover:bg-white text-[#2b3cdb] border-[#ded7c8] hover:border-[#2b3cdb]/50 shadow-xs"
                  : "bg-stone-900/40 hover:bg-stone-800/60 text-[#2b3cdb] border-stone-800/80"
              }`}
              title="Iniciar nuevo diálogo con el río"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2b3cdb]" />
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
                ? "bg-white/90 hover:bg-white text-[#2b3cdb] border-[#ded7c8] hover:border-[#2b3cdb]/50 shadow-xs"
                : "bg-stone-900/40 hover:bg-stone-800/70 text-[#2b3cdb] border-stone-800/80"
            }`}
            title="Ajustes de la Instalación, Estética & Archivo de Voces"
          >
            <Settings className="w-4 h-4 text-[#2b3cdb]" />
          </button>
        </div>
      </div>
    </header>
  );
}
