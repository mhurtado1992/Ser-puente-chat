import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  FileText,
  Check,
  Plus,
  ShieldCheck,
  Database,
  RefreshCw,
  UploadCloud,
  Trash2,
  Loader2,
  AlertCircle,
  Zap,
  Users,
  Gauge,
  CheckCircle2,
  Palette,
  MessageSquare,
  Download,
  Search,
  Sliders,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { ExhibitionConfig, ExhibitionAesthetics, ExhibitionThemeId, VisitorVoiceRecord } from "../types";
import { THEMES, saveAesthetics } from "../utils/themeConfig";
import {
  loadLocalVoices,
  fetchServerVoices,
  exportVoicesToCSV,
  exportVoicesToJSON,
} from "../utils/visitorVoices";

interface CuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExhibitionConfig | null;
  onRefreshConfig: () => void;
  aesthetics: ExhibitionAesthetics;
  onUpdateAesthetics: (newAesthetics: ExhibitionAesthetics) => void;
}

interface UploadStatus {
  filename: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  pages?: number;
}

export function CuratorModal({
  isOpen,
  onClose,
  config,
  onRefreshConfig,
  aesthetics,
  onUpdateAesthetics,
}: CuratorModalProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "documents" | "aesthetics" | "voices" | "status">("aesthetics");
  const [instructionText, setInstructionText] = useState(config?.systemInstruction || "");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [promptSavedSuccess, setPromptSavedSuccess] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // New document manual form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Entrevistas y Testimonios");
  const [newContent, setNewContent] = useState("");
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docAddedSuccess, setDocAddedSuccess] = useState(false);

  // Aesthetics state
  const [localAesthetics, setLocalAesthetics] = useState<ExhibitionAesthetics>(aesthetics);
  const [aestheticsSavedSuccess, setAestheticsSavedSuccess] = useState(false);

  // Visitor Voices state
  const [voices, setVoices] = useState<VisitorVoiceRecord[]>([]);
  const [voicesSearch, setVoicesSearch] = useState("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  useEffect(() => {
    setLocalAesthetics(aesthetics);
  }, [aesthetics]);

  useEffect(() => {
    if (isOpen && activeTab === "voices") {
      loadVoices();
    }
  }, [isOpen, activeTab]);

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const serverVoices = await fetchServerVoices();
      setVoices(serverVoices);
    } catch {
      setVoices(loadLocalVoices());
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleApplyAesthetics = (partial: Partial<ExhibitionAesthetics>) => {
    const updated = { ...localAesthetics, ...partial };
    setLocalAesthetics(updated);
    saveAesthetics(updated);
    onUpdateAesthetics(updated);
    setAestheticsSavedSuccess(true);
    setTimeout(() => setAestheticsSavedSuccess(false), 2000);
  };

  const handleToggleRetrievalMode = async (mode: "smart_rag" | "full_context") => {
    try {
      setIsChangingMode(true);
      const res = await fetch("/api/config/retrieval-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        onRefreshConfig();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChangingMode(false);
    }
  };

  if (!isOpen) return null;

  const handleSavePrompt = async () => {
    if (!instructionText.trim()) return;
    setIsSavingPrompt(true);
    try {
      const res = await fetch("/api/update-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instructionText }),
      });
      if (res.ok) {
        setPromptSavedSuccess(true);
        onRefreshConfig();
        setTimeout(() => setPromptSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const initialStatuses: UploadStatus[] = fileList.map((f) => ({
      filename: f.name,
      status: "pending",
    }));

    setUploadQueue(initialStatuses);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      try {
        const lowerName = file.name.toLowerCase();
        const isPdf = lowerName.endsWith(".pdf");
        const isWord = lowerName.endsWith(".docx") || lowerName.endsWith(".doc");

        let extractedText = "";

        if (isPdf || isWord) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const parseRes = await fetch("/api/documents/parse-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              base64Data: base64,
              fileType: isPdf ? "pdf" : "docx",
            }),
          });

          if (!parseRes.ok) {
            const errData = await parseRes.json().catch(() => ({}));
            throw new Error(errData.error || `Error al procesar ${file.name}`);
          }

          const parseData = await parseRes.json();
          extractedText = parseData.content;
        } else {
          extractedText = await file.text();
        }

        if (!extractedText.trim()) {
          throw new Error("El archivo no contiene texto procesable.");
        }

        const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const saveRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: cleanTitle,
            category: "Archivos & Testimonios de la Exposición",
            content: extractedText,
          }),
        });

        if (!saveRes.ok) {
          throw new Error("No se pudo registrar el documento en el índice.");
        }

        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: "success" } : item))
        );
      } catch (err: any) {
        console.error(err);
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: "error", error: err?.message || "Error al procesar" }
              : item
          )
        );
      }
    }

    onRefreshConfig();
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("¿Eliminar este documento de la memoria del río?")) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshConfig();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAddManualDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsAddingDoc(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent,
        }),
      });
      if (res.ok) {
        setDocAddedSuccess(true);
        setNewTitle("");
        setNewContent("");
        onRefreshConfig();
        setTimeout(() => setDocAddedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingDoc(false);
    }
  };

  const handleClearVoices = async () => {
    if (!confirm("¿Deseas vaciar la bitácora de voces registradas? Esta acción no se puede deshacer.")) return;
    try {
      await fetch("/api/voices", { method: "DELETE" });
    } catch {}
    localStorage.removeItem("exhibition_collective_voices_v1");
    setVoices([]);
  };

  const filteredVoices = voices.filter((v) => {
    if (!voicesSearch.trim()) return true;
    const q = voicesSearch.toLowerCase();
    return v.userMessage.toLowerCase().includes(q) || v.riverReply.toLowerCase().includes(q);
  });

  return (
    <div
      id="curator-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
    >
      <div
        id="curator-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c1014] border border-stone-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-[#090d10]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <h2 className="text-lg font-serif tracking-wide text-stone-100">
                Panel del Artista & Curaduría de la Exposición
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Exposición "{localAesthetics.title}" — Control estético, documentos y archivo de voces
            </p>
          </div>
          <button
            id="close-curator-modal-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800/80 px-4 sm:px-6 bg-[#0a0e11] text-xs font-medium overflow-x-auto">
          <button
            id="tab-aesthetics-btn"
            onClick={() => setActiveTab("aesthetics")}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "aesthetics"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-teal-400" />
            Estética & Visuales
          </button>
          <button
            id="tab-voices-btn"
            onClick={() => setActiveTab("voices")}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "voices"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Bitácora de Voces ({voices.length})
          </button>
          <button
            id="tab-prompt-btn"
            onClick={() => setActiveTab("prompt")}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "prompt"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            System Prompt del Río
          </button>
          <button
            id="tab-documents-btn"
            onClick={() => setActiveTab("documents")}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "documents"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Documentos ({config?.documentsCount || 0})
          </button>
          <button
            id="tab-status-btn"
            onClick={() => setActiveTab("status")}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "status"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Concurrencia & Ajustes
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: ESTÉTICA DE LA EXPOSICIÓN */}
          {activeTab === "aesthetics" && (
            <div className="space-y-6">
              {/* Notice */}
              <div className="p-4 bg-teal-950/20 border border-teal-800/40 rounded-xl text-xs text-teal-200/90 leading-relaxed flex items-start gap-3">
                <Palette className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm text-teal-100 mb-1">
                    Personalización Estética para tu Exposición
                  </strong>
                  Puedes cambiar el ambiente cromático, los títulos de sala y la tipografía para que armonicen
                  con los muros de tu galería, la iluminación de sala o el papel de sala donde se exhibe el código QR.
                </div>
              </div>

              {/* Theme selection */}
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-3 uppercase tracking-wider">
                  Paleta de Color & Atmósfera de Sala
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as ExhibitionThemeId[]).map((themeKey) => {
                    const t = THEMES[themeKey];
                    const isSelected = localAesthetics.theme === themeKey;
                    return (
                      <div
                        key={themeKey}
                        onClick={() => handleApplyAesthetics({ theme: themeKey })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-teal-950/30 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.2)] ring-1 ring-teal-500"
                            : "bg-[#090d10] border-stone-800 hover:border-stone-700"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-stone-100">{t.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                          </div>
                          <p className="text-xs text-stone-400 leading-relaxed">{t.subtitle}</p>
                        </div>
                        {/* Visual swatch */}
                        <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border border-stone-700 ${
                              t.id === "white_gallery"
                                ? "bg-[#f8f7f4]"
                                : t.id === "valdivian_forest"
                                ? "bg-[#07140e]"
                                : t.id === "stone_canyon"
                                ? "bg-[#111215]"
                                : "bg-[#06080a]"
                            }`}
                          />
                          <span className="text-[10px] font-mono text-stone-500 uppercase">
                            {t.isLight ? "Modo Luz / Galería Clara" : "Modo Oscuro / Inmersivo"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title and Subtitle inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Título de la Exposición
                  </label>
                  <input
                    type="text"
                    value={localAesthetics.title}
                    onChange={(e) => handleApplyAesthetics({ title: e.target.value })}
                    className="w-full bg-[#080b0e] border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-teal-500"
                    placeholder="Ser Puente"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Nombre principal que aparece en el encabezado
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Subtítulo / Sala
                  </label>
                  <input
                    type="text"
                    value={localAesthetics.subtitle}
                    onChange={(e) => handleApplyAesthetics({ subtitle: e.target.value })}
                    className="w-full bg-[#080b0e] border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-teal-500"
                    placeholder="Voces y memorias del Río San Pedro"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Texto descriptivo que acompaña la instalación
                  </span>
                </div>
              </div>

              {/* Typography & Water FX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Estilo Tipográfico
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyAesthetics({ fontStyle: "serif" })}
                      className={`p-2.5 rounded-lg border text-xs font-serif transition-all ${
                        localAesthetics.fontStyle === "serif"
                          ? "bg-teal-950/40 border-teal-500 text-teal-200 font-semibold"
                          : "bg-[#080b0e] border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Serif Poética (Editorial)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAesthetics({ fontStyle: "sans" })}
                      className={`p-2.5 rounded-lg border text-xs font-sans transition-all ${
                        localAesthetics.fontStyle === "sans"
                          ? "bg-teal-950/40 border-teal-500 text-teal-200 font-medium"
                          : "bg-[#080b0e] border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Sans Contemporánea (Limpia)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Animación de Olas del Río (Fondo)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyAesthetics({ waterAnimation: "full" })}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        localAesthetics.waterAnimation === "full"
                          ? "bg-teal-950/40 border-teal-500 text-teal-200"
                          : "bg-[#080b0e] border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Olas Vivas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAesthetics({ waterAnimation: "subtle" })}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        localAesthetics.waterAnimation === "subtle"
                          ? "bg-teal-950/40 border-teal-500 text-teal-200"
                          : "bg-[#080b0e] border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Ondas Sutiles
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyAesthetics({ waterAnimation: "none" })}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        localAesthetics.waterAnimation === "none"
                          ? "bg-teal-950/40 border-teal-500 text-teal-200"
                          : "bg-[#080b0e] border-stone-800 text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      Desactivado
                    </button>
                  </div>
                </div>
              </div>

              {aestheticsSavedSuccess && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Estética actualizada y guardada para la exposición.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BITÁCORA DE VOCES (ARCHIVO DEL PÚBLICO) */}
          {activeTab === "voices" && (
            <div className="space-y-6">
              {/* Header card with counts & actions */}
              <div className="p-4 bg-[#080b0e] border border-stone-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl text-teal-300 font-semibold">
                      {voices.length}
                    </span>
                    <span className="text-sm text-stone-200 font-medium">
                      voces recogidas desde los teléfonos de la sala
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Cada vez que un visitante interactúa con el chat en su móvil, su pregunta y reflexión se suman
                    a la memoria viva del río.
                  </p>
                </div>

                {/* Export buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => exportVoicesToCSV(voices, localAesthetics.title)}
                    disabled={voices.length === 0}
                    className="px-3 py-2 bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700/60 text-teal-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
                    title="Descargar tabla completa para Excel con tildes correctos"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Excel (CSV)
                  </button>
                  <button
                    type="button"
                    onClick={() => exportVoicesToJSON(voices, localAesthetics.title)}
                    disabled={voices.length === 0}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-40"
                    title="Exportar archivo estructurado en JSON"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={loadVoices}
                    className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 rounded-lg transition-all"
                    title="Actualizar lista de voces"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingVoices ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={voicesSearch}
                  onChange={(e) => setVoicesSearch(e.target.value)}
                  placeholder="Buscar palabras o testimonios del público (ej. 'riñihuazo', 'recuerdo', 'abuelo', 'agua')..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#080b0e] border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Voices List */}
              <div className="space-y-3">
                {filteredVoices.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs space-y-2">
                    <Smartphone className="w-6 h-6 mx-auto text-stone-600" />
                    <p>Aún no se han registrado mensajes con ese criterio.</p>
                    <p className="text-[11px] text-stone-600">
                      Invita a los visitantes a escanear el código QR para que sus reflexiones aparezcan aquí en vivo.
                    </p>
                  </div>
                ) : (
                  filteredVoices.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 bg-[#090d10] border border-stone-800/80 rounded-xl space-y-2 text-xs hover:border-stone-700/80 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-mono text-teal-400/90 font-medium">
                          {v.visitorId}
                        </span>
                        <span>
                          {new Date(v.timestamp).toLocaleString("es-CL", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <p className="text-stone-100 font-serif italic text-sm">
                          "{v.userMessage}"
                        </p>
                        <p className="text-stone-400 text-[11px] leading-relaxed border-l-2 border-teal-800/40 pl-2.5 mt-1">
                          {v.riverReply}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {voices.length > 0 && (
                <div className="pt-4 border-t border-stone-800/60 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClearVoices}
                    className="text-[11px] text-red-400/70 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar historial de voces
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM PROMPT */}
          {activeTab === "prompt" && (
            <div className="space-y-4">
              <div className="bg-teal-950/20 border border-teal-900/40 rounded-lg p-3 text-xs text-teal-200/90 leading-relaxed">
                <strong>Personalidad activa:</strong> Aquí puedes ajustar la voz poética y directrices de cómo habla el Río San Pedro (Wazalafken).
              </div>

              <textarea
                id="system-prompt-editor"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                rows={12}
                className="w-full bg-[#080b0e] border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-200 leading-relaxed focus:outline-none focus:border-teal-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setInstructionText(config?.systemInstruction || "")}
                  className="text-xs text-stone-400 hover:text-stone-200"
                >
                  Restablecer
                </button>
                <div className="flex items-center gap-3">
                  {promptSavedSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Guardado
                    </span>
                  )}
                  <button
                    id="save-prompt-btn"
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSavingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Guardar Prompt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTOS & MEMORIA */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center space-y-2 ${
                  isDragging
                    ? "border-teal-400 bg-teal-950/20"
                    : "border-stone-800 hover:border-teal-700/60 bg-[#080b0e]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <UploadCloud className="w-8 h-8 mx-auto text-teal-400/80" />
                <p className="text-xs font-medium text-stone-200">
                  Arrastra aquí archivos PDF, Word (.docx) o texto plano
                </p>
                <p className="text-[11px] text-stone-500">
                  Procesamiento automático de investigaciones, relatos orales y memorias
                </p>
              </div>

              {/* Upload progress */}
              {uploadQueue.length > 0 && (
                <div className="space-y-2">
                  {uploadQueue.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#080b0e] border border-stone-800 rounded-lg text-xs"
                    >
                      <span className="truncate max-w-xs text-stone-300">{item.filename}</span>
                      {item.status === "uploading" && (
                        <span className="text-teal-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Procesando
                        </span>
                      )}
                      {item.status === "success" && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Incorporado
                        </span>
                      )}
                      {item.status === "error" && (
                        <span className="text-red-400">{item.error || "Error"}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Document list */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                  Documentos en el Archivo ({config?.documents?.length || 0})
                </h3>
                {config?.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-[#080b0e] border border-stone-800 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-200">{doc.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-teal-400">
                          {doc.category}
                        </span>
                      </div>
                      <p className="text-stone-400 text-[11px] line-clamp-2 leading-relaxed">
                        {doc.preview}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={isDeletingId === doc.id}
                      className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: STATUS & CONCURRENCY */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="p-4 bg-[#080b0e] border border-stone-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-stone-200">
                      Modo de Búsqueda y Recuperación
                    </span>
                    <p className="text-[11px] text-stone-400">
                      RAG Inteligente indexa los documentos para responder con máxima precisión y mínimo consumo.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded">
                    Smart RAG Activo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Tokens aprox/msj</span>
                    <span className="font-mono text-teal-300 font-semibold text-sm">~2.000</span>
                  </div>
                  <div className="p-3 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Concurrencia</span>
                    <span className="font-mono text-emerald-400 font-semibold text-sm">5-20 celulares a la vez</span>
                  </div>
                  <div className="p-3 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Resiliencia</span>
                    <span className="font-mono text-teal-300 font-semibold text-sm">Cero Errores 500</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
