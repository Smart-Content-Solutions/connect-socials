import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wbhfbcqcefbnsjvqmjte.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const clerkSecretKey = process.env.VITE_CLERK_SECRET_KEY || 'sk_test_JjTqEC8zpcJlW2Y9wdTbMGevmLC81O6Ii7aw3YGWrL';

const n8nWebhookUrl = process.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.smartcontentsolutions.co.uk/webhook/';

async function verifyClerkToken(authHeader: string): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.decode(token) as { user_id?: string; sub?: string } | null;
    if (!decoded) {
      console.error('Token decode failed: token is invalid');
      return null;
    }
    
    const userId = decoded.user_id || decoded.sub;
    if (!userId) {
      console.error('Token does not contain user_id or sub');
      return null;
    }
    
    console.log('[TOKEN] Successfully extracted userId:', userId);
    return userId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

function generateTools() {
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
        name: 'post_to_instagram',
        description: 'Post content to Instagram',
        parameters: {
          type: 'object',
          properties: {
            image_url: { type: 'string', description: 'URL of the image to post' },
            caption: { type: 'string', description: 'Caption for the post' },
          },
          required: ['image_url', 'caption'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_facebook',
        description: 'Post content to Facebook',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message content' },
            image_url: { type: 'string', description: 'URL of the image to post (optional)' },
          },
          required: ['message'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_linkedin',
        description: 'Post content to LinkedIn',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Post content' },
            media_url: { type: 'string', description: 'URL of media to attach (optional)' },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_tiktok',
        description: 'Post content to TikTok',
        parameters: {
          type: 'object',
          properties: {
            video_url: { type: 'string', description: 'URL of the video' },
            caption: { type: 'string', description: 'Caption for the video' },
          },
          required: ['video_url', 'caption'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'schedule_post',
        description: 'Schedule a post for later',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Post content/caption' },
            scheduled_time: { type: 'string', description: 'ISO datetime to schedule' },
            platforms: { type: 'string', description: 'Comma-separated platforms (instagram,facebook,linkedin,tiktok)' },
            media_url: { type: 'string', description: 'URL of media to post' },
          },
          required: ['content', 'scheduled_time', 'platforms'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_scheduled_posts',
        description: 'Get the user\'s scheduled posts',
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
        name: 'cancel_scheduled_post',
        description: 'Cancel a scheduled post',
        parameters: {
          type: 'object',
          properties: {
            post_id: { type: 'string', description: 'ID of the scheduled post to cancel' },
          },
          required: ['post_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'wordpress_create_post',
        description: 'Create a WordPress blog post',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Blog post title' },
            content: { type: 'string', description: 'Blog post content (HTML or markdown)' },
            status: { type: 'string', description: 'Post status: draft or publish' },
          },
          required: ['title', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'enhance_caption',
        description: 'Use AI to enhance a social media caption with better hashtags and engagement',
        parameters: {
          type: 'object',
          properties: {
            caption: { type: 'string', description: 'Original caption to enhance' },
            platform: { type: 'string', description: 'Target platform: instagram, facebook, linkedin, tiktok' },
          },
          required: ['caption', 'platform'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_user_info',
        description: 'Get user profile information',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
  ];
}

async function getUserPlatforms(userId: string): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from('user_social_credentials')
    .select('platform')
    .eq('user_id', userId);
  
  if (error || !data) {
    return [];
  }
  
  return [...new Set(data.map(d => d.platform))];
}

async function getUserInfo(userId: string): Promise<Record<string, unknown>> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return userData || {};
}

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  sendProgress: (msg: string) => void
): Promise<Record<string, unknown>> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log(`[TOOL CALL] ${toolName} called with args:`, JSON.stringify(args, null, 2));
  console.log(`[USER ID] ${userId}`);
  
  switch (toolName) {
    case 'get_user_platforms': {
      sendProgress('Checking connected platforms...');
      const platforms = await getUserPlatforms(userId);
      console.log(`[GET USER PLATFORMS] Result:`, platforms);
      return { platforms, message: `Connected platforms: ${platforms.join(', ') || 'None'}` };
    }
    
    case 'get_user_info': {
      sendProgress('Getting user info...');
      const info = await getUserInfo(userId);
      console.log(`[GET USER INFO] Result:`, info);
      return { info, message: 'User information retrieved' };
    }
    
    case 'post_to_instagram': {
      console.log('[INSTAGRAM POST] Starting...');
      sendProgress('Posting to Instagram...');
      const { image_url, caption } = args;
      
      console.log('[INSTAGRAM POST] image_url:', image_url);
      console.log('[INSTAGRAM POST] caption:', caption);
      
      const { data: credData, error: credError } = await supabase
        .from('user_social_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .single();
      
      console.log('[INSTAGRAM POST] credData:', credData);
      console.log('[INSTAGRAM POST] credError:', credError);
      
      if (!credData || credError) {
        console.log('[INSTAGRAM POST] No credentials found for user');
        return { success: false, error: 'Instagram not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      console.log('[INSTAGRAM POST] Full credentials:', JSON.stringify(credData.credentials, null, 2));
      const accountId = credData.credentials?.instagram_user_id || credData.credentials?.pageId;
      console.log('[INSTAGRAM POST] accountId:', accountId);
      
      console.log('[INSTAGRAM POST] accountId:', accountId);
      console.log('[INSTAGRAM POST] accessToken exists:', !!accessToken);
      
      try {
        console.log('[INSTAGRAM POST] Calling n8n webhook...');
        const n8nResponse = await fetch(`${n8nWebhookUrl}social-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'instagram',
            image_url,
            caption,
            access_token: accessToken,
            account_id: accountId,
          }),
        });
        
        // If webhook not found (404), give helpful error
        if (n8nResponse.status === 404) {
          const errorText = await n8nResponse.text();
          console.log('[INSTAGRAM POST] n8n 404 Error:', errorText);
          return { 
            success: false, 
            error: 'Instagram posting webhook not found. Please activate the Instagram posting workflow in your n8n dashboard.' 
          };
        }
        
        const n8nResult = await n8nResponse.json();
        console.log('[INSTAGRAM POST] n8n Response:', n8nResult);
        
        if (n8nResponse.status >= 400 || n8nResult?.error) {
          console.log('[INSTAGRAM POST] n8n Error:', n8nResult?.error || n8nResult);
          return { success: false, error: n8nResult?.error || n8nResult?.message || 'Failed to post via n8n' };
        }
        
        sendProgress('Posted to Instagram! ✅');
        console.log('[INSTAGRAM POST] Success!');
        return { success: true, media_id: n8nResult?.id || 'sent' };
      } catch (error: unknown) {
        console.log('[INSTAGRAM POST] Catch error:', error);
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_facebook': {
      console.log('[FACEBOOK POST] Starting...');
      sendProgress('Posting to Facebook...');
      const { message, image_url } = args;
      
      console.log('[FACEBOOK POST] message:', message);
      console.log('[FACEBOOK POST] image_url:', image_url);
      
      const { data: credData, error: credError } = await supabase
        .from('user_social_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single();
      
      console.log('[FACEBOOK POST] credData:', credData);
      console.log('[FACEBOOK POST] credError:', credError);
      
      if (!credData || credError) {
        console.log('[FACEBOOK POST] No credentials found for user');
        return { success: false, error: 'Facebook not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      const accountId = credData.credentials?.facebook_user_id || credData.credentials?.pageId;
      console.log('[FACEBOOK POST] accountId:', accountId);
      
      console.log('[FACEBOOK POST] accountId:', accountId);
      console.log('[FACEBOOK POST] accessToken exists:', !!accessToken);
      
      try {
        const postData: Record<string, unknown> = {
          message,
          access_token: accessToken,
        };
        
        if (image_url) {
          postData.url = image_url;
        }
        
        console.log('[FACEBOOK POST] Calling n8n webhook...');
        const n8nResponse = await fetch(`${n8nWebhookUrl}social-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'facebook',
            message,
            image_url,
            access_token: accessToken,
            account_id: accountId,
          }),
        });
        
        // If webhook not found (404), give helpful error
        if (n8nResponse.status === 404) {
          const errorText = await n8nResponse.text();
          console.log('[FACEBOOK POST] n8n 404 Error:', errorText);
          return { 
            success: false, 
            error: 'Facebook posting webhook not found. Please activate the Facebook posting workflow in your n8n dashboard.' 
          };
        }
        
        const n8nResult = await n8nResponse.json();
        console.log('[FACEBOOK POST] n8n Response:', n8nResult);
        
        if (n8nResponse.status >= 400 || n8nResult?.error) {
          console.log('[FACEBOOK POST] n8n Error:', n8nResult?.error || n8nResult);
          return { success: false, error: n8nResult?.error || n8nResult?.message || 'Failed to post via n8n' };
        }
        
        sendProgress('Posted to Facebook! ✅');
        console.log('[FACEBOOK POST] Success!');
        return { success: true, post_id: n8nResult?.id || 'sent' };
      } catch (error: unknown) {
        console.log('[FACEBOOK POST] Catch error:', error);
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_linkedin': {
      console.log('[LINKEDIN POST] Starting...');
      sendProgress('Posting to LinkedIn...');
      const { content, media_url } = args;
      
      console.log('[LINKEDIN POST] content:', content);
      console.log('[LINKEDIN POST] media_url:', media_url);
      
      const { data: credData, error: credError } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'linkedin')
        .single();
      
      console.log('[LINKEDIN POST] credData:', credData);
      console.log('[LINKEDIN POST] credError:', credError);
      
      if (!credData) {
        console.log('[LINKEDIN POST] No credentials found for user');
        return { success: false, error: 'LinkedIn not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      const linkedinUserId = credData.credentials?.linkedin_user_id;
      console.log('[LINKEDIN POST] accessToken exists:', !!accessToken);
      console.log('[LINKEDIN POST] linkedin_user_id from credentials:', linkedinUserId);
      
      if (!linkedinUserId) {
        console.log('[LINKEDIN POST] No linkedin_user_id in credentials');
        return { success: false, error: 'LinkedIn account ID not found. Please reconnect LinkedIn.' };
      }
      
      const authorUrn = `urn:li:person:${linkedinUserId}`;
      console.log('[LINKEDIN POST] Using author URN:', authorUrn);
      
      try {
        const postPayload: Record<string, unknown> = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: media_url ? 'IMAGE' : 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        };
        
        console.log('[LINKEDIN POST] Full payload:', JSON.stringify(postPayload));
        
        if (media_url) {
          (postPayload.specificContent as Record<string, unknown>)['com.linkedin.ugc.ShareContent'] = {
            shareCommentary: { text: content },
            shareMediaCategory: 'IMAGE',
            media: [{ status: 'READY', originalUrl: media_url }],
          };
        }
        
        console.log('[LINKEDIN POST] Calling n8n webhook...');
        const n8nResponse = await fetch(`${n8nWebhookUrl}social-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'linkedin',
            content,
            media_url,
            access_token: accessToken,
            author_urn: authorUrn,
          }),
        });
        
        // If webhook not found (404), give helpful error
        if (n8nResponse.status === 404) {
          const errorText = await n8nResponse.text();
          console.log('[LINKEDIN POST] n8n 404 Error:', errorText);
          return { 
            success: false, 
            error: 'LinkedIn posting webhook not found. Please activate the LinkedIn posting workflow in your n8n dashboard.' 
          };
        }
        
        const n8nResult = await n8nResponse.json();
        console.log('[LINKEDIN POST] n8n Response:', n8nResult);
        
        if (n8nResponse.status >= 400 || n8nResult?.error) {
          console.log('[LINKEDIN POST] n8n Error:', n8nResult?.error || n8nResult);
          return { success: false, error: n8nResult?.error || n8nResult?.message || 'Failed to post via n8n' };
        }
        
        sendProgress('Posted to LinkedIn! ✅');
        console.log('[LINKEDIN POST] Success!');
        return { success: true, post_id: n8nResult?.id || 'sent' };
      } catch (error: unknown) {
        console.log('[LINKEDIN POST] Catch error:', error);
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_tiktok': {
      console.log('[TIKTOK POST] Starting...');
      sendProgress('Posting to TikTok...');
      const { video_url, caption } = args;
      
      console.log('[TIKTOK POST] video_url:', video_url);
      console.log('[TIKTOK POST] caption:', caption);
      
      const { data: credData, error: credError } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .single();
      
      console.log('[TIKTOK POST] credData:', credData);
      console.log('[TIKTOK POST] credError:', credError);
      
      if (!credData) {
        console.log('[TIKTOK POST] No credentials found for user');
        return { success: false, error: 'TikTok not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      console.log('[TIKTOK POST] accessToken exists:', !!accessToken);
      
      try {
        console.log('[TIKTOK POST] Calling n8n webhook...');
        const n8nResponse = await fetch(`${n8nWebhookUrl}social-media-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url,
            caption,
            access_token: accessToken,
          }),
        });
        
        const n8nResult = await n8nResponse.json();
        console.log('[TIKTOK POST] n8n Response:', n8nResult);
        
        if (n8nResponse.status >= 400 || n8nResult?.error) {
          console.log('[TIKTOK POST] n8n Error:', n8nResult?.error || n8nResult);
          return { success: false, error: n8nResult?.error || n8nResult?.message || 'Failed to post via n8n' };
        }
        
        sendProgress('Posted to TikTok! ✅');
        console.log('[TIKTOK POST] Success!');
        return { success: true, post_id: n8nResult?.post_id || 'sent' };
      } catch (error: unknown) {
        console.log('[TIKTOK POST] Catch error:', error);
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'schedule_post': {
      sendProgress('Scheduling post...');
      const { content, scheduled_time, platforms, media_url } = args;
      
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: userId,
          content,
          scheduled_time: new Date(scheduled_time as string).toISOString(),
          platforms: (platforms as string).split(',').map(p => p.trim()),
          media_url: media_url as string || null,
          status: 'scheduled',
        })
        .select()
        .single();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      sendProgress(`Post scheduled for ${new Date(scheduled_time as string).toLocaleString()}! ✅`);
      return { success: true, post: data };
    }
    
    case 'get_scheduled_posts': {
      sendProgress('Fetching scheduled posts...');
      
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'scheduled')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { posts: data || [] };
    }
    
    case 'cancel_scheduled_post': {
      sendProgress('Cancelling scheduled post...');
      const { post_id } = args;
      
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ status: 'cancelled' })
        .eq('id', post_id)
        .eq('user_id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      sendProgress('Post cancelled! ✅');
      return { success: true };
    }
    
    case 'wordpress_create_post': {
      sendProgress('Creating WordPress post...');
      const { title, content, status } = args;
      
      const { data: wpData } = await supabase
        .from('user_wordpress_settings')
        .select('site_url, username, access_token')
        .eq('user_id', userId)
        .single();
      
      if (!wpData) {
        return { success: false, error: 'WordPress not connected' };
      }
      
      try {
        const response = await fetch(`${wpData.site_url}/wp-json/wp/v2/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${wpData.username}:${wpData.access_token}`).toString('base64')}`,
          },
          body: JSON.stringify({
            title,
            content,
            status: status === 'publish' ? 'publish' : 'draft',
          }),
        });
        
        const result = await response.json();
        
        if (result.code) {
          return { success: false, error: result.message };
        }
        
        sendProgress('WordPress post created! ✅');
        return { success: true, post_id: result.id, permalink: result.link };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to create post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'enhance_caption': {
      sendProgress('Enhancing caption with AI...');
      const { caption, platform } = args;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media expert. Enhance the following ${platform} caption to increase engagement. 
            Add relevant hashtags, emojis where appropriate, and make it more compelling. 
            Keep the original meaning but improve readability and engagement.`,
          },
          {
            role: 'user',
            content: caption as string,
          },
        ],
      });
      
      const enhanced = completion.choices[0]?.message?.content || caption;
      sendProgress('Caption enhanced! ✨');
      return { original: caption, enhanced, platform };
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function getChatHistory(supabase: ReturnType<typeof createClient>, userId: string, sessionId: string, limit = 20) {
  const { data, error } = await supabase
    .from('personal_agent_chats')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
  
  return data || [];
}

