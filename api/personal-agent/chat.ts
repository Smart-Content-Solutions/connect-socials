import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wbhfbcqcefbnsjvqmjte.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const clerkSecretKey = process.env.VITE_CLERK_SECRET_KEY || 'sk_test_JjTqEC8zpcJlW2Y9wdTbMGevmLC81O6Ii7aw3YGWrL';

const n8nImageWebhook = 'https://n8n.smartcontentsolutions.co.uk/webhook/social-media';
const n8nVideoWebhook = 'https://n8n.smartcontentsolutions.co.uk/webhook/social-media-video';

async function verifyClerkToken(authHeader: string): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.decode(token) as { user_id?: string; sub?: string } | null;
    if (!decoded) return null;
    
    const userId = decoded.user_id || decoded.sub;
    if (!userId) return null;
    
    return userId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

import { ChatCompletionTool } from 'openai';

function generateTools(): ChatCompletionTool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'get_user_platforms',
        description: 'Get the social media platforms the user has connected',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_facebook_pages',
        description: 'Get the Facebook pages the user has connected',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_facebook',
        description: 'Post content to Facebook (text, image, or video). Platform supports: text posts, single image, multiple images, videos, stories, and posting to both feed and story simultaneously. IMPORTANT: Call get_facebook_pages first to get available pages. If user has multiple pages, ask which one to use. Pass the page name as page_id parameter.',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'The text content/caption of the post' },
            image_url: { type: 'string', description: 'URL of image to post. For multiple images, separate URLs with commas (optional)' },
            video_url: { type: 'string', description: 'URL of video to post (optional - use instead of image_url for video posts)' },
            page_id: { type: 'string', description: 'Specific Facebook page name or ID to post to (REQUIRED if user has multiple pages)' },
            is_story: { type: 'boolean', description: 'Whether to post as a story (default: false)' },
            post_to_both_feed_and_story: { type: 'boolean', description: 'Whether to post to both feed and story simultaneously (default: false)' },
          },
          required: ['message'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_instagram',
        description: 'Post content to Instagram. REQUIRED: Must provide image_url(s) or video_url. Instagram does NOT support text-only posts. Supports: single image, multiple images (carousel), videos/reels, stories, and posting to both feed and story simultaneously. IMPORTANT: For carousel, pass ALL image URLs as a comma-separated string in image_url parameter.',
        parameters: {
          type: 'object',
          properties: {
            image_url: { type: 'string', description: 'URL of image to post. For multiple images (carousel), separate URLs with commas (e.g., "url1,url2,url3")' },
            video_url: { type: 'string', description: 'URL of video/reel to post (required if no image_url)' },
            caption: { type: 'string', description: 'Caption for the post' },
            post_type: { type: 'string', enum: ['feed', 'reel', 'story'], description: 'Type of post: feed, reel, or story (default: feed)' },
            is_story: { type: 'boolean', description: 'Whether to post as a story (default: false)' },
            post_to_both_feed_and_story: { type: 'boolean', description: 'Whether to post to both feed and story simultaneously (default: false)' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_linkedin',
        description: 'Post content to LinkedIn. Supports: text posts, single image, and multiple images (carousel). IMPORTANT: For carousel, pass ALL image URLs as a comma-separated string in media_url parameter.',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The text content of the post' },
            media_url: { type: 'string', description: 'URL of image, video, or document to post (optional)' },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_tiktok',
        description: 'Post a video to TikTok. REQUIRED: Must provide video_url. TikTok does NOT support text-only or image-only posts',
        parameters: {
          type: 'object',
          properties: {
            video_url: { type: 'string', description: 'URL of the video to post (REQUIRED)' },
            caption: { type: 'string', description: 'Caption for the TikTok video' },
          },
          required: ['video_url'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_youtube',
        description: 'Post a video to YouTube. REQUIRED: Must provide video_url and title',
        parameters: {
          type: 'object',
          properties: {
            video_url: { type: 'string', description: 'URL of the video to upload (REQUIRED)' },
            title: { type: 'string', description: 'Title of the YouTube video (REQUIRED)' },
            description: { type: 'string', description: 'Description of the video (optional)' },
            tags: { type: 'string', description: 'Comma-separated tags for the video (optional)' },
            privacy: { type: 'string', enum: ['public', 'private', 'unlisted'], description: 'Privacy setting (default: private)' },
          },
          required: ['video_url', 'title'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_twitter',
        description: 'Post content to Twitter/X. Supports: text posts and images',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Tweet content (required)' },
            image_url: { type: 'string', description: 'URL of image to attach (optional)' },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'schedule_post',
        description: 'Schedule a post to be published later. Supports: Facebook, Instagram, LinkedIn, TikTok, YouTube. For Instagram and TikTok, media is required',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Text content/caption for the post' },
            platforms: { type: 'string', description: 'Comma-separated platforms: facebook,instagram,linkedin,tiktok,youtube,twitter' },
            scheduled_time: { type: 'string', description: 'Date and time to publish (ISO format, e.g., 2026-03-25T10:00:00Z)' },
            image_url: { type: 'string', description: 'URL of image for Instagram/Facebook/LinkedIn (optional)' },
            video_url: { type: 'string', description: 'URL of video for TikTok/YouTube (optional)' },
          },
          required: ['content', 'platforms', 'scheduled_time'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'enhance_caption',
        description: 'Use AI to improve/rewrite a social media caption',
        parameters: {
          type: 'object',
          properties: {
            caption: { type: 'string', description: 'The original caption to enhance' },
            platform: { type: 'string', description: 'Target platform: facebook, instagram, linkedin, twitter, tiktok, youtube' },
            tone: { type: 'string', description: 'Desired tone: professional, casual, friendly, humorous, inspirational' },
          },
          required: ['caption'],
        },
      },
    },
  ];
}

interface ToolArgs {
  message?: string;
  content?: string;
  caption?: string;
  image_url?: string;
  video_url?: string;
  media_url?: string;
  page_id?: string;
  post_type?: string;
  is_story?: boolean;
  post_to_both_feed_and_story?: boolean;
  platforms?: string;
  scheduled_time?: string;
  title?: string;
  description?: string;
  tags?: string;
  privacy?: string;
  tone?: string;
  platform?: string;
}

async function getUserPlatforms(userId: string): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data } = await supabase
    .from('user_social_credentials')
    .select('platform')
    .eq('user_id', userId);
  
  if (!data) return [];
  
  const platforms = [...new Set(data.map(d => d.platform))];
  return platforms;
}

async function handleToolCall(
  toolName: string,
  args: ToolArgs,
  userId: string,
  sendProgress: (msg: string) => void
): Promise<Record<string, unknown>> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[TOOL] ${toolName} called with args:`, args);
  
  switch (toolName) {
    case 'get_user_platforms': {
      sendProgress('Checking connected platforms...');
      const platforms = await getUserPlatforms(userId);
      return { 
        platforms, 
        message: platforms.length > 0 
          ? `Connected platforms: ${platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}`
          : 'No social media platforms connected yet.' 
      };
    }
    
    case 'get_facebook_pages': {
      sendProgress('Getting Facebook pages...');
      const { data: fbData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single();
      
      const pages = fbData?.credentials?.pages || [];
      
      if (pages.length === 0) {
        return { pages: [], message: 'No Facebook pages connected' };
      }
      
      const pageList = pages.map((p: Record<string, unknown>, i: number) => `${i + 1}. ${p.name} (${p.category || 'Page'})`).join('\n');
      return { 
        pages, 
        message: `You have ${pages.length} Facebook page(s):\n\n${pageList}` 
      };
    }
    
    case 'post_to_facebook': {
      const { message, image_url, video_url, page_id, is_story, post_to_both_feed_and_story } = args;
      sendProgress('Posting to Facebook...');
      
      const { data: fbData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single();
      
      if (!fbData) {
        return { success: false, error: 'Facebook not connected. Please connect Facebook in your dashboard.' };
      }
      
      const pages = fbData?.credentials?.pages || [];
      let selectedPage = page_id 
        ? pages.find((p: Record<string, unknown>) => p.id === page_id || (p.name as string)?.toLowerCase() === (page_id as string)?.toLowerCase())
        : pages[0];
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', message || '');
      formData.append('platforms[]', 'facebook');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      
      if (video_url) {
        formData.append('type', 'video');
        try {
          const videoResponse = await fetch(video_url);
          if (videoResponse.ok) {
            const videoBlob = await videoResponse.blob();
            const urlParts = video_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'video.mp4');
            formData.append('video', new File([videoBlob], fileName, { type: videoBlob.type }));
          } else {
            formData.append('media_url', video_url);
          }
        } catch { formData.append('media_url', video_url); }
      } else if (image_url) {
        formData.append('type', 'image');
        
        // Handle multiple images (comma-separated URLs)
        const imageUrls = image_url.split(',').map(url => url.trim()).filter(Boolean);
        
        if (imageUrls.length > 1) {
          // Multiple images - append each as media[0], media[1], etc.
          for (let i = 0; i < imageUrls.length; i++) {
            const imgUrl = imageUrls[i];
            try {
              const imageResponse = await fetch(imgUrl);
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const urlParts = imgUrl.split('/');
                const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || `image_${i}.png`);
                formData.append(`media[${i}]`, new File([imageBlob], fileName, { type: imageBlob.type }));
              }
            } catch { /* Skip failed images */ }
          }
        } else {
          // Single image
          try {
            const imageResponse = await fetch(image_url);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              const urlParts = image_url.split('/');
              const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'image.png');
              formData.append('image', new File([imageBlob], fileName, { type: imageBlob.type }));
            } else {
              formData.append('media_url', image_url);
            }
          } catch { formData.append('media_url', image_url); }
        }
      } else {
        formData.append('type', 'none');
      }
      
      if (is_story) {
        formData.append('is_story', 'true');
      }
      
      // Support for posting to both feed and story simultaneously
      if (post_to_both_feed_and_story) {
        formData.append('post_to_both_feed_and_story', 'true');
      }
      
      if (selectedPage?.id) {
        formData.append('facebook_page_ids[]', String(selectedPage.id));
      }
      
      try {
        const response = await fetch(n8nImageWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'Facebook posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to post to Facebook' };
        }
        
        sendProgress('Posted to Facebook! ✅');
        return { success: true, message: 'Successfully posted to Facebook!', result };
      } catch (error) {
        return { success: false, error: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'post_to_instagram': {
      const { image_url, video_url, caption, post_type, is_story, post_to_both_feed_and_story } = args;
      
      if (!image_url && !video_url) {
        return { success: false, error: 'Instagram requires an image or video. Please provide image_url or video_url.' };
      }
      
      sendProgress('Posting to Instagram...');
      
      const { data: igData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .single();
      
      if (!igData) {
        return { success: false, error: 'Instagram not connected. Please connect Instagram in your dashboard.' };
      }
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', caption || '');
      formData.append('platforms[]', 'instagram');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      
      if (video_url) {
        formData.append('type', 'video');
        try {
          const videoResponse = await fetch(video_url);
          if (videoResponse.ok) {
            const videoBlob = await videoResponse.blob();
            const urlParts = video_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'video.mp4');
            formData.append('video', new File([videoBlob], fileName, { type: videoBlob.type }));
          } else {
            formData.append('media_url', video_url);
          }
        } catch { formData.append('media_url', video_url); }
        formData.append('instagram_post_types', JSON.stringify({ feed: false, reel: true, story: false }));
      } else {
        formData.append('type', 'image');
        
        // Handle multiple images (comma-separated URLs for carousel)
        const imageUrls = (image_url || '').split(',').map(url => url.trim()).filter(Boolean);
        
        if (imageUrls.length > 1) {
          // Multiple images - append each as media[0], media[1], etc. for carousel
          for (let i = 0; i < imageUrls.length; i++) {
            const imgUrl = imageUrls[i];
            try {
              const imageResponse = await fetch(imgUrl);
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const urlParts = imgUrl.split('/');
                const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || `image_${i}.png`);
                formData.append(`media[${i}]`, new File([imageBlob], fileName, { type: imageBlob.type }));
              }
            } catch { /* Skip failed images */ }
          }
        } else if (imageUrls.length === 1) {
          // Single image
          const imgUrl = imageUrls[0];
          try {
            const imageResponse = await fetch(imgUrl);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              const urlParts = imgUrl.split('/');
              const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'image.png');
              formData.append('image', new File([imageBlob], fileName, { type: imageBlob.type }));
            } else {
              formData.append('media_url', imgUrl);
            }
          } catch { formData.append('media_url', imgUrl); }
        }
        
        const postTypes = post_type === 'story' 
          ? { feed: false, reel: false, story: true }
          : post_type === 'reel'
            ? { feed: false, reel: true, story: false }
            : { feed: true, reel: false, story: false };
        formData.append('instagram_post_types', JSON.stringify(postTypes));
      }
      
      if (is_story || post_type === 'story') {
        formData.append('is_story', 'true');
      }
      
      // Support for posting to both feed and story simultaneously
      if (post_to_both_feed_and_story) {
        formData.append('post_to_both_feed_and_story', 'true');
      }
      
      try {
        const response = await fetch(n8nImageWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'Instagram posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to post to Instagram' };
        }
        
        sendProgress('Posted to Instagram! ✅');
        return { success: true, message: 'Successfully posted to Instagram!', result };
      } catch (error) {
        return { success: false, error: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'post_to_linkedin': {
      const { content, media_url } = args;
      sendProgress('Posting to LinkedIn...');
      
      const { data: liData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'linkedin')
        .single();
      
      if (!liData) {
        return { success: false, error: 'LinkedIn not connected. Please connect LinkedIn in your dashboard.' };
      }
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', content || '');
      formData.append('platforms[]', 'linkedin');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      
      if (media_url) {
        formData.append('type', 'image');
        
        // Handle multiple images (comma-separated URLs for carousel)
        const mediaUrls = media_url.split(',').map(url => url.trim()).filter(Boolean);
        
        if (mediaUrls.length > 1) {
          // Multiple images - append each as media[0], media[1], etc. for carousel
          for (let i = 0; i < mediaUrls.length; i++) {
            const imgUrl = mediaUrls[i];
            try {
              const imageResponse = await fetch(imgUrl);
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob();
                const urlParts = imgUrl.split('/');
                const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || `image_${i}.png`);
                formData.append(`media[${i}]`, new File([imageBlob], fileName, { type: imageBlob.type }));
              }
            } catch { /* Skip failed images */ }
          }
        } else {
          // Single image
          try {
            const imageResponse = await fetch(media_url);
            if (!imageResponse.ok) {
              throw new Error('Failed to download image');
            }
            const imageBlob = await imageResponse.blob();
            
            const urlParts = media_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'image.png');
            
            const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });
            formData.append('image', imageFile);
          } catch (downloadError) {
            console.error('Failed to download image:', downloadError);
            formData.append('media_url', media_url);
          }
        }
      } else {
        formData.append('type', 'none');
      }
      
      try {
        const response = await fetch(n8nImageWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'LinkedIn posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to post to LinkedIn' };
        }
        
        sendProgress('Posted to LinkedIn! ✅');
        return { success: true, message: 'Successfully posted to LinkedIn!', result };
      } catch (error) {
        return { success: false, error: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'post_to_tiktok': {
      const { video_url, caption } = args;
      
      if (!video_url) {
        return { success: false, error: 'TikTok requires a video. Please provide video_url.' };
      }
      
      sendProgress('Posting to TikTok...');
      
      const { data: ttData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .single();
      
      if (!ttData) {
        return { success: false, error: 'TikTok not connected. Please connect TikTok in your dashboard.' };
      }
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', caption || '');
      formData.append('platforms[]', 'tiktok');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      
      // Send video as binary
      try {
        const videoResponse = await fetch(video_url);
        if (videoResponse.ok) {
          const videoBlob = await videoResponse.blob();
          const urlParts = video_url.split('/');
          const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'video.mp4');
          formData.append('video', new File([videoBlob], fileName, { type: videoBlob.type }));
        } else {
          formData.append('media_url', video_url);
        }
      } catch { formData.append('media_url', video_url); }
      
      try {
        const response = await fetch(n8nVideoWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'TikTok posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to post to TikTok' };
        }
        
        sendProgress('Posted to TikTok! ✅');
        return { success: true, message: 'Successfully posted to TikTok!', result };
      } catch (error) {
        return { success: false, error: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'post_to_youtube': {
      const { video_url, title, description, tags, privacy } = args;
      
      if (!video_url) {
        return { success: false, error: 'YouTube requires a video. Please provide video_url.' };
      }
      
      if (!title) {
        return { success: false, error: 'YouTube requires a title. Please provide title.' };
      }
      
      sendProgress('Uploading to YouTube...');
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('platforms[]', 'youtube');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      formData.append('privacy', privacy || 'private');
      
      // Send video as binary
      try {
        const videoResponse = await fetch(video_url);
        if (videoResponse.ok) {
          const videoBlob = await videoResponse.blob();
          const urlParts = video_url.split('/');
          const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'video.mp4');
          formData.append('video', new File([videoBlob], fileName, { type: videoBlob.type }));
        } else {
          formData.append('media_url', video_url);
        }
      } catch { formData.append('media_url', video_url); }
      
      if (tags) {
        formData.append('tags', tags);
      }
      
      try {
        const response = await fetch(n8nVideoWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'YouTube posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to upload to YouTube' };
        }
        
        sendProgress('Uploaded to YouTube! ✅');
        return { success: true, message: 'Successfully uploaded to YouTube!', result };
      } catch (error) {
        return { success: false, error: `Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'post_to_twitter': {
      const { content, image_url } = args;
      sendProgress('Posting to Twitter/X...');
      
      const { data: twData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'twitter')
        .single();
      
      if (!twData) {
        return { success: false, error: 'Twitter/X not connected. Please connect Twitter in your dashboard.' };
      }
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', content || '');
      formData.append('platforms[]', 'x');
      formData.append('post_mode', 'publish');
      formData.append('use_ai', 'no');
      
      if (image_url) {
        formData.append('type', 'image');
        try {
          const imageResponse = await fetch(image_url);
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const urlParts = image_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'image.png');
            formData.append('image', new File([imageBlob], fileName, { type: imageBlob.type }));
          } else {
            formData.append('media_url', image_url);
          }
        } catch { formData.append('media_url', image_url); }
      } else {
        formData.append('type', 'none');
      }
      
      try {
        const response = await fetch(n8nImageWebhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'Twitter posting is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to post to Twitter' };
        }
        
        sendProgress('Posted to Twitter! ✅');
        return { success: true, message: 'Successfully posted to Twitter!', result };
      } catch (error) {
        return { success: false, error: `Failed to post: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'schedule_post': {
      const { content, platforms, scheduled_time, image_url, video_url } = args;
      
      if (!platforms || !scheduled_time) {
        return { success: false, error: 'Please provide platforms and scheduled_time' };
      }
      
      sendProgress('Scheduling post...');
      
      const platformList = platforms.split(',').map(p => p.trim().toLowerCase());
      
      // Check if any platform requires media
      const requiresMedia = platformList.some(p => p === 'instagram' || p === 'tiktok' || p === 'youtube');
      if (requiresMedia && !image_url && !video_url) {
        return { success: false, error: 'Instagram, TikTok, and YouTube require media. Please provide image_url or video_url.' };
      }
      
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('caption', content || '');
      platformList.forEach(p => formData.append('platforms[]', p));
      formData.append('post_mode', 'schedule');
      formData.append('scheduled_time', scheduled_time);
      formData.append('use_ai', 'no');
      
      if (video_url) {
        formData.append('type', 'video');
        try {
          const videoResponse = await fetch(video_url);
          if (videoResponse.ok) {
            const videoBlob = await videoResponse.blob();
            const urlParts = video_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'video.mp4');
            formData.append('video', new File([videoBlob], fileName, { type: videoBlob.type }));
          } else {
            formData.append('media_url', video_url);
          }
        } catch { formData.append('media_url', video_url); }
      } else if (image_url) {
        formData.append('type', 'image');
        try {
          const imageResponse = await fetch(image_url);
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const urlParts = image_url.split('/');
            const fileName = decodeURIComponent(urlParts[urlParts.length - 1] || 'image.png');
            formData.append('image', new File([imageBlob], fileName, { type: imageBlob.type }));
          } else {
            formData.append('media_url', image_url);
          }
        } catch { formData.append('media_url', image_url); }
      } else {
        formData.append('type', 'none');
      }
      
      const webhook = video_url ? n8nVideoWebhook : n8nImageWebhook;
      
      try {
        const response = await fetch(webhook, { method: 'POST', body: formData });
        
        if (response.status === 404) {
          return { success: false, error: 'Scheduling is not configured. Please contact support.' };
        }
        
        const result = await response.json();
        
        if (response.status >= 400 || result?.error) {
          return { success: false, error: result?.error || result?.message || 'Failed to schedule post' };
        }
        
        sendProgress('Post scheduled! ✅');
        return { success: true, message: `Post scheduled for ${new Date(scheduled_time).toLocaleString()}!`, result };
      } catch (error) {
        return { success: false, error: `Failed to schedule: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    case 'enhance_caption': {
      const { caption, platform, tone } = args;
      sendProgress('Enhancing caption...');
      
      try {
        const platformInfo = platform ? ` for ${platform}` : '';
        const toneInfo = tone ? ` in a ${tone} tone` : '';
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a social media caption expert. Rewrite the given caption to be more engaging and effective${platformInfo}${toneInfo}. Keep it natural, human-like, and suitable for social media. Do not add hashtags unless specifically asked. Do not mention that you are an AI.`
            },
            {
              role: 'user',
              content: `Please enhance this caption:\n\n"${caption}"`
            }
          ],
        });
        
        const enhancedCaption = completion.choices[0]?.message?.content || caption;
        
        sendProgress('Caption enhanced! ✅');
        return { 
          success: true, 
          original: caption,
          enhanced: enhancedCaption,
          message: `✨ **Enhanced Caption:**\n\n${enhancedCaption}`
        };
      } catch (error) {
        return { success: false, error: `Failed to enhance caption: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }
    
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('[CHAT] Request received');
  const authHeader = req.headers.authorization;
  console.log('[CHAT] Auth header present:', !!authHeader);
  
  const userId = await verifyClerkToken(authHeader);
  console.log('[CHAT] User ID:', userId);
  
  if (!userId) {
    console.log('[CHAT] Returning 401 - no userId');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  
  const { message, session_id, media } = req.body;
  console.log('[CHAT] Message:', message);
  console.log('[CHAT] Media:', media);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const currentSessionId = session_id || `session_${Date.now()}`;
  
  const sendSSE = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };
  
  const sendProgress = (msg: string) => {
    sendSSE(JSON.stringify({ type: 'progress', message: msg }));
  };
  
  try {
    await saveMessage(supabase, userId, currentSessionId, 'user', message);
    
    sendSSE(JSON.stringify({ type: 'start', session_id: currentSessionId }));
    sendProgress('Starting...');
    
    const systemMessage = `You are a helpful AI assistant for SmartContentSolutions. Your job is to help users manage their social media presence.

PLATFORM CAPABILITIES - Remember these rules:
- Facebook: Text posts ✅, Images ✅, Videos ✅, Stories ✅, Scheduling ✅, Multi-image posts ✅, Post to both feed and story ✅
- Instagram: REQUIRES media (image or video). No text-only posts ❌. Stories ✅, Reels ✅, Carousel (multiple images) ✅, Post to both feed and story ✅
- LinkedIn: Text posts ✅, Images ✅, Videos ✅, Documents ✅, Scheduling ✅, Carousel (multiple images) ✅
- TikTok: REQUIRES video ❌. No text-only or image-only ❌
- YouTube: REQUIRES video and title ❌. Videos only ✅
- Twitter/X: Text posts ✅, Images ✅

IMPORTANT RULES:
1. When user wants to post to Instagram - they MUST provide an image or video
2. When user wants to post to TikTok - they MUST provide a video URL
3. When user wants to post to YouTube - they MUST provide a video URL and title
4. When user wants to post to Facebook - text is optional if they provide media
5. If user asks to "post" without specifying platform - ask which platform OR post to all connected platforms
6. NEVER ask for confirmation - just post directly when user says to post
7. CRITICAL: When user attaches images/videos (shown as "[Attached image/video: filename]"), you MUST extract the URL from the message and pass it to the posting tool. Look for lines starting with "http" in the Attached Media section and use that URL as image_url, video_url, or media_url parameter.
8. MULTIPLE IMAGES AND STORY HANDLING:
   - If user says "story" or "as story" → set is_story: true
   - If user says "post to both feed and story" or "both" → set post_to_both_feed_and_story: true
   - For Instagram with multiple images: Pass ALL image URLs as a comma-separated string in image_url (e.g., "url1,url2,url3")
   - For Facebook with multiple images: Pass ALL image URLs as a comma-separated string (system will create posts)
   - For LinkedIn with multiple images: Pass ALL image URLs as a comma-separated string in media_url (creates carousel)
   - Default post type is FEED if user doesn't mention story
   - Example: "post to Instagram story" → is_story: true
   - Example: "post to Instagram as story" → is_story: true
   - Example: "post to Instagram and story" or "both" → post_to_both_feed_and_story: true
   - Example: "post to Instagram" (no story mentioned) → is_story: false (feed)
   - Example: 3 images to Instagram → image_url: "url1,url2,url3" (creates carousel)
   - Example: 3 images to LinkedIn → media_url: "url1,url2,url3" (creates carousel)
9. FACEBOOK PAGE SELECTION: When posting to Facebook, ALWAYS call get_facebook_pages first to get the user's pages. If they have multiple pages, ask which page to use. If they have one page, use that page automatically. Pass the page name or ID to the post_to_facebook tool as page_id parameter.

When user asks about connected platforms -> call get_user_platforms
When user asks which Facebook pages they have -> call get_facebook_pages
When user wants to enhance/improve a caption -> call enhance_caption

Tools available:
- get_user_platforms() - Check what platforms user has connected
- get_facebook_pages() - List Facebook pages
- post_to_facebook(message, image_url?, video_url?, is_story?) - Post to Facebook
- post_to_instagram(image_url?, video_url?, caption, post_type?) - Post to Instagram (needs media!)
- post_to_linkedin(content, media_url?) - Post to LinkedIn  
- post_to_tiktok(video_url, caption) - Post to TikTok (needs video!)
- post_to_youtube(video_url, title, description?, tags?, privacy?) - Upload to YouTube
- post_to_twitter(content, image_url?) - Post to Twitter/X
- schedule_post(content, platforms, scheduled_time, image_url?, video_url?) - Schedule a post
- enhance_caption(caption, platform?, tone?) - Improve a caption`;

    // Get chat history
    const { data: historyData } = await supabase
      .from('personal_agent_chats')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);
    
    const historyMessages = (historyData || []).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    
    console.log('[CHAT] Sending request to OpenAI with message:', message);
    
    // Build user message with media context
    let userMessageContent = message || '';
    if (media && Array.isArray(media) && media.length > 0) {
      const mediaDescriptions = media.map((m: { type: string; url: string; name: string }) => {
        const typeLabel = m.type === 'video' ? 'VIDEO' : 'IMAGE';
        return `[Attached ${typeLabel}: ${m.name}]\nURL: ${m.url}`;
      }).join('\n\n');
      
      userMessageContent = `${userMessageContent}\n\n=== MEDIA ATTACHED ===\n${mediaDescriptions}\n\nIMPORTANT: When calling post_to_linkedin, post_to_facebook, post_to_instagram, or post_to_twitter, you MUST use the URL from the Attached Media section above as the image_url/media_url parameter. The URL starts with "https://wbhfbcqcefbnsjvqmjte.supabase.co/".`;
      console.log('[CHAT] User message with media:', userMessageContent);
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...historyMessages,
        { role: 'user', content: userMessageContent },
      ],
      tools: generateTools(),
    });
    
    const responseMessage = completion.choices[0]?.message;
    console.log('[CHAT] AI Response:', JSON.stringify(responseMessage));
    
    let responseText = responseMessage?.content || 'I\'m ready to help! What would you like to do?';
    const toolCalls = responseMessage?.tool_calls || [];
    console.log('[CHAT] Tool calls:', toolCalls.length);
    
    const toolResultsArray: { name: string; result: unknown; tool_call_id: string }[] = [];
    
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const toolName = (toolCall as { function?: { name?: string } }).function?.name || '';
        const toolCallId = (toolCall as { id?: string }).id || '';
        const argsStr = (toolCall as { function?: { arguments?: string } }).function?.arguments || '{}';
        let args: ToolArgs = {};
        
        try {
          args = JSON.parse(argsStr);
        } catch (e) {
          console.log('[TOOL] Failed to parse args:', argsStr);
        }
        
        console.log(`[TOOL] Calling tool: ${toolName}`, args);
        
        const result = await handleToolCall(toolName, args, userId, sendProgress);
        toolResultsArray.push({ name: toolName, result, tool_call_id: toolCallId });
        console.log(`[TOOL] Result:`, result);
      }
      
      // Get final response from AI after tool execution
      if (toolCalls.length > 0) {
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            ...historyMessages,
            { role: 'user', content: userMessageContent },
            { role: 'assistant', content: responseText || null, tool_calls: toolCalls as any },
            ...toolResultsArray.map(({ name, result, tool_call_id }) => ({
              role: 'tool' as const,
              content: JSON.stringify(result),
              name: name,
              tool_call_id: tool_call_id,
            })),
          ],
        });
        
        const anyFailed = toolResultsArray.some(t => {
          const r = t.result as { success?: boolean; error?: string };
          return r.success === false;
        });
        
        if (anyFailed) {
          const errors = toolResultsArray
            .filter(t => {
              const r = t.result as { success?: boolean; error?: string };
              return r.success === false;
            })
            .map(t => {
              const r = t.result as { success?: boolean; error?: string };
              return `⚠️ ${t.name}: ${r.error}`;
            })
            .join('\n');
          responseText = `I encountered some issues:\n\n${errors}`;
        } else {
          const successes = toolResultsArray
            .filter(t => {
              const r = t.result as { success?: boolean; message?: string };
              return r.success === true;
            })
            .map(t => {
              const r = t.result as { success?: boolean; message?: string };
              return r.message || '✅ Done!';
            })
            .join('\n');
          responseText = successes || finalCompletion.choices[0]?.message?.content || responseText;
        }
      }
    }
    
    await saveMessage(supabase, userId, currentSessionId, 'assistant', responseText, 
      toolCalls.reduce((acc: Record<string, unknown>[], tc: any) => {
        const name = tc.function?.name;
        if (name) {
          acc.push({ name, args: tc.function?.arguments });
        }
        return acc;
      }, []),
      toolResultsArray.reduce((acc, t) => { acc[t.name] = t.result; return acc; }, {} as Record<string, unknown>)
    );
    
    sendSSE(JSON.stringify({ type: 'message', content: responseText }));
    sendSSE(JSON.stringify({ type: 'done' }));
    
    return res.end();
  } catch (error) {
    console.error('[CHAT] Error:', error);
    sendSSE(JSON.stringify({ type: 'error', error: 'An error occurred' }));
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function saveMessage(
  supabase: any,
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls: any = null,
  toolResults: any = null
) {
  try {
    // Ensure session exists
    await supabase
      .from('personal_agent_sessions')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        title: sessionId.startsWith('session_') ? 'New Chat' : sessionId,
        is_active: true,
      }, { onConflict: 'session_id' });
    
    // Save message
    await supabase
      .from('personal_agent_chats')
      .insert({
        user_id: userId,
        session_id: sessionId,
        role,
        content,
        tool_calls: toolCalls,
        tool_results: toolResults,
      });
  } catch (error) {
    console.error('[SAVE MESSAGE] Error:', error);
  }
}
