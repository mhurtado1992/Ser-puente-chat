import { useState, useRef } from "react";
import { X, Sparkles, FileText, Check, Plus, ShieldCheck, Database, RefreshCw, UploadCloud, Trash2, Loader2, AlertCircle, Zap, Users, Gauge, CheckCircle2 } from "lucide-react";
import { ExhibitionConfig } from "../types";

interface CuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExhibitionConfig | null;
  onRefreshConfig: () => void;
}

interface UploadStatus {
  filename: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  pages?: number;
}

export function CuratorModal({ isOpen, onClose, config, onRefreshConfig }: CuratorModalProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "documents" | "status">("prompt");
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

        if (isPdf || isWord) {
          // Read base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // strip data:*/*;base64,
              const base64Data = result.split(",")[1] || result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const endpoint = isPdf ? "/api/upload-pdf" : "/api/upload-word";
          const defaultCategory = isPdf ? "Investigación / PDF" : "Documento Word";

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              base64,
              category: defaultCategory,
            }),
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `Error al procesar archivo ${isWord ? "Word" : "PDF"}`);
          }

          const resData = await res.json();
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, status: "success", pages: resData.document?.pageCountApprox }
                : item
            )
          );
        } else {
          // Text / Markdown
          const text = await file.text();
          const res = await fetch("/api/upload-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              content: text,
              category: "Entrevista / Texto",
            }),
          });

          if (!res.ok) {
            throw new Error("Error al guardar texto");
          }

          setUploadQueue((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: "success" } : item))
          );
        }
      } catch (err: any) {
        console.error("Error al subir archivo:", err);
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: err?.message || "Fallo" } : item
          )
        );
      }
    }

    onRefreshConfig();
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("¿Deseas eliminar este documento de la base del río?")) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshConfig();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleAddDocument = async () => {
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

  const handleResetDefaults = async () => {
    if (confirm("¿Deseas restaurar los documentos y el prompt predeterminado del río?")) {
      try {
        const res = await fetch("/api/documents/reset", { method: "POST" });
        if (res.ok) {
          onRefreshConfig();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div
      id="curator-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
    >
      <div
        id="curator-modal-container"
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c1014] border border-stone-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-[#090d10]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <h2 className="text-lg font-serif tracking-wide text-stone-100">
                Memoria & Ajustes de la Instalación
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Exposición "Ser Puente" — Base de datos del Río San Pedro (Wazalafken)
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
        <div className="flex border-b border-stone-800/80 px-6 bg-[#0a0e11] text-xs font-medium">
          <button
            id="tab-prompt-btn"
            onClick={() => setActiveTab("prompt")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
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
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "documents"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Documentos & Memoria ({config?.documentsCount || 0})
          </button>
          <button
            id="tab-status-btn"
            onClick={() => setActiveTab("status")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "status"
                ? "border-teal-500 text-teal-300"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Ahorro de Tokens & Concurrencia
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SYSTEM PROMPT */}
          {activeTab === "prompt" && (
            <div className="space-y-4">
              <div className="bg-teal-950/20 border border-teal-900/40 rounded-lg p-3 text-xs text-teal-200/90 leading-relaxed">
                <strong>Personalidad activa:</strong> Aquí puedes pegar tu texto completo de Claude Projects (desde <em>"ERES EL RÍO SAN PEDRO, TAMBIÉN LLAMADO WAZALAFKEN"</em> hasta <em>"EL SENTIDO DE FONDO DE TODO ESTO"</em>).
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Instrucción Completa de Sistema:
                </label>
                <textarea
                  id="system-instruction-textarea"
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  rows={13}
                  placeholder="Pega aquí el texto completo de Claude Projects..."
                  className="w-full bg-[#070a0d] border border-stone-800 rounded-xl p-3.5 text-xs text-stone-200 font-mono leading-relaxed focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  id="reset-prompt-btn"
                  onClick={handleResetDefaults}
                  className="text-xs text-stone-500 hover:text-stone-400 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Restaurar predeterminados
                </button>

                <div className="flex items-center gap-3">
                  {promptSavedSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Guardado exitosamente
                    </span>
                  )}
                  <button
                    id="save-prompt-btn"
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium tracking-wide transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                  >
                    {isSavingPrompt ? "Guardando..." : "Guardar System Prompt"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
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
                className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
                  isDragging
                    ? "border-teal-400 bg-teal-950/30"
                    : "border-stone-800 hover:border-teal-800/60 bg-[#080b0e]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-teal-950/50 border border-teal-800/50 flex items-center justify-center text-teal-400 mb-3 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-stone-200">
                  Arrastra aquí tus archivos PDF, Word o de texto
                </h4>
                <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                  Sube tus documentos, entrevistas o investigaciones en formato <strong>PDF</strong>, <strong>Word (.docx / .doc)</strong>, <strong>TXT</strong> o <strong>MD</strong>. El sistema extraerá el texto automáticamente para que el río los recuerde.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Seleccionar archivos desde tu equipo
                </button>
              </div>

              {/* Upload Queue feedback */}
              {uploadQueue.length > 0 && (
                <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Progreso de carga:
                  </span>
                  <div className="space-y-1.5">
                    {uploadQueue.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-2 rounded bg-[#090c0f] border border-stone-800"
                      >
                        <span className="font-mono truncate max-w-[220px] text-stone-300">
                          {item.filename}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.status === "uploading" && (
                            <span className="text-teal-400 flex items-center gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extrayendo texto...
                            </span>
                          )}
                          {item.status === "success" && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Guardado en memoria {item.pages ? `(~${item.pages} pág.)` : ""}
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-red-400 flex items-center gap-1" title={item.error}>
                              <AlertCircle className="w-3.5 h-3.5" /> Error: {item.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Documents List */}
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    Documentos en el cauce de memoria (~{config?.totalPagesApprox || 0} páginas)
                  </h3>
                  <span className="text-[11px] text-teal-400 font-mono bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/40">
                    {config?.documentsCount || 0} cargados
                  </span>
                </div>

                <div className="space-y-2.5">
                  {config?.documents?.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="p-3 bg-[#080b0e] border border-stone-800/80 rounded-lg text-xs hover:border-stone-700 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-stone-200">{doc.title}</span>
                          <span className="text-[10px] text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                            {doc.category}
                          </span>
                          {doc.pageCountApprox && (
                            <span className="text-[10px] text-teal-400/80 font-mono">
                              ~{doc.pageCountApprox} pág.
                            </span>
                          )}
                        </div>
                        <p className="text-stone-400 text-[11px] mt-1 line-clamp-2 italic">
                          "{doc.preview}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={isDeletingId === doc.id}
                        className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        title="Eliminar este documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual Add Document Section */}
              <div className="border-t border-stone-800/80 pt-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-teal-400" />
                  O pegar texto o transcripción manualmente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Título de la entrevista</label>
                    <input
                      type="text"
                      placeholder="Ej: Entrevista a boteros de Los Lagos"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#080b0e] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Categoría</label>
                    <input
                      type="text"
                      placeholder="Ej: Testimonios / Historia Oral"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#080b0e] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">
                    Texto o transcripción
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Pega aquí el contenido textual..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-[#080b0e] border border-stone-800 rounded-lg p-3 text-xs text-stone-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {docAddedSuccess ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Documento incorporado a la memoria
                    </span>
                  ) : <span />}
                  <button
                    id="add-document-btn"
                    onClick={handleAddDocument}
                    disabled={isAddingDoc || !newTitle || !newContent}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isAddingDoc ? "Agregando..." : "Incorporar a la Memoria"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOKEN SAVING & CONCURRENCY (RAG) */}
          {activeTab === "status" && (
            <div className="space-y-6">
              {/* Architecture Highlight: Token Economy */}
              <div className="p-4 rounded-xl bg-teal-950/25 border border-teal-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-300 font-medium text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Arquitectura de Ahorro para Múltiples Visitantes en Sala
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/50 text-emerald-300">
                    {config?.retrievalMode === "smart_rag" ? "RAG Activo: -98% Tokens" : "Modo Completo"}
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Para que <strong>5 o más personas</strong> puedan interactuar a la vez en la exposición sin agotar los límites gratuitos por minuto de Google AI Studio, el río utiliza <strong>RAG (Recuperación Aumentada)</strong>: en lugar de enviar las 500 páginas en cada mensaje, localiza al vuelo los pasajes más relevantes para la pregunta del visitante.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Modo de Consulta del Archivo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Smart RAG Option */}
                  <div
                    onClick={() => !isChangingMode && handleToggleRetrievalMode("smart_rag")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      config?.retrievalMode === "smart_rag"
                        ? "bg-teal-950/30 border-teal-500/80 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                        : "bg-[#080b0e] border-stone-800 hover:border-stone-700 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-teal-200 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        RAG Semántico Inteligente
                      </span>
                      {config?.retrievalMode === "smart_rag" && (
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
                      Recluta los 4 fragmentos más pertinentes de la base de datos documental para cada pregunta.
                    </p>
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">Gasto aprox.:</span>
                      <span className="font-mono text-emerald-400 font-semibold">~2.000 tokens / msj</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-stone-400">Concurrencia:</span>
                      <span className="text-teal-300">5 a 20 personas a la vez</span>
                    </div>
                  </div>

                  {/* Full Context Option */}
                  <div
                    onClick={() => !isChangingMode && handleToggleRetrievalMode("full_context")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      config?.retrievalMode === "full_context"
                        ? "bg-amber-950/20 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : "bg-[#080b0e] border-stone-800 hover:border-stone-700 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-stone-400" />
                        Cauce Completo (Todo el texto)
                      </span>
                      {config?.retrievalMode === "full_context" && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed mb-3">
                      Inyecta la totalidad de los documentos en cada llamada. Recomendado solo si el archivo total es menor a 25 páginas.
                    </p>
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-stone-400">Gasto aprox.:</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        ~{config?.estimatedTokensPerQuery?.toLocaleString() || "150.000"} tokens
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-stone-400">Riesgo concurrente:</span>
                      <span className="text-amber-400/90">Límite RPM/TPM con 5 chats</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Card for 5 users */}
              <div className="p-4 bg-[#080b0e] border border-stone-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
                  <Users className="w-4 h-4 text-teal-400" />
                  Cálculo de Concurrencia en Vivo (5 visitantes simultáneos)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Tokens por pregunta</span>
                    <span className="font-mono text-teal-300 font-semibold text-sm">
                      {config?.retrievalMode === "smart_rag" ? "~2.000" : `~${config?.estimatedTokensPerQuery?.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Minuto pico (5 personas)</span>
                    <span className="font-mono text-emerald-400 font-semibold text-sm">
                      {config?.retrievalMode === "smart_rag" ? "~10.000 TPM" : `~${((config?.estimatedTokensPerQuery || 150000) * 5).toLocaleString()} TPM`}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#050709] rounded-lg border border-stone-900">
                    <span className="text-stone-500 text-[10px] uppercase block">Límite Gratuito Gemini</span>
                    <span className="font-mono text-stone-300 font-semibold text-sm">
                      1.000.000 TPM / 15 RPM
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {config?.retrievalMode === "smart_rag"
                    ? "✓ Con el Modo RAG inteligente activo, 5 personas preguntando al mismo tiempo utilizan apenas el 1% del límite por minuto de la API gratuita. No habrá bloqueos ni ralentizaciones."
                    : "⚠️ En Modo Cauce Completo con 500 páginas, 5 personas preguntando en el mismo minuto superarán 1.000.000 TPM, causando errores temporales de cuota (429 Rate Limit). Te sugerimos mantener activado el Modo RAG."}
                </p>
              </div>

              {/* Technical details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#080b0e] border border-stone-800 rounded-xl space-y-1">
                  <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-teal-400" /> Fragmentos Indexados
                  </span>
                  <p className="font-mono text-teal-300 font-medium">
                    {config?.totalChunks || 0} pasajes semánticos
                  </p>
                </div>
                <div className="p-3 bg-[#080b0e] border border-stone-800 rounded-xl space-y-1">
                  <span className="text-stone-400 text-[11px]">Ventana Deslizante de Chat</span>
                  <p className="text-stone-200">Últimos 6 mensajes por sesión (evita acumulación)</p>
                </div>
                <div className="p-3 bg-[#080b0e] border border-stone-800 rounded-xl space-y-1">
                  <span className="text-stone-400 text-[11px]">Acceso Visitantes</span>
                  <p className="text-stone-200">Público y anónimo (Sin login ni cookies)</p>
                </div>
                <div className="p-3 bg-[#080b0e] border border-stone-800 rounded-xl space-y-1">
                  <span className="text-stone-400 text-[11px]">Garantía Costo Cero</span>
                  <p className="text-emerald-400 font-medium">Google AI Studio Free Tier</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
