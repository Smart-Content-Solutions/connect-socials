// src/pages/base44/SocialMediaTool.tsx
import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CreatePostContent from "@/components/social/CreatePostContent";
import DashboardContent from "@/components/social/DashboardContent";
import InstagramDashboardContent from "@/components/social/InstagramDashboardContent";
import { type FacebookPage } from "@/utils/facebookOAuth";

export default function SocialMediaTool(): JSX.Element {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();

  const [activeTab, setActiveTab] = useState('create');
  const [selectedFbPage, setSelectedFbPage] = useState<FacebookPage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load selected FB page for Dashboard
    const stored = localStorage.getItem("facebook_selected_page");
    if (stored) {
      try {
        setSelectedFbPage(JSON.parse(stored));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTo = activeTab === 'create' ? 0 : scrollContainerRef.current.scrollWidth / 2;
      const start = scrollContainerRef.current.scrollLeft;
      const end = scrollTo;
      const duration = 800;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = start + (end - start) * easedProgress;
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);

      // Scroll page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading user…</div>;

  if (!isSignedIn)
    return <div className="min-h-screen flex items-center justify-center">Login required</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden relative">
      {/* Navigation Tabs */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 py-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'create'
                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Create Post
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="pt-8 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-xl min-h-[600px]"
          >
            <div className="p-6 md:p-8">
              {activeTab === 'create' ? (
                <CreatePostContent />
              ) : (
                <div className="space-y-12">
                  <DashboardContent selectedPage={selectedFbPage} />
                  <InstagramDashboardContent />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
