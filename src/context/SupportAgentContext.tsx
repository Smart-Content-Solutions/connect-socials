import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Type definitions for chat messages
type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

// Storage configuration
type SupportAgentConfig = {
    lastShown: number | null;
    lastDismissed: number | null;
    lastChatOpen: number | null;
    showCount: number;
    dismissedCount: number;
};

const STORAGE_KEY = 'scs_support_agent_config';

// Trigger messages for different pages
const PAGE_MESSAGES: Record<string, string> = {
    '/pricing': 'Not sure which plan fits your needs? I can help you choose!',
    '/packages': 'Looking for the right package? Let me explain the options.',
    '/core-tools': 'Need help understanding our tools? Ask me anything!',
    '/corporate-tools': 'Have questions about our enterprise solutions?',
    '/tool': 'Need assistance with this tool? I\'m here to help!',
    '/dashboard-preview': 'Want to learn more about the dashboard features?',
    '/starter': 'Questions about the Starter plan? I can help!',
    '/pro': 'Curious about Pro features? Let me explain!',
    '/checkout': 'Need help with your purchase? I\'m here to assist!',
};

const GENERAL_MESSAGES = [
    'Need help? I\'m here to assist you!',
    'Have any questions? Just ask!',
    'Looking for something? I can help!',
];

const INACTIVITY_MESSAGE = 'Still there? I can help if you need anything!';

// Timing constants
const INITIAL_DELAY = 45000; // 45 seconds
const PAGE_SPECIFIC_DELAY = 20000; // 20 seconds
const INACTIVITY_DELAY = 30000; // 30 seconds
const NUDGE_DURATION = 8000; // 8 seconds
const COOLDOWN_24H = 24 * 60 * 60 * 1000; // 24 hours
const COOLDOWN_30D = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_SHOWS_PER_SESSION = 3;

interface SupportAgentContextType {
    isOpen: boolean;
    messages: Message[];
    nudgeMessage: string | null;
    isNudgeVisible: boolean;
    openChat: (initialMessage?: string) => void;
    closeChat: () => void;
    addMessage: (role: 'user' | 'assistant', content: string) => void;
    dismissNudge: () => void;
    clearMessages: () => void;
}

const SupportAgentContext = createContext<SupportAgentContextType | undefined>(undefined);

// Load config from localStorage
const loadConfig = (): SupportAgentConfig => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load support agent config:', e);
    }
    return {
        lastShown: null,
        lastDismissed: null,
        lastChatOpen: null,
        showCount: 0,
        dismissedCount: 0,
    };
};

// Save config to localStorage
const saveConfig = (config: SupportAgentConfig) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save support agent config:', e);
    }
};

