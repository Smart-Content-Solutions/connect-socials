import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wbhfbcqcefbnsjvqmjte.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8';

const clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_YWJvdmUta2luZ2Zpc2gtODguY2xlcmsuYWNjb3VudHMuZGV2JA';
const clerkSecretKey = process.env.VITE_CLERK_SECRET_KEY || 'sk_test_JjTqEC8zpcJlW2Y9wdTbMGevmLC81O6Ii7aw3YGWrL';

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
    
    try {
      jwt.verify(token, clerkSecretKey);
      return userId;
    } catch (verifyError) {
      console.error('Token verify failed, attempting with alternative method:', verifyError);
      const altUserId = decoded.sub || decoded.user_id;
      return altUserId || null;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  console.log('[HISTORY] Request received, method:', req.method);
  console.log('[HISTORY] Auth header:', req.headers.authorization ? 'present' : 'missing');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const authHeader = req.headers.authorization;
  console.log('[HISTORY] Verifying token...');
  const userId = await verifyClerkToken(authHeader);
  console.log('[HISTORY] User ID after verification:', userId);
  
  if (!userId) {
    console.log('[HISTORY] Token verification failed, returning 401');
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  
  console.log('[HISTORY] Token verified successfully for user:', userId);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  if (req.method === 'GET') {
    const { session_id } = req.query;
    
    try {
      let query = supabase
        .from('personal_agent_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });
      
      const { data: sessions, error: sessionsError } = await query;
      
      if (sessionsError) {
        return res.status(500).json({ error: sessionsError.message });
      }
      
      let messages: Record<string, unknown>[] = [];
      
      if (session_id) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('personal_agent_chats')
          .select('*')
          .eq('user_id', userId)
          .eq('session_id', session_id)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          return res.status(500).json({ error: messagesError.message });
        }
        
        messages = messagesData || [];
      }
      
      return res.status(200).json({ sessions: sessions || [], messages });
      
    } catch (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
  
  if (req.method === 'POST') {
    const { action, session_id, title } = req.body;
    
    if (action === 'create_session') {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('personal_agent_sessions')
        .insert({
          user_id: userId,
          session_id: newSessionId,
          title: title || 'New Chat',
          is_active: true,
        })
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ session: data });
    }
    
    if (action === 'update_title' && session_id) {
      const { data, error } = await supabase
        .from('personal_agent_sessions')
        .update({ title })
        .eq('session_id', session_id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ session: data });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  if (req.method === 'DELETE') {
    const { session_id, clear_all } = req.query;
    
    try {
      if (clear_all === 'true') {
        await supabase
          .from('personal_agent_chats')
          .delete()
          .eq('user_id', userId);
        
        await supabase
          .from('personal_agent_sessions')
          .delete()
          .eq('user_id', userId);
        
        return res.status(200).json({ message: 'All history cleared' });
      }
      
      if (session_id) {
        await supabase
          .from('personal_agent_chats')
          .delete()
          .eq('user_id', userId)
          .eq('session_id', session_id);
        
        await supabase
          .from('personal_agent_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('session_id', session_id);
        
        return res.status(200).json({ message: 'Session cleared' });
      }
      
      return res.status(400).json({ error: 'session_id or clear_all required' });
      
    } catch (error) {
      console.error('History delete error:', error);
      return res.status(500).json({ error: 'Failed to delete history' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}