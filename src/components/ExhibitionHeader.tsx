import { RotateCcw, Settings, Waves } from "lucide-react";
import { AmbientAudio } from "./AmbientAudio";

interface ExhibitionHeaderProps {
  onResetChat: () => void;
  onOpenCurator: () => void;
  messageCount: number;
}

export function ExhibitionHeader({ onResetChat, onOpenCurator, messageCount }: ExhibitionHeaderProps) {
  return (
    <header
      id="exhibition-main-header"
      className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#06080a]/85 border-b border-stone-800/80 transition-all"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Title / Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-950/40 border border-teal-800/50 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.1)]">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-serif tracking-widest uppercase text-stone-100 font-normal">
                Ser Puente
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-teal-400/90">
                Wazalafken
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-400 font-light tracking-wide truncate max-w-[200px] sm:max-w-none">
              Voces y memorias del Río San Pedro
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
              className="p-2 sm:px-3 sm:py-1.5 text-stone-400 hover:text-stone-200 bg-stone-900/40 hover:bg-stone-800/60 border border-stone-800/80 rounded-full text-xs font-light transition-all flex items-center gap-1.5"
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
            className="p-2 text-stone-400 hover:text-teal-300 bg-stone-900/40 hover:bg-stone-800/70 border border-stone-800/80 rounded-full transition-all"
            title="Ajustes de la Instalación & Documentos"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
