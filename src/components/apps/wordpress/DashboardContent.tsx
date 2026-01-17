import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Globe, AlertCircle, RefreshCcw, BrainCircuit } from 'lucide-react';
import WordPressSiteCard, { WordPressSite } from './WordPressSiteCard';
import StatsOverview from './components/StatsOverview';
import PerformanceChart from './components/PerformanceChart';
import RecentPosts from './components/RecentPosts';
import { SiteStats, fetchSiteStats } from './utils/wpApi';
import GoldButton from './GoldButton';
import { toast } from "sonner";
import { AISiteIndexer } from '../../../planner_section/components/AISiteIndexer';

interface DashboardContentProps {
    sites: WordPressSite[];
    onAddSite: (siteData: Omit<WordPressSite, 'id'>) => void;
    onRemoveSite: (id: string) => void;
}

export default function DashboardContent({ sites, onAddSite, onRemoveSite }: DashboardContentProps) {
    // ... (rest of the state and logic stays same) ...
    const [stats, setStats] = useState<SiteStats>({
        totalPosts: 0,
        totalComments: 0,
        totalPages: 0,
        recentPosts: [],
        postsByDate: {}
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

    const refreshStats = async () => {
        setIsLoading(true);
        if (sites.length === 0) {
            setIsLoading(false);
            return;
        }

        const targetSites = selectedSiteId === 'all' ? sites : sites.filter(s => s.id === selectedSiteId);

        let aggStats: SiteStats = {
            totalPosts: 0,
            totalComments: 0,
            totalPages: 0,
            recentPosts: [],
            postsByDate: {}
        };

        try {
            const results = await Promise.all(targetSites.map(s => fetchSiteStats(s)));

            results.forEach(res => {
                aggStats.totalPosts += res.totalPosts;
                aggStats.totalComments += res.totalComments;
                aggStats.totalPages += res.totalPages;
                aggStats.recentPosts = [...aggStats.recentPosts, ...res.recentPosts];

                Object.entries(res.postsByDate).forEach(([date, count]) => {
                    aggStats.postsByDate[date] = (aggStats.postsByDate[date] || 0) + count;
                });
            });

            aggStats.recentPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            aggStats.recentPosts = aggStats.recentPosts.slice(0, 10);

            setStats(aggStats);
        } catch (e) {
            console.error("Failed to fetch stats", e);
            toast.error("Failed to refresh stats. Please check site connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshStats();
    }, [sites, selectedSiteId]);

    return (
        <div className="space-y-12">
            {/* Stats Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                            <LayoutDashboard className="w-6 h-6 text-[#1A1A1C]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#D6D7D8]">Dashboard</h2>
                            <p className="text-[#A9AAAC] text-sm">Manage your WordPress sites & SEO</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {sites.length > 0 && (
                            <select
                                value={selectedSiteId}
                                onChange={(e) => setSelectedSiteId(e.target.value)}
                                className="bg-[#1A1A1C] border border-[#333] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E1C37A]"
                            >
                                <option value="all">All Sites</option>
                                {sites.map(s => (
                                    <option key={s.id} value={s.id}>{s.site_name}</option>
                                ))}
                            </select>
                        )}
                        <GoldButton onClick={refreshStats} disabled={isLoading} className="px-4 py-2 h-10">
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </GoldButton>
                    </div>
                </div>

                {sites.length === 0 ? (
                    <div className="mb-10 text-center p-10 bg-[#3B3C3E]/20 rounded-2xl border border-white/5 mx-auto max-w-2xl">
                        <AlertCircle className="w-12 h-12 text-[#E1C37A] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[#D6D7D8]">No Sites Connected</h3>
                        <p className="text-[#A9AAAC] mt-2">Connect a WordPress site below to see real-time analytics.</p>
                    </div>
                ) : (
                    <>
                        <StatsOverview stats={stats} isLoading={isLoading} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PerformanceChart stats={stats} isLoading={isLoading} />
                            <RecentPosts posts={stats.recentPosts} isLoading={isLoading} />
                        </div>
                    </>
                )}
            </div>

            {/* AI Agent Integration Segment */}
            {sites.length > 0 && (
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-transparent blur opacity-25 rounded-2xl" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <BrainCircuit className="w-6 h-6 text-gold" />
                            <h3 className="text-xl font-bold text-foreground">AI Site Intelligence</h3>
                        </div>
                        <AISiteIndexer />
                    </div>
                </div>
            )}

            {/* Site Connection Section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="w-5 h-5 text-[#E1C37A]" />
                    <h3 className="text-lg font-semibold text-[#D6D7D8]">Connected Properties</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#E1C37A]/10 text-[#E1C37A] text-sm">
                        {sites.length} Active
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sites.map((site) => (
                        <WordPressSiteCard
                            key={site.id}
                            site={site}
                            onDisconnect={onRemoveSite}
                        />
                    ))}
                    <WordPressSiteCard isNew onAdd={onAddSite} />
                </div>
            </div>
        </div>
    );
}
