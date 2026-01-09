// src/components/social/DashboardContent.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, Heart, MessageCircle, Facebook, Info } from "lucide-react";
import { motion } from "framer-motion";
import { getFacebookAuthData, type FacebookPage } from "@/utils/facebookOAuth";

interface DashboardContentProps {
    selectedPage: FacebookPage | null;
}

export default function DashboardContent({ selectedPage }: DashboardContentProps): JSX.Element {
    const [realPosts, setRealPosts] = useState<any[]>([]);
    const [realStats, setRealStats] = useState<any>(null);
    const [isLoadingRealData, setIsLoadingRealData] = useState(false);

    const [apiError, setApiError] = useState<string | null>(null);

    const [hasFetchedRealData, setHasFetchedRealData] = useState(false);

    // Watch for prop changes to fetch data
    useEffect(() => {
        if (selectedPage?.access_token) {
            console.log("DEBUG: Fetching real data for page:", selectedPage.name);
            fetchRealFacebookData(selectedPage);
        } else {
            setRealPosts([]);
            setRealStats(null);
            setHasFetchedRealData(false);
            if (selectedPage) {
                console.warn("DEBUG: No access_token found for selected page");
                setApiError("No Page Access Token found. Please reconnect Facebook.");
            }
        }
    }, [selectedPage]);

    const fetchRealFacebookData = async (page: FacebookPage) => {
        if (!page.access_token) return;
        setIsLoadingRealData(true);
        setApiError(null);
        setHasFetchedRealData(false); // reset before fetch

        try {
            // 1. Fetch real posts + engagement + reach (insights)
            console.log("DEBUG: Requesting feed + engagement + reach for ID:", page.id);
            // We fetch the 'post_impressions_unique' metric for each post to calculate reach
            const postsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page.id}/feed?fields=id,message,created_time,full_picture,likes.summary(total_count),comments.summary(total_count),insights.metric(post_impressions_unique)&limit=10&access_token=${page.access_token}`
            );
            const postsData = await postsRes.json();

            if (postsData.error) {
                console.error("DEBUG: FB API Posts Error:", JSON.stringify(postsData.error, null, 2));
                throw new Error(postsData.error.message);
            }

            if (postsData.data) {
                console.log("DEBUG: Found posts from API:", postsData.data.length);
                const formattedPosts = postsData.data.map((p: any) => {
                    const likeCount = p.likes?.summary?.total_count || 0;
                    const commentCount = p.comments?.summary?.total_count || 0;
                    // Get reach from post insights if available
                    const reach = p.insights?.data?.find((i: any) => i.name === 'post_impressions_unique')?.values[0]?.value || 0;

                    return {
                        platform: "Facebook",
                        content: p.message || "No text content",
                        engagement: `${likeCount} likes • ${commentCount} comments`,
                        time: new Date(p.created_time).toLocaleDateString(),
                        type: p.full_picture ? "image" : "text",
                        caption: "",
                        id: p.id,
                        image: p.full_picture || null,
                        likes: likeCount,
                        comments: commentCount,
                        reach: reach
                    };
                });
                setRealPosts(formattedPosts);
                setHasFetchedRealData(true); // Mark as successfully fetched (even if 0 items)
            }

            // 2. Fetch basic page metrics (Insights)
            const insightsRes = await fetch(
                `https://graph.facebook.com/v19.0/${page.id}/insights?metric=page_impressions_unique,page_post_engagements,page_fan_adds_unique&period=day&access_token=${page.access_token}`
            );
            const insightsData = await insightsRes.json();

            if (insightsData.error) {
                console.warn("DEBUG: Insights warning (normal for test pages):", insightsData.error.message);
                // We do NOT throw here. Just leave stats as null.
            } else if (insightsData.data) {
                console.log("DEBUG: Found insights data");
                const statsMap: any = {};
                insightsData.data.forEach((item: any) => {
                    statsMap[item.name] = item.values[0]?.value || 0;
                });
                setRealStats(statsMap);
            }
        } catch (error: any) {
            console.error("DEBUG: fetchRealFacebookData Exception:", error);
            setApiError(error.message || "Failed to fetch data from Facebook.");
        } finally {
            setIsLoadingRealData(false);
        }
    };

    if (!selectedPage) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-[#1877F2]/10 flex items-center justify-center mb-6">
                    <Facebook className="w-10 h-10 text-[#1877F2]" />
                </div>
                <h2 className="text-2xl font-bold text-[#D6D7D8] mb-2">Connect Your Facebook Page</h2>
                <p className="text-[#A9AAAC] max-w-md mx-auto mb-8">
                    Connect your account and select a page to view real-time engagement metrics and manage your content library.
                </p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#3B3C3E]/30 border border-white/5 text-xs text-[#5B5C60]">
                    <Info className="w-4 h-4 shrink-0" />
                    <p>Metrics are retrieved using <code>pages_read_engagement</code> and <code>pages_read_user_content</code> permissions.</p>
                </div>
            </div>
        );
    }

    // Calculate aggregate metrics from posts
    const totalLikes = realPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
    const totalComments = realPosts.reduce((acc, p) => acc + (p.comments || 0), 0);
    const totalReach = realPosts.reduce((acc, p) => acc + (p.reach || 0), 0);

    const stats = [
        {
            label: hasFetchedRealData ? "Post Likes (Real)" : "Page Likes",
            value: hasFetchedRealData ? totalLikes.toLocaleString() : (realStats?.page_fan_adds_unique?.toString() || "0"),
            change: hasFetchedRealData ? "Live" : "+0%",
            icon: Facebook,
            color: "text-[#1877F2]"
        },
        {
            label: hasFetchedRealData ? "Post Reach (Real)" : "Post Reach",
            value: hasFetchedRealData ? totalReach.toLocaleString() : (realStats?.page_impressions_unique?.toString() || "0"),
            change: hasFetchedRealData ? "Live" : "+0%",
            icon: Users,
            color: "text-green-500"
        },
        {
            label: hasFetchedRealData ? "Engagement (Real)" : "Engagement",
            value: hasFetchedRealData ? (totalLikes + totalComments).toLocaleString() : (realStats?.page_post_engagements?.toString() || "0"),
            change: hasFetchedRealData ? "Live" : "+0%",
            icon: Heart,
            color: "text-pink-500"
        },
        {
            label: hasFetchedRealData ? "Comments (Real)" : "Comments",
            value: hasFetchedRealData ? totalComments.toLocaleString() : "0",
            change: hasFetchedRealData ? "Live" : "+0%",
            icon: MessageCircle,
            color: "text-purple-500"
        },
    ];

    const recentPosts = hasFetchedRealData ? realPosts : [];

    return (
        <div className="text-[#D6D7D8]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-[#1A1A1C]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">
                        {selectedPage.name} Content Library
                    </h2>
                    <p className="text-[#A9AAAC] text-sm">
                        Managing Page content via pages_read_user_content
                    </p>
                </div>
            </div>

            {/* Meta Requirement: Explicitly show we are using the permission */}
            <div className="mb-6 p-4 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Reading Page Content</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            Retrieving posts, captions, and media from <b>{selectedPage.name}</b> (ID: {selectedPage.id}).
                            This workflow uses the <code>pages_read_user_content</code> permission to manage published content.
                        </p>
                    </div>
                </div>
                {isLoadingRealData && (
                    <div className="flex items-center gap-2 text-xs text-[#1877F2]">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                        <span>Fetching live data...</span>
                    </div>
                )}
            </div>

            {/* API Debug Error Display */}
            {apiError && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Real Data Notice</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            {apiError}. Showing current local state instead.
                        </p>
                    </div>
                </div>
            )}

            {/* Content Stats - simplified for content focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5 hover:border-[#E1C37A]/20 transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                    <span className={`text-sm font-semibold ${stat.change === 'Live' ? 'text-blue-400' : 'text-green-400'}`}>{stat.change}</span>
                                </div>
                                <div className="text-3xl font-bold text-[#D6D7D8] mb-1">{stat.value}</div>
                                <div className="text-sm text-[#A9AAAC]">{stat.label}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Posts - Enhanced for Content Reading */}
            <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                <CardHeader className="border-b border-white/5 p-4 flex flex-row items-center justify-between">
                    <h3 className="text-lg font-bold text-[#D6D7D8]">Page Content Library</h3>
                    <span className="text-xs px-2 py-1 rounded bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30">
                        Reading /me/feed
                    </span>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {recentPosts.length === 0 && !isLoadingRealData && (
                            <div className="text-center py-8 text-[#5B5C60] italic">
                                No posts found on this page. Create a post on Facebook to see it here!
                            </div>
                        )}
                        {isLoadingRealData && (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <TrendingUp className="w-8 h-8 text-[#1877F2] animate-bounce" />
                                <p className="text-sm text-[#A9AAAC] animate-pulse">Scanning Page feed...</p>
                            </div>
                        )}
                        {recentPosts.map((post, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-lg bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/20 transition-all cursor-pointer group"
                            >
                                {/* Media Preview Placeholder */}
                                <div className="w-16 h-16 rounded-lg bg-[#1A1A1C] flex items-center justify-center shrink-0 border border-white/5 group-hover:border-[#E1C37A]/30">
                                    {post.image ? (
                                        <img src={post.image} className="w-full h-full object-cover rounded-md" alt="Post preview" />
                                    ) : (
                                        <>
                                            {post.type === 'image' && <LayoutDashboard className="w-6 h-6 text-[#5B5C60]" />}
                                            {post.type === 'video' && <TrendingUp className="w-6 h-6 text-[#5B5C60]" />}
                                            {post.type === 'link' && <Users className="w-6 h-6 text-[#5B5C60]" />}
                                            {post.type === 'text' && <MessageCircle className="w-6 h-6 text-[#5B5C60]" />}
                                        </>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-[#E1C37A]">{post.platform}</span>
                                        <span className="text-xs text-[#5B5C60]">• {post.time}</span>
                                        <span className="text-xs text-[#5B5C60] uppercase bg-[#3B3C3E] px-1.5 py-0.5 rounded ml-auto">
                                            {post.type}
                                        </span>
                                    </div>
                                    <p className="text-[#D6D7D8] mb-1 text-sm font-medium">{post.content}</p>
                                    {post.caption && (
                                        <p className="text-[#A9AAAC] text-xs italic mb-2 line-clamp-1">"{post.caption}"</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-[#5B5C60]">
                                        <span>{post.engagement}</span>
                                        <span className="text-[#1877F2]">Read from API</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
