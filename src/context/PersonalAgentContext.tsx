import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type MediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  file?: File;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  media?: MediaItem[];
  tool_calls?: string[];
  tool_results?: Record<string, unknown>;
};

type ProgressStep = {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
};

type PersonalAgentContextType = {
  isOpen: boolean;
  messages: Message[];
  progressSteps: ProgressStep[];
  isProcessing: boolean;
  isUploading: boolean;
  sessionId: string | null;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string, media?: MediaItem[]) => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  uploadMedia: (files: FileList | File[]) => Promise<MediaItem[]>;
};

const PersonalAgentContext = createContext<PersonalAgentContextType | undefined>(undefined);

const STORAGE_KEY = 'scs_personal_agent_session';

export function PersonalAgentProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionId) {
          setSessionId(parsed.sessionId);
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }, []);

  const saveSession = (newSessionId: string) => {
    setSessionId(newSessionId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: newSessionId }));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const uploadMedia = useCallback(async (files: FileList | File[]): Promise<MediaItem[]> => {
    if (!isUserLoaded || !user) {
      console.error('User not loaded');
      return [];
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 100MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return [];

    setIsUploading(true);
    const uploadedMedia: MediaItem[] = [];

    try {
      for (const file of validFiles) {
        const isVideo = file.type.startsWith('video/');
        const fileName = `personal-agent/${user.id}/${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('social-media')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('social-media')
          .getPublicUrl(fileName);

        uploadedMedia.push({
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: isVideo ? 'video' : 'image',
          url: publicUrl,
          name: file.name,
          file: file,
        });
      }

      toast.success(`Uploaded ${uploadedMedia.length} file(s)`);
      return uploadedMedia;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload media');
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [user, isUserLoaded]);

  const sendMessage = useCallback(async (message: string, media?: MediaItem[]) => {
    if (!isUserLoaded || !user) {
      console.error('User not loaded');
      return;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      media: media,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setProgressSteps([{ id: 'init', message: 'Starting...', status: 'in_progress' }]);

    try {
      const response = await fetch('/api/personal-agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage: Message | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.type === 'start') {
                if (data.session_id) {
                  saveSession(data.session_id);
                }
              }

              if (data.type === 'progress' || data.type === 'tool_executing') {
                const stepId = `step_${Date.now()}`;
                setProgressSteps(prev => [
                  ...prev.filter(p => p.status !== 'in_progress'),
                  { id: stepId, message: data.message, status: 'in_progress' },
                ]);
              }

              if (data.type === 'tool_calls') {
                setProgressSteps(prev => [
                  ...prev.filter(p => p.status !== 'in_progress'),
                  ...data.tools.map((tool: string, idx: number) => ({
                    id: `tool_${idx}_${Date.now()}`,
                    message: `Running ${tool}...`,
                    status: 'pending' as const,
                  })),
                ]);
              }

              if (data.type === 'complete') {
                if (data.session_id) {
                  saveSession(data.session_id);
                }
                
                assistantMessage = {
                  id: `msg_${Date.now()}`,
                  role: 'assistant',
                  content: data.response,
                  timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage!]);
              }

              if (data.type === 'error') {
                setProgressSteps(prev => [
                  ...prev,
                  { id: 'error', message: data.message || 'An error occurred', status: 'error' },
                ]);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      setProgressSteps(prev => 
        prev.map(p => p.status === 'in_progress' ? { ...p, status: 'completed' } : p)
      );

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [user, isUserLoaded, getToken, sessionId]);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      await fetch(`/api/personal-agent/history?clear_all=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setMessages([]);
      setProgressSteps([]);
      setSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [user, getToken]);

  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      const url = sessionId 
        ? `/api/personal-agent/history?session_id=${sessionId}`
        : '/api/personal-agent/history';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const loadedMessages: Message[] = data.messages.map((msg: Record<string, unknown>) => ({
          id: msg.id as string,
          role: msg.role as 'user' | 'assistant',
          content: msg.content as string,
          timestamp: new Date(msg.created_at as string),
        }));
        setMessages(loadedMessages);
      }

      if (data.sessions && data.sessions.length > 0) {
        const activeSession = data.sessions.find((s: Record<string, unknown>) => s.is_active);
        if (activeSession && !sessionId) {
          saveSession(activeSession.session_id as string);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, [user, getToken, sessionId]);

  useEffect(() => {
    if (isUserLoaded && user && isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, isUserLoaded, user, messages.length, loadHistory]);

  return (
    <PersonalAgentContext.Provider
      value={{
        isOpen,
        messages,
        progressSteps,
        isProcessing,
        isUploading,
        sessionId,
        openChat,
        closeChat,
        sendMessage,
        clearHistory,
        loadHistory,
        uploadMedia,
      }}
    >
      {children}
    </PersonalAgentContext.Provider>
  );
}

export function usePersonalAgent() {
  const context = useContext(PersonalAgentContext);
  if (context === undefined) {
    throw new Error('usePersonalAgent must be used within a PersonalAgentProvider');
  }
  return context;
}