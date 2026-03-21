import React from "react";
import BlogCard, { BlogPost } from "./BlogCard";

interface BlogGridProps {
  posts: BlogPost[];
  emptyMessage?: string;
}

export default function BlogGrid({
  posts,
  emptyMessage = "No blog posts available.",
}: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-[#A9AAAC]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
