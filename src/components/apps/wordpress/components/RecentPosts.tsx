import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../GlassCard';
import { FileText, MessageSquare, Files, ExternalLink } from 'lucide-react';
import { WPPost } from '../utils/wpApi';
import { cn } from '@/lib/utils';

interface RecentPostsProps {
    posts: WPPost[];
    isLoading: boolean;
}

export default function RecentPosts({ posts, isLoading }: RecentPostsProps) {
    if (isLoading) {
        return (
            <GlassCard className="p-6 h-full min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-[#5B5C60]">
                    <div className="w-6 h-6 border-2 border-[#E1C37A] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Loading posts...</p>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 h-[500px] flex flex-col">
            <h3 className="text-[#D6D7D8] font-semibold text-lg mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E1C37A]" />
                Recent Posts
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-4">
                {posts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#5B5C60] min-h-[200px]">
                        <FileText className="w-10 h-10 mb-3 opacity-20" />
                        <p>No recent posts found</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group p-4 rounded-xl bg-[#1A1A1C] border border-[#333] hover:border-[#E1C37A]/30 transition-all hover:bg-[#222]"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[#D6D7D8] font-medium text-sm truncate mb-1 group-hover:text-[#E1C37A] transition-colors"
                                        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                                    />
                                    <div className="flex items-center gap-3 text-xs text-[#5B5C60]">
                                        <span>{new Date(post.date).toLocaleDateString()}</span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] uppercase font-medium",
                                            post.status === 'publish' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-500"
                                        )}>
                                            {post.status}
                                        </span>
                                    </div>
                                </div>
                                <a
                                    href={post.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-lg hover:bg-[#333] text-[#5B5C60] hover:text-[#E1C37A] transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}
