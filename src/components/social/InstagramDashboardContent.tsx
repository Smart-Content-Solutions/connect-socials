// src/components/social/InstagramDashboardContent.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, Heart, MessageCircle, Instagram, Info } from "lucide-react";
import { motion } from "framer-motion";
import { getInstagramAuthData, type InstagramAuthData } from "@/utils/instagramOAuth";

export default function InstagramDashboardContent(): JSX.Element | null {
    const [authData, setAuthData] = useState<InstagramAuthData | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stored = getInstagramAuthData();
        if (stored) {
            setAuthData(stored);
            const selectedId = localStorage.getItem("instagram_selected_id");
            if (stored.access_token && selectedId) {
                fetchInstagramData(stored.access_token, selectedId);
            }
        }
    }, []);

    const fetchInstagramData = async (token: string, igUserId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // META REQUIREMENT: Show we are reading profile + media
            // Fetch Profile fields (username, profile_picture) + Media
            const res = await fetch(
                `https://graph.facebook.com/v19.0/${igUserId}?fields=username,name,profile_picture_url,media_count,followers_count,media{id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count}&access_token=${token}`
            );
            const data = await res.json();

            if (data.error) throw new Error(data.error.message);

            // Update Auth Data specific params if new ones came in
            if (data.username || data.profile_picture_url) {
                // Update local display only, or persist if desired
            }

            if (data.media && data.media.data) {
                setPosts(data.media.data);
            }
        } catch (err: any) {
            console.error("IG Fetch Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!authData) return null;

    return (
        <div className="text-[#D6D7D8]">
            {/* HEADER: Profile Display (Requirement #3) */}
            <div className="flex items-center gap-6 mb-8 p-6 bg-pink-900/10 border border-pink-500/20 rounded-2xl">
                <div className="relative">
                    <img
                        src={authData.profilePicture || authData.picture || "https://github.com/shadcn.png"}
                        alt="Profile"
                        className="w-20 h-20 rounded-full border-2 border-pink-500 shadow-lg object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-pink-600 rounded-full p-1.5 border-4 border-[#1A1A1C]">
                        <Instagram className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">
                        @{authData.username || "username"}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-[#A9AAAC]">
                        <span className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-1 rounded-md text-pink-400 border border-pink-500/20">
                            <Users className="w-3.5 h-3.5" />
                            {authData.followers || 0} Followers
                        </span>
                        <span className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-1 rounded-md text-pink-400 border border-pink-500/20">
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            {authData.mediaCount || 0} Posts
                        </span>
                    </div>
                    <p className="text-xs text-[#5B5C60] mt-2">
                        IG ID: {authData.instagram_user_id} • Connected via instagram_basic
                    </p>
                </div>
            </div>

            {/* Permission Notice */}
            <div className="mb-6 p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Reading Instagram Media</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            Retrieving recent media objects to display in dashboard.
                            This uses the <code>instagram_basic</code> permission.
                        </p>
                    </div>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-pink-500">
                        <TrendingUp className="w-4 h-4 animate-pulse" />
                        <span>Fetching media...</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    Error loading media: {error}
                </div>
            )}

            {/* MEDIA GRID (Requirement #4) */}
            <h3 className="text-xl font-bold text-[#D6D7D8] mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-pink-500" />
                Recent Instagram Media
            </h3>

            {posts.length === 0 && !isLoading ? (
                <div className="text-center py-12 bg-[#2C2C2E] rounded-xl border border-dashed border-white/10">
                    <p className="text-[#5B5C60] italic">No posts found or unable to load media.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="bg-[#2C2C2E] border-white/5 overflow-hidden hover:border-pink-500/30 transition-all group">
                                <div className="aspect-square bg-gray-900 relative">
                                    <img
                                        src={post.thumbnail_url || post.media_url}
                                        alt={post.caption}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white uppercase font-bold backdrop-blur-sm">
                                        {post.media_type}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-[#D6D7D8] line-clamp-2 mb-3 min-h-[40px]">
                                        {post.caption || "No caption"}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-[#A9AAAC]">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-3 h-3" /> {post.like_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3" /> {post.comments_count || 0}
                                            </span>
                                        </div>
                                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
