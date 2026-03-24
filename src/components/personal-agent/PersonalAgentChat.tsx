import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2, Trash2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonalAgent } from '@/context/PersonalAgentContext';
import ProgressSteps from './ProgressSteps';

export default function PersonalAgentChat() {
  const {
    isOpen,
    messages,
    progressSteps,
    isProcessing,
    sessionId,
    openChat,
    closeChat,
    sendMessage,
    clearHistory,
  } = usePersonalAgent();

  const [inputValue, setInputValue] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mb-4 w-[90vw] sm:w-[400px] bg-[#1A1A1C] border border-[#E1C37A]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px] h-[70vh]"
          >
            <div className="p-4 bg-[#2C2C2E] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#1A1A1C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#D6D7D8] text-sm md:text-base">Personal Agent</h3>
                  <p className="text-[10px] text-[#A9AAAC] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    AI Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#A9AAAC] hover:text-white transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#A9AAAC] hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="text-center text-[#5B5C60] py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Your personal AI assistant is ready!</p>
                  <p className="text-xs mt-1">Ask me to help with social media, scheduling, and more.</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full mb-2",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user'
                        ? "bg-[#E1C37A]/20 text-[#E1C37A] rounded-tr-none"
                        : "bg-[#2C2C2E] text-[#D6D7D8] rounded-tl-none border border-white/5"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isProcessing && progressSteps.length > 0 && (
                <div className="mt-4">
                  <ProgressSteps steps={progressSteps} />
                </div>
              )}

              {isProcessing && messages.length > 0 && (
                <div className="flex justify-start w-full mb-2">
                  <div className="bg-[#2C2C2E] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#2C2C2E]/50 border-t border-white/5 backdrop-blur-sm">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isProcessing}
                  className="w-full bg-[#1A1A1C] border border-white/10 text-[#D6D7D8] rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#E1C37A]/50 focus:ring-1 focus:ring-[#E1C37A]/20 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="absolute right-2 p-1.5 rounded-lg bg-[#E1C37A] text-[#1A1A1C] hover:bg-[#B6934C] disabled:opacity-50 disabled:bg-[#3B3C3E] disabled:text-[#5B5C60] transition-colors"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-[#5B5C60]">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="pointer-events-auto mb-3 mr-1 bg-[#2C2C2E] border border-[#E1C37A]/30 p-4 rounded-xl shadow-lg max-w-[300px]"
          >
            <p className="text-sm text-[#D6D7D8] mb-3">Clear all chat history?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#A9AAAC] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => isOpen ? closeChat() : openChat()}
        className={cn(
          "pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative group",
          isOpen ? "bg-[#3B3C3E] text-[#D6D7D8] rotate-90" : "bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C]"
        )}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#E1C37A] opacity-20 group-hover:animate-ping" />
        )}
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
      </motion.button>
    </div>
  );
}