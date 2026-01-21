import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { toast } from "sonner";
import GlassCard from './GlassCard';
import PostSelector from './components/PostSelector';
import ImageUploadZone from './components/ImageUploadZone';
import ReportDisplay from './components/ReportDisplay';

interface EditorAIContentProps {
    sites: any[];
}

export default function EditorAIContent({ sites }: EditorAIContentProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string>("");
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [userInstruction, setUserInstruction] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [report, setReport] = useState<any>(null);

    const handleEnhance = async () => {
        if (!selectedSiteId || !selectedPostId) {
            toast.error("Please select a site and post");
            return;
        }

        const site = sites.find(s => s.id === selectedSiteId);
        if (!site) return;

        setIsLoading(true);
        setReport(null); // Clear previous report
        const toastId = toast.loading("AI Agent is reading & optimizing your post...");

        try {
            // Prepare FormData for binary upload
            const formData = new FormData();

            // Add JSON body
            const jsonBody = {
                post_id: selectedPostId,
                wp_url: site.site_url,
                wp_username: site.username,
                wp_app_password: site.app_password,
                user_instruction: userInstruction
            };
            // Add fields individually so n8n can read them as standard form inputs
            Object.entries(jsonBody).forEach(([key, value]) => {
                // Ensure value is string
                formData.append(key, String(value));
            });

            // Add images as binary fields image_0, image_1, etc. (Wait, n8n expects image_ keys in binary)
            // n8n binary node expects distinct field names. My workflow looks for keys starting with 'image'
            images.forEach((file, index) => {
                formData.append(`image_${index}`, file);
            });

            // Call the SCS_POST_EDITOR_AGENT webhook (Proxy via backend often needed for CORS, but user said n8n urls in frontend)
            // If CORS is an issue, we might need a proxy. Assuming standard n8n Setup.
            // Using standard fetch with FormData

            // NOTE: Sending binary + json to n8n typically requires "Multipart-form-data"
            // But n8n's standard webhook node usually expects query params or JSON body.
            // For binary, we need the webhook to accept it.
            // My workflow handles binary + json input.

            // Let's try sending as FormData. 
            // Important: Do NOT set Content-Type header manually when sending FormData, browser does it with boundary.

            const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook-test/post-editor-agent', {
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
                                value={userInstruction}
                                onChange={(e) => setUserInstruction(e.target.value)}
                                placeholder="e.g. Focus on adding links to our 'Consulting' page and make the tone more energetic."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                            />
                        </div>

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
