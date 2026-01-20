import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Link as LinkIcon, Image as ImageIcon, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportDisplayProps {
    report: {
        success: boolean;
        message: string;
        post_id: number;
        post_url: string;
        changes_made: string;
        images_placed: number;
        image_details: any[];
        seo_improvements: {
            rank_math_title: string;
            rank_math_description: string;
            rank_math_focus_keyword: string;
        };
    };
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
    if (!report) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header Status */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-100">Optimization Complete</h3>
                        <p className="text-sm text-green-300/70">{report.message}</p>
                    </div>
                </div>
                <a
                    href={report.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-colors"
                >
                    View Post <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Changes Summary */}
            <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">AI Executed Changes</span>
                </div>
                <div className="p-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                        {report.changes_made.split('\n').map((line, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{line.replace(/^- /, '')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SEO Optimization Card */}
                <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">SEO & Rank Math</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Focus Keyword</p>
                            <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-blue-200 font-mono">
                                {report.seo_improvements.rank_math_focus_keyword}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">SEO Title</p>
                            <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-300">
                                {report.seo_improvements.rank_math_title}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Meta Description</p>
                            <div className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-gray-400 italic">
                                "{report.seo_improvements.rank_math_description}"
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images & Visuals Card */}
                <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-medium text-white">Visual Intelligence</span>
                    </div>
                    <div className="p-4">
                        {report.images_placed === 0 ? (
                            <p className="text-sm text-gray-500 italic">No images were added to this post.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded text-xs font-mono">{report.images_placed}</span>
                                    <span>images placed strategically</span>
                                </div>
                                <div className="space-y-3">
                                    {report.image_details?.map((img, i) => (
                                        <div key={i} className="text-xs bg-white/5 rounded p-2 space-y-1">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Image {img.image_index + 1}</span>
                                                <span className="text-[10px] bg-white/10 px-1.5 rounded">Contextual Placement</span>
                                            </div>
                                            <p className="text-gray-300 italic">"{img.placement_reason}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
