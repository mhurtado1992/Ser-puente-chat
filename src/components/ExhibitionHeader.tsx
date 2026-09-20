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
      className="sticky top-0 z-30 w-full transition-all border-b bg-black/40 backdrop-blur-md border-white/15"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Title / Identity */}
        <div className="flex items-center gap-3">
          <img
            src={logoPuente}
            alt="Logo Ser Puente"
            className="h-6 sm:h-7 w-auto object-contain shrink-0 brightness-0 invert"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-[11px] tracking-widest uppercase font-normal ${
                  isSerif ? "font-serif" : "font-sans font-medium"
                } text-white`}
              >
                {aesthetics.title || "Ser Puente"}
              </h1>
            </div>
            <p className="text-[7px] font-light tracking-wide truncate max-w-[240px] sm:max-w-none text-white/60">
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
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-light transition-all flex items-center gap-1.5 border bg-white/10 hover:bg-white/20 text-white border-white/25 hover:border-white/50"
              title="Iniciar nuevo diálogo con el río"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Nueva conversación</span>
            </button>
          )}

          {/* Curator / Settings */}
          <button
            id="open-curator-modal-btn"
            onClick={onOpenCurator}
            type="button"
            className="p-2 rounded-full border transition-all bg-white/10 hover:bg-white/20 text-white border-white/25 hover:border-white/50"
            title="Ajustes de la Instalación, Estética & Archivo de Voces"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
