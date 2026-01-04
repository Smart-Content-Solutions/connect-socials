import React from "react";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  coverImage: string;
  category: string;
  content?: string; // Full article content (optional for list view)
}

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block h-full"
    >
      <div className="bg-[#1A1A1C] border border-[#3B3C3E] rounded-xl overflow-hidden hover:border-[#E1C37A]/50 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-[#0F0F10] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Category Badge */}
          <span className="absolute top-4 left-4 px-3 py-1 bg-[#E1C37A] text-[#1A1A1C] text-xs font-semibold rounded-full">
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#E1C37A] transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-[#A9AAAC] text-sm mb-4 flex-1 line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#5B5C60]">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
