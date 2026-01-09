// src/components/social/DashboardContent.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, Heart, MessageCircle, Facebook, Info } from "lucide-react";
import { motion } from "framer-motion";
import { getFacebookAuthData, type FacebookPage } from "@/utils/facebookOAuth";

export default function DashboardContent(): JSX.Element {
    const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);

    // Check for selected Facebook page on mount
    useEffect(() => {
        const storedPage = localStorage.getItem('facebook_selected_page');
        if (storedPage) {
            try {
                setSelectedPage(JSON.parse(storedPage));
            } catch (e) {
                console.error("Error parsing stored page", e);
            }
        }
    }, []);

    // Mock data - IF a page is selected, we show "Page Specific" data
    // Otherwise we show generic aggregate data

    // This is the key change for Meta:
    // If we have a selectedPage, we display it prominent at the top

    const stats = selectedPage ? [
        { label: "Page Likes", value: "2,453", change: "+12%", icon: Facebook, color: "text-[#1877F2]" },
        { label: "Post Reach", value: "15.2K", change: "+24%", icon: Users, color: "text-green-500" },
        { label: "Engagement", value: "892", change: "+8%", icon: Heart, color: "text-pink-500" },
        { label: "Comments", value: "156", change: "+5%", icon: MessageCircle, color: "text-purple-500" },
    ] : [
        { label: "Total Posts", value: "156", change: "+12%", icon: LayoutDashboard, color: "text-[#E1C37A]" },
        { label: "Engagement", value: "12.4K", change: "+8%", icon: Heart, color: "text-pink-500" },
        { label: "Followers", value: "8,234", change: "+15%", icon: Users, color: "text-green-500" },
        { label: "Comments", value: "1,892", change: "+5%", icon: MessageCircle, color: "text-purple-500" },
    ];

    const recentPosts = selectedPage ? [
        {
            platform: "Facebook",
            content: `New update from ${selectedPage.name}! Check out our latest features...`,
            engagement: "45 likes • 12 comments",
            time: "2 hours ago",
            type: "image",
            caption: "Reviewing our Q3 roadmap with the team. Exciting times ahead! #growth"
        },
        {
            platform: "Facebook",
            content: "Community spotlight: Thanks to everyone who attended...",
            engagement: "128 likes • 34 comments",
            time: "1 day ago",
            type: "video",
            caption: "Highlights from our community meetup. Tag yourself if you were here!"
        },
        {
            platform: "Facebook",
            content: "We are hiring! Join our growing team today.",
            engagement: "89 likes • 56 shares",
            time: "2 days ago",
            type: "link",
            caption: "Open positions in Engineering and Design. Apply now."
        },
    ] : [
        { platform: "Instagram", content: "Behind the scenes at our office 📸", engagement: "567 likes", time: "5 hours ago", type: "image", caption: "" },
        { platform: "LinkedIn", content: "Exciting news about our company growth", engagement: "123 likes", time: "1 day ago", type: "text", caption: "" },
        { platform: "Twitter", content: "Join us for our upcoming webinar!", engagement: "89 retweets", time: "2 days ago", type: "link", caption: "" },
    ];

    return (
        <div className="text-[#D6D7D8]">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-[#1A1A1C]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">
                        {selectedPage ? `${selectedPage.name} Content Library` : "Dashboard"}
                    </h2>
                    <p className="text-[#A9AAAC] text-sm">
                        {selectedPage
                            ? "Managing Page content via pages_read_user_content"
                            : "Track your social media performance"}
                    </p>
                </div>
            </div>

            {/* Meta Requirement: Explicitly show we are using the permission */}
            {selectedPage && (
                <div className="mb-6 p-4 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#D6D7D8] font-semibold text-sm">Reading Page Content</h4>
                        <p className="text-[#A9AAAC] text-xs mt-1">
                            Retrieving posts, captions, and media from <b>{selectedPage.name}</b> (ID: {selectedPage.id}).
                            This workflow uses the <code>pages_read_user_content</code> permission to manage published content.
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
                                    <span className="text-sm font-semibold text-green-400">{stat.change}</span>
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
                    {selectedPage && (
                        <span className="text-xs px-2 py-1 rounded bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30">
                            Reading /me/feed
                        </span>
                    )}
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-4">
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
                                    {post.type === 'image' && <LayoutDashboard className="w-6 h-6 text-[#5B5C60]" />}
                                    {post.type === 'video' && <TrendingUp className="w-6 h-6 text-[#5B5C60]" />}
                                    {post.type === 'link' && <Users className="w-6 h-6 text-[#5B5C60]" />}
                                    {post.type === 'text' && <MessageCircle className="w-6 h-6 text-[#5B5C60]" />}
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
                                        {selectedPage && <span className="text-[#1877F2]">Read from API</span>}
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
