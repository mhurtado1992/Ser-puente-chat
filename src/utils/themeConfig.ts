import { ExhibitionAesthetics, ExhibitionThemeId } from "../types";

export interface ThemeStyles {
  id: ExhibitionThemeId;
  name: string;
  subtitle: string;
  containerBg: string;
  headerBg: string;
  headerBorder: string;
  textColor: string;
  textMuted: string;
  accentColor: string;
  accentBadge: string;
  accentIconBg: string;
  accentIconBorder: string;
  riverMessageBg: string;
  userMessageBg: string;
  inputContainerBg: string;
  inputBg: string;
  inputBorder: string;
  waterGradient: string;
  isLight: boolean;
}

export const THEMES: Record<ExhibitionThemeId, ThemeStyles> = {
  deep_river: {
    id: "deep_river",
    name: "Río Crema & Azul Epilogue",
    subtitle: "Luz de sala crema suave con tipografía y detalles en azul #2b3cdb",
    containerBg: "bg-[#fbf9f4]",
    headerBg: "bg-[#fbf9f4]/90 backdrop-blur-md",
    headerBorder: "border-[#e8e2d4]",
    textColor: "text-[#2b3cdb]",
    textMuted: "text-[#2b3cdb]/80",
    accentColor: "text-[#2b3cdb]",
    accentBadge: "bg-[#2b3cdb]/10 border-[#2b3cdb]/30 text-[#2b3cdb]",
    accentIconBg: "bg-[#2b3cdb]/10",
    accentIconBorder: "border-[#2b3cdb]/30",
    riverMessageBg: "bg-white border-[#e6dfd1] text-[#2b3cdb] shadow-sm",
    userMessageBg: "bg-[#2b3cdb]/10 border-[#2b3cdb]/30 text-[#2b3cdb] shadow-sm",
    inputContainerBg: "bg-[#fbf9f4]/95 border-[#e8e2d4]",
    inputBg: "bg-white",
    inputBorder: "border-[#2b3cdb]/30",
    waterGradient: "from-[#2b3cdb]/10 to-transparent",
    isLight: true,
  },
  white_gallery: {
    id: "white_gallery",
    name: "Galería Marfil Suave",
    subtitle: "Marfil editorial cálido y azul #2b3cdb",
    containerBg: "bg-[#f7f5ee]",
    headerBg: "bg-[#f7f5ee]/95 backdrop-blur-md",
    headerBorder: "border-stone-200/90",
    textColor: "text-[#2b3cdb]",
    textMuted: "text-[#2b3cdb]/80",
    accentColor: "text-[#2b3cdb]",
    accentBadge: "bg-[#2b3cdb]/10 border-[#2b3cdb]/30 text-[#2b3cdb]",
    accentIconBg: "bg-[#2b3cdb]/10",
    accentIconBorder: "border-[#2b3cdb]/30",
    riverMessageBg: "bg-white border-stone-200/90 text-[#2b3cdb] shadow-sm",
    userMessageBg: "bg-[#2b3cdb]/10 border-[#2b3cdb]/30 text-[#2b3cdb] shadow-sm",
    inputContainerBg: "bg-[#f7f5ee]/95 border-stone-200",
    inputBg: "bg-white",
    inputBorder: "border-[#2b3cdb]/30",
    waterGradient: "from-[#2b3cdb]/10 to-transparent",
    isLight: true,
  },
  valdivian_forest: {
    id: "valdivian_forest",
    name: "Selva Valdiviana",
    subtitle: "Verde musgo, helecho y humedad boscosa",
    containerBg: "bg-[#07140e]",
    headerBg: "bg-[#07140e]/90 backdrop-blur-md",
    headerBorder: "border-emerald-900/60",
    textColor: "text-emerald-100",
    textMuted: "text-emerald-400/70",
    accentColor: "text-emerald-400",
    accentBadge: "bg-emerald-950/80 border-emerald-800/60 text-emerald-300",
    accentIconBg: "bg-emerald-950/50",
    accentIconBorder: "border-emerald-800/60",
    riverMessageBg: "bg-[#0c2419]/70 border-emerald-800/40 text-emerald-50",
    userMessageBg: "bg-[#112d20] border-emerald-900/60 text-stone-100",
    inputContainerBg: "bg-[#07140e]/95 border-emerald-900/60",
    inputBg: "bg-[#0c2419]/80",
    inputBorder: "border-emerald-900/80",
    waterGradient: "from-emerald-950/30 to-transparent",
    isLight: false,
  },
  stone_canyon: {
    id: "stone_canyon",
    name: "Cañón & Basalto",
    subtitle: "Pizarra volcánica, niebla andina y ceniza",
    containerBg: "bg-[#111215]",
    headerBg: "bg-[#111215]/90 backdrop-blur-md",
    headerBorder: "border-stone-700/60",
    textColor: "text-stone-200",
    textMuted: "text-stone-400",
    accentColor: "text-cyan-300",
    accentBadge: "bg-stone-900 border-stone-700 text-cyan-300",
    accentIconBg: "bg-slate-800/50",
    accentIconBorder: "border-slate-700/70",
    riverMessageBg: "bg-slate-900/60 border-slate-700/50 text-slate-100",
    userMessageBg: "bg-stone-800/70 border-stone-700/50 text-stone-100",
    inputContainerBg: "bg-[#111215]/95 border-stone-800",
    inputBg: "bg-stone-900/80",
    inputBorder: "border-stone-700/70",
    waterGradient: "from-slate-800/20 to-transparent",
    isLight: false,
  },
};

export const DEFAULT_AESTHETICS: ExhibitionAesthetics = {
  theme: "deep_river",
  title: "Ser Puente",
  subtitle: "Obra de María Hurtado Izquierdo",
  fontStyle: "sans",
  waterAnimation: "full",
};

const STORAGE_KEY = "exhibition_aesthetics_settings_v6";

export function loadAesthetics(): ExhibitionAesthetics {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_AESTHETICS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_AESTHETICS;
}

export function saveAesthetics(aesthetics: ExhibitionAesthetics): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aesthetics));
  } catch {}
}
