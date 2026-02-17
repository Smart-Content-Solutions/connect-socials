import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Send, AlertCircle, CheckCircle, Globe, Info, Mic, MicOff, X, Image as ImageIcon } from 'lucide-react';
import GlassCard from './GlassCard';
import GoldButton from './GoldButton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WordPressSite } from './WordPressSiteCard';
import { toast } from "sonner";
import { compressImage } from '@/lib/image-compression';
import { usePostDraft } from '@/hooks/usePostDraft';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { LeaveConfirmationDialog, DraftRestoreDialog } from '@/components/drafts';
import { hasDraftContent } from '@/lib/draft-utils';

// Use backend API proxy to avoid CORS issues with direct n8n calls
const API_PROXY_URL = "/api/wordpress-automation";

interface CreatePostContentProps {
    sites: WordPressSite[];
}

export default function CreatePostContent({ sites }: CreatePostContentProps) {
    const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);

    // Form State
    const [topic, setTopic] = useState("");
    const [sections, setSections] = useState(3);
    const [keywords, setKeywords] = useState("");
    const [location, setLocation] = useState("");
    const [occupation, setOccupation] = useState("");
    const [audience, setAudience] = useState("");
    const [tone, setTone] = useState("Professional");
    const [customTone, setCustomTone] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const errorRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (errorMsg && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [errorMsg]);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isTopicFocused, setIsTopicFocused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Draft System Integration
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);

    // Function to get current form data for draft
    const getDraftData = useCallback(() => ({
        selectedSiteIds,
        topic,
        sections,
        keywords,
        location,
        occupation,
        audience,
        tone,
        customTone,
        imagePreview
    }), [selectedSiteIds, topic, sections, keywords, location, occupation, audience, tone, customTone, imagePreview]);

    // Function to restore form from draft data
    const setDraftData = useCallback((data: Record<string, any>) => {
        if (data.selectedSiteIds) setSelectedSiteIds(data.selectedSiteIds);
        if (data.topic) setTopic(data.topic);
        if (data.sections) setSections(data.sections);
        if (data.keywords) setKeywords(data.keywords);
        if (data.location) setLocation(data.location);
        if (data.occupation) setOccupation(data.occupation);
        if (data.audience) setAudience(data.audience);
        if (data.tone) setTone(data.tone);
        if (data.customTone) setCustomTone(data.customTone);
        if (data.imagePreview) setImagePreview(data.imagePreview);
    }, []);

    // Function to check if form has changes
    const hasChanges = useCallback(() => {
        return hasDraftContent(getDraftData());
    }, [getDraftData]);

    // Initialize draft hook
    const { saveDraft, loadDraft, deleteDraft, draftExists, isLoaded, draftTimestamp } = usePostDraft({
        toolType: 'wordpress-create',
        getDraftData,
        setDraftData,
        hasChanges
    });

    // Initialize unsaved changes warning hook
    const { showDialog, handleLeave, handleStay, handleSaveDraft, isSaving } = useUnsavedChangesWarning({
        hasUnsavedChanges: hasChanges(),
        onSaveDraft: saveDraft
    });

    // Check for draft on mount
    useEffect(() => {
        if (isLoaded && draftExists) {
            setShowRestoreDialog(true);
        }
    }, [isLoaded, draftExists]);

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                toast.error("Voice input is not supported in this browser. Please use Chrome or Edge.");
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                toast.info("Listening... Speak now.");
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);

                if (event.error === 'network') {
                    toast.error("Network error: Please check your internet connection. Voice input requires online access.");
                } else if (event.error === 'not-allowed') {
                    toast.error("Microphone access denied. Please allow microphone permissions in your browser settings.");
                } else if (event.error === 'no-speech') {
                    toast.error("No speech detected. Please try again.");
                } else {
                    toast.error(`Voice input failed (${event.error}). Please try again.`);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            // Check for internet connection first
            if (!navigator.onLine) {
                toast.error("You are offline. Voice input requires an internet connection.");
                return;
            }

            let finalTranscript = topic; // Start with existing text
            // If the field was empty, we start fresh. If not, we might want to append a space if needed.
            if (finalTranscript && !finalTranscript.endsWith(' ')) {
                finalTranscript += ' ';
            }

            const initialText = finalTranscript; // Snapshot of text before this session

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let newFinalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newFinalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // We update the state with: Initial Text + Any New Final Segments + Current Interim
                // This is a bit simplified, but works for basic dictation.
                // A better way for pure "append" is just to accumulate.

                // Let's just append the *current* session's result to the *initial* text.
                // But `event.results` contains everything since `start()` if continuous=true? 
                // actually event.resultIndex tells us where the new results start.
                // Web Speech API is tricky. 

                // Simpler approach for React Controlled Input:
                // Just use the latest result from the api which usually accumulates if continuous=true?
                // No, continuous=true means it keeps going, but results array grows.

                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');

                setTopic(initialText + currentTranscript);
            };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    useEffect(() => {
        // Select the first site by default if none selected and sites exist
        if (sites.length > 0 && selectedSiteIds.length === 0) {
            setSelectedSiteIds([sites[0].id]);
        }
    }, [sites]);

    const toggleSite = (id: string) => {
        setSelectedSiteIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImage(f);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(String(reader.result));
        reader.readAsDataURL(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (!f) return;
        setImage(f);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(String(reader.result));
        reader.readAsDataURL(f);
    };

    const handleSubmit = async () => {
        setErrorMsg(null);
        if (selectedSiteIds.length === 0) {
            setErrorMsg("Please select at least one WordPress site.");
            return;
        }
        if (!topic.trim()) {
            setErrorMsg("Please enter a topic or title for your post.");
            return;
        }

        setLoading(true);
        setProgress(0);

        // Simulate progress since the webhook might take time or return quickly
        // We want a smooth bar that gives feedback
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 2;
            });
        }, 800);

        const selectedSites = sites.filter(s => selectedSiteIds.includes(s.id));

        // Pre-process image (compress & convert to base64 once)
        let imageData: string | null = null;
        let imageName: string | null = null;

        if (image) {
            try {
                // Show toast for large images to explain delay
                if (image.size > 1024 * 1024) {
                    toast.info("Optimizing image...", { duration: 2000 });
                }

                const processedFile = await compressImage(image);
                imageName = processedFile.name;

                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        // Remove the data:image/...;base64, prefix
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.readAsDataURL(processedFile);
                });
                imageData = await base64Promise;
            } catch (err) {
                console.error("Image processing failed", err);
                // Continue without image or fail? 
                // Let's fail specific to image but maybe allow user to retry without it? 
                // For now, let's just log and continue without image to prevent crash, or maybe better to stop.
                // Stopping is safer.
                toast.error("Failed to process image. Please try another.");
                setLoading(false);
                return;
            }
        }

        let successCount = 0;
        let failureCount = 0;

        for (const site of selectedSites) {

            const payload = {
                topic,
                sections: String(sections),
                keywords,
                location,
                occupation,
                audience,
                tone: tone === 'Custom' ? customTone : tone,
                wp_url: site.site_url,
                wp_username: site.username || '',
                wp_app_password: site.app_password || '',
                ...(imageData && { image: imageData, imageName }),
            };

            try {
                // Request sent through backend API proxy to avoid CORS issues
                const response = await fetch(API_PROXY_URL, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                // Handle non-JSON responses (like 413 errors)
                let result;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    result = { success: false, error: text || `HTTP ${response.status}` };
                }

                if (response.ok && result.success) {
                    successCount++;
                    console.log("Successfully triggered automation for", site.site_name);
                } else {
                    const errorMsg = result.error || result.details || response.statusText || `HTTP ${response.status}`;
                    console.error("Failed to post to", site.site_name, errorMsg);
                    failureCount++;
                }
            } catch (e: any) {
                // Network errors should be reported as failures, not hidden
                console.error("Failed to post to", site.site_name, e);
                failureCount++;
            }
        }

        clearInterval(progressInterval);
        setProgress(100);

        // Small delay to let user see 100%
        setTimeout(() => {
            setLoading(false);
            if (successCount > 0) {
                if (failureCount === 0) {
                    toast.success("Automation started! Your AI-generated posts will appear in WordPress drafts within 4-5 minutes.", {
                        duration: 6000,
                    });
                } else {
                    toast.warning(`Started generation for ${successCount} site(s), but failed for ${failureCount} site(s).`, {
                        duration: 6000,
                    });
                }
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setProgress(0);
                }, 5000);
                // Optional: clear form
                setTopic("");
                setImage(null);
                setImagePreview(null);
            } else {
                setErrorMsg("Failed to trigger automation for any of the selected sites. Please check your site connections and credentials.");
                setProgress(0);
            }
        }, 500);
    };

    const isValid = selectedSiteIds.length > 0 && topic.trim().length > 0;

    if (sites.length === 0) {
        return (
            <GlassCard className="p-8 text-center max-w-2xl mx-auto">
                <AlertCircle className="w-12 h-12 text-[#E1C37A] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#D6D7D8] mb-2">No WordPress Sites Connected</h3>
                <p className="text-[#A9AAAC] mb-6">Connect at least one WordPress site from the Dashboard to start creating posts.</p>
            </GlassCard>
        );
    }

    return (
        <div>
            {/* <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#1A1A1C]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">Create Post</h2>
                    <p className="text-[#A9AAAC] text-sm">Publish SEO-optimized content to WordPress</p>
                </div>
            </div> */}

            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                >
                    <GlassCard goldGlow className="p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[#D6D7D8] font-medium">Automation Started Successfully!</p>
                            <p className="text-[#A9AAAC] text-sm mt-1">Your AI-generated post is being created and will appear in your WordPress drafts within 4-5 minutes.</p>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {errorMsg && (
                <div ref={errorRef} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="md:col-span-2 space-y-6">

                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Post Content</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-400">Topic / Title</label>
                                    <button
                                        onClick={toggleVoiceInput}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                                            isListening
                                                ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                                : "bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20 hover:bg-[#E1C37A]/20"
                                        )}
                                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                                    >
                                        {isListening ? (
                                            <>
                                                <MicOff className="w-3 h-3" />
                                                <span>Listening...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-3 h-3" />
                                                <span>Voice Input</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white focus:border-[#E1C37A] transition-colors"
                                    rows={3}
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter topic, idea, or draft..."
                                    onFocus={() => setIsTopicFocused(true)}
                                    onBlur={() => setIsTopicFocused(false)}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">SEO Personalization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Location</label>
                                <Input
                                    placeholder="Location (optional)"
                                    className="bg-[#1A1A1C] border-[#333] text-white"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Occupation / Industry</label>
                                <Input
                                    placeholder="Occupation"
                                    className="bg-[#1A1A1C] border-[#333] text-white"
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Target Audience</label>
                                <Input
                                    placeholder="Audience"
                                    className="bg-[#1A1A1C] border-[#333] text-white"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Keywords</label>
                                <Input
                                    placeholder="Keywords (comma separated)"
                                    className="bg-[#1A1A1C] border-[#333] text-white"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Content Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm text-gray-400">Content Tone</label>
                                <select
                                    className="p-2.5 rounded-lg bg-[#1A1A1C] border border-[#333] text-white focus:border-[#E1C37A] outline-none"
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                >
                                    <option>Professional</option>
                                    <option>Friendly</option>
                                    <option>Bold</option>
                                    <option>Informative</option>
                                    <option>Humorous</option>
                                    <option>Custom</option>
                                </select>

                                <AnimatePresence>
                                    {tone === 'Custom' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Input
                                                placeholder="Describe your custom tone (e.g., Witty and conversational)"
                                                className="bg-[#1A1A1C] border-[#333] text-white mt-2"
                                                value={customTone}
                                                onChange={(e) => setCustomTone(e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm text-gray-400">Number of Sections: {sections}</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={sections}
                                    onChange={(e) => setSections(Number(e.target.value))}
                                    className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#E1C37A]"
                                />
                            </div>
                        </div>
                    </GlassCard>

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {isTopicFocused && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <GlassCard className="p-5 border-[#E1C37A]/30 bg-[#E1C37A]/5">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-[#E1C37A] mt-0.5 shrink-0" />
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-[#E1C37A] text-sm">How this field works</h4>
                                            <p className="text-xs text-[#D6D7D8] leading-relaxed">
                                                The text you enter here becomes the foundation of your entire article. Our AI expands, enhances, and optimizes your input into a complete, ready post.
                                            </p>
                                            <p className="text-xs text-[#A9AAAC] leading-relaxed">
                                                For best results, include as much detail as possible. The topic, angle, target reader, key points, examples, or anything important.
                                            </p>
                                            <p className="text-xs font-medium text-[#E1C37A]">
                                                More detail is more accurate content.
                                            </p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                            Select Sites
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {sites.map(site => (
                                <div
                                    key={site.id}
                                    onClick={() => toggleSite(site.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                                        selectedSiteIds.includes(site.id)
                                            ? "bg-[#E1C37A]/10 border-[#E1C37A]"
                                            : "bg-[#1A1A1C] border-transparent hover:bg-[#333]"
                                    )}
                                >
                                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selectedSiteIds.includes(site.id) ? "border-[#E1C37A] bg-[#E1C37A]" : "border-[#555]")}>
                                        {selectedSiteIds.includes(site.id) && <CheckCircle className="w-3 h-3 text-black" />}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium text-white truncate">{site.site_name}</p>
                                        <p className="text-xs text-gray-500 truncate">{site.site_url}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                            Attach Image
                        </h3>
                        {imagePreview ? (
                            <div className="relative">
                                <img src={imagePreview} className="w-full rounded-lg max-h-64 object-contain bg-black/20" alt="Preview" />
                                <button
                                    onClick={() => {
                                        setImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload-wp')?.click()}
                                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${isDragging
                                    ? 'border-[#E1C37A] bg-[#E1C37A]/5'
                                    : 'border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20'
                                    }`}
                            >
                                <div className="flex justify-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-[#E1C37A]" />
                                    </div>
                                </div>
                                <p className="text-[#D6D7D8] font-medium mb-1">Drop your image here</p>
                                <p className="text-[#5B5C60] text-xs">or click to browse</p>
                            </div>
                        )}
                        <input
                            id="file-upload-wp"
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </GlassCard>

                    <GoldButton
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-4 text-base flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Generate
                            </>
                        )}
                    </GoldButton>

                    {loading && (
                        <div className="mt-4">
                            <div className="w-full bg-[#1A1A1C] border border-[#333] rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                    className="bg-gradient-to-r from-[#E1C37A] to-[#B6934C] h-full rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            </div>
                            <p className="text-xs text-[#A9AAAC] mt-3 text-center animate-pulse">
                                Generating content... This may take up to 5 minutes to appear in your drafts.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Draft Dialogs */}
            <LeaveConfirmationDialog
                open={showDialog}
                onOpenChange={() => {}}
                onLeave={handleLeave}
                onStay={handleStay}
                onSaveDraft={handleSaveDraft}
                isSaving={isSaving}
            />

            <DraftRestoreDialog
                open={showRestoreDialog}
                onOpenChange={setShowRestoreDialog}
                onContinue={async () => {
                    const draft = await loadDraft();
                    if (draft) {
                        setDraftData(draft);
                        toast.success('Draft restored successfully');
                    }
                    setShowRestoreDialog(false);
                }}
                onStartFresh={async () => {
                    await deleteDraft();
                    setShowRestoreDialog(false);
                }}
                draftTimestamp={draftTimestamp}
            />
        </div>
    );
}
