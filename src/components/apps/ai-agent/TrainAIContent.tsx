import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Save, Link as LinkIcon, Building2, Megaphone, Users, RefreshCw } from 'lucide-react';
import GlassCard from './GlassCard';
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

interface TrainAIContentProps {
    sites: any[];
    onTrainingComplete: () => void;
}

export default function TrainAIContent({ sites, onTrainingComplete }: TrainAIContentProps) {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string>("");

    // Form State
    const [formData, setFormData] = useState({
        company_name: '',
        brand_voice: 'Professional yet conversational',
        target_audience: '',
        cta_details: '',
        preferred_style: 'Professional'
    });

    // Load saved brand data when site is selected
    useEffect(() => {
        if (selectedSiteId && user) {
            // In a real app we might fetch this from DB, but for now we reset or load defaults
            // Could implement local storage caching here if needed
        }
    }, [selectedSiteId]);

    const handleTrainAI = async () => {
        if (!selectedSiteId) {
            toast.error("Please select a WordPress site first");
            return;
        }

        const site = sites.find(s => s.id === selectedSiteId);
        if (!site) return;

        setIsLoading(true);
        const toastId = toast.loading("Training SCS AI on your brand...");

        try {
            // Call the SCS_Connector_Indexer webhook
            const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/scs-site-indexer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wp_url: site.site_url,
                    wp_username: site.username,
                    wp_app_password: site.app_password,
                    company_name: formData.company_name,
                    brand_voice: formData.brand_voice,
                    target_audience: formData.target_audience,
                    cta_details: formData.cta_details,
                    preferred_style: formData.preferred_style
                })
            });

            if (!response.ok) throw new Error("Training failed");

            const result = await response.json();

            toast.success("AI Training Complete!", { id: toastId });
            onTrainingComplete();
        } catch (error) {
            console.error(error);
            toast.error("Failed to train AI. Please check credentials.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 pb-24 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-purple-500/10 mb-4 border border-purple-500/20">
                    <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Train SCS AI</h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Teach the AI about your brand identity, voice, and website content.
                    This creates the "Brain" used for all future automations.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Site Connection Column */}
                <GlassCard className="p-6 space-y-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <LinkIcon className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-semibold text-white">Connect Source</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Select WordPress Site</label>
                            <select
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="">-- Choose a Site --</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.site_name || site.site_url}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSiteId && (
                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-sm text-purple-200">
                                <p>✓ Site connected</p>
                                <p>✓ Credentials ready</p>
                                <p>✓ Indexing ready</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Brand Identity Column */}
                <GlassCard className="p-6 space-y-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Building2 className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-semibold text-white">Brand Identity</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Company Name</label>
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                placeholder="e.g. Smart Content Solutions"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Brand Voice</label>
                            <input
                                type="text"
                                value={formData.brand_voice}
                                onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                                placeholder="e.g. Professional, Witty, Authoritative"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Strategic Details Full Width */}
            <GlassCard className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <Megaphone className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Strategic Context</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Target Audience</label>
                        <textarea
                            value={formData.target_audience}
                            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                            placeholder="Who aren you writing for? e.g. Small business owners looking for marketing tips"
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Call to Action (CTA)</label>
                        <textarea
                            value={formData.cta_details}
                            onChange={(e) => setFormData({ ...formData, cta_details: e.target.value })}
                            placeholder="What should they do? e.g. Book a free consultation at example.com"
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={handleTrainAI}
                    disabled={isLoading || !selectedSiteId}
                    className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-white text-lg shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center gap-3">
                        {isLoading ? (
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                            <Brain className="w-6 h-6" />
                        )}
                        <span>{isLoading ? 'Training "The Brain"...' : 'Start AI Training'}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
