import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Heart, MessageCircle, Instagram, Info, Image as ImageIcon, Video, RefreshCw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { type InstagramAuthData } from "@/utils/instagramOAuth";

interface InstagramDashboardContentProps {
    instagramData: InstagramAuthData | null;
}

export default function InstagramDashboardContent({ instagramData }: InstagramDashboardContentProps): JSX.Element | null {
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [profileStats, setProfileStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    // Attempt to fetch fresh data from API (optional - stored data is primary)
    const fetchInstagramData = async () => {
        if (!instagramData?.instagram_user_id || !instagramData.access_token) return;
        setIsLoading(true);
        setApiError(null);

        try {
            // 1. Fetch Profile Info (explicitly using instagram_basic fields)
            const profileRes = await fetch(
                `https://graph.facebook.com/v19.0/${instagramData.instagram_user_id}?fields=username,biography,followers_count,media_count,profile_picture_url&access_token=${instagramData.access_token}`
            );
            const profileData = await profileRes.json();

            if (profileData.error) {
                console.warn("Instagram Profile API Error:", profileData.error.message);
                setApiError(profileData.error.message);
            } else {
                setProfileStats(profileData);
            }

            // 2. Fetch Recent Media (Critical for Meta Loom)
            const mediaRes = await fetch(
                `https://graph.facebook.com/v19.0/${instagramData.instagram_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=8&access_token=${instagramData.access_token}`
            );
            const mediaData = await mediaRes.json();

            if (mediaData.error) {
                console.warn("Instagram Media API Error:", mediaData.error.message);
            } else if (mediaData.data) {
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

            setLastRefreshed(new Date());
        } catch (err: any) {
            console.error("Instagram API Error:", err);
            setApiError(err.message || "Failed to load Instagram data");
        } finally {
            setIsLoading(false);
        }
    };

    // Try to fetch on mount, but don't block UI if it fails
    useEffect(() => {
        if (instagramData?.instagram_user_id && instagramData?.access_token) {
            fetchInstagramData();
        }
    }, [instagramData?.instagram_user_id]);

    if (!instagramData) return null;

    // Use stored data as primary source, API data as override
    const displayUsername = profileStats?.username || instagramData.username;
    const displayFollowers = profileStats?.followers_count ?? instagramData.followers;
    const displayMediaCount = profileStats?.media_count ?? instagramData.mediaCount;
    const displayProfilePicture = profileStats?.profile_picture_url || instagramData.profilePicture || instagramData.picture;

    return (
        <div className="text-[#D6D7D8] mt-12 pt-8 border-t border-white/5">
            {/* Header with profile */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-[2px] flex items-center justify-center">
                        <div className="w-full h-full rounded-xl bg-[#2C2C2E] flex items-center justify-center overflow-hidden">
                            {displayProfilePicture ? (
                                <img
                                    src={displayProfilePicture}
                                    alt={displayUsername || "Instagram"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Instagram className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#D6D7D8]">
                            @{displayUsername || "Instagram User"}
                        </h2>
                        <p className="text-[#A9AAAC] text-sm">
                            Instagram Professional Dashboard
                        </p>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={fetchInstagramData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B3C3E]/50 border border-white/10 text-[#A9AAAC] hover:text-[#D6D7D8] hover:border-pink-500/30 transition-all text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Meta Requirement: Explicit Permission Notice */}
            <div className="mb-6 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Using instagram_basic Permission</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            Reading profile info and media from <b>@{displayUsername || "connected account"}</b>.
                            This confirms the app is actively using the requested permissions to display user data.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                    {isLoading ? (
                        <span className="flex items-center gap-1 text-pink-500">
                            <TrendingUp className="w-4 h-4 animate-pulse" />
                            Loading...
                        </span>
                    ) : lastRefreshed ? (
                        <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            Live
                        </span>
                    ) : (
                        <span className="text-[#5B5C60]">Cached data</span>
                    )}
                </div>
            </div>

            {/* API Error Notice (non-blocking) */}
            {apiError && !isLoading && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                    <strong>Note:</strong> Could not refresh live data ({apiError}). Showing stored data from connection.
                </div>
            )}

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                    <CardContent className="p-6 flex items-center gap-4">
                        <Users className="w-8 h-8 text-pink-500" />
                        <div>
                            <div className="text-2xl font-bold text-[#D6D7D8]">
                                {displayFollowers != null ? displayFollowers.toLocaleString() : "-"}
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
                                {displayMediaCount != null ? displayMediaCount.toLocaleString() : "-"}
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
                            <div className="text-xs text-[#A9AAAC]">
                                {lastRefreshed ? 'Connected & Synced' : 'Connected'}
                            </div>
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
                        <p className="mb-2">No media found or waiting for connection...</p>
                        <p className="text-xs">Media will appear here once the API permissions are fully approved.</p>
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
