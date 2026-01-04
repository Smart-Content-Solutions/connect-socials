import React from "react";
import BlogHero from "../../components/blog/BlogHero";
import BlogGrid from "../../components/blog/BlogGrid";
import { BlogPost } from "../../components/blog/BlogCard";

// TODO: Replace this mock data with WordPress API integration
// This will be replaced with data fetched from WordPress REST API
const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "5 Ways AI Content Automation Can Transform Your Business",
    excerpt:
      "Discover how artificial intelligence is revolutionizing content creation and helping businesses save time while maintaining quality and consistency.",
    date: "January 15, 2025",
    slug: "ai-content-automation-transform-business",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
    category: "AI & Automation",
  },
  {
    id: 2,
    title: "The Ultimate Guide to Content Marketing for SaaS Companies",
    excerpt:
      "Learn proven strategies for creating and distributing valuable content that attracts and retains your target audience in the competitive SaaS market.",
    date: "January 10, 2025",
    slug: "ultimate-guide-content-marketing-saas",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    category: "Marketing Strategy",
  },
  {
    id: 3,
    title: "How to Maintain Brand Voice with AI-Generated Content",
    excerpt:
      "Best practices for training AI systems to understand and replicate your unique brand voice across all content channels.",
    date: "January 5, 2025",
    slug: "maintain-brand-voice-ai-content",
    coverImage: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop",
    category: "Best Practices",
  },
  {
    id: 4,
    title: "SEO Optimization: Making Your Automated Content Rank",
    excerpt:
      "Essential SEO techniques to ensure your AI-generated content performs well in search engine results and drives organic traffic.",
    date: "December 28, 2024",
    slug: "seo-optimization-automated-content",
    coverImage: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2d1a3?w=800&h=600&fit=crop",
    category: "SEO",
  },
  {
    id: 5,
    title: "Scaling Your Content Strategy Without Scaling Your Team",
    excerpt:
      "Learn how automated content solutions can help you scale your marketing efforts without exponentially increasing headcount.",
    date: "December 20, 2024",
    slug: "scaling-content-strategy-without-team",
    coverImage: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop",
    category: "Strategy",
  },
  {
    id: 6,
    title: "Measuring Content ROI: Metrics That Actually Matter",
    excerpt:
      "Cut through the noise and focus on the content metrics that truly impact your business growth and marketing success.",
    date: "December 15, 2024",
    slug: "measuring-content-roi-metrics",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    category: "Analytics",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-[#1A1A1C]">
      <BlogHero />
      <section className="py-16 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-6">
          {/* TODO: Replace mock data with WordPress API data */}
          <BlogGrid posts={mockBlogPosts} />
        </div>
      </section>
    </div>
  );
}
