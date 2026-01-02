import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import GoldButton from './GoldButton';
import { Check, Globe, Trash2, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface WordPressSite {
    id: string;
    site_name: string;
    site_url: string;
    username?: string;
    app_password?: string;
}

import { createPortal } from 'react-dom';

const GuideSidebar = ({ onClose }: { onClose: () => void }) => {
    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute right-0 top-0 h-full w-full max-w-md bg-[#1A1A1C] border-l border-[#333] shadow-2xl pointer-events-auto overflow-y-auto"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#E1C37A]/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-[#E1C37A]" />
                            </div>
                            <h2 className="text-lg font-bold text-[#D6D7D8]">Connection Guide</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[#333] text-[#5B5C60] hover:text-[#D6D7D8] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[#E1C37A] font-semibold mb-3">How to Connect Your WordPress Site</h3>
                            <p className="text-sm text-[#D6D7D8] mb-3">To enable WordPress automation inside SCS, you must provide:</p>
                            <ul className="space-y-2 text-sm text-[#A9AAAC] list-disc pl-4">
                                <li>Your WordPress site URL</li>
                                <li>Your WordPress username</li>
                                <li>A WordPress App Password</li>
                            </ul>
                            <p className="text-xs text-[#5B5C60] mt-3 italic">Use the guide below to generate your App Password.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative pl-6 border-l border-[#333]">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#E1C37A]" />
                                <h4 className="text-sm font-semibold text-[#D6D7D8] mb-2">Step 1 - Log into Your WordPress Admin</h4>
                                <div className="bg-[#222] rounded-lg p-3 text-sm text-[#A9AAAC] space-y-2">
                                    <p>Open your browser and go to:</p>
                                    <code className="block bg-[#111] p-2 rounded text-[#E1C37A]">yourwebsite.com/wp-admin</code>
                                    <p>Log in using your normal WordPress username and password.</p>
                                </div>
                            </div>

                            <div className="relative pl-6 border-l border-[#333]">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#333] border border-[#555]" />
                                <h4 className="text-sm font-semibold text-[#D6D7D8] mb-2">Step 2 - Open Your Profile</h4>
                                <p className="text-sm text-[#A9AAAC] mb-2">Inside the WordPress dashboard:</p>
                                <ul className="space-y-1 text-sm text-[#A9AAAC] list-disc pl-4">
                                    <li>In the left menu, click <strong className="text-white">Users</strong></li>
                                    <li>Then click <strong className="text-white">Profile</strong> (or Your Profile)</li>
                                </ul>
                            </div>

                            <div className="relative pl-6 border-l border-[#333]">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#333] border border-[#555]" />
                                <h4 className="text-sm font-semibold text-[#D6D7D8] mb-2">Step 3 - Generate an App Password</h4>
                                <div className="space-y-3 text-sm text-[#A9AAAC]">
                                    <p>Scroll down to the <strong>Application Passwords</strong> section.</p>
                                    <p>In the New Application Password Name field, type:</p>
                                    <code className="block bg-[#111] p-2 rounded text-[#E1C37A]">Smart Content Solutions</code>
                                    <p>Click <strong>Add New Application Password</strong>.</p>
                                    <div className="bg-[#E1C37A]/10 border border-[#E1C37A]/20 p-3 rounded-lg text-[#E1C37A]">
                                        <p className="font-medium mb-1">Important:</p>
                                        <p className="opacity-80">WordPress will show the password only once. Copy it immediately.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative pl-6 border-l border-transparent">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#333] border border-[#555]" />
                                <h4 className="text-sm font-semibold text-[#D6D7D8] mb-2">Step 4 - Enter Details in SCS</h4>
                                <p className="text-sm text-[#A9AAAC]">
                                    Return here and paste your <strong>Site URL</strong>, <strong>Username</strong>, and the <strong>App Password</strong> you just copied.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

interface WordPressSiteCardProps {
    site?: WordPressSite;
    onDisconnect?: (id: string) => void;
    isNew?: boolean;
    onAdd?: (site: Omit<WordPressSite, 'id'>) => void;
}

export default function WordPressSiteCard({ site, onDisconnect, isNew = false, onAdd }: WordPressSiteCardProps) {
    const [siteName, setSiteName] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const [username, setUsername] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [showGuide, setShowGuide] = useState(false);

    if (isNew) {
        return (
            <GlassCard className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#E1C37A]/10"
                    >
                        <Globe className="w-6 h-6 text-[#E1C37A]" />
                    </div>
                </div>

                <h3 className="text-[#D6D7D8] font-semibold text-lg mb-4">Add WordPress Site</h3>

                <div className="space-y-3 mb-4">
                    <Input
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="Site name"
                        className="bg-[#3B3C3E]/30 border-white/10 text-[#D6D7D8] placeholder:text-[#5B5C60] rounded-lg focus-visible:ring-[#E1C37A]"
                    />
                    <Input
                        value={siteUrl}
                        onChange={(e) => setSiteUrl(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="bg-[#3B3C3E]/30 border-white/10 text-[#D6D7D8] placeholder:text-[#5B5C60] rounded-lg focus-visible:ring-[#E1C37A]"
                    />
                    <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="bg-[#3B3C3E]/30 border-white/10 text-[#D6D7D8] placeholder:text-[#5B5C60] rounded-lg focus-visible:ring-[#E1C37A]"
                    />
                    <Input
                        type="password"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        placeholder="App Password"
                        className="bg-[#3B3C3E]/30 border-white/10 text-[#D6D7D8] placeholder:text-[#5B5C60] rounded-lg focus-visible:ring-[#E1C37A]"
                        onFocus={() => setShowGuide(true)}
                    />
                </div>

                <AnimatePresence>
                    {showGuide && <GuideSidebar onClose={() => setShowGuide(false)} />}
                </AnimatePresence>

                <GoldButton
                    onClick={() => {
                        if (siteUrl.trim() && siteName.trim() && username.trim() && appPassword.trim()) {
                            onAdd?.({ site_name: siteName, site_url: siteUrl, username, app_password: appPassword });
                            setSiteName('');
                            setSiteUrl('');
                            setUsername('');
                            setAppPassword('');
                        }
                    }}
                    disabled={!siteUrl.trim() || !siteName.trim() || !username.trim() || !appPassword.trim()}
                    className="w-full py-2 text-xs"
                >
                    Connect Site
                </GoldButton>
            </GlassCard>
        );
    }

    if (!site) return null;

    return (
        <GlassCard goldGlow className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#E1C37A]/20"
                >
                    <Globe className="w-6 h-6 text-[#E1C37A]" />
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center"
                >
                    <Check className="w-4 h-4 text-[#1A1A1C]" />
                </motion.div>
            </div>

            <h3 className="text-[#D6D7D8] font-semibold text-lg mb-1">
                {site.site_name || 'WordPress Site'}
            </h3>
            <p className="text-[#A9AAAC] text-sm mb-4 truncate">{site.site_url}</p>

            <GoldButton
                variant="outline"
                onClick={() => onDisconnect?.(site.id)}
                className="w-full py-2 text-xs flex items-center justify-center gap-2"
            >
                <Trash2 className="w-3 h-3" />
                Remove
            </GoldButton>
        </GlassCard>
    );
}
