import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

type SupportAgentConfig = {
    lastProactiveShownAt: number | null;
    dismissedUntil: number | null;
    hasOpenedChatBefore: boolean;
};

const STORAGE_KEY = 'scs_support_agent_config';

// Timing Rules
const NUDGE_DURATION = 8000;
const COOLDOWN_24H = 24 * 60 * 60 * 1000;
const COOLDOWN_7D = 7 * 24 * 60 * 60 * 1000;
const COOLDOWN_30D = 30 * 24 * 60 * 60 * 1000;

interface SupportAgentContextType {
    isOpen: boolean;
    messages: Message[];
    nudgeMessage: string | null;
    isNudgeVisible: boolean;
    isPulseOnly: boolean;
    openChat: (initialMessage?: string) => void;
    closeChat: () => void;
    addMessage: (role: 'user' | 'assistant', content: string) => void;
    dismissNudge: (type?: 'close' | 'notNow') => void;
    clearMessages: () => void;
    triggerProactiveAction: (type: string, message?: string) => void;
    setIsBusy: (busy: boolean) => void;
}

const SupportAgentContext = createContext<SupportAgentContextType | undefined>(undefined);

const loadConfig = (): SupportAgentConfig => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to load support agent config:', e);
    }
    return {
        lastProactiveShownAt: null,
        dismissedUntil: null,
        hasOpenedChatBefore: false,
    };
};

const saveConfig = (config: SupportAgentConfig) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save support agent config:', e);
    }
};

