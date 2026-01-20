import React, { useState, useEffect } from 'react';
import { Search, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

interface Post {
    id: number;
    title: { rendered: string };
    date: string;
    status: string;
    link: string;
}

interface PostSelectorProps {
    site: any;
    onSelect: (postId: number) => void;
    selectedPostId: number | null;
}

export default function PostSelector({ site, onSelect, selectedPostId }: PostSelectorProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (site) {
            fetchPosts();
        } else {
            setPosts([]);
        }
    }, [site]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const auth = btoa(`${site.username}:${site.app_password}`);
            const response = await fetch(`${site.site_url}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,date,status,link`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch posts");
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            console.error(error);
            toast.error("Could not fetch posts. Check connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.rendered.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedPost = posts.find(p => p.id === selectedPostId);

    return (
        <div className="relative space-y-2">
            <label className="text-sm font-medium text-gray-300">Target Post</label>

            <div className="relative">
                <div
                    onClick={() => !site ? toast.error("Select a site first") : setIsOpen(!isOpen)}
                    className={cn(
                        "w-full bg-black/40 border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all",
                        isOpen ? "border-purple-500/50 ring-2 ring-purple-500/20" : "border-white/10 hover:border-white/20",
                        !site && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className={cn("truncate", !selectedPost && "text-gray-500")}>
                            {selectedPost ?
                                <span dangerouslySetInnerHTML={{ __html: selectedPost.title.rendered }} /> :
                                "Select a post to edit..."
                            }
                        </span>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-50 w-full mt-2 bg-[#1A1B1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        >
                            <div className="p-3 border-b border-white/5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search posts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/30 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {isLoading ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">Loading posts...</div>
                                ) : filteredPosts.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">No posts found</div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {filteredPosts.map(post => (
                                            <button
                                                key={post.id}
                                                onClick={() => {
                                                    onSelect(post.id);
                                                    setIsOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                                                    selectedPostId === post.id
                                                        ? "bg-purple-500/20 text-purple-200"
                                                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <span className="truncate pr-4" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                                {selectedPostId === post.id && <Check className="w-4 h-4 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Backdrop to close */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
