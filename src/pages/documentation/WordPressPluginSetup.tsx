import React from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    CheckCircle2,
    ArrowLeft,
    ExternalLink,
    Settings,
    ShieldCheck,
    Cpu,
    BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WordPressPluginSetup() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-[#1A1A1C] text-[#D6D7D8] relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-4xl mx-auto px-6 relative">
                {/* Back Link */}
                <Link
                    to="/apps/ai-agent"
                    className="inline-flex items-center gap-2 text-sm text-[#A9AAAC] hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to AI Agent
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <BookOpen className="w-3 h-3" />
                        Setup Guide
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-[#A9AAAC] bg-clip-text text-transparent">
                        WordPress Plugin Installation
                    </h1>
                    <p className="text-[#A9AAAC] text-lg max-w-2xl leading-relaxed">
                        Connect your WordPress website to Smart Content Solutions in under 2 minutes.
                        Follow these steps to activate the AI Agent connector.
                    </p>
                </header>

                <div className="space-y-12">
                    {/* Step 1 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative pl-12 border-l border-white/10"
                    >
                        <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-[#1A1A1C] border-2 border-blue-500 flex items-center justify-center font-bold text-blue-400 text-sm">
                            1
                        </div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            Download the Controller
                            <Download className="w-5 h-5 text-blue-400" />
                        </h2>
                        <p className="text-[#A9AAAC] mb-6 leading-relaxed">
                            First, download our official WordPress connector plugin. This lightweight bridge
                            allows our AI Agent to read your content and publish optimizations securely.
                        </p>
                        <a
                            href="/downloads/smart-content-solutions.zip"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                        >
                            <Download className="w-5 h-5" />
                            Download Plugin (.zip)
                        </a>
                    </motion.section>

                    {/* Step 2 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative pl-12 border-l border-white/10"
                    >
                        <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-[#1A1A1C] border-2 border-[#E1C37A] flex items-center justify-center font-bold text-[#E1C37A] text-sm">
                            2
                        </div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            Upload to WordPress
                            <ExternalLink className="w-5 h-5 text-[#E1C37A]" />
                        </h2>
                        <p className="text-[#A9AAAC] mb-4">
                            Log in to your WordPress Admin dashboard and follow these steps:
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Navigate to 'Plugins' > 'Add New' in the sidebar.",
                                "Click 'Upload Plugin' at the top of the page.",
                                "Choose the .zip file you just downloaded.",
                                "Click 'Install Now' and then 'Activate'."
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[#D6D7D8]">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.section>

                    {/* Step 3 */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative pl-12 border-l border-white/10"
                    >
                        <div className="absolute left-[-17px] top-0 w-8 h-8 rounded-full bg-[#1A1A1C] border-2 border-purple-500 flex items-center justify-center font-bold text-purple-400 text-sm">
                            3
                        </div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            Enable API Access
                            <ShieldCheck className="w-5 h-5 text-purple-400" />
                        </h2>
                        <p className="text-[#A9AAAC] mb-6">
                            To allow our AI Agent to authenticate, you need to provide an
                            <strong> Application Password</strong> from WordPress.
                        </p>
                        <div className="p-6 rounded-2xl bg-[#3B3C3E]/20 border border-white/5 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <Settings className="w-5 h-5 text-[#D6D7D8]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-1">Where to find this?</p>
                                    <p className="text-xs text-[#A9AAAC]">
                                        Users &gt; Profile &gt; Scroll to &apos;Application Passwords&apos; &gt; Add New Password.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Final Step */}
                    <div className="pt-8 border-t border-white/5">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 text-center">
                            <Cpu className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Ready to Automate?</h3>
                            <p className="text-[#A9AAAC] text-sm mb-6">
                                Once the plugin is active and you have your password, head back to
                                the AI Agent dashboard to add your site.
                            </p>
                            <Link
                                to="/apps/ai-agent"
                                className="inline-block px-8 py-3 bg-white text-[#1A1A1C] rounded-xl font-bold transition-transform hover:scale-105 active:scale-95"
                            >
                                Take Me There
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
