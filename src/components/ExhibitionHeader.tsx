import React from "react";
import { AmbientAudio } from "./AmbientAudio";
import { RotateCcw } from "lucide-react";
import { ExhibitionAesthetics } from "../types";
import logoPuente from "../assets/images/logo_puente.svg";

interface ExhibitionHeaderProps {
  onResetChat?: () => void;
  onOpenCurator?: () => void;
  onOpenAbout?: () => void;
  messageCount?: number;
  aesthetics?: ExhibitionAesthetics;
  themeStyles?: any;
  onSecretClick?: () => void;
}

export function ExhibitionHeader({
  onResetChat,
  onOpenAbout,
  messageCount = 0,
  aesthetics,
  themeStyles,
  onSecretClick,
}: ExhibitionHeaderProps) {
  const isSerif = aesthetics?.fontStyle === "serif";

  return (
    <header
      id="exhibition-main-header"
      className={`sticky top-0 z-30 w-full transition-all border-b ${
        themeStyles?.headerBg || "bg-black/40 backdrop-blur-md"
      } ${themeStyles?.headerBorder || "border-white/15"}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Identidad / Título con Clic Secreto al hacer 3 clics */}
        <div 
          onClick={onSecretClick} 
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="Ser Puente"
        >
          <img
            src={logoPuente}
            alt="Logo Ser Puente"
            className="h-6 sm:h-7 w-auto object-contain shrink-0 brightness-0 invert group-hover:opacity-80 transition-opacity"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-[11px] tracking-widest uppercase font-normal ${
                  isSerif ? "font-serif" : "font-sans font-medium"
                } text-white`}
              >
                {aesthetics?.title || "Ser Puente"}
              </h1>
            </div>
            <p className="text-[7px] font-light tracking-wide truncate max-w-[240px] sm:max-w-none text-white/60">
              Obra de María Hurtado Izquierdo
            </p>
          </div>
        </div>

        {/* Menú y Controles Públicos */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Único botón visible para el público: SOBRE LA OBRA */}
          <button
            onClick={onOpenAbout}
            type="button"
            className="text-[9px] font-medium tracking-[0.18em] uppercase text-white/80 hover:text-white transition-colors px-2 py-1"
          >
            SOBRE LA OBRA
          </button>

          {/* Sonido ambiente */}
          <AmbientAudio />

          {/* Botón de reiniciar diálogo */}
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

        </div>
      </div>
    </header>
  );
}