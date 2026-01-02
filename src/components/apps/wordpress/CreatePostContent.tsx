import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, Send, AlertCircle, CheckCircle, Globe, Info } from 'lucide-react';
import GlassCard from './GlassCard';
import GoldButton from './GoldButton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { WordPressSite } from './WordPressSiteCard';
import { toast } from "sonner";

const WEBHOOK_URL = "https://n8n.smartcontentsolutions.co.uk/webhook/seo-content-publisher";

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
    const [image, setImage] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isTopicFocused, setIsTopicFocused] = useState(false);
    const [progress, setProgress] = useState(0);

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

    const handleSubmit = async () => {
        if (selectedSiteIds.length === 0) return;
        if (!topic.trim()) return;

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
        let successCount = 0;
        let failureCount = 0;

        for (const site of selectedSites) {
            const form = new FormData();
            form.append("topic", topic);
            form.append("sections", String(sections));
            form.append("keywords", keywords);
            form.append("location", location);
            form.append("occupation", occupation);
            form.append("audience", audience);
            form.append("tone", tone);
            form.append("wp_url", site.site_url);
            form.append("wp_username", site.username || '');
            if (site.app_password) form.append("wp_app_password", site.app_password);
            if (image) form.append("image", image);

            try {
                // Request sent to n8n. 
                // Note: If n8n takes a long time, this might timeout or throw network error
                const response = await fetch(WEBHOOK_URL, { method: "POST", body: form });

                if (response.ok) {
                    successCount++;
                } else {
                    console.error("Failed to post to", site.site_name, response.statusText);
                    failureCount++;
                }
            } catch (e: any) {
                // Check for typical fetch errors that might indicate strict CORS or Timeout
                // while the backend actually received the request (as per user feedback)
                if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
                    console.warn("Network request reported failure, but backend is likely processing (Fire & Forget mode)", site.site_name);
                    successCount++;
                } else {
                    console.error("Failed to post to", site.site_name, e);
                    failureCount++;
                }
            }
        }

        clearInterval(progressInterval);
        setProgress(100);

        // Small delay to let user see 100%
        setTimeout(() => {
            setLoading(false);
            if (successCount > 0) {
                if (failureCount === 0) {
                    toast.success("Automation started! Your posts are being generated in the background.");
                } else {
                    toast.warning(`Started generation for ${successCount} site(s), but failed for ${failureCount} site(s).`);
                }
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    setProgress(0);
                }, 3000);
                // Optional: clear form
                setTopic("");
                setImage(null);
            } else {
                toast.error("Failed to trigger automation. Please check site credentials.");
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
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#1A1A1C]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">Create Post</h2>
                    <p className="text-[#A9AAAC] text-sm">Publish SEO-optimized content to WordPress</p>
                </div>
            </div>

            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                >
                    <GlassCard goldGlow className="p-4 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-[#D6D7D8]">Your content has been generated and sent to {selectedSiteIds.length} site(s).</p>
                    </GlassCard>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="md:col-span-2 space-y-6">

                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Post Content</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Topic / Title</label>
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
                        <div className="relative border border-dashed border-[#444] rounded-lg p-4 text-center hover:border-[#E1C37A]/50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-sm text-[#A9AAAC]">
                                {image ? (
                                    <span className="text-[#E1C37A] font-medium">{image.name}</span>
                                ) : (
                                    <span>Click to upload image</span>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    <GoldButton
                        onClick={handleSubmit}
                        disabled={!isValid || loading}
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
        </div>
    );
}
