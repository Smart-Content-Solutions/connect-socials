import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2, Minimize2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// Type definitions for chat messages
type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

// Configuration
const WEBHOOK_URL = 'https://n8n.smartcontentsolutions.co.uk/webhook/scs-support-chat';

export default function SupportChat() {
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi there! I\'m your SCS AI Support Agent. How can I help you today?',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInputValue(prev => {
                        const spacer = prev.trim() ? ' ' : '';
                        return prev.trim() + spacer + finalTranscript.trim();
                    });
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone access denied. Please enable permissions.');
                } else {
                    toast.error('Voice recognition failed.');
                }
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
                toast.info("Listening... Speak now.");
            } catch (err) {
                console.error("Failed to start recognition:", err);
                setIsRecording(false);
            }
        }
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Prepare payload
            const payload = {
                message: newMessage.content,
                user_id: user?.id || 'anonymous',
                user_name: user?.fullName || 'Guest',
                email: user?.emailAddresses?.[0]?.emailAddress || '',
                // Create context string from last 5 messages to save tokens/complexity, 
                // or let backend handle history if it supports it. 
                // For this simple implementation, we send history array.
                history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
            };

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Support service unavailable: ${response.status}`);
            }

            const data = await response.json();

            // Expecting { response: "text" } from n8n
            const aiResponseText = data.response || data.output || data.text || "I'm sorry, I didn't get a clear response. Please try again.";

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Support Chat Error:', error);
            toast.error('Could not reach support agent.');

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to the server right now. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-auto mb-4 w-[90vw] sm:w-[380px] bg-[#1A1A1C] border border-[#E1C37A]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px] h-[70vh]"
                    >
                        {/* Header */}
                        <div className="p-4 bg-[#2C2C2E] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-[#1A1A1C]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#D6D7D8] text-sm md:text-base">SCS AI Support</h3>
                                    <p className="text-[10px] text-[#A9AAAC] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-[#A9AAAC] hover:text-white transition-colors"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
                        >
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

                            {isTyping && (
                                <div className="flex justify-start w-full mb-2">
                                    <div className="bg-[#2C2C2E] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-[#5B5C60] rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[#2C2C2E]/50 border-t border-white/5 backdrop-blur-sm">
                            <div className="relative flex items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isRecording ? "Listening..." : "Ask a question..."}
                                    disabled={isTyping}
                                    className="w-full bg-[#1A1A1C] border border-white/10 text-[#D6D7D8] rounded-xl pl-4 pr-20 py-3 text-sm focus:outline-none focus:border-[#E1C37A]/50 focus:ring-1 focus:ring-[#E1C37A]/20 transition-all disabled:opacity-50"
                                />
                                <div className="absolute right-2 flex items-center gap-1">
                                    <button
                                        onClick={toggleRecording}
                                        disabled={isTyping}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-all duration-300",
                                            isRecording
                                                ? "bg-red-500/20 text-red-500 animate-pulse"
                                                : "text-[#A9AAAC] hover:text-[#E1C37A] hover:bg-white/5"
                                        )}
                                        title={isRecording ? "Stop Recording" : "Start Voice Input"}
                                    >
                                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        className="p-1.5 rounded-lg bg-[#E1C37A] text-[#1A1A1C] hover:bg-[#B6934C] disabled:opacity-50 disabled:bg-[#3B3C3E] disabled:text-[#5B5C60] transition-colors"
                                    >
                                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-[#5B5C60]">
                                    AI can make mistakes. For critical issues, please contact support.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative group",
                    isOpen ? "bg-[#3B3C3E] text-[#D6D7D8] rotate-90" : "bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C]"
                )}
            >
                {/* Pulse effect when closed */}
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