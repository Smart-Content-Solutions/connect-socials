import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wbhfbcqcefbnsjvqmjte.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const clerkSecretKey = process.env.VITE_CLERK_SECRET_KEY || 'sk_test_JjTqEC8zpcJlW2Y9wdTbMGevmLC81O6Ii7aw3YGWrL';

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

async function verifyClerkToken(authHeader: string): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, clerkSecretKey) as { user_id?: string; sub?: string };
    return decoded.user_id || decoded.sub || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
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
  
  switch (toolName) {
    case 'get_user_platforms': {
      sendProgress('Checking connected platforms...');
      const platforms = await getUserPlatforms(userId);
      return { platforms, message: `Connected platforms: ${platforms.join(', ') || 'None'}` };
    }
    
    case 'get_user_info': {
      sendProgress('Getting user info...');
      const info = await getUserInfo(userId);
      return { info, message: 'User information retrieved' };
    }
    
    case 'post_to_instagram': {
      sendProgress('Posting to Instagram...');
      const { image_url, caption } = args;
      
      const { data: credData } = await supabase
        .from('user_social_credentials')
        .select('credentials, account_id')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .single();
      
      if (!credData) {
        return { success: false, error: 'Instagram not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      const accountId = credData.account_id;
      
      try {
        const containerResponse = await fetch(
          `https://graph.facebook.com/v19.0/${accountId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url,
              caption,
              access_token: accessToken,
            }),
          }
        );
        
        const containerResult = await containerResponse.json();
        
        if (containerResult.error) {
          return { success: false, error: containerResult.error.message };
        }
        
        const publishResponse = await fetch(
          `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerResult.id,
              access_token: accessToken,
            }),
          }
        );
        
        const publishResult = await publishResponse.json();
        
        if (publishResult.error) {
          return { success: false, error: publishResult.error.message };
        }
        
        sendProgress('Posted to Instagram! ✅');
        return { success: true, media_id: containerResult.id };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_facebook': {
      sendProgress('Posting to Facebook...');
      const { message, image_url } = args;
      
      const { data: credData } = await supabase
        .from('user_social_credentials')
        .select('credentials, account_id')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .single();
      
      if (!credData) {
        return { success: false, error: 'Facebook not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      const accountId = credData.account_id;
      
      try {
        const postData: Record<string, unknown> = {
          message,
          access_token: accessToken,
        };
        
        if (image_url) {
          postData.url = image_url;
        }
        
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${accountId}/feed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData),
          }
        );
        
        const result = await response.json();
        
        if (result.error) {
          return { success: false, error: result.error.message };
        }
        
        sendProgress('Posted to Facebook! ✅');
        return { success: true, post_id: result.id };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_linkedin': {
      sendProgress('Posting to LinkedIn...');
      const { content, media_url } = args;
      
      const { data: credData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'linkedin')
        .single();
      
      if (!credData) {
        return { success: false, error: 'LinkedIn not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      
      try {
        const postPayload: Record<string, unknown> = {
          author: `urn:li:person:${userId}`,
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
        
        if (media_url) {
          (postPayload.specificContent as Record<string, unknown>)['com.linkedin.ugc.ShareContent'] = {
            shareCommentary: { text: content },
            shareMediaCategory: 'IMAGE',
            media: [{ status: 'READY', originalUrl: media_url }],
          };
        }
        
        const response = await fetch(
          'https://api.linkedin.com/v2/ugcPosts',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(postPayload),
          }
        );
        
        const result = await response.json();
        
        if (result.error) {
          return { success: false, error: result.message || 'LinkedIn API error' };
        }
        
        sendProgress('Posted to LinkedIn! ✅');
        return { success: true, post_id: result.id };
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to post';
        return { success: false, error: errMsg };
      }
    }
    
    case 'post_to_tiktok': {
      sendProgress('Posting to TikTok...');
      const { video_url, caption } = args;
      
      const { data: credData } = await supabase
        .from('user_social_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform', 'tiktok')
        .single();
      
      if (!credData) {
        return { success: false, error: 'TikTok not connected' };
      }
      
      const accessToken = credData.credentials?.access_token;
      
      try {
        const response = await fetch(
          `https://open.tiktokapis.com/v2/post/publish/video/init/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              source_info: {
                source: 'PULL_FROM_URL',
                video_url,
                caption,
              },
            }),
          }
        );
        
        const result = await response.json();
        
        if (result.error) {
          return { success: false, error: result.error.message };
        }
        
        sendProgress('Posted to TikTok! ✅');
        return { success: true, post_id: result.post_id };
      } catch (error: unknown) {
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
  
  const authHeader = req.headers.authorization;
  const userId = await verifyClerkToken(authHeader);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  
  const { message, session_id } = req.body;
  
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
    
    const systemMessage = `You are a helpful personal AI assistant for SmartContentSolutions.co.uk.
    You help users manage their social media, schedule posts, create content, and more.
    Be friendly, concise, and proactive.
    You can take actions on their behalf when they ask.
    
    Available actions:
    - Check which platforms they have connected
    - Post to Instagram, Facebook, LinkedIn, TikTok
    - Schedule posts for later
    - Create WordPress blog posts
    - Enhance captions with AI
    - View/cancel scheduled posts
    
    Always confirm before taking actions that modify their content.`;
    
    const historyMessages = chatHistory.map((msg: Record<string, unknown>) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    sendProgress('Thinking...');
    
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
    let responseText = responseMessage?.content || 'I\'m ready to help! What would you like to do?';
    const toolCalls = responseMessage?.tool_calls || [];
    
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
          ...Object.entries(toolResults).map(([toolName, result]) => ({
            role: 'tool' as const,
            content: JSON.stringify(result),
            name: toolName,
          })),
        ],
      });
      
      responseText = finalCompletion.choices[0]?.message?.content || responseText;
      
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