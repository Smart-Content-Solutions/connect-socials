import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { useSupportAgent } from "@/context/SupportAgentContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatCtaProps {
  /** Assistant-prefill message sent when the chat opens */
  starterMessage?: string;
  /** Short label shown next to the icon (defaults to "Ask SCS Chat") */
  label?: string;
  /** Ref to the associated textarea — drives focus/blur hint animation */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const HINT_DURATION_MS = 2_500;

export function ChatCta({
  starterMessage,
  label = "Ask SCS Chat",
  textareaRef,
}: ChatCtaProps) {
  const { openChat } = useSupportAgent();
  const [glowing, setGlowing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const activeRef = useRef(false);

  const stopGlow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    activeRef.current = false;
    setGlowing(false);
  }, []);

  const handleFocus = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setGlowing(true);
    timerRef.current = setTimeout(stopGlow, HINT_DURATION_MS);
  }, [stopGlow]);

  const handleBlur = useCallback(() => {
    stopGlow();
  }, [stopGlow]);

  useEffect(() => {
    const el = textareaRef?.current;
    if (!el) return;

    el.addEventListener("focus", handleFocus);
    el.addEventListener("blur", handleBlur);
    return () => {
      el.removeEventListener("focus", handleFocus);
      el.removeEventListener("blur", handleBlur);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [textareaRef, handleFocus, handleBlur]);

  const handleOpen = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openChat(starterMessage);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleOpen(e);
            }}
            className={`
              absolute bottom-2 right-2 z-10
              inline-flex items-center gap-1.5
              rounded-full
              bg-[#2C2C2E]/90
              px-2.5 py-1
              text-[11px] font-medium text-[#E1C37A]
              backdrop-blur-sm
              transition-all duration-300
              hover:bg-[#E1C37A]/15 hover:border-[#E1C37A]/60 hover:shadow-[#E1C37A]/10
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E1C37A]/50
              cursor-pointer select-none
              sm:gap-1.5 sm:px-2.5
              ${
                glowing
                  ? "border border-[#E1C37A]/70 shadow-[0_0_18px_rgba(225,195,122,0.45)]"
                  : "border border-[#E1C37A]/40 shadow-sm shadow-black/20"
              }
            `}
            aria-label="Open chat for prompt ideas"
          >
            {glowing && (
              <span
                aria-hidden
                className="absolute -inset-1 rounded-full pointer-events-none bg-[#E1C37A]/10 animate-pulse"
              />
            )}

            <MessageCircle
              className={`
                h-3 w-3 shrink-0 transition-transform duration-300
                ${glowing ? "scale-110" : ""}
              `}
            />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-[#1C1C1E] border-[#E1C37A]/30 text-[#D6D7D8] text-xs"
        >
          Open chat for prompt ideas
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