async function saveMessage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  toolCalls?: Record<string, unknown>,
  toolResults?: Record<string, unknown>
) {
  const { error } = await supabase
    .from('personal_agent_chats')
    .insert({
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      tool_calls: toolCalls || null,
      tool_results: toolResults || null,
    });
  
  if (error) {
    console.error('Error saving message:', error);
  }
}

async function getOrCreateSession(supabase: ReturnType<typeof createClient>, userId: string, sessionId?: string) {
  if (sessionId) {
    const { data: existing } = await supabase
      .from('personal_agent_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      return existing;
    }
  }
  
  const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from('personal_agent_sessions')
    .insert({
      user_id: userId,
      session_id: newSessionId,
      title: 'New Chat',
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating session:', error);
    return { session_id: newSessionId };
  }
  
  return data || { session_id: newSessionId };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
  
  const { message, session_id } = req.body;
  console.log('[CHAT] Message:', message);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const session = await getOrCreateSession(supabase, userId, session_id);
  const currentSessionId = session.session_id;
  
  const chatHistory = await getChatHistory(supabase, userId, currentSessionId);
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
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
    
    const systemMessage = `You are an AI agent for SmartContentSolutions. You MUST use tools to perform actions.
    
    STRICT RULES:
    1. If user asks about connected platforms or what accounts they have, you MUST call get_user_platforms tool
    2. If user asks to post to social media, you MUST call the appropriate tool - not just talk about it
    3. NEVER say "I've posted" or "Done" unless the tool actually ran and returned success
    4. If the tool returns an error (like "not connected"), you must tell the user the truth
    
    EXACT TOOL CALL FORMAT:
    When user asks "what platforms do I have connected" -> call get_user_platforms with {} (empty arguments)
    When user says "post hello to linkedin" -> call post_to_linkedin with {"content": "hello"}
    
    Available tools:
    - get_user_platforms() - use when user asks about connected platforms
    - post_to_linkedin(content: string) 
    - post_to_facebook(message: string, image_url?: string)
    - post_to_instagram(image_url: string, caption: string)`;
    
    const historyMessages = chatHistory.map((msg: Record<string, unknown>) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    sendProgress('Thinking...');
    
    console.log('[CHAT] Sending request to OpenAI with message:', message);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      tools: generateTools(),
    });
    
    const responseMessage = completion.choices[0]?.message;
    console.log('[CHAT] AI Response:', JSON.stringify(responseMessage));
    
    let responseText = responseMessage?.content || 'I\'m ready to help! What would you like to do?';
    const toolCalls = responseMessage?.tool_calls || [];
    console.log('[CHAT] Tool calls:', toolCalls.length);
    
    if (toolCalls.length > 0) {
      sendSSE(JSON.stringify({ type: 'tool_calls', tools: toolCalls.map((tc: Record<string, unknown>) => (tc as { function: { name: string } }).function.name) }));
      
      const toolResults: Record<string, unknown> = {};
      
      for (const toolCall of toolCalls) {
        const { name, arguments: argsStr } = (toolCall as { function: { name: string; arguments: string } }).function;
        const args = JSON.parse(argsStr);
        
        sendSSE(JSON.stringify({ type: 'tool_executing', tool: name }));
        
        const result = await executeToolCall(name, args, userId, sendProgress);
        toolResults[name] = result;
        
        if (result.success === false) {
          responseText += `\n\n⚠️ ${name}: ${result.error}`;
        }
      }
      
      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          ...historyMessages,
          { role: 'user', content: message },
          { role: 'assistant', content: responseText, tool_calls: toolCalls },
          ...Object.entries(toolResults).map(([toolName, result], index) => ({
            role: 'tool' as const,
            content: JSON.stringify(result),
            name: toolName,
            tool_call_id: (toolCalls[index] as { id?: string })?.id || `call_${index}`,
          })),
        ],
      });
      
      const toolResultsTyped = toolResults as Record<string, { success?: boolean; error?: string; post_id?: string }>;
      const anyToolFailed = Object.values(toolResultsTyped).some(r => r.success === false);
      if (anyToolFailed) {
        const errors = Object.entries(toolResultsTyped)
          .filter(([_, r]) => r.success === false)
          .map(([name, r]) => `⚠️ ${name}: ${r.error}`)
          .join('\n');
        responseText = `I encountered some issues:\n\n${errors}\n\nPlease make sure your social media accounts are connected in your dashboard settings.`;
      } else {
        const successMessages = Object.entries(toolResultsTyped)
          .filter(([_, r]) => r.success === true)
          .map(([name, r]) => {
            if (name === 'post_to_linkedin') return '✅ Successfully posted to your LinkedIn!';
            if (name === 'post_to_facebook') return '✅ Successfully posted to your Facebook!';
            if (name === 'post_to_instagram') return '✅ Successfully posted to your Instagram!';
            if (name === 'post_to_tiktok') return '✅ Successfully posted to your TikTok!';
            return `✅ ${name} completed successfully`;
          });
        responseText = successMessages.join('\n');
      }
      
      await saveMessage(supabase, userId, currentSessionId, 'assistant', responseText, 
        toolCalls.reduce((acc: Record<string, unknown>, tc: Record<string, unknown>) => {
          const name = (tc as { function: { name: string } }).function.name;
          acc[name] = tc;
          return acc;
        }, {}),
        toolResults
      );
    } else {
      await saveMessage(supabase, userId, currentSessionId, 'assistant', responseText);
    }
    
    sendSSE(JSON.stringify({ type: 'complete', response: responseText, session_id: currentSessionId }));
    
  } catch (error) {
    console.error('Chat error:', error);
    sendSSE(JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'An error occurred' }));
  }
  
  res.end();
}