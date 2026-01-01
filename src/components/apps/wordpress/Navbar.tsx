import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    showTabs?: boolean;
}

export default function Navbar({ activeTab, onTabChange, showTabs = true }: NavbarProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <img src="/icon.png" alt="SCS Logo" className="w-10 h-10 rounded-xl" />
                    <span className="text-xl font-bold bg-gradient-to-r from-[#E1C37A] to-[#D6D7D8] bg-clip-text text-transparent">
                        SmartContentSolutions
                    </span>
                </div>

                {/* Center Tabs */}
                {showTabs && (
                    <div className="absolute left-1/2 -translate-x-1/2 flex p-1 rounded-full bg-[#3B3C3E]/40 backdrop-blur-md border border-white/10">
                        {[
                            { id: 'create', label: 'Create Post', icon: FileText },
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={cn(
                                        "relative px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300",
                                        isActive ? "text-[#1A1A1C]" : "text-[#A9AAAC] hover:text-[#D6D7D8]"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-[#E1C37A] to-[#B6934C] rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Right Side (Empty for now) */}
                <div className="w-10" />
            </div>
        </nav>
    );
}
