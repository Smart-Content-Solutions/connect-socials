import { BlogPost } from "./BlogCard";

/**
 * WordPress REST API helper module
 * 
 * Fetches blog posts from WordPress REST API and maps them
 * to the BlogPost type used by BlogCard/BlogGrid components.
 */

// WordPress REST API base URL
const WP_API_BASE = `https://wp.smartcontentsolutions.co.uk/wp-json/wp/v2`;

/**
 * WordPress post object structure (as returned by REST API)
 */
interface WpPost {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      taxonomy: string;
    }>>;
  };
}

/**
 * Strip HTML tags from a string
 */
const stripHtml = (html: string): string => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

/**
 * Format date string to readable format
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Extract category name from WordPress post
 */
const extractCategory = (post: WpPost): string => {
  if (post._embedded?.["wp:term"]) {
    // Find category from terms (categories are in taxonomy "category")
    for (const termGroup of post._embedded["wp:term"]) {
      const category = termGroup.find((term) => term.taxonomy === "category");
      if (category) return category.name;
    }
  }
  return "Updates"; // Default category
};

/**
 * Extract featured image URL from WordPress post
 */
const extractFeaturedImage = (post: WpPost): string => {
  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
  return featuredMedia?.source_url || "";
};

/**
 * Map WordPress post to BlogPost type
 */
const mapWpPostToBlogPost = (wpPost: WpPost): BlogPost => {
  return {
    id: wpPost.id,
    title: stripHtml(wpPost.title.rendered),
    excerpt: stripHtml(wpPost.excerpt.rendered),
    date: formatDate(wpPost.date),
    slug: wpPost.slug,
    coverImage: extractFeaturedImage(wpPost),
    category: extractCategory(wpPost),
    content: wpPost.content.rendered,
  };
};

/**
 * Fetch blog posts from WordPress REST API
 * 
 * @param page - Page number (default: 1)
 * @returns Promise<BlogPost[]> - Array of blog posts
 */
export async function fetchWpPosts(page: number = 1): Promise<BlogPost[]> {
  try {
    const url = `${WP_API_BASE}/posts?per_page=12&page=${page}&_embed`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `WordPress API error: ${response.status} ${response.statusText}`
      );
    }

    const wpPosts: WpPost[] = await response.json();
    return wpPosts.map(mapWpPostToBlogPost);
  } catch (error: any) {
    // Handle CORS and network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to WordPress API. This may be a CORS issue or network error. URL: ${WP_API_BASE}/posts`
      );
    }
    throw error;
  }
}

/**
 * Fetch a single blog post by slug from WordPress REST API
 * 
 * @param slug - Post slug
 * @returns Promise<BlogPost | null> - Blog post or null if not found
 */
export async function fetchWpPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug) {
    return null;
  }

  try {
    const url = `${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `WordPress API error: ${response.status} ${response.statusText}`
      );
    }

    const wpPosts: WpPost[] = await response.json();

    if (wpPosts.length === 0) {
      return null;
    }

    return mapWpPostToBlogPost(wpPosts[0]);
  } catch (error: any) {
    // Handle CORS and network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to WordPress API. This may be a CORS issue or network error. URL: ${WP_API_BASE}/posts`
      );
    }
    throw error;
  }
}
