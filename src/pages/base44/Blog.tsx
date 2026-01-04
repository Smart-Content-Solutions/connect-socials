import React, { useState, useEffect } from "react";
import BlogHero from "../../components/blog/BlogHero";
import BlogGrid from "../../components/blog/BlogGrid";
import { BlogPost } from "../../components/blog/BlogCard";
import { fetchWpPosts } from "../../components/blog/blogApi";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedPosts = await fetchWpPosts(currentPage);
        if (currentPage === 1) {
          setPosts(fetchedPosts);
        } else {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        }
        // If we got less than 12 posts, there are no more pages
        setHasMore(fetchedPosts.length === 12);
      } catch (err: any) {
        setError(err.message || "Failed to load blog posts");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [currentPage]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Error state - show clear error message with URL and hint
  if (error && posts.length === 0) {
    const isEnvError = error.includes("not configured");
    const wpApiBase = import.meta.env.VITE_WP_API_BASE;

    return (
      <div className="min-h-screen bg-[#1A1A1C]">
        <BlogHero />
        <section className="py-16 bg-[#1A1A1C]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-[#2A2A2C] border border-[#E1C37A]/30 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Unable to Load Blog Posts
              </h2>
              <p className="text-[#A9AAAC] mb-4">{error}</p>
              {isEnvError && (
                <div className="mt-4 p-4 bg-[#1A1A1C] rounded-lg text-left max-w-2xl mx-auto">
                  <p className="text-sm text-[#E1C37A] font-semibold mb-2">
                    Environment Variable Missing:
                  </p>
                  <code className="text-xs text-[#A9AAAC] block mb-2">
                    VITE_WP_API_BASE
                  </code>
                  <p className="text-sm text-[#A9AAAC]">
                    Set this variable to your WordPress site URL (e.g.,{" "}
                    <code className="text-[#E1C37A]">
                      https://cms.smartcontentsolutions.co.uk
                    </code>
                    )
                  </p>
                </div>
              )}
              {wpApiBase && !isEnvError && (
                <div className="mt-4 p-4 bg-[#1A1A1C] rounded-lg text-left max-w-2xl mx-auto">
                  <p className="text-sm text-[#E1C37A] font-semibold mb-2">
                    Attempted URL:
                  </p>
                  <code className="text-xs text-[#A9AAAC] break-all">
                    {wpApiBase}/wp-json/wp/v2/posts
                  </code>
                  <p className="text-sm text-[#A9AAAC] mt-2">
                    This may be a CORS issue or the WordPress API may be unavailable.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1C]">
      <BlogHero />
      <section className="py-16 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Loading state */}
          {loading && posts.length === 0 && (
            <div className="text-center py-12 text-[#A9AAAC]">
              Loading posts...
            </div>
          )}

          {/* Error state (with partial data) */}
          {error && posts.length > 0 && (
            <div className="mb-6 p-4 bg-[#2A2A2C] border border-yellow-500/30 rounded-lg text-center">
              <p className="text-[#A9AAAC] text-sm">
                {error} Showing previously loaded posts.
              </p>
            </div>
          )}

          {/* Posts grid */}
          {posts.length > 0 && <BlogGrid posts={posts} />}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12 text-[#A9AAAC]">
              No blog posts available.
            </div>
          )}

          {/* Load More button */}
          {!loading && posts.length > 0 && hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-[#E1C37A] text-[#1A1A1C] font-semibold rounded-full hover:bg-[#E1C37A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {/* Loading more indicator */}
          {loading && posts.length > 0 && (
            <div className="mt-12 text-center text-[#A9AAAC]">
              Loading more posts...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
