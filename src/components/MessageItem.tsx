import Markdown from "react-markdown";
import { ChatMessage } from "../types";
import { Sparkles, User } from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isModel = message.role === "model";

  return (
    <div
      className={`flex gap-3 sm:gap-4 my-4 sm:my-6 ${
        isModel ? "justify-start" : "justify-end"
      }`}
    >
      {/* Model Avatar */}
      {isModel && (
        <div className="w-8 h-8 rounded-full bg-teal-950/60 border border-teal-800/40 flex-shrink-0 flex items-center justify-center text-teal-300 mt-1 shadow-[0_0_12px_rgba(20,184,166,0.1)]">
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 transition-all ${
          isModel
            ? "bg-[#0c1014]/90 border border-stone-800/90 text-stone-200 shadow-lg"
            : "bg-teal-950/40 border border-teal-800/50 text-teal-100 shadow-md ml-auto"
        }`}
      >
        {isModel ? (
          <div className="prose prose-invert prose-stone text-sm sm:text-base font-serif leading-relaxed text-stone-200 space-y-3">
            <div className="markdown-body">
              <Markdown>{message.text}</Markdown>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base font-sans font-light leading-relaxed whitespace-pre-wrap text-stone-100">
            {message.text}
          </p>
        )}

        <div
          className={`text-[10px] mt-2 font-mono tracking-wider opacity-40 flex items-center gap-1 ${
            isModel ? "text-stone-400" : "text-teal-300 justify-end"
          }`}
        >
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isModel && <span>· Río San Pedro</span>}
        </div>
      </div>

      {/* User Avatar */}
      {!isModel && (
        <div className="w-8 h-8 rounded-full bg-stone-800/70 border border-stone-700/50 flex-shrink-0 flex items-center justify-center text-stone-300 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
