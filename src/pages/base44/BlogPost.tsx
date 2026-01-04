import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { mockBlogPosts } from "./Blog";
import { BlogPost as BlogPostType } from "../../components/blog/BlogCard";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  // TODO: Replace this with WordPress API integration
  // This will fetch a single post by slug from WordPress REST API
  const post: BlogPostType | undefined = mockBlogPosts.find(
    (p) => p.slug === slug
  );

  // Handle invalid slug - show clean "not found" state
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
        {/* TODO: Replace dangerouslySetInnerHTML with proper React rendering when WordPress integration is added */}
        <article
          className="prose prose-invert max-w-none text-[#A9AAAC] leading-relaxed space-y-6"
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
