import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutDashboard, Send } from 'lucide-react';
import CreatePostContent from './CreatePostContent';
import DashboardContent from './DashboardContent';
import AnimatedBackground from './AnimatedBackground';
import { WordPressSite } from './WordPressSiteCard';
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

export default function WordPressTool() {
    const [activeTab, setActiveTab] = useState<'create' | 'dashboard'>('dashboard');
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const { user, isLoaded } = useUser();

    useEffect(() => {
        // 1. Load from localStorage first (for immediate instant load)
        const savedSites = localStorage.getItem('wordpress_sites');
        let localSites: WordPressSite[] = [];
        let hasMigration = false;

        if (savedSites) {
            try {
                localSites = JSON.parse(savedSites);
            } catch (e) {
                console.error("Failed to parse sites from LS", e);
            }
        }

        // Migration for old single-site storage
        const oldUrl = localStorage.getItem('wp_url');
        const oldUser = localStorage.getItem('wp_username');
        const oldPass = localStorage.getItem('wp_app_password');

        if (oldUrl && oldUser && oldPass) {
            const exists = localSites.find(s => s.site_url === oldUrl && s.username === oldUser);
            if (!exists) {
                const newSite: WordPressSite = {
                    id: Date.now().toString(),
                    site_name: new URL(oldUrl).hostname,
                    site_url: oldUrl,
                    username: oldUser,
                    app_password: oldPass
                };
                localSites.push(newSite);
                hasMigration = true;
            }
        }

        // 2. If User is loaded and has cloud data, Prefer Cloud Data
        if (isLoaded && user) {
            const cloudSites = user.unsafeMetadata?.wordpress_sites as WordPressSite[] | undefined;

            if (cloudSites && Array.isArray(cloudSites)) {
                // Cloud has data - Use it (Source of Truth)
                setSites(cloudSites);
                // Sync Cloud -> Local (so it's ready next time)
                localStorage.setItem('wordpress_sites', JSON.stringify(cloudSites));
                return;
            } else if (localSites.length > 0) {
                // Cloud is empty, but Local has data -> Sync Local -> Cloud
                user.update({
                    unsafeMetadata: {
                        ...user.unsafeMetadata,
                        wordpress_sites: localSites
                    }
                }).catch(err => console.error("Auto-sync to cloud failed", err));
            }
        }

        // Fallback: If no user or no cloud data yet, show local data
        setSites(localSites);

        if (hasMigration) {
            localStorage.setItem('wordpress_sites', JSON.stringify(localSites));
        }
    }, [user, isLoaded]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const scrollTo = activeTab === 'dashboard' ? 0 : scrollContainerRef.current.scrollWidth / 2;
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

    const saveSites = async (newSites: WordPressSite[]) => {
        // 1. Update State & Local Storage (Instant UI update)
        setSites(newSites);
        localStorage.setItem('wordpress_sites', JSON.stringify(newSites));

        // 2. Sync to Cloud (Clerk User Metadata)
        if (user) {
            try {
                await user.update({
                    unsafeMetadata: {
                        ...user.unsafeMetadata,
                        wordpress_sites: newSites
                    }
                });
                console.log("Synced sites to cloud account");
            } catch (err) {
                console.error("Failed to sync sites to cloud", err);
                toast.error("Saved locally, but failed to sync to your account. Check connection.");
            }
        }

        // Also sync the first site to the old keys for backward compatibility
        if (newSites.length > 0) {
            localStorage.setItem('wp_url', newSites[0].site_url);
            localStorage.setItem('wp_username', newSites[0].username || '');
            localStorage.setItem('wp_app_password', newSites[0].app_password || '');
        } else {
            localStorage.removeItem('wp_url');
            localStorage.removeItem('wp_username');
            localStorage.removeItem('wp_app_password');
        }
    };

    const handleAddSite = (siteData: Omit<WordPressSite, 'id'>) => {
        const newSite: WordPressSite = {
            ...siteData,
            id: Date.now().toString()
        };
        saveSites([...sites, newSite]);
        toast.success("WordPress site connected successfully!");
    };

    const handleDisconnect = (id: string) => {
        const newSites = sites.filter(s => s.id !== id);
        saveSites(newSites);
        toast.success("WordPress site disconnected.");
    };

    return (
        <div className="min-h-screen pt-24 pb-20 bg-[#1A1A1C] text-[#D6D7D8] overflow-hidden relative">
            {/* Ambient glow effects */}
            <div className="fixed top-1/4 -left-32 w-[500px] h-[500px] bg-[#E1C37A]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#B6934C]/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Header with Title and Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                            {activeTab === 'dashboard' ? (
                                <LayoutDashboard className="w-6 h-6 text-[#1A1A1C]" />
                            ) : (
                                <Send className="w-6 h-6 text-[#1A1A1C]" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#D6D7D8]">WordPress Automation</h1>
                            <p className="text-[#A9AAAC] text-sm">
                                {activeTab === 'dashboard' ? 'Manage your WordPress sites' : 'Create and publish SEO content'}
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1 bg-[#3B3C3E]/40 backdrop-blur-[20px] rounded-xl p-1 border border-white/5">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'dashboard'
                                ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                                : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'create'
                                ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                                : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Create Post
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
                        {/* Dashboard Panel */}
                        <div
                            className="w-full flex-shrink-0 p-6 md:p-8"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <DashboardContent
                                sites={sites}
                                onAddSite={handleAddSite}
                                onRemoveSite={handleDisconnect}
                            />
                        </div>

                        {/* Create Post Panel */}
                        <div
                            className="w-full flex-shrink-0 p-6 md:p-8"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <CreatePostContent sites={sites} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