export function SupportAgentProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hi there! I\'m your SCS AI Support Agent. How can I help you today?',
        timestamp: new Date(),
    }]);

    // UI states
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const [isNudgeVisible, setIsNudgeVisible] = useState(false);
    const [isPulseOnly, setIsPulseOnly] = useState(false);
    const [config, setConfig] = useState<SupportAgentConfig>(loadConfig());
    const [isBusy, setIsBusy] = useState(false);

    const location = useLocation();

    // Session state
    const sessionShowCountRef = useRef<number>(0);
    const hasShownForPathRef = useRef<Set<string>>(new Set());
    const hideNudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update config & localStorage
    const updateConfig = useCallback((updates: Partial<SupportAgentConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            saveConfig(newConfig);
            return newConfig;
        });
    }, []);

    // Can we show a proactive nudge?
    const canShowNudge = useCallback((): boolean => {
        if (isBusy) return false;

        const now = Date.now();

        if (config.hasOpenedChatBefore) {
            // "If user opens the chat, don't pop again for 30 days"
            // We use lastOpened internally but let's just check the opened history rule.
            // Wait, to track exact 30d, we'd need `lastChatOpenAt`. For now we won't show if ever opened
            // Let's rely on a 30 day timer. We'll add it to the dismissedUntil if they open it.
        }

        if (config.dismissedUntil && now < config.dismissedUntil) {
            return false;
        }

        if (sessionShowCountRef.current >= 1) {
            return false; // Max 1 per session
        }

        if (hasShownForPathRef.current.has(location.pathname)) {
            return false; // Max 1 per page view
        }

        return true;
    }, [isBusy, config.dismissedUntil, config.hasOpenedChatBefore, location.pathname]);

    // Show sequence (Pulse -> Full Bubble on second trigger)
    const showNudge = useCallback((message: string, isSoftNudge = false) => {
        if (!canShowNudge()) return;

        // If it's a soft nudge (like time-based first visit) and we haven't pulsed yet, just pulse
        // The prompt says "First nudge: tiny pulse on chat icon. Second nudge: show message bubble."
        // We will increment sessionShowCount ONLY on showing the bubble? Or do we count pulse as 1 pop?
        // Prompt: "Max 1 proactive pop per session... First nudge: tiny pulse on the chat icon only"
        // Let's make Pulse step 0.

        const isFirstNudge = sessionShowCountRef.current === 0;

        if (isFirstNudge && isSoftNudge) {
            setIsPulseOnly(true);
            setIsNudgeVisible(true);
            // Pulse doesn't prevent second nudge, so we won't count it towards session limit.
        } else {
            setIsPulseOnly(false);
            setNudgeMessage(message);
            setIsNudgeVisible(true);
            sessionShowCountRef.current += 1;
            hasShownForPathRef.current.add(location.pathname);
            updateConfig({ lastProactiveShownAt: Date.now() });

            // Auto-hide
            if (hideNudgeTimeoutRef.current) clearTimeout(hideNudgeTimeoutRef.current);
            hideNudgeTimeoutRef.current = setTimeout(() => {
                setIsNudgeVisible(false);
            }, NUDGE_DURATION);
        }
    }, [canShowNudge, location.pathname, updateConfig]);

    // Explicit Action Trigger Router
    const triggerProactiveAction = useCallback((type: string, payload?: string) => {
        if (!canShowNudge()) return;

        let message = '';
        let soft = false;

        switch (type) {
            case 'time-general-45':
                message = "Need help getting started? I can guide you in 30 seconds.";
                soft = true;
                break;
            case 'time-general-90':
                message = "Want me to set this up with you? Tap here.";
                break;
            case 'inactive-social-post':
                message = "Want me to write a better caption + hashtags for this post?";
                break;
            case 'inactive-video':
                message = "Want a ready-to-use prompt for Kling? Tell me your niche + style.";
                break;
            case 'error-video':
                message = "I can help you get a better video result on the first try.";
                break;
            case 'pricing-long':
                message = "Not sure which plan fits? Tell me what you're trying to automate.";
                break;
            case 'pricing-hover':
                message = "Want the cheapest setup for your goals? I'll recommend a plan.";
                break;
            case 'connect-step':
                message = "Stuck connecting your account? I'll walk you through it.";
                break;
            case 'validation-error':
                message = "I can fix this with you—paste the error message here.";
                break;
            default:
                message = payload || "Need help? I'm here!";
                break;
        }

        if (message) showNudge(message, soft);
    }, [canShowNudge, showNudge]);

    // Track exit intent (desktop only)
    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY < 10) {
                // User moving to close tab
                if (canShowNudge()) triggerProactiveAction('exit-intent', 'Before you go... anything I can help with?');
            }
        };

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            document.addEventListener('mouseleave', handleMouseLeave);
        }
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [canShowNudge, triggerProactiveAction]);

    // Time-based low-signal triggers
    useEffect(() => {
        if (!canShowNudge()) return;

        let timeout: NodeJS.Timeout;
        const isFirstVisit = !config.hasOpenedChatBefore && !config.lastProactiveShownAt;
        const delay = isFirstVisit ? 45000 : 90000;

        timeout = setTimeout(() => {
            if (location.pathname === '/pricing') {
                triggerProactiveAction('pricing-long');
            } else if (location.pathname.includes('/tool')) {
                triggerProactiveAction(isFirstVisit ? 'time-general-45' : 'time-general-90');
            }
        }, delay);

        return () => clearTimeout(timeout);
    }, [location.pathname, canShowNudge, config.hasOpenedChatBefore, config.lastProactiveShownAt, triggerProactiveAction]);

    // Interactions
    const dismissNudge = useCallback((type: 'close' | 'notNow' = 'close') => {
        setIsNudgeVisible(false);
        setIsPulseOnly(false);

        let cooldownDuration = COOLDOWN_24H;
        if (type === 'notNow') cooldownDuration = COOLDOWN_7D;

        updateConfig({ dismissedUntil: Date.now() + cooldownDuration });

        if (hideNudgeTimeoutRef.current) clearTimeout(hideNudgeTimeoutRef.current);
    }, [updateConfig]);

    const openChat = useCallback((initialMessage?: string) => {
        setIsOpen(true);
        setIsNudgeVisible(false);
        setIsPulseOnly(false);

        // Disable for 30 days
        updateConfig({
            hasOpenedChatBefore: true,
            dismissedUntil: Date.now() + COOLDOWN_30D
        });

        if (initialMessage) {
            setMessages(prev => [...prev, {
                id: `context-${Date.now()}`,
                role: 'assistant',
                content: initialMessage,
                timestamp: new Date(),
            }]);
        }
    }, [updateConfig]);

    const closeChat = useCallback(() => setIsOpen(false), []);

    const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
        }]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Hi there! I\'m your SCS AI Support Agent. How can I help you today?',
            timestamp: new Date(),
        }]);
    }, []);

    return (
        <SupportAgentContext.Provider value={{
            isOpen,
            messages,
            nudgeMessage,
            isNudgeVisible,
            isPulseOnly,
            openChat,
            closeChat,
            addMessage,
            dismissNudge,
            clearMessages,
            triggerProactiveAction,
            setIsBusy,
        }}>
            {children}
        </SupportAgentContext.Provider>
    );
}

export function useSupportAgent() {
    const context = useContext(SupportAgentContext);
    if (context === undefined) throw new Error('useSupportAgent must be used within a SupportAgentProvider');
    return context;
}

