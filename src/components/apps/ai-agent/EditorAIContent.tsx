import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Wand2, Lightbulb, MessageCircleQuestion } from 'lucide-react';
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import GlassCard from './GlassCard';
import PostSelector from './components/PostSelector';
import ImageUploadZone from './components/ImageUploadZone';
import ReportDisplay from './components/ReportDisplay';
import { compressImage } from '@/lib/image-compression';

interface EditorAIContentProps {
    sites: any[];
}

const AI_CAPABILITIES = [
    { id: 'seo', label: 'Optimize SEO for Rank Math', emoji: '🎯' },
    { id: 'links', label: 'Add relevant internal links to related pages', emoji: '🔗' },
    { id: 'images', label: 'Place images strategically throughout the post', emoji: '🖼️' },
    { id: 'voice', label: 'Apply brand voice and tone consistently', emoji: '✨' },
    { id: 'structure', label: 'Improve content structure with proper headings', emoji: '📝' },
    { id: 'meta', label: 'Update meta title and description', emoji: '📊' },
    { id: 'focus-keyword', label: 'Optimize focus keyword placement', emoji: '🔑' },
    { id: 'cta', label: 'Add compelling calls-to-action', emoji: '🚀' },
];

export default function EditorAIContent({ sites }: EditorAIContentProps) {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string>("");
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [userInstruction, setUserInstruction] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [report, setReport] = useState<any>(null);
    const [showInfoBox, setShowInfoBox] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleCapabilityClick = (capability: string) => {
        setUserInstruction(prev => {
            const trimmed = prev.trim();
            const newValue = trimmed === '' ? capability : trimmed + ' ' + capability;
            return newValue;
        });
        
        // Focus the textarea after adding the capability
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const infoBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isTextarea = textareaRef.current?.contains(target);
            const isInfoBox = infoBoxRef.current?.contains(target);
            
            if (!isTextarea && !isInfoBox) {
                setShowInfoBox(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEnhance = async () => {
        if (!selectedSiteId || !selectedPostId) {
            toast.error("Please select a site and post");
            return;
        }

        const site = sites.find(s => s.id === selectedSiteId);
        if (!site) return;

        setIsLoading(true);
        setReport(null); // Clear previous report
        const toastId = toast.loading("Compressing images & preparing optimization...");

        try {
            // 1. Compress images before upload to avoid 413 "Payload Too Large"
            const compressedImages = await Promise.all(
                images.map(img => compressImage(img))
            );

            // Prepare FormData for binary upload
            const formData = new FormData();


            // Add JSON body
            const jsonBody = {
                post_id: selectedPostId,
                wp_url: site.site_url,
                wp_username: site.username,
                wp_app_password: site.app_password,
                user_id: user?.id || '',
                user_instruction: userInstruction
            };
            // Add fields individually so n8n can read them as standard form inputs
            Object.entries(jsonBody).forEach(([key, value]) => {
                // Ensure value is string
                formData.append(key, String(value));
            });

            // Add images as binary fields image_0, image_1, etc.
            compressedImages.forEach((file, index) => {
                formData.append(`image_${index}`, file);
            });

            // Update toast
            toast.loading("AI Agent is reading & optimizing your post...", { id: toastId });


            // Call the SCS_POST_EDITOR_AGENT webhook (Proxy via backend often needed for CORS, but user said n8n urls in frontend)
            // If CORS is an issue, we might need a proxy. Assuming standard n8n Setup.
            // Using standard fetch with FormData

            // NOTE: Sending binary + json to n8n typically requires "Multipart-form-data"
            // But n8n's standard webhook node usually expects query params or JSON body.
            // For binary, we need the webhook to accept it.
            // My workflow handles binary + json input.



            const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/post-editor-agent', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Optimization failed");

            // Handle the response
            const text = await response.text();
            let result;
            try {
                result = text ? JSON.parse(text) : null;
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                throw new Error("Received invalid response from AI Agent");
            }

            if (!result) {
                throw new Error("AI Agent returned no data");
            }

            setReport(result);
            toast.success("Post Enhanced Successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Agent encountered an error.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedSite = sites.find(s => s.id === selectedSiteId);

    return (
        <div className="w-full max-w-5xl mx-auto p-6 pb-24 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-pink-500/10 mb-4 border border-pink-500/20">
                    <Sparkles className="w-8 h-8 text-pink-400" />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">SCS AI Editor</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    The premium "Set and Forget" manager. Enhances any post with brand voice,
                    intelligent internal linking, and strategic image placement.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-4">
                            {/* Site Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">WordPress Site</label>
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => {
                                        setSelectedSiteId(e.target.value);
                                        setSelectedPostId(null);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                                >
                                    <option value="">-- Choose Site --</option>
                                    {sites.map(site => (
                                        <option key={site.id} value={site.id}>{site.site_name || site.site_url}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Post Select (Pass the full site object for creds) */}
                            <PostSelector
                                site={selectedSite}
                                onSelect={setSelectedPostId}
                                selectedPostId={selectedPostId}
                            />

                            <div className="pt-4 border-t border-white/5">
                                <ImageUploadZone
                                    images={images}
                                    onImagesChange={setImages}
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Instructions & Report */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                                <span>Optimization Instructions</span>
                                <span className="text-xs text-pink-400">Optional</span>
                            </label>
                            <textarea
                                ref={textareaRef}
                                value={userInstruction}
                                onChange={(e) => setUserInstruction(e.target.value)}
                                onFocus={() => setShowInfoBox(true)}
                                placeholder="e.g. Focus on adding links to our 'Consulting' page and make the tone more energetic."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                            />
                        </div>

                        <AnimatePresence>
                            {showInfoBox && (
                                <motion.div
                                    ref={infoBoxRef}
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-gradient-to-br from-[#3B3C3E]/60 to-[#3B3C3E]/30 backdrop-blur-xl rounded-xl border border-white/10 p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-pink-400">
                                            <Lightbulb className="w-4 h-4" />
                                            <span className="text-sm font-semibold">What can this AI do?</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {AI_CAPABILITIES.map((cap) => (
                                                <button
                                                    key={cap.id}
                                                    onClick={() => handleCapabilityClick(cap.label)}
                                                    className="flex items-center gap-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-200 group"
                                                >
                                                    <span className="text-lg group-hover:scale-110 transition-transform">{cap.emoji}</span>
                                                    <span className="flex-1">{cap.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
                                            <MessageCircleQuestion className="w-3 h-3" />
                                            <span>Stuck? Ask the chatbot for guidance!</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!report && (
                            <button
                                onClick={handleEnhance}
                                disabled={isLoading || !selectedPostId}
                                className="w-full group px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Optimizing Content...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        <span>Enhance Post with AI</span>
                                    </>
                                )}
                            </button>
                        )}
                    </GlassCard>

                    {/* Report Area */}
                    {report && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <GlassCard className="p-6 bg-gradient-to-br from-[#3B3C3E]/40 to-green-900/10 border-green-500/20">
                                <ReportDisplay report={report} />

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setReport(null);
                                            setSelectedPostId(null);
                                            setImages([]);
                                            setUserInstruction("");
                                        }}
                                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        Optimize Another Post <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
