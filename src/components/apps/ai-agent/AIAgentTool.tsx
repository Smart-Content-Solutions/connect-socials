import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import TrainAIContent from './TrainAIContent';
import EditorAIContent from './EditorAIContent';
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

export interface WordPressSite {
    id: string;
    site_name: string;
    site_url: string;
    username?: string;
    app_password?: string;
}

export default function AIAgentTool() {
    const [activeTab, setActiveTab] = useState<'train' | 'editor'>('train');
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { user, isLoaded } = useUser();

    useEffect(() => {
        // Load WordPress sites from localStorage or Clerk metadata
        const savedSites = localStorage.getItem('wordpress_sites');
        let localSites: WordPressSite[] = [];

        if (savedSites) {
            try {
                localSites = JSON.parse(savedSites);
            } catch (e) {
                console.error("Failed to parse sites from LS", e);
            }
        }

        // If User is loaded and has cloud data, prefer Cloud Data
        if (isLoaded && user) {
            const cloudSites = user.unsafeMetadata?.wordpress_sites as WordPressSite[] | undefined;

            if (cloudSites && Array.isArray(cloudSites)) {
                setSites(cloudSites);
                localStorage.setItem('wordpress_sites', JSON.stringify(cloudSites));
                return;
            }
        }

        // Fallback: show local data
        setSites(localSites);
    }, [user, isLoaded]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const scrollTo = activeTab === 'train' ? 0 : scrollContainerRef.current.scrollWidth / 2;
            const start = scrollContainerRef.current.scrollLeft;
            const end = scrollTo;
            const duration = 800;
            const startTime = performance.now();

            const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            const animateScroll = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeInOutCubic(progress);

                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = start + (end - start) * easedProgress;
                }

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };

            requestAnimationFrame(animateScroll);

            // Scroll page to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeTab]);

    const handleTrainingComplete = () => {
        toast.success("AI training completed successfully!");
    };

    return (
        <div className="min-h-screen pt-24 pb-20 bg-[#1A1A1C] text-[#D6D7D8] overflow-hidden relative">
            {/* Ambient glow effects */}
            <div className="fixed top-1/4 -left-32 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-1/4 -right-32 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Header with Title and Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            {activeTab === 'train' ? (
                                <Brain className="w-6 h-6 text-white" />
                            ) : (
                                <Sparkles className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#D6D7D8]">AI Agent</h1>
                            <p className="text-[#A9AAAC] text-sm">
                                {activeTab === 'train' ? 'Train your AI on your website content' : 'Enhance posts with AI-powered optimization'}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 bg-[#3B3C3E]/40 backdrop-blur-[20px] rounded-xl p-1 border border-white/5">
                        <button
                            onClick={() => setActiveTab('train')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'train'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            Train AI
                        </button>
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'editor'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Editor
                        </button>
                    </div>
                </div>

                {/* Content Area with Slide Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-2xl bg-[#3B3C3E]/20 backdrop-blur-[10px] border border-white/5 overflow-hidden"
                >
                    {/* Scrollable Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-hidden scroll-smooth"
                        style={{ scrollSnapType: 'x mandatory' }}
                    >
                        {/* Train AI Panel */}
                        <div
                            className="w-full flex-shrink-0 p-6 md:p-8"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <TrainAIContent
                                sites={sites}
                                onTrainingComplete={handleTrainingComplete}
                            />
                        </div>

                        {/* Editor Panel */}
                        <div
                            className="w-full flex-shrink-0 p-6 md:p-8"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <EditorAIContent sites={sites} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
