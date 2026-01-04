import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag, Loader2 } from "lucide-react";
import { fetchWpPostBySlug } from "../../components/blog/blogApi";
import { BlogPost as BlogPostType } from "../../components/blog/BlogCard";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedPost = await fetchWpPostBySlug(slug);
        setPost(fetchedPost);
      } catch (err: any) {
        setError(err.message || "Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#1A1A1C]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#E1C37A] animate-spin" />
            <span className="ml-3 text-[#A9AAAC]">Loading post...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isEnvError = error.includes("not configured");
    const wpApiBase = import.meta.env.VITE_WP_API_BASE;

    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#1A1A1C]">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#A9AAAC] hover:text-[#E1C37A] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="bg-[#2A2A2C] border border-[#E1C37A]/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Unable to Load Blog Post
            </h2>
            <p className="text-[#A9AAAC] mb-4">{error}</p>
            {isEnvError && (
              <div className="mt-4 p-4 bg-[#1A1A1C] rounded-lg">
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
              <div className="mt-4 p-4 bg-[#1A1A1C] rounded-lg">
                <p className="text-sm text-[#E1C37A] font-semibold mb-2">
                  Attempted URL:
                </p>
                <code className="text-xs text-[#A9AAAC] break-all">
                  {wpApiBase}/wp-json/wp/v2/posts?slug={slug}
                </code>
                <p className="text-sm text-[#A9AAAC] mt-2">
                  This may be a CORS issue or the WordPress API may be unavailable.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!post) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-[#1A1A1C]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
            <p className="text-[#A9AAAC] text-lg mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[#E1C37A] hover:text-[#E1C37A]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#1A1A1C]">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[#A9AAAC] hover:text-[#E1C37A] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          {post.title}
        </h1>

        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-[#3B3C3E]">
          <div className="flex items-center gap-2 text-[#A9AAAC] text-sm">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#E1C37A]" />
            <span className="px-3 py-1 bg-[#E1C37A]/20 text-[#E1C37A] text-sm font-semibold rounded-full">
              {post.category}
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Content Body */}
        <article
          className="prose prose-invert max-w-none text-[#A9AAAC] leading-relaxed space-y-6 blog-content"
          dangerouslySetInnerHTML={{
            __html: post.content || post.excerpt,
          }}
        />

        {/* Back to Blog Link (Bottom) */}
        <div className="mt-12 pt-8 border-t border-[#3B3C3E]">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#E1C37A] hover:text-[#E1C37A]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
