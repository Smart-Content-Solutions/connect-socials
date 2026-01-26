import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, Heart, MessageCircle, Instagram, Info, Image as ImageIcon, Video } from "lucide-react";
import { motion } from "framer-motion";
import { type InstagramAuthData } from "@/utils/instagramOAuth";

interface InstagramDashboardContentProps {
    instagramData: InstagramAuthData | null;
}

export default function InstagramDashboardContent({ instagramData }: InstagramDashboardContentProps): JSX.Element {
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [profileStats, setProfileStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (instagramData?.instagram_user_id && instagramData?.access_token) {
            fetchInstagramData();
        }
    }, [instagramData]);

    const fetchInstagramData = async () => {
        if (!instagramData?.instagram_user_id || !instagramData.access_token) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch Profile Info (explicitly using instagram_basic fields)
            const profileRes = await fetch(
                `https://graph.facebook.com/v19.0/${instagramData.instagram_user_id}?fields=username,biography,followers_count,media_count,profile_picture_url&access_token=${instagramData.access_token}`
            );
            const profileData = await profileRes.json();

            if (profileData.error) throw new Error(profileData.error.message);
            setProfileStats(profileData);

            // 2. Fetch Recent Media (Critical for Meta Loom)
            const mediaRes = await fetch(
                `https://graph.facebook.com/v19.0/${instagramData.instagram_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=8&access_token=${instagramData.access_token}`
            );
            const mediaData = await mediaRes.json();

            if (mediaData.error) throw new Error(mediaData.error.message);

            if (mediaData.data) {
                setMediaItems(mediaData.data.map((item: any) => ({
                    id: item.id,
                    type: item.media_type, // IMAGE, VIDEO, CAROUSEL_ALBUM
                    url: item.media_url,
                    thumbnail: item.thumbnail_url || item.media_url, // Videos have thumbnail_url
                    caption: item.caption || "",
                    likes: item.like_count || 0,
                    comments: item.comments_count || 0,
                    permalink: item.permalink,
                    timestamp: new Date(item.timestamp).toLocaleDateString()
                })));
            }
        } catch (err: any) {
            console.error("Instagram API Error:", err);
            setError(err.message || "Failed to load Instagram data");
        } finally {
            setIsLoading(false);
        }
    };

    if (!instagramData) return null;

    if (error) {
        return (
            <div className="text-[#D6D7D8] mt-12 pt-8 border-t border-white/5">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h3 className="text-red-400 font-bold mb-2">Instagram Data Load Error</h3>
                    <p className="text-red-300 text-sm mb-4">{error}</p>
                    <details className="text-xs text-red-300/50">
                        <summary>Debug Info</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify({
                            id: instagramData.instagram_user_id,
                            hasToken: !!instagramData.access_token
                        }, null, 2)}</pre>
                    </details>
                    <button
                        onClick={fetchInstagramData}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs transition-colors"
                    >
                        Retry Fetch
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-[#D6D7D8] mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">
                        @{profileStats?.username || instagramData.username || "Instagram User"}
                    </h2>
                    <p className="text-[#A9AAAC] text-sm">
                        Instagram Professional Dashboard
                    </p>
                </div>
            </div>

            {/* Meta Requirement: Explicit Permission Notice */}
            <div className="mb-6 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Using instagram_basic Permission</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            Reading profile info and media from <b>@{profileStats?.username || instagramData.username}</b>.
                            This confirms the app is actively using the requested permissions to display user data.
                        </p>
                    </div>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-pink-500">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                        <span>Loading media...</span>
                    </div>
                )}
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <Users className="w-8 h-8 text-pink-500" />
                        <div>
                            <div className="text-2xl font-bold text-[#D6D7D8]">
                                {profileStats?.followers_count?.toLocaleString() || instagramData.followers?.toLocaleString() || "-"}
                            </div>
                            <div className="text-sm text-[#A9AAAC]">Followers</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <ImageIcon className="w-8 h-8 text-purple-500" />
                        <div>
                            <div className="text-2xl font-bold text-[#D6D7D8]">
                                {profileStats?.media_count?.toLocaleString() || instagramData.mediaCount?.toLocaleString() || "-"}
                            </div>
                            <div className="text-sm text-[#A9AAAC]">Total Posts</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <Heart className="w-8 h-8 text-red-500" />
                        <div>
                            <div className="text-sm font-medium text-[#D6D7D8]">Live Data</div>
                            <div className="text-xs text-[#A9AAAC]">Connected</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Media Grid (CRITICAL FOR LOOM) */}
            <div>
                <h3 className="text-lg font-bold text-[#D6D7D8] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#E1C37A]" />
                    Recent Media
                </h3>

                {mediaItems.length === 0 && !isLoading ? (
                    <div className="text-center py-12 bg-[#3B3C3E]/20 rounded-xl border border-white/5 text-[#5B5C60]">
                        No media found or waiting for connection...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mediaItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/50 transition-all cursor-pointer"
                                onClick={() => window.open(item.permalink, '_blank')}
                            >
                                <img
                                    src={item.thumbnail || item.url}
                                    alt={item.caption}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-white text-xs line-clamp-2 mb-2">{item.caption}</p>
                                    <div className="flex items-center justify-between text-[10px] text-gray-300">
                                        <span className="flex items-center gap-1">
                                            <Heart className="w-3 h-3 fill-current" /> {item.likes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3 fill-current" /> {item.comments}
                                        </span>
                                    </div>
                                </div>
                                {item.type === 'VIDEO' && (
                                    <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-md">
                                        <Video className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
