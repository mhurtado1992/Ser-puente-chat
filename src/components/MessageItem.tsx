import Markdown from "react-markdown";
import { ChatMessage } from "../types";
import { Sparkles } from "lucide-react";
import { ThemeStyles } from "../utils/themeConfig";

interface MessageItemProps {
  message: ChatMessage;
  themeStyles?: ThemeStyles;
  fontStyle?: "serif" | "sans";
}

export function MessageItem({ message, themeStyles, fontStyle = "serif" }: MessageItemProps) {
  const isModel = message.role === "model";
  const isLight = themeStyles?.isLight ?? false;

  const modelBubbleClass = themeStyles?.riverMessageBg || "bg-[#0b1022]/90 border border-[#2b3cdb]/30 text-slate-100 shadow-lg";
  const userBubbleClass = themeStyles?.userMessageBg || "bg-[#2b3cdb]/15 border border-[#2b3cdb]/35 text-blue-50 shadow-md ml-auto";
  const isSerif = fontStyle === "serif";

  return (
    <div
      className={`flex gap-3 sm:gap-4 my-4 sm:my-6 ${
        isModel ? "justify-start" : "justify-end"
      }`}
    >
      {/* Model Avatar */}
      {isModel && (
        <div
          className={`w-8 h-8 rounded-full border flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${
            themeStyles?.accentIconBg || "bg-[#2b3cdb]/15"
          } ${themeStyles?.accentIconBorder || "border-[#2b3cdb]/40"} ${
            themeStyles?.accentColor || "text-[#2b3cdb]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 transition-all border ${
          isModel ? modelBubbleClass : `${userBubbleClass} ml-auto`
        }`}
      >
        {isModel ? (
          <div
            className={`text-sm sm:text-base leading-relaxed space-y-3 ${
              isSerif ? "font-serif" : "font-sans font-normal"
            } text-[#2b3cdb]`}
          >
            <div className="markdown-body text-[#2b3cdb]">
              <Markdown>{message.text}</Markdown>
            </div>
          </div>
        ) : (
          <p
            className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
              isSerif ? "font-serif" : "font-sans font-normal"
            } text-[#2b3cdb]`}
          >
            {message.text}
          </p>
        )}

        <div
          className={`text-[10px] mt-2 font-mono tracking-wider flex items-center gap-1 ${
            isModel
              ? "text-[#2b3cdb]/70"
              : "text-[#2b3cdb]/70 justify-end"
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
    </div>
  );
}
