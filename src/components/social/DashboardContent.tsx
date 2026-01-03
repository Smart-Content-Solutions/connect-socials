// src/components/social/DashboardContent.tsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardContent(): JSX.Element {
    // Mock data for demonstration
    const stats = [
        { label: "Total Posts", value: "156", change: "+12%", icon: LayoutDashboard, color: "text-blue-600" },
        { label: "Engagement", value: "12.4K", change: "+8%", icon: Heart, color: "text-pink-600" },
        { label: "Followers", value: "8,234", change: "+15%", icon: Users, color: "text-green-600" },
        { label: "Comments", value: "1,892", change: "+5%", icon: MessageCircle, color: "text-purple-600" },
    ];

    const recentPosts = [
        { platform: "Facebook", content: "Check out our latest product launch!", engagement: "234 likes", time: "2 hours ago" },
        { platform: "Instagram", content: "Behind the scenes at our office 📸", engagement: "567 likes", time: "5 hours ago" },
        { platform: "LinkedIn", content: "Exciting news about our company growth", engagement: "123 likes", time: "1 day ago" },
        { platform: "Twitter", content: "Join us for our upcoming webinar!", engagement: "89 retweets", time: "2 days ago" },
    ];

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600 text-sm">Track your performance</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                    <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Performance Chart */}
            <Card className="mb-6">
                <CardHeader className="border-b p-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-bold">Performance Overview</h3>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
                        <div className="text-center">
                            <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                            <p className="text-gray-600">Performance chart will be displayed here</p>
                            <p className="text-sm text-gray-500 mt-2">Connect your analytics to see detailed insights</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
                <CardHeader className="border-b p-4">
                    <h3 className="text-lg font-bold">Recent Posts</h3>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {recentPosts.map((post, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-blue-600">{post.platform}</span>
                                        <span className="text-xs text-gray-500">{post.time}</span>
                                    </div>
                                    <p className="text-gray-800 mb-2">{post.content}</p>
                                    <p className="text-sm text-gray-600">{post.engagement}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