export function SupportAgentProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi there! I\'m your SCS AI Support Agent. How can I help you today?',
            timestamp: new Date(),
        },
    ]);
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const [isNudgeVisible, setIsNudgeVisible] = useState(false);
    const [config, setConfig] = useState<SupportAgentConfig>(loadConfig());
    
    const location = useLocation();
    const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideNudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const sessionShowCountRef = useRef<number>(0);
    const hasShownForPathRef = useRef<Set<string>>(new Set());

    // Update config and save to localStorage
    const updateConfig = useCallback((updates: Partial<SupportAgentConfig>) => {
        setConfig(prev => {
            const newConfig = { ...prev, ...updates };
            saveConfig(newConfig);
            return newConfig;
        });
    }, []);

    // Check if we can show a nudge based on cooldown rules
    const canShowNudge = useCallback((): boolean => {
        const now = Date.now();
        
        // If chat was opened recently (30 days), don't show
        if (config.lastChatOpen && (now - config.lastChatOpen) < COOLDOWN_30D) {
            return false;
        }
        
        // If user dismissed recently (24 hours), don't show
        if (config.lastDismissed && (now - config.lastDismissed) < COOLDOWN_24H) {
            return false;
        }
        
        // Max shows per session
        if (sessionShowCountRef.current >= MAX_SHOWS_PER_SESSION) {
            return false;
        }
        
        return true;
    }, [config.lastChatOpen, config.lastDismissed]);

    // Show nudge with message
    const showNudge = useCallback((message: string) => {
        if (!canShowNudge()) return;
        
        setNudgeMessage(message);
        setIsNudgeVisible(true);
        sessionShowCountRef.current += 1;
        updateConfig({ 
            lastShown: Date.now(),
            showCount: config.showCount + 1 
        });

        // Auto-hide after duration
        if (hideNudgeTimeoutRef.current) {
            clearTimeout(hideNudgeTimeoutRef.current);
        }
        hideNudgeTimeoutRef.current = setTimeout(() => {
            setIsNudgeVisible(false);
        }, NUDGE_DURATION);
    }, [canShowNudge, config.showCount, updateConfig]);

    // Open chat
    const openChat = useCallback((initialMessage?: string) => {
        setIsOpen(true);
        setIsNudgeVisible(false);
        updateConfig({ lastChatOpen: Date.now() });
        
        if (initialMessage) {
            // Add the nudge message as context for the AI
            const contextMessage: Message = {
                id: `context-${Date.now()}`,
                role: 'assistant',
                content: initialMessage,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, contextMessage]);
        }
    }, [updateConfig]);

    // Close chat
    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Add message
    const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    // Dismiss nudge
    const dismissNudge = useCallback(() => {
        setIsNudgeVisible(false);
        updateConfig({ lastDismissed: Date.now() });
        
        if (hideNudgeTimeoutRef.current) {
            clearTimeout(hideNudgeTimeoutRef.current);
        }
    }, [updateConfig]);

    // Clear messages (reset to welcome message)
    const clearMessages = useCallback(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Hi there! I\'m your SCS AI Support Agent. How can I help you today?',
                timestamp: new Date(),
            },
        ]);
    }, []);

    // Reset session state on mount (page load/refresh)
    useEffect(() => {
        sessionShowCountRef.current = 0;
        hasShownForPathRef.current = new Set();
    }, []);

    // Page change trigger
    useEffect(() => {
        if (!canShowNudge()) return;
        
        const pathname = location.pathname;
        
        // Check if we've already shown for this path
        if (hasShownForPathRef.current.has(pathname)) return;
        
        // Get page-specific message
        const pageMessage = PAGE_MESSAGES[pathname];
        
        if (pageMessage) {
            // Clear any existing timeout
            if (nudgeTimeoutRef.current) {
                clearTimeout(nudgeTimeoutRef.current);
            }
            
            nudgeTimeoutRef.current = setTimeout(() => {
                showNudge(pageMessage);
                hasShownForPathRef.current.add(pathname);
            }, PAGE_SPECIFIC_DELAY);
        }

        return () => {
            if (nudgeTimeoutRef.current) {
                clearTimeout(nudgeTimeoutRef.current);
            }
        };
    }, [location.pathname, canShowNudge, showNudge]);

    // Initial load trigger (general message)
    useEffect(() => {
        if (!canShowNudge()) return;
        
        // Clear any existing timeout
        if (nudgeTimeoutRef.current) {
            clearTimeout(nudgeTimeoutRef.current);
        }
        
        nudgeTimeoutRef.current = setTimeout(() => {
            // Only show if we haven't shown a page-specific message yet
            if (!isNudgeVisible && !isOpen) {
                const randomMessage = GENERAL_MESSAGES[Math.floor(Math.random() * GENERAL_MESSAGES.length)];
                showNudge(randomMessage);
            }
        }, INITIAL_DELAY);

        return () => {
            if (nudgeTimeoutRef.current) {
                clearTimeout(nudgeTimeoutRef.current);
            }
        };
    }, [canShowNudge, showNudge, isNudgeVisible, isOpen]);

    // Inactivity trigger
    useEffect(() => {
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            
            // Reset inactivity timer
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
            
            // Only set up inactivity timer if chat is closed and no nudge is showing
            if (!isOpen && !isNudgeVisible && canShowNudge()) {
                inactivityTimeoutRef.current = setTimeout(() => {
                    showNudge(INACTIVITY_MESSAGE);
                }, INACTIVITY_DELAY);
            }
        };

        // Set up initial inactivity timer
        if (!isOpen && !isNudgeVisible && canShowNudge()) {
            inactivityTimeoutRef.current = setTimeout(() => {
                showNudge(INACTIVITY_MESSAGE);
            }, INACTIVITY_DELAY);
        }

        // Add activity listeners
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keypress', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keypress', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, [isOpen, isNudgeVisible, canShowNudge, showNudge]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
            if (hideNudgeTimeoutRef.current) clearTimeout(hideNudgeTimeoutRef.current);
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        };
    }, []);

    return (
        <SupportAgentContext.Provider value={{
            isOpen,
            messages,
            nudgeMessage,
            isNudgeVisible,
            openChat,
            closeChat,
            addMessage,
            dismissNudge,
            clearMessages,
        }}>
            {children}
        </SupportAgentContext.Provider>
    );
}

export function useSupportAgent() {
    const context = useContext(SupportAgentContext);
    if (context === undefined) {
        throw new Error('useSupportAgent must be used within a SupportAgentProvider');
    }
    return context;
}
